/* ============================================================
   DB — Supabase adapter. Same methods as the mock in data.js.
   Loaded after data.js + config.js + supabase-js. Replaces window.DB
   unless SM_CONFIG.useDemo is true.
   Every method waits for a signed-in session: without one, a small
   magic-link sign-in screen is shown and the call stays pending until
   the member comes back from the email link (page reloads signed in).
   ============================================================ */
(function(){
  const CFG = window.SM_CONFIG || {};
  if (CFG.useDemo || !window.supabase || !CFG.supabaseUrl) return;   // keep the mock
  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {auth:{persistSession:true, detectSessionInUrl:true, flowType:'implicit'}});
  const MOCK = window.DB;
  const now = () => new Date();
  const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
  const isAdminPage = /admin\.html$/.test(location.pathname);
  const ok = r => { if (r.error) { console.error(r.error); throw r.error; } return r.data; };

  /* ---------- sign-in gate ---------- */
  let profile = null, readyP = null;
  function gateHtml(state, email=''){
    const css = `position:fixed;inset:0;z-index:9999;background:var(--bg,#f7f2e8);display:grid;place-items:center;padding:16px;font-family:inherit`;
    const card = `background:var(--surface,#fffdf8);border:1px solid var(--line,#e5dbc8);border-radius:18px;padding:24px 20px;max-width:380px;width:100%;text-align:center;box-shadow:0 18px 40px -24px rgba(70,52,20,.4)`;
    const body = state==='sent'
      ? `<div style="font-size:40px">📩</div><h2 style="margin:8px 0 6px;font-size:20px">بعتنالك رابط الدخول</h2><p style="color:var(--ink-soft,#645b4d);margin:0 0 14px">افتح الإيميل اللي وصل على <b dir="ltr">${email.replace(/</g,'')}</b> ودوس على الرابط. هيرجعك هنا وانت داخل.</p><button class="btn ghost block" id="smAgain">إيميل تاني</button>`
      : state==='noadmin'
      ? `<div style="font-size:40px">🔒</div><h2 style="margin:8px 0 6px;font-size:20px">اللوحة دي للإدارة بس</h2><p style="color:var(--ink-soft,#645b4d);margin:0 0 14px">الحساب ده مش عليه صلاحية إدارة.</p><button class="btn ghost block" id="smOut">دخول بحساب تاني</button>`
      : `<img src="${location.pathname.includes('/academy/')||location.pathname.includes('/protocol/')?'../':''}shared/assets/coin-96.png" alt="" width="64" height="64" style="border-radius:50%"><h2 style="margin:10px 0 6px;font-size:20px">أهلًا بيك في لقاء الروح</h2><p style="color:var(--ink-soft,#645b4d);margin:0 0 14px">اكتب إيميلك، وهنبعتلك رابط تدخل بيه من غير باسورد.</p>
         <input class="input" id="smEmail" type="email" dir="ltr" autocomplete="email" placeholder="name@example.com" style="max-width:none;text-align:left;margin-bottom:10px">
         <button class="btn block" id="smSend" style="min-height:48px">ابعت الرابط</button><p id="smErr" style="color:#a3321f;font-size:13px;margin:8px 0 0"></p>`;
    return `<div id="smGate" style="${css}"><div style="${card}">${body}</div></div>`;
  }
  function showGate(state, email){
    let g=document.getElementById('smGate'); if(g) g.remove();
    document.body.insertAdjacentHTML('beforeend', gateHtml(state,email));
    const send=document.getElementById('smSend');
    if(send){ const inp=document.getElementById('smEmail'); inp.focus();
      const go=async()=>{ const e=inp.value.trim(); if(!/^\S+@\S+\.\S+$/.test(e)){ document.getElementById('smErr').textContent='اكتب إيميل صحيح'; return; }
        send.disabled=true; const r=await sb.auth.signInWithOtp({email:e, options:{emailRedirectTo: location.origin+location.pathname}});
        if(r.error){ send.disabled=false; document.getElementById('smErr').textContent= /rate/i.test(r.error.message)?'اتبعت روابط كتير. استنى شوية وجرّب تاني.':'حصلت مشكلة، جرّب تاني'; return; }
        showGate('sent',e); };
      send.onclick=go; inp.onkeydown=ev=>{ if(ev.key==='Enter') go(); }; }
    const again=document.getElementById('smAgain'); if(again) again.onclick=()=>showGate('in');
    const out=document.getElementById('smOut'); if(out) out.onclick=async()=>{ await sb.auth.signOut(); showGate('in'); };
  }
  function ready(){
    if(readyP) return readyP;
    readyP = new Promise(async resolve=>{
      const finish = async session => {
        profile = ok(await sb.from('profiles').select('id,email,name,role').eq('id',session.user.id).single());
        if(isAdminPage && profile.role!=='admin'){ showGate('noadmin'); return; }
        const g=document.getElementById('smGate'); if(g) g.remove();
        sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',profile.id).then(()=>{});
        resolve(profile);
      };
      const {data:{session}} = await sb.auth.getSession();
      if(session) return finish(session);
      showGate('in');
      sb.auth.onAuthStateChange((ev,s)=>{ if(s && ev==='SIGNED_IN') finish(s); });
    });
    return readyP;
  }
  const uid = async () => (await ready()).id;

  /* ---------- helpers ---------- */
  let entsCache=null;
  async function myEnts(){ if(entsCache) return entsCache; const id=await uid(); entsCache=ok(await sb.from('entitlements').select('*').eq('user_id',id)); return entsCache; }
  function accessFrom(list, space){
    list=list.filter(e=>e.space===space);
    if(!list.length) return {has:false, active:false, readOnly:false, endsAt:null, daysLeft:null};
    const forever=list.some(e=>!e.ends_at); const end=forever?null:new Date(list.map(e=>e.ends_at).sort().slice(-1)[0]);
    const active=forever||end>now(); const daysLeft=end?Math.ceil((end-now())/864e5):null;
    return {has:true, active, readOnly:!active&&space==='protocol', endsAt:end?end.toISOString():null, daysLeft};
  }
  const mapLesson = l => ({id:l.id, no:l.no, title:l.title, minutes:l.minutes, video:l.video_url||'', body:l.body||'', material:l.material_url, material2:l.material2_url, exercises:l.exercise_ids&&l.exercise_ids.length?l.exercise_ids:(l.course_id==='body'?[]:undefined), exercise:l.exercise_id});
  let courseCache=null;
  async function loadCourses(){
    if(courseCache) return courseCache; await ready();
    const [cs,ls]=await Promise.all([sb.from('courses').select('*').order('sort'), sb.from('lessons').select('*').order('sort')]);
    const lessons=ok(ls); courseCache=ok(cs).map(c=>({id:c.id, title:c.title, tagline:c.tagline, is_free:c.is_free, cover:c.cover, order:c.sort, published:c.published, lessons:lessons.filter(l=>l.course_id===c.id).map(mapLesson)}));
    return courseCache;
  }
  let exCache=null;
  async function loadExercises(){ if(exCache) return exCache; await ready(); exCache=ok(await sb.from('exercises').select('*').order('sort')).map(x=>({id:x.id,title:x.title,source:x.source_course,axis:x.axis,fields:x.fields,lesson:x.lesson_id,note:x.note})); return exCache; }
  let curCache=null;
  async function loadCurriculum(){
    if(curCache) return curCache; await ready();
    const [a,p,r]=await Promise.all([sb.from('achievements').select('*').order('sort'),sb.from('programs').select('*'),sb.from('reminders').select('*').order('sort')]);
    const body=(await loadCourses()).find(c=>c.id==='body');
    curCache={ achievements:ok(a).map(x=>({id:x.id,lesson:x.lesson_id,icon:x.icon,title:x.title,how:x.how})),
      programs:ok(p).map(x=>({id:x.id,lesson:x.lesson_id,title:x.title,days:x.days,times:x.times,minutes:x.minutes,axis:x.axis,text:x.body,how:x.how,usesEntry:x.uses_exercise})),
      reminders:ok(r).map(x=>({id:x.id,lesson:x.lesson_id,text:x.text,sub:x.sub,cond:x.cond,optional:x.optional})),
      lessons:body?body.lessons:[], ref:(window.CONTENT_BODY||{}).REF||{} };
    return curCache;
  }
  const mapTask = t => ({...t});

  const DB = {
    mode:'supabase', AXES:MOCK.AXES, client:sb,
    async me(){ return await ready(); },
    async signIn(email){ const r=await sb.auth.signInWithOtp({email, options:{emailRedirectTo:location.origin+location.pathname}}); if(r.error) throw r.error; return {sent:true,email}; },
    async signOut(){ await sb.auth.signOut(); location.reload(); return true; },
    async access(space){ return accessFrom(await myEnts(), space); },
    async myEntitlements(){ return (await myEnts()).slice(); },
    /* academy */
    async courses(){ const ents=await myEnts(); return (await loadCourses()).filter(c=>c.published||profile.role==='admin').map(c=>({...c, access:accessFrom(ents,'course:'+c.id)})); },
    async course(id){ const c=(await DB.courses()).find(c=>c.id===id); return c||null; },
    async progress(){ const id=await uid(); return ok(await sb.from('lesson_progress').select('lesson_id,done_at').eq('user_id',id)); },
    async markLesson(lessonId, done=true){ const id=await uid();
      if(done) ok(await sb.from('lesson_progress').upsert({user_id:id, lesson_id:lessonId, done_at:new Date().toISOString()}));
      else ok(await sb.from('lesson_progress').delete().eq('user_id',id).eq('lesson_id',lessonId)); return true; },
    /* protocol */
    async exercises(){ return (await loadExercises()).slice(); },
    async entries(){ const id=await uid(); return ok(await sb.from('entries').select('id,exercise_id,data,created_at').eq('user_id',id).order('created_at',{ascending:false})); },
    async addEntry(exercise_id, data){ const id=await uid(); return ok(await sb.from('entries').insert({user_id:id, exercise_id, data}).select().single()); },
    async deleteEntry(eid){ ok(await sb.from('entries').delete().eq('id',eid)); },
    async tasks(){ const id=await uid(); return ok(await sb.from('tasks').select('*').eq('user_id',id).order('due_at')).map(mapTask); },
    async toggleTask(tid){ const t=ok(await sb.from('tasks').select('done_at').eq('id',tid).single()); return ok(await sb.from('tasks').update({done_at:t.done_at?null:new Date().toISOString()}).eq('id',tid).select().single()); },
    async updateTask(tid, patch){ if(patch.deleted){ ok(await sb.from('tasks').delete().eq('id',tid)); return null; } const p={...patch}; delete p.deleted; return ok(await sb.from('tasks').update(p).eq('id',tid).select().single()); },
    async deleteTask(tid){ ok(await sb.from('tasks').delete().eq('id',tid)); },
    async deleteMyData(){ const id=await uid(); for(const t of ['entries','tasks','plans','user_badges','lesson_progress','user_achievements','program_runs','user_reminder_off']) ok(await sb.from(t).delete().eq('user_id',id)); return true; },
    async productsFor(space){ const ps=ok(await sb.from('products').select('*').eq('active',true)); return ps.filter(p=>p.grants.some(g=>g.space===space)); },
    async plans(){ const id=await uid(); return ok(await sb.from('plans').select('*').eq('user_id',id).order('created_at')); },
    async savePlan({summary, tasks, source='paste'}){ const id=await uid(); const p=ok(await sb.from('plans').insert({user_id:id, summary, source}).select().single());
      ok(await sb.from('tasks').insert(tasks.map(t=>({user_id:id, plan_id:p.id, title:t.title, axis:t.axis||'mind', due_at:t.due_at, minutes:t.minutes||15})))); return p; },
    async badges(){ const id=await uid(); return ok(await sb.from('user_badges').select('badge,at').eq('user_id',id)).map(b=>({id:b.badge, at:b.at})); },
    async award(badge){ const id=await uid(); const r=await sb.from('user_badges').insert({user_id:id, badge}); return !r.error; },
    async icalUrl(){ const p=ok(await sb.from('profiles').select('ical_token').eq('id',await uid()).single()); return `${CFG.supabaseUrl}/functions/v1/ical/${p.ical_token}.ics`; },
    /* curriculum */
    async curriculum(){ return await loadCurriculum(); },
    async myAchievements(){ const id=await uid(); return ok(await sb.from('user_achievements').select('achievement_id,at').eq('user_id',id).order('at')).map(a=>({id:a.achievement_id, at:a.at})); },
    async markAchievement(aid, on=true){ const id=await uid();
      if(on){ const r=await sb.from('user_achievements').insert({user_id:id, achievement_id:aid}); return !r.error; }
      ok(await sb.from('user_achievements').delete().eq('user_id',id).eq('achievement_id',aid)); return false; },
    async evalAchievements(){
      const [cur,mine,entries,prog,runs,tasks]=await Promise.all([loadCurriculum(),DB.myAchievements(),DB.entries(),DB.progress(),DB.programRuns(),DB.tasks()]);
      const has=new Set(mine.map(a=>a.id)), done=new Set(prog.map(p=>p.lesson_id)), got=[];
      cur.achievements.forEach(a=>{ if(has.has(a.id)||a.how==='manual') return; let okk=false; const h=a.how;
        if(h==='course') okk=cur.lessons.length>0 && cur.lessons.every(l=>done.has(l.id));
        else if(h.entry) okk=entries.some(e=>e.exercise_id===h.entry);
        else if(h.rows){ const [ex,f,n]=h.rows; okk=entries.filter(e=>e.exercise_id===ex).some(e=>Array.isArray((e.data||{})[f])&&e.data[f].length>=n); }
        else if(h.program){ const run=runs.filter(r=>r.program_id===h.program).slice(-1)[0]; if(run){ const ts=tasks.filter(t=>t.run_id===run.id); okk=ts.length>0&&ts.every(t=>t.done_at); } }
        if(okk) got.push(a.id); });
      for(const g of got) await DB.markAchievement(g,true);
      return got; },
    async programRuns(){ const id=await uid(); return ok(await sb.from('program_runs').select('*').eq('user_id',id).order('started_at')); },
    async startProgram(programId, {start, times}={}){ const id=await uid(); const pg=(await loadCurriculum()).programs.find(p=>p.id===programId); if(!pg) return null;
      const tms=times||pg.times; const run=ok(await sb.from('program_runs').insert({user_id:id, program_id:pg.id, times:tms}).select().single());
      const d0=start?new Date(start+'T12:00:00'):now(); const rows=[];
      for(let i=0;i<pg.days;i++) tms.forEach(tm=>{ const [H,M]=tm.split(':').map(Number); const d=addDays(d0,i); d.setHours(H,M,0,0);
        rows.push({user_id:id, run_id:run.id, program_id:pg.id, title:pg.title, axis:pg.axis, due_at:d.toISOString(), minutes:pg.minutes, note:`يوم ${i+1} من ${pg.days}`}); });
      ok(await sb.from('tasks').insert(rows)); return run; },
    async stopProgram(runId){ ok(await sb.from('tasks').delete().eq('run_id',runId).is('done_at',null).gt('due_at',new Date().toISOString())); ok(await sb.from('program_runs').update({stopped_at:new Date().toISOString()}).eq('id',runId)); },
    async reminders(){ const id=await uid(); const [cur,prog,off,entries]=await Promise.all([loadCurriculum(),DB.progress(),sb.from('user_reminder_off').select('reminder_id').eq('user_id',id),DB.entries()]);
      const done=new Set(prog.map(p=>p.lesson_id)), offs=new Set(ok(off).map(o=>o.reminder_id));
      const lc=entries.find(e=>e.exercise_id==='ex_lives_count'), pl=entries.find(e=>e.exercise_id==='ex_past_lives');
      const livesIncomplete=!lc||!pl||((pl.data.lives||[]).length<(lc.data.now||lc.data.human||0));
      return cur.reminders.filter(r=>done.has(r.lesson)).filter(r=>r.cond!=='lives_incomplete'||livesIncomplete).map(r=>({...r,on:!offs.has(r.id)})); },
    async toggleReminder(rid){ const id=await uid(); const r=await sb.from('user_reminder_off').insert({user_id:id, reminder_id:rid});
      if(r.error){ ok(await sb.from('user_reminder_off').delete().eq('user_id',id).eq('reminder_id',rid)); return true; } return false; },
    /* admin (RLS lets only role=admin through) */
    admin:{
      async users(){ await ready(); const [act,ents]=await Promise.all([sb.rpc('admin_member_activity'), sb.from('entitlements').select('*')]); const E=ok(ents);
        const roles=ok(await sb.from('profiles').select('id,role,created_at'));
        return ok(act).map(u=>{ const pr=roles.find(r=>r.id===u.id)||{}; const ue=E.filter(e=>e.user_id===u.id);
          return {id:u.id, email:u.email, name:u.name, role:pr.role, created_at:pr.created_at, last_seen:u.last_seen, ents:ue, protocol:accessFrom(ue,'protocol'), entries:Number(u.entries)}; }); },
      async products(){ return ok(await sb.from('products').select('*')); },
      async grant(email, productId){ ok(await sb.rpc('grant_product',{p_email:email, p_product:productId})); entsCache=null; return ok(await sb.from('profiles').select('*').ilike('email',email).single()); },
      async revoke(entId){ ok(await sb.from('entitlements').delete().eq('id',entId)); },
      async extend(entId, days){ const e=ok(await sb.from('entitlements').select('*').eq('id',entId).single()); if(!e.ends_at) return e;
        const base=new Date(e.ends_at)>now()?new Date(e.ends_at):now(); return ok(await sb.from('entitlements').update({ends_at:addDays(base,days).toISOString()}).eq('id',entId).select().single()); },
      async payments(){ return ok(await sb.from('payments').select('*').order('created_at',{ascending:false})); },
      async approvePayment(pid){ const p=ok(await sb.from('payments').update({status:'approved'}).eq('id',pid).select().single()); await DB.admin.grant(p.email, p.product_id); return p; },
      async rejectPayment(pid){ return ok(await sb.from('payments').update({status:'rejected'}).eq('id',pid).select().single()); },
      async courses(){ courseCache=null; return await loadCourses(); },
      async saveCourse(c){ const row={id:c.id||('c'+Math.random().toString(36).slice(2,8)), title:c.title, tagline:c.tagline, is_free:!!c.is_free, cover:c.cover, sort:c.order, published:c.published!==false};
        Object.keys(row).forEach(k=>row[k]===undefined&&delete row[k]); ok(await sb.from('courses').upsert(row)); courseCache=null; return (await loadCourses()).find(x=>x.id===row.id); },
      async deleteCourse(id){ ok(await sb.from('courses').delete().eq('id',id)); courseCache=null; },
      async saveLesson(courseId, l){ const cs=await loadCourses(); const c=cs.find(x=>x.id===courseId); const idx=c?c.lessons.findIndex(x=>x.id===l.id):-1;
        const row={id:l.id||('l'+Math.random().toString(36).slice(2,8)), course_id:courseId, title:l.title, minutes:l.minutes, video_url:l.video, body:l.body, exercise_id:l.exercise||null, sort:idx>-1?idx+1:(c?c.lessons.length+1:1)};
        Object.keys(row).forEach(k=>row[k]===undefined&&delete row[k]); ok(await sb.from('lessons').upsert(row)); courseCache=null; },
      async moveLesson(courseId, lessonId, dir){ const c=(await loadCourses()).find(x=>x.id===courseId); const i=c.lessons.findIndex(l=>l.id===lessonId), j=i+dir; if(j<0||j>=c.lessons.length) return;
        ok(await sb.from('lessons').update({sort:j+1}).eq('id',c.lessons[i].id)); ok(await sb.from('lessons').update({sort:i+1}).eq('id',c.lessons[j].id)); courseCache=null; },
      async deleteLesson(courseId, lessonId){ ok(await sb.from('lessons').delete().eq('id',lessonId)); courseCache=null; },
      async exercises(){ exCache=null; return await loadExercises(); },
      async saveExercise(x){ const row={id:x.id||('ex_'+Math.random().toString(36).slice(2,8)), title:x.title, source_course:x.source||null, axis:x.axis||null, fields:x.fields}; ok(await sb.from('exercises').upsert(row)); exCache=null; },
      async messages(){ return ok(await sb.from('messages').select('*')); },
      async saveMessage(m){ ok(await sb.from('messages').upsert(m)); },
      async metrics(){ const us=(await DB.admin.users()).filter(u=>u.role!=='admin');
        const pend=ok(await sb.from('payments').select('id').eq('status','pending')).length;
        return {members:us.length, protocolActive:us.filter(u=>u.protocol.active).length, expiring7:us.filter(u=>u.protocol.active&&u.protocol.daysLeft!==null&&u.protocol.daysLeft<=7).length,
          readOnly:us.filter(u=>u.protocol.readOnly).length, pendingPayments:pend, weeklyActive:[], weeklyLabels:[], lessonCompletion:{}, entriesThisWeek:us.reduce((a,u)=>a+u.entries,0), tasksDoneRate:0}; }
    },
    resetDemo(){ location.search='?demo=1'; },
    setDemoUser(){ location.search='?demo=1'; }
  };
  window.DB = DB;
  ready();   // start the sign-in check as soon as the page loads
})();
