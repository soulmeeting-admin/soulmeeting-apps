/* ============================================================
   DB — one data API for all four interfaces.
   Today: MOCK adapter (demo data, kept in memory + localStorage if available).
   Later: a Supabase adapter implements the exact same methods
   (see /supabase/schema.sql). UI code must ONLY talk to window.DB.
   All methods are async.
   ============================================================ */
(function(){
  const now = () => new Date();
  const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
  const at = (dayOffset, H, M=0) => { const d=addDays(now(),dayOffset); d.setHours(H,M,0,0); return d.toISOString(); };
  const uid = () => Math.random().toString(36).slice(2,10);
  const KEY='sm3_demo_v2';
  const CB = window.CONTENT_BODY || null;   // real content of the free course (shared/content-body.js)

  /* ---------- catalog: products = bundles of timed rights ---------- */
  // space: 'course:<id>' | 'protocol' (paid features) | 'community'
  // days: null = forever
  const PRODUCTS = [
    {id:'free_body',   name:'الكورس التأسيسي: إعادة التناغم مع الجسد', price:0,   currency:'USD', grants:[{space:'course:body',days:null}]},
    {id:'money_rec',   name:'إعادة التناغم مع المال (مسجّل)',           price:97,  currency:'USD', grants:[{space:'course:money',days:null},{space:'protocol',days:90},{space:'community',days:90}]},
    {id:'money_live',  name:'إعادة التناغم مع المال (دفعة live)',        price:147, currency:'USD', grants:[{space:'course:money',days:null},{space:'protocol',days:90},{space:'community',days:90}]},
    {id:'proto_q',     name:'اشتراك مساعد التناغم (ربع سنوي)',              price:29,  currency:'USD', grants:[{space:'protocol',days:90},{space:'community',days:90}]},
    {id:'proto_y',     name:'اشتراك مساعد التناغم (سنوي)',                  price:89,  currency:'USD', grants:[{space:'protocol',days:365},{space:'community',days:365}]},
    {id:'evenings',    name:'مكتبة الأمسيات',                            price:39,  currency:'USD', grants:[{space:'course:evenings',days:null}]}
  ];

  /* ---------- academy: «body» = REAL content; money + evenings still SAMPLE ---------- */
  const COURSES = [
    CB ? CB.course : {id:'body', title:'إعادة التناغم مع الجسد', tagline:'الكورس التأسيسي للمنهج', is_free:true, order:1, cover:'linear-gradient(135deg,#e7d3a6,#b08429)', lessons:[]},
    {id:'money', title:'إعادة التناغم مع المال', tagline:'البروتوكول الشهري خطوة بخطوة', is_free:false, order:2, cover:'linear-gradient(135deg,#f3d98c,#8a6417)', lessons:[
      {id:'m1', title:'تحديد النية المالية', minutes:20, video:'', exercise:'ex_money_intent', body:'رقم واضح، وسبب حقيقي وراه.'},
      {id:'m2', title:'جدول المعتقدات حول المال', minutes:25, video:'', exercise:'ex_beliefs', body:'منين جت أفكارك عن الفلوس؟'},
      {id:'m3', title:'تحديد وتحرير الطاقات غير المتناغمة', minutes:30, video:'', exercise:'ex_blockers', body:'المشاعر المعيقة وإمتى بتتحفّز.'},
      {id:'m4', title:'محاور الحياة الأربعة', minutes:15, video:'', exercise:'ex_axes', body:'العقل والمشاعر والجسد والروح.'},
      {id:'m5', title:'الأفعال الخمسة وترتيب الأولوية', minutes:24, video:'', exercise:null, body:'من الملف لخطة الشهر.'}
    ]},
    {id:'evenings', title:'مكتبة الأمسيات', tagline:'أمسيات لقاء الروح المسجّلة', is_free:false, order:3, cover:'linear-gradient(135deg,#d9c7a0,#6f6658)', lessons:[
      {id:'e1', title:'أمسية: الطفل الداخلي والفلوس', minutes:75, video:'', exercise:'ex_evening', body:''},
      {id:'e2', title:'أمسية: الأنماط اللي بتتكرر', minutes:68, video:'', exercise:'ex_evening', body:''}
    ]}
  ];

  /* ---------- protocol exercise templates: body = REAL (content-body.js), money/evenings = SAMPLE ---------- */
  // field types: text | textarea | number | scale (min,max) | chips (options, multi) | axes
  const EXERCISES = [
    ...(CB ? CB.EXERCISES : []),
    {id:'ex_money_intent', title:'النية المالية', source:'money', axis:'mind', fields:[
      {key:'amount', type:'number', label:'الرقم اللي نيتك تحصل عليه هذا الشهر'},
      {key:'why', type:'textarea', label:'ليه الرقم ده بالذات؟'}]},
    {id:'ex_beliefs', title:'جدول المعتقدات حول المال', source:'money', axis:'mind', fields:[
      {key:'belief', type:'text', label:'المعتقد'},
      {key:'origin', type:'chips', label:'منين جه؟', options:['الأسرة','المجتمع','تجربة شخصية','الدين أو الثقافة','مش عارف'], multi:false},
      {key:'charge', type:'scale', label:'قد إيه مصدّقه؟', min:0, max:10}]},
    {id:'ex_blockers', title:'المشاعر المعيقة', source:'money', axis:'heart', fields:[
      {key:'emotion', type:'chips', label:'المشاعر', options:['خوف','ذنب','خجل','غضب','قلق','استحقاق ناقص'], multi:true},
      {key:'trigger', type:'chips', label:'إمتى بتتحفّز؟', options:['وأنا بدفع','وأنا بطلب فلوس','لما أشوف رصيدي','لما حد يتكلم عن الفلوس'], multi:true},
      {key:'note', type:'textarea', label:'ملاحظة'}]},
    {id:'ex_axes', title:'محاور الحياة الأربعة', source:'money', axis:null, fields:[
      {key:'axes', type:'axes', label:'قيّم كل محور النهارده من 1 لـ 10'}]},
    {id:'ex_evening', title:'حصاد الأمسية', source:'evenings', axis:'spirit', fields:[
      {key:'insight', type:'textarea', label:'أهم حاجة وصلتلك'},
      {key:'action', type:'text', label:'فعل واحد هتعمله'}]}
  ];
  const AXES = [
    {id:'mind', name:'العقل', icon:'🧠'}, {id:'heart', name:'المشاعر', icon:'🌊'},
    {id:'body', name:'الجسد', icon:'💪'}, {id:'spirit', name:'الروح', icon:'🪶'}
  ];

  /* ---------- seed a believable demo state ---------- */
  function seed(){
    const me = {id:'u_me', email:'sara@example.com', name:'سارة', role:'member', created_at:at(-40,10)};
    const ents = [
      {id:uid(), user_id:me.id, space:'course:body', starts_at:at(-40,10), ends_at:null, source:'free_body'},
      {id:uid(), user_id:me.id, space:'course:money', starts_at:at(-23,12), ends_at:null, source:'money_rec'},
      {id:uid(), user_id:me.id, space:'protocol', starts_at:at(-23,12), ends_at:at(67,12), source:'money_rec'},
      {id:uid(), user_id:me.id, space:'community', starts_at:at(-23,12), ends_at:at(67,12), source:'money_rec'}
    ];
    const progress = ['b1','b2','b3','b4','b5','m1','m2'].map((l,i)=>({lesson_id:l, done_at:at(-34+i*4,21)}));
    const entries = [
      {id:uid(), exercise_id:'ex_mission', created_at:at(-34,22), data:{mission:'رسالتي أن أكون تجليًا لحقيقتي الإلهية على الأرض: أعلّم بهدوء، وأعيش بحرية', signal:'اختبار العضلات', yes_sign:'الحلقتين بيقفلوا جامد', no_sign:'بيفكّوا بسهولة'}},
      {id:uid(), exercise_id:'ex_hawkins', created_at:at(-34,21), data:{level:250, moment:'قبل الجلسة'}},
      {id:uid(), exercise_id:'ex_hawkins', created_at:at(-34,22), data:{level:400, moment:'بعد الجلسة'}},
      {id:uid(), exercise_id:'ex_question', created_at:at(-33,21), data:{step:'ما هي أفضل خطوة أخطوها (تتناغم مع رسالتي في الحياة ومع نسختي الأصلية) في التلات شهور الجاية لتعزيز حريتي في الشغل؟', period:'التلات شهور الجاية', options:[{option:'أفضل في وظيفتي وأبدأ أونلاين جنبها',answer:'آه'},{option:'أسيب الوظيفة دلوقتي',answer:'لأ'}]}},
      {id:uid(), exercise_id:'ex_birth', created_at:at(-30,20), data:{date:'1991-03-14', time:'06:40', place:'الإسكندرية، مصر'}},
      {id:uid(), exercise_id:'ex_star_chart', created_at:at(-30,21), data:{chart:{sun:{sign:'الحوت'},moon:{sign:'الثور'},mercury:{sign:'الدلو'},venus:{sign:'الحمل'},mars:{sign:'الجوزاء'},jupiter:{sign:'السرطان'},saturn:{sign:'الدلو'},uranus:{sign:'الجدي'},neptune:{sign:'الجدي'},pluto:{sign:'العقرب'}}}},
      {id:uid(), exercise_id:'ex_hawkins', created_at:at(-26,21), data:{level:310, moment:'يوم عادي'}},
      {id:uid(), exercise_id:'ex_design_room', created_at:at(-26,22), data:{body_message:'أمان، حركة، وفرح', meanings:{sun:{meaning:'طاقة حياتي بتيجي من التعاطف'},moon:{meaning:'إحساسي بيرتاح لما أكون في أمان'},venus:{meaning:'الحب عندي مبادرة وشجاعة'}}, free:'حسيت إن جسمي كان مستني حد يسمعه من زمان.'}},
      {id:uid(), exercise_id:'ex_star_sailing', created_at:at(-22,22), data:{sailing:{sun:{pct:65},moon:{pct:55,blockers:['الحكمة'],organs:['المعدة'],source:'عدة حيوات سابقة'},mercury:{pct:70},venus:{pct:60,blockers:['قبول النفس'],organs:['الكليتين'],source:'الحياة الحالية'},mars:{pct:40,blockers:['الأمان','الجذور'],organs:['العضلات'],source:'عدة حيوات سابقة'},jupiter:{pct:50,blockers:['الثقة بالذات'],organs:['الكبد'],source:'حياة سابقة'},saturn:{pct:65},uranus:{pct:45,blockers:['الحرية'],organs:['الفقرات العنقية'],source:'عدة حيوات سابقة'},neptune:{pct:75},pluto:{pct:60}}}},
      {id:uid(), exercise_id:'ex_hawkins', created_at:at(-18,21), data:{level:350, moment:'يوم عادي'}},
      {id:uid(), exercise_id:'ex_lives_count', created_at:at(-18,22), data:{human:17, nonhuman:3, now:5}},
      {id:uid(), exercise_id:'ex_past_lives', created_at:at(-17,22), data:{lives:[
        {era:'أطلانطس', years:'50,000 – 40,000 ق.م', in_civ:'في الحضارة نفسها', gender:'أنثى', free:'حر', death:'طبيعي', role:'ديني', awareness:500, religion:'لا شيء'},
        {era:'مصر القديمة', years:'3000 – 2000 ق.م', in_civ:'في الحضارة نفسها', place:'مصر', gender:'ذكر', free:'حر', family:'متجوز وعنده ولدين', death:'طبيعي', role:'سياسي', awareness:300},
        {era:'المايا', years:'400 – 500 م', in_civ:'في زمنها بس، في مكان تاني', place:'أمريكا الشمالية', gender:'ذكر', free:'عبد', death:'درامي', role:'لا', awareness:175}]}},
      {id:uid(), exercise_id:'ex_relations', created_at:at(-16,22), data:{people:[{name:'منى أحمد', life:'التانية', relation:'أخ/أخت', blocks:'موجود ومؤثر', done:'تم'},{name:'خالد سمير', life:'الأولى', relation:'معلم', blocks:'لأ، كانت علاقة نفع وتعلّم', done:'لسه'}]}},
      {id:uid(), exercise_id:'ex_hawkins', created_at:at(-6,21), data:{level:400, moment:'يوم عادي'}},
      {id:uid(), exercise_id:'ex_money_intent', created_at:at(-19,22), data:{amount:15000, why:'أسدد القسط وأبدأ أدّخر من غير إحساس بالذنب.'}},
      {id:uid(), exercise_id:'ex_beliefs', created_at:at(-15,21), data:{belief:'الفلوس بتيجي بالتعب بس', origin:'الأسرة', charge:8}},
      {id:uid(), exercise_id:'ex_axes', created_at:at(-2,9), data:{axes:{mind:7,heart:5,body:4,spirit:8}}}
    ];
    const achievements = [['a_intent',-34],['a_records',-34],['a_chart',-30],['a_design',-26],['a_sailing',-22],['a_lives',-18],['a_soul_forgive',-16]].map(([id,d])=>({id, at:at(d,22)}));
    // the 7-day sailing intention started 4 days ago
    const runId = uid();
    const runs = [{id:runId, program_id:'p_sailing', started_at:at(-4,12), times:['22:00']}];
    const progTasks = Array.from({length:7},(_,i)=>{ const d=i-4; return {id:uid(), run_id:runId, program_id:'p_sailing', title:'نية التنظيف الطاقي', axis:'spirit', due_at:at(d,22,0), minutes:5, done_at: d<0?at(d,22,5):null, note:'يوم '+(i+1)+' من 7'}; });
    const remOff = [];
    const planId = uid();
    const plans = [{id:planId, created_at:at(-2,10), source:'paste', summary:'خطة أسبوعين: استحقاق، جسد، وتفاوض'}];
    const T = (title, axis, d, H, M, minutes, done) => ({id:uid(), plan_id:planId, title, axis, due_at:at(d,H,M), minutes, done_at: done?at(d,H,M+minutes):null, note:''});
    const tasks = [
      ...progTasks,
      T('تأمل الأسانسير قبل الشغل','spirit',-6,7,30,15,true), T('مشي 20 دقيقة','body',-6,18,0,20,true),
      T('كتابة 3 إنجازات النهارده','mind',-5,22,0,10,true), T('مراجعة المصاريف من غير حكم','mind',-5,20,0,15,true),
      T('تأمل الأسانسير قبل الشغل','spirit',-4,7,30,15,true), T('تمرين EFT على الذنب','heart',-4,21,0,15,false),
      T('مشي 20 دقيقة','body',-3,18,0,20,true), T('كتابة 3 إنجازات النهارده','mind',-3,22,0,10,true), T('تأمل الأسانسير قبل الشغل','spirit',-3,7,30,15,true),
      T('تأمل الأسانسير قبل الشغل','spirit',-2,7,30,15,true), T('تمرين EFT على الذنب','heart',-2,21,0,15,true),
      T('مشي 20 دقيقة','body',-1,18,0,20,true), T('مراجعة المصاريف من غير حكم','mind',-1,20,0,15,true), T('كتابة 3 إنجازات النهارده','mind',-1,22,0,10,true),
      T('تأمل الأسانسير قبل الشغل','spirit',0,7,30,15,true), T('اكتب رقم سعرك الجديد بصوت عالي','mind',0,13,0,10,false),
      T('تمرين EFT على الذنب','heart',0,21,0,15,false), T('مشي 20 دقيقة','body',0,18,0,20,false),
      T('تأمل الأسانسير قبل الشغل','spirit',1,7,30,15,false), T('ابعت عرض السعر للعميل','mind',1,12,0,20,false), T('مشي 20 دقيقة','body',1,18,0,20,false),
      T('تمرين EFT على الذنب','heart',2,21,0,15,false), T('كتابة 3 إنجازات النهارده','mind',2,22,0,10,false)
    ];
    const badges = [{id:'first_entry',at:at(-30,21)},{id:'first_plan',at:at(-2,10)},{id:'day_done',at:at(-5,22)}];
    // ---- admin-side demo data ----
    const names = ['سارة','منى','أحمد','ريم','خالد','هبة','يوسف','نور','مريم','عمر','دينا','كريم','لينا','طارق'];
    const users = names.map((n,i)=>({id:i?('u'+i):'u_me', email:i?`${['mona','ahmed','reem','khaled','heba','youssef','nour','mariam','omar','dina','karim','lina','tarek'][i-1]}@example.com`:'sara@example.com', name:n, role:'member', created_at:at(-60+i*3,12), last_seen:at(-[0,1,9,2,0,12,3,1,0,15,2,4,8,0][i],20)}));
    users.push({id:'u_admin', email:'farouk@example.com', name:'محمد فاروق', role:'admin', created_at:at(-90,9), last_seen:at(0,9)});
    const allEnts = [...ents];
    users.slice(1,14).forEach((u,i)=>{
      allEnts.push({id:uid(), user_id:u.id, space:'course:body', starts_at:u.created_at, ends_at:null, source:'free_body'});
      if(i%3!==2){ const start=addDays(new Date(u.created_at),2).toISOString();
        allEnts.push({id:uid(), user_id:u.id, space:'course:money', starts_at:start, ends_at:null, source: i%4?'money_rec':'money_live'});
        const endOff = [67,40,12,-5,80,-20,3,55,30,-2,70,6,25][i];
        allEnts.push({id:uid(), user_id:u.id, space:'protocol', starts_at:start, ends_at:at(endOff,12), source:'money_rec'});
        allEnts.push({id:uid(), user_id:u.id, space:'community', starts_at:start, ends_at:at(endOff,12), source:'money_rec'}); }
    });
    const payments = allEnts.filter(e=>e.space.startsWith('course:money')).map(e=>({id:uid(), user_id:e.user_id, product_id:e.source, amount:e.source==='money_live'?147:97, currency:'USD', method:['EasyKash','InstaPay','EasyKash','تحويل بنكي'][Math.floor(Math.random()*4)], status:'approved', created_at:e.starts_at}));
    payments.push({id:uid(), user_id:'u5', product_id:'proto_q', amount:1450, currency:'EGP', method:'InstaPay', status:'pending', created_at:at(0,11), proof:'screenshot.jpg'});
    payments.push({id:uid(), user_id:'u9', product_id:'money_rec', amount:365, currency:'SAR', method:'تحويل بنكي', status:'pending', created_at:at(-1,19), proof:'screenshot.jpg'});
    const messages = [
      {id:uid(), kind:'reminder', title:'عندك مهام تناغم النهارده', body:'خمس دقايق دلوقتي تفرق في يومك.', audience:'protocol_active', schedule:'daily 09:00', active:true},
      {id:uid(), kind:'reminder', title:'تمرين النهارده مستنيك', body:'سجّل نتيجته وانت لسه فاكرها.', audience:'protocol_active', schedule:'daily 21:00', active:true},
      {id:uid(), kind:'expiry', title:'فترتك المجانية بتخلص بعد أسبوع', body:'لو حابب تكمّل، التجديد من صفحة اشتراكك.', audience:'expiring_7d', schedule:'auto', active:true},
      {id:uid(), kind:'broadcast', title:'أمسية جديدة يوم الخميس', body:'أمسية «الأنماط اللي بتتكرر» اتضافت للمكتبة.', audience:'all', schedule:at(-3,18), active:false, sent_at:at(-3,18), opened:61}
    ];
    return {me, ents:allEnts, progress, entries, plans, tasks, badges, achievements, runs, remOff, users, payments, messages,
            courses: JSON.parse(JSON.stringify(COURSES)), exercises: JSON.parse(JSON.stringify(EXERCISES)), products: JSON.parse(JSON.stringify(PRODUCTS))};
  }

  let S;
  try{ S = JSON.parse(localStorage.getItem(KEY)); }catch(e){}
  if(!S || !S.me) S = seed();
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} };

  /* ---------- access logic (same rules the server will enforce) ---------- */
  function accessFor(userId, space){
    const list = S.ents.filter(e=>e.user_id===userId && e.space===space);
    if(!list.length) return {has:false, active:false, readOnly:false, endsAt:null, daysLeft:null};
    const forever = list.some(e=>!e.ends_at);
    const end = forever ? null : list.map(e=>new Date(e.ends_at)).sort((a,b)=>b-a)[0];
    const active = forever || end > now();
    const daysLeft = end ? Math.ceil((end-now())/864e5) : null;
    return {has:true, active, readOnly: !active && space==='protocol', endsAt: end?end.toISOString():null, daysLeft};
  }
  const userEnts = id => S.ents.filter(e=>e.user_id===id);

  const DB = {
    mode:'mock',
    AXES,
    /* auth */
    async me(){ return S.me; },
    async signIn(email){ return {sent:true, email}; },           // magic link in real adapter
    async signOut(){ return true; },
    /* access */
    async access(space){ return accessFor(S.me.id, space); },
    async myEntitlements(){ return userEnts(S.me.id); },
    /* academy */
    async courses(){ return S.courses.slice().sort((a,b)=>a.order-b.order).map(c=>({...c, access:accessFor(S.me.id,'course:'+c.id)})); },
    async course(id){ const c=S.courses.find(c=>c.id===id); return c?{...c, access:accessFor(S.me.id,'course:'+c.id)}:null; },
    async progress(){ return S.progress.slice(); },
    async markLesson(lessonId, done=true){ S.progress=S.progress.filter(p=>p.lesson_id!==lessonId); if(done) S.progress.push({lesson_id:lessonId, done_at:now().toISOString()}); save(); return true; },
    /* protocol */
    async exercises(){ return S.exercises.slice(); },
    async entries(){ return S.entries.slice().sort((a,b)=>b.created_at.localeCompare(a.created_at)); },
    async addEntry(exercise_id, data){ const e={id:uid(), exercise_id, data, created_at:now().toISOString()}; S.entries.push(e); save(); return e; },
    async deleteEntry(id){ S.entries=S.entries.filter(e=>e.id!==id); save(); },
    async tasks(){ return S.tasks.slice().sort((a,b)=>a.due_at.localeCompare(b.due_at)); },
    async toggleTask(id){ const t=S.tasks.find(t=>t.id===id); if(!t) return null; t.done_at = t.done_at?null:now().toISOString(); save(); return t; },
    async updateTask(id, patch){ const t=S.tasks.find(t=>t.id===id); Object.assign(t,patch); save(); return t; },
    async deleteTask(id){ S.tasks=S.tasks.filter(t=>t.id!==id); save(); },
    async deleteMyData(){ S.entries=[]; S.tasks=[]; S.plans=[]; S.badges=[]; S.progress=[]; S.achievements=[]; S.runs=[]; save(); return true; },
    async productsFor(space){ return S.products.filter(p=>p.grants.some(g=>g.space===space)); },
    async plans(){ return S.plans.slice(); },
    async savePlan({summary, tasks, source='paste'}){ const p={id:uid(), created_at:now().toISOString(), summary, source}; S.plans.push(p);
      tasks.forEach(t=>S.tasks.push({id:uid(), plan_id:p.id, title:t.title, axis:t.axis||'mind', due_at:t.due_at, minutes:t.minutes||15, done_at:null, note:''})); save(); return p; },
    async badges(){ return S.badges.slice(); },
    async award(id){ if(!S.badges.some(b=>b.id===id)){ S.badges.push({id, at:now().toISOString()}); save(); return true;} return false; },
    /* curriculum: achievements, programs (fixed-duration practices), reminders */
    async curriculum(){ return CB ? {achievements:CB.ACHIEVEMENTS, programs:CB.PROGRAMS, reminders:CB.REMINDERS, lessons:CB.course.lessons, ref:CB.REF} : {achievements:[],programs:[],reminders:[],lessons:[],ref:{}}; },
    async myAchievements(){ return (S.achievements||[]).slice(); },
    async markAchievement(id, on=true){ S.achievements=S.achievements||[]; const has=S.achievements.some(a=>a.id===id);
      if(on&&!has) S.achievements.push({id, at:now().toISOString()}); if(!on&&has) S.achievements=S.achievements.filter(a=>a.id!==id); save(); return on&&!has; },
    /* award auto achievements whose condition is met; returns the ids newly earned */
    async evalAchievements(){ if(!CB) return []; S.achievements=S.achievements||[]; const got=[];
      const has=id=>S.achievements.some(a=>a.id===id);
      const done=new Set(S.progress.map(p=>p.lesson_id));
      CB.ACHIEVEMENTS.forEach(a=>{ if(has(a.id)||a.how==='manual') return; let ok=false;
        if(a.how==='course') ok=CB.course.lessons.every(l=>done.has(l.id));
        else if(a.how.entry) ok=S.entries.some(e=>e.exercise_id===a.how.entry);
        else if(a.how.rows){ const [ex,f,n]=a.how.rows; ok=S.entries.filter(e=>e.exercise_id===ex).some(e=>Array.isArray((e.data||{})[f]) && e.data[f].length>=n); }
        else if(a.how.program){ const run=(S.runs||[]).filter(r=>r.program_id===a.how.program).slice(-1)[0];
          if(run){ const ts=S.tasks.filter(t=>t.run_id===run.id&&!t.deleted); ok=ts.length>0 && ts.every(t=>t.done_at); } }
        if(ok){ S.achievements.push({id:a.id, at:now().toISOString()}); got.push(a.id); } });
      if(got.length) save(); return got; },
    async programRuns(){ return (S.runs||[]).slice(); },
    async startProgram(programId, {start, times}={}){ const pg=CB&&CB.PROGRAMS.find(p=>p.id===programId); if(!pg) return null;
      S.runs=S.runs||[]; const run={id:uid(), program_id:pg.id, started_at:now().toISOString(), times:times||pg.times}; S.runs.push(run);
      const d0=start?new Date(start+'T12:00:00'):now();
      for(let i=0;i<pg.days;i++){ (times||pg.times).forEach(tm=>{ const [H,M]=tm.split(':').map(Number); const d=addDays(d0,i); d.setHours(H,M,0,0);
        S.tasks.push({id:uid(), run_id:run.id, program_id:pg.id, title:pg.title, axis:pg.axis, due_at:d.toISOString(), minutes:pg.minutes, done_at:null, note:`يوم ${i+1} من ${pg.days}`}); }); }
      save(); return run; },
    async stopProgram(runId){ S.tasks=S.tasks.filter(t=>!(t.run_id===runId && !t.done_at && new Date(t.due_at)>now())); S.runs=(S.runs||[]).map(r=>r.id===runId?{...r,stopped_at:now().toISOString()}:r); save(); },
    /* reminders unlocked by finished lessons; member can switch optional ones off */
    async reminders(){ if(!CB) return []; const done=new Set(S.progress.map(p=>p.lesson_id)); const off=new Set(S.remOff||[]);
      const lc=S.entries.find(e=>e.exercise_id==='ex_lives_count'), pl=S.entries.find(e=>e.exercise_id==='ex_past_lives');
      const livesIncomplete=!lc || !pl || ((pl.data.lives||[]).length < (lc.data.now||lc.data.human||0));
      return CB.REMINDERS.filter(r=>done.has(r.lesson)).filter(r=>r.cond!=='lives_incomplete'||livesIncomplete).map(r=>({...r, on:!off.has(r.id)})); },
    async toggleReminder(id){ S.remOff=S.remOff||[]; const i=S.remOff.indexOf(id); if(i>-1) S.remOff.splice(i,1); else S.remOff.push(id); save(); return i>-1; },
    async icalUrl(){ return `https://api.soulmeeting.app/ical/${S.me.id}-k3x9q.ics`; },   // real: signed per-user token (edge function)
    /* admin */
    admin:{
      async users(){ return S.users.map(u=>({...u, ents:userEnts(u.id), protocol:accessFor(u.id,'protocol'), entries:u.id===S.me.id?S.entries.length:Math.floor((u.id.charCodeAt(1)||5)*1.7)%23})); },
      async products(){ return S.products.slice(); },
      async grant(email, productId){ let u=S.users.find(u=>u.email.toLowerCase()===email.toLowerCase());
        if(!u){ u={id:'u'+uid(), email, name:email.split('@')[0], role:'member', created_at:now().toISOString(), last_seen:null}; S.users.push(u); }
        const p=S.products.find(p=>p.id===productId);
        // one row per space: forever stays forever; timed rights stack on top of what's left
        p.grants.forEach(g=>{
          const ex=S.ents.find(e=>e.user_id===u.id && e.space===g.space);
          if(ex){ if(ex.ends_at===null) return; if(g.days===null){ ex.ends_at=null; ex.source=productId; return; }
            const base=new Date(ex.ends_at)>now()?new Date(ex.ends_at):now(); if(new Date(ex.ends_at)<=now()) ex.starts_at=now().toISOString();
            ex.ends_at=addDays(base,g.days).toISOString(); ex.source=productId; return; }
          S.ents.push({id:uid(), user_id:u.id, space:g.space, starts_at:now().toISOString(), ends_at:g.days?addDays(now(),g.days).toISOString():null, source:productId}); });
        save(); return u; },
      async revoke(entId){ S.ents=S.ents.filter(e=>e.id!==entId); save(); },
      async extend(entId, days){ const e=S.ents.find(e=>e.id===entId); if(!e || e.ends_at===null) return e; const base = new Date(e.ends_at)>now()? new Date(e.ends_at): now(); e.ends_at=addDays(base,days).toISOString(); save(); return e; },
      async payments(){ return S.payments.slice().sort((a,b)=>b.created_at.localeCompare(a.created_at)); },
      async approvePayment(id){ const p=S.payments.find(p=>p.id===id); p.status='approved'; const u=S.users.find(u=>u.id===p.user_id); await DB.admin.grant(u.email,p.product_id); save(); return p; },
      async rejectPayment(id){ const p=S.payments.find(p=>p.id===id); p.status='rejected'; save(); return p; },
      async courses(){ return S.courses.slice().sort((a,b)=>a.order-b.order); },
      async saveCourse(c){ const i=S.courses.findIndex(x=>x.id===c.id); let out; if(i>-1){ S.courses[i]={...S.courses[i],...c}; out=S.courses[i]; } else { out={lessons:[], order:S.courses.length+1, ...c, id:c.id||uid()}; S.courses.push(out); } save(); return out; },
      async deleteCourse(id){ S.courses=S.courses.filter(c=>c.id!==id); save(); },
      async saveLesson(courseId, l){ const c=S.courses.find(c=>c.id===courseId); const i=c.lessons.findIndex(x=>x.id===l.id); if(i>-1) c.lessons[i]={...c.lessons[i],...l}; else c.lessons.push({...l, id:l.id||uid()}); save(); },
      async moveLesson(courseId, lessonId, dir){ const c=S.courses.find(c=>c.id===courseId); const i=c.lessons.findIndex(l=>l.id===lessonId), j=i+dir; if(j<0||j>=c.lessons.length) return; [c.lessons[i],c.lessons[j]]=[c.lessons[j],c.lessons[i]]; save(); },
      async deleteLesson(courseId, lessonId){ const c=S.courses.find(c=>c.id===courseId); c.lessons=c.lessons.filter(l=>l.id!==lessonId); save(); },
      async exercises(){ return S.exercises.slice(); },
      async saveExercise(x){ const i=S.exercises.findIndex(e=>e.id===x.id); if(i>-1) S.exercises[i]=x; else S.exercises.push({...x, id:x.id||('ex_'+uid())}); save(); },
      async messages(){ return S.messages.slice(); },
      async saveMessage(m){ const i=S.messages.findIndex(x=>x.id===m.id); if(i>-1) S.messages[i]={...S.messages[i],...m}; else S.messages.push({...m, id:uid()}); save(); },
      async metrics(){ const users=S.users.filter(u=>u.role!=='admin');
        const active=users.filter(u=>accessFor(u.id,'protocol').active).length;
        const expiring=users.filter(u=>{const a=accessFor(u.id,'protocol'); return a.active && a.daysLeft!==null && a.daysLeft<=7;}).length;
        const readOnly=users.filter(u=>accessFor(u.id,'protocol').readOnly).length;
        return {members:users.length, protocolActive:active, expiring7:expiring, readOnly, pendingPayments:S.payments.filter(p=>p.status==='pending').length,
          weeklyActive:[31,38,35,44,47,52,58], weeklyLabels:['أ7','أ6','أ5','أ4','أ3','أ2','الأسبوع'],
          lessonCompletion:{body:.78, money:.54, evenings:.21}, entriesThisWeek:126, tasksDoneRate:.68}; }
    },
    /* demo only */
    resetDemo(){ try{localStorage.removeItem(KEY);}catch(e){} S=seed(); save(); location.reload(); },
    setDemoUser(kind){ // 'paid' | 'free' | 'expired' — lets Ashraf see every state
      S.ents = S.ents.filter(e=>e.user_id!==S.me.id);
      const add=(space,ends)=>S.ents.push({id:uid(), user_id:S.me.id, space, starts_at:at(-23,12), ends_at:ends, source:'demo'});
      add('course:body',null);
      if(kind!=='free'){ add('course:money',null); add('protocol', kind==='expired'?at(-3,12):at(67,12)); add('community', kind==='expired'?at(-3,12):at(67,12)); }
      save(); location.reload(); }
  };
  window.DB = DB;
})();
