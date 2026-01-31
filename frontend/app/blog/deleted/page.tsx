"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { supabase } from "@/lib/supabase";
import { FaTrash, FaComment, FaUndo, FaBurn, FaArrowLeft } from "react-icons/fa";

export default function BlogDeletedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "admin") setIsAdmin(true);
    }

    // 삭제된 글만 조회
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("is_deleted", true)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching deleted posts:", error);
    setPosts(data ?? []);
    setLoading(false);
  };

  const restorePost = async (id: string) => {
    if (!confirm("이 게시글을 복구하시겠습니까?")) return;
    const { error } = await supabase.from("posts").update({ is_deleted: false }).eq("id", id);
    if (error) {
      alert("복구 실패: 권한이 부족합니다.");
      console.error(error);
    } else {
      alert("게시글이 복구되었습니다.");
      fetchData();
    }
  };

  const hardDelete = async (id: string) => {
    if (!confirm("경고: DB에서 영구 삭제됩니다. 복구할 수 없습니다.")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      alert("영구 삭제 실패: 권한이 부족합니다.");
      console.error(error);
    } else {
      alert("DB에서 영구 삭제되었습니다.");
      fetchData();
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
          <div className="mt-14 md:mt-0 flex flex-wrap justify-between items-end gap-4 border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-4xl font-black italic text-red-500/90 uppercase tracking-tighter">삭제된 게시물</h1>
              <p className="text-zinc-500 font-bold mt-2">휴지통 (관리자만 복구/영구삭제 가능)</p>
            </div>
            <Link
              href="/blog"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-xs font-bold transition-colors"
            >
              <FaArrowLeft size={14} /> 블로그로 돌아가기
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500 font-black animate-pulse">LOADING...</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="relative p-6 rounded-3xl border border-red-900/50 bg-red-950/10 hover:border-red-500/50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1">
                          <FaTrash size={8} /> DELETED
                        </span>
                        <h3 className="text-xl font-black text-zinc-500 line-through decoration-2 decoration-red-500">
                          {post.title}
                        </h3>
                      </div>
                      <p className="text-sm text-zinc-500 font-bold line-clamp-2">
                        (삭제된 게시물) {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-zinc-500 font-bold mt-4">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><FaComment /> {post.comments_count || 0}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => restorePost(post.id)}
                          className="px-3 py-2 bg-green-600/20 text-green-400 text-[10px] font-black rounded-lg hover:bg-green-600 hover:text-white transition-all border border-green-600/30 flex items-center gap-1"
                        >
                          <FaUndo size={10} /> 복구
                        </button>
                        <button
                          onClick={() => hardDelete(post.id)}
                          className="px-3 py-2 bg-red-600/20 text-red-400 text-[10px] font-black rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-600/30 flex items-center gap-1"
                        >
                          <FaBurn size={10} /> 영구삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="text-center py-20 text-zinc-600 font-black italic">삭제된 게시물이 없습니다.</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
