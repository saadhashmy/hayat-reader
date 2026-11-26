/* Reader accounts: email and a 6-digit PIN. Reading data is saved on the site's own account server.
   The PIN is sent only to that server, over the address in config.js. It is never kept in the browser. */
(function(){
'use strict';
const BASE=String((window.HS_CONFIG||{}).apiBase||'').trim().replace(/\/+$/,'');
/* only a secure address is accepted, except a test server on this computer */
const SAFE=/^https:\/\/[^/]+/.test(BASE)||/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE);
const KEY='hs3-session';
const inClaude=()=>!!(window.claude&&window.claude.use);
let session=null, rev=0, changes=0;
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.token&&s.sub)session=s}catch(e){}
function keep(s){
  session=s;rev=0;changes++;
  try{if(s)localStorage.setItem(KEY,JSON.stringify(s));else localStorage.removeItem(KEY)}catch(e){}
}
const fail=(code,message)=>Object.assign(new Error(message||code),{code});
async function call(method,path,body,token){
  const headers={};
  if(body)headers['Content-Type']='application/json';
  if(token)headers.Authorization='Bearer '+token;
  const stop=new AbortController(),timer=setTimeout(()=>stop.abort(),20000);
  let r,value;
  try{
    r=await fetch(BASE+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:stop.signal,cache:'no-store',credentials:'omit'});
    value=await r.json();
  }catch(e){throw fail('net','The account server could not be reached. Check your internet and try again.')}
  finally{clearTimeout(timer)}
  if(!r.ok)throw fail(r.status===401?'auth':r.status===409?'conflict':r.status===413?'toobig':'server',value&&value.error);
  return value;
}
async function enter(path,body){
  const v=await call('POST',path,body);
  keep({sub:v.user.id,token:v.token});
  return {profile:{sub:v.user.id,email:v.user.email,name:v.user.name,kind:'pin'},recoveryCode:v.recoveryCode||''};
}
/* reading or saving for the signed-in reader; an answer that arrives after a switch is thrown away */
async function mine(method,path,body){
  const at=changes;
  if(!session)throw fail('auth');
  try{
    const v=await call(method,path,body,session.token);
    if(at!==changes)throw fail('switched');
    return v;
  }catch(e){
    if(at===changes&&e.code==='auth'&&path==='/api/data')keep(null);
    throw e;
  }
}
window.HSAccount={
  configured:()=>SAFE&&!inClaude(),
  isFor:sub=>!!session&&session.sub===sub,
  register:(email,pin,name)=>enter('/api/register',{email,pin,name}),
  login:(email,pin)=>enter('/api/login',{email,pin}),
  recover:(email,code,pin)=>enter('/api/recover',{email,code,pin}),
  async read(){const v=await mine('GET','/api/data');rev=v.rev;return v.data},
  async write(data){const v=await mine('PUT','/api/data',{data,rev});rev=v.rev},
  async remove(pin){await mine('POST','/api/delete',{pin});keep(null)},
  signOut(){
    const token=session&&session.token;keep(null);
    if(token&&SAFE)call('POST','/api/logout',{},token).catch(()=>{});
  }
};
})();
