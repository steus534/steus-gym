"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaCalculator, FaTable, FaDumbbell, FaArrowDown } from "react-icons/fa";

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

    // 1. e1RM 계산
    if (!RPE_TABLE[rpe] || RPE_TABLE[rpe][reps - 1] === undefined) return;
    const topPct = RPE_TABLE[rpe][reps - 1];
    const estimated = w / (topPct / 100);
    setE1rm(Math.round(estimated * 10) / 10);

    // 2. 백오프 중량 계산
    if (!RPE_TABLE[backoffRpe] || RPE_TABLE[backoffRpe][backoffReps - 1] === undefined) return;
    const backoffPct = RPE_TABLE[backoffRpe][backoffReps - 1];
    const targetLoad = estimated * (backoffPct / 100);
    setBackoffWeight(Math.round(targetLoad * 10) / 10); // 소수점 1자리 반올림 (원판 단위에 맞춰 2.5단위 버림 하려면 로직 변경 가능)
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="text-3xl font-black italic uppercase flex items-center gap-3">
            <FaTable className="text-lime-500" /> RPE CALCULATOR
          </h1>

          <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-8">
            {/* 1. 탑세트 입력 */}
            <div>
              <h2 className="text-xl font-bold border-l-4 border-lime-500 pl-3 mb-4 flex items-center gap-2">
                <FaDumbbell /> 탑세트 (Top Set) 기록
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">수행 중량</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="kg / lbs" className="w-full p-4 bg-zinc-950 border border-zinc-700 rounded-2xl font-black text-xl outline-none focus:border-lime-500 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">반복 횟수 (Reps)</label>
                  <select value={reps} onChange={(e) => setReps(Number(e.target.value))} className="w-full p-4 bg-zinc-950 border border-zinc-700 rounded-2xl font-black text-xl outline-none focus:border-lime-500 text-white cursor-pointer">
                    {REPS.map(r => <option key={r} value={r}>{r} Reps</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">RPE</label>
                  <select value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-full p-4 bg-zinc-950 border border-zinc-700 rounded-2xl font-black text-xl outline-none focus:border-lime-500 text-white cursor-pointer">
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
                  <label className="text-sm font-bold text-zinc-400">목표 횟수 (Target Reps)</label>
                  <select value={backoffReps} onChange={(e) => setBackoffReps(Number(e.target.value))} className="w-full p-4 bg-zinc-950 border border-zinc-700 rounded-2xl font-black text-xl outline-none focus:border-purple-500 text-white cursor-pointer">
                    {REPS.map(r => <option key={r} value={r}>{r} Reps</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">목표 강도 (Target RPE)</label>
                  <select value={backoffRpe} onChange={(e) => setBackoffRpe(e.target.value)} className="w-full p-4 bg-zinc-950 border border-zinc-700 rounded-2xl font-black text-xl outline-none focus:border-purple-500 text-white cursor-pointer">
                    {RPES.map(r => <option key={r} value={r}>RPE {r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button onClick={calculate} className="w-full py-4 bg-lime-500 text-black font-black text-xl rounded-2xl hover:scale-[1.01] transition-transform shadow-lg shadow-lime-500/20 flex justify-center items-center gap-2">
              <FaCalculator /> 계산하기
            </button>

            {/* 결과창 */}
            {e1rm > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in duration-300">
                <div className="bg-zinc-800 p-6 rounded-2xl text-center border border-zinc-700">
                  <p className="text-sm font-bold text-zinc-400 mb-2">추정 1RM (e1RM)</p>
                  <p className="text-4xl font-black text-white">{e1rm} <span className="text-xl text-zinc-500">kg</span></p>
                </div>
                <div className="bg-zinc-800 p-6 rounded-2xl text-center border-2 border-purple-500 bg-purple-500/10">
                  <p className="text-sm font-bold text-purple-200 mb-2">백오프 추천 중량</p>
                  <p className="text-4xl font-black text-purple-400">{backoffWeight} <span className="text-xl text-purple-200/50">kg</span></p>
                  <p className="text-xs text-purple-300 mt-1 font-bold">({backoffReps}회 @ RPE {backoffRpe})</p>
                </div>
              </div>
            )}
          </div>

          {/* RPE 차트 (기존 유지) */}
          <div className="bg-white p-6 rounded-[2.5rem] border-4 border-zinc-200 overflow-x-auto">
             <h3 className="text-zinc-900 text-lg font-black uppercase mb-4 text-center">RPE Reference Table</h3>
             <table className="w-full text-center border-collapse min-w-[600px]">
               <thead>
                 <tr>
                   <th className="p-2 border bg-zinc-100 font-black text-zinc-900">RPE \ Reps</th>
                   {REPS.map(r => <th key={r} className="p-2 border bg-zinc-100 font-black text-zinc-900">{r}</th>)}
                 </tr>
               </thead>
               <tbody>
                 {RPES.map((rowRpe) => (
                   <tr key={rowRpe}>
                     <td className="p-2 border font-black bg-zinc-50 text-zinc-800">{rowRpe}</td>
                     {RPE_TABLE[rowRpe] && RPE_TABLE[rowRpe].map((pct: number, idx: number) => {
                       const intensity = (pct - 58) / (100 - 58);
                       const bg = `rgba(${255 * intensity}, ${255 * (1 - intensity) + 100}, 100, 0.3)`;
                       const isSelected = rpe === rowRpe && reps === (idx + 1);
                       return (
                         <td key={idx} className={`p-2 border text-xs sm:text-sm font-bold text-zinc-800 transition-all ${isSelected ? 'ring-4 ring-lime-500 z-10 scale-110 bg-lime-100' : ''}`} style={{ backgroundColor: isSelected ? '' : bg }}>
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
      </main>
    </div>
  );
}