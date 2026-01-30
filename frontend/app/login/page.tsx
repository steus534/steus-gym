"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { FaGoogle, FaComment } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (provider: "google" | "kakao") => {
    setLoading(true);
    try {
      // [핵심] window.location.origin이 'http://localhost:3000' 또는 'https://니사이트.vercel.app'을 자동으로 감지함
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;
    } catch (error) {
      alert("로그인 중 오류가 발생했습니다.");
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl text-center">
        
        <h1 className="text-4xl font-black italic text-lime-500 mb-2 uppercase tracking-tighter">GYM RAT</h1>
        <p className="text-zinc-500 font-bold mb-10">로그인하고 3대 500 찍으러 가자</p>

        <div className="space-y-4">
          {/* 구글 로그인 */}
          <button
            onClick={() => handleLogin("google")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-black text-lg hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Connecting...</span>
            ) : (
              <>
                <FaGoogle className="text-xl" /> Google로 시작하기
              </>
            )}
          </button>

          {/* 카카오 로그인 (설정 안 했으면 주석 처리하거나 빼셈) */}
          <button
            onClick={() => handleLogin("kakao")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] py-4 rounded-2xl font-black text-lg hover:bg-[#Fdd835] transition-all active:scale-95 disabled:opacity-50"
          >
            <FaComment className="text-xl" /> Kakao로 시작하기
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            Powered by Supabase & Next.js
          </p>
        </div>
      </div>
    </div>
  );
}