"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Sidebar from "../../components/Sidebar";
import CommentSection from "../../components/CommentSection";
import BookmarkBtn from "../../components/BookmarkBtn";
import { FaArrowLeft, FaEye, FaHeart, FaRegHeart } from "react-icons/fa";

export default function BlogPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        if (profile?.role === "admin") setIsAdmin(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, post_likes(*)")
        .eq("id", id)
        .single();
      if (data) {
        setPost(data);
        if (!data.is_deleted) await supabase.from("posts").update({ views: (data.views || 0) + 1 }).eq("id", id);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user) return alert("로그인 후 좋아요를 누를 수 있습니다.");
    const existingLike = post?.post_likes?.find((l: any) => l.user_id === user.id);
    if (existingLike) await supabase.from("post_likes").delete().eq("id", existingLike.id);
    else await supabase.from("post_likes").insert([{ post_id: id, user_id: user.id }]);
    fetchPost();
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
          if (part.match(urlRegex)) return <a key={j} href={part} target="_blank" rel="noreferrer" className="text-lime-500 underline font-bold">{part}</a>;
          return <span key={j}>{part}</span>;
        })}
      </p>
    ));
  };

  if (loading) return <div className="flex min-h-screen bg-zinc-950 items-center justify-center text-zinc-500 font-black italic animate-pulse">LOADING...</div>;
  if (!post) return <div className="flex min-h-screen bg-zinc-950 items-center justify-center text-zinc-500">게시물을 찾을 수 없습니다.</div>;

  const isLiked = post.post_likes?.some((l: any) => l.user_id === user?.id);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto mt-14 md:mt-0">
          <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-8 font-black text-xs uppercase transition-all">
            <FaArrowLeft /> 블로그 목록
          </Link>

          <article className={`bg-zinc-900/40 p-8 md:p-12 rounded-[3rem] border transition-all shadow-2xl ${post.is_deleted ? "border-red-500/50 bg-red-500/5" : "border-zinc-800/50"}`}>
            <header className="mb-8">
              <div className="flex gap-2 mb-4">
                <span className="bg-lime-500 text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase">{post.category}</span>
                {post.difficulty && <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">{post.difficulty}</span>}
              </div>
              <h1 className="text-3xl font-black mb-4 leading-tight">{post.title} {post.is_deleted && "(삭제됨)"}</h1>
              <div className="flex items-center gap-6 text-zinc-500 font-black text-[10px] uppercase tracking-tighter">
                <span>{new Date(post.created_at).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="flex items-center gap-1.5"><FaEye /> {post.views}</span>
                <button type="button" onClick={toggleLike} className={`flex items-center gap-1.5 transition-colors ${isLiked ? "text-red-500" : "hover:text-red-500"}`}>
                  {isLiked ? <FaHeart /> : <FaRegHeart />} {post.post_likes?.length || 0}
                </button>
                <BookmarkBtn postId={String(id)} currentUser={user} />
              </div>
            </header>

            <div className="text-zinc-300 text-lg border-t border-zinc-800/50 pt-8">{renderContent(post.content)}</div>

            <CommentSection postId={String(id)} currentUser={user} isAdmin={isAdmin} onRefresh={fetchPost} />
          </article>
        </div>
      </main>
    </div>
  );
}
