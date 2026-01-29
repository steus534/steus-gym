"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaBook, FaDumbbell, FaRunning, FaFistRaised, FaMedal, FaBolt } from "react-icons/fa";

type ProgramData = {
  [key: string]: {
    title: string;
    desc: string;
    items: { name: string; intro: string; pros: string; cons: string }[];
  };
};

const PROGRAMS: ProgramData = {
  "beginner": {
    title: "초급자 (Beginner)",
    desc: "운동을 처음 시작하거나, 기본 근력과 자세를 확립해야 하는 단계입니다.",
    items: [
      {
        name: "무분할 (Full Body)",
        intro: "매 운동마다 전신의 주요 근육을 모두 사용하는 방식입니다. 주 2~3회 수행하며 기본기를 다지기에 최적입니다.",
        pros: "빈도가 높아 자세 연습에 유리함. 놓친 부위 없이 균형 잡힌 성장 가능.",
        cons: "운동 시간이 길어질 수 있음. 고중량으로 갈수록 피로도 관리가 어려움."
      },
      {
        name: "스트롱 리프트 5x5",
        intro: "스쿼트, 벤치, 데드, 밀프, 바벨로우 5가지 종목을 5회 5세트로 수행하는 가장 유명한 초보자 루틴입니다.",
        pros: "매우 단순하고 앱 지원이 강력함. 근력 향상 속도가 빠름.",
        cons: "하체 비중이 지나치게 높음(스쿼트 주 3회). 상체 볼륨이 부족하여 'T-Rex' 체형이 될 수 있음."
      },
      {
        name: "스타팅 스트렝스 (Starting Strength)",
        intro: "스트롱 리프트의 원조 격인 프로그램으로, 3x5 루틴을 기본으로 하며 파워 클린이 포함되어 있습니다.",
        pros: "가장 빠르고 효율적인 하체 스트렝스 향상. 폭발적인 힘(파워) 개발.",
        cons: "상체 볼륨이 매우 적음. 파워 클린 자세 습득이 어려움."
      },
      {
        name: "GZCLP",
        intro: "파워리프터 Cody Lefever가 만든 선형 주기화 프로그램. T1(고중량), T2(볼륨), T3(보조) 등급으로 운동을 나눕니다.",
        pros: "단순 5x5보다 구성이 유연함. 실패 지점 도달 시 대처법이 명확함. 근비대와 스트렝스를 동시에 잡음.",
        cons: "완전 초보자가 이해하기엔 개념(T1, T2, T3)이 다소 복잡할 수 있음."
      },
      {
        name: "그레이스컬 LP",
        intro: "마지막 세트를 '할 수 있는 만큼(AMRAP)' 수행하는 것이 특징인 프로그램입니다.",
        pros: "컨디션이 좋은 날 더 많은 볼륨을 가져갈 수 있음. 상체 운동 비중이 적절하여 밸런스가 좋음.",
        cons: "AMRAP 세트에서 자세가 무너질 위험이 있어 주의가 필요함."
      },
      {
        name: "캔디토 리니어 (Candito LP)",
        intro: "Jonnie Candito가 만든 프로그램으로, '스트렝스/컨트롤' 또는 '스트렝스/근비대' 옵션을 선택할 수 있습니다.",
        pros: "초보자 프로그램 치고 보조 운동 구성이 매우 알참. 하체 폭발력 성장에 좋음.",
        cons: "기본 5x5보다는 루틴 구성이 약간 복잡할 수 있음."
      }
    ]
  },
  "bodybuilding": {
    title: "보디빌딩 (Bodybuilding)",
    desc: "근육의 크기(근비대)와 미적 완성도를 최우선으로 하는 분할 훈련입니다.",
    items: [
      {
        name: "2분할 (상체/하체)",
        intro: "몸을 상체와 하체로 나누어 주 4회(월화/목금) 수행하는 방식입니다.",
        pros: "부위당 주 2회 빈도로 근비대 효율이 가장 좋음. 회복 시간이 적절함.",
        cons: "하루에 소화해야 할 종목 수가 많아 운동 시간이 길어짐."
      },
      {
        name: "3분할 (Push/Pull/Legs)",
        intro: "미는 운동(가슴,삼두,어깨), 당기는 운동(등,이두), 하체로 나누어 주 6회 또는 3일 운동 1일 휴식으로 진행합니다.",
        pros: "가장 대중적이고 밸런스가 좋음. 관련된 근육을 묶어 효율적임.",
        cons: "주 6회 수행 시 피로도가 높음. 스케줄 관리가 필요함."
      },
      {
        name: "4분할 (어깨/등/가슴/하체)",
        intro: "대근육 위주로 하루에 한 부위씩 강도 높게 타격합니다.",
        pros: "한 부위에 집중하여 영혼까지 털어버릴 수 있음.",
        cons: "부위당 주 1회 빈도로 내추럴 훈련자에게는 빈도가 부족할 수 있음."
      },
      {
        name: "5분할 (Bro Split)",
        intro: "가슴, 등, 하체, 어깨, 팔 등 하루에 한 부위만 수행합니다.",
        pros: "펌핑감이 좋고 집중도가 최상임. 루틴이 단순함.",
        cons: "초중급자에게는 비효율적임. 한 번 운동 후 휴식 기간이 너무 김."
      }
    ]
  },
  "powerbuilding": {
    title: "파워빌딩 (Powerbuilding)",
    desc: "파워리프팅(고중량)과 보디빌딩(근비대)의 장점을 합친 하이브리드 훈련입니다.",
    items: [
      {
        name: "PHAT",
        intro: "Layne Norton이 고안한 프로그램. 상/하체(파워) + 등어깨/하체/가슴팔(근비대)로 주 5회 수행합니다.",
        pros: "고중량 훈련과 고반복 펌핑을 한 주에 모두 가져갈 수 있음. 훈련이 재미있음.",
        cons: "볼륨이 살벌해서 회복력이 부족하면 금방 지침. 루틴이 길다."
      },
      {
        name: "PHUL",
        intro: "주 4회 구성으로 상체 파워 / 하체 파워 / 상체 근비대 / 하체 근비대로 나뉩니다.",
        pros: "주 4회라 직장인이 소화하기 최적임. 스트렝스와 근비대 밸런스가 아주 좋음.",
        cons: "주 5~6회 운동을 선호하는 사람에게는 볼륨이 부족하게 느껴질 수 있음."
      }
    ]
  },
  "powerlifting": {
    title: "파워리프팅 (Powerlifting)",
    desc: "3대 운동(스쿼트, 벤치, 데드)의 1RM 중량을 늘리는 것이 목적인 훈련입니다.",
    items: [
      {
        name: "매드카우 5x5",
        intro: "초중급자를 위한 주간 주기화 프로그램. 월(볼륨), 수(회복), 금(강도)로 나뉩니다.",
        pros: "매주 PR을 갱신하는 재미가 있음. 체계적인 강도 조절로 오버트레이닝 방지.",
        cons: "볼륨이 적어 근비대에는 불리함. 금요일 강도가 매우 높음."
      },
      {
        name: "텍사스 메소드",
        intro: "매드카우보다 볼륨이 더 높은 중급자용 프로그램. 월(고볼륨), 수(회복), 금(고중량/PR) 구조입니다.",
        pros: "강력한 스트렝스 향상 효과. 정신력 강화.",
        cons: "월요일 훈련(5x5 @ 90%)이 지옥같이 힘듦. 회복 실패 시 부상 위험 높음."
      },
      {
        name: "캔디토 6주 (Candito 6 Week)",
        intro: "Jonnie Candito가 만든 6주 완성 피킹 프로그램. 주차별로 볼륨과 강도가 드라마틱하게 변합니다.",
        pros: "딱 6주 돌리고 PR 재기 좋음. 무료 엑셀 파일이 유명하고 커뮤니티 검증 완료.",
        cons: "벤치프레스 볼륨이 적다는 평이 많음. 스쿼트 주차가 매우 힘듦."
      },
      {
        name: "쉐이코 (Sheiko)",
        intro: "러시아 스타일의 훈련법. 70~80% 강도로 엄청난 고볼륨을 수행하며 자세를 완벽하게 만듭니다.",
        pros: "자세 교정과 테크닉 완성에 최고. 수행 능력이 비약적으로 상승함.",
        cons: "운동 시간이 매우 김(2시간 이상). 반복 숙달이라 지루할 수 있음."
      }
    ]
  },
  "strength": {
    title: "스트렝스 (General Strength)",
    desc: "특정 종목에 국한되지 않고 전반적인 힘과 수행 능력을 기르는 훈련입니다.",
    items: [
      {
        name: "웬들러 5/3/1",
        intro: "자신의 1RM의 90%(Training Max)를 기준으로 천천히 중량을 올리는 장기 프로젝트형 프로그램입니다.",
        pros: "지속 가능하고 부상 위험이 적음. 유연한 보조 운동 설정 가능. 장기적 우상향.",
        cons: "증량 속도가 매우 느려 성격 급한 사람은 답답함. 본세트 볼륨이 다소 적음."
      },
      {
        name: "저거너트 메소드 (Juggernaut)",
        intro: "10회-8회-5회-3회 주기로 몇 달에 걸쳐 천천히 강도를 올리는 주기화 프로그램입니다.",
        pros: "컨디셔닝과 근지구력부터 시작해 기초가 튼튼해짐. 모든 스포츠 선수에게 적합.",
        cons: "한 주기가 16주로 매우 길어서 끈기가 필요함."
      },
      {
        name: "스몰로브 (Smolov)",
        intro: "단기간에 스쿼트 중량을 폭발시키는 구소련 출신 충격 요법 프로그램입니다.",
        pros: "효과 하나는 확실함. 스쿼트 중량이 떡상함.",
        cons: "부상 위험이 매우 높음. 훈련 기간 동안 걷기도 힘들 수 있음. 초보자 금지."
      }
    ]
  }
};

export default function ProgramsPage() {
  const [category, setCategory] = useState("beginner");

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="space-y-4">
            <h1 className="text-3xl font-black italic uppercase flex items-center gap-3">
              <FaBook className="text-lime-500" /> 프로그램 가이드
            </h1>
            <p className="text-zinc-400">자신의 목표와 수준에 맞는 최적의 프로그램을 선택하세요.</p>
          </div>

          {/* 카테고리 탭 (5개) */}
          <div className="flex flex-wrap gap-4">
            <TabButton label="초급자" icon={<FaDumbbell />} id="beginner" current={category} set={setCategory} />
            <TabButton label="보디빌딩" icon={<FaRunning />} id="bodybuilding" current={category} set={setCategory} />
            <TabButton label="파워빌딩" icon={<FaBolt />} id="powerbuilding" current={category} set={setCategory} />
            <TabButton label="파워리프팅" icon={<FaFistRaised />} id="powerlifting" current={category} set={setCategory} />
            <TabButton label="스트렝스" icon={<FaMedal />} id="strength" current={category} set={setCategory} />
          </div>

          {/* 컨텐츠 영역 */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
              <h2 className="text-2xl font-black text-lime-500 mb-2">{PROGRAMS[category].title}</h2>
              <p className="text-zinc-300">{PROGRAMS[category].desc}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {PROGRAMS[category].items.map((item, idx) => (
                <div key={idx} className="bg-zinc-800 p-6 rounded-3xl border border-zinc-700 hover:border-lime-500 transition-colors shadow-lg flex flex-col h-full">
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-8 bg-lime-500 rounded-full"></span>
                    {item.name}
                  </h3>
                  <p className="text-zinc-300 mb-6 leading-relaxed flex-grow">{item.intro}</p>
                  
                  <div className="space-y-4 mt-auto">
                    <div className="bg-zinc-900/50 p-4 rounded-xl">
                      <span className="text-xs font-black text-blue-400 uppercase block mb-1">장점 (PROS)</span>
                      <p className="text-sm text-zinc-200">{item.pros}</p>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl">
                      <span className="text-xs font-black text-red-400 uppercase block mb-1">단점 (CONS)</span>
                      <p className="text-sm text-zinc-200">{item.cons}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function TabButton({ label, icon, id, current, set }: any) {
  const active = current === id;
  return (
    <button 
      onClick={() => set(id)}
      className={`flex-1 min-w-[120px] p-4 rounded-2xl font-bold transition-all flex flex-col items-center gap-2 border-2 ${active ? "bg-lime-500 border-lime-500 text-black scale-[1.02]" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}