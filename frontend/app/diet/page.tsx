"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "@/lib/supabase";
import { FaUtensils, FaSearch, FaTrash, FaChartPie, FaTimes, FaPlus, FaSave, FaBookmark, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPen, FaLayerGroup } from "react-icons/fa";

// 타입 안전성을 위해 Record 타입 지정
const MEAL_KO: Record<string, string> = { breakfast: "아침", lunch: "점심", dinner: "저녁", snack: "간식" };

const FOOD_DB = [
  { id: 1, name: "햇반 (기본)", base: 210, unit: "g", cal: 315, c: 70, p: 5, f: 1, cat: "탄수" },
  { id: 2, name: "햇반 (작은공기)", base: 130, unit: "g", cal: 195, c: 43, p: 3, f: 0.5, cat: "탄수" },
  { id: 4, name: "현미밥 (한공기)", base: 210, unit: "g", cal: 320, c: 68, p: 6, f: 2, cat: "탄수" },
  { id: 5, name: "오트밀 (1회분)", base: 50, unit: "g", cal: 190, c: 33, p: 6.5, f: 3, cat: "탄수" },
  { id: 6, name: "고구마 (중간)", base: 150, unit: "g", cal: 190, c: 45, p: 2, f: 0.3, cat: "탄수" },
  { id: 7, name: "바나나", base: 1, unit: "개", cal: 100, c: 25, p: 1, f: 0, cat: "탄수" },
  { id: 8, name: "식빵", base: 1, unit: "쪽", cal: 100, c: 15, p: 5, f: 1, cat: "탄수" },
  { id: 9, name: "베이글", base: 1, unit: "개", cal: 300, c: 50, p: 10, f: 2, cat: "탄수" },
  { id: 11, name: "닭가슴살 (1팩)", base: 100, unit: "g", cal: 109, c: 0, p: 23, f: 1, cat: "단백" },
  { id: 12, name: "소 우둔살", base: 100, unit: "g", cal: 150, c: 0, p: 22, f: 6, cat: "단백" },
  { id: 13, name: "돼지 목살", base: 100, unit: "g", cal: 260, c: 0, p: 20, f: 19, cat: "단백" },
  { id: 14, name: "계란 (전란)", base: 1, unit: "개", cal: 72, c: 0, p: 6, f: 5, cat: "단백" },
  { id: 15, name: "계란 (흰자)", base: 1, unit: "개", cal: 17, c: 0, p: 3, f: 0, cat: "단백" },
  { id: 16, name: "참치캔 (작은거)", base: 100, unit: "g", cal: 130, c: 0, p: 19, f: 5, cat: "단백" },
  { id: 17, name: "프로틴", base: 1, unit: "스쿱", cal: 120, c: 3, p: 24, f: 1, cat: "단백" },
  { id: 18, name: "고등어 구이", base: 1, unit: "마리", cal: 350, c: 0, p: 30, f: 25, cat: "단백" },
  { id: 19, name: "훈제오리", base: 150, unit: "g", cal: 450, c: 2, p: 28, f: 36, cat: "단백" },
  { id: 20, name: "두부 (반모)", base: 150, unit: "g", cal: 130, c: 4, p: 14, f: 8, cat: "단백" },
  { id: 21, name: "아몬드", base: 10, unit: "알", cal: 60, c: 2, p: 2, f: 5, cat: "지방" },
  { id: 22, name: "땅콩버터", base: 1, unit: "스푼", cal: 95, c: 3, p: 4, f: 8, cat: "지방" },
  { id: 23, name: "우유", base: 200, unit: "ml", cal: 130, c: 10, p: 6, f: 7, cat: "기타" },
  { id: 24, name: "제로콜라", base: 1, unit: "캔", cal: 0, c: 0, p: 0, f: 0, cat: "기타" },
  { id: 25, name: "컵라면 (작은거)", base: 1, unit: "개", cal: 300, c: 45, p: 5, f: 10, cat: "일반" },
  { id: 26, name: "삼각김밥 (참치)", base: 1, unit: "개", cal: 200, c: 35, p: 4, f: 5, cat: "일반" },
];

export default function DietBuilder() {
  const [user, setUser] = useState<any>(null);
  const [target, setTarget] = useState({ cal: 2500, p: 160, c: 300, f: 70 });
  const [myDiet, setMyDiet] = useState<Record<string, any[]>>({ breakfast: [], lunch: [], dinner: [], snack: [] });
  const [userFoods, setUserFoods] = useState<any[]>([]);
  const [userPresets, setUserPresets] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 모달 및 입력 상태
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [addFoodModal, setAddFoodModal] = useState(false);
  const [addPresetModal, setAddPresetModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [targetMeal, setTargetMeal] = useState<string>("");
  const [amount, setAmount] = useState<number | string>("");
  const [newFoodForm, setNewFoodForm] = useState({ name: "", cal: "", c: "", p: "", f: "", base: "100", unit: "g" });
  const [newPresetForm, setNewPresetForm] = useState({ name: "", desc: "", cal: "", c: "", p: "", f: "" });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchAssets(session.user.id);
        await fetchDailyDiet(session.user.id, date);
      }
      setIsLoaded(true);
    };
    init();
  }, [date]);

  const fetchAssets = async (userId: string) => {
    const { data } = await supabase.from('user_assets').select('*').eq('user_id', userId).single();
    if (data) {
      setUserFoods(data.custom_foods || []);
      setUserPresets(data.presets || []);
    }
  };

  const fetchDailyDiet = async (userId: string, d: string) => {
    const { data } = await supabase.from('diet_logs').select('*').eq('user_id', userId).eq('date', d);
    const organized: Record<string, any[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    if (data) {
      data.forEach((item: any) => {
        if (organized[item.type]) organized[item.type].push({ ...item, uuid: item.id });
      });
    }
    setMyDiet(organized);
  };

  const syncAssets = async (f = userFoods, p = userPresets) => {
    if (user) {
      await supabase.from('user_assets').upsert({ user_id: user.id, custom_foods: f, presets: p });
    }
  };

  const confirmAdd = async () => {
    if (!user || !amount || !selectedFood) return;
    const ratio = Number(amount) / selectedFood.base;
    const foodData = {
      user_id: user.id, date, type: targetMeal, food_name: selectedFood.name,
      amount: Number(amount), unit: selectedFood.unit,
      cal: Math.round(selectedFood.cal * ratio), c: Math.round(selectedFood.c * ratio),
      p: Math.round(selectedFood.p * ratio), f: Math.round(selectedFood.f * ratio)
    };

    await supabase.from('diet_logs').insert([foodData]);
    await fetchDailyDiet(user.id, date);
    setModalOpen(false);
  };

  const removeFood = async (id: string) => {
    if (user) await supabase.from('diet_logs').delete().eq('id', id);
    fetchDailyDiet(user.id, date);
  };

  const handleSaveUserFood = () => {
    const updated = [...userFoods, { 
      ...newFoodForm, id: Date.now(), cat: "커스텀", 
      cal: Number(newFoodForm.cal), c: Number(newFoodForm.c), 
      p: Number(newFoodForm.p), f: Number(newFoodForm.f),
      base: Number(newFoodForm.base)
    }];
    setUserFoods(updated);
    syncAssets(updated, userPresets);
    setAddFoodModal(false);
    setNewFoodForm({ name: "", cal: "", c: "", p: "", f: "", base: "100", unit: "g" });
  };

  const addPresetToDiet = async (type: string, preset: any) => {
    if (!user) return;
    await supabase.from('diet_logs').insert([{
      user_id: user.id, date, type, food_name: preset.name, amount: 1, unit: "인분",
      cal: preset.data.cal, c: preset.data.c, p: preset.data.p, f: preset.data.f
    }]);
    fetchDailyDiet(user.id, date);
  };

  const changeDate = (days: number) => {
    const curr = new Date(date);
    curr.setDate(curr.getDate() + days);
    setDate(curr.toISOString().split("T")[0]);
  };

  const total = Object.values(myDiet).flat().reduce((acc, cur) => ({ cal: acc.cal + cur.cal, p: acc.p + cur.p, c: acc.c + cur.c, f: acc.f + cur.f }), { cal: 0, p: 0, c: 0, f: 0 });

  if (!isLoaded) return <div className="bg-black min-h-screen"></div>;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen flex flex-col xl:flex-row gap-8">
        
        {/* 왼쪽 섹션 */}
        <div className="xl:w-2/5 flex flex-col gap-6">
          <h1 className="text-4xl font-black italic text-lime-500 uppercase">Diet DB</h1>
          <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-800 flex-1 flex flex-col overflow-hidden">
             <div className="mb-6">
               <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><FaLayerGroup/> My Presets</p>
               <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                 {userPresets.map(p => (
                   <div key={p.id} className="bg-zinc-800 p-3 rounded-2xl border border-zinc-700 flex flex-col justify-between">
                     <p className="font-black text-xs">{p.icon} {p.name}</p>
                     <div className="grid grid-cols-4 gap-1 mt-2">
                        {["breakfast", "lunch", "dinner", "snack"].map(m => (
                            <button key={m} onClick={() => addPresetToDiet(m, p)} className="py-1 bg-zinc-700 hover:bg-lime-600 text-[8px] font-black rounded">{MEAL_KO[m]}</button>
                        ))}
                     </div>
                   </div>
                 ))}
                 <button onClick={() => setAddPresetModal(true)} className="border-2 border-dashed border-zinc-800 rounded-2xl p-4 text-xs font-bold text-zinc-600 hover:text-lime-500">+ 프리셋 추가</button>
               </div>
             </div>

             <div className="flex gap-3 mb-4">
               <div className="relative flex-1">
                 <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                 <input type="text" placeholder="검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-4 pl-12 bg-black border border-zinc-800 rounded-2xl font-bold outline-none" />
               </div>
               <button onClick={() => setAddFoodModal(true)} className="bg-zinc-800 hover:bg-lime-500 px-4 rounded-2xl font-black text-xs whitespace-nowrap">+ 직접등록</button>
             </div>

             <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
               {[...userFoods, ...FOOD_DB].filter(f => f.name.includes(search)).map(food => (
                 <div key={food.id} className="bg-zinc-800/80 p-5 rounded-3xl border border-zinc-800 group transition-all">
                   <p className="text-lg font-black group-hover:text-lime-500">{food.name}</p>
                   <p className="text-sm font-bold text-zinc-500 italic mb-4">{food.base}{food.unit} 당 {food.cal}kcal</p>
                   <div className="grid grid-cols-4 gap-2">
                     {["breakfast", "lunch", "dinner", "snack"].map(m => (
                       <button key={m} onClick={() => { setTargetMeal(m); setSelectedFood(food); setAmount(food.base); setModalOpen(true); }} className="text-[10px] font-black py-3 bg-zinc-900 rounded-xl hover:bg-white hover:text-black transition-all">{MEAL_KO[m]}</button>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* 오른쪽 섹션 */}
        <div className="xl:w-3/5 flex flex-col gap-6">
          <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-[2rem] border border-zinc-800">
             <button onClick={() => changeDate(-1)} className="p-4 bg-black rounded-full"><FaChevronLeft className="text-zinc-400"/></button>
             <h2 className="text-2xl font-black tracking-tighter">{date}</h2>
             <button onClick={() => changeDate(1)} className="p-4 bg-black rounded-full"><FaChevronRight className="text-zinc-400"/></button>
          </div>

          <div className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <ProgressBar label="KCAL" current={total.cal} target={target.cal} color="bg-lime-500" unit="kcal" />
              <ProgressBar label="PROT" current={total.p} target={target.p} color="bg-blue-500" unit="g" />
              <ProgressBar label="CARB" current={total.c} target={target.c} color="bg-orange-500" unit="g" />
              <ProgressBar label="FAT" current={total.f} target={target.f} color="bg-red-500" unit="g" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 flex-1 overflow-y-auto pb-20 pr-2 custom-scrollbar">
            {Object.keys(myDiet).map(type => (
              <div key={type} className="bg-zinc-900/30 p-6 rounded-[2.5rem] border border-zinc-800 flex flex-col min-h-[300px]">
                <h3 className="font-black text-lg text-white mb-4 uppercase tracking-widest">{MEAL_KO[type]}</h3> 
                <div className="flex-1 space-y-3">
                  {myDiet[type].map((f: any) => (
                    <div key={f.uuid} className="flex justify-between items-center bg-black/60 p-4 rounded-2xl border border-zinc-800">
                      <div>
                        <p className="text-sm font-black text-zinc-100">{f.food_name} <span className="text-lime-500 text-xs">({f.amount}{f.unit})</span></p>
                        <p className="text-[10px] font-bold text-zinc-500">C{f.c} P{f.p} F{f.f} — {f.cal}kcal</p>
                      </div>
                      <button onClick={() => removeFood(f.uuid)} className="text-zinc-700 hover:text-red-500 p-2"><FaTrash size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 모달: 양 조절 */}
      {modalOpen && selectedFood && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-zinc-900 p-10 rounded-[3rem] w-full max-w-sm border border-zinc-800">
            <h2 className="text-2xl font-black mb-8 text-center">{selectedFood.name}</h2>
            <div className="flex items-center gap-4 mb-10">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-6 bg-black border-2 border-zinc-800 rounded-[2rem] font-black text-4xl text-center outline-none focus:border-lime-500 transition-colors" />
              <span className="text-xl font-black text-zinc-500">{selectedFood.unit}</span>
            </div>
            <button onClick={confirmAdd} className="w-full py-6 bg-lime-500 text-black font-black text-xl rounded-[2rem]">기록하기</button>
            <button onClick={() => setModalOpen(false)} className="w-full py-3 text-zinc-600 font-bold mt-2">취소</button>
          </div>
        </div>
      )}

      {/* 모달: 음식 직접 등록 */}
      {addFoodModal && (
        <div className="fixed inset-0 bg-black/95 z-[400] flex items-center justify-center p-6">
          <div className="bg-zinc-900 p-10 rounded-[3rem] w-full max-w-lg border border-zinc-800 shadow-2xl">
            <h3 className="text-2xl font-black mb-8 text-lime-500 italic uppercase">New Custom Food</h3>
            <div className="space-y-4">
              <Input label="음식명" val={newFoodForm.name} set={(v: string) => setNewFoodForm({...newFoodForm, name: v})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="기준 양" val={newFoodForm.base} set={(v: string) => setNewFoodForm({...newFoodForm, base: v})} unit="숫자" />
                <Input label="단위" val={newFoodForm.unit} set={(v: string) => setNewFoodForm({...newFoodForm, unit: v})} unit="g/개" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="칼로리" val={newFoodForm.cal} set={(v: string) => setNewFoodForm({...newFoodForm, cal: v})} unit="kcal" />
                <Input label="단백질" val={newFoodForm.p} set={(v: string) => setNewFoodForm({...newFoodForm, p: v})} unit="g" />
                <Input label="탄수화물" val={newFoodForm.c} set={(v: string) => setNewFoodForm({...newFoodForm, c: v})} unit="g" />
                <Input label="지방" val={newFoodForm.f} set={(v: string) => setNewFoodForm({...newFoodForm, f: v})} unit="g" />
              </div>
              <button onClick={handleSaveUserFood} className="w-full py-5 bg-lime-500 text-black font-black text-lg rounded-2xl mt-4">음식 등록하기</button>
              <button onClick={() => setAddFoodModal(false)} className="w-full py-2 text-zinc-500">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ label, current, target, color, unit }: any) {
  const pct = Math.min(100, (current / target) * 100);
  return ( 
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-black uppercase"><span className="text-zinc-500">{label}</span><span>{current}/{target}{unit}</span></div>
      <div className="h-2 bg-black rounded-full overflow-hidden border border-zinc-800">
        <div className={`h-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div> 
  );
}

function Input({ label, val, set, unit }: any) {
  return ( 
    <div>
      <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 mb-1 block">{label}</label>
      <div className="relative">
        <input value={val} onChange={(e) => set(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-2xl font-black outline-none focus:border-lime-500 transition-all" />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700">{unit}</span>}
      </div>
    </div> 
  );
}