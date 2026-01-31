"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { supabase } from "@/lib/supabase";
import { FaBookmark, FaEye, FaComment, FaArrowLeft } from "react-icons/fa";

export default function MyBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);

      if (u) {
        // bookmarks와 posts를 조인하여 가져옴
        const { data, error } = await supabase
          .from("bookmarks")
          .select(`
            id,
            created_at,
            post:posts (
              id,
              title,
              content,
              views,
              created_at,
              category,
              is_deleted
            )
          `)
          .eq("user_id", u.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching bookmarks:", error);
        } else {
          setBookmarks(data ?? []);
        }
      }
    } catch (err) {
      console.error("fetchBookmarks error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
          <div className="mt-14 md:mt-0 flex flex-col gap-2 border-b border-zinc-800 pb-6">
            <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-2 font-black text-xs uppercase transition-all">
              <FaArrowLeft /> 블로그로 돌아가기
            </Link>
            <h1 className="text-4xl font-black italic text-lime-500 uppercase tracking-tighter flex items-center gap-3">
              <FaBookmark className="text-2xl" /> My Bookmarks
            </h1>
            <p className="text-zinc-500 font-bold">내가 저장한 게시글 목록</p>
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500 font-black animate-pulse uppercase tracking-widest">
              Loading Bookmarks...
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-32 space-y-6 bg-zinc-900/20 rounded-[3rem] border border-zinc-800/50">
              <div className="flex justify-center text-zinc-800">
                <FaBookmark size={80} />
              </div>
              <p className="text-zinc-500 font-black italic text-2xl tracking-tighter uppercase">
                저장한 글이 없습니다
              </p>
              <Link
                href="/blog"
                className="inline-block px-8 py-4 bg-lime-500 text-black font-black rounded-2xl hover:bg-lime-400 transition-all uppercase tracking-tighter"
              >
                블로그 보러가기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookmarks.map((item) => {
                const post = item.post;
                if (!post || post.is_deleted) return null;

                return (
                  <Link
                    key={item.id}
                    href={`/blog/${post.id}`}
                    className="relative flex flex-col p-6 rounded-[2.5rem] border border-zinc-800 bg-zinc-900 hover:border-lime-500/50 transition-all group text-left shadow-lg hover:shadow-lime-500/5"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xl font-black text-white group-hover:text-lime-500 transition-colors line-clamp-1">
                          {post.title}
                        </h3>
                        <span className="text-[10px] bg-zinc-800 px-3 py-1 rounded-full text-zinc-400 font-black uppercase shrink-0 tracking-widest">
                          {post.category}
                        </span>
                      </div>
                      
                      <p className="text-sm text-zinc-500 font-medium line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                        <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-black uppercase tracking-tight">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-2">
                            <FaEye size={12} /> {post.views || 0}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-700 font-black italic">
                          BOOKMARKED AT {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
