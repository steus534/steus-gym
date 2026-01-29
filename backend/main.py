import json
import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DB_FILE = "database.json"

# 데이터 모델
class Record(BaseModel):
    date: str          # YYYY-MM-DD
    lift: str          # squat, bench, deadlift
    weight: float
    reps: int
    sets: int
    is_comp: bool      # True: 대회/측정용(1RM), False: 훈련용
    bodyweight: float  # 점수 계산용 체중
    gender: str

class UserInput(BaseModel):
    gender: str; unit: str; weight: float; height: float; age: int
    squat: float; bench: float; deadlift: float
    split: str; goal: str
    protein_mult: float

# --- 헬퍼 함수: DB 로드/저장 ---
def load_db():
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# --- API ---

@app.post("/record")
async def add_record(record: Record):
    db = load_db()
    # 볼륨 & 추정 1RM 계산 (Epley)
    volume = record.weight * record.reps * record.sets
    est_1rm = record.weight * (1 + record.reps / 30)
    
    entry = record.dict()
    entry["volume"] = volume
    entry["est_1rm"] = round(est_1rm, 1)
    
    db.append(entry)
    save_db(db)
    return {"msg": "기록 저장 완료"}

@app.get("/history")
async def get_history():
    db = load_db()
    # 날짜순 정렬
    sorted_db = sorted(db, key=lambda x: x["date"])
    return sorted_db

@app.post("/calculate")
async def calculate_fitness(data: UserInput):
    # (기존 로직 유지)
    w = data.weight if data.unit == "metric" else data.weight * 0.4535
    h = data.height if data.unit == "metric" else data.height * 30.48
    bmr = 10 * w + 6.25 * h - 5 * data.age + (5 if data.gender == "male" else -161)
    act_levels = {"1": 1.2, "2": 1.375, "3": 1.55, "5": 1.725}
    tdee = bmr * act_levels.get(data.split, 1.375)
    goal_map = {"bulk": 400, "cut": -500, "diet": -300, "lean": 150}
    target_kcal = tdee + goal_map.get(data.goal, 0)
    prot_g = w * data.protein_mult
    prot_cal = prot_g * 4
    fat_cal = target_kcal * 0.25
    fat_g = fat_cal / 9
    carb_cal = target_kcal - prot_cal - fat_cal
    carb_g = carb_cal / 4
    total_cal = carb_cal + prot_cal + fat_cal
    
    macros_chart = [
        {"name": "탄수화물", "value": round(carb_g), "cal": round(carb_cal), "ratio": round((carb_cal/total_cal)*100), "fill": "#3b82f6"},
        {"name": "단백질", "value": round(prot_g), "cal": round(prot_cal), "ratio": round((prot_cal/total_cal)*100), "fill": "#ef4444"},
        {"name": "지방", "value": round(fat_g), "cal": round(fat_cal), "ratio": round((fat_cal/total_cal)*100), "fill": "#eab308"},
    ]
    routines = {
        "1": ["무분할: 스쿼트, 벤치, 데드리프트, 밀프, 풀업 (주 3회)"],
        "2": ["2분할: 상체(가슴,등,어깨) / 하체(스쿼트,데드,팔) (주 4회)"],
        "3": ["3분할: 밀기 / 당기기 / 하체 (주 6회)"],
        "5": ["5분할: 가슴 / 등 / 어깨 / 하체 / 팔 (고립 위주)"]
    }
    return {"kcal": round(target_kcal), "macros_chart": macros_chart, "routine": routines.get(data.split, ["루틴 준비중"])}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)