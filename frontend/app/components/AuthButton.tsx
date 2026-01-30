"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaGoogle, FaSignOutAlt } from "react-icons/fa";

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();
    
    // Auth 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // [핵심] 로그인 후 메인 페이지('/')로 돌아오게 설정
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (user) {
    return (
      <button 
        onClick={handleLogout} 
        className="w-full flex items-center justify-center gap-2 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 font-bold transition-colors text-sm"
      >
        <FaSignOutAlt /> 로그아웃
      </button>
    );
  }

  return (
    <button 
      onClick={handleLogin} 
      className="w-full flex items-center justify-center gap-2 p-3 bg-white text-black rounded-xl font-black hover:bg-gray-200 transition-colors text-sm"
    >
      <FaGoogle /> 구글 로그인
    </button>
  );
}