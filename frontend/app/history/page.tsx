"use client";
import { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "@/lib/supabase";
import { FaSave, FaTrash, FaDumbbell, FaTrophy, FaCalendarAlt, FaChartLine } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState({ weight: 80, gender: "male" });
  const [timeRange, setTimeRange] = useState("ALL");
  const [activePoint, setActivePoint] = useState("dots"); 
  const [isLoaded, setIsLoaded] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    exercise: "Squat",
    weight: "",
    reps: ""
  });

  const EX_KO: any = { Squat: "스쿼트", Bench: "벤치프레스", Deadlift: "데드리프트", OHP: "오버헤드프레스" };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('weight, gender').eq('id', session.user.id).single();
        if (profile) setUserProfile({ weight: profile.weight || 80, gender: profile.gender || "male" });
        
        const { data: history } = await supabase.from('growth_logs').select('*').eq('user_id', session.user.id).order('date', { ascending: true });
        if (history) setLogs(history);
      }
      setIsLoaded(true);
    };
    init();
  }, []);

  const getStartOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const calculatePoints = (total: number, bw: number, gender: string) => {
    const isMale = gender === "male";
    if (total <= 0 || bw <= 0) return { dots: 0, ipf: 0, wilks: 0 };
    
    const c = isMale ? [-0.000001093, 0.0007391293, -0.191875104, 24.0900756, -307.75076] : [-0.0000010706, 0.0005158568, -0.1126655495, 13.6175032, -57.96288];
    const dots = (total * 500) / (c[0]*Math.pow(bw,4) + c[1]*Math.pow(bw,3) + c[2]*Math.pow(bw,2) + c[3]*bw + c[4]);
    
    const ipf = 100 * total / ((isMale ? 1199.72839 : 610.32796) - (isMale ? 1025.18162 : 1045.59282) * Math.exp(-(isMale ? 0.00921 : 0.03048) * bw));
    
    const wC = isMale ? [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863E-06, -1.291E-08] : [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 4.731582E-05, -9.054E-08];
    const wilks = total * (500 / (wC[0] + wC[1]*bw + wC[2]*Math.pow(bw,2) + wC[3]*Math.pow(bw,3) + wC[4]*Math.pow(bw,4) + wC[5]*Math.pow(bw,5)));
    
    return { dots: Math.round(dots*100)/100, ipf: Math.round(ipf*100)/100, wilks: Math.round(wilks*100)/100 };
  };

  const chartData = useMemo(() => {
    const weeklyMap: any = {};
    let filteredLogs = [...logs];
    if (timeRange !== "ALL") {
      const cutoff = new Date();
      if (timeRange === "3M") cutoff.setMonth(cutoff.getMonth() - 3);
      else if (timeRange === "6M") cutoff.setMonth(cutoff.getMonth() - 6);
      else if (timeRange === "1Y") cutoff.setFullYear(cutoff.getFullYear() - 1);
      filteredLogs = filteredLogs.filter(l => new Date(l.date) >= cutoff);
    }
    filteredLogs.forEach(log => {
      const weekStart = getStartOfWeek(log.date);
      if (!weeklyMap[weekStart]) {
        weeklyMap[weekStart] = { date: weekStart, Squat: 0, Bench: 0, Deadlift: 0, OHP: 0 };
      }
      if (log.onerm > weeklyMap[weekStart][log.exercise]) {
        weeklyMap[weekStart][log.exercise] = log.onerm;
      }
    });
    return Object.values(weeklyMap).map((d: any) => {
      const total = (d.Squat || 0) + (d.Bench || 0) + (d.Deadlift || 0);
      const pts = calculatePoints(total, userProfile.weight, userProfile.gender);
      return { ...d, "스쿼트": d.Squat || null, "벤치프레스": d.Bench || null, "데드리프트": d.Deadlift || null, "오버헤드프레스": d.OHP || null, ...pts };
    }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, timeRange, userProfile]);

  const handleSave = async () => {
    if (!user || !form.weight || !form.reps) return alert("중량과 횟수를 입력해주세요.");
    const weight = Number(form.weight);
    const reps = Number(form.reps);
    const onerm = Math.round(weight * (1 + reps / 30));

    const { error } = await supabase.from('growth_logs').insert([{
      user_id: user.id, date: form.date, exercise: form.exercise, weight, reps, onerm
    }]);

    if (!error) {
      const { data } = await supabase.from('growth_logs').select('*').eq('user_id', user.id).order('date', { ascending: true });
      if (data) setLogs(data);
      setForm({ ...form, weight: "", reps: "" });
    } else {
      alert("저장 실패");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("이 기록을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('growth_logs').delete().eq('id', id);
    if (!error) setLogs(logs.filter(l => l.id !== id));
  };

  if (!isLoaded) return <div className="bg-zinc-950 min-h-screen flex items-center justify-center font-black animate-pulse text-lime-500">GYM RAT LOADING...</div>;

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col xl:flex-row h-screen overflow-y-auto xl:overflow-hidden custom-scrollbar">
        
        <div className="flex-1 min-w-0 p-4 md:p-8 space-y-8 xl:overflow-y-auto custom-scrollbar">
          {/* [수정 포인트] mt-14 추가하여 모바일에서 버튼 공간 확보 */}
          <div className="mt-14 md:mt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-black italic text-lime-500 uppercase tracking-tighter">Growth History</h1>
            <div className="flex bg-zinc-900 p-1 rounded-xl gap-1 text-[10px] font-black shrink-0">
              {["3M", "6M", "1Y", "ALL"].map(r => (
                <button key={r} onClick={() => setTimeRange(r)} className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === r ? "bg-lime-500 text-black" : "text-zinc-500 hover:text-zinc-300"}`}>{r}</button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-800 shadow-xl">
            <h2 className="text-xs font-black text-zinc-500 uppercase flex items-center gap-2 mb-6"><FaDumbbell className="text-lime-500"/> Weekly Best 1RM (kg)</h2>
            <div className="h-[350px] w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{fill: '#71717a', fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fill: '#71717a', fontSize: 10}} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontWeight: 'bold'}} />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '10px'}}/>
                  <Line type="monotone" dataKey="스쿼트" stroke="#3b82f6" strokeWidth={3} dot={{r:3, strokeWidth:0}} activeDot={{r:6}} connectNulls />
                  <Line type="monotone" dataKey="벤치프레스" stroke="#ef4444" strokeWidth={3} dot={{r:3, strokeWidth:0}} activeDot={{r:6}} connectNulls />
                  <Line type="monotone" dataKey="데드리프트" stroke="#eab308" strokeWidth={3} dot={{r:3, strokeWidth:0}} activeDot={{r:6}} connectNulls />
                  <Line type="monotone" dataKey="오버헤드프레스" stroke="#a855f7" strokeWidth={3} dot={{r:3, strokeWidth:0}} activeDot={{r:6}} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-800 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xs font-black text-zinc-500 uppercase flex items-center gap-2"><FaTrophy className="text-purple-500"/> Powerlifting Points</h2>
              <div className="flex bg-black/40 p-1 rounded-xl gap-1 text-[10px] font-black">
                {["dots", "ipf", "wilks"].map(p => (
                  <button key={p} onClick={() => setActivePoint(p)} className={`px-4 py-2 rounded-lg uppercase transition-all ${activePoint === p ? "bg-purple-500 text-white" : "text-zinc-600"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="h-[300px] w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{fill: '#71717a', fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fill: '#71717a', fontSize: 10}} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontWeight: 'bold'}} />
                  <Line type="monotone" dataKey={activePoint} stroke="#a855f7" strokeWidth={4} dot={{r:4, fill:'#a855f7', strokeWidth:0}} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[400px] flex-shrink-0 bg-zinc-900/50 border-t xl:border-t-0 xl:border-l border-zinc-800 p-6 md:p-8 flex flex-col gap-8 xl:h-full xl:overflow-y-auto custom-scrollbar">
          
          <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 shadow-xl">
            <h3 className="font-black mb-6 flex items-center gap-2 text-sm uppercase tracking-wider text-white"><FaSave className="text-lime-500"/> Record PR</h3>
            <div className="space-y-4">
              <div className="relative min-w-0">
                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs" />
                <input 
                  type="date" 
                  value={form.date} 
                  onChange={e => setForm({...form, date: e.target.value})} 
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 pl-10 text-xs font-bold outline-none text-white focus:border-lime-500 transition-colors min-w-0" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {["Squat", "Bench", "Deadlift", "OHP"].map(ex => (
                  <button key={ex} onClick={() => setForm({...form, exercise: ex})} className={`py-3 rounded-xl font-black text-[10px] uppercase transition-all ${form.exercise === ex ? 'bg-white text-black' : 'bg-black text-zinc-500 border border-zinc-800'}`}>{EX_KO[ex]}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative w-1/2">
                   <input placeholder="0" type="number" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} className="w-full p-3 bg-black border border-zinc-800 rounded-xl font-black text-center outline-none text-white focus:border-lime-500 transition-colors" />
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600">KG</span>
                </div>
                <div className="relative w-1/2">
                   <input placeholder="0" type="number" value={form.reps} onChange={e => setForm({...form, reps: e.target.value})} className="w-full p-3 bg-black border border-zinc-800 rounded-xl font-black text-center outline-none text-white focus:border-lime-500 transition-colors" />
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600">REPS</span>
                </div>
              </div>
              <button onClick={handleSave} className="w-full py-4 bg-lime-500 text-black font-black rounded-2xl shadow-lg shadow-lime-500/20 active:scale-95 transition-all text-sm hover:bg-lime-400">LOG IT 🔥</button>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Recent Logs</p>
            {[...logs].reverse().map(log => (
              <div key={log.id} className="bg-black/40 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center group hover:border-zinc-700 transition-all">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${log.exercise === 'Squat' ? 'bg-blue-500' : log.exercise === 'Bench' ? 'bg-red-500' : log.exercise === 'Deadlift' ? 'bg-yellow-500' : 'bg-purple-500'}`}></span>
                    <p className="text-[9px] font-black text-zinc-400 uppercase">{log.date}</p>
                  </div>
                  <p className="text-sm font-black text-white">{EX_KO[log.exercise]} <span className="text-lime-500">{log.weight}kg</span> x {log.reps}</p>
                  <p className="text-[10px] text-zinc-600 font-bold mt-1 tracking-tighter">ESTIMATED 1RM: {log.onerm}kg</p>
                </div>
                <button onClick={() => handleDelete(log.id)} className="p-3 text-zinc-800 hover:text-red-500 transition-colors bg-zinc-900/50 rounded-xl opacity-0 group-hover:opacity-100"><FaTrash size={12}/></button>
              </div>
            ))}
            {logs.length === 0 && (
                <div className="text-center py-10 text-zinc-700 text-xs italic font-bold">
                    <FaChartLine className="mx-auto mb-2 text-2xl opacity-20"/>
                    아직 기록이 없습니다.<br/>첫 PR을 등록해보세요!
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}