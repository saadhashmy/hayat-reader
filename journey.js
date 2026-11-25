/* The reading journey: progress orbit, one star per main heading, daily goal, streak, celebrations.
   Everything shown is worked out from the reader's own completion dates. */
(function(){
'use strict';
const MILES=[[0,'Ready to begin'],[1,'First step'],[10,'On the path'],[25,'Gaining light'],[50,'Steady reader'],[100,'First hundred'],[200,'Devoted reader'],[350,'Deep in the book'],[500,'Five hundred strong'],[750,'Far along the road'],[1000,'One thousand stories'],[1500,'Nearing the summit']];
const calm=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey=d=>d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
const daysAgo=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);return d};
function stats(times){
  const days={};times.forEach(t=>{const k=dayKey(new Date(t));days[k]=(days[k]||0)+1});
  const today=days[dayKey(new Date())]||0;
  let i=today?0:1,streak=0;
  while(days[dayKey(daysAgo(i))]){streak++;i++}
  const week=[6,5,4,3,2,1,0].map(n=>{const d=daysAgo(n);return {n:days[dayKey(d)]||0,label:d.toLocaleDateString('en',{weekday:'narrow'}),name:d.toLocaleDateString('en',{weekday:'long'}),today:n===0}});
  return {today,streak,week};
}
function level(done,total){
  const all=MILES.concat([[total,'The whole book']]);
  let k=0;while(k+1<all.length&&done>=all[k+1][0])k++;
  const next=all[k+1]||null;
  return {name:all[k][1],from:all[k][0],next};
}
function percent(a,b){const p=b?a/b*100:0;if(p>0&&p<0.1)return 0.1;return p<10?Math.floor(p*10)/10:Math.floor(p)}
/* fixed star positions, so the sky does not jump between visits */
function sky(){
  let s='',seed=7;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<70;i++){const big=r()>.88;s+='<i style="left:'+(r()*100).toFixed(2)+'%;top:'+(r()*100).toFixed(2)+'%;--d:'+(r()*5).toFixed(2)+'s;--s:'+(big?3:(r()*1.4+.8).toFixed(1))+'px"></i>'}
  return '<div class="sky" aria-hidden="true">'+s+'<b class="shoot"></b></div>';
}
function orbit(done,total){
  const R=92,C=2*Math.PI*R,f=total?done/total:0,a=f*2*Math.PI-Math.PI/2;
  const p=percent(done,total);
  return '<div class="orbit" role="img" aria-label="'+done+' of '+total+' stories completed">'+
  '<svg viewBox="0 0 220 220"><defs><linearGradient id="jg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#4fe0a8"/></linearGradient></defs>'+
  '<circle class="spin" cx="110" cy="110" r="106" fill="none" stroke="#ecd08a" stroke-opacity=".35" stroke-dasharray="1 9" stroke-width="3" stroke-linecap="round"/>'+
  '<circle cx="110" cy="110" r="'+R+'" fill="none" stroke="#ffffff1c" stroke-width="13"/>'+
  '<circle class="arc" cx="110" cy="110" r="'+R+'" fill="none" stroke="url(#jg)" stroke-width="13" stroke-linecap="round" transform="rotate(-90 110 110)" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-f)).toFixed(1)+'" data-full="'+C.toFixed(1)+'" style="opacity:'+(done?1:0)+'"/>'+
  '<g class="comet" style="--turn:'+(f*360).toFixed(2)+'deg"><circle cx="110" cy="'+(110-R)+'" r="13" fill="#ffe9a6" opacity=".22"/><circle cx="110" cy="'+(110-R)+'" r="6.500" fill="#fff6d0"/></g></svg>'+
  '<div class="core"><strong><span class="count" data-to="'+p+'">'+p+'</span><em>%</em></strong><span>'+done.toLocaleString('en')+' of '+total.toLocaleString('en')+'</span><small>stories completed</small></div></div>';
}
const FLAME='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 5 7 6.500 7 12.500a7 7 0 0 1-14 0c0-3.500 2-5.500 3.500-7 0 2.500 1 3.500 2.500 3.500 1.500-2.500 0-5.500 1-9z" fill="currentColor"/></svg>';
function html(d){
  const s=stats(d.times),lv=level(d.done,d.total),goal=d.goal,met=s.today>=goal;
  const toNext=lv.next?lv.next[0]-d.done:0,frac=lv.next?(d.done-lv.from)/(lv.next[0]-lv.from):1;
  const current=d.chapters.find(c=>c.done<c.count);
  const stars=d.chapters.map(c=>{const f=c.count?c.done/c.count:0;
    return '<a class="node'+(f===1?' lit':f>0?' started':'')+(current&&current.n===c.n?' current':'')+'" href="#c'+c.n+'" style="--p:'+(f*100).toFixed(2)+'" aria-label="Main heading '+c.n+', '+esc(c.en)+', '+c.done+' of '+c.count+' completed"><span class="star"><i></i><b>'+c.n+'</b></span><small>'+(f===1?'Done':percent(c.done,c.count)+'%')+'</small></a>'}).join('');
  const lit=d.chapters.filter(c=>c.done===c.count).length;
  return '<section class="journey">'+sky()+
   '<div class="j-top">'+orbit(d.done,d.total)+
   '<div class="j-info"><div class="j-name" lang="ur">حیاۃ الصحابہؓ</div><h1>Hayat-us-Sahaba · Part 3</h1>'+
   '<p class="j-level"><span>'+esc(lv.name)+'</span></p>'+
   (lv.next?'<div class="j-next"><div class="j-track" role="progressbar" aria-label="Progress to next milestone" aria-valuemin="'+lv.from+'" aria-valuemax="'+lv.next[0]+'" aria-valuenow="'+d.done+'"><i style="width:'+(frac*100).toFixed(1)+'%"></i></div><p><b>'+toNext.toLocaleString('en')+(toNext===1?' story':' stories')+'</b> to reach “'+esc(lv.next[1])+'”</p></div>':'<p class="j-next">You have completed the whole book.</p>')+
   d.cta+'</div></div>'+
   '<div class="j-path"><div class="j-head"><span>Your path through the book</span><span>'+lit+' of '+d.chapters.length+' stars lit</span></div><div class="nodes">'+stars+'</div></div>'+
   '<div class="j-cards">'+
    '<div class="j-card'+(met?' met':'')+'"><div class="mini" style="--p:'+Math.min(100,s.today/goal*100)+'"><span>'+s.today+'/'+goal+'</span></div><div><b>'+(met?'Today’s goal reached':'Today’s goal')+'</b><span>'+(met?s.today+' completed today':(goal-s.today)+' more to go today')+'</span><button data-act="goal" title="Change the daily goal">Goal: '+goal+' a day · change</button></div></div>'+
    '<div class="j-card'+(s.streak?' hot':'')+'"><div class="flame">'+FLAME+'</div><div><b>'+s.streak+'-day streak</b><span>'+(!s.streak?'Complete a story to start one':s.today?'You read today':'Complete one today to keep it')+'</span></div></div>'+
    '<div class="j-card week"><div><b>Last 7 days</b><div class="days">'+s.week.map(w=>'<span class="'+(w.n?'on':'')+(w.today?' today':'')+'" title="'+w.name+': '+w.n+' completed"><i></i>'+w.label+'</span>').join('')+'</div></div></div>'+
   '</div></section>';
}
/* sweep the orbit and count up once, when the home page is opened */
function animate(root){
  if(calm())return;
  const arc=root.querySelector('.arc'),comet=root.querySelector('.comet'),num=root.querySelector('.count');
  if(!arc)return;
  const end=arc.getAttribute('stroke-dashoffset'),turn=comet.style.getPropertyValue('--turn');
  arc.style.transition=comet.style.transition='none';
  arc.setAttribute('stroke-dashoffset',arc.dataset.full);comet.style.setProperty('--turn','0deg');
  arc.getBoundingClientRect();
  arc.style.transition=comet.style.transition='';
  requestAnimationFrame(()=>{arc.setAttribute('stroke-dashoffset',end);comet.style.setProperty('--turn',turn)});
  const to=+num.dataset.to,start=performance.now();
  const step=t=>{const k=Math.min(1,(t-start)/1400),v=to*(1-Math.pow(1-k,3));num.textContent=k<1?(to%1?v.toFixed(1):Math.round(v)):to;if(k<1&&num.isConnected)requestAnimationFrame(step)};
  requestAnimationFrame(step);
}
/* a short shower of stars from a point on the screen; never blocks taps */
function burst(x,y,big){
  if(calm())return;
  const box=document.createElement('div');box.className='burst';box.setAttribute('aria-hidden','true');
  const n=big?90:26,colors=['#f2c14e','#ffe9a6','#2fbf8a','#0f8a66','#d89b1d'];
  for(let i=0;i<n;i++){
    const p=document.createElement('i'),a=Math.random()*Math.PI*2,r=(big?120:40)+Math.random()*(big?260:90);
    p.style.cssText='left:'+x+'px;top:'+y+'px;--x:'+(Math.cos(a)*r).toFixed(0)+'px;--y:'+(Math.sin(a)*r-(big?40:20)).toFixed(0)+'px;--c:'+colors[i%colors.length]+';--z:'+(6+Math.random()*(big?12:7)).toFixed(0)+'px;--t:'+(0.7+Math.random()*(big?1:.4)).toFixed(2)+'s';
    box.appendChild(p);
  }
  document.body.appendChild(box);setTimeout(()=>box.remove(),2000);
}
/* the words shown after a story is completed */
function cheer(times,done,total,goal,topicDone){
  const s=stats(times),lv=level(done,total);
  if(done===total)return {text:'You have completed the whole book. Alhamdulillah.',big:true};
  if(MILES.some(m=>m[0]===done&&done>0))return {text:'Milestone reached: '+lv.name,big:true};
  if(topicDone)return {text:'Sub-heading completed',big:true};
  if(s.today===goal)return {text:'Today’s goal reached',big:true};
  if(s.today<goal)return {text:'Story completed · '+(goal-s.today)+' more to today’s goal'};
  return {text:'Story completed · '+s.today+' today'};
}
window.HSJourney={html,animate,burst,cheer,stats,level};
})();
