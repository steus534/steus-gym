"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar"; 
import { supabase } from "@/lib/supabase";
import { FaTrash, FaComment, FaUndo, FaBurn } from "react-icons/fa";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. 현재 유저 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setCurrentUserId(user.id);
      // 2. 관리자 권한 체크
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
    }

    // 3. 게시글 가져오기 (RLS 정책에 의해 일반 유저는 삭제된 글 자동 필터링됨)
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching posts:", error);
    if (data) setPosts(data);
    
    setLoading(false);
  };

  // [기능 1] 소프트 삭제 (일반 유저/관리자 공용) -> 휴지통으로 보냄
  const softDelete = async (id: string) => {
    if (!confirm("게시글을 삭제하시겠습니까? (관리자는 복구 가능)")) return;
    
    const { error } = await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) {
      alert("삭제 실패: 본인 글만 삭제할 수 있습니다.");
    } else {
      fetchData(); // 목록 새로고침
    }
  };

  // [기능 2] 복구 (관리자 전용) -> 다시 일반 글로 되돌림
  const restorePost = async (id: string) => {
    if (!confirm("♻️ 이 게시글을 복구하시겠습니까?")) return;

    const { error } = await supabase
      .from('posts')
      .update({ is_deleted: false })
      .eq('id', id);

    if (error) {
      alert("복구 실패: 권한이 부족합니다."); 
      console.error(error);
    } else {
      alert("게시글이 복구되었습니다.");
      fetchData();
    }
  };

  // [기능 3] 영구 삭제 (관리자 전용) -> DB에서 진짜 삭제
  const hardDelete = async (id: string) => {
    if (!confirm("🔥 경고: DB에서 영구 삭제됩니다. 절대 복구 불가능합니다.")) return;
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      alert("영구 삭제 실패: 권한이 부족합니다.");
      console.error(error);
    } else {
      alert("DB에서 영구 삭제되었습니다.");
      fetchData();
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
          
          <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-4xl font-black italic text-lime-500 uppercase tracking-tighter">Community</h1>
              <p className="text-zinc-500 font-bold mt-2">운동인들의 소통 공간 (Admin Mode: {isAdmin ? "ON" : "OFF"})</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500 font-black animate-pulse">LOADING...</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const isDeleted = post.is_deleted; // 삭제 여부
                const isMyPost = currentUserId === post.user_id; // 내 글인지 확인

                return (
                  <div 
                    key={post.id} 
                    className={`relative p-6 rounded-3xl border transition-all group ${
                      isDeleted 
                        ? "bg-red-950/20 border-red-900/50 hover:border-red-500" // 삭제된 글 스타일
                        : "bg-zinc-900 border-zinc-800 hover:border-lime-500/50" // 일반 글 스타일
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          {/* 삭제 배지 */}
                          {isDeleted && (
                            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1 shadow-lg shadow-red-600/20">
                              <FaTrash size={8} /> DELETED
                            </span>
                          )}
                          <h3 className={`text-xl font-black ${isDeleted ? "text-zinc-500 line-through decoration-2 decoration-red-500" : "text-white"}`}>
                            {post.title}
                          </h3>
                        </div>
                        
                        <p className="text-sm text-zinc-400 font-bold line-clamp-2">
                          {isDeleted ? "(관리자에 의해 숨김 처리된 게시물입니다)" : post.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-zinc-500 font-bold mt-4">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><FaComment /> {post.comments_count || 0}</span>
                        </div>
                      </div>

                      {/* 버튼 컨트롤 영역 */}
                      <div className="flex flex-col gap-2 ml-4">
                        
                        {/* 1. 관리자일 때: 복구 및 영구 삭제 버튼 노출 */}
                        {isAdmin && isDeleted && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => restorePost(post.id)} 
                              className="px-3 py-2 bg-green-600/20 text-green-400 text-[10px] font-black rounded-lg hover:bg-green-600 hover:text-white transition-all border border-green-600/30 flex items-center gap-1"
                            >
                              <FaUndo size={10}/> 복구
                            </button>
                            <button 
                              onClick={() => hardDelete(post.id)} 
                              className="px-3 py-2 bg-red-600/20 text-red-400 text-[10px] font-black rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-600/30 flex items-center gap-1"
                            >
                              <FaBurn size={10}/> 영구 삭제
                            </button>
                          </div>
                        )}

                        {/* 2. 일반 삭제 버튼: 내 글이거나 관리자일 때 + 아직 삭제 안 된 글일 때 */}
                        {(isMyPost || isAdmin) && !isDeleted && (
                          <button 
                            onClick={() => softDelete(post.id)} 
                            className="p-2 text-zinc-600 hover:text-red-500 transition-colors self-end"
                            title="삭제하기"
                          >
                            <FaTrash />
                          </button>
                        )}

                      </div>
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