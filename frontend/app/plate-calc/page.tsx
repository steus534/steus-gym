"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { FaCircleNotch, FaDumbbell, FaCog, FaExchangeAlt } from "react-icons/fa";

// 단위별 원판 데이터베이스
const PLATES_DATA = {
  kg: [
    { w: 25, color: "bg-red-600", h: "h-32" },
    { w: 20, color: "bg-blue-600", h: "h-32" },
    { w: 15, color: "bg-yellow-500", h: "h-28" },
    { w: 10, color: "bg-green-600", h: "h-24" },
    { w: 5, color: "bg-white", h: "h-20" },
    { w: 2.5, color: "bg-black border border-white", h: "h-16" },
    { w: 2, color: "bg-blue-400", h: "h-14" },     // 다시 추가
    { w: 1.5, color: "bg-yellow-400", h: "h-12" },  // 다시 추가
    { w: 1.25, color: "bg-zinc-400", h: "h-11" },
    { w: 1, color: "bg-green-400", h: "h-10" },    // 다시 추가
    { w: 0.5, color: "bg-gray-200", h: "h-8" },    // 다시 추가
  ],
  lbs: [
    // LBS는 북미 표준 규격에 따라 45, 35, 25, 10, 5, 2.5가 기본임
    { w: 45, color: "bg-zinc-800 border-2 border-red-600", h: "h-32" },
    { w: 35, color: "bg-blue-600", h: "h-30" },
    { w: 25, color: "bg-yellow-500", h: "h-28" },
    { w: 10, color: "bg-green-600", h: "h-24" },
    { w: 5, color: "bg-white", h: "h-20" },
    { w: 2.5, color: "bg-black", h: "h-16" },
  ]
};

const BAR_OPTIONS = {
  kg: [{ n: "탄력봉", w: 20 }, { n: "여성용", w: 15 }, { n: "EZ-바", w: 18 }, { n: "머신", w: 0 }],
  lbs: [{ n: "Standard", w: 45 }, { n: "Women's", w: 35 }, { n: "EZ-Bar", w: 40 }, { n: "Machine", w: 0 }]
};

export default function PlateCalcPage() {
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [targetWeight, setTargetWeight] = useState<string>("");
  const [barWeight, setBarWeight] = useState<number>(20);
  const [collarWeight, setCollarWeight] = useState<number>(0);
  const [result, setResult] = useState<any[]>([]);
  const [inventory, setInventory] = useState<number[]>([20, 15, 10, 5, 2.5]);

  // 단위 변경 핸들러
  const toggleUnit = () => {
    const newUnit = unit === "kg" ? "lbs" : "kg";
    setUnit(newUnit);
    // 입력값 변환 (1kg = 2.20462lbs)
    if (targetWeight) {
      const converted = newUnit === "lbs" ? Number(targetWeight) * 2.20462 : Number(targetWeight) / 2.20462;
      setTargetWeight(Math.round(converted).toString());
    }
    // 바 무게 기본값 변경
    setBarWeight(newUnit === "kg" ? 20 : 45);
    // 인벤토리 초기화 (단위에 맞는 원판으로)
    setInventory(newUnit === "kg" ? [25, 20, 15, 10, 5, 2.5] : [45, 35, 25, 10, 5, 2.5]);
  };

  const togglePlate = (weight: number) => {
    setInventory(prev => prev.includes(weight) ? prev.filter(w => w !== weight) : [...prev, weight]);
  };

  useEffect(() => {
    const target = Number(targetWeight);
    const minWeight = barWeight + (collarWeight * 2); // 마구리는 양쪽 합산

    if (!target || target < minWeight) {
      setResult([]);
      return;
    }

    let remain = (target - minWeight) / 2;
    const platesNeeded = [];
    const usablePlates = [...PLATES_DATA[unit]].filter(p => inventory.includes(p.w)).sort((a, b) => b.w - a.w);

    for (const p of usablePlates) {
      while (remain >= p.w) {
        remain = parseFloat((remain - p.w).toFixed(2));
        platesNeeded.push(p);
      }
    }
    setResult(platesNeeded);
  }, [targetWeight, barWeight, collarWeight, inventory, unit]);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black italic uppercase flex items-center gap-3">
              <FaCircleNotch className="text-lime-500" /> Plate Calculator
            </h1>
            <button onClick={toggleUnit} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl hover:bg-lime-500 hover:text-black transition-all group font-black text-xs uppercase italic">
              <FaExchangeAlt className="group-hover:rotate-180 transition-transform duration-500" /> {unit} Mode
            </button>
          </div>

          <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-8">
            {/* 인벤토리 설정 */}
            <div className="bg-black/30 p-6 rounded-3xl border border-zinc-800">
              <h3 className="text-[10px] font-black text-zinc-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <FaCog /> Available Plates ({unit})
              </h3>
              <div className="flex flex-wrap gap-2">
                {PLATES_DATA[unit].map((p) => (
                  <button key={p.w} onClick={() => togglePlate(p.w)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${inventory.includes(p.w) ? "bg-lime-500 border-lime-500 text-black shadow-lg" : "bg-zinc-900 border-zinc-700 text-zinc-500"}`}>
                    {p.w} {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* 입력 섹션 */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase ml-2">Total Weight ({unit})</label>
                <input type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder={`Target ${unit}`} className="w-full p-5 bg-black border border-zinc-700 rounded-2xl font-black text-3xl text-white outline-none focus:border-lime-500 transition-all shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase ml-2">Bar Weight</label>
                <select value={barWeight} onChange={(e) => setBarWeight(Number(e.target.value))} className="w-full p-5 bg-black border border-zinc-700 rounded-2xl font-black text-xl text-white outline-none focus:border-lime-500 cursor-pointer appearance-none">
                  {BAR_OPTIONS[unit].map(opt => <option key={opt.w} value={opt.w}>{opt.n} ({opt.w}{unit})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase ml-2">Collar Weight (Each)</label>
                <select value={collarWeight} onChange={(e) => setCollarWeight(Number(e.target.value))} className="w-full p-5 bg-black border border-zinc-700 rounded-2xl font-black text-xl text-white outline-none focus:border-lime-500 cursor-pointer appearance-none">
                  <option value={0}>None</option>
                  <option value={unit === 'kg' ? 2.5 : 5}>{unit === 'kg' ? '2.5kg' : '5lb'} (Comp)</option>
                </select>
              </div>
            </div>

            {/* 시각화 */}
            <div className="bg-zinc-800 p-10 rounded-[3rem] border-2 border-zinc-700 flex flex-col items-center justify-center min-h-[300px] shadow-2xl">
              {result.length > 0 ? (
                <div className="flex items-center justify-center animate-in zoom-in duration-300">
                  <div className="w-10 h-10 bg-zinc-400 rounded-l-md border-r border-zinc-500 z-20 shadow-lg"></div>
                  <div className="min-w-[140px] h-8 bg-zinc-300 border-y-4 border-zinc-400 flex items-center justify-start px-2 rounded-r-md z-10 relative shadow-inner">
                    <div className="flex items-center gap-[2px]">
                      {result.map((p, idx) => (
                        <div key={idx} className={`w-7 ${p.h} ${p.color} rounded-md shadow-2xl border-l border-black/30 flex items-center justify-center relative group`}>
                          <span className="text-[10px] font-black text-white -rotate-90 absolute drop-shadow-md">{p.w}</span>
                          <div className="absolute -top-12 bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-zinc-700 shadow-2xl">{p.w} {unit}</div>
                        </div>
                      ))}
                      {collarWeight > 0 && (
                        <div className="w-5 h-12 bg-zinc-100 rounded-sm border border-zinc-400 shadow-xl flex items-center justify-center relative z-20">
                          <div className="w-1 h-12 bg-zinc-400 absolute rotate-90 opacity-20"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-56 h-6 bg-zinc-500 rounded-r-full -ml-2 z-0 shadow-lg border-y-2 border-zinc-600"></div>
                </div>
              ) : (
                <div className="text-zinc-600 font-black uppercase italic tracking-widest flex flex-col items-center gap-4 opacity-30">
                  <FaDumbbell className="text-8xl" />
                  <span>Enter Weight to Calculate</span>
                </div>
              )}
            </div>

            {/* 하단 요약 */}
            {result.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black p-6 rounded-[2rem] border border-zinc-800 flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Weight Per Side</span>
                  <span className="text-3xl font-black italic">{(Number(targetWeight) - barWeight - (collarWeight * 2)) / 2} <span className="text-sm text-lime-500 non-italic">{unit}</span></span>
                </div>
                <div className="bg-zinc-800/50 p-6 rounded-[2rem] border border-zinc-800 flex flex-wrap gap-2 items-center">
                   {Object.entries(result.reduce((acc, curr) => ({ ...acc, [curr.w]: (acc[curr.w] || 0) + 1 }), {}))
                    .sort((a: any, b: any) => b[0] - a[0])
                    .map(([w, count]: any) => (
                      <div key={w} className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-700 flex items-center gap-3">
                        <span className="font-black text-white text-sm">{w}{unit}</span>
                        <span className="text-lime-500 font-black italic underline decoration-zinc-700 underline-offset-4 text-lg">x {count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}