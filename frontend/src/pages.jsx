import React,{useState,useEffect} from 'react'
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,Cell} from 'recharts'
import {inr,api} from './lib.js'

export function Landing2({go,nav}){
 const steps=['Build your profile','See your runway','Find opportunities','Follow a roadmap']
 const faq=[['Is income guaranteed?','No. All earning figures are illustrative estimates.'],['Does AssetForge move money?','Never. It only analyses and suggests.'],['What is Survival Runway?','Usable liquid savings ÷ (essential expenses + EMIs), in months.']]
 return <>
 <div className="hero"><h1 style={{fontSize:42,maxWidth:700,margin:'0 auto 12px'}}>Your Next Income Stream Might Already Be Within Your Reach.</h1>
 <p>Build income from what you already have. Prepare for what comes next.</p>
 <button className="btn alt" onClick={go}>Build My Financial Profile</button> <a href="#how" style={{color:'#fff',marginLeft:12}}>Explore How It Works</a></div>
 <div className="main"><h2>The problem</h2><p>Most people depend on one salary and have only weeks of savings. AssetForge shows the gap and a way to close it.</p>
 <div className="grid"><div className="card"><h3>Asset Maker Engine</h3>Skills, time and assets → realistic income ideas.</div><div className="card"><h3>Survival Runway Engine</h3>How long can you last if income stops?</div></div>
 <h2 id="how">How it works</h2><div className="grid">{steps.map((t,i)=><div className="card" key={t}><div className="big">{i+1}</div>{t}</div>)}</div>
 <h2>Sample transformation</h2><div className="card">Runway 2.0 months → about 2.6 months with an illustrative ₹6,000/month side income (₹50,000 savings, ₹25,000 essentials + EMI).</div>
 <h2>Built for</h2><p>Salaried employees · Students · Freelancers · Gig workers · Small business owners</p>
 <h2>FAQ</h2>{faq.map(([q,a])=><div className="card" key={q}><b>{q}</b><br/>{a}</div>)}</div>
 <footer>AssetForge · {['About','Contact','Privacy','Terms'].map(k=><button key={k} onClick={()=>{nav(k);window.scrollTo(0,0)}} style={{background:'none',border:0,color:'#cde',cursor:'pointer'}}>{k}</button>)}</footer></>}

const SK=['Programming','Python','Designing','Teaching','Tutoring','Writing','Marketing','Video editing','Photography','Business skills']
const AS=['Laptop','Camera','Smartphone','Bike','Car','Spare room','Equipment','Domain or website']
export function Onboarding(){
 const[step,setStep]=useState(0),[f,setF]=useState(null),[msg,setMsg]=useState(''),[err,setErr]=useState(''),[custom,setCustom]=useState('')
 useEffect(()=>{api('/profile').then(setF)},[])
 if(!f) return <div className="card">Loading…</div>
 const num=k=><label key={k}>{k.replace(/_/g,' ')}<input type="number" min="0" value={f[k]} onChange={e=>setF({...f,[k]:Math.max(0,+e.target.value)})}/></label>
 const tog=(k,v)=>setF({...f,[k]:f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v]})
 const chips=(k,opts)=><div>{[...new Set([...opts,...f[k]])].map(o=><span key={o} className={'tag'+(f[k].includes(o)?' on':'')} onClick={()=>tog(k,o)}>{o}</span>)}
  <div style={{display:'flex',gap:8}}><input placeholder="Add custom" value={custom} onChange={e=>setCustom(e.target.value)}/><button className="btn alt" onClick={()=>{if(custom.trim()){setF({...f,[k]:[...f[k],custom.trim()]});setCustom('')}}}>Add</button></div></div>
 const titles=['Basics','Finances','Skills','Assets','Availability']
 const save=async()=>{try{await api('/profile','PUT',f);await api('/assets','PUT',f.assets.map(n=>({name:n,value:0,available:false})));setMsg('Saved! Check your Overview.');setErr('')}catch(e){setErr(e.message)}}
 return <><h2>Financial profile · {titles[step]} ({step+1}/5)</h2><div className="bar"><i style={{width:(step+1)*20+'%'}}/></div>
 <div className="card">{step==0&&<p>Your name and city are set at sign-up. Tell us about your money next.</p>}
 {step==1&&<div className="grid">{['primary_income','other_income','essential_expenses','non_essential_expenses','emi','savings'].map(num)}</div>}
 {step==2&&chips('skills',SK)}{step==3&&chips('assets',AS)}
 {step==4&&<div className="grid">{['free_hours','budget'].map(num)}</div>}
 {err&&<p style={{color:'#b00'}}>{err}</p>}{msg&&<p style={{color:'#1F6B52'}}>{msg}</p>}
 <button className="btn alt" disabled={!step} onClick={()=>setStep(step-1)}>Back</button> {step<4?<button className="btn" onClick={()=>setStep(step+1)}>Next</button>:<button className="btn" onClick={save}>Save profile</button>}</div></>}

export function Roadmap({go}){
 const[rm,setRm]=useState(),[loading,setL]=useState(true),[opps,setO]=useState([])
 useEffect(()=>{api('/roadmap').then(setRm).finally(()=>setL(false));api('/opportunities').then(setO)},[])
 const make=async n=>setRm(await api('/roadmap','POST',{name:n}))
 const up=async b=>setRm(await api('/roadmap/task','PATCH',b))
 if(loading) return <div className="card">Loading…</div>
 if(!rm) return <><h2>Asset Building Roadmap</h2><div className="card">No roadmap yet. Pick an opportunity:{opps.map(o=><p key={o.name}><button className="btn" onClick={()=>make(o.name)}>Build roadmap: {o.name}</button></p>)}{!opps.length&&<p>Add skills in Onboarding first.</p>}</div></>
 const done=rm.tasks.filter(t=>t.done).length,pct=Math.round(done/rm.tasks.length*100)
 return <><h2>Roadmap: {rm.name}</h2><div className="bar"><i style={{width:pct+'%'}}/></div><p>{pct}% complete ({done}/{rm.tasks.length})</p>
 {[1,2,3,4].map(w=><div className="card" key={w}><b>Week {w}</b>{rm.tasks.filter(t=>t.week==w).map(t=><div key={t.id} style={{display:'flex',gap:8,alignItems:'center',margin:'8px 0'}}>
 <input type="checkbox" style={{width:'auto'}} checked={t.done} onChange={e=>up({id:t.id,done:e.target.checked})}/>
 <input defaultValue={t.title} onBlur={e=>e.target.value!==t.title&&up({id:t.id,title:e.target.value})}/><small>Due {t.due}</small></div>)}</div>)}</>}

export function IdleAssets(){
 const[list,setList]=useState([]),[items,setItems]=useState([]),[n,setN]=useState(''),[v,setV]=useState(0),[err,setErr]=useState('')
 const load=()=>{api('/assets').then(setList);api('/idle-assets').then(setItems)}
 useEffect(load,[])
 const save=async l=>{try{await api('/assets','PUT',l);setErr('');load()}catch(e){setErr(e.message)}}
 return <><h2>Idle Asset Finder</h2><small>Owning an asset is not the same as making it available for income. Estimates are illustrative.</small>
 <div className="card" style={{display:'flex',gap:8}}><input placeholder="Asset name" value={n} onChange={e=>setN(e.target.value)}/><input type="number" min="0" placeholder="Value ₹" onChange={e=>setV(+e.target.value)}/>
 <button className="btn" onClick={()=>{if(n.trim()){save([...list,{name:n.trim(),value:v,available:false}]);setN('')}}}>Add</button></div>{err&&<p style={{color:'#b00'}}>{err}</p>}
 {!items.length&&<div className="card">No assets yet. Add one above.</div>}
 {items.map((a,i)=><div className="card" key={i}><b>{a.name}</b> · {a.usage}<br/>Ideas: {a.ideas.join(', ')}<br/>{a.max?`${inr(a.min)}–${inr(a.max)}/mo (illustrative)`:''}<br/><small>Costs: {a.costs} · Risks: {a.risks}</small><br/><small>Next: {a.next}</small><p>
 <button className="btn alt" onClick={()=>save(list.map((x,j)=>j==i?{...x,available:!x.available}:x))}>{a.available?'Mark not available':'Make available for income'}</button> <button className="btn" onClick={()=>save(list.filter((_,j)=>j!=i))}>Remove</button></p></div>)}</>}

const COL={Immediate:'#123C32','Near-cash':'#1F6B52',Delayed:'#8BCF9B',Illiquid:'#c9a227'}
export function Liquidity(){
 const[d,setD]=useState(),[list,setList]=useState([]),[n,setN]=useState(''),[v,setV]=useState(0)
 const load=()=>{api('/liquidity').then(setD);api('/assets').then(setList)}
 useEffect(load,[])
 const add=async()=>{if(!n.trim())return;await api('/assets','PUT',[...list,{name:n.trim(),value:v,available:false}]);setN('');load()}
 if(!d) return <div className="card">Loading…</div>
 const data=Object.entries(d.groups).map(([k,x])=>({k,x}))
 return <><h2>Asset Liquidity Map</h2>{d.warnings.map(w=><div className="warn" key={w}>⚠ {w}</div>)}
 <div className="card"><ResponsiveContainer height={200}><BarChart data={data}><XAxis dataKey="k"/><YAxis/><Tooltip formatter={x=>inr(x)}/><Bar dataKey="x">{data.map(e=><Cell key={e.k} fill={COL[e.k]}/>)}</Bar></BarChart></ResponsiveContainer><small>{d.note}</small></div>
 <div className="card" style={{display:'flex',gap:8}}><input placeholder="e.g. Savings account, PPF, Gold" value={n} onChange={e=>setN(e.target.value)}/><input type="number" min="0" placeholder="Value ₹" onChange={e=>setV(+e.target.value)}/><button className="btn" onClick={add}>Add</button></div>
 {d.items.map((a,i)=><div className="card" key={i}><span className="tag" style={{background:COL[a.category],color:'#fff'}}>{a.category}</span> <b>{a.name}</b> {inr(a.value)} · {a.time}<br/><small>{a.risk}</small></div>)}</>}
