/* ============================================================
   Soul Meeting kit — UI helpers + gamification engine
   Plain JS, no build step. Exposes window.Kit
   ============================================================ */
(function(){
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];
  const h = (strings, ...vals) => strings.reduce((a,s,i)=>{ let v=i<vals.length?vals[i]:''; if(Array.isArray(v)) v=v.join(''); return a+s+(v??''); },'');
  const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ---------- dates (Arabic words, Latin digits) ---------- */
  const DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const DAYS_SHORT = ['ح','ن','ث','ر','خ','ج','س'];
  const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const pad = n => String(n).padStart(2,'0');
  const fmtDate = d => { d=new Date(d); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const fmtShort = d => { d=new Date(d); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const fmtTime = d => { d=new Date(d); let H=d.getHours(), m=pad(d.getMinutes()); const ap=H<12?'ص':'م'; H=H%12||12; return `${H}:${m} ${ap}`; };
  const dayKey = d => { d=new Date(d); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
  const daysBetween = (a,b) => Math.round((new Date(dayKey(b)) - new Date(dayKey(a)))/864e5);
  const greeting = () => { const H=new Date().getHours(); return H<12?'صباح الخير':H<17?'نهارك سعيد':'مساء الخير'; };

  /* ---------- toast / modal / sheet ---------- */
  function toast(msg, ms=2600){
    let t=$('#kitToast'); if(!t){t=document.createElement('div');t.id='kitToast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t);}
    t.textContent=msg; t.classList.add('on'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('on'),ms);
  }
  function scrim(){ let s=$('#kitScrim'); if(!s){s=document.createElement('div');s.id='kitScrim';s.className='scrim';document.body.appendChild(s);s.addEventListener('click',closeAll);} return s; }
  function closeAll(){ $$('.modal.on,.sheet.on').forEach(m=>m.classList.remove('on')); scrim().classList.remove('on'); }
  function modal(html){
    let m=$('#kitModal'); if(!m){m=document.createElement('div');m.id='kitModal';m.className='modal';m.setAttribute('role','dialog');document.body.appendChild(m);}
    m.innerHTML=html; scrim().classList.add('on'); requestAnimationFrame(()=>m.classList.add('on'));
    $$('[data-close]',m).forEach(b=>b.addEventListener('click',closeAll)); return m;
  }
  function sheet(html){
    let m=$('#kitSheet'); if(!m){m=document.createElement('div');m.id='kitSheet';m.className='sheet';m.setAttribute('role','dialog');document.body.appendChild(m);}
    m.innerHTML='<div class="grab"></div>'+html; scrim().classList.add('on'); requestAnimationFrame(()=>m.classList.add('on'));
    $$('[data-close]',m).forEach(b=>b.addEventListener('click',closeAll)); return m;
  }
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeAll(); });

  /* ---------- confetti + celebrate ---------- */
  function confetti(n=70){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const w=document.createElement('div'); w.className='confetti-wrap'; document.body.appendChild(w);
    const cols=['#b08429','#e6bc63','#f0e2c2','#3f7d55','#8a6417','#fff4dc'];
    for(let i=0;i<n;i++){ const p=document.createElement('i'); p.style.left=Math.random()*100+'%'; p.style.background=cols[i%cols.length];
      p.style.animationDuration=(1.6+Math.random()*1.6)+'s'; p.style.animationDelay=(Math.random()*.4)+'s'; p.style.transform=`rotate(${Math.random()*360}deg)`; w.appendChild(p); }
    setTimeout(()=>w.remove(),3600);
  }
  function celebrate({icon='🎉', title, body, cta='يلا نكمّل', onCta}={}){
    confetti();
    const m=modal(h`<div class="big pop">${icon}</div><h3>${esc(title)}</h3><p>${esc(body)}</p><button class="btn block" data-cta>${esc(cta)}</button>`);
    $('[data-cta]',m).addEventListener('click',()=>{closeAll(); onCta&&onCta();});
  }

  /* ---------- progress ring (svg) ---------- */
  function ring(pct, {size=64, stroke=6, color='var(--gold)', track='var(--line)', label, coin=false}={}){
    const r=(size-stroke)/2, c=2*Math.PI*r, off=c*(1-Math.max(0,Math.min(1,pct)));
    return h`<span class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" aria-hidden="true">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .8s var(--spring)"/></svg>
      ${coin?'<span class="coin"></span>':`<span class="v num">${label??Math.round(pct*100)+'%'}</span>`}</span>`;
  }
  /* double ring like the old app: outer green, inner gold */
  function doubleRing(outer, inner, size=86, label){
    // outer green = today, inner gold = week; centre shows today's % (no logo inside widgets)
    return h`<span style="position:relative;display:inline-block;width:${size}px;height:${size}px">
      <span style="position:absolute;inset:0">${ring(outer,{size,stroke:6,color:'var(--ok)',label:''})}</span>
      <span style="position:absolute;inset:10px">${ring(inner,{size:size-20,stroke:6,color:'var(--gold)',label: label ?? `<span style="color:var(--ok);font-size:${Math.round(size/5.5)}px">${Math.round(outer*100)}%</span>`})}</span></span>`;
  }

  /* ---------- tiny charts (inline svg, theme tokens) ---------- */
  function barChart(values, labels, {height=120, max}={}){
    const W=300, H=height, pad=18, n=values.length, mx=max||Math.max(1,...values), bw=(W-pad*2)/n*0.62, gap=(W-pad*2)/n;
    const bars=values.map((v,i)=>{ const bh=(H-34)*(v/mx); const x=W-pad-gap*(i+1)+(gap-bw)/2; const y=H-20-bh;
      return h`<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(2,bh)}" rx="5" fill="${i===n-1?'var(--gold-deep)':'var(--gold)'}" opacity="${i===n-1?1:.75}"/>
      <text x="${x+bw/2}" y="${H-5}" font-size="10" text-anchor="middle" fill="var(--ink-faint)">${esc(labels[i])}</text>
      ${v?`<text x="${x+bw/2}" y="${y-4}" font-size="10" text-anchor="middle" fill="var(--ink-soft)" font-weight="700">${v}</text>`:''}`; }).join('');
    return h`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="رسم بياني">${`<line x1="${pad}" x2="${W-pad}" y1="${H-20}" y2="${H-20}" stroke="var(--line)"/>`}${bars}</svg>`;
  }
  /* 4-axis radar (mind/heart/body/spirit), values 0..1 */
  function radar(vals, labels, size=220){
    const c=size/2, R=c-56, ang=i=>-Math.PI/2+i*(2*Math.PI/vals.length);
    const pt=(i,k)=>[c+Math.cos(ang(i))*R*k, c+Math.sin(ang(i))*R*k];
    const grid=[.25,.5,.75,1].map(k=>`<polygon points="${vals.map((_,i)=>pt(i,k).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`).join('');
    const poly=`<polygon points="${vals.map((v,i)=>pt(i,Math.max(.04,v)).join(',')).join(' ')}" fill="rgba(176,132,41,.22)" stroke="var(--gold)" stroke-width="2"/>`;
    const lab=labels.map((l,i)=>{const [x,y]=pt(i,1.22);return `<text x="${x}" y="${y}" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="var(--ink-soft)" font-weight="700">${esc(l)}</text>`;}).join('');
    return `<svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:${size}px" role="img" aria-label="محاور الحياة">${grid}${poly}${lab}</svg>`;
  }

  /* ---------- gamification engine ---------- */
  const VOICE = {
    // Arabic فصحى بيضاء with a light Egyptian touch (rule from v32). Never shaming, never pushy.
    dayDone: [
      {title:'برافو عليك!', body:'خلّصت مهام النهارده كلها. التزامك ده هو اللي بيعمل الفرق.'},
      {title:'يوم متناغم ✦', body:'كل مهمة خلّصتها النهارده خطوة حقيقية ناحية النية.'},
      {title:'قدّ كلمتك', body:'وعدت نفسك وقدرت. خد لحظة واحتفل بده.'}
    ],
    taskDone: ['تمام ✓','خطوة كمان ✦','حلو جدًا','كمّل كده','واحدة كمان واتقفل اليوم'],
    entrySaved: ['اتسجلت في ملفك ✓','ملفك بيكبر ✦','كل تمرين بيوضّح الصورة أكتر'],
    lessonDone: {title:'درس جديد في رصيدك', body:'خلّصت الدرس. التمرين بتاعه مستنيك في مساعد التناغم.'},
    courseDone: {title:'خلّصت الكورس كله!', body:'رحلة كاملة. نتايج تمارينها كلها محفوظة في ملفك.'},
    comeback: {title:'أهلًا بيك تاني', body:'المهم إنك رجعت. نبدأ من النهارده، خطوة صغيرة.'},
    reminderTasks: n => ({title:`عندك ${n} ${n===1?'مهمة تناغم':n===2?'مهمتين تناغم':'مهام تناغم'} النهارده`, body:'خمس دقايق دلوقتي تفرق في يومك.'}),
    reminderEntry: {title:'تمرين النهارده مستنيك', body:'سجّل نتيجته وانت لسه فاكرها.'},
    streak: n => n>=30?`${n} يوم متواصل! ده التزام نادر`: n>=7?`${n} أيام متواصلة ✦`: `${n} ${n===1?'يوم':'أيام'} متواصلة`
  };
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  const BADGES = [
    {id:'first_entry', icon:'✍️', name:'أول تمرين', hint:'سجّل نتيجة أول تمرين'},
    {id:'first_plan', icon:'🧭', name:'أول خطة', hint:'حوّل ملفك لخطة عمل'},
    {id:'day_done', icon:'🌟', name:'يوم كامل', hint:'خلّص كل مهام يوم'},
    {id:'streak_7', icon:'🔥', name:'7 أيام', hint:'7 أيام متواصلة'},
    {id:'streak_30', icon:'👑', name:'شهر كامل', hint:'30 يوم متواصلين'},
    {id:'course_done', icon:'🎓', name:'خريج', hint:'خلّص كورس كامل'},
    {id:'axes_all', icon:'🪶', name:'التوازن', hint:'مهام في المحاور الأربعة في أسبوع'},
    {id:'entries_20', icon:'📚', name:'ملف غني', hint:'20 تمرين في ملفك'}
  ];

  /* streak from a list of day keys that had ≥1 completed task or entry */
  function streakFrom(dayKeys){
    const set=new Set(dayKeys); let n=0; const d=new Date();
    if(!set.has(dayKey(d))) d.setDate(d.getDate()-1); // today not done yet doesn't break it
    while(set.has(dayKey(d))){ n++; d.setDate(d.getDate()-1); }
    return n;
  }

  /* ---------- tiny hash router ---------- */
  function router(routes, el, fallback){
    const go=()=>{ const [path,...rest]=(location.hash.slice(1)||fallback).split('/'); const fn=routes[path]||routes[fallback]; el.innerHTML=''; fn(el,rest); window.scrollTo(0,0);
      $$('[data-nav]').forEach(b=>b.classList.toggle('on', b.dataset.nav===path)); };
    addEventListener('hashchange',go); go(); return go;
  }

  /* ---------- calendar helpers (no Google OAuth) ---------- */
  function googleCalLink({title, start, minutes=30, details=''}){
    const s=new Date(start), e=new Date(s.getTime()+minutes*6e4);
    const f=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${f(s)}/${f(e)}&details=${encodeURIComponent(details)}`;
  }

  /* ---------- icons (stroke svgs) ---------- */
  const I = {
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/></svg>',
    file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
    tasks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
    spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/></svg>',
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>',
    users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.5a3.5 3.5 0 010 7M18 20a6.5 6.5 0 00-2.5-5.1"/></svg>',
    cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
    bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/></svg>',
    gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
    chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>',
    upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>',
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/></svg>'
  };

  /* copy with graceful fallback */
  async function copyText(text){
    try{ await navigator.clipboard.writeText(text); toast('اتنسخ ✓'); return true; }
    catch(e){ const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy'); toast('اتنسخ ✓');}catch(_){toast('حدد النص وانسخه يدويًا');} ta.remove(); return false; }
  }

  window.Kit = { $, $$, h, esc, DAYS, DAYS_SHORT, MONTHS, fmtDate, fmtShort, fmtTime, dayKey, daysBetween, greeting,
    toast, modal, sheet, closeAll, confetti, celebrate, ring, doubleRing, barChart, radar,
    VOICE, pick, BADGES, streakFrom, router, googleCalLink, I, copyText };
})();
