"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "../../components/Sidebar";
import Link from "next/link";
import { FaArrowLeft, FaEye, FaHeart, FaRegHeart, FaTrash, FaPen, FaComment, FaUndo } from "react-icons/fa";

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [commentInput, setCommentInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user));
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase.from('posts').select('*, comments(*), post_likes(*)').eq('id', id).single();
      if (data) {
        setPost(data);
        if (!data.is_deleted) await supabase.from('posts').update({ views: (data.views || 0) + 1 }).eq('id', id);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user) return alert("로그인 하셈");
    const existingLike = post?.post_likes?.find((l: any) => l.user_id === user.id);
    if (existingLike) await supabase.from('post_likes').delete().eq('id', existingLike.id);
    else await supabase.from('post_likes').insert([{ post_id: id, user_id: user.id }]);
    fetchPost();
  };

  const renderContent = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split('\n').map((line, i) => (
      <p key={i} className="mb-4 break-all leading-relaxed">
        {line.split(urlRegex).map((part, j) => {
          if (!part) return null;
          if (part.match(/youtu/)) {
            const vId = part.match(/(?:v=|be\/)([a-zA-Z0-9_-]{11})/)?.[1];
            return <span key={j} className="block my-6 aspect-video rounded-3xl overflow-hidden border border-zinc-800"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${vId}`} allowFullScreen></iframe></span>;
          }
          if (part.match(/\.(png|jpg|jpeg|gif|webp|svg)/i) || part.includes('supabase.co/storage')) return <img key={j} src={part} className="block w-full rounded-3xl my-6 shadow-2xl" alt="c" />;
          if (part.match(urlRegex)) return <a key={j} href={part} target="_blank" className="text-lime-500 underline font-bold">{part}</a>;
          return <span key={j}>{part}</span>;
        })}
      </p>
    ));
  };

  if (loading) return <div className="flex min-h-screen bg-zinc-950 items-center justify-center text-zinc-500 font-black italic animate-pulse">LOADING...</div>;
  if (!post) return <div className="flex min-h-screen bg-zinc-950 items-center justify-center text-zinc-500">Post not found.</div>;

  const isLiked = post.post_likes?.some((l: any) => l.user_id === user?.id);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-8 h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 font-black text-xs uppercase transition-all"><FaArrowLeft/> BACK TO LIST</button>
          
          <article className={`bg-zinc-900/40 p-10 md:p-16 rounded-[4rem] border transition-all shadow-2xl ${post.is_deleted ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-800/50'}`}>
            <div className="flex justify-end gap-3 mb-8">
               {post.is_deleted ? (
                 <button onClick={async () => { await supabase.from('posts').update({ is_deleted: false }).eq('id', id); fetchPost(); }} className="px-5 py-2.5 bg-lime-500 text-black font-black rounded-2xl text-xs"><FaUndo/> 복구하기</button>
               ) : (
                 <>
                   <Link href={`/admin/${id}/edit`} className="p-3 bg-zinc-800 rounded-xl text-blue-500 hover:bg-zinc-700"><FaPen size={14}/></Link>
                   <button onClick={async () => { if(confirm("삭제?")) { await supabase.from('posts').update({ is_deleted: true }).eq('id', id); router.push('/admin'); } }} className="p-3 bg-zinc-800 rounded-xl text-red-500 hover:bg-zinc-700"><FaTrash size={14}/></button>
                 </>
               )}
            </div>
            
            <header className="mb-12">
              <div className="flex gap-2 mb-4">
                <span className="bg-lime-500 text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase">{post.category}</span>
                {post.difficulty && <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">{post.difficulty}</span>}
              </div>
              <h1 className="text-4xl font-black mb-4 leading-tight">{post.title} {post.is_deleted && "(삭제됨)"}</h1>
              
              {/* 작성 시점 병기 */}
              <div className="flex items-center gap-6 text-zinc-500 font-black text-[10px] uppercase tracking-tighter">
                <span>{new Date(post.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="flex items-center gap-1.5"><FaEye/> {post.views}</span>
                <button onClick={toggleLike} className={`flex items-center gap-1.5 transition-all ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                  {isLiked ? <FaHeart/> : <FaRegHeart/>} {post.post_likes?.length || 0}
                </button>
              </div>
            </header>

            <div className="text-zinc-300 text-lg border-t border-zinc-800/50 pt-12">{renderContent(post.content)}</div>
            
            {/* 댓글 영역 생략(기존 유지) */}
          </article>
        </div>
      </main>
    </div>
  );
}