"use client";
import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { supabase } from "@/lib/supabase";
import { 
  FaSearch, FaTrash, FaChevronLeft, FaChevronRight, FaPlus, FaLayerGroup, FaSave, FaTimes, FaUtensils 
} from "react-icons/fa";

const MEAL_KO: Record<string, string> = { breakfast: "아침", lunch: "점심", dinner: "저녁", snack: "간식" };

// 기존 26개 식품 DB 전체 (생략 없음)
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

export default function DietLog() {
  const [user, setUser] = useState<any>(null);
  
  // [수정 포인트] 초기값 0으로 설정 (DB에서 가져오면 채워짐)
  const [target, setTarget] = useState({ cal: 0, p: 0, c: 0, f: 0 });
  
  const [myDiet, setMyDiet] = useState<Record<string, any[]>>({ breakfast: [], lunch: [], dinner: [], snack: [] });
  const [userFoods, setUserFoods] = useState<any[]>([]);
  const [userPresets, setUserPresets] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [addFoodModal, setAddFoodModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [targetMeal, setTargetMeal] = useState<string>("");
  const [amount, setAmount] = useState<number | string>("");
  
  const [newFoodForm, setNewFoodForm] = useState({ name: "", cal: 0, c: 0, p: 0, f: 0, base: 100, unit: "g" });

  // 커스텀 음식 칼로리 자동 계산
  useEffect(() => {
    const autoCal = (Number(newFoodForm.c) * 4) + (Number(newFoodForm.p) * 4) + (Number(newFoodForm.f) * 9);
    setNewFoodForm(prev => ({ ...prev, cal: autoCal }));
  }, [newFoodForm.c, newFoodForm.p, newFoodForm.f]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchUserData(session.user.id); // 목표치 가져오기
        await fetchAssets(session.user.id);   // 커스텀 음식 가져오기
        await fetchDailyDiet(session.user.id, date); // 식단 기록 가져오기
      }
      setIsLoaded(true);
    };
    init();
  }, [date]);

  // [핵심 기능] DB에서 사용자 목표 칼로리 및 탄단지 가져오기
  const fetchUserData = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('target_cal, target_carb, target_prot, target_fat')
      .eq('id', userId)
      .single();

    if (profile) {
      // DB 값이 있으면 쓰고, 없으면 기본값(2500) 사용
      setTarget({
        cal: profile.target_cal || 2500,
        c: profile.target_carb || 300,
        p: profile.target_prot || 160,
        f: profile.target_fat || 70
      });
    }
  };

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
    if (data) data.forEach((item: any) => organized[item.type]?.push({ ...item, uuid: item.id }));
    setMyDiet(organized);
  };

  const syncAssets = async (f = userFoods, p = userPresets) => {
    if (user) await supabase.from('user_assets').upsert({ user_id: user.id, custom_foods: f, presets: p });
  };

  const handleSaveUserFood = async () => {
    const updated = [...userFoods, { ...newFoodForm, id: Date.now(), cat: "커스텀" }];
    setUserFoods(updated);
    await syncAssets(updated, userPresets);
    setAddFoodModal(false);
    setNewFoodForm({ name: "", cal: 0, c: 0, p: 0, f: 0, base: 100, unit: "g" });
  };

  const confirmAdd = async () => {
    if (!user || !amount || !selectedFood) return;
    const ratio = Number(amount) / selectedFood.base;
    await supabase.from('diet_logs').insert([{
      user_id: user.id, date, type: targetMeal, food_name: selectedFood.name, amount: Number(amount), unit: selectedFood.unit,
      cal: Math.round(selectedFood.cal * ratio), c: Math.round(selectedFood.c * ratio), p: Math.round(selectedFood.p * ratio), f: Math.round(selectedFood.f * ratio)
    }]);
    fetchDailyDiet(user.id, date);
    setModalOpen(false);
  };

  const removeFood = async (id: string) => {
    await supabase.from('diet_logs').delete().eq('id', id);
    fetchDailyDiet(user.id, date);
  };

  const total = Object.values(myDiet).flat().reduce((acc, cur) => ({ cal: acc.cal + cur.cal, p: acc.p + cur.p, c: acc.c + cur.c, f: acc.f + cur.f }), { cal: 0, p: 0, c: 0, f: 0 });

  if (!isLoaded) return <div className="bg-black min-h-screen"></div>;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen flex flex-col xl:flex-row gap-8 custom-scrollbar">
        
        {/* 왼쪽 섹션: DB 및 커스텀 음식 */}
        <div className="xl:w-1/3 flex flex-col gap-6">
          <h1 className="text-4xl font-black italic text-lime-500 uppercase tracking-tighter">Diet DB</h1>
          <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-800 flex-1 flex flex-col overflow-hidden">
             <div className="flex gap-3 mb-6">
               <div className="relative flex-1">
                 <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                 <input type="text" placeholder="식품 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-4 pl-12 bg-black border border-zinc-800 rounded-2xl font-bold outline-none focus:border-lime-500 transition-all" />
               </div>
               <button onClick={() => setAddFoodModal(true)} className="bg-zinc-800 hover:bg-lime-500 px-4 rounded-2xl font-black text-[10px] uppercase transition-all">+ Custom</button>
             </div>

             <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
               {[...userFoods, ...FOOD_DB].filter(f => f.name.includes(search)).map(food => (
                 <div key={food.id} className="bg-zinc-800/80 p-5 rounded-3xl border border-zinc-800 group transition-all hover:border-zinc-700">
                   <div className="flex justify-between items-start mb-1">
                     <p className="text-lg font-black group-hover:text-lime-500 transition-colors">{food.name}</p>
                     <span className="text-[10px] font-black text-zinc-600 uppercase">{food.cat}</span>
                   </div>
                   <p className="text-xs font-bold text-zinc-500 italic mb-4">{food.base}{food.unit} 당 {food.cal}kcal</p>
                   <div className="grid grid-cols-4 gap-2">
                     {["breakfast", "lunch", "dinner", "snack"].map(m => (
                       <button key={m} onClick={() => { setTargetMeal(m); setSelectedFood(food); setAmount(food.base); setModalOpen(true); }} className="text-[10px] font-black py-3 bg-zinc-950 rounded-xl hover:bg-white hover:text-black transition-all">{MEAL_KO[m]}</button>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* 오른쪽 섹션: 기록 대시보드 */}
        <div className="xl:w-2/3 flex flex-col gap-6 pb-20">
          <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-[2.5rem] border border-zinc-800 shadow-lg">
             <button onClick={() => setDate(d => new Date(new Date(d).setDate(new Date(d).getDate()-1)).toISOString().split("T")[0])} className="p-4 bg-black rounded-full hover:bg-zinc-800 transition-colors"><FaChevronLeft className="text-zinc-500"/></button>
             <h2 className="text-2xl font-black tracking-tighter italic">{date}</h2>
             <button onClick={() => setDate(d => new Date(new Date(d).setDate(new Date(d).getDate()+1)).toISOString().split("T")[0])} className="p-4 bg-black rounded-full hover:bg-zinc-800 transition-colors"><FaChevronRight className="text-zinc-500"/></button>
          </div>

          <div className="bg-zinc-900 p-8 rounded-[3.5rem] border border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-8 shadow-xl">
            {/* 여기가 이제 DB에서 불러온 target 값으로 움직임 */}
            <ProgressBar label="KCAL" current={total.cal} target={target.cal} color="bg-lime-500" unit="kcal" />
            <ProgressBar label="PROT" current={total.p} target={target.p} color="bg-blue-500" unit="g" />
            <ProgressBar label="CARB" current={total.c} target={target.c} color="bg-orange-500" unit="g" />
            <ProgressBar label="FAT" current={total.f} target={target.f} color="bg-red-500" unit="g" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {Object.keys(myDiet).map(type => (
              <div key={type} className="bg-zinc-900/30 p-6 rounded-[2.5rem] border border-zinc-800 flex flex-col min-h-[200px]">
                <h3 className="font-black text-xs text-zinc-500 uppercase tracking-[0.3em] mb-4">{MEAL_KO[type]}</h3> 
                <div className="space-y-2">
                  {myDiet[type].map((f: any) => (
                    <div key={f.uuid} className="flex justify-between items-center bg-black/60 p-4 rounded-2xl border border-zinc-800 transition-all hover:border-zinc-700 group">
                      <div>
                        <p className="text-sm font-black text-zinc-100">{f.food_name} <span className="text-lime-500 text-[10px]">({f.amount}{f.unit})</span></p>
                        <p className="text-[10px] font-bold text-zinc-600 italic">C{f.c} P{f.p} F{f.f} — {f.cal}kcal</p>
                      </div>
                      <button onClick={() => removeFood(f.uuid)} className="text-zinc-800 group-hover:text-red-500 transition-colors p-2"><FaTrash size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 모달: 커스텀 음식 등록 */}
      {addFoodModal && (
        <div className="fixed inset-0 bg-black/95 z-[400] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-zinc-900 p-10 rounded-[3rem] w-full max-w-lg border border-zinc-800 shadow-2xl">
            <h3 className="text-2xl font-black mb-8 text-lime-500 italic uppercase">New Custom Item</h3>
            <div className="space-y-4">
              <Input label="음식명" val={newFoodForm.name} set={(v: any) => setNewFoodForm({...newFoodForm, name: v})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="기준 수량" val={newFoodForm.base} set={(v: any) => setNewFoodForm({...newFoodForm, base: v})} unit="숫자" />
                <Input label="단위" val={newFoodForm.unit} set={(v: any) => setNewFoodForm({...newFoodForm, unit: v})} unit="g/개/ml" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="탄수화물" val={newFoodForm.c} set={(v: any) => setNewFoodForm({...newFoodForm, c: v})} unit="g" />
                <Input label="단백질" val={newFoodForm.p} set={(v: any) => setNewFoodForm({...newFoodForm, p: v})} unit="g" />
                <Input label="지방" val={newFoodForm.f} set={(v: any) => setNewFoodForm({...newFoodForm, f: v})} unit="g" />
              </div>
              <div className="bg-black/50 p-6 rounded-2xl border border-zinc-800 text-center">
                <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Estimated Calories</p>
                <p className="text-4xl font-black text-lime-500 italic">{newFoodForm.cal} <span className="text-sm text-zinc-600 non-italic">kcal</span></p>
              </div>
              <button onClick={handleSaveUserFood} className="w-full py-5 bg-lime-500 text-black font-black text-lg rounded-2xl mt-4 shadow-lg shadow-lime-500/20">등록하기</button>
              <button onClick={() => setAddFoodModal(false)} className="w-full py-2 text-zinc-700 font-bold uppercase text-[10px] mt-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 양 조절 모달 */}
      {modalOpen && selectedFood && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-zinc-900 p-10 rounded-[3rem] w-full max-w-sm border border-zinc-800 shadow-2xl">
            <h2 className="text-2xl font-black mb-8 text-center uppercase italic text-lime-500">{selectedFood.name}</h2>
            <div className="flex items-center gap-4 mb-10">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-6 bg-black border-2 border-zinc-800 rounded-[2rem] font-black text-4xl text-center outline-none focus:border-lime-500 transition-colors" autoFocus />
              <span className="text-xl font-black text-zinc-500 uppercase">{selectedFood.unit}</span>
            </div>
            <button onClick={confirmAdd} className="w-full py-6 bg-lime-500 text-black font-black text-xl rounded-[2rem] hover:scale-95 transition-transform">기록하기</button>
            <button onClick={() => setModalOpen(false)} className="w-full py-3 text-zinc-700 font-bold mt-2 uppercase text-xs">Cancel</button>
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
      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter"><span className="text-zinc-600">{label}</span><span className="text-zinc-300">{current}/{target}{unit}</span></div>
      <div className="h-2 bg-black rounded-full overflow-hidden border border-zinc-800">
        <div className={`h-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div> 
  );
}

function Input({ label, val, set, unit }: any) {
  return ( 
    <div>
      <label className="text-[10px] font-black text-zinc-600 uppercase ml-2 mb-1 block tracking-widest">{label}</label>
      <div className="relative">
        <input value={val} onChange={(e) => set(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-2xl font-black outline-none focus:border-lime-500 transition-all text-white" />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-700 uppercase">{unit}</span>}
      </div>
    </div> 
  );
}