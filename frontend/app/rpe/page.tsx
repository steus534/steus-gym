"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaCalculator, FaTable, FaDumbbell, FaArrowDown, FaExchangeAlt } from "react-icons/fa";

// RPE 데이터 테이블
const RPE_TABLE: { [key: string]: number[] } = {
  "10":  [100.0, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0],
  "9.5": [97.8, 93.9, 90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.7],
  "9":   [95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0, 65.3],
  "8.5": [93.9, 90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.7, 64.0],
  "8":   [92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0, 65.3, 62.6],
  "7.5": [90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.7, 64.0, 61.3],
  "7":   [89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0, 65.3, 62.6, 59.9],
  "6.5": [87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.7, 64.0, 61.3, 58.6]
};

const RPES = ["10", "9.5", "9", "8.5", "8", "7.5", "7", "6.5"];
const REPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function RpePage() {
  // Unit State
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");

  // Top Set States
  const [weight, setWeight] = useState<number | string>("");
  const [reps, setReps] = useState<number>(1);
  const [rpe, setRpe] = useState<string>("8");
  
  // Backoff Set States
  const [backoffReps, setBackoffReps] = useState<number>(5);
  const [backoffRpe, setBackoffRpe] = useState<string>("8");

  // Results
  const [e1rm, setE1rm] = useState<number>(0);
  const [backoffWeight, setBackoffWeight] = useState<number>(0);

  const calculate = () => {
    if (!weight) return;
    const w = Number(weight);

    if (!RPE_TABLE[rpe] || RPE_TABLE[rpe][reps - 1] === undefined) return;
    const topPct = RPE_TABLE[rpe][reps - 1];
    const estimated = w / (topPct / 100);
    setE1rm(Math.round(estimated * 10) / 10);

    if (!RPE_TABLE[backoffRpe] || RPE_TABLE[backoffRpe][backoffReps - 1] === undefined) return;
    const backoffPct = RPE_TABLE[backoffRpe][backoffReps - 1];
    const targetLoad = estimated * (backoffPct / 100);
    setBackoffWeight(Math.round(targetLoad * 10) / 10);
  };

  const toggleUnit = () => {
    const newUnit = unit === "kg" ? "lbs" : "kg";
    setUnit(newUnit);
    // 선택 사항: 단위 변경 시 기존 입력값 변환 (1kg = 2.20462lbs)
    if (weight) {
      const converted = newUnit === "lbs" 
        ? Number(weight) * 2.20462 
        : Number(weight) / 2.20462;
      setWeight(Math.round(converted * 10) / 10);
    }
    if (e1rm > 0) calculate(); // 결과값 갱신
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black italic uppercase flex items-center gap-3">
              <FaTable className="text-lime-500" /> RPE CALCULATOR
            </h1>
            {/* 단위 토글 스위치 */}
            <button 
              onClick={toggleUnit}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-5 py-2.5 rounded-2xl hover:bg-lime-500 hover:text-black transition-all group shadow-lg"
            >
              <FaExchangeAlt className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-black text-xs uppercase tracking-widest">{unit} Mode</span>
            </button>
          </div>

          <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-8">
            {/* 1. 탑세트 입력 */}
            <div>
              <h2 className="text-xl font-bold border-l-4 border-lime-500 pl-3 mb-4 flex items-center gap-2">
                <FaDumbbell /> 탑세트 (Top Set) 기록
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase">수행 중량 ({unit})</label>
                  <div className="relative">
                    <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={unit} className="w-full p-5 bg-zinc-950 border border-zinc-700 rounded-2xl font-black text-2xl outline-none focus:border-lime-500 text-white transition-all" />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black uppercase text-xs">{unit}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase">반복 횟수 (Reps)</label>
                  <select value={reps} onChange={(e) => setReps(Number(e.target.value))} className="w-full p-5 bg-zinc-950 border border-zinc-700 rounded-2xl font-black text-xl outline-none focus:border-lime-500 text-white cursor-pointer appearance-none">
                    {REPS.map(r => <option key={r} value={r}>{r} Reps</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase">RPE</label>
                  <select value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-full p-5 bg-zinc-950 border border-zinc-700 rounded-2xl font-black text-xl outline-none focus:border-lime-500 text-white cursor-pointer appearance-none">
                    {RPES.map(r => <option key={r} value={r}>RPE {r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. 백오프 설정 */}
            <div>
              <h2 className="text-xl font-bold border-l-4 border-purple-500 pl-3 mb-4 flex items-center gap-2">
                <FaArrowDown /> 백오프 (Backoff) 목표 설정
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase">목표 횟수 (Target Reps)</label>
                  <select value={backoffReps} onChange={(e) => setBackoffReps(Number(e.target.value))} className="w-full p-5 bg-zinc-950 border border-zinc-700 rounded-2xl font-black text-xl outline-none focus:border-purple-500 text-white cursor-pointer appearance-none">
                    {REPS.map(r => <option key={r} value={r}>{r} Reps</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase">목표 강도 (Target RPE)</label>
                  <select value={backoffRpe} onChange={(e) => setBackoffRpe(e.target.value)} className="w-full p-5 bg-zinc-950 border border-zinc-700 rounded-2xl font-black text-xl outline-none focus:border-purple-500 text-white cursor-pointer appearance-none">
                    {RPES.map(r => <option key={r} value={r}>RPE {r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button onClick={calculate} className="w-full py-5 bg-lime-500 text-black font-black text-2xl rounded-2xl hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-lime-500/20 flex justify-center items-center gap-3">
              <FaCalculator /> CALCULATE LOAD
            </button>

            {/* 결과창 */}
            {e1rm > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in duration-300">
                <div className="bg-zinc-800 p-8 rounded-[2rem] text-center border border-zinc-700 shadow-inner">
                  <p className="text-xs font-black text-zinc-500 mb-2 uppercase tracking-widest">Estimated 1RM</p>
                  <p className="text-5xl font-black text-white italic">{e1rm} <span className="text-xl text-lime-500 non-italic">{unit}</span></p>
                </div>
                <div className="bg-zinc-800 p-8 rounded-[2rem] text-center border-2 border-purple-500 bg-purple-500/10 shadow-lg">
                  <p className="text-xs font-black text-purple-300 mb-2 uppercase tracking-widest">Recommended Backoff</p>
                  <p className="text-5xl font-black text-purple-400 italic">{backoffWeight} <span className="text-xl text-purple-200/50 non-italic">{unit}</span></p>
                  <p className="text-[10px] text-purple-300 mt-2 font-black uppercase tracking-tighter">({backoffReps} Reps @ RPE {backoffRpe})</p>
                </div>
              </div>
            )}
          </div>

          {/* RPE Reference Table */}
          <div className="bg-white p-8 rounded-[3rem] border-4 border-zinc-200 shadow-2xl">
             <div className="flex justify-between items-center mb-6 px-4">
               <h3 className="text-zinc-950 text-xl font-black uppercase italic tracking-tighter">RPE Intensity Table (%)</h3>
               <span className="text-[10px] font-black bg-zinc-100 px-3 py-1 rounded-full text-zinc-500">Selected: {unit.toUpperCase()}</span>
             </div>
             <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-center border-collapse min-w-[700px]">
                 <thead>
                   <tr>
                     <th className="p-3 border bg-zinc-100 font-black text-zinc-950 text-xs uppercase">RPE \ Reps</th>
                     {REPS.map(r => <th key={r} className="p-3 border bg-zinc-100 font-black text-zinc-950">{r}</th>)}
                   </tr>
                 </thead>
                 <tbody>
                   {RPES.map((rowRpe) => (
                     <tr key={rowRpe}>
                       <td className="p-3 border font-black bg-zinc-50 text-zinc-800 italic">{rowRpe}</td>
                       {RPE_TABLE[rowRpe] && RPE_TABLE[rowRpe].map((pct: number, idx: number) => {
                         const intensity = (pct - 58) / (100 - 58);
                         const bg = `rgba(${255 * intensity}, ${255 * (1 - intensity) + 120}, 100, 0.25)`;
                         const isSelected = rpe === rowRpe && reps === (idx + 1);
                         return (
                           <td key={idx} className={`p-3 border text-xs font-black text-zinc-900 transition-all ${isSelected ? 'ring-4 ring-lime-500 z-10 scale-110 bg-lime-100 shadow-xl' : ''}`} style={{ backgroundColor: isSelected ? '' : bg }}>
                             {pct}%
                           </td>
                         );
                       })}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LogProgress({ label, cur, target, color }: any) {
  const p = Math.min(100, (cur/target)*100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-black uppercase"><span className="text-zinc-600">{label}</span><span>{cur}/{target}</span></div>
      <div className="h-1 bg-black rounded-full overflow-hidden border border-zinc-800">
        <div className={`h-full transition-all duration-500 ${color}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}