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

  // 메뉴 데이터
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
      {/* 1. [Mobile] 햄버거 버튼 (갤럭시 S25U 세로 기준: 768px 미만에서만 보임) */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-zinc-900 text-white rounded-xl shadow-lg border border-zinc-800 hover:text-lime-500 transition-colors"
      >
        <FaBars size={20} />
      </button>

      {/* 2. [Mobile] 배경 오버레이 */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/80 z-[60] md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* 3. 사이드바 본체 */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] bg-zinc-900 text-white flex flex-col border-r border-zinc-800 h-screen overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out
        
        /* [Mobile: <768px] 갤럭시 S25U 포트레이트 */
        /* 기본적으로 화면 밖(-translate-x-full)에 숨어있음 */
        w-64 ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        
        /* [Tablet: 768px ~ 1280px] 아이패드 프로 11/12.9 포트레이트 */
        /* md(768px) 이상에서는 슬림 모드(w-20)로 변신, 마우스 올리면(hover) w-64로 확장 */
        md:translate-x-0 md:w-20 md:hover:w-64 md:group
        
        /* [Desktop: >= 1280px] 아이패드 12.9 랜드스케이프 & PC */
        /* xl(1280px) 이상에서는 항상 풀 모드(w-64) 고정 */
        xl:w-64 xl:hover:w-64
      `}>
        
        {/* 로고 영역 */}
        <div className="flex items-center justify-between p-6 h-20">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 min-w-[2rem] bg-lime-500 rounded-lg flex items-center justify-center font-black text-black italic shrink-0">G</div>
            {/* 텍스트: Tablet에선 숨김(opacity-0) -> Hover시 보임 / Desktop에선 항상 보임(xl:opacity-100) */}
            <span className="text-xl font-black italic tracking-tighter uppercase text-white opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 xl:opacity-100">
              GYM RAT
            </span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-zinc-500 hover:text-white">
            <FaTimes size={24} />
          </button>
        </div>

        {/* 메뉴 리스트 */}
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
                  
                  {/* 텍스트: Tablet(md)에선 숨김 -> Hover시 보임 / Desktop(xl)에선 항상 보임 */}
                  <span className="ml-4 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 xl:opacity-100">
                    {item.name}
                  </span>
                  
                  {/* 화살표: Tablet(md)에선 Hover시에만 보임 / Desktop(xl)에선 항상 보임 */}
                  {item.sub && (
                    <FaChevronRight className={`ml-auto text-[10px] opacity-50 md:hidden md:group-hover:block xl:block ${isActive ? "rotate-90" : ""}`} />
                  )}
                </Link>

                {/* 서브메뉴: Tablet(md)에선 Hover 전까진 숨김 / Desktop(xl)에선 펼쳐짐 */}
                {item.sub && (
                  <div className={`pl-12 mt-1 space-y-1 ${isActive ? "block" : "hidden group-hover/item:block"} md:hidden md:group-hover:block xl:block`}>
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

        {/* 하단 로그인 버튼: Tablet(md)에선 Hover시에만 보임 / Desktop(xl)에선 항상 보임 */}
        <div className="p-4 border-t border-zinc-800 md:hidden md:group-hover:block xl:block">
          <AuthButton />
        </div>
      </aside>
    </>
  );
}