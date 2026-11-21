import React,{useState,useEffect} from 'react'
import {PieChart,Pie,Cell,Tooltip,ResponsiveContainer,BarChart,Bar,XAxis,YAxis} from 'recharts'
import {inr,api} from './lib.js'
const Load=()=><div className="card">Loading…</div>

export function Runway(){
 const[d,setD]=useState(),[e,setE]=useState('')
 useEffect(()=>{api('/runway-detail').then(setD).catch(x=>setE(x.message))},[])
 if(e)return <div className="warn">{e}</div>; if(!d)return <Load/>
 const pct=d.months==null?1:Math.min(d.months/12,1),C=2*Math.PI*70
 return <><h2>Survival Runway</h2><div className="grid"><div className="card" style={{textAlign:'center'}}>
 <svg width="180" height="180" viewBox="0 0 180 180"><circle cx="90" cy="90" r="70" fill="none" stroke="#e6ebe4" strokeWidth="16"/>
 <circle cx="90" cy="90" r="70" fill="none" stroke="#1F6B52" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${C*pct} ${C}`} transform="rotate(-90 90 90)"/>
 <text x="90" y="92" textAnchor="middle" fontSize="30" fontWeight="800" fill="#123C32">{d.months??'∞'}</text><text x="90" y="114" textAnchor="middle" fontSize="13" fill="#7A857E">months</text></svg>
 <div><b>{d.level}</b> · {d.days} days</div><small>Gauge full = 12 months</small></div>
 <div className="card">Liquid savings<div className="big">{inr(d.savings)}</div>Monthly essential outflow<div className="big">{inr(d.outflow)}</div>
 <small>Essentials {inr(d.essentials)} + EMIs {inr(d.emi)}</small><p>Savings run out around: <b>{d.runs_out_on||'n/a'}</b></p></div></div>
 <div className="card"><b>How to improve</b><ul>{d.tips.map(t=><li key={t}>{t}</li>)}<li>To reach 6 months you would need about {inr(d.needed_for_6m)} more in usable savings.</li></ul></div>
 <div className="card"><small>{d.assumptions} Illiquid assets (PPF, property, locked deposits) are never counted.</small></div></>}

export function Dependency(){
 const[m,setM]=useState(),[w,setW]=useState([])
 useEffect(()=>{api('/metrics').then(setM);api('/dependency-whatif').then(setW)},[])
 if(!m)return <Load/>; const d=m.dependency,col={High:'#b3402a',Medium:'#c9a227',Low:'#1F6B52'}[d.risk]
 const pie=[{n:'Primary',v:d.primary},{n:'Secondary',v:d.secondary}]
 return <><h2>Income Dependency</h2><div className="grid"><div className="card"><ResponsiveContainer height={200}><PieChart><Pie data={pie} dataKey="v" nameKey="n" innerRadius={55}>{pie.map((_,i)=><Cell key={i} fill={['#123C32','#8BCF9B'][i]}/>)}</Pie><Tooltip formatter={x=>inr(x)}/></PieChart></ResponsiveContainer></div>
 <div className="card">Dependency<div className="big" style={{color:col}}>{d.pct}%</div><b style={{color:col}}>{d.risk} risk</b>
 <p>{d.pct>85?'Almost all your money comes from one source. If it stops, everything stops.':d.pct>60?'You lean heavily on one source, but have some cushion.':'Your income is reasonably spread out.'}</p><small>= Primary ÷ Total monthly income × 100</small></div></div>
 <div className="card"><b>How extra income reduces dependency</b><ResponsiveContainer height={200}><BarChart data={w.map(x=>({k:'+'+inr(x.extra),pct:x.pct}))}><XAxis dataKey="k"/><YAxis domain={[0,100]}/><Tooltip/><Bar dataKey="pct" fill="#1F6B52"/></BarChart></ResponsiveContainer></div></>}

export function Radar({go}){
 const[o,setO]=useState(),[saved,setSaved]=useState([]),[f,setF]=useState('match'),[err,setErr]=useState('')
 useEffect(()=>{api('/opportunities').then(setO);api('/profile').then(p=>setSaved(p.saved||[]))},[])
 if(!o)return <Load/>
 const F={match:['Highest skill match',a=>a,(x,y)=>y.match-x.match],invest:['Lowest investment',a=>a,(x,y)=>x.invest-y.invest],time:['Least time',a=>a,(x,y)=>x.hrs-y.hrs],online:['Online only',a=>a.filter(x=>x.online),(x,y)=>y.match-x.match],begin:['Beginner-friendly',a=>a.filter(x=>x.diff==='Beginner'),(x,y)=>y.match-x.match]}
 const list=F[f][1](o).sort(F[f][2])
 const save=async n=>{try{setSaved(await api('/profile/save-opportunity','POST',{name:n}))}catch(e){setErr(e.message)}}
 const build=async n=>{await save(n);await api('/roadmap','POST',{name:n});go('Roadmap')}
 return <><h2>Opportunity Radar</h2><small>All earning figures are illustrative estimates, never guaranteed.</small>
 <div style={{margin:'10px 0'}}>{Object.entries(F).map(([k,v])=><span key={k} className={'tag'+(f===k?' on':'')} onClick={()=>setF(k)}>{v[0]}</span>)}</div>{err&&<div className="warn">{err}</div>}
 {!list.length&&<div className="card">Nothing matches. Add skills under My Financial Profile or change the filter.</div>}
 {list.map(x=><div className="card" key={x.name}><b>{x.name}</b> · {x.match}% match<br/>{x.why}<br/>{inr(x.min)}–{inr(x.max)}/mo · {x.hrs} hrs/wk · Invest {inr(x.invest)} · {x.diff} · {x.risk} risk<br/>Skills: {x.skills.join(', ')}<br/><small>First step: {x.first}</small><p>
 <button className="btn alt" onClick={()=>save(x.name)}>{saved.includes(x.name)?'✓ Saved':'Save'}</button> <button className="btn" onClick={()=>build(x.name)}>Build a roadmap</button></p></div>)}</>}

const MAP={Python:['Tutoring','Automation projects','Small web apps'],Programming:['Freelance development','Workshops','Small web apps'],Designing:['Freelance designs','Social media creatives','Digital templates'],Teaching:['Online tutoring','Workshops','Educational content'],Tutoring:['1:1 online classes','Doubt-clearing sessions'],Writing:['Freelance writing','Blog creation','Content services'],Marketing:['Social media management','Local business campaigns'],'Video editing':['Reels/shorts editing','YouTube editing'],Photography:['Events and product shoots','Stock photos']}
const NEXT={Python:['Teaching','Marketing'],Designing:['Marketing'],Writing:['Marketing'],Teaching:['Python'],Programming:['Designing']}
export function SkillMapper(){
 const[p,setP]=useState(),[s,setS]=useState({}),[c,setC]=useState('')
 useEffect(()=>{api('/profile').then(setP);api('/settings').then(r=>setS(r.settings.skill_levels||{}))},[])
 if(!p)return <Load/>
 const saveP=async np=>{await api('/profile','PUT',np);setP(np)}
 const tog=k=>saveP({...p,skills:p.skills.includes(k)?p.skills.filter(x=>x!==k):[...p.skills,k]})
 const lvl=(k,v)=>{const n={...s,[k]:v};setS(n);api('/settings','PUT',{settings:{skill_levels:n}})}
 const all=[...new Set([...Object.keys(MAP),...p.skills])]
 const sugg=[...new Set(p.skills.flatMap(k=>NEXT[k]||[]))].filter(x=>!p.skills.includes(x))
 return <><h2>Skill-to-Income Mapper</h2><small>Tap skills to select; rate your own strength (1–5).</small>
 <div style={{margin:10}}>{all.map(k=><span key={k} className={'tag'+(p.skills.includes(k)?' on':'')} onClick={()=>tog(k)}>{k}</span>)}</div>
 <div className="card" style={{display:'flex',gap:8}}><input placeholder="Custom skill" value={c} onChange={e=>setC(e.target.value)}/><button className="btn" onClick={()=>{if(c.trim()&&!p.skills.includes(c.trim())){tog(c.trim());setC('')}}}>Add</button></div>
 {!p.skills.length&&<div className="card">Select a skill to see income possibilities.</div>}
 {p.skills.map(k=><div className="card" key={k}><b>{k}</b> → {(MAP[k]||['Search for local demand','Offer small paid trial projects']).join(' · ')}
 <div>Strength: {[1,2,3,4,5].map(n=><span key={n} className={'tag'+((s[k]||0)>=n?' on':'')} onClick={()=>lvl(k,n)}>{n}</span>)}</div></div>)}
 {sugg.length>0&&<div className="card"><b>Skills worth building next:</b> {sugg.join(', ')}</div>}</>}

export function Settings({go}){
 const[d,setD]=useState(),[n,setN]=useState(''),[m,setM]=useState('')
 useEffect(()=>{api('/settings').then(r=>{setD(r);setN(r.name)})},[])
 if(!d)return <Load/>; const st=d.settings
 const set=async(k,v)=>{const x={...d,settings:{...st,[k]:v}};setD(x);await api('/settings','PUT',{settings:{[k]:v}})}
 const T=(k,l)=><label key={k} style={{display:'block',margin:8}}><input type="checkbox" style={{width:'auto'}} checked={!!st[k]} onChange={e=>set(k,e.target.checked)}/> {l}</label>
 return <><h2>Settings</h2><div className="card"><b>Personal information</b><p>{d.email}</p><input value={n} onChange={e=>setN(e.target.value)}/>
 <button className="btn" onClick={async()=>{if(!n.trim())return setM('Name cannot be empty.');await api('/settings','PUT',{name:n});setM('Saved.')}}>Save name</button> {m}
 <p><button className="btn alt" onClick={()=>go('My Financial Profile')}>Edit financial profile, skills and assets</button></p></div>
 <div className="card"><b>Notifications</b>{T('n_runway','Alert me when runway is below 3 months')}{T('n_weekly','Weekly progress summary')}</div>
 <div className="card"><b>Privacy</b>{T('p_anon','Allow anonymised usage analytics')}<small>Your data stays in this app's database and is never used to move money.</small></div>
 <button className="btn" onClick={()=>{localStorage.clear();location.reload()}}>Log out</button></>}

const INFO={'How It Works':['1. Build your profile','Tell us your income, expenses, savings, skills, assets and free time.','2. See your runway','We compute how many months you last if income stops, plus how dependent you are on one source.','3. Find opportunities','We match your skills and assets to realistic income ideas.','4. Follow a roadmap','Pick one and follow a 4-week plan. Simulate the impact on your runway.'],
 Features:['Survival Runway','Months of safety if income stops.','Opportunity Radar','Ideas matched to your skills and assets.','Simulators','Test income loss and second-income scenarios.','Liquidity Map','See which assets are truly emergency cash.'],
 About:['About AssetForge','AssetForge helps people build a second income engine before a crisis happens, using skills, time and assets they already have. All earning figures are illustrative estimates, never guarantees.'],
 FAQ:['Is income guaranteed?','No. Every figure is an illustrative estimate.','Does AssetForge move money?','Never.','How is runway calculated?','Usable liquid savings ÷ (essential expenses + mandatory EMIs).','Is my data private?','It stays in the app database; see the Privacy Policy.'],
 Privacy:['Privacy Policy','We store the details you enter (profile, skills, assets) to personalise results. Passwords are hashed. We do not sell data. This is a hackathon prototype; do not enter real bank credentials.'],
 Terms:['Terms and Conditions','AssetForge provides educational estimates, not financial advice. Results are hypothetical. You are responsible for your financial decisions.']}
export function Public({name}){
 const[f,setF]=useState({name:'',email:'',message:''}),[m,setM]=useState('')
 if(name==='Contact')return <div className="main"><h2>Contact</h2><div className="card">{['name','email','message'].map(k=><input key={k} placeholder={k} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>)}
 <button className="btn" onClick={async()=>{try{const r=await api('/contact','POST',f);setM(r.message)}catch(e){setM('Please fill in all fields (valid email, message of 5+ characters).')}}}>Send</button><p>{m}</p></div></div>
 const c=INFO[name]||INFO.About
 return <div className="main"><h2>{name}</h2>{c.reduce((a,x,i)=>i%2?a:[...a,[x,c[i+1]]],[]).map(([h,t])=><div className="card" key={h}><b>{h}</b><p>{t}</p></div>)}</div>}
