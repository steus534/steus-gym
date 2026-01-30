"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FaHome, FaChartLine, FaTable, FaBook, FaCircleNotch, 
  FaUtensils, FaHeartbeat, FaEdit, FaChevronRight 
} from "react-icons/fa";
import AuthButton from "./AuthButton";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    { name: "메인 (스펙분석)", path: "/", icon: <FaHome /> },
    { 
      name: "식단 가이드", 
      path: "/diet", // 그룹 경로
      icon: <FaUtensils />,
      sub: [
        { name: "영양소 정보", path: "/diet/info" },
        { name: "식단 기록", path: "/diet/log" }
      ]
    },
    { name: "성장 그래프", path: "/history", icon: <FaChartLine /> },
    { name: "블로그", path: "/admin", icon: <FaEdit /> },
    { name: "프로그램 가이드", path: "/programs", icon: <FaBook /> },
    { name: "유산소 가이드", path: "/cardio", icon: <FaHeartbeat /> },
    { name: "RPE 계산기", path: "/rpe", icon: <FaTable /> },
    { name: "원판 계산기", path: "/plate-calc", icon: <FaCircleNotch /> },
  ];

  return (
    <aside className="w-64 bg-zinc-900 text-white flex flex-col p-4 border-r border-zinc-800 sticky top-0 h-screen shrink-0 overflow-y-auto custom-scrollbar">
      <div className="mb-8 mt-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center font-black text-black italic">G</div>
          <span className="text-xl font-black italic tracking-tighter uppercase text-white">GYM RAT</span>
        </div>
      </div>

      <nav className="space-y-2 w-full flex-1">
        {menu.map((item) => {
          // 홈('/')은 정확히 일치할 때만, 나머지는 해당 경로로 시작할 때 활성화
          const isActive = item.path === "/" 
            ? pathname === "/" 
            : pathname.startsWith(item.path);

          return (
            <div key={item.path} className="group relative">
              <Link 
                href={item.sub ? item.sub[0].path : item.path} 
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  isActive 
                    ? "bg-lime-500 text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-bold">{item.name}</span>
                </div>
                {item.sub && (
                  <FaChevronRight className={`text-[10px] transition-transform opacity-50 ${isActive ? "rotate-90" : "group-hover:rotate-90"}`} />
                )}
              </Link>

              {/* 하위 메뉴: 식단 가이드 아래에만 노출 */}
              {item.sub && (
                <div className={`pl-12 mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 ${isActive ? "block" : "hidden group-hover:block"}`}>
                  {item.sub.map((s) => (
                    <Link 
                      key={s.path} 
                      href={s.path} 
                      className={`block p-2 text-sm font-bold rounded-lg transition-colors ${
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

      <div className="mt-4 border-t border-zinc-800 pt-4">
        <AuthButton />
      </div>
    </aside>
  );
}