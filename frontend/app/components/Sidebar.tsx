"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FaHome, FaChartLine, FaTable, FaBook, FaCircleNotch, 
  FaUtensils, FaHeartbeat, FaEdit, FaChevronRight, FaBars, FaTimes, FaHistory 
} from "react-icons/fa";
import AuthButton from "./AuthButton";

const UPDATE_HISTORY = [
  { date: "2026.01.30", title: "모바일 UI 대규모 개편", desc: "메인 대시보드, 식단, 그래프 페이지 모바일 최적화 완료. 아이폰 SE 대응." },
  { date: "2026.01.29", title: "관리자 기능 추가", desc: "커뮤니티 관리자 모드 (삭제된 글 복구/영구삭제) 기능 탑재." },
  { date: "2026.01.28", title: "RPE & 원판 계산기", desc: "1RM 기반 RPE 계산기 및 바벨 원판 조합 계산기 기능 추가." },
  { date: "2026.01.27", title: "성장 그래프 업데이트", desc: "3대 운동 1RM 추이 그래프 및 PL 포인트(Dots, Wilks) 자동 계산 적용." },
  { date: "2026.01.20", title: "서비스 베타 오픈", desc: "GYM RAT 웹 서비스 배포 시작." },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);

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

      <aside className={`
        bg-zinc-900 text-white flex flex-col border-r border-zinc-800 
        h-[100dvh] md:h-screen
        /* [수정 1] overflow-hidden으로 변경 (전체 스크롤 방지) */
        overflow-hidden transition-all duration-300 ease-in-out z-[70]
        fixed inset-y-0 left-0 w-64 
        ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        
        md:translate-x-0 md:static md:sticky md:top-0 md:shrink-0
        md:w-20 md:hover:w-64 
        group/sidebar
        
        xl:w-64 xl:hover:w-64
      `}>
        
        {/* 상단 로고 (고정) */}
        <div className="flex items-center justify-between p-6 h-20 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 min-w-[2rem] bg-lime-500 rounded-lg flex items-center justify-center font-black text-black italic shrink-0">G</div>
            <span className="text-xl font-black italic tracking-tighter uppercase text-white opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 xl:opacity-100 delay-75">
              GYM RAT
            </span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-zinc-500 hover:text-white">
            <FaTimes size={24} />
          </button>
        </div>

        {/* [수정 2] 메뉴 영역에만 overflow-y-auto 적용 (여기만 스크롤됨) */}
        <nav className="flex-1 px-3 space-y-2 w-full overflow-y-auto custom-scrollbar">
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

        {/* 하단 버튼 (고정) */}
        <div className="p-4 pb-8 md:pb-4 border-t border-zinc-800 shrink-0 flex flex-col gap-2 bg-zinc-900">
          <button 
            onClick={() => setShowUpdates(true)}
            className="w-full flex items-center gap-3 p-2 rounded-lg text-zinc-500 hover:text-lime-500 hover:bg-zinc-800 transition-all text-xs font-bold md:justify-center md:group-hover/sidebar:justify-start xl:justify-start"
          >
            <FaHistory size={14} className="shrink-0" />
            <span className="md:hidden md:group-hover/sidebar:block xl:block truncate">Update Log</span>
          </button>

          <div className="md:hidden md:group-hover/sidebar:block xl:block">
            <AuthButton />
          </div>
          <div className="hidden md:block md:group-hover/sidebar:hidden xl:hidden text-center text-zinc-500 text-xs">
            Auth
          </div>
        </div>
      </aside>

      {/* 모달 (기존 동일) */}
      {showUpdates && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowUpdates(false)}>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-xl font-black italic text-white flex items-center gap-2">
                <FaHistory className="text-lime-500"/> PATCH NOTES
              </h3>
              <button onClick={() => setShowUpdates(false)} className="text-zinc-500 hover:text-white"><FaTimes/></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {UPDATE_HISTORY.map((log, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-zinc-800 last:border-0 pb-1">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-lime-500 ring-4 ring-zinc-900"></div>
                  <span className="text-[10px] font-black text-zinc-500 mb-1 block">{log.date}</span>
                  <h4 className="text-sm font-bold text-white mb-1">{log.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{log.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-950">
              <button onClick={() => setShowUpdates(false)} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}