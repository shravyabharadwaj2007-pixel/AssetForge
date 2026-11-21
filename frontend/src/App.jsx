import React,{useState,useEffect} from 'react'
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell} from 'recharts'
import {inr,api} from './lib.js'
import {Landing2,Onboarding,Roadmap,IdleAssets,Liquidity} from './pages.jsx'
import {Runway,Dependency,Radar,SkillMapper,Settings,Public} from './pages2.jsx'

function Landing({go}){return <><div className="hero"><h1 style={{fontSize:42,maxWidth:700,margin:'0 auto 12px'}}>Your Next Income Stream Might Already Be Within Your Reach.</h1>
<p>Build income from what you already have. Prepare for what comes next.</p><button className="btn alt" onClick={go}>Build My Financial Profile</button></div>
<div className="main grid"><div className="card"><h3>Asset Maker Engine</h3>Skills, time and assets → realistic income ideas.</div><div className="card"><h3>Survival Runway Engine</h3>How many months if your salary stops today?</div></div></>}

function Login({done}){const[f,setF]=useState({email:'',password:'',name:''}),[reg,setReg]=useState(false),[e,setE]=useState(''),[show,setShow]=useState(false)
 const go=async(p,b)=>{try{const d=await api(p,'POST',b);localStorage.tok=d.token;localStorage.name=d.name;done(p==='/auth/register')}catch(x){setE(x.message)}}
 return <div className="main" style={{maxWidth:400}}><div className="card"><h2>{reg?'Create account':'Welcome back'}</h2>
 {reg&&<input placeholder="Name" onChange={x=>setF({...f,name:x.target.value})}/>}<input placeholder="Email" onChange={x=>setF({...f,email:x.target.value})}/>
 <input type={show?'text':'password'} placeholder="Password (6+ chars)" onChange={x=>setF({...f,password:x.target.value})}/>
 <label><input type="checkbox" style={{width:'auto'}} onChange={x=>setShow(x.target.checked)}/> Show password</label>
 {e&&<p style={{color:'#b00'}}>{e}</p>}<p><button className="btn" onClick={()=>go(reg?'/auth/register':'/auth/login',f)}>{reg?'Sign up':'Log in'}</button> <button className="btn alt" onClick={()=>go('/auth/demo')}>Try demo account</button></p>
 <a href="#" onClick={()=>setReg(!reg)}>{reg?'Have an account? Log in':'New here? Sign up'}</a></div></div>}

function Dashboard({go}){const[m,setM]=useState(),[p,setP]=useState(),[o,setO]=useState([])
 useEffect(()=>{api('/metrics').then(setM);api('/profile').then(setP);api('/opportunities').then(setO)},[])
 if(!m||!p)return <div className="card">Loading your financial picture…</div>
 const pie=[{n:'Primary',v:m.dependency.primary},{n:'Secondary',v:m.dependency.secondary}]
 return <><h2>Hello, {p.name} 👋</h2><div className="grid">
 <div className="card">Survival Runway<div className="big">{m.runway.months??'∞'} mo</div>{m.runway.days} days · {m.runway.level}</div>
 <div className="card">Income Dependency<div className="big">{m.dependency.pct}%</div>{m.dependency.risk} risk</div>
 <div className="card">Monthly net cash flow<div className="big">{inr(m.net_cash_flow)}</div></div>
 <div className="card">Savings<div className="big">{inr(p.savings)}</div></div></div>
 <div className="card"><b>Income distribution</b><ResponsiveContainer height={180}><PieChart><Pie data={pie} dataKey="v" nameKey="n" innerRadius={50}>{pie.map((_,i)=><Cell key={i} fill={['#123C32','#8BCF9B'][i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
 <div className="card"><small>{m.assumptions}</small></div>
 <div className="card"><b>Quick actions</b><br/>{['Opportunity Radar','Income Loss Simulator','Second Income Simulator','Roadmap'].map(k=><button key={k} className="btn alt" style={{margin:4}} onClick={()=>go(k)}>{k}</button>)}</div><h3>Recommended opportunities</h3>{o.map(x=><div className="card" key={x.name}><b>{x.name}</b> · {x.match}% match<br/>{x.why}<br/>{inr(x.min)}–{inr(x.max)}/mo · {x.hrs} hrs/wk · {x.diff}<br/><small>First step: {x.first} ({x.disclaimer})</small></div>)}</>}

function Loss(){const[i,setI]=useState({savings:50000,essentials:20000,emi:5000,secondary:0,other:0}),[r,setR]=useState()
 useEffect(()=>{api('/simulate/loss','POST',i).then(setR).catch(()=>{})},[i])
 return <><h2>Income Loss Simulator</h2><small>Hypothetical projection</small><div className="card grid">{Object.keys(i).map(k=><label key={k}>{k}<input type="number" min="0" value={i[k]} onChange={e=>setI({...i,[k]:+e.target.value})}/></label>)}</div>
 {r&&<div className="card"><b>{r.insufficient_month?`Savings run out in month ${r.insufficient_month}; borrowing need ≈ ${inr(r.borrowing_needed)}`:'Savings last 24+ months'}</b>
 <ResponsiveContainer height={240}><LineChart data={r.rows}><XAxis dataKey="month"/><YAxis/><Tooltip/><Line dataKey="end" stroke="#1F6B52"/></LineChart></ResponsiveContainer></div>}</>}

function Second(){const[x,setX]=useState(6000),[r,setR]=useState(),[op,setOp]=useState([]);useEffect(()=>{Promise.all([api('/opportunities'),api('/profile')]).then(([o,p])=>setOp(o.filter(z=>p.saved.includes(z.name))))},[])
 useEffect(()=>{api('/simulate/second','POST',{extra:x}).then(setR).catch(()=>{})},[x])
 const C=({t,d})=><div className="card"><b>{t}</b><div className="big">{d.runway.months??'∞'} mo</div>Dependency {d.dependency.pct}% · Cash flow {inr(d.net_cash_flow)}</div>
 return <><h2>Second Income Simulator</h2><div>{op.map(z=><button key={z.name} className="btn alt" style={{margin:4}} onClick={()=>setX(Math.round((z.min+z.max)/2))}>Use saved: {z.name}</button>)}</div><div className="card">Illustrative extra income: {inr(x)}/mo<input type="range" min="0" max="20000" step="500" value={x} onChange={e=>setX(+e.target.value)}/></div>
 {r&&<div className="grid"><C t="Before" d={r.before}/><C t="After" d={r.after}/></div>}</>}

function Coach(){const[msgs,setMsgs]=useState([]),[t,setT]=useState('')
 const send=async q=>{q=q||t;if(!q)return;setT('');setMsgs(m=>[...m,{u:1,x:q}]);const d=await api('/coach','POST',{message:q});setMsgs(m=>[...m,{x:d.reply}])}
 return <><h2>AI Financial Coach</h2><div>{['Explain my runway','What is my income dependency?','How do I start a second income?'].map(q=><button key={q} className="btn alt" style={{margin:4}} onClick={()=>send(q)}>{q}</button>)}</div>
 <div className="card">{msgs.length?msgs.map((m,i)=><p key={i} style={{textAlign:m.u?'right':'left'}}>{m.u?'🧑 ':'🤖 '}{m.x}</p>):'Ask me anything about your finances.'}<input value={t} onChange={e=>setT(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type a question…"/></div></>}

export default function App(){
 const[auth,setAuth]=useState(!!localStorage.tok),[page,setPage]=useState('Overview'),[pub,setPub]=useState('Home')
 if(!auth){const L=['Home','How It Works','Features','About','FAQ','Contact','Login']
  return <><div className="nav"><b style={{color:'#8BCF9B',padding:8}}>AssetForge</b>{L.map(k=><button key={k} className={k===pub?'on':''} onClick={()=>setPub(k)}>{k}</button>)}<button className="btn alt" style={{marginLeft:'auto'}} onClick={()=>setPub('Login')}>Get Started</button></div>
  {pub==='Home'?<Landing2 go={()=>setPub('Login')} nav={setPub}/>:pub==='Login'?<Login done={n=>{setAuth(true);if(n)setPage('My Financial Profile')}}/>:<Public name={pub}/>}</>}
 const pages={Overview:Dashboard,'My Financial Profile':Onboarding,'Survival Runway':Runway,'Income Dependency':Dependency,'Opportunity Radar':Radar,'Skill Mapper':SkillMapper,'Idle Asset Finder':IdleAssets,'Income Loss Simulator':Loss,'Second Income Simulator':Second,Roadmap,'Liquidity Map':Liquidity,'AI Financial Coach':Coach,Settings}
 const Pg=pages[page]
 return <div className="shell"><aside className="side"><b style={{color:'#8BCF9B',padding:8,display:'block'}}>AssetForge</b>{Object.keys(pages).map(k=><button key={k} className={k===page?'on':''} onClick={()=>setPage(k)}>{k}</button>)}</aside><div className="main" style={{flex:1}}><Pg go={setPage}/></div></div>}
