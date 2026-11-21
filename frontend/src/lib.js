export const inr=n=>'₹'+Math.round(n||0).toLocaleString('en-IN')
export const api=async(path,method='GET',body)=>{const r=await fetch('/api'+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+(localStorage.tok||'')},body:body&&JSON.stringify(body)})
 const d=await r.json(); if(!r.ok) throw new Error(typeof d.detail==='string'?d.detail:'Please check your inputs.'); return d}
