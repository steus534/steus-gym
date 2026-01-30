"use client";
import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import { 
  FaFire, FaDumbbell, FaOilCan, FaChevronDown, FaChevronUp, 
  FaAppleAlt, FaSeedling, FaTint, FaSun 
} from "react-icons/fa";

export default function NutrientInfo() {
  // 현재 펼쳐진 비타민 ID 저장 (하나만 열리게 하거나 null)
  const [openVit, setOpenVit] = useState<string | null>(null);

  const toggleVit = (id: string) => {
    setOpenVit(openVit === id ? null : id);
  };

  const VITAMIN_DB = [
    { 
      id: "A", name: "비타민 A", type: "지용성", color: "text-orange-400",
      desc: "시력 보호 및 세포 성장",
      detail: "어두운 곳 시각 적응(야맹증 예방), 피부 점막 형성 및 기능 유지.",
      food: "당근, 시금치, 동물의 간, 달걀노른자"
    },
    { 
      id: "B", name: "비타민 B군", type: "수용성", color: "text-yellow-400",
      desc: "에너지 대사 및 피로 회복 (파워리프팅 필수)",
      detail: "B1(탄수대사), B6(단백질대사/근성장), B12(신경계 보호). 부족 시 무기력증.",
      food: "돼지고기, 현미, 닭가슴살, 우유"
    },
    { 
      id: "C", name: "비타민 C", type: "수용성", color: "text-yellow-200",
      desc: "항산화, 결합조직 형성, 철분 흡수",
      detail: "활성산소 제거(근피로 감소), 콜라겐 합성 관여. 운동 후 섭취 권장.",
      food: "감귤류, 브로콜리, 피망, 딸기"
    },
    { 
      id: "D", name: "비타민 D", type: "지용성", color: "text-blue-300",
      desc: "칼슘 흡수, 뼈 형성, 테스토스테론",
      detail: "골다공증 예방. 실내 운동러에게 결핍 흔함. 근력 및 호르몬 유지에 필수.",
      food: "햇빛 노출, 등푸른 생선, 달걀노른자"
    },
    { 
      id: "E", name: "비타민 E", type: "지용성", color: "text-pink-400",
      desc: "세포 노화 방지 (강력한 항산화)",
      detail: "유해산소로부터 세포 보호, 혈액 순환 개선.",
      food: "아몬드, 식물성 오일, 씨앗류"
    },
    { 
      id: "K", name: "비타민 K", type: "지용성", color: "text-green-400",
      desc: "정상적인 혈액 응고, 뼈 구성",
      detail: "칼슘이 뼈에 달라붙게 도와줌(골밀도). 멍이 잘 든다면 부족 의심.",
      food: "케일, 시금치, 낫또, 브로콜리"
    },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
          
          {/* [수정 포인트] 모바일 상단 여백 추가 (버튼 가림 방지) */}
          <div className="mt-14 md:mt-0">
            <h1 className="text-4xl font-black italic text-lime-500 uppercase tracking-tighter">Nutrient Guide</h1>
          </div>

          {/* 1. 3대 영양소 (Macros) */}
          <section className="grid md:grid-cols-3 gap-6">
            <InfoCard title="탄수화물" icon={<FaFire/>} color="text-orange-500" desc="고강도 훈련의 주 에너지원." detail="운동 전후 충분한 섭취 필수 (글리코겐 로딩)." />
            <InfoCard title="단백질" icon={<FaDumbbell/>} color="text-blue-500" desc="근육 합성 및 조직 회복." detail="체중 1kg당 1.6~2.2g 권장." />
            <InfoCard title="지방" icon={<FaOilCan/>} color="text-yellow-600" desc="호르몬 생성 및 관절 보호." detail="전체 칼로리의 20~30% 유지." />
          </section>

          {/* 2. 비타민 (Vitamins) */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase text-zinc-400 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-lime-500"/> Vitamins
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {VITAMIN_DB.map(v => (
                <div key={v.id} className={`bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden transition-all duration-300 ${openVit === v.id ? "border-lime-500/50 bg-zinc-800" : "hover:border-zinc-700"}`}>
                  <button onClick={() => toggleVit(v.id)} className="w-full p-6 flex justify-between items-center text-left">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xl font-black ${v.color}`}>{v.name}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${v.type === "수용성" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`}>
                          {v.type === "수용성" ? <FaTint size={8}/> : <FaSun size={8}/>} {v.type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-bold">{v.desc}</p>
                    </div>
                    {openVit === v.id ? <FaChevronUp className="text-zinc-600"/> : <FaChevronDown className="text-zinc-600"/>}
                  </button>
                  
                  {/* 상세 정보 (아코디언) */}
                  {openVit === v.id && (
                    <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
                      <div className="bg-black/40 p-4 rounded-2xl space-y-3 border border-zinc-700/50">
                        <div>
                          <p className="text-[10px] font-black text-lime-500 uppercase mb-1">Function & Detail</p>
                          <p className="text-xs text-zinc-300 leading-relaxed font-bold">{v.detail}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-lime-500 uppercase mb-1">Rich Sources</p>
                          <p className="text-xs text-zinc-400 font-bold bg-zinc-800/50 p-2 rounded-lg inline-block">🍽️ {v.food}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. 무기질 & 식이섬유 */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 space-y-6">
              <h3 className="text-xl font-black text-blue-400 uppercase italic flex items-center gap-2">
                <FaAppleAlt/> 무기질 (Minerals)
              </h3>
              <div className="space-y-4">
                <MineralItem name="마그네슘" role="근육 이완, 눈떨림/쥐 방지" source="바나나, 아몬드, 녹색 채소" />
                <MineralItem name="아연 (Zinc)" role="테스토스테론 생성, 면역력" source="굴, 소고기, 콩류" />
                <MineralItem name="칼슘" role="근수축 신호, 골밀도 강화" source="우유, 멸치, 치즈" />
                <MineralItem name="철분" role="산소 운반(지구력), 빈혈 예방" source="붉은 고기, 선지, 깻잎" />
              </div>
            </div>

            <div className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 space-y-6">
              <h3 className="text-xl font-black text-green-400 uppercase italic flex items-center gap-2">
                <FaSeedling/> 식이섬유 (Fiber)
              </h3>
              <div className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <p className="text-sm font-black text-white mb-1">수용성 식이섬유</p>
                  <p className="text-xs text-zinc-500 font-bold mb-2">물에 녹음. 혈당 급상승 억제 및 콜레스테롤 감소.</p>
                  <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded-lg font-black">사과, 오트밀, 미역</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white mb-1">불용성 식이섬유</p>
                  <p className="text-xs text-zinc-500 font-bold mb-2">물에 안 녹음. 대변 부피 증가 및 장 운동 촉진(변비).</p>
                  <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded-lg font-black">현미, 통밀, 채소 줄기</span>
                </div>
              </div>
              <div className="bg-lime-500/10 p-4 rounded-2xl border border-lime-500/20">
                <p className="text-[10px] font-black text-lime-500 uppercase mb-1">PRO TIP</p>
                <p className="text-xs text-zinc-300 font-bold">다이어트 중 변비가 온다면 불용성(채소)뿐만 아니라 **수분 섭취**를 반드시 늘려야 함.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ title, icon, color, desc, detail }: any) {
  return (
    <div className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 space-y-3">
      <div className={`text-3xl ${color}`}>{icon}</div>
      <p className="text-lg font-black">{title}</p>
      <p className="text-xs font-bold text-zinc-400 leading-relaxed">{desc}</p>
      <p className="text-[10px] font-black text-zinc-600 italic uppercase pt-2 border-t border-zinc-800">{detail}</p>
    </div>
  );
}

function MineralItem({ name, role, source }: any) {
  return (
    <div className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-black text-white">{name}</span>
      </div>
      <p className="text-xs text-zinc-500 font-bold mb-2">{role}</p>
      <span className="text-[10px] font-black text-blue-400 bg-blue-900/20 px-2 py-1 rounded-lg uppercase">{source}</span>
    </div>
  );
}