"use client";
import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-black text-zinc-300 mb-2">로그인 처리에 문제가 있었습니다</h1>
      <p className="text-sm text-zinc-500 mb-6">다시 시도하거나 홈으로 이동해 주세요.</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-5 py-2.5 bg-lime-500 text-black font-bold rounded-xl text-sm hover:bg-lime-400 transition-colors"
        >
          로그인 다시 시도
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 bg-zinc-700 text-white font-bold rounded-xl text-sm hover:bg-zinc-600 transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
