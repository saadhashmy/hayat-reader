/* Google sign-in and one small file in the reader's own Drive "app data" folder.
   Runs only in the browser. There is no server, and no password ever reaches this site. */
(function(){
'use strict';
const ID=((window.HS_CONFIG||{}).googleClientId||'').trim();
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
const FILE='hayat-reader.json', TOKEN_KEY='hs3-google-token';
const inClaude=()=>!!(window.claude&&window.claude.use);
let token=null, fileId=null, session=0, library=null;
try{const t=JSON.parse(sessionStorage.getItem(TOKEN_KEY));if(t&&t.exp>Date.now())token=t}catch(e){}
const fail=code=>Object.assign(new Error(code),{code});
function loadLibrary(){
  if(window.google&&window.google.accounts) return Promise.resolve();
  if(library) return library;
  library=new Promise((ok,no)=>{
    const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
    s.onload=ok;s.onerror=()=>{library=null;s.remove();no(fail('net'))};
    document.head.appendChild(s);
  });
  return library;
}
function forget(){token=null;fileId=null;session++;try{sessionStorage.removeItem(TOKEN_KEY)}catch(e){}}
async function api(url,options){
  const mine=session;
  if(!token||token.exp<=Date.now()) throw fail('auth');
  let r;
  try{r=await fetch(url,Object.assign({},options,{headers:Object.assign({Authorization:'Bearer '+token.value},(options||{}).headers)}))}catch(e){throw fail('net')}
  if(mine!==session) throw fail('switched');
  if(r.status===401){forget();throw fail('auth')}
  if(!r.ok) throw fail(r.status===403?'denied':r.status===404?'gone':'net');
  const body=await r.json();
  if(mine!==session) throw fail('switched');
  return body;
}
window.HSDrive={
  configured:()=>!!ID&&!inClaude(),
  supported:()=>location.protocol==='https:'||location.protocol==='http:',
  hasToken:()=>!!token&&token.exp>Date.now(),
  /* load Google's script early so the sign-in window opens straight from the tap */
  prepare(){if(this.configured()&&this.supported()) loadLibrary().catch(()=>{})},
  async signIn(hint){
    await loadLibrary();
    const res=await new Promise((ok,no)=>{
      const client=window.google.accounts.oauth2.initTokenClient({
        client_id:ID, scope:'openid email profile '+DRIVE_SCOPE, login_hint:hint||undefined,
        callback:v=>v&&v.access_token?ok(v):no(fail('cancelled')),
        error_callback:()=>no(fail('cancelled'))
      });
      client.requestAccessToken({prompt:hint?'':'select_account'});
    });
    if(!window.google.accounts.oauth2.hasGrantedAllScopes(res,DRIVE_SCOPE)) throw fail('scope');
    forget();
    token={value:res.access_token,exp:Date.now()+(Number(res.expires_in||3600)-60)*1000};
    const me=await api('https://www.googleapis.com/oauth2/v3/userinfo');
    if(!me.sub||!me.email){forget();throw fail('net')}
    token.sub=String(me.sub);
    try{sessionStorage.setItem(TOKEN_KEY,JSON.stringify(token))}catch(e){}
    return {sub:String(me.sub),email:String(me.email),name:String(me.name||me.email),picture:String(me.picture||'')};
  },
  /* true only when the live sign-in belongs to this account */
  isFor(sub){return this.hasToken()&&token.sub===sub},
  signOut:forget,
  async read(){
    const q=encodeURIComponent("name='"+FILE+"' and trashed=false");
    const list=await api('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&orderBy=modifiedTime%20desc&fields=files(id)&q='+q);
    fileId=list.files&&list.files[0]?list.files[0].id:null;
    return fileId?api('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'?alt=media'):null;
  },
  async write(data){
    const text=JSON.stringify(data);
    if(fileId){
      await api('https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(fileId)+'?uploadType=media&fields=id',{method:'PATCH',headers:{'Content-Type':'application/json'},body:text});
      return;
    }
    const b='hs3boundary'+Date.now().toString(36);
    const body='--'+b+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify({name:FILE,parents:['appDataFolder']})+'\r\n--'+b+'\r\nContent-Type: application/json\r\n\r\n'+text+'\r\n--'+b+'--';
    const made=await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+b},body});
    fileId=made.id;
  }
};
})();
