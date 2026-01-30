"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar"; // 경로 확인 필요
import { supabase } from "@/lib/supabase";
import { FaTrash, FaPen, FaComment, FaSearch, FaShieldAlt } from "react-icons/fa";
import Link from "next/link";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. 현재 로그인한 유저 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 2. 프로필에서 관리자(admin) 권한인지 체크
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
    }

    // 3. 게시글 가져오기 (RLS 덕분에 일반 유저는 삭제된 글 자동 필터링됨)
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setPosts(data);
    setLoading(false);
  };

  // 관리자용: 글 완전 삭제 (DB에서 영구 제거) 또는 복구 기능
  const hardDelete = async (id: string) => {
    if (!confirm("관리자 권한: DB에서 영구 삭제하시겠습니까? 복구 불가능합니다.")) return;
    await supabase.from('posts').delete().eq('id', id);
    fetchData();
  };

  const restorePost = async (id: string) => {
    if (!confirm("게시글을 복구하시겠습니까?")) return;
    await supabase.from('posts').update({ is_deleted: false }).eq('id', id);
    fetchData();
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
          
          <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-4xl font-black italic text-lime-500 uppercase tracking-tighter">Community</h1>
              <p className="text-zinc-500 font-bold mt-2">운동인들의 소통 공간</p>
            </div>
            {/* 글쓰기 버튼 등 추가 가능 */}
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500 font-black animate-pulse">LOADING...</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                // 삭제된 글인지 확인
                const isDeleted = post.is_deleted;

                return (
                  <div 
                    key={post.id} 
                    className={`relative p-6 rounded-3xl border transition-all group ${
                      isDeleted 
                        ? "bg-red-950/20 border-red-900/50" // 삭제된 글 스타일
                        : "bg-zinc-900 border-zinc-800 hover:border-lime-500/50" // 일반 글 스타일
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          {/* 삭제된 글 배지 (관리자만 보임) */}
                          {isDeleted && (
                            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1">
                              <FaTrash size={8} /> DELETED
                            </span>
                          )}
                          <h3 className={`text-xl font-black ${isDeleted ? "text-zinc-500 line-through decoration-2" : "text-white"}`}>
                            {post.title}
                          </h3>
                        </div>
                        
                        <p className="text-sm text-zinc-400 font-bold line-clamp-2">
                          {isDeleted ? "(관리자에 의해 삭제된 게시물입니다 내용 미리보기 제한)" : post.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-zinc-500 font-bold mt-4">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><FaComment /> {post.comments_count || 0}</span>
                        </div>
                      </div>

                      {/* 관리자 전용 컨트롤 패널 */}
                      {isAdmin && (
                        <div className="flex flex-col gap-2 ml-4">
                          {isDeleted ? (
                            <>
                              <button onClick={() => restorePost(post.id)} className="px-3 py-1.5 bg-green-600/20 text-green-400 text-[10px] font-black rounded-lg hover:bg-green-600 hover:text-white transition-all">
                                복구
                              </button>
                              <button onClick={() => hardDelete(post.id)} className="px-3 py-1.5 bg-red-600/20 text-red-400 text-[10px] font-black rounded-lg hover:bg-red-600 hover:text-white transition-all">
                                영구 삭제
                              </button>
                            </>
                          ) : (
                            <button onClick={() => {/* 소프트 삭제 로직 */}} className="text-zinc-600 hover:text-red-500 transition-colors">
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {posts.length === 0 && (
                <div className="text-center py-20 text-zinc-600 font-black italic">게시글이 없습니다.</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}