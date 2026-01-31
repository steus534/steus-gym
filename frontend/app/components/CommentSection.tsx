"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaHeart, FaRegHeart, FaTrash, FaSync, FaReply, FaPen, FaTimes, FaCheck } from "react-icons/fa";

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  comment_likes?: { id: string; user_id: string }[];
  replies?: Comment[];
};

type Props = {
  postId: string;
  currentUser: { id: string } | null;
  isAdmin: boolean;
};

export default function CommentSection({ postId, currentUser, isAdmin }: Props) {
  // --- [상태 관리] ---
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  // --- [데이터 불러오기] ---
  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, comment_likes(id, user_id)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    
    const allComments = (data as Comment[]) ?? [];
    
    const topLevelComments = allComments.filter((c) => !c.parent_id);
    const repliesMap = new Map<string, Comment[]>();
    
    allComments.filter((c) => c.parent_id).forEach((reply) => {
      const parentId = reply.parent_id!;
      if (!repliesMap.has(parentId)) repliesMap.set(parentId, []);
      repliesMap.get(parentId)!.push(reply);
    });
    
    topLevelComments.forEach((comment) => {
      comment.replies = repliesMap.get(comment.id) || [];
    });
    
    setComments(topLevelComments);
  };

  useEffect(() => {
    setLoading(true);
    fetchComments().finally(() => setLoading(false));
  }, [postId]);

  // --- [기능 함수들] ---

  const addComment = async () => {
    if (!currentUser || !body.trim()) {
      if (!currentUser) alert("로그인 후 댓글을 작성할 수 있습니다.");
      return;
    }
    const { error } = await supabase.from("comments").insert([{ 
      post_id: postId, 
      user_id: currentUser.id, 
      content: body.trim(),
      parent_id: null
    }]);
    if (error) return alert(`작성 실패: ${error.message}`);
    setBody("");
    fetchComments();
  };

  const addReply = async (parentId: string) => {
    if (!currentUser || !replyBody.trim()) {
      if (!currentUser) alert("로그인 필요");
      return;
    }
    const { error } = await supabase.from("comments").insert([{ 
      post_id: postId, 
      user_id: currentUser.id, 
      content: replyBody.trim(),
      parent_id: parentId
    }]);
    if (error) return alert(`답글 실패: ${error.message}`);
    setReplyBody("");
    setReplyingTo(null);
    fetchComments();
  };

  // ★ 수정 버튼 클릭 시 실행되는 함수 (여기서 시간 체크함)
  const startEditing = (comment: Comment) => {
    if (!comment.created_at) return;
    
    const writtenTime = new Date(comment.created_at).getTime();
    const now = Date.now();
    const diffMs = now - writtenTime;
    const diffMin = diffMs / (1000 * 60);

    // 10분이 지났으면 안내 메시지 띄우고 중단
    if (diffMin > 10) {
      alert(`작성 후 10분이 지난 댓글은 수정이 불가합니다.\n(약 ${Math.floor(diffMin)}분 경과)`);
      return;
    }

    setEditingId(comment.id);
    setEditBody(comment.content);
    setReplyingTo(null);
  };

  const saveEdit = async (commentId: string) => {
    if (!editBody.trim()) return;
    const { error } = await supabase
      .from("comments")
      .update({ content: editBody.trim() })
      .eq("id", commentId);

    if (error) {
      alert("수정 시간이 지났거나 오류가 발생했습니다.");
      setEditingId(null);
      return;
    }
    setEditingId(null);
    fetchComments();
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!currentUser) return alert("로그인 필요");
    const allComments = comments.flatMap((c) => [c, ...(c.replies || [])]);
    const comment = allComments.find((c) => c.id === commentId);
    const existing = comment?.comment_likes?.find((l: any) => l.user_id === currentUser.id);
    
    if (existing) await supabase.from("comment_likes").delete().eq("id", existing.id);
    else await supabase.from("comment_likes").insert([{ comment_id: commentId, user_id: currentUser.id }]);
    fetchComments();
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from("comments").update({ is_deleted: true }).eq("id", commentId);
    if (!error) fetchComments();
  };

  // --- [렌더링] ---
  const renderComment = (c: Comment, isReply: boolean = false) => {
    const likeCount = c.comment_likes?.length ?? 0;
    const isLiked = currentUser && (c.comment_likes?.some((l: any) => l.user_id === currentUser.id) ?? false);
    
    const isMyComment = currentUser && c.user_id === currentUser.id;
    const canDelete = isMyComment || isAdmin;
    const canReply = isAdmin && !isReply && !c.is_deleted;
    const isEditing = editingId === c.id;

    return (
      <div key={c.id}>
        <div className={`p-4 rounded-2xl border transition-all ${c.is_deleted ? "bg-zinc-900/50 border-zinc-800/50" : "bg-zinc-800/30 border-zinc-700/50"} ${isReply ? "ml-8 mt-3" : ""}`}>
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              {c.is_deleted ? (
                <p className="text-zinc-500 italic text-sm">삭제된 댓글입니다.</p>
              ) : isEditing ? (
                // 수정 입력창 UI
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-600 text-white text-sm focus:border-lime-500 outline-none resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-300 text-xs hover:bg-zinc-600">
                      <FaTimes size={10} /> 취소
                    </button>
                    <button onClick={() => saveEdit(c.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lime-500 text-black font-bold text-xs hover:bg-lime-400">
                      <FaCheck size={10} /> 저장
                    </button>
                  </div>
                </div>
              ) : (
                // 일반 댓글 내용 UI
                <>
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap break-words">{c.content}</p>
                  {isReply && <span className="inline-block mt-1 px-2 py-0.5 bg-lime-500/10 text-lime-500 text-xs rounded-full font-bold">답글</span>}
                </>
              )}
              
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                <span>{new Date(c.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}</span>
                {!c.is_deleted && !isEditing && (
                  <>
                    <button onClick={() => toggleCommentLike(c.id)} className={`flex items-center gap-1 transition-colors ${isLiked ? "text-red-500" : "hover:text-red-500"}`}>
                      {isLiked ? <FaHeart size={12} /> : <FaRegHeart size={12} />}
                      {likeCount}
                    </button>
                    
                    {/* ★ [수정 버튼] 조건: 그냥 내 댓글이면 무조건 보임 (시간 상관 X) */}
                    {isMyComment && (
                      <button onClick={() => startEditing(c)} className="text-zinc-500 hover:text-lime-500 transition-colors" title="수정 (10분 제한)">
                        <FaPen size={12} />
                      </button>
                    )}

                    {canReply && (
                      <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="flex items-center gap-1 text-zinc-500 hover:text-lime-500 transition-colors">
                        <FaReply size={12} /> 답글
                      </button>
                    )}
                    
                    {canDelete && (
                      <button onClick={() => deleteComment(c.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                        <FaTrash size={12} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 답글 입력창 */}
        {replyingTo === c.id && (
          <div className="ml-8 mt-3 flex gap-2">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="답글을 입력하세요..."
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:border-lime-500 outline-none resize-none"
            />
            <div className="flex flex-col gap-1">
              <button onClick={() => addReply(c.id)} className="px-3 py-1.5 bg-lime-500 text-black font-bold rounded-lg text-xs hover:bg-lime-400 transition-colors">
                등록
              </button>
              <button onClick={() => { setReplyingTo(null); setReplyBody(""); }} className="px-3 py-1.5 bg-zinc-700 text-zinc-300 font-bold rounded-lg text-xs hover:bg-zinc-600 transition-colors">
                취소
              </button>
            </div>
          </div>
        )}

        {/* 대댓글 리스트 */}
        {c.replies && c.replies.length > 0 && (
          <div className="space-y-0">
            {c.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-zinc-500 text-sm py-4">댓글 로딩 중...</div>;

  return (
    <div className="border-t border-zinc-800/50 pt-8 mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-wider">
          댓글 ({comments.length + comments.reduce((sum, c) => sum + (c.replies?.length || 0), 0)})
        </h3>
        <button onClick={fetchComments} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-lime-500 hover:bg-zinc-700 text-xs font-bold transition-colors">
          <FaSync size={12} /> 새로고침
        </button>
      </div>

      {currentUser && (
        <div className="flex gap-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="댓글을 입력하세요..."
            rows={2}
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:border-lime-500 outline-none resize-none"
          />
          <button onClick={addComment} className="px-4 py-3 bg-lime-500 text-black font-bold rounded-xl text-xs hover:bg-lime-400 transition-colors shrink-0 h-fit">
            등록
          </button>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((c) => renderComment(c, false))}
      </div>
    </div>
  );
}