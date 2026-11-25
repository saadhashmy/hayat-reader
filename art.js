/* Original line illustrations. No people or animals are drawn. */
(function(){
const P={
 crescent:'<path d="M30 9a16 16 0 1 0 9 27A13 13 0 0 1 30 9z"/><path d="M36 12v6M33 15h6"/>',
 mosque:'<path d="M10 40V26h28v14M7 40h34M16 26c0-6 4-8 8-12 4 4 8 6 8 12M24 14V9M21 40v-6a3 3 0 0 1 6 0v6M10 26V17l-2-3-2 3v23M38 26v-9l2-3 2 3v23"/>',
 book:'<path d="M24 13c-4-3-10-4-16-3v26c6-1 12 0 16 3 4-3 10-4 16-3V10c-6-1-12 0-16 3zM24 13v26M12 17c3 0 6 .5 8 1.5M12 23c3 0 6 .5 8 1.5M36 17c-3 0-6 .5-8 1.5M36 23c-3 0-6 .5-8 1.5"/>',
 quran:'<path d="M12 30 24 22l12 8-12 8zM24 22V10M15 16c3-2 6-2 9 0 3-2 6-2 9 0M10 42l28-16M38 42 10 26"/>',
 beads:'<circle cx="24" cy="21" r="13" stroke-dasharray="0.1 6.8" stroke-width="5"/><path d="M24 34v6M20 44l4-4 4 4"/>',
 dua:'<path d="M12 40V20a12 12 0 0 1 24 0v20M8 40h32M24 32V18M19 23l5-5 5 5M17 34h14"/>',
 minbar:'<path d="M9 40h30M12 40v-6h8v-6h8v-6h8v18M28 22v-8h8v8M28 14l4-6 4 6M12 34V22l8 6"/>',
 scroll:'<path d="M14 10h22a4 4 0 0 1 0 8h-4v18a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-2h18v2a4 4 0 0 0 4 4M14 10a4 4 0 0 0-4 4v20M32 14a4 4 0 0 1 4-4M16 18h10M16 24h10"/>',
 rays:'<path d="M24 6v10M10 12l7 8M38 12l-7 8M6 25h10M42 25H32M14 40h20M24 22l3 6 6 1-4.500 4 1 6-5.500-3-5.500 3 1-6-4.500-4 6-1z"/>',
 compass:'<circle cx="24" cy="24" r="16"/><path d="m31 17-4.500 10L17 31l4.500-10zM24 8v3M24 37v3M8 24h3M37 24h3"/>',
 rain:'<path d="M15 27a7 7 0 0 1 0-14 10 10 0 0 1 19-1 7.500 7.500 0 0 1 0 15zM16 32l-2 5M25 32l-2 5M34 32l-2 5M21 40l-1 3M30 40l-1 3"/>',
 water:'<path d="M24 7c7 9 12 15 12 22a12 12 0 0 1-24 0c0-7 5-13 12-22zM18 30a6 6 0 0 0 5 6"/>',
 bowl:'<path d="M8 25h32c0 8-7 14-16 14S8 33 8 25zM17 42h14M18 18c-2-3 2-4 0-8M25 18c-2-3 2-4 0-8M32 18c-2-3 2-4 0-8"/>',
 fire:'<path d="M24 6c2 9 12 13 12 23a12 12 0 0 1-24 0c0-6 3-9 6-12 0 4 2 6 4 6 2-5 0-11 2-17zM24 41a5 5 0 0 1-5-5c0-3 3-5 5-8 2 3 5 5 5 8a5 5 0 0 1-5 5z"/>',
 waves:'<path d="M6 18c4-5 8-5 12 0s8 5 12 0 8-5 12 0M6 28c4-5 8-5 12 0s8 5 12 0 8-5 12 0M6 38c4-5 8-5 12 0s8 5 12 0 8-5 12 0"/>',
 star:'<path d="M24 6l5 8h9v9l6 7-6 5v7h-9l-5 6-5-6h-9v-7l-6-5 6-7v-9h9z"/><circle cx="24" cy="26" r="5"/>',
 lamp:'<path d="M24 6v5M17 18c0-4 3-7 7-7s7 3 7 7zM17 18l-3 14 6 7h8l6-7-3-14M20 43h8M24 39v4M24 23c3 3 3 7 0 8-3-1-3-5 0-8z"/>',
 heart:'<path d="M24 40S8 31 8 19a8.500 8.500 0 0 1 16-4 8.500 8.500 0 0 1 16 4c0 12-16 21-16 21z"/>',
 scale:'<path d="M24 9v31M15 40h18M10 15h28M10 15 5 28h10zM38 15l-5 13h10zM5 28a5 4 0 0 0 10 0M33 28a5 4 0 0 0 10 0"/>',
 garden:'<path d="M24 42V24M24 24c-8 0-12-5-12-11 7 0 12 3 12 11zM24 30c8 0 12-5 12-11-7 0-12 3-12 11zM8 42h32M14 42v-6M34 42v-6"/>',
 key:'<circle cx="16" cy="24" r="8"/><circle cx="16" cy="24" r="2.500"/><path d="M24 24h18M36 24v7M41 24v5"/>',
 shield:'<path d="M24 6 39 12v11c0 10-6 16-15 19-9-3-15-9-15-19V12zM17 24l5 5 10-10"/>',
 sun:'<circle cx="24" cy="24" r="8"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4.500 4.500M32.500 32.500 37 37M37 11l-4.500 4.500M15.500 32.500 11 37"/>',
 night:'<path d="M27 10a14 14 0 1 0 11 23 15 15 0 0 1-11-23zM35 9v6M32 12h6M40 21v4M38 23h4"/>',
 road:'<path d="M18 6 10 42M30 6l8 36M24 10v5M24 21v6M24 34v6"/>',
 coins:'<ellipse cx="19" cy="15" rx="10" ry="4"/><path d="M9 15v8c0 2 4.500 4 10 4s10-2 10-4v-8M9 23v8c0 2 4.500 4 10 4M19 31v6c0 2 4.500 4 10 4s10-2 10-4v-8c0-2-4.500-4-10-4s-10 2-10 4"/>',
 speech:'<path d="M8 11h32v22H23l-9 8v-8H8zM15 19h18M15 25h12"/>',
 mountain:'<path d="M4 40 18 16l8 13 5-7 13 18zM14 23l4 3 4-3"/><circle cx="36" cy="11" r="4"/>',
 sword:'<path d="M31 8h9v9L19 38l-9-9zM13 26l9 9M14 34l-6 6M11 40l-3-3"/>',
 gate:'<path d="M9 42V21C9 13 17 11 24 5c7 6 15 8 15 16v21M15 42V23c0-5 5-7 9-10 4 3 9 5 9 10v19M6 42h36"/>'
};
const RULES=[
 [/بارش|بادل/,'rain'],[/کھانے|غلوں|پھلوں|دودھ|گھی|گوشت|روزی/,'bowl'],[/پانی|دودھ/,'water'],[/دریا|سمندر/,'waves'],[/آگ|جہنم/,'fire'],
 [/روشنی|فرشت/,'rays'],[/جنت/,'garden'],[/مسجد/,'mosque'],[/اذان|نماز|جماعت|امام|صفوں|رکوع|سنتوں|تراویح|نوافل|خشوع|صلوٰۃ|صلوۃ/,'gate'],[/تہجد|رات|سونے|خواب|نیند/,'night'],
 [/قرآن|آیت|آیات|سورت/,'quran'],[/درود|ذکر|تسبیح|اذکار|استغفار|کلمہ/,'beads'],[/دعا|پناہ/,'dua'],[/علم|تعلیم|سکھانا|سیکھنا|فتویٰ|احادیث/,'book'],
 [/نصیحت/,'scroll'],[/بیان|خطبہ|خطبات|گفتگو|آواز/,'speech'],[/قیامت|آخرت|حساب|حشر|اعمال/,'scale'],[/تقدیر|توکل|وعدوں|یقین/,'key'],[/ایمان|اللہ تعالیٰ کی ذات/,'crescent'],
 [/دشمن|جنگ|غزو|تلوار|رعب/,'sword'],[/حفاظت|شکست|مدد|زہر/,'shield'],[/مال|کمائی|دنیا/,'coins'],[/سفر|ہجرت|راستہ/,'road'],[/صبح|شام|گرمی|سردی/,'sun'],[/بیمار|تکلیف|صدمہ|بھوک|بڑھاپے|شفاعت/,'heart'],
 [/حضرت|امیر المومنین/,'lamp']
];
const CH=['crescent','mosque','book','beads','dua','minbar','scroll','rays','compass'];
function icon(name,cls){return '<svg class="'+(cls||'ic')+'" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(P[name]||P.star)+'</svg>'}
function forTitle(t,ch){for(const [re,n] of RULES) if(re.test(t)) return n; return CH[ch-1]||'star'}
/* chapter scene: sky, arch and the chapter motif */
function scene(ch){
 const stars=[[18,16],[34,30],[132,18],[146,40],[112,10],[48,9]].map(([x,y],i)=>'<path d="M'+x+' '+(y-3)+'v6M'+(x-3)+' '+y+'h6" opacity="'+(i%2?'.45':'.8')+'"/>').join('');
 return '<svg class="scene" viewBox="0 0 160 96" aria-hidden="true"><rect width="160" height="96" fill="var(--scene)"/>'+
 '<g stroke="var(--gold-soft)" stroke-width="1" fill="none" stroke-linecap="round">'+stars+
 '<path d="M44 96V50C44 29 64 24 80 10c16 14 36 19 36 40v46" fill="var(--scene-in)" stroke-width="1.4"/>'+
 '<path d="M50 96V51C50 34 67 29 80 18c13 11 30 16 30 33v45" opacity=".5"/>'+
 '<path d="M0 86c20-12 30-3 44-8M116 78c14 6 28-6 44 4" opacity=".6"/></g>'+
 '<g transform="translate(56 35) scale(1)" fill="none" stroke="var(--gold-soft)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+P[CH[ch-1]]+'</g></svg>';
}
window.ART={icon,forTitle,scene,chapterIcon:ch=>CH[ch-1]};
})();
