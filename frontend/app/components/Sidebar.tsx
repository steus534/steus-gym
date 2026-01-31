"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome, FaChartLine, FaTable, FaBook, FaCircleNotch,
  FaUtensils, FaHeartbeat, FaEdit, FaChevronRight, FaBars, FaTimes, FaHistory,
  FaPlus, FaPen, FaTrash, FaBookmark
} from "react-icons/fa";
import AuthButton from "./AuthButton";
import { supabase } from "@/lib/supabase";

const FONT_SIZE_MIN = 1;
const FONT_SIZE_MAX = 30;
const FONT_SIZE_DEFAULT = 11;

export type UpdateLogEntry = {
  id: string;
  title: string;
  desc: string;
  font_size: number;
  created_at: string;
};

function toFontSize(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < FONT_SIZE_MIN || n > FONT_SIZE_MAX) return FONT_SIZE_DEFAULT;
  return Math.round(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [logs, setLogs] = useState<UpdateLogEntry[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", desc: "", font_size: FONT_SIZE_DEFAULT });

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from("update_logs")
      .select("id, title, desc, font_size, created_at")
      .order("created_at", { ascending: false });
    setLogs((data as UpdateLogEntry[]) ?? []);
  }, []);

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    
    if (error) {
      console.error("관리자 확인 중 에러:", error);
    }
    console.log("현재 프로필 정보:", profile);
    
    setIsAdmin(profile?.role === "admin");
  }, []);

  useEffect(() => {
    if (showUpdates) {
      setLoading(true);
      Promise.all([fetchLogs(), checkAdmin()]).finally(() => setLoading(false));
    }
  }, [showUpdates, fetchLogs, checkAdmin]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ title: "", desc: "", font_size: FONT_SIZE_DEFAULT });
    setShowAddForm(true);
  };
  const openEdit = (log: UpdateLogEntry) => {
    setShowAddForm(false);
    setEditingId(log.id);
    setForm({ title: log.title, desc: log.desc, font_size: toFontSize(log.font_size) });
  };
  const cancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setForm({ title: "", desc: "", font_size: FONT_SIZE_DEFAULT });
  };

  const submitAdd = async () => {
    if (!form.title.trim()) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("로그인이 필요합니다.");
        return;
      }

      // 작성 전 관리자 권한 최종 확인 (디버깅용)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      
      console.log("작성 직전 권한 체크:", profile);

      const insertData = {
        title: form.title.trim(),
        desc: form.desc.trim(),
        font_size: form.font_size,
      };

      const { data, error } = await supabase
        .from("update_logs")
        .insert([insertData])
        .select();

      if (error) {
        console.error("패치노트 작성 에러 전체:", error);
        const errorMsg = JSON.stringify(error, null, 2);
        alert(`작성 실패\n\n에러 내용: ${error.message}\n코드: ${error.code}\n상세: ${errorMsg}`);
        return;
      }
      
      console.log("작성 성공 데이터:", data);
      await fetchLogs();
      cancelForm();
    } catch (err: any) {
      console.error("시스템 에러:", err);
      alert(`시스템 오류: ${err.message || "알 수 없는 오류"}`);
    }
  };

  const submitEdit = async () => {
    if (!editingId || !form.title.trim()) return;
    const { error } = await supabase
      .from("update_logs")
      .update({ title: form.title.trim(), desc: form.desc.trim(), font_size: form.font_size })
      .eq("id", editingId);
    
    if (error) {
      console.error("패치노트 수정 에러 상세:", error);
      alert(`수정 실패: ${error.message}`);
      return;
    }
    
    await fetchLogs();
    cancelForm();
  };

  const deleteLog = async (id: string) => {
    if (!confirm("이 업데이트 로그를 삭제할까요?")) return;
    const { error } = await supabase.from("update_logs").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    await fetchLogs();
    if (editingId === id) cancelForm();
  };

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
    { name: "블로그", path: "/blog", icon: <FaEdit /> },
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
        overflow-hidden transition-all duration-300 ease-in-out z-[70]
        fixed inset-y-0 left-0 w-64 
        ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        
        md:translate-x-0 md:static md:sticky md:top-0 md:shrink-0
        md:w-20 md:hover:w-64 
        group/sidebar
        
        xl:w-64 xl:hover:w-64
      `}>

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

      {showUpdates && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowUpdates(false)}>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-xl font-black italic text-white flex items-center gap-2">
                <FaHistory className="text-lime-500" /> PATCH NOTES
              </h3>
              <button onClick={() => setShowUpdates(false)} className="text-zinc-500 hover:text-white"><FaTimes /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {loading ? (
                <p className="text-zinc-500 text-sm">로딩 중...</p>
              ) : (
                <>
                  {isAdmin && (
                    <div className="flex gap-2">
                      {!showAddForm && !editingId && (
                        <button
                          onClick={openAdd}
                          className="flex items-center gap-2 px-4 py-2.5 bg-lime-500 text-black font-black rounded-xl text-xs hover:bg-lime-400 transition-colors"
                        >
                          <FaPlus size={12} /> 로그 추가
                        </button>
                      )}
                    </div>
                  )}

                  {(showAddForm || editingId) && (
                    <div className="p-4 rounded-2xl border border-zinc-700 bg-zinc-950 space-y-3">
                      <h4 className="text-sm font-bold text-white">{editingId ? "수정" : "새 로그"}</h4>
                      <input
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="제목"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:border-lime-500 outline-none"
                      />
                      <textarea
                        value={form.desc}
                        onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                        placeholder="내용"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:border-lime-500 outline-none resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">텍스트 크기:</span>
                        <select
                          value={form.font_size}
                          onChange={e => setForm(f => ({ ...f, font_size: toFontSize(e.target.value) }))}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs border border-zinc-700 focus:border-lime-500 outline-none"
                        >
                          {Array.from({ length: FONT_SIZE_MAX - FONT_SIZE_MIN + 1 }, (_, i) => FONT_SIZE_MIN + i).map(n => (
                            <option key={n} value={n}>{n}px</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={editingId ? submitEdit : submitAdd}
                          className="px-4 py-2 bg-lime-500 text-black font-bold rounded-xl text-xs hover:bg-lime-400"
                        >
                          {editingId ? "저장" : "추가"}
                        </button>
                        <button onClick={cancelForm} className="px-4 py-2 bg-zinc-700 text-white font-bold rounded-xl text-xs hover:bg-zinc-600">
                          취소
                        </button>
                      </div>
                    </div>
                  )}

                  {logs.length === 0 && !showAddForm && !editingId && (
                    <p className="text-zinc-500 text-sm">등록된 업데이트가 없습니다.</p>
                  )}
                  {logs.map((log) => {
                    if (editingId === log.id) return null;
                    return (
                      <div key={log.id} className="relative pl-6 border-l-2 border-zinc-800 last:border-0 pb-1">
                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-lime-500 ring-4 ring-zinc-900" />
                        <span className="text-[10px] font-black text-zinc-500 mb-1 block">{formatDate(log.created_at)}</span>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-white mb-1" style={{ fontSize: `${toFontSize(log.font_size)}px` }}>{log.title}</h4>
                          {isAdmin && (
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => openEdit(log)} className="p-1.5 text-zinc-500 hover:text-lime-500 rounded-lg" title="수정"><FaPen size={12} /></button>
                              <button onClick={() => deleteLog(log.id)} className="p-1.5 text-zinc-500 hover:text-red-500 rounded-lg" title="삭제"><FaTrash size={12} /></button>
                            </div>
                          )}
                        </div>
                        <p className="text-zinc-400 leading-relaxed" style={{ fontSize: `${toFontSize(log.font_size)}px` }}>{log.desc}</p>
                      </div>
                    );
                  })}
                </>
              )}
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
