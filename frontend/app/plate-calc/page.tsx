"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { FaCircleNotch, FaDumbbell, FaCog } from "react-icons/fa";

// 전체 원판 데이터베이스 (순서: 무거운 순)
const ALL_PLATES = [
  { w: 25, color: "bg-red-600", h: "h-32" },
  { w: 20, color: "bg-blue-600", h: "h-32" },
  { w: 15, color: "bg-yellow-500", h: "h-28" },
  { w: 10, color: "bg-green-600", h: "h-24" },
  { w: 5, color: "bg-white", h: "h-20" },
  { w: 2.5, color: "bg-black border border-white", h: "h-16" },
  { w: 2, color: "bg-blue-400", h: "h-14" },
  { w: 1.5, color: "bg-yellow-400", h: "h-12" },
  { w: 1.25, color: "bg-zinc-400", h: "h-11" },
  { w: 1, color: "bg-green-400", h: "h-10" },
  { w: 0.5, color: "bg-gray-200", h: "h-8" },
];

export default function PlateCalcPage() {
  const [targetWeight, setTargetWeight] = useState<string>("");
  const [barWeight, setBarWeight] = useState<number>(20);
  const [collarWeight, setCollarWeight] = useState<number>(0);
  const [result, setResult] = useState<any[]>([]);
  const [inventory, setInventory] = useState<number[]>([20, 15, 10, 5, 2.5]);

  const togglePlate = (weight: number) => {
    if (inventory.includes(weight)) {
      setInventory(inventory.filter((w) => w !== weight));
    } else {
      setInventory([...inventory, weight]);
    }
  };

  // [핵심] 입력값이 변할 때마다 자동 계산 (useEffect)
  useEffect(() => {
    const target = Number(targetWeight);
    const minWeight = barWeight + collarWeight;

    // 유효성 검사 실패 시 결과 초기화
    if (!target || (minWeight > 0 && target < minWeight)) {
      setResult([]);
      return;
    }

    let remain = (target - minWeight) / 2;
    const platesNeeded = [];

    const usablePlates = ALL_PLATES.filter((p) => inventory.includes(p.w)).sort((a, b) => b.w - a.w);

    for (const p of usablePlates) {
      while (remain >= p.w) {
        remain = parseFloat((remain - p.w).toFixed(2));
        platesNeeded.push(p);
      }
    }
    setResult(platesNeeded);

  }, [targetWeight, barWeight, collarWeight, inventory]); // 이 값들이 변하면 즉시 실행됨

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="text-3xl font-black italic uppercase flex items-center gap-3">
            <FaCircleNotch className="text-lime-500" /> 원판 계산기
          </h1>

          <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-8">
            
            {/* 원판 설정 섹션 */}
            <div className="bg-black/30 p-6 rounded-3xl border border-zinc-800">
              <h3 className="text-sm font-black text-zinc-400 mb-4 flex items-center gap-2 uppercase">
                <FaCog /> 체육관 보유 원판 설정 (Click to Toggle)
              </h3>
              <div className="flex flex-wrap gap-2">
                {ALL_PLATES.map((p) => {
                  const isActive = inventory.includes(p.w);
                  return (
                    <button
                      key={p.w}
                      onClick={() => togglePlate(p.w)}
                      className={`px-3 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                        isActive
                          ? "bg-lime-500 border-lime-500 text-black shadow-[0_0_10px_rgba(132,204,22,0.3)]"
                          : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500"
                      }`}
                    >
                      {p.w} kg
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 입력 섹션 (버튼 제거됨) */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px] space-y-2">
                <label className="text-sm font-bold text-zinc-400">목표 중량 (Total Weight)</label>
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="예: 100"
                  className="w-full p-4 bg-black border border-zinc-700 rounded-2xl font-black text-2xl text-white outline-none focus:border-lime-500 transition-colors"
                  autoFocus
                />
              </div>
              
              <div className="w-40 space-y-2">
                <label className="text-sm font-bold text-zinc-400">기구 무게</label>
                <select value={barWeight} onChange={(e) => setBarWeight(Number(e.target.value))} className="w-full p-4 bg-black border border-zinc-700 rounded-2xl font-bold text-white outline-none focus:border-lime-500 cursor-pointer">
                  <option value={20}>탄력봉 (20kg)</option>
                  <option value={18}>EZ-컬 바 (18kg)</option>
                  <option value={15}>여성용 (15kg)</option>
                  <option value={0}>머신/맨몸 (0kg)</option>
                </select>
              </div>
              <div className="w-40 space-y-2">
                <label className="text-sm font-bold text-zinc-400">마구리 (Collars)</label>
                <select value={collarWeight} onChange={(e) => setCollarWeight(Number(e.target.value))} className="w-full p-4 bg-black border border-zinc-700 rounded-2xl font-bold text-white outline-none focus:border-lime-500 cursor-pointer">
                  <option value={0}>기본/스프링 (0kg)</option>
                  <option value={5}>시합용 (5kg)</option>
                </select>
              </div>
            </div>

            {/* 결과 시각화 섹션 */}
            <div className="bg-zinc-800 p-8 rounded-[2.5rem] border-2 border-zinc-700 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden transition-all">
              {result.length > 0 ? (
                <div className="flex items-center w-full justify-center animate-in fade-in zoom-in duration-300">
                  
                  {/* 1. 바벨 슬리브 (안쪽) */}
                  <div className="w-8 h-8 bg-zinc-400 rounded-l-md shadow-inner border-r border-zinc-500 z-20"></div>
                  
                  {/* 2. 슬리브 몸통 & 원판 */}
                  <div className="w-auto min-w-[120px] h-6 bg-zinc-300 border-y-4 border-zinc-400 flex items-center justify-start px-1 rounded-r-md z-10 relative">
                    <div className="flex items-center gap-[2px]">
                      
                      {/* [A] 안쪽 원판 */}
                      {result
                        .filter(p => collarWeight > 0 ? p.w >= 2.5 : true)
                        .map((p, idx) => (
                          <div key={`inner-${idx}`} className={`w-6 ${p.h} ${p.color} rounded-md shadow-lg border-l border-black/20 flex items-center justify-center relative group`}>
                            <span className="text-[10px] font-black text-white drop-shadow-md -rotate-90 absolute whitespace-nowrap">{p.w}</span>
                            <div className="absolute -top-10 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 border border-zinc-700">{p.w} kg</div>
                          </div>
                      ))}

                      {/* [B] 시합용 마구리 */}
                      {collarWeight > 0 && (
                        <div className="w-4 h-10 bg-gradient-to-r from-zinc-200 to-zinc-400 rounded-sm border border-zinc-500 shadow-xl flex items-center justify-center relative group z-20">
                           <div className="w-6 h-1 bg-black absolute rotate-90 opacity-30"></div>
                           <div className="absolute -top-10 bg-black text-lime-500 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 border border-zinc-700">2.5kg</div>
                        </div>
                      )}

                      {/* [C] 바깥쪽 원판 */}
                      {collarWeight > 0 && result
                        .filter(p => p.w < 2.5)
                        .map((p, idx) => (
                          <div key={`outer-${idx}`} className={`w-6 ${p.h} ${p.color} rounded-md shadow-lg border-l border-black/20 flex items-center justify-center relative group`}>
                            <span className="text-[10px] font-black text-white drop-shadow-md -rotate-90 absolute whitespace-nowrap">{p.w}</span>
                            <div className="absolute -top-10 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 border border-zinc-700">{p.w} kg</div>
                          </div>
                      ))}

                    </div>
                  </div>

                  {/* 3. 바벨 손잡이 */}
                  {barWeight > 0 && (
                    <div className="w-48 h-4 bg-zinc-500 rounded-r-full -ml-2 z-0 relative"></div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-600 font-bold flex flex-col items-center gap-4">
                  <FaDumbbell className="text-6xl opacity-20" />
                  <span>중량을 입력하면 원판 조합을 보여줍니다.</span>
                </div>
              )}
            </div>

            {/* 텍스트 결과 */}
            {result.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black p-4 rounded-2xl border border-zinc-800">
                  <p className="text-xs text-zinc-500 font-bold uppercase">한 쪽 무게</p>
                  <p className="text-2xl font-black text-white">
                    {(Number(targetWeight) - barWeight - collarWeight) / 2} <span className="text-sm text-zinc-500">kg</span>
                  </p>
                </div>
                
                {collarWeight > 0 && (
                   <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700 flex flex-col justify-center items-center">
                     <p className="text-xs text-zinc-400 font-bold uppercase mb-1">마구리 포함</p>
                     <p className="text-lg font-black text-lime-500">+ 5 kg</p>
                   </div>
                )}

                <div className="col-span-2 md:col-span-3 flex flex-wrap gap-2">
                  {Object.entries(result.reduce((acc, curr) => ({ ...acc, [curr.w]: (acc[curr.w] || 0) + 1 }), {}))
                    .sort((a: any, b: any) => b[0] - a[0])
                    .map(([w, count]: any) => (
                      <div key={w} className="bg-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-zinc-600">
                        <span className="font-black text-white">{w}kg</span>
                        <span className="text-lime-400 font-bold">x {count}</span>
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