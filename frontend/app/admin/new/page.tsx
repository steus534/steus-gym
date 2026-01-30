"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "../../components/Sidebar";
import { FaCamera, FaArrowLeft, FaUpload } from "react-icons/fa";

const CATEGORIES = ["공지", "운동", "식단", "장비", "일반"];
const DIFFICULTIES = ["초급자", "중급자", "고급자"];

export default function NewPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", content: "", category: "일반", difficulty: "초급자" });
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user));
  }, []);

  const handlePhotoUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    const filePath = `post-images/${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('blog-images').upload(filePath, file);
    if (error) return alert("업로드 실패");
    const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(filePath);
    setForm(prev => ({ ...prev, content: prev.content + `\n${publicUrl}\n` }));
  };

  const handleSave = async () => {
    if (!form.title || !form.content) return alert("제목과 내용을 모두 입력하셈");
    const postData = { 
      ...form, 
      difficulty: form.category === "공지" ? null : form.difficulty,
      author_id: user.id 
    };
    const { error } = await supabase.from('posts').insert([postData]);
    if (error) alert("저장 실패: " + error.message);
    else router.push('/admin');
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-600 mb-6 font-black text-xs uppercase hover:text-white transition-all"><FaArrowLeft/> Cancel</button>
          
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 space-y-6 shadow-2xl">
            <h2 className="text-xl font-black italic text-lime-500 uppercase">New Post</h2>
            
            <input placeholder="제목" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-black p-4.5 rounded-xl border border-zinc-800 outline-none text-xl font-black focus:border-lime-500 transition-all shadow-inner" style={{padding: '1.125rem'}} />
            
            <div className="flex gap-4 w-full">
              {/* 카테고리 칸 (중간 사이즈) */}
              <div className={`${form.category === "공지" ? "w-full" : "w-1/2"} space-y-2 transition-all`}>
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Category</label>
                <select 
                  value={form.category} 
                  onChange={e => setForm({...form, category: e.target.value})} 
                  className="w-full bg-black p-4 rounded-xl border border-zinc-800 font-black text-base outline-none focus:border-lime-500 cursor-pointer hover:bg-zinc-900 transition-colors"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* 난이도 칸 (공지 아닐 때만 노출) */}
              {form.category !== "공지" && (
                <div className="w-1/2 space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <label className="text-[10px] font-black text-blue-500/70 ml-1 uppercase">Difficulty</label>
                  <select 
                    value={form.difficulty} 
                    onChange={e => setForm({...form, difficulty: e.target.value})} 
                    className="w-full bg-black p-4 rounded-xl border border-zinc-800 font-black text-base text-blue-400 outline-none focus:border-blue-500 cursor-pointer hover:bg-zinc-900 transition-colors"
                  >
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="relative">
              <textarea placeholder="내용을 입력하세요..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full bg-black p-6 pb-20 rounded-2xl border border-zinc-800 outline-none h-96 font-medium text-zinc-300 custom-scrollbar leading-relaxed" />
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-6 right-6 p-4 bg-zinc-800 rounded-full hover:bg-lime-500 transition-all"><FaCamera size={18}/></button>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            </div>

            <button onClick={handleSave} className="w-full py-5 bg-lime-500 text-black font-black rounded-2xl text-lg shadow-lg hover:bg-white transition-all flex items-center justify-center gap-3"><FaUpload/> 업로드</button>
          </div>
        </div>
      </main>
    </div>
  );
}