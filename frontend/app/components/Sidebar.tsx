"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FaHome, FaChartLine, FaTable, FaBook, FaCircleNotch, 
  FaUtensils, FaHeartbeat, FaEdit, FaChevronRight, FaBars, FaTimes 
} from "react-icons/fa";
import AuthButton from "./AuthButton";

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menu = [
    { name: "메인 (스펙분석)", path: "/", icon: <FaHome /> },
    { 
      name: "식단 가이드", 
      path: "/diet", 
      icon: <FaUtensils />,
      sub: [
        { name: "영양소 정보", path: "/diet/info" },
        { name: "식단 기록", path: "/diet/log" }
      ]
    },
    { name: "성장 그래프", path: "/history", icon: <FaChartLine /> },
    { name: "커뮤니티", path: "/community", icon: <FaEdit /> },
    { name: "프로그램 가이드", path: "/programs", icon: <FaBook /> },
    { name: "유산소 가이드", path: "/cardio", icon: <FaHeartbeat /> },
    { name: "RPE 계산기", path: "/rpe", icon: <FaTable /> },
    { name: "원판 계산기", path: "/plate-calc", icon: <FaCircleNotch /> },
  ];

  return (
    <>
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-zinc-900 text-white rounded-xl shadow-lg border border-zinc-800 hover:text-lime-500 transition-colors"
      >
        <FaBars size={20} />
      </button>

      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/80 z-[60] md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* [핵심 1] group/sidebar 이름 부여 */}
      <aside className={`
        bg-zinc-900 text-white flex flex-col border-r border-zinc-800 h-screen overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out z-[70]
        fixed inset-y-0 left-0 w-64 
        ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        
        md:translate-x-0 md:static md:sticky md:top-0 md:shrink-0
        
        /* Tablet Slim Mode -> Hover Expanded */
        md:w-20 md:hover:w-64 
        group/sidebar  /* <-- 사이드바 그룹 이름 설정 */
        
        xl:w-64 xl:hover:w-64
      `}>
        
        <div className="flex items-center justify-between p-6 h-20 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 min-w-[2rem] bg-lime-500 rounded-lg flex items-center justify-center font-black text-black italic shrink-0">G</div>
            {/* [핵심 2] 사이드바(group/sidebar)가 hover되면 글자 보임 */}
            <span className="text-xl font-black italic tracking-tighter uppercase text-white opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 xl:opacity-100 delay-75">
              GYM RAT
            </span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-zinc-500 hover:text-white">
            <FaTimes size={24} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-2 w-full">
          {menu.map((item) => {
            const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

            return (
              <div key={item.path} className="group/item relative">
                <Link 
                  href={item.sub ? item.sub[0].path : item.path} 
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center p-3 rounded-xl transition-all overflow-hidden whitespace-nowrap ${
                    isActive 
                      ? "bg-lime-500 text-black font-bold" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <span className="text-xl min-w-[1.5rem] flex justify-center shrink-0">{item.icon}</span>
                  
                  {/* [핵심 3] 메뉴명도 사이드바 hover 시 보임 */}
                  <span className="ml-4 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 xl:opacity-100 delay-75">
                    {item.name}
                  </span>
                  
                  {item.sub && (
                    <FaChevronRight className={`ml-auto text-[10px] opacity-50 md:hidden md:group-hover/sidebar:block xl:block ${isActive ? "rotate-90" : ""}`} />
                  )}
                </Link>

                {item.sub && (
                  <div className={`pl-12 mt-1 space-y-1 ${isActive ? "block" : "hidden group-hover/item:block"} md:hidden md:group-hover/sidebar:block xl:block`}>
                    {item.sub.map((s) => (
                      <Link 
                        key={s.path} 
                        href={s.path} 
                        onClick={() => setIsMobileOpen(false)}
                        className={`block p-2 text-sm font-bold rounded-lg transition-colors truncate ${
                          pathname === s.path ? "text-lime-500" : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        • {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 md:hidden md:group-hover/sidebar:block xl:block shrink-0">
          <AuthButton />
        </div>
      </aside>
    </>
  );
}