"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // [핵심] @를 써서 최상위부터 바로 찾아감
import { FaGoogle, FaSignOutAlt, FaUser } from "react-icons/fa";

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. 현재 로그인 세션 확인
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    // 2. 로그인 상태 변경 실시간 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    // Supabase Auth 설정에서 Google이 켜져 있어야 함
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("로그아웃 되었습니다.");
    window.location.reload();
  };

  // 로그인 상태일 때 UI
  if (user) {
    return (
      <div className="w-full flex flex-col gap-2 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <FaUser className="text-lime-500 shrink-0"/>
          <span className="truncate">{user.email}</span>
        </div>
        <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 bg-red-500/10 text-red-500 py-2 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition">
          <FaSignOutAlt /> 로그아웃
        </button>
      </div>
    );
  }

  // 비로그인 상태일 때 UI
  return (
    <div className="w-full px-3">
        <button onClick={handleLogin} className="w-full flex justify-center items-center gap-2 bg-white text-black py-3 rounded-xl text-sm font-black hover:bg-gray-200 transition shadow-lg">
        <FaGoogle /> 구글 로그인
        </button>
    </div>
  );
}