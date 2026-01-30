"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "../../../components/Sidebar";
import { FaCamera, FaArrowLeft, FaSave } from "react-icons/fa";

const CATEGORIES = ["공지", "운동", "식단", "장비", "일반"];
const DIFFICULTIES = ["초급자", "중급자", "고급자"];

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ title: "", content: "", category: "일반", difficulty: "초급자" });
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push('/admin');
      setUser(session.user);
      fetchPost();
    });
  }, [id]);

  const fetchPost = async () => {
    const { data } = await supabase.from('posts').select('*').eq('id', id).single();
    if (data) {
      setForm({ 
        title: data.title, 
        content: data.content, 
        category: data.category, 
        difficulty: data.difficulty || "초급자" 
      });
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.title || !form.content) return alert("다 입력하셈");
    const updateData = {
      ...form,
      difficulty: form.category === "공지" ? null : form.difficulty,
      is_deleted: false 
    };
    const { error } = await supabase.from('posts').update(updateData).eq('id', id);
    if (error) alert("수정 실패: " + error.message);
    else { alert("수정 완료 🔥"); router.push(`/admin/${id}`); }
  };

  const handlePhotoUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const filePath = `post-images/${Date.now()}.${file.name.split('.').pop()}`;
    await supabase.storage.from('blog-images').upload(filePath, file);
    const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(filePath);
    setForm(prev => ({ ...prev, content: prev.content + `\n${publicUrl}\n` }));
  };

  if (isLoading) return <div className="bg-black min-h-screen" />;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-600 mb-6 font-black text-xs uppercase tracking-widest hover:text-white transition-all"><FaArrowLeft/> Cancel</button>
          
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 space-y-6 shadow-2xl">
            <h2 className="text-xl font-black italic text-lime-500 uppercase">Edit Post</h2>
            
            <input placeholder="제목" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-black p-4.5 rounded-xl border border-zinc-800 outline-none text-xl font-black focus:border-lime-500 transition-all" style={{padding: '1.125rem'}} />

            <div className="flex gap-4 w-full">
              <div className={`${form.category === "공지" ? "w-full" : "w-1/2"} space-y-2 transition-all`}>
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-black p-4 rounded-xl border border-zinc-800 font-black text-base outline-none focus:border-lime-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {form.category !== "공지" && (
                <div className="w-1/2 space-y-2 animate-in fade-in slide-in-from-left-2">
                  <label className="text-[10px] font-black text-blue-500/70 ml-1 uppercase">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="w-full bg-black p-4 rounded-xl border border-zinc-800 font-black text-base text-blue-400 outline-none focus:border-blue-500">
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="relative">
              <textarea placeholder="내용" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full bg-black p-6 pb-20 rounded-2xl border border-zinc-800 outline-none h-96 font-medium text-zinc-300 custom-scrollbar" />
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-6 right-6 p-4 bg-zinc-800 rounded-full hover:bg-lime-500 transition-all shadow-xl"><FaCamera size={18}/></button>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            </div>

            <button onClick={handleUpdate} className="w-full py-5 bg-white text-black font-black rounded-2xl text-lg hover:bg-lime-500 transition-all flex items-center justify-center gap-3"><FaSave/> 수정 내용 저장</button>
          </div>
        </div>
      </main>
    </div>
  );
}