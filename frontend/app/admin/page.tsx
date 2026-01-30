"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "../components/Sidebar";
import Link from "next/link";
import { FaPlus, FaSearch, FaThumbtack, FaEye, FaHeart, FaGhost, FaDumbbell } from "react-icons/fa";

const CATEGORIES = ["전체", "공지", "운동", "식단", "장비", "일반"];
const DIFFICULTIES = ["전체", "초급자", "중급자", "고급자"];

export default function AdminListPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("전체");
  const [selectedDiff, setSelectedDiff] = useState("전체");
  const [showDeleted, setShowDeleted] = useState(false); 

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*, post_likes(*)').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const processedPosts = useMemo(() => {
    let list = [...posts];
    list = list.filter(p => p.is_deleted === showDeleted);
    // [교차 필터링] 기존 카테고리 + 난이도
    if (selectedCat !== "전체") list = list.filter(p => p.category === selectedCat);
    if (selectedDiff !== "전체") list = list.filter(p => p.difficulty === selectedDiff);
    if (search) list = list.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
    
    list.sort((a, b) => (a.is_pinned === b.is_pinned ? 0 : a.is_pinned ? -1 : 1));
    return list;
  }, [posts, selectedCat, selectedDiff, search, showDeleted]);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-black italic text-lime-500 uppercase tracking-tighter">Admin Blog</h1>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleted(!showDeleted)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${showDeleted ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                <FaGhost/> {showDeleted ? "삭제 글 모드" : "삭제 글 보기"}
              </button>
              <Link href="/admin/new" className="bg-lime-500 text-black px-6 py-3 rounded-2xl font-black text-xs hover:bg-white transition-all">새 포스트 작성</Link>
            </div>
          </header>

          <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800 mb-12 space-y-4">
            <div className="relative w-full">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 pl-12 text-sm outline-none focus:border-lime-500 transition-all" />
            </div>
            
            {/* 기본 카테고리 바 */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setSelectedCat(c)} className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${selectedCat === c ? "bg-lime-500 text-black" : "bg-black text-zinc-500 border border-zinc-800"}`}>{c}</button>
              ))}
            </div>

            {/* 난이도 카테고리 바 */}
            <div className="flex gap-2 overflow-x-auto">
              <span className="text-[10px] font-black text-zinc-600 self-center mr-2 uppercase tracking-tighter">Difficulty :</span>
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setSelectedDiff(d)} className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${selectedDiff === d ? "bg-blue-500 text-white" : "bg-black text-zinc-700 border border-zinc-900"}`}>{d}</button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {processedPosts.map(post => (
              <Link key={post.id} href={`/admin/${post.id}`} className={`block bg-zinc-900/30 p-6 rounded-3xl border transition-all ${post.is_deleted ? 'border-red-500/30 bg-red-500/5' : post.is_pinned ? 'border-lime-500/30 bg-lime-500/5' : 'border-zinc-800/50 hover:border-zinc-600'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {post.is_pinned && <FaThumbtack className="text-lime-500 rotate-45" />}
                    <div className="flex gap-1.5">
                      <span className="bg-zinc-800 px-2 py-0.5 rounded text-[8px] font-black text-zinc-500 uppercase">{post.category}</span>
                      <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[8px] font-black text-blue-400 uppercase">{post.difficulty}</span>
                    </div>
                    <h2 className="text-lg font-black text-zinc-300">{post.title}</h2>
                  </div>
                  <div className="flex gap-6 text-[10px] text-zinc-600 font-black">
                    <span className="flex items-center gap-1.5"><FaEye/> {post.views || 0}</span>
                    <span className="flex items-center gap-1.5 text-red-500/70"><FaHeart/> {post.post_likes?.length || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}