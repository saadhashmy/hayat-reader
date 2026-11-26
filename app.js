/* Hayat-us-Sahaba reader */
(function(){
'use strict';
const TOC=window.HS_TOC, ART=window.ART, JOURNEY=window.HSJourney;
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const view=$('#view'), topbar=$('#topbar'), subbar=$('#subbar'), floating=$('#floating'), layer=$('#layer');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const SAW=h=>h.replace(/ﷺ/g,'<span class="sw">ﷺ</span>');
const T_=x=>SAW(esc(x));
/* ---------- index ---------- */
const TOPICS=[], BYID={};
TOC.forEach(c=>{c.count=0;c.topics.forEach(t=>{t.ch=c.n;t.pos=TOPICS.length;TOPICS.push(t);BYID[t.id]=t;c.count+=t.n})});
const TOTAL=TOC.reduce((a,c)=>a+c.count,0);

/* ---------- chapter text, loaded on demand ---------- */
const CH={}, waiting={};
window.HS_LOAD=(n,data)=>{CH[n]=data;(waiting[n]||[]).forEach(w=>w.ok(data));delete waiting[n]};
function loadChapter(n){
  if(CH[n]) return Promise.resolve(CH[n]);
  return new Promise((ok,fail)=>{
    if(waiting[n]){waiting[n].push({ok,fail});return}
    waiting[n]=[{ok,fail}];
    const s=document.createElement('script');s.src='data/ch'+n+'.js';
    s.onerror=()=>{(waiting[n]||[]).forEach(w=>w.fail(new Error('load')));delete waiting[n];s.remove()};
    document.head.appendChild(s);
  });
}

/* ---------- saved reading state ---------- */
const KEY='hs3-reader-v1', SETKEY=KEY+'-settings', ACCKEY=KEY+'-account';
const DRIVE=window.HSDrive, IN_CLAUDE=!!(window.claude&&window.claude.use);
const readJSON=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
let account=IN_CLAUDE?null:readJSON(ACCKEY);
if(account&&!(account.sub&&account.email))account=null;
const dataKey=()=>account?KEY+':'+account.sub:KEY;
let S={t:{},last:null,set:{size:19,fn:true,theme:'auto',color:'y',marker:false,goal:3}};
Object.assign(S.set,(readJSON(KEY)||{}).set||{},readJSON(SETKEY)||{});
function loadData(){const v=readJSON(dataKey());S.t=v&&v.t?v.t:{};S.last=v&&v.last?v.last:null}
loadData();
let storageOK=true;
function saveLocal(){try{localStorage.setItem(dataKey(),JSON.stringify({t:S.t,last:S.last}));localStorage.setItem(SETKEY,JSON.stringify(S.set));storageOK=true}catch(e){if(storageOK)toast('This browser is not saving. Use Settings \u2192 Export backup.');storageOK=false}}
const blank=()=>({u:0,done:{},bm:{},hl:{},nt:{}});
const peek=t=>S.t[t]||blank();
function edit(tid,fn){const d=S.t[tid]||(S.t[tid]=blank());fn(d);d.u=Date.now();saveLocal();Sync.push(tid);DS.changed()}
const doneIn=t=>{const d=peek(t.id).done;let n=0;for(const k in d) if(+k<t.n) n++;return n};
const doneCh=c=>c.topics.reduce((a,t)=>a+doneIn(t),0);
const doneAll=()=>TOPICS.reduce((a,t)=>a+doneIn(t),0);
const pct=(a,b)=>b?a/b*100:0;
const pctText=(a,b)=>{const p=pct(a,b);if(p>0&&p<0.1)return '<0.1%';return (p>0&&p<10?p.toFixed(1):Math.floor(p))+'%'};
const bar=(a,b)=>'<div class="bar'+(a===b&&b?' full':'')+'" role="progressbar" aria-valuemin="0" aria-valuemax="'+b+'" aria-valuenow="'+a+'"><i style="width:'+pct(a,b)+'%"></i></div>';

/* ---------- private cloud copy (only inside claude.ai) ---------- */
const Sync={col:null,busy:{},dirty:{},timer:{},status:'Saved in this browser only.',
  async start(){
    if(!window.claude||!window.claude.use) return;
    try{
      const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
      const id=user&&await user.id();
      if(user){CLAUDE_ME=await user.me();paintMe()}
      if(!db||!id) return;
      this.col=db.collection('data/users/'+id);
      let first=true;
      this.col.onSnapshot(snap=>{
        let changed=false;const seen={};
        snap.docs.forEach(d=>{
          const m=/^t(\d+)$/.exec(d.id);if(!m) return;const tid=m[1];seen[tid]=true;
          const r=d.data();if(r&&(r.u||0)>peek(tid).u){S.t[tid]=Object.assign(blank(),JSON.parse(JSON.stringify(r)));changed=true}
          else if(r&&peek(tid).u>(r.u||0)&&!snap.metadata.fromCache) this.push(tid);
        });
        if(!snap.metadata.fromCache){
          this.status='Saved in this browser and privately in your Claude account.';
          if(first){first=false;Object.keys(S.t).forEach(t=>{if(!seen[t]&&S.t[t].u)this.push(t)})}
        }
        if(changed){saveLocal();refresh()}
      },()=>{this.status='Cloud copy is unavailable. Saved in this browser only.';this.col=null});
    }catch(e){}
  },
  push(tid){if(!this.col)return;this.dirty[tid]=true;clearTimeout(this.timer[tid]);this.timer[tid]=setTimeout(()=>this.flush(tid),900)},
  async flush(tid){
    if(!this.col||this.busy[tid]||!this.dirty[tid])return;
    this.busy[tid]=true;this.dirty[tid]=false;
    try{await this.col.doc('t'+tid).set(JSON.parse(JSON.stringify(S.t[tid])))}
    catch(e){this.status='The last change was not copied to your account. It is saved in this browser.'}
    this.busy[tid]=false;if(this.dirty[tid])this.push(tid);
  }
};

function doneTimes(){const out=[];TOPICS.forEach(t=>{const d=peek(t.id).done;for(const k in d)if(+k<t.n)out.push(d[k])});return out}
const dailyGoal=()=>[1,3,5,10].includes(S.set.goal)?S.set.goal:3;
function journeyHTML(){
  const L=S.last&&BYID[S.last.t];
  const cta=L?'<a class="j-cta" href="#t'+L.id+'-s'+(S.last.s+1)+'"><b>Continue reading · story '+(S.last.s+1)+'</b><span class="ur">'+T_(L.title)+'</span></a>'
    :'<a class="j-cta" href="#t1"><b>Start reading</b><span>Your place is remembered</span></a>';
  return JOURNEY.html({done:doneAll(),total:TOTAL,times:doneTimes(),goal:dailyGoal(),cta,chapters:TOC.map(c=>({n:c.n,en:c.en,done:doneCh(c),count:c.count}))});
}
function celebrate(button,topicDone){
  const r=button.getBoundingClientRect(),c=JOURNEY.cheer(doneTimes(),doneAll(),TOTAL,dailyGoal(),topicDone);
  JOURNEY.burst(r.left+r.width/2,r.top+r.height/2,!!c.big);toast(c.text);
}

/* ---------- small UI helpers ---------- */
const UI={
 home:'<path d="M3 11 12 4l9 7M6 10v10h12V10"/>',search:'<circle cx="11" cy="11" r="6"/><path d="m16 16 5 5"/>',
 mark:'<path class="m" d="M7 4h10v16l-5-4-5 4z"/>',note:'<path d="M5 4h14v11l-5 5H5zM14 20v-5h5M8 9h8M8 13h4"/>',
 check:'<path d="m5 13 4 4L19 7"/>',pen:'<path d="m4 20 4-1L19 8l-3-3L5 16zM14 7l3 3M12 20h9"/>',
 list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M18.400 5.600l-2.100 2.100M7.700 16.300l-2.100 2.100"/>',
 left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',layers:'<path d="m12 4 9 5-9 5-9-5zM3 14l9 5 9-5"/>'
};
const ic=(n,cls)=>'<svg class="ic'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+UI[n]+'</svg>';
let toastT;
function toast(m){let el=$('.toast');if(!el){el=document.createElement('div');el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=m;clearTimeout(toastT);toastT=setTimeout(()=>el.remove(),2600)}
function applySettings(){
  const r=document.documentElement;r.style.setProperty('--size',S.set.size+'px');
  document.body.classList.toggle('nofn',!S.set.fn);
  if(S.set.theme!=='auto'){r.dataset.theme=S.set.theme;r.dataset.mine='1'}else if(r.dataset.mine){delete r.dataset.theme;delete r.dataset.mine}
}
function nav(h){if(location.hash==='#'+h)route();else location.hash=h}
const navBtn=(h,icn,label,on)=>'<a class="nbtn'+(on?' on':'')+'" href="#'+h+'" aria-label="'+label+'">'+ic(icn)+'<span>'+label+'</span></a>';
function mainTop(active){
  subbar.innerHTML='';
  topbar.innerHTML=navBtn('home','home','Home',active==='home')+navBtn('search','search','Search',active==='search')+
   '<button class="nbtn" data-act="drawer">'+ic('list')+'<span>Topics</span></button><span class="grow"></span>'+
   navBtn('bookmarks','mark','Bookmarks',active==='bookmarks')+navBtn('notes','note','Notes',active==='notes')+
   '<button class="nbtn" data-act="settings" aria-label="Settings">'+ic('gear')+'<span>Settings</span></button>'+meButton();
}

/* ---------- home ---------- */
const H={browse:'main',open:{},tab:'bookmarks',filter:'',show:'all'};
function topicCard(t){
  const d=doneIn(t),has=Object.keys(peek(t.id).bm).length;
  return '<a class="tcard'+(d===t.n&&t.n?' done':'')+'" href="#t'+t.id+'" dir="ltr"><span class="rosette">'+(t.pos+1)+'</span>'+
  '<span class="mid"><span class="ur">'+T_(t.title)+'</span><span class="meta"><span>'+(has?'Bookmarked · ':'')+d+' of '+t.n+' read</span></span>'+bar(d,t.n)+'</span>'+
  '<span class="art">'+ART.icon(ART.forTitle(t.title,t.ch))+'</span></a>';
}
function chapterCard(c){
  const d=doneCh(c),open=H.open['m'+c.n];
  return '<div class="chcard"><a href="#c'+c.n+'">'+ART.scene(c.n)+'</a><div class="chbody"><a class="row" href="#c'+c.n+'"><span class="rosette">'+c.n+'</span><span class="ur grow">'+T_(c.title)+'</span></a>'+
  '<div class="meta"><span>'+c.en+'</span></div><div class="meta"><span>'+c.topics.length+' sub-headings · '+c.count+' stories</span><span>'+pctText(d,c.count)+'</span></div>'+bar(d,c.count)+'</div>'+
  '<div class="chfoot"><button class="btn small" data-act="expand" data-k="m'+c.n+'" aria-expanded="'+!!open+'">'+ic('layers')+(open?'Hide':'Show')+' sub-headings</button><a class="btn small" href="#c'+c.n+'">Open</a></div></div>';
}
function matches(t){
  const d=doneIn(t);
  if(H.show==='unread'&&d===t.n) return false;
  if(H.show==='done'&&d!==t.n) return false;
  return !H.filter||norm(t.title).includes(norm(H.filter));
}
function browseHTML(){
  if(H.browse==='main'){
    let html='<div class="grid">';
    TOC.forEach(c=>{html+=chapterCard(c);if(H.open['m'+c.n])html+='<div style="grid-column:1/-1"><div class="grid">'+c.topics.map(topicCard).join('')+'</div></div>'});
    return html+'</div>';
  }
  let out='';
  TOC.forEach(c=>{
    const list=c.topics.filter(matches);if(!list.length)return;
    const open=H.filter?true:!!H.open['s'+c.n],d=doneCh(c);
    out+='<section class="acc'+(open?' open':'')+'"><button data-act="expand" data-k="s'+c.n+'" aria-expanded="'+open+'"><span class="rosette">'+c.n+'</span><span class="mid"><span class="ur">'+T_(c.title)+'</span><span class="meta"><span>'+list.length+' sub-headings</span><span>'+d+' of '+c.count+' stories read</span></span>'+bar(d,c.count)+'</span><span class="chev">'+ic('down')+'</span></button>'+(open?'<div class="inner"><div class="grid">'+list.map(topicCard).join('')+'</div></div>':'')+'</section>';
  });
  return out||'<p class="empty">No sub-heading matches. Clear the filter to see them all.</p>';
}
function savedItems(kind){
  const out=[];
  TOPICS.forEach(t=>{
    const d=S.t[t.id];if(!d)return;
    if(kind==='bookmarks') for(const s in d.bm) out.push({t,s:+s,ts:d.bm[s]});
    if(kind==='notes') for(const s in d.nt) d.nt[s].forEach(n=>out.push({t,s:+s,ts:n.ts,q:n.q,x:n.x,id:n.id}));
    if(kind==='highlights') for(const s in d.hl) d.hl[s].forEach(h=>out.push({t,s:+s,ts:h.ts,q:h.q,c:h.c,id:h.id}));
  });
  return out.sort((a,b)=>b.ts-a.ts);
}
function itemHTML(kind,i){
  const where='Story '+(i.s+1)+' · sub-heading '+(i.t.pos+1);
  return '<div class="item"><a class="go" href="#t'+i.t.id+'-s'+(i.s+1)+'">'+(i.q?'<span class="ur'+(i.c?' h'+i.c:'')+'">'+T_(i.q.length>150?i.q.slice(0,150)+'…':i.q)+'</span><small>'+T_(i.t.title)+'</small>':'<span class="ur">'+T_(i.t.title)+'</span>')+'<small>'+where+'</small></a>'+
  '<button class="act" data-act="remove" data-kind="'+kind+'" data-t="'+i.t.id+'" data-s="'+i.s+'" data-id="'+(i.id||'')+'" aria-label="Remove">'+ic('x')+'</button>'+(i.x?'<div class="body">'+esc(i.x)+'</div>':'')+'</div>';
}
const EMPTY={bookmarks:'No bookmarks yet. Tap the bookmark icon on any story to keep it here.',notes:'No notes yet. Tap a word in a story, then choose Add note.',highlights:'No highlights yet. Tap a word or select some text in a story, then pick a colour.'};
function listHTML(kind,max){
  const items=savedItems(kind);
  if(!items.length) return '<p class="empty">'+EMPTY[kind]+'</p>';
  return '<div class="list">'+items.slice(0,max||1e9).map(i=>itemHTML(kind,i)).join('')+'</div>'+(max&&items.length>max?'<p><a class="btn small" href="#'+kind+'">See all '+items.length+'</a></p>':'');
}
function renderHome(){
  mainTop('home');floating.innerHTML='';
  view.innerHTML=journeyHTML()+
   '<section class="panel"><div class="tabs" role="tablist">'+['bookmarks','notes','highlights'].map(k=>'<button role="tab" data-act="tab" data-v="'+k+'" class="'+(H.tab===k?'on':'')+'">'+k[0].toUpperCase()+k.slice(1)+' ('+savedItems(k).length+')</button>').join('')+'</div>'+listHTML(H.tab,3)+'</section>'+
   '<div class="browse-head"><div class="seg" role="group" aria-label="Browse by"><button data-act="browse" data-v="main" class="'+(H.browse==='main'?'on':'')+'">Main headings</button><button data-act="browse" data-v="sub" class="'+(H.browse==='sub'?'on':'')+'">Sub-headings</button></div>'+
   (H.browse==='sub'?'<div class="tools"><div class="chips" role="group" aria-label="Show">'+[['all','All'],['unread','Not finished'],['done','Completed']].map(([v,l])=>'<button data-act="show" data-v="'+v+'" class="'+(H.show===v?'on':'')+'" aria-pressed="'+(H.show===v)+'">'+l+'</button>').join('')+'</div><button class="btn small ghost" data-act="all">'+ic('layers')+'Open or close all</button></div>':'')+'</div>'+
   (H.browse==='sub'?'<input class="field ur" id="filter" style="width:100%;margin-bottom:12px" placeholder="عنوان تلاش کریں" value="'+esc(H.filter)+'" aria-label="Filter sub-headings">':'')+'<div id="browse">'+browseHTML()+'</div>'+
   '<p class="note-text" style="margin-top:28px;text-align:center">This text has not yet been proofread by a scholar. Please check Quran verses and duas against a reliable copy. Original pages 716 and 717 are missing.</p>';
  const f=$('#filter');if(f)f.oninput=()=>{H.filter=f.value;$('#browse').innerHTML=browseHTML()};
}

/* ---------- reader ---------- */
let R=null; /* {topic, words:[[{el,gap,line,text}]]} */
const runClass=f=>[f.includes('b')?'b':'',f.includes('a')?'a':''].filter(Boolean).join(' ');
/* split a story into word spans; a "line" is one sentence or one verse line */
function storyHTML(blocks){
  let wi=0,li=0,html='';const words=[];
  blocks.forEach(([kind,runs])=>{
    let out='',cur='',curText='',quoteOpen=false;
    const flush=()=>{
      if(!cur)return;
      out+='<span class="w" data-w="'+wi+'" data-l="'+li+'">'+cur+'</span>';words.push({text:curText,line:li});
      if(/[۔؟!۝]["”')\]]*$/.test(curText))li++;
      wi++;cur='';curText='';
    };
    runs.forEach(([text,f])=>{
      if(f.includes('s')){cur+='<sup>'+esc(text)+'</sup>';return}
      text.split(/(\s+)/).forEach(p=>{
        if(!p)return;
        if(/^\s+$/.test(p)){if(cur){flush();out+='<span class="g" data-g="'+(wi-1)+'"> </span>'}return}
        const c=runClass(f),h=esc(p).replace(/ﷺ/g,'<span class="sw">ﷺ</span>');cur+=c?'<span class="'+c+'">'+h+'</span>':h;curText+=p;
      });
    });
    flush();li++;
    const cls=kind==='q'?' class="q"':kind==='c'?' class="c"':'';
    html+='<p'+cls+'>'+(kind==='c'?'<span class="lbl">ارشادِ نبوی <span class="sw">ﷺ</span> </span>':'')+out+'</p>';
  });
  return {html,words};
}
function storyEl(i){return $('#s'+(i+1))}
function paintStory(i){
  const el=storyEl(i);if(!el)return;
  const t=R.topic,d=peek(t.id),read=!!d.done[i],bm=!!d.bm[i],hl=d.hl[i]||[],nt=d.nt[i]||[];
  el.classList.toggle('read',read);
  $$('.done-btn',el).forEach(b=>{b.classList.toggle('on',read);b.innerHTML=ic('check')+'<span>'+(read?'Completed':'Mark completed')+'</span>';b.setAttribute('aria-pressed',read)});
  const bb=$('[data-act="bm"]',el);bb.classList.toggle('on',bm);bb.setAttribute('aria-pressed',bm);bb.lastChild.textContent=bm?'Bookmarked':'Bookmark';
  $$('.w,.g',el).forEach(s=>s.classList.remove('hy','hg','hb','hp','noted'));
  const ws=$$('.w',el),gs={};$$('.g',el).forEach(g=>gs[g.dataset.g]=g);
  hl.forEach(h=>{for(let k=h.a;k<=h.b;k++){if(ws[k])ws[k].classList.add('h'+h.c);if(k<h.b&&gs[k])gs[k].classList.add('h'+h.c)}});
  nt.forEach(n=>{for(let k=n.a;k<=n.b;k++)if(ws[k])ws[k].classList.add('noted')});
  $('.notes-in',el).innerHTML=nt.map(n=>'<button class="notecard" data-act="editnote" data-id="'+n.id+'"><span class="ur" dir="rtl">'+T_(n.q.length>90?n.q.slice(0,90)+'…':n.q)+'</span><span class="body">'+esc(n.x)+'</span></button>').join('');
}
function paintProgress(){
  if(!R)return;const t=R.topic,c=TOC[t.ch-1],d=doneIn(t);
  const l=$('#tline');
  if(l){
    l.classList.toggle('full',d===t.n);
    if(t.n>1&&t.n<=60){
      l.classList.add('steps');const got=peek(t.id).done;
      if(l.children.length!==t.n)l.innerHTML=Array.from({length:t.n},(_,i)=>'<button data-act="jump" data-v="'+i+'" aria-label="Go to story '+(i+1)+'" title="Story '+(i+1)+'"></button>').join('');
      Array.from(l.children).forEach((x,i)=>x.classList.toggle('on',!!got[i]));
    }else l.firstChild.style.width=pct(d,t.n)+'%';
  }
  const a=$('#tcount');if(a)a.innerHTML=d+' of '+t.n+' read<span class="more"> · chapter '+esc(pctText(doneCh(c),c.count))+' · book '+esc(pctText(doneAll(),TOTAL))+'</span>';
}
let observer;
async function renderTopic(t,story){
  const token=renderToken;
  floating.innerHTML='';
  const c=TOC[t.ch-1];
  topbar.innerHTML=navBtn('home','home','Home')+'<button class="title-btn" data-act="drawer" aria-label="Choose a sub-heading"><span>'+(t.pos+1)+'</span><span class="ur">'+T_(t.title)+'</span>'+ic('down')+'</button><button id="marker" class="nbtn marker-dot" data-act="marker" aria-label="Highlighter" title="Highlighter">'+ic('pen')+'<span>Highlight</span></button><button class="nbtn" data-act="settings" aria-label="Settings">'+ic('gear')+'<span>Settings</span></button>'+meButton();
  subbar.innerHTML='<div class="sub"><div class="wrap"><a class="ur" href="#c'+c.n+'">'+T_(c.title)+'</a><span id="tcount" style="white-space:nowrap"></span></div></div><div class="line" id="tline"><i></i></div><div class="tray" id="tray" role="group" aria-label="Highlighter colour" hidden>'+[['y','yellow'],['g','green'],['b','blue'],['p','pink']].map(([c,n])=>'<button class="dot h'+c+'" data-act="mcolor" data-v="'+c+'" aria-label="Highlight '+n+'"></button>').join('')+'<button class="tray-off" data-act="marker" aria-label="Turn highlighter off">'+ic('x')+'</button></div>';
  view.innerHTML='<p class="empty">Loading…</p>';
  let data;
  try{data=await loadChapter(t.ch)}catch(e){if(token===renderToken)view.innerHTML='<p class="empty">This chapter did not load. Check your connection.</p><button class="btn" data-act="retry">Try again</button>';return}
  if(token!==renderToken)return;
  const T=data.topics[t.id];R={topic:t,words:[]};
  let html='';
  if(c.topics[0]===t) html+='<section class="chapter-head">'+ART.scene(c.n)+'<div class="txt"><h1 class="ur">'+T_(c.title)+'</h1>'+data.intro.map(p=>'<div class="intro ur">'+p.map(r=>esc(r[0])).join('').replace(/ﷺ/g,'<span class="sw">ﷺ</span>')+'</div>').join('')+'</div></section>';
  html+='<section class="topic-head"><span class="art">'+ART.icon(ART.forTitle(t.title,t.ch))+'</span><h1 class="ur">'+T_(t.title)+'</h1><div style="color:var(--mute);font-size:12px">'+t.n+(t.n===1?' story':' stories')+' · Tap a word to highlight or add a note</div></section>';
  if(T.lead.length) html+='<div class="story lead text">'+storyHTML(T.lead).html.replace(/class="w"/g,'')+'</div>';
  T.stories.forEach((s,i)=>{
    const h=storyHTML(s.b);R.words[i]=h.words;
    const fns=s.f&&s.f.length?'<div class="fns">'+s.f.map(f=>'<div><b>'+esc(f[0])+'</b> '+esc(f[1])+'</div>').join('')+'</div>':'';
    html+='<article class="story" id="s'+(i+1)+'" data-s="'+i+'"><div class="acts"><span class="chip">'+(t.pos+1)+':'+(i+1)+'</span>'+
     '<span class="grow"></span><span class="badge">'+ic('check')+'Completed</span><button class="act" data-act="bm" title="Bookmark">'+ic('mark','fillable')+'<span>Bookmark</span></button><button class="act" data-act="storynote" title="Add note">'+ic('note')+'<span>Add note</span></button></div>'+
     '<div class="text" lang="ur">'+h.html+'</div><div class="notes-in"></div>'+fns+'<div class="endrow"><button class="done-btn" data-act="done"></button></div></article>';
  });
  const prev=TOPICS[t.pos-1],next=TOPICS[t.pos+1];
  html+='<div class="nextbox">'+(prev?'<a class="btn" href="#t'+prev.id+'">'+ic('left')+'Previous</a>':'')+'<button class="btn" data-act="doneall">'+ic('check')+'<span id="allLbl"></span></button>'+(next?'<a class="btn primary" href="#t'+next.id+'">Next sub-heading'+ic('right')+'</a>':'<a class="btn primary" href="#home">Back to home</a>')+'</div>';
  view.innerHTML=html;
  T.stories.forEach((s,i)=>paintStory(i));paintProgress();allLabel();
  paintMarker();
  if(story&&storyEl(story-1)){const el=storyEl(story-1);requestAnimationFrame(()=>{el.scrollIntoView({block:'start'});el.classList.add('flash')});setLast(t.id,story-1)}
  else{window.scrollTo(0,0);setLast(t.id,0)}
  if('IntersectionObserver' in window){
    observer=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)setLast(t.id,+e.target.dataset.s)})},{rootMargin:'-30% 0px -60% 0px'});
    $$('article.story').forEach(a=>observer.observe(a));
  }
}
let lastT;
function setLast(t,s){clearTimeout(lastT);lastT=setTimeout(()=>{if(S.last&&S.last.t===t&&S.last.s===s)return;S.last={t,s,at:Date.now()};saveLocal();DS.changed(15000)},500)}
function allLabel(){const l=$('#allLbl');if(l)l.textContent=doneIn(R.topic)===R.topic.n?'Mark all as unread':'Mark all completed'}
function paintMarker(){const m=$('#marker');if(!m)return;const tr=$('#tray');tr.hidden=!S.set.marker;document.body.classList.toggle('marking',S.set.marker);$$('.dot',tr).forEach(d=>{const on=d.dataset.v===S.set.color;d.classList.toggle('sel',on);d.setAttribute('aria-pressed',on)});m.classList.toggle('on',S.set.marker);m.setAttribute('aria-pressed',S.set.marker);m.style.setProperty('--dot','var(--hl-'+S.set.color+')')}

/* ---------- selecting text, highlighting, notes ---------- */
let pick=null; /* {s,a,b,scope,word} */
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const quoteOf=(s,a,b)=>R.words[s].slice(a,b+1).map(w=>w.text).join(' ');
function lineRange(s,k){const W=R.words[s],l=W[k].line;let a=k,b=k;while(a>0&&W[a-1].line===l)a--;while(b<W.length-1&&W[b+1].line===l)b++;return[a,b]}
function closePop(){const p=$('.pop');if(p)p.remove();$$('.pick').forEach(x=>x.classList.remove('pick'));pick=null}
function showPick(){const el=storyEl(pick.s),ws=$$('.w',el);$$('.pick').forEach(x=>x.classList.remove('pick'));for(let k=pick.a;k<=pick.b;k++)if(ws[k])ws[k].classList.add('pick')}
const overlaps=(x,a,b)=>x.a<=b&&x.b>=a;
function setHighlight(s,a,b,color){
  const q=quoteOf(s,a,b);
  edit(R.topic.id,d=>{
    const out=[];
    (d.hl[s]||[]).forEach(h=>{
      if(!overlaps(h,a,b)){out.push(h);return}
      if(h.a<a)out.push({id:uid(),a:h.a,b:a-1,c:h.c,ts:h.ts,q:quoteOf(s,h.a,a-1)});
      if(h.b>b)out.push({id:uid(),a:b+1,b:h.b,c:h.c,ts:h.ts,q:quoteOf(s,b+1,h.b)});
    });
    if(color)out.push({id:uid(),a,b,c:color,ts:Date.now(),q});
    if(out.length)d.hl[s]=out;else delete d.hl[s];
  });
  paintStory(s);
}
function openPop(anchor){
  const old=$('.pop');if(old)old.remove();
  const d=peek(R.topic.id),notes=(d.nt[pick.s]||[]).filter(n=>overlaps(n,pick.a,pick.b)),marked=(d.hl[pick.s]||[]).some(h=>overlaps(h,pick.a,pick.b));
  const p=document.createElement('div');p.className='pop';p.setAttribute('role','dialog');p.setAttribute('aria-label','Highlight or note');
  p.innerHTML=(pick.word!=null?'<div class="seg"><button data-act="scope" data-v="word" class="'+(pick.scope==='word'?'on':'')+'">This word</button><button data-act="scope" data-v="line" class="'+(pick.scope==='line'?'on':'')+'">Whole line</button></div>':'<div style="text-align:center;color:var(--mute);font-size:12px">'+(pick.b-pick.a+1)+' words selected</div>')+
   '<div class="dots">'+[['y','yellow'],['g','green'],['b','blue'],['p','pink']].map(([c,n])=>'<button class="dot h'+c+'" data-act="color" data-v="'+c+'" aria-label="Highlight '+n+'"></button>').join('')+'</div>'+
   (notes.length?'<button class="btn small" data-act="editnote" data-id="'+notes[0].id+'">'+ic('note')+'Open note</button>':'')+
   '<button class="btn small primary" data-act="newnote">'+ic('note')+'Add note</button>'+
   (marked?'<button class="btn small" data-act="unmark">Remove highlight</button>':'')+'<button class="btn small" data-act="closepop">Close</button>';
  p.dataset.s=pick.s;document.body.appendChild(p);
  const r=anchor.getBoundingClientRect(),w=p.offsetWidth,h=p.offsetHeight;
  const x=Math.min(Math.max(10,r.left+r.width/2-w/2),document.documentElement.clientWidth-w-10);
  let y=r.bottom+8;if(y+h>window.innerHeight-76)y=Math.max(10,r.top-h-8);
  p.style.left=x+window.scrollX+'px';p.style.top=y+window.scrollY+'px';
  showPick();
}
function selectionRange(){
  const sel=window.getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount)return null;
  const rg=sel.getRangeAt(0),from=rg.commonAncestorContainer,el=(from.nodeType===1?from:from.parentElement).closest('article.story');
  if(!el)return null;
  const hit=$$('.w',el).filter(w=>{const r=document.createRange();r.selectNodeContents(w);return rg.compareBoundaryPoints(Range.END_TO_START,r)<0&&rg.compareBoundaryPoints(Range.START_TO_END,r)>0});
  if(!hit.length)return null;
  return {s:+el.dataset.s,a:+hit[0].dataset.w,b:+hit[hit.length-1].dataset.w,anchor:hit[hit.length-1]};
}
let selTimer,justSelected=0;
function onSelectEnd(){
  clearTimeout(selTimer);
  selTimer=setTimeout(()=>{
    if(!R||$('.veil'))return;const r=selectionRange();if(!r)return;
    justSelected=Date.now();
    if(S.set.marker){setHighlight(r.s,r.a,r.b,S.set.color);window.getSelection().removeAllRanges();return}
    pick={s:r.s,a:r.a,b:r.b,scope:'range',word:null};openPop(r.anchor);
  },350);
}
document.addEventListener('mouseup',e=>{if(!e.target.closest('.pop'))onSelectEnd()});
document.addEventListener('touchend',e=>{if(!e.target.closest('.pop'))onSelectEnd()});
document.addEventListener('selectionchange',()=>{if(window.matchMedia('(pointer:coarse)').matches&&selectionRange())onSelectEnd()});
function tapWord(w){
  if(Date.now()-justSelected<500||selectionRange())return;
  const el=w.closest('article.story');if(!el)return;
  const s=+el.dataset.s,k=+w.dataset.w;
  if(S.set.marker){
    const has=(peek(R.topic.id).hl[s]||[]).some(h=>h.a<=k&&h.b>=k);
    setHighlight(s,k,k,has?null:S.set.color);return;
  }
  pick={s,a:k,b:k,scope:'word',word:k};openPop(w);
}

/* ---------- sheets ---------- */
function openSheet(title,body,cls){
  closePop();
  layer.innerHTML='<div class="veil" data-act="veil"><div class="sheet'+(cls?' '+cls:'')+'" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><header><h2>'+esc(title)+'</h2><button class="act" data-act="close" aria-label="Close">'+ic('x')+'</button></header>'+body+'</div></div>';
}
const closeSheet=()=>{layer.innerHTML=''};
let noteCtx=null;
function noteSheet(s,a,b,id){
  const tid=R.topic.id,n=id?(peek(tid).nt[s]||[]).find(x=>x.id===id):null;
  noteCtx={tid,s,a:n?n.a:a,b:n?n.b:b,id:n?n.id:null,q:n?n.q:quoteOf(s,a,b)};
  openSheet(n?'Your note':'New note','<div class="quote ur">'+T_(noteCtx.q.length>400?noteCtx.q.slice(0,400)+'…':noteCtx.q)+'</div><textarea id="notetext" placeholder="Write your note (English or Urdu)" aria-label="Note"></textarea><div class="row" style="justify-content:space-between">'+(n?'<button class="btn" data-act="delnote">Delete note</button>':'<span></span>')+'<button class="btn primary" data-act="savenote">Save note</button></div>');
  const ta=$('#notetext');ta.value=n?n.x:'';ta.focus();
}
function saveNote(){
  const x=$('#notetext').value.trim();if(!x){toast('Write something first.');return}
  const c=noteCtx;
  edit(c.tid,d=>{const list=d.nt[c.s]||(d.nt[c.s]=[]);const old=list.find(n=>n.id===c.id);if(old){old.x=x;old.ts=Date.now()}else list.push({id:uid(),a:c.a,b:c.b,q:c.q.slice(0,600),x,ts:Date.now()})});
  closeSheet();if(R&&R.topic.id===c.tid)paintStory(c.s);toast('Note saved');
}
function removeSaved(kind,tid,s,id){
  edit(tid,d=>{
    if(kind==='bookmarks')delete d.bm[s];
    else{const key=kind==='notes'?'nt':'hl';d[key][s]=(d[key][s]||[]).filter(x=>x.id!==id);if(!d[key][s].length)delete d[key][s]}
  });
}
let drawerOpen=null;
function drawerBody(){
  return TOC.map(c=>{
    const o=drawerOpen===c.n,d=doneCh(c);
    return '<section class="acc'+(o?' open':'')+'"><button data-act="dtoggle" data-v="'+c.n+'" aria-expanded="'+o+'"><span class="rosette">'+c.n+'</span><span class="mid"><span class="ur">'+T_(c.title)+'</span><span class="meta"><span>'+c.topics.length+' sub-headings</span><span>'+d+' of '+c.count+' read</span></span>'+bar(d,c.count)+'</span><span class="chev">'+ic('down')+'</span></button>'+(o?'<div class="inner list">'+c.topics.map(topicCard).join('')+'</div>':'')+'</section>';
  }).join('');
}
function openDrawer(){drawerOpen=R&&location.hash.startsWith('#t')?R.topic.ch:drawerOpen||1;openSheet('Headings and sub-headings','<div id="dbody">'+drawerBody()+'</div>','drawer')}
function settingsSheet(){
  const seg=(act,cur,opts)=>'<div class="seg">'+opts.map(([v,l])=>'<button data-act="'+act+'" data-v="'+v+'" class="'+(String(cur)===String(v)?'on':'')+'">'+l+'</button>').join('')+'</div>';
  openSheet('Settings','<div class="setrow"><label for="size">Text size</label><input type="range" id="size" min="15" max="30" step="1" value="'+S.set.size+'"></div>'+
   '<div class="setrow"><span>References</span>'+seg('fn',S.set.fn?1:0,[[1,'Show'],[0,'Hide']])+'</div>'+
   '<div class="setrow"><span>Theme</span>'+seg('theme',S.set.theme,[['auto','Auto'],['light','Light'],['dark','Dark']])+'</div>'+
   '<div class="setrow"><span>Backup of progress and notes</span><span class="row"><button class="btn small" data-act="export">Export backup</button><label class="btn small" for="imp">Import</label><input type="file" id="imp" accept=".json,application/json" hidden></span></div>'+
   '<p class="note-text">'+esc(IN_CLAUDE?Sync.status:account?'Signed in as '+account.email+'. Erasing also erases the copy in Google Drive.':'Saved in this browser only.')+'</p>'+
   '<div class="setrow" style="border:0;justify-content:flex-end"><button class="btn small" data-act="reset">Erase my reading data</button></div>');
  $('#size').oninput=e=>{S.set.size=+e.target.value;applySettings();saveLocal()};
  $('#imp').onchange=e=>importFile(e.target.files[0]);
}
async function exportData(){
  const data=JSON.stringify({app:KEY,t:S.t,last:S.last},null,1),filename='hayat-us-sahaba-backup.json';
  if(window.claude&&window.claude.use){
    const dl=await window.claude.use('downloads');
    if(!dl){toast('Saving files is not available in this view.');return}
    try{await dl.save({filename,data})}catch(e){toast('The backup was not saved.')}
    return;
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=filename;a.click();URL.revokeObjectURL(a.href);
}
function cleanTopic(d){
  const o=blank();if(!d||typeof d!=='object')return o;o.u=+d.u||0;
  for(const k in d.done||{})if(/^\d+$/.test(k))o.done[k]=+d.done[k]||1;
  for(const k in d.bm||{})if(/^\d+$/.test(k))o.bm[k]=+d.bm[k]||1;
  for(const key of ['hl','nt'])for(const k in d[key]||{})if(/^\d+$/.test(k)&&Array.isArray(d[key][k]))
    o[key][k]=d[key][k].filter(x=>x&&Number.isInteger(x.a)&&Number.isInteger(x.b)&&x.b>=x.a&&x.b-x.a<20000).map(x=>{const y={id:String(x.id).replace(/[^a-z0-9]/gi,''),a:x.a,b:x.b,ts:+x.ts||1,q:String(x.q||'')};if(key==='hl')y.c=['y','g','b','p'].includes(x.c)?x.c:'y';else y.x=String(x.x||'');return y});
  return o;
}
/* join two sets of reading data without dropping anything from either */
function addData(topics){
  for(const tid in topics){
    if(!BYID[tid])continue;
    const inc=cleanTopic(topics[tid]),cur=S.t[tid]||blank(),m=blank();
    Object.assign(m.done,inc.done,cur.done);Object.assign(m.bm,inc.bm,cur.bm);
    for(const key of ['hl','nt']){
      new Set([...Object.keys(inc[key]),...Object.keys(cur[key])]).forEach(k=>{const seen=new Map();(inc[key][k]||[]).concat(cur[key][k]||[]).forEach(x=>seen.set(x.id,x));m[key][k]=[...seen.values()]});
    }
    m.u=Date.now();S.t[tid]=m;Sync.push(tid);
  }
  saveLocal();DS.changed();
}
function importFile(f){
  if(!f)return;const fr=new FileReader();
  fr.onload=()=>{
    try{
      const v=JSON.parse(fr.result);if(v.app!==KEY||!v.t)throw 0;
      addData(v.t);
      saveLocal();closeSheet();route();toast('Backup added to your reading data');
    }catch(e){toast('That file is not a backup from this reader.')}
  };
  fr.readAsText(f);
}

/* ---------- reading profile and Google Drive ---------- */
const DS={generation:0,running:null,again:false,timer:null,due:0,state:'idle',at:0,
  /* newer change to a sub-heading wins */
  take(remote){
    let changed=false;
    if(!remote||remote.app!==KEY||!remote.t)return false;
    for(const tid in remote.t){if(BYID[tid]&&(+remote.t[tid].u||0)>peek(tid).u){S.t[tid]=cleanTopic(remote.t[tid]);changed=true}}
    const r=remote.last;
    if(r&&BYID[r.t]&&(+r.at||0)>((S.last&&S.last.at)||0)){S.last={t:+r.t,s:+r.s||0,at:+r.at};changed=true}
    return changed;
  },
  ahead(remote){
    if(!remote||!remote.t)return true;
    return Object.keys(S.t).some(t=>(S.t[t].u||0)>(+(remote.t[t]||{}).u||0))||((S.last&&S.last.at)||0)>((remote.last&&+remote.last.at)||0);
  },
  changed(delay){
    if(!account||!DRIVE||!DRIVE.isFor(account.sub))return;
    const due=Date.now()+(delay||2500);
    if(this.timer&&this.due<=due)return;
    clearTimeout(this.timer);this.due=due;this.timer=setTimeout(()=>{this.timer=null;this.sync()},due-Date.now());
  },
  sync(){
    if(!account)return Promise.resolve(false);
    if(!DRIVE.isFor(account.sub)){this.set('reconnect');return Promise.resolve(false)}
    if(this.running){this.again=true;return this.running}
    const gen=this.generation;this.set('syncing');
    this.running=(async()=>{
      try{
        const remote=await DRIVE.read();
        if(gen!==this.generation)return false;
        if(this.take(remote)){saveLocal();refresh()}
        if(this.ahead(remote)){
          await DRIVE.write({app:KEY,t:S.t,last:S.last});
          if(gen!==this.generation)return false;
        }
        this.at=Date.now();this.set('ok');return true;
      }catch(e){
        if(gen===this.generation)this.set(e.code==='auth'?'reconnect':e.code==='denied'?'denied':'error');
        return false;
      }
    })().then(ok=>{this.running=null;if(this.again){this.again=false;this.changed(800)}return ok});
    return this.running;
  },
  set(state){this.state=state;paintMe();const el=$('#syncline');if(el)el.textContent=this.text()},
  text(){
    return {idle:'Not synced yet.',syncing:'Saving to your Google Drive…',
      ok:'Saved to your Google Drive at '+new Date(this.at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'.',
      reconnect:'Google sign-in has expired. Changes are kept on this device. Reconnect to save them to Drive.',
      denied:'Google Drive refused the request. Changes are kept on this device.',
      error:'Google Drive could not be reached. Changes are kept on this device and will be tried again.'}[this.state];
  }
};
let CLAUDE_ME=null;
function person(){return IN_CLAUDE?(CLAUDE_ME&&CLAUDE_ME.name?{name:CLAUDE_ME.name,email:CLAUDE_ME.email||'',picture:CLAUDE_ME.avatarUrl||''}:null):account}
function avatar(p,big){
  const pic=p&&/^(https:\/\/|data:image\/|\/)/.test(p.picture||'')?p.picture:'';
  return '<span class="avatar'+(big?' big':'')+'">'+(pic?'<img src="'+esc(pic)+'" alt="" referrerpolicy="no-referrer">':esc((p&&(p.name||p.email)||'?').trim().charAt(0).toUpperCase()))+'</span>';
}
function meInner(){
  const p=person();
  if(p)return avatar(p)+'<span>'+esc((p.name||p.email).split(/\s+/)[0])+'</span>';
  return '<span>'+(IN_CLAUDE?'Profile':'Sign in')+'</span>';
}
const meButton=()=>'<button class="me'+(person()?'':' plain')+'" data-act="account" aria-label="Reading profile">'+meInner()+'</button>';
function paintMe(){$$('.me').forEach(b=>{b.classList.toggle('plain',!person());b.innerHTML=meInner()})}
function statsHTML(){
  return '<div class="stats">'+[[doneAll(),'completed'],[savedItems('bookmarks').length,'bookmarks'],[savedItems('notes').length,'notes'],[savedItems('highlights').length,'highlights']].map(([n,l])=>'<div><strong>'+n+'</strong>'+l+'</div>').join('')+'</div>';
}
function accountSheet(){
  const p=person();
  const head=(title,sub)=>'<div class="profile">'+avatar(p,true)+'<div><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></div></div>';
  let body;
  if(IN_CLAUDE){
    body=head(p?p.name:'Your reading profile',p?(p.email||'Signed in through Claude'):'Signed in through Claude')+statsHTML()+'<p class="note-text">'+esc(Sync.status)+'</p>';
  }else if(account){
    body=head(account.name,account.email)+statsHTML()+'<p class="note-text" id="syncline" role="status">'+esc(DS.text())+'</p><div class="row" style="flex-wrap:wrap">'+
      (DRIVE.isFor(account.sub)?'<button class="btn primary" data-act="syncnow">Sync now</button>':'<button class="btn primary" data-act="signin">Reconnect to Google</button>')+
      '<button class="btn" data-act="signout">Sign out</button><button class="btn" data-act="signoutwipe">Sign out and remove from this device</button></div>';
  }else{
    const ready=DRIVE.configured()&&DRIVE.supported();
    body=head('Reading as a guest','Saved in this browser only')+statsHTML()+
      (ready?'<button class="btn primary" data-act="signin">Sign in with Google</button><p class="note-text">Each email gets its own reading profile. Progress, bookmarks, highlights and notes are saved in a private app folder in that person’s Google Drive. This site cannot see their other Drive files, and it never sees a password.</p>'
        :'<button class="btn" disabled aria-describedby="why">Sign in with Google (not set up yet)</button><p class="note-text" id="why">'+(DRIVE.configured()?'Google sign-in works only when the site is opened from a web address, not straight from a folder.':'<b>Why it is off:</b> this site has no Google Client ID yet. The site owner creates one for free in Google Cloud Console and pastes it into <b>config.js</b>. The steps are in <b>SETUP-GOOGLE-SIGNIN.md</b>. Until then, your reading is saved in this browser.')+'</p>');
  }
  openSheet('Reading profile',body);
}
function switchAccount(next){
  clearTimeout(DS.timer);DS.timer=null;DS.again=false;DS.generation++;DS.state='idle';
  account=next;
  try{if(next)localStorage.setItem(ACCKEY,JSON.stringify(next));else localStorage.removeItem(ACCKEY)}catch(e){}
  loadData();route();
}
const hasContent=t=>Object.values(t||{}).some(d=>['done','bm','hl','nt'].some(k=>Object.keys(d[k]||{}).length));
async function signIn(){
  let p;
  try{p=await DRIVE.signIn(account&&account.email)}
  catch(e){toast(e.code==='scope'?'Allow the Google Drive permission so your progress can be saved.':e.code==='cancelled'?'Sign-in was not completed.':'Google sign-in could not be reached.');return}
  const wasGuest=!account;
  if(!account||account.sub!==p.sub)switchAccount(p);
  else{account=p;try{localStorage.setItem(ACCKEY,JSON.stringify(p))}catch(e){}paintMe()}
  closeSheet();
  await DS.sync();
  if(!account||account.sub!==p.sub)return;
  const guest=readJSON(KEY);
  if(wasGuest&&guest&&hasContent(guest.t))
    openSheet('Reading data on this device','<p style="margin:0">This device has reading data saved without sign-in. Move it into the profile for <b>'+esc(p.email)+'</b>? Choose this only if it is yours.</p><div class="row" style="flex-wrap:wrap"><button class="btn primary" data-act="moveguest">Move it to my profile</button><button class="btn" data-act="close">Leave it on this device</button></div>');
  else accountSheet();
}
function moveGuest(){
  const guest=readJSON(KEY);
  if(!account||!guest)return;
  addData(guest.t);
  try{localStorage.removeItem(KEY)}catch(e){}
  closeSheet();route();toast('Added to your profile');
}
async function signOut(wipe){
  if(wipe){
    if(!await DS.sync()){toast('Not removed. Reconnect and sync first, so nothing is lost.');return}
    try{localStorage.removeItem(dataKey())}catch(e){}
  }
  DRIVE.signOut();switchAccount(null);closeSheet();toast(wipe?'Signed out and removed from this device':'Signed out');
}

/* ---------- search and saved lists ---------- */
function norm(s){return String(s).replace(/[ً-ٰٟۖ-ۭؐ-ؚ]/g,'').replace(/ٱ/g,'ا').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ةۃ]/g,'ہ').replace(/[أإآ]/g,'ا').replace(/\s+/g,' ').trim()}
let searchIdx=null,lastQuery='',searchRun=0;
async function buildIndex(){
  if(searchIdx)return searchIdx;
  await Promise.all(TOC.map(c=>loadChapter(c.n)));
  searchIdx=[];
  TOPICS.forEach(t=>CH[t.ch].topics[t.id].stories.forEach((s,i)=>searchIdx.push({t,s:i,x:norm(s.b.map(b=>b[1].filter(r=>!r[1].includes('s')).map(r=>r[0]).join('')).join(' '))})));
  return searchIdx;
}
async function doSearch(q){
  lastQuery=q;const run=++searchRun,box=$('#results'),n=norm(q);
  if(n.length<2){box.innerHTML='<p class="empty">Type at least two letters. Urdu and Arabic both work.</p>';return}
  box.innerHTML='<p class="empty">Searching…</p>';
  let idx;try{idx=await buildIndex()}catch(e){box.innerHTML='<p class="empty">The text did not load. Check your connection and try again.</p>';return}
  if(run!==searchRun||!$('#results'))return;
  const heads=TOPICS.filter(t=>norm(t.title).includes(n)),hits=idx.filter(e=>e.x.includes(n));
  box.innerHTML=(heads.length?'<h3>Sub-headings ('+heads.length+')</h3><div class="grid">'+heads.slice(0,30).map(topicCard).join('')+'</div>':'')+
   '<h3>Stories ('+hits.length+')</h3>'+(hits.length?'<div class="list">'+hits.slice(0,80).map(e=>{const p=e.x.indexOf(n),a=Math.max(0,p-60);return '<div class="item"><a class="go" style="grid-column:1/-1" href="#t'+e.t.id+'-s'+(e.s+1)+'"><span class="ur">'+(a?'… ':'')+esc(e.x.slice(a,p))+'<mark>'+esc(e.x.slice(p,p+n.length))+'</mark>'+T_(e.x.slice(p+n.length,p+n.length+80))+' …</span><small>'+T_(e.t.title)+' · story '+(e.s+1)+'</small></a></div>'}).join('')+'</div>'+(hits.length>80?'<p class="empty">Showing the first 80. Add more words to narrow the search.</p>':''):'<p class="empty">No story contains this.</p>');
}
function renderSearch(){
  mainTop('search');floating.innerHTML='';
  view.innerHTML='<input class="field ur" id="q" style="width:100%;font-size:16px" placeholder="کتاب میں تلاش کریں" aria-label="Search the book"><div id="results"><p class="empty">Type at least two letters. Urdu and Arabic both work.</p></div>';
  const q=$('#q');let t;q.value=lastQuery;q.oninput=()=>{clearTimeout(t);t=setTimeout(()=>doSearch(q.value),350)};if(lastQuery)doSearch(lastQuery);q.focus();
}
function renderList(kind){
  mainTop(kind);floating.innerHTML='';
  view.innerHTML='<div class="tabs">'+['bookmarks','notes','highlights'].map(k=>'<button data-act="goto" data-v="'+k+'" class="'+(k===kind?'on':'')+'">'+k[0].toUpperCase()+k.slice(1)+' ('+savedItems(k).length+')</button>').join('')+'</div>'+listHTML(kind);
}

/* ---------- routing ---------- */
let renderToken=0;
function route(){
  renderToken++;document.body.classList.remove('marking');closePop();closeSheet();if(observer){observer.disconnect();observer=null}clearTimeout(lastT);
  const h=location.hash.slice(1);let m;
  if((m=/^t(\d+)(?:-s(\d+))?$/.exec(h))&&BYID[m[1]]){renderTopic(BYID[m[1]],m[2]?+m[2]:0);return}
  R=null;
  if(h==='search')renderSearch();
  else if(h==='bookmarks'||h==='notes'||h==='highlights')renderList(h);
  else{
    if((m=/^c(\d)$/.exec(h))&&TOC[+m[1]-1]){nav('t'+TOC[+m[1]-1].topics[0].id);return}
    renderHome();JOURNEY.animate(view);
  }
  window.scrollTo(0,0);
}
function refresh(){
  if(layer.firstChild||$('.pop'))return;
  const h=location.hash.slice(1);
  if(R){R.words.forEach((w,i)=>paintStory(i));paintProgress();allLabel()}
  else if(!h||h==='home')renderHome();else if(h==='bookmarks'||h==='notes'||h==='highlights')renderList(h);
}

/* ---------- one click handler ---------- */
let armed=false;
document.addEventListener('click',e=>{
  const w=e.target.closest('article.story .w');
  if(w){tapWord(w);return}
  const b=e.target.closest('[data-act]');
  if(!b){if(!e.target.closest('.pop')&&$('.pop')&&Date.now()-justSelected>500)closePop();return}
  const act=b.dataset.act,v=b.dataset.v,story=b.closest('article.story'),s=story?+story.dataset.s:null;
  if(act==='veil'){if(e.target===b)closeSheet();return}
  if(act==='close')closeSheet();
  else if(act==='done'){
    edit(R.topic.id,d=>{if(d.done[s])delete d.done[s];else d.done[s]=Date.now()});paintStory(s);paintProgress();allLabel();
    if(peek(R.topic.id).done[s])celebrate(b,doneIn(R.topic)===R.topic.n);
  }
  else if(act==='doneall'){
    const all=doneIn(R.topic)===R.topic.n;
    edit(R.topic.id,d=>{if(all)d.done={};else for(let i=0;i<R.topic.n;i++)d.done[i]=d.done[i]||Date.now()});
    R.words.forEach((x,i)=>paintStory(i));paintProgress();allLabel();if(!all)celebrate(b,true);
  }
  else if(act==='bm'){edit(R.topic.id,d=>{if(d.bm[s])delete d.bm[s];else d.bm[s]=Date.now()});paintStory(s);toast(peek(R.topic.id).bm[s]?'Story bookmarked':'Bookmark removed')}
  else if(act==='storynote')noteSheet(s,0,Math.max(0,lineRange(s,0)[1]));
  else if(act==='scope'){pick.scope=v;const r=v==='line'?lineRange(pick.s,pick.word):[pick.word,pick.word];pick.a=r[0];pick.b=r[1];const an=$$('.w',storyEl(pick.s))[pick.word];openPop(an)}
  else if(act==='color'){S.set.color=v;saveLocal();const p=pick;closePop();setHighlight(p.s,p.a,p.b,v);window.getSelection().removeAllRanges();paintMarker()}
  else if(act==='unmark'){const p=pick;closePop();setHighlight(p.s,p.a,p.b,null)}
  else if(act==='newnote'){const p=pick;window.getSelection().removeAllRanges();noteSheet(p.s,p.a,p.b)}
  else if(act==='editnote'){const ps=story?s:pick.s;noteSheet(ps,0,0,b.dataset.id)}
  else if(act==='closepop'){closePop();window.getSelection().removeAllRanges()}
  else if(act==='savenote')saveNote();
  else if(act==='delnote'){
    if(!b.dataset.sure){b.dataset.sure=1;b.textContent='Tap again to delete';return}
    const c=noteCtx;removeSaved('notes',c.tid,c.s,c.id);closeSheet();paintStory(c.s);toast('Note deleted');
  }
  else if(act==='marker'){closePop();S.set.marker=!S.set.marker;saveLocal();paintMarker()}
  else if(act==='mcolor'){S.set.color=v;saveLocal();paintMarker()}
  else if(act==='drawer')openDrawer();
  else if(act==='jump'){const el=storyEl(+v);if(el){el.scrollIntoView({block:'start'});el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}}
  else if(act==='goal'){const g=[1,3,5,10];S.set.goal=g[(g.indexOf(dailyGoal())+1)%g.length];saveLocal();const y=window.scrollY;renderHome();window.scrollTo(0,y)}
  else if(act==='account')accountSheet();
  else if(act==='signin')signIn();
  else if(act==='syncnow')DS.sync();
  else if(act==='signout')signOut(false);
  else if(act==='signoutwipe'){if(!b.dataset.sure){b.dataset.sure=1;b.textContent='Tap again to confirm';return}signOut(true)}
  else if(act==='moveguest')moveGuest();
  else if(act==='dtoggle'){drawerOpen=drawerOpen===+v?null:+v;$('#dbody').innerHTML=drawerBody()}
  else if(act==='settings')settingsSheet();
  else if(act==='fn'){S.set.fn=v==='1';saveLocal();applySettings();settingsSheet()}
  else if(act==='theme'){S.set.theme=v;saveLocal();applySettings();settingsSheet()}
  else if(act==='export')exportData();
  else if(act==='reset'){
    if(!armed){armed=true;b.textContent='Tap again to erase everything';setTimeout(()=>armed=false,5000);return}
    armed=false;Object.keys(S.t).forEach(t=>{S.t[t]=blank();S.t[t].u=Date.now();Sync.push(t)});S.last={t:0,s:0,at:Date.now()};saveLocal();DS.changed();closeSheet();route();toast('Reading data erased');
  }
  else if(act==='retry')route();
  else if(act==='expand'){H.open[b.dataset.k]=!H.open[b.dataset.k];const y=window.scrollY;$('#browse').innerHTML=browseHTML();window.scrollTo(0,y)}
  else if(act==='all'){const any=TOC.some(c=>H.open['s'+c.n]);TOC.forEach(c=>H.open['s'+c.n]=!any);$('#browse').innerHTML=browseHTML()}
  else if(act==='browse'){H.browse=v;const y=window.scrollY;renderHome();window.scrollTo(0,y)}
  else if(act==='show'){H.show=v;$$('.chips button').forEach(x=>{x.classList.toggle('on',x.dataset.v===v);x.setAttribute('aria-pressed',x.dataset.v===v)});$('#browse').innerHTML=browseHTML()}
  else if(act==='tab'){H.tab=v;const y=window.scrollY;renderHome();window.scrollTo(0,y)}
  else if(act==='goto')nav(v);
  else if(act==='remove'){
    if(b.dataset.kind==='notes'&&!b.dataset.sure){b.dataset.sure=1;b.textContent='Delete?';return}
    removeSaved(b.dataset.kind,+b.dataset.t,+b.dataset.s,b.dataset.id);const y=window.scrollY;refresh();window.scrollTo(0,y);
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheet();closePop()}});
window.addEventListener('hashchange',route);

window.addEventListener('online',()=>DS.changed(500));
document.addEventListener('visibilitychange',()=>{if(!account)return;if(document.visibilityState==='visible')DS.changed(500);else if(DS.timer){clearTimeout(DS.timer);DS.timer=null;DS.sync()}});
/* another tab signed in or out: reload so one profile is never written into another */
window.addEventListener('storage',e=>{if(e.key===ACCKEY){const now=readJSON(ACCKEY);if(((now&&now.sub)||'')!==((account&&account.sub)||''))location.reload()}});
applySettings();route();Sync.start();DRIVE.prepare();if(account)DS.sync();
})();
