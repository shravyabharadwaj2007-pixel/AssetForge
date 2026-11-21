import hashlib, secrets, json
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base, sessionmaker
import calc, opportunities as opp

Base = declarative_base()
engine = create_engine("sqlite:///assetforge.db", connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True); email = Column(String, unique=True); name = Column(String)
    pw = Column(String); token = Column(String, index=True)
    profile = Column(Text, default="{}")  # JSON: financials, skills, assets, saved opps
Base.metadata.create_all(engine)

DEMO = {"primary_income":30000,"essential_expenses":20000,"non_essential_expenses":6000,"emi":5000,"savings":50000,
        "other_income":0,"free_hours":6,"budget":0,"skills":["Python","Tutoring"],"assets":["Laptop","Camera"],"saved":["Python tutoring"]}
def hp(p, salt="af"): return hashlib.pbkdf2_hmac("sha256", p.encode(), salt.encode(), 100_000).hex()

app = FastAPI(title="AssetForge API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def db():
    s = Session()
    try: yield s
    finally: s.close()
def me(authorization: str = Header(""), s=Depends(db)):
    u = s.query(User).filter_by(token=authorization.replace("Bearer ", "")).first()
    if not u: raise HTTPException(401, "Please log in again.")
    return u

class Auth(BaseModel):
    email: str = Field(min_length=5); password: str = Field(min_length=6); name: str = "Friend"
class Profile(BaseModel):
    primary_income: float = Field(ge=0, le=1e7); essential_expenses: float = Field(ge=0, le=1e7)
    non_essential_expenses: float = Field(ge=0, le=1e7); emi: float = Field(ge=0, le=1e7)
    savings: float = Field(ge=0, le=1e9); other_income: float = Field(0, ge=0, le=1e7)
    free_hours: float = Field(6, ge=0, le=100); budget: float = Field(0, ge=0)
    skills: list[str] = []; assets: list[str] = []; saved: list[str] = []

def issue(s, u): u.token = secrets.token_hex(24); s.commit(); return {"token": u.token, "name": u.name}
@app.post("/auth/register")
def register(a: Auth, s=Depends(db)):
    if s.query(User).filter_by(email=a.email).first(): raise HTTPException(400, "Email already registered.")
    u = User(email=a.email, name=a.name, pw=hp(a.password), profile=json.dumps({**DEMO, "primary_income":0,"essential_expenses":0,"non_essential_expenses":0,"emi":0,"savings":0,"skills":[],"assets":[],"saved":[]}))
    s.add(u); s.commit(); return issue(s, u)
@app.post("/auth/login")
def login(a: Auth, s=Depends(db)):
    u = s.query(User).filter_by(email=a.email).first()
    if not u or u.pw != hp(a.password): raise HTTPException(400, "Incorrect email or password.")
    return issue(s, u)
@app.post("/auth/demo")
def demo(s=Depends(db)):
    u = s.query(User).filter_by(email="demo@assetforge.in").first()
    if not u: u = User(email="demo@assetforge.in", name="Aarav", pw=hp("demo1234"), profile=json.dumps(DEMO)); s.add(u); s.commit()
    return issue(s, u)

P = lambda u: json.loads(u.profile)
@app.get("/profile")
def get_profile(u=Depends(me)): return {"name": u.name, **P(u)}
@app.put("/profile")
def put_profile(p: Profile, u=Depends(me), s=Depends(db)):
    cur = P(u); cur.update(p.model_dump()); u.profile = json.dumps(cur); s.commit(); return {"ok": True}
@app.get("/metrics")
def metrics(u=Depends(me)): return calc.metrics(P(u))
@app.get("/opportunities")
def opps(u=Depends(me)):
    p = P(u); return opp.match(p["skills"], p["assets"], p["free_hours"], p["budget"])
class Loss(BaseModel):
    savings: float = Field(ge=0); essentials: float = Field(ge=0); emi: float = Field(ge=0); secondary: float = Field(0, ge=0); other: float = Field(0, ge=0)
@app.post("/simulate/loss")
def sim_loss(b: Loss, u=Depends(me)): return calc.loss_sim(b.savings, b.essentials, b.emi, b.secondary, b.other)
class Second(BaseModel):
    extra: float = Field(ge=0, le=1e6); cost: float = Field(0, ge=0)
@app.post("/simulate/second")
def sim_second(b: Second, u=Depends(me)): return calc.second_income(P(u), b.extra, b.cost)
class Chat(BaseModel): message: str
@app.post("/coach")
def coach(c: Chat, u=Depends(me)):
    p = P(u); return {"reply": opp.coach(c.message, p, calc.metrics(p))}  # rule-based; plug Gemini/OpenAI here when key set

import datetime as dt
class Asset(BaseModel):
    name: str = Field(min_length=1, max_length=60); value: float = Field(0, ge=0, le=1e10); available: bool = False
@app.get("/assets")
def get_assets(u=Depends(me)):
    p = P(u); return p.get("asset_list") or [{"name": a, "value": 0, "available": False} for a in p["assets"]]
@app.put("/assets")
def put_assets(a: list[Asset], u=Depends(me), s=Depends(db)):
    cur = P(u); cur["asset_list"] = [x.model_dump() for x in a]; cur["assets"] = [x.name for x in a]
    u.profile = json.dumps(cur); s.commit(); return {"ok": True}
@app.get("/liquidity")
def liquidity(u=Depends(me)): return calc.liquidity_summary(get_assets(u), P(u)["savings"])
@app.get("/idle-assets")
def idle(u=Depends(me)): return opp.idle_assets(get_assets(u))
class RM(BaseModel): name: str = Field(min_length=1)
@app.post("/roadmap")
def make_roadmap(b: RM, u=Depends(me), s=Depends(db)):
    cur = P(u); start = dt.date.today(); tasks = []
    for wk, items in enumerate(opp.roadmap_template(b.name), 1):
        for t in items:
            tasks.append({"id": len(tasks) + 1, "week": wk, "title": t, "done": False, "due": str(start + dt.timedelta(days=7 * wk))})
    cur["roadmap"] = {"name": b.name, "tasks": tasks}; u.profile = json.dumps(cur); s.commit(); return cur["roadmap"]
@app.get("/roadmap")
def get_roadmap(u=Depends(me)): return P(u).get("roadmap")
class TaskUp(BaseModel): id: int; done: bool | None = None; title: str | None = None
@app.patch("/roadmap/task")
def upd_task(b: TaskUp, u=Depends(me), s=Depends(db)):
    cur = P(u); rm = cur.get("roadmap")
    if not rm: raise HTTPException(404, "No roadmap yet.")
    for t in rm["tasks"]:
        if t["id"] == b.id:
            if b.done is not None: t["done"] = b.done
            if b.title: t["title"] = b.title
    u.profile = json.dumps(cur); s.commit(); return rm
@app.post("/profile/save-opportunity")
def save_opp(b: RM, u=Depends(me), s=Depends(db)):
    cur = P(u); sv = cur.setdefault("saved", [])
    if b.name not in sv: sv.append(b.name)
    u.profile = json.dumps(cur); s.commit(); return sv

@app.get("/runway-detail")
def rdetail(u=Depends(me)): return calc.runway_detail(P(u))
@app.get("/dependency-whatif")
def dwhatif(u=Depends(me)): return calc.dependency_whatif(P(u))
class SettingsIn(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=60); settings: dict = {}
@app.get("/settings")
def get_settings(u=Depends(me)): return {"name": u.name, "email": u.email, "settings": P(u).get("settings", {})}
@app.put("/settings")
def put_settings(b: SettingsIn, u=Depends(me), s=Depends(db)):
    cur = P(u); cur["settings"] = {**cur.get("settings", {}), **b.settings}
    if b.name: u.name = b.name
    u.profile = json.dumps(cur); s.commit(); return {"ok": True}
class Contact(BaseModel):
    name: str = Field(min_length=1); email: str = Field(min_length=5); message: str = Field(min_length=5)
@app.post("/contact")
def contact(c: Contact): return {"ok": True, "message": "Thanks! We'll get back to you."}
