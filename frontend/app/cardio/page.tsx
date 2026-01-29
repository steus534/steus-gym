"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { FaHeartbeat, FaRunning, FaFireAlt, FaLungs } from "react-icons/fa";

export default function CardioPage() {
  const [age, setAge] = useState(25); // 기본값
  const [maxHr, setMaxHr] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("gymRatData");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.form && parsed.form.age) {
        setAge(parsed.form.age);
      }
    }
  }, []);

  useEffect(() => {
    // 최대 심박수 공식: 220 - 나이
    setMaxHr(220 - age);
  }, [age]);

  const zones = [
    { id: 1, name: "Zone 1 (회복/웜업)", min: 0.5, max: 0.6, color: "bg-gray-400", desc: "매우 편안함. 워밍업이나 쿨다운, 활동적인 회복." },
    { id: 2, name: "Zone 2 (지방 연소)", min: 0.6, max: 0.7, color: "bg-blue-500", desc: "대화가 가능한 수준. 지방 대사 효율 최고. 기초 체력 향상." },
    { id: 3, name: "Zone 3 (유산소)", min: 0.7, max: 0.8, color: "bg-green-500", desc: "호흡이 거칠어짐. 심폐 지구력 향상 및 혈액 순환 개선." },
    { id: 4, name: "Zone 4 (무산소 역치)", min: 0.8, max: 0.9, color: "bg-yellow-500", desc: "힘듦. 젖산이 쌓이기 시작함. 고강도 지구력 및 스피드 향상." },
    { id: 5, name: "Zone 5 (최대 노력)", min: 0.9, max: 1.0, color: "bg-red-600", desc: "매우 힘듦. 최대 산소 섭취량(VO2 Max) 도달. 단시간 수행 가능." },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <h1 className="text-3xl font-black italic uppercase flex items-center gap-3">
            <FaHeartbeat className="text-red-500" /> 유산소 가이드 (Cardio Zones)
          </h1>

          {/* 상단 정보 */}
          <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-xl flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 text-center md:text-left">
              <p className="text-zinc-400 font-bold mb-1">USER AGE</p>
              <div className="text-4xl font-black text-white">{age} <span className="text-lg text-zinc-500">세</span></div>
            </div>
            <div className="hidden md:block w-px h-16 bg-zinc-700"></div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-zinc-400 font-bold mb-1">MAX HEART RATE (220-Age)</p>
              <div className="text-5xl font-black text-red-500 flex items-center justify-center md:justify-start gap-2">
                {maxHr} <span className="text-lg text-zinc-500 mt-2">BPM</span>
              </div>
            </div>
            <div className="flex gap-4">
               <div className="bg-zinc-800 p-4 rounded-2xl flex flex-col items-center">
                 <FaFireAlt className="text-blue-500 mb-2" />
                 <span className="text-xs font-bold text-zinc-400">지방 연소</span>
                 <span className="text-lg font-black">{Math.round(maxHr * 0.6)}~{Math.round(maxHr * 0.7)}</span>
               </div>
               <div className="bg-zinc-800 p-4 rounded-2xl flex flex-col items-center">
                 <FaLungs className="text-yellow-500 mb-2" />
                 <span className="text-xs font-bold text-zinc-400">심폐 강화</span>
                 <span className="text-lg font-black">{Math.round(maxHr * 0.7)}~{Math.round(maxHr * 0.9)}</span>
               </div>
            </div>
          </div>

          {/* 존 그래프 및 설명 */}
          <div className="grid gap-4">
            {zones.map((zone) => {
              const minBpm = Math.round(maxHr * zone.min);
              const maxBpm = Math.round(maxHr * zone.max);
              
              return (
                <div key={zone.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 hover:border-zinc-600 transition-colors flex flex-col md:flex-row gap-6 items-center">
                  
                  {/* 왼쪽: 존 정보 & BPM */}
                  <div className="w-full md:w-1/4 min-w-[180px]">
                    <h3 className="text-xl font-black text-white mb-1">{zone.name}</h3>
                    <p className="text-3xl font-black text-lime-400">
                      {minBpm} - {maxBpm} <span className="text-xs text-zinc-500">BPM</span>
                    </p>
                    <p className="text-xs font-bold text-zinc-500 mt-1">
                      Max의 {zone.min * 100}% - {zone.max * 100}%
                    </p>
                  </div>

                  {/* 가운데: 그래프 바 */}
                  <div className="w-full md:flex-1 h-8 bg-zinc-800 rounded-full overflow-hidden relative border border-zinc-700">
                    <div 
                      className={`h-full ${zone.color} transition-all duration-1000 flex items-center justify-end pr-3`} 
                      style={{ width: `${zone.max * 100}%` }}
                    >
                      <span className="text-[10px] font-black text-black/50 mix-blend-overlay">ZONE {zone.id}</span>
                    </div>
                  </div>

                  {/* 오른쪽: 설명 */}
                  <div className="w-full md:w-1/3 text-sm text-zinc-300 font-bold bg-black/20 p-4 rounded-xl border border-zinc-800/50">
                    {zone.desc}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}