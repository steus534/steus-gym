"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";

interface BookmarkBtnProps {
  postId: string;
  currentUser: any;
}

export default function BookmarkBtn({ postId, currentUser }: BookmarkBtnProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      checkBookmarkStatus();
    } else {
      setLoading(false);
    }
  }, [postId, currentUser]);

  const checkBookmarkStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("post_id", postId)
        .maybeSingle();

      if (error) throw error;
      setIsBookmarked(!!data);
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentUser) {
      alert("로그인이 필요한 서비스입니다.");
      return;
    }

    const prevStatus = isBookmarked;
    setIsBookmarked(!prevStatus);

    try {
      if (prevStatus) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("post_id", postId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert([{ user_id: currentUser.id, post_id: postId }]);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Bookmark toggle error:", error);
      alert("북마크 처리 중 오류가 발생했습니다.");
      setIsBookmarked(prevStatus);
    }
  };

  if (loading) return <div className="w-8 h-8 animate-pulse bg-zinc-800 rounded-full" />;

  return (
    <button
      onClick={toggleBookmark}
      className={`p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center ${
        isBookmarked 
          ? "bg-lime-500 text-black hover:bg-lime-400" 
          : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
      }`}
      title={isBookmarked ? "북마크 취소" : "북마크 추가"}
    >
      {isBookmarked ? <FaBookmark size={16} /> : <FaRegBookmark size={16} />}
    </button>
  );
}
