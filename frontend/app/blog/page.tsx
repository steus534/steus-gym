"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import CommentSection from "../components/CommentSection";
import BookmarkBtn from "../components/BookmarkBtn";
import { supabase } from "@/lib/supabase";
import { FaComment, FaArchive, FaPen, FaTimes, FaEye, FaHeart, FaRegHeart, FaTrash, FaEdit, FaSync, FaBookmark } from "react-icons/fa";

// 썸네일 추출 함수 (유튜브 또는 이미지)
function extractThumbnail(content: string): string | null {
  if (!content) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];
  for (const url of urls) {
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)/i) || url.includes("supabase.co/storage")) return url;
    if (url.match(/youtu/)) {
      const vId = url.match(/(?:v=|be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (vId) return `https://img.youtube.com/vi/${vId}/mqdefault.jpg`;
    }
  }
  return null;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 모달 관련 상태
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isPostLoading, setIsPostLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u ?? null);
    if (u) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", u.id).single();
      if (profile?.role === "admin") setIsAdmin(true);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching posts:", error);
    setPosts(data ?? []);
    setLoading(false);
  };

  // 게시글 상세 열기 (모달)
  const openPost = async (postId: string) => {
    if (isPostLoading) return;
    setIsPostLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, post_likes(*)")
        .eq("id", postId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setSelectedPost(data);
        setShowModal(true);
        // 조회수 증가 (백그라운드)
        if (!data.is_deleted) {
          await supabase.from("posts").update({ views: (data.views || 0) + 1 }).eq("id", postId);
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, views: (p.views || 0) + 1 } : p));
        }
      }
    } catch (err) {
      console.error("게시글 로딩 에러:", err);
      alert("게시글을 불러오는데 실패했습니다.");
    } finally {
      setIsPostLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
  };

  const toggleLike = async () => {
    if (!user || !selectedPost) return alert("로그인 후 좋아요를 누를 수 있습니다.");
    const existingLike = selectedPost.post_likes?.find((l: any) => l.user_id === user.id);
    
    if (existingLike) {
      await supabase.from("post_likes").delete().eq("id", existingLike.id);
    } else {
      await supabase.from("post_likes").insert([{ post_id: selectedPost.id, user_id: user.id }]);
    }
    
    const { data } = await supabase.from("posts").select("*, post_likes(*)").eq("id", selectedPost.id).single();
    if (data) setSelectedPost(data);
  };

  const deletePost = async () => {
    if (!selectedPost || !confirm("게시글을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("posts").update({ is_deleted: true }).eq("id", selectedPost.id);
    if (error) {
      alert("삭제 실패: 권한이 없습니다.");
      return;
    }
    closeModal();
    fetchPosts();
  };

  const renderContent = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split("\n").map((line, i) => (
      <p key={i} className="mb-4 break-all leading-relaxed">
        {line.split(urlRegex).map((part, j) => {
          if (!part) return null;
          if (part.match(/youtu/)) {
            const vId = part.match(/(?:v=|be\/)([a-zA-Z0-9_-]{11})/)?.[1];
            return (
              <span key={j} className="block my-6 aspect-video rounded-3xl overflow-hidden border border-zinc-800">
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${vId}`} allowFullScreen />
              </span>
            );
          }
          if (part.match(/\.(png|jpg|jpeg|gif|webp|svg)/i) || part.includes("supabase.co/storage"))
            return <img key={j} src={part} className="block w-full rounded-3xl my-6 shadow-2xl" alt="" />;
          if (part.match(urlRegex))
            return (
              <a key={j} href={part} target="_blank" rel="noreferrer" className="text-lime-500 underline font-bold">
                {part}
              </a>
            );
          return <span key={j}>{part}</span>;
        })}
      </p>
    ));
  };

  const isLiked = selectedPost?.post_likes?.some((l: any) => l.user_id === user?.id);
  const canEdit = isAdmin || (user && selectedPost?.author_id === user.id);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar relative">
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
          <div className="mt-14 md:mt-0 flex flex-wrap justify-between items-end gap-4 border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-4xl font-black italic text-lime-500 uppercase tracking-tighter">Blog</h1>
              <p className="text-zinc-500 font-bold mt-2">운동인들의 소통 공간</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchPosts}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white transition-colors text-xs font-bold"
                title="새로고침"
              >
                <FaSync className={loading ? "animate-spin" : ""} />
              </button>
              {isAdmin && (
                <Link
                  href="/admin/new"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime-500 text-black hover:bg-lime-400 text-xs font-bold transition-colors"
                >
                  <FaPen size={14} /> 새 글 작성
                </Link>
              )}
              <Link
                href="/blog/deleted"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-lime-500 hover:border-lime-500/50 text-xs font-bold transition-colors"
              >
                <FaArchive size={14} /> 삭제된 게시물
              </Link>
              <Link
                href="/my/bookmarks"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-lime-500 hover:border-lime-500/50 text-xs font-bold transition-colors"
              >
                <FaBookmark size={14} /> 북마크한 글
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500 font-black animate-pulse uppercase tracking-widest">Loading Posts...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => {
                const thumbnail = extractThumbnail(post.content);
                return (
                  <button
                    key={post.id}
                    onClick={() => openPost(post.id)}
                    disabled={isPostLoading}
                    className="relative flex flex-col p-0 rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-lime-500/50 transition-all group text-left shadow-lg hover:shadow-lime-500/5"
                  >
                    {thumbnail ? (
                      <div className="w-full h-48 bg-zinc-800 overflow-hidden relative">
                        <img src={thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent opacity-60" />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-zinc-800/30 flex items-center justify-center italic text-zinc-700 font-black uppercase text-xl tracking-tighter">No Thumbnail</div>
                    )}
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xl font-black text-white group-hover:text-lime-500 transition-colors line-clamp-1">
                          {post.title}
                        </h3>
                        <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-black uppercase shrink-0">{post.category}</span>
                      </div>
                      <p className="text-sm text-zinc-500 font-medium line-clamp-2 leading-relaxed">{post.content}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                        <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-black uppercase tracking-tight">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><FaEye size={10} /> {post.views || 0}</span>
                          <span className="flex items-center gap-1"><FaComment size={10} /> {post.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {posts.length === 0 && (
                <div className="col-span-full text-center py-32 text-zinc-700 font-black italic uppercase text-2xl tracking-tighter opacity-50">No Posts Found</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 게시글 상세 모달 */}
      {showModal && selectedPost && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md pointer-events-auto"
          onClick={closeModal}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="p-6 md:px-10 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0">
              <div className="flex items-center gap-2">
                <span className="bg-lime-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{selectedPost.category}</span>
                {selectedPost.difficulty && (
                  <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{selectedPost.difficulty}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* 북마크 버튼 추가 */}
                <BookmarkBtn postId={selectedPost.id} currentUser={user} />
                
                {canEdit && (
                  <>
                    <Link
                      href={`/admin/${selectedPost.id}/edit`}
                      className="p-2.5 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all shadow-lg"
                      title="게시글 수정"
                    >
                      <FaEdit size={16} />
                    </Link>
                    <button
                      onClick={deletePost}
                      className="p-2.5 bg-zinc-800 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-zinc-700 transition-all shadow-lg"
                      title="게시글 삭제"
                    >
                      <FaTrash size={16} />
                    </button>
                  </>
                )}
                <button onClick={closeModal} className="text-zinc-500 hover:text-white p-2.5 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-all shadow-lg ml-2">
                  <FaTimes size={18} />
                </button>
              </div>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar flex-1 bg-zinc-900">
              <article>
                <header className="mb-10">
                  <h1 className="text-3xl md:text-4xl font-black mb-6 leading-[1.1] tracking-tight text-white">{selectedPost.title}</h1>
                  <div className="flex flex-wrap items-center gap-6 text-zinc-500 font-black text-[10px] uppercase tracking-tighter border-y border-zinc-800/50 py-4">
                    <span className="flex items-center gap-2">
                      DATE: {new Date(selectedPost.created_at).toLocaleString("ko-KR", {
                        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-2">
                      VIEWS: <span className="text-zinc-300">{selectedPost.views}</span>
                    </span>
                    <button
                      type="button"
                      onClick={toggleLike}
                      className={`flex items-center gap-2 transition-colors px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 ${isLiked ? "text-red-500" : "text-zinc-400 hover:text-red-500"}`}
                    >
                      {isLiked ? <FaHeart /> : <FaRegHeart />} 
                      <span className="text-zinc-300">{selectedPost.post_likes?.length || 0}</span>
                    </button>
                  </div>
                </header>

                <div className="text-zinc-300 text-lg leading-relaxed mb-16">
                  {renderContent(selectedPost.content)}
                </div>

                {/* 댓글 섹션 */}
                <div className="bg-zinc-950/30 rounded-[2rem] p-6 md:p-8 border border-zinc-800/50">
                  <CommentSection postId={selectedPost.id} currentUser={user} isAdmin={isAdmin} />
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
      
      {/* 로딩 인디케이터 (게시글 열 때) */}
      {isPostLoading && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
