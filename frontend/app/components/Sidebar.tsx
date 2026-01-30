"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaChartLine, FaTable, FaBook, FaCircleNotch, FaUtensils, FaHeartbeat, FaEdit } from "react-icons/fa";
import AuthButton from "./AuthButton";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    { name: "메인 (스펙분석)", path: "/", icon: <FaHome /> },
    { name: "식단 가이드", path: "/diet", icon: <FaUtensils /> },
    { name: "성장 그래프", path: "/history", icon: <FaChartLine /> },
    { name: "블로그", path: "/admin", icon: <FaEdit /> }, // [NEW] 관리자 전용
    { name: "프로그램 가이드", path: "/programs", icon: <FaBook /> },
    { name: "유산소 가이드", path: "/cardio", icon: <FaHeartbeat /> },
    { name: "RPE 계산기", path: "/rpe", icon: <FaTable /> },
    { name: "원판 계산기", path: "/plate-calc", icon: <FaCircleNotch /> },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-zinc-900 text-white flex flex-col items-center lg:items-start p-4 border-r border-zinc-800 sticky top-0 h-screen z-50 shrink-0">
      <div className="mb-8 mt-2 flex items-center gap-2 justify-center lg:justify-start w-full">
        <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center font-black text-black italic">G</div>
        <span className="text-xl font-black italic tracking-tighter uppercase hidden lg:block">GYM RAT</span>
      </div>
      
      <nav className="space-y-2 w-full flex-1">
        {menu.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isActive ? "bg-lime-500 text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="hidden lg:block">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="w-full mt-4 hidden lg:block">
        <AuthButton />
      </div>
      <div className="w-full mt-4 lg:hidden">
        <AuthButton /> 
      </div>
    </aside>
  );
}