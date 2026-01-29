"use client";
import { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "@/lib/supabase";
import { FaSave, FaTrash, FaDumbbell, FaTrophy, FaCalendarAlt } from "react-icons/fa";
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

  // 주간 시작일(월요일) 구하는 함수
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

  // 주간 집계 및 기간 필터링 로직
  const chartData = useMemo(() => {
    const weeklyMap: any = {};
    
    // 1. 기간 필터링 먼저 수행
    let filteredLogs = [...logs];
    if (timeRange !== "ALL") {
      const cutoff = new Date();
      if (timeRange === "3M") cutoff.setMonth(cutoff.getMonth() - 3);
      else if (timeRange === "6M") cutoff.setMonth(cutoff.getMonth() - 6);
      else if (timeRange === "1Y") cutoff.setFullYear(cutoff.getFullYear() - 1);
      filteredLogs = filteredLogs.filter(l => new Date(l.date) >= cutoff);
    }

    // 2. 주간 단위로 그룹화 (해당 주의 최고 기록 선택)
    filteredLogs.forEach(log => {
      const weekStart = getStartOfWeek(log.date);
      if (!weeklyMap[weekStart]) {
        weeklyMap[weekStart] = { date: weekStart, Squat: 0, Bench: 0, Deadlift: 0, OHP: 0 };
      }
      if (log.onerm > weeklyMap[weekStart][log.exercise]) {
        weeklyMap[weekStart][log.exercise] = log.onerm;
      }
    });

    // 3. 차트 데이터 형식으로 변환 및 포인트 계산
    return Object.values(weeklyMap).map((d: any) => {
      const total = (d.Squat || 0) + (d.Bench || 0) + (d.Deadlift || 0);
      const pts = calculatePoints(total, userProfile.weight, userProfile.gender);
      return { 
        ...d, 
        "스쿼트": d.Squat || null, 
        "벤치프레스": d.Bench || null, 
        "데드리프트": d.Deadlift || null, 
        "오버헤드프레스": d.OHP || null, 
        ...pts 
      };
    }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, timeRange, userProfile]);

  const handleSave = async () => {
    if (!user || !form.weight || !form.reps) return alert("데이터 입력하셈");
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
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("삭제할 거임?")) return;
    const { error } = await supabase.from('growth_logs').delete().eq('id', id);
    if (!error) setLogs(logs.filter(l => l.id !== id));
  };

  if (!isLoaded) return <div className="bg-zinc-950 min-h-screen flex items-center justify-center font-black">GROWTH LOADING...</div>;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col xl:flex-row h-screen overflow-hidden">
        
        <div className="flex-1 min-w-0 p-6 overflow-y-auto space-y-8 custom-scrollbar">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black italic text-lime-500 uppercase tracking-tighter">Growth History</h1>
            <div className="flex bg-zinc-900 p-1 rounded-xl gap-1 text-[10px] font-black">
              {["3M", "6M", "1Y", "ALL"].map(r => (
                <button key={r} onClick={() => setTimeRange(r)} className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === r ? "bg-lime-500 text-black" : "text-zinc-500 hover:text-zinc-300"}`}>{r}</button>
              ))}
            </div>
          </div>

          {/* 주간 1RM 차트 */}
          <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
            <h2 className="text-xs font-black text-zinc-500 uppercase flex items-center gap-2 mb-6"><FaDumbbell className="text-lime-500"/> Weekly Best 1RM Trend (kg)</h2>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{fill: '#71717a', fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fill: '#71717a', fontSize: 10}} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{backgroundColor: '#18181b', border: 'none', borderRadius: '12px'}} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="스쿼트" stroke="#3b82f6" strokeWidth={3} dot={{r:3}} connectNulls />
                  <Line type="monotone" dataKey="벤치프레스" stroke="#ef4444" strokeWidth={3} dot={{r:3}} connectNulls />
                  <Line type="monotone" dataKey="데드리프트" stroke="#eab308" strokeWidth={3} dot={{r:3}} connectNulls />
                  <Line type="monotone" dataKey="오버헤드프레스" stroke="#a855f7" strokeWidth={3} dot={{r:3}} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 주간 포인트 차트 */}
          <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black text-zinc-500 uppercase flex items-center gap-2"><FaTrophy className="text-purple-500"/> Weekly PL Points</h2>
              <div className="flex bg-black/40 p-1 rounded-xl gap-1 text-[10px] font-black">
                {["dots", "ipf", "wilks"].map(p => (
                  <button key={p} onClick={() => setActivePoint(p)} className={`px-4 py-2 rounded-lg uppercase transition-all ${activePoint === p ? "bg-purple-500 text-white" : "text-zinc-600"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{fill: '#71717a', fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fill: '#71717a', fontSize: 10}} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey={activePoint} stroke="#a855f7" strokeWidth={4} dot={{r:5, fill:'#a855f7', strokeWidth:0}} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 오른쪽 입력 섹션 (유지) */}
        <div className="w-full xl:w-[400px] flex-shrink-0 bg-zinc-900/50 border-l border-zinc-800 p-8 flex flex-col h-full overflow-hidden">
          <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 mb-8 shadow-xl">
            <h3 className="font-black mb-6 flex items-center gap-2 text-sm uppercase tracking-wider"><FaSave className="text-lime-500"/> New Entry</h3>
            <div className="space-y-4">
              <div className="relative">
                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs" />
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl p-3 pl-10 text-xs font-bold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["Squat", "Bench", "Deadlift", "OHP"].map(ex => (
                  <button key={ex} onClick={() => setForm({...form, exercise: ex})} className={`py-3 rounded-xl font-black text-[10px] uppercase transition-all ${form.exercise === ex ? 'bg-white text-black' : 'bg-black text-zinc-500 border border-zinc-800'}`}>{EX_KO[ex]}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input placeholder="Kg" type="number" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} className="w-1/2 p-3 bg-black border border-zinc-800 rounded-xl font-black text-center outline-none" />
                <input placeholder="Reps" type="number" value={form.reps} onChange={e => setForm({...form, reps: e.target.value})} className="w-1/2 p-3 bg-black border border-zinc-800 rounded-xl font-black text-center outline-none" />
              </div>
              <button onClick={handleSave} className="w-full py-4 bg-lime-500 text-black font-black rounded-2xl shadow-lg active:scale-95 transition-all text-sm">기록 저장 🔥</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">History Logs</p>
            {[...logs].reverse().map(log => (
              <div key={log.id} className="bg-black/40 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center group hover:border-zinc-700 transition-all">
                <div>
                  <p className="text-[9px] font-black text-lime-500 mb-1">{log.date}</p>
                  <p className="text-xs font-black">{EX_KO[log.exercise]} {log.weight}kg x {log.reps}</p>
                  <p className="text-[10px] text-zinc-600 font-bold mt-1 tracking-tighter">1RM: {log.onerm}kg</p>
                </div>
                <button onClick={() => handleDelete(log.id)} className="p-3 text-zinc-800 hover:text-red-500 transition-colors"><FaTrash size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}