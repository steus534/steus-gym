"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import { supabase } from "@/lib/supabase";
import { FaBolt, FaSun, FaMoon, FaMars, FaVenus, FaDrumstickBite, FaExchangeAlt, FaUtensils, FaSlidersH, FaSave } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { useRouter } from "next/navigation"; // 페이지 이동용

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [dark, setDark] = useState(true);
  const [unit, setUnit] = useState("metric");
  const [gender, setGender] = useState("male");
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  
  const initialForm = { 
    height: 180, weight: 80, age: 23, 
    squat: 100, bench: 80, deadlift: 120, 
    split: "3", goal: "bulk", activity: "student" 
  };
  const [form, setForm] = useState(initialForm);
  const [protMult, setProtMult] = useState(1.8);
  const [carbRatio, setCarbRatio] = useState(50);
  const [result, setResult] = useState<any>(null);
  const [converter, setConverter] = useState({ kg: "", lbs: "" });

  // [계산 로직] 입력값이 바뀔 때마다 실시간으로 작동 (useEffect에서 호출됨)
  const getCalculatedData = useCallback((targetKcal: number) => {
    const w = Number(form.weight) || 0;
    const proteinG = Math.round(w * protMult); // 체중 x 단백질배수
    const proteinCal = proteinG * 4;
    
    // 남은 칼로리를 탄수화물/지방 비율로 나눔
    const remainingCal = Math.max(0, targetKcal - proteinCal);
    const carbCal = remainingCal * (carbRatio / 100);
    const fatCal = remainingCal * ((100 - carbRatio) / 100);

    return {
      kcal: targetKcal,
      macros_chart: [
        { name: "탄수화물", value: Math.round(carbCal / 4), fill: "#84cc16", cal: Math.round(carbCal), ratio: targetKcal > 0 ? Math.round((carbCal / targetKcal) * 100) : 0 },
        { name: "단백질", value: proteinG, fill: "#3b82f6", cal: proteinCal, ratio: targetKcal > 0 ? Math.round((proteinCal / targetKcal) * 100) : 0 },
        { name: "지방", value: Math.round(fatCal / 9), fill: "#ef4444", cal: Math.round(fatCal), ratio: targetKcal > 0 ? Math.round((fatCal / targetKcal) * 100) : 0 },
      ],
      routine: [`생활 패턴(${form.activity})과 운동 강도(${form.split}분할)가 반영된 결과입니다.`]
    };
  }, [form.weight, form.activity, form.split, protMult, carbRatio]);

  // [초기화] DB에서 내 정보 불러오기
  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      let savedData = JSON.parse(localStorage.getItem("gymRatData") || "{}");

      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) {
          savedData = {
            form: { 
              height: data.height || 175, weight: data.weight || 75, age: data.age || 23, 
              squat: data.squat || 0, bench: data.bench || 0, deadlift: data.deadlift || 0, 
              split: data.split || "3", goal: data.goal || "muscle", activity: data.activity || "student" 
            },
            gender: data.gender || "male", unit: data.unit || "metric", 
            protMult: data.prot_mult || 1.8, carbRatio: data.carb_ratio || 50
          };
        }
      }

      if (savedData.form) setForm((prev) => ({ ...prev, ...savedData.form }));
      if (savedData.gender) setGender(savedData.gender);
      if (savedData.unit) setUnit(savedData.unit);
      if (savedData.protMult) setProtMult(savedData.protMult);
      if (savedData.carbRatio) setCarbRatio(savedData.carbRatio);
      setIsLoaded(true);
    };
    initData();
  }, []);

  // [자동 계산] 폼 변경 시 자동 실행
  useEffect(() => {
    if (!isLoaded) return;
    
    const h = Number(form.height), w = Number(form.weight), age = Number(form.age);
    let bmr = 10 * w + 6.25 * h - 5 * age + (gender === "male" ? 5 : -161);
    
    if (unit === "imperial") {
      const hMetric = h * 30.48;
      const wMetric = w / 2.20462;
      bmr = 10 * wMetric + 6.25 * hMetric - 5 * age + (gender === "male" ? 5 : -161);
    }

    const splitFactors: Record<string, number> = { "1": 1.2, "2": 1.35, "3": 1.5, "5": 1.6 };
    const activityFactors: Record<string, number> = { "sedentary": -0.1, "student": 0, "active": 0.2, "labor": 0.4 };
    const goalFactors: Record<string, number> = { "bulk": 400, "cut": -500, "diet": -300, "lean": 200 };

    const activityFactor = (splitFactors[form.split] || 1.35) + (activityFactors[form.activity] || 0);
    const targetKcal = Math.round(bmr * activityFactor + (goalFactors[form.goal] || 0));

    setResult(getCalculatedData(targetKcal));
  }, [form, gender, unit, isLoaded, getCalculatedData]);

  // [핵심 수정] DB 저장 및 식단 연동
  const handleSave = async () => {
    if (!user) return alert("로그인이 필요합니다! (게스트는 저장 불가)");
    if (!result) return;

    // 차트 데이터에서 탄/단/지 그램(g) 수 추출
    const carbG = result.macros_chart[0].value;
    const protG = result.macros_chart[1].value;
    const fatG = result.macros_chart[2].value;

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...form, // 키, 몸무게, 활동량 등 입력값 저장
      gender, 
      unit, 
      prot_mult: protMult, 
      carb_ratio: carbRatio,
      
      // [중요] 계산된 목표치를 DB에 저장해야 식단 페이지랑 연동됨
      target_cal: result.kcal,
      target_carb: carbG,
      target_prot: protG,
      target_fat: fatG,
      
      updated_at: new Date()
    });

    if (error) {
      console.error(error);
      alert("저장 실패 ㅠㅠ");
    } else {
      localStorage.setItem("gymRatData", JSON.stringify({ form, gender, unit, protMult, carbRatio }));
      
      if(confirm("저장 완료! 🔥\n식단 기록 페이지로 이동해서 확인해볼까요?")) {
        router.push("/diet/log");
      }
    }
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value, cal, ratio }: any) => {
    const RADIAN = Math.PI / 180; const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill={dark ? "#e4e4e7" : "#18181b"} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold">
        <tspan x={x} dy="-0.6em">{`${name} ${value}g`}</tspan>
        <tspan x={x} dy="1.4em" fontSize={9} fill="#71717a">{`(${cal}kcal, ${ratio}%)`}</tspan>
      </text>
    );
  };

  if (!isLoaded) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center font-black animate-pulse">GYM RAT LOADING...</div>;

  return (
    <div className={`${dark ? "dark bg-zinc-950 text-zinc-200" : "bg-zinc-100 text-zinc-900"} flex min-h-screen transition-colors font-sans`}>
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
          {/* 상단바 */}
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800">
             <div className="flex flex-col">
               <h1 className="text-3xl font-black italic tracking-tighter uppercase text-zinc-900 dark:text-zinc-100">DASHBOARD</h1>
               {user && <span className="text-[10px] font-bold text-lime-500">{user.email} 로그인 중</span>}
             </div>
             <ToggleArea label="테마" icon={dark ? <FaMoon /> : <FaSun />} val={dark ? "다크" : "라이트"} on={dark} set={() => setDark(!dark)} />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* 왼쪽 입력칸 */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-8">
                <div className="flex flex-wrap gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                    <ToggleArea label="단위" icon={<FaBolt />} val={unit === "metric" ? "KG / CM" : "LBS / FT"} on={unit === "imperial"} set={() => setUnit(unit === "metric" ? "imperial" : "metric")} />
                    <ToggleArea label="성별" icon={gender === "male" ? <FaMars /> : <FaVenus />} val={gender === "male" ? "남성" : "여성"} on={gender === "female"} set={() => setGender(gender === "male" ? "female" : "male")} />
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <BigInput label="키" val={form.height} set={(v:any) => setForm({...form, height: v})} unit={unit === "metric" ? "cm" : "ft"} />
                  <BigInput label="체중" val={form.weight} set={(v:any) => setForm({...form, weight: v})} unit={unit === "metric" ? "kg" : "lbs"} />
                  <BigInput label="나이" val={form.age} set={(v:any) => setForm({...form, age: v})} unit="세" />
                </div>
                
                <div className="bg-zinc-50 dark:bg-black/40 p-8 rounded-3xl space-y-6 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-lg font-black text-lime-500 tracking-widest uppercase italic border-b border-lime-500/20 pb-2">3대 운동</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <RowInput label="스쿼트" val={form.squat} set={(v:any) => setForm({...form, squat: v})} unit={unit === "metric" ? "kg" : "lbs"} />
                    <RowInput label="벤치프레스" val={form.bench} set={(v:any) => setForm({...form, bench: v})} unit={unit === "metric" ? "kg" : "lbs"} />
                    <RowInput label="데드리프트" val={form.deadlift} set={(v:any) => setForm({...form, deadlift: v})} unit={unit === "metric" ? "kg" : "lbs"} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <BigSelect label="운동 분할" val={form.split} set={(v:any) => setForm({...form, split: v})} options={[{v:"1",t:"무분할 (주2-3회)"},{v:"2",t:"2분할 (주4회)"},{v:"3",t:"3분할 (주6회)"},{v:"5",t:"5분할 (매일)"}]} />
                  <BigSelect label="생활 패턴" val={form.activity} set={(v:any) => setForm({...form, activity: v})} options={[{v:"sedentary",t:"백수/집콕"},{v:"student",t:"학생/사무직"},{v:"active",t:"서비스직"},{v:"labor",t:"현장직"}]} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <BigSelect label="목표 설정" val={form.goal} set={(v:any) => setForm({...form, goal: v})} options={[{v:"bulk",t:"벌크업"},{v:"cut",t:"커팅"},{v:"diet",t:"다이어트"},{v:"lean",t:"린매스업"}]} />
                  <div className="bg-lime-500/10 dark:bg-black/40 p-4 rounded-2xl border border-lime-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3"><FaDrumstickBite className="text-lime-500 text-xl" /><label className="text-sm font-black text-zinc-600 dark:text-zinc-400 uppercase">단백질</label></div>
                    <div className="flex items-center gap-2">
                        <input type="number" step="0.1" value={protMult} onChange={(e) => setProtMult(Number(e.target.value))} className="w-16 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 p-2 rounded-xl font-black text-center text-lg outline-none text-zinc-900 dark:text-white" /><span className="font-bold text-zinc-500 text-xs">배</span>
                    </div>
                  </div>
                </div>
                
                {/* [수정됨] 계산 버튼 -> 동기화 저장 버튼 */}
                <button 
                  onClick={handleSave} 
                  className="w-full py-5 bg-lime-500 text-black font-black text-2xl rounded-2xl shadow-lg shadow-lime-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-lime-400"
                >
                  <FaSave /> 데이터 저장
                </button>
              </div>
            </div>

            {/* 오른쪽 결과창 (실시간 변동) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-lg">
                <h3 className="text-xl font-black uppercase mb-4 text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><FaExchangeAlt className="text-lime-500"/> 단위 변환기</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative"><input type="number" value={converter.kg} onChange={(e) => { const val = e.target.value; setConverter({ kg: val, lbs: val ? (parseFloat(val) * 2.20462).toFixed(1) : "" }); }} placeholder="0" className="w-full p-4 pr-12 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl font-black text-xl text-center outline-none focus:border-lime-500 text-zinc-900 dark:text-white" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">KG</span></div>
                  <div className="flex-1 relative"><input type="number" value={converter.lbs} onChange={(e) => { const val = e.target.value; setConverter({ kg: val ? (parseFloat(val) / 2.20462).toFixed(1) : "", lbs: val }); }} placeholder="0" className="w-full p-4 pr-12 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl font-black text-xl text-center outline-none focus:border-lime-500 text-zinc-900 dark:text-white" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">LBS</span></div>
                </div>
              </div>

              {result && (
                <div className="bg-zinc-900 text-white p-6 rounded-[2.5rem] space-y-6 border-t-8 border-lime-500 shadow-2xl">
                  <div className="text-center">
                    <p className="text-xs font-bold text-zinc-500 mb-1 uppercase tracking-widest">일일 목표</p>
                    <p className="text-4xl font-black text-lime-400">{result.kcal} <span className="text-sm text-zinc-400">kcal</span></p>
                  </div>

                  <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest"><FaSlidersH className="inline mr-1"/> 탄/지 비율 조정</span>
                      <span className="text-[10px] font-bold text-lime-500">탄 {carbRatio}% : 지 {100-carbRatio}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="5" value={carbRatio} onChange={(e) => setCarbRatio(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-500" />
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={result.macros_chart} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value" label={renderCustomLabel} labelLine={true}>
                          {result.macros_chart.map((e: any, i: number) => (<Cell key={i} fill={e.fill} stroke="none" />))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="bg-zinc-800 p-4 rounded-2xl border-l-4 border-lime-500">
                    <p className="text-zinc-300 font-bold text-xs leading-relaxed">{result.routine?.[0]}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// 하단 보조 컴포넌트들 (기존 유지)
function ToggleArea({ label, icon, val, on, set }: any) { 
  return ( 
    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col"><span className="text-[10px] font-black text-zinc-400 uppercase">{label}</span><span className="text-xs font-bold text-zinc-900 dark:text-white">{val}</span></div>
      <button onClick={set} className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${on ? "bg-zinc-700" : "bg-zinc-300"}`}><div className={`bg-white w-4 h-4 rounded-full transition-transform ${on ? "translate-x-4" : ""}`}></div></button>
    </div> 
  ); 
}
function BigInput({ label, val, set, unit }: any) { 
  return ( 
    <div className="flex flex-col gap-2">
      <label className="text-sm font-black text-zinc-500 uppercase">{label}</label>
      <div className="relative">
        <input type="number" value={val} onChange={(e) => set(+e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-800 p-4 rounded-2xl font-black text-xl pr-12 text-zinc-900 dark:text-white outline-none focus:border-lime-500" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-500">{unit}</span>
      </div>
    </div> 
  ); 
}
function RowInput({ label, val, set, unit }: any) { 
  return ( 
    <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
      <label className="text-lg font-black text-zinc-600 dark:text-zinc-200">{label}</label>
      <div className="relative w-32">
        <input type="number" value={val} onChange={(e) => set(+e.target.value)} className="w-full bg-zinc-50 dark:bg-black border border-zinc-800 p-2 rounded-xl font-black text-right pr-10 text-lg text-zinc-900 dark:text-white outline-none focus:border-lime-500" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500">{unit}</span>
      </div>
    </div> 
  ); 
}
function BigSelect({ label, val, set, options }: any) { 
  return ( 
    <div className="flex flex-col gap-2">
      <label className="text-sm font-black text-zinc-500 uppercase">{label}</label>
      <select value={val} onChange={(e) => set(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-800 p-4 rounded-2xl font-black text-zinc-900 dark:text-white outline-none hover:border-lime-500 appearance-none">
        {options.map((o: any) => (<option key={o.v} value={o.v}>{o.t}</option>))}
      </select>
    </div> 
  ); 
} 