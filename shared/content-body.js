/* ============================================================
   CONTENT — الكورس التأسيسي «إعادة التناغم مع الجسد»
   Source: the 9 YouTube lessons (playlist «كورس إعادة التناغم.. الآن مجانًا»)
   + the course material files linked in each video description.
   Classification follows content-map-body.html (approved by Ashraf):
     exercises    = records kept in the member's file (fed to the AI)
     achievements = one-time milestones
     programs     = curriculum practices with a fixed duration (become tasks)
     reminders    = open-ended practices (قسم «تذكّر» + one notification a day)
   Block names (vows / harm) are NOT stored — only the member's positive sentences.
   ============================================================ */
(function(){
  const yt = id => 'https://www.youtube.com/watch?v='+id;
  const slides = id => 'https://docs.google.com/presentation/d/'+id+'/edit';

  /* ---------- reference lists (from the course material) ---------- */
  const PLANETS = [
    {key:'sun',     name:'الشمس',   en:'Sun',     energy:'طاقة الحياة والتكوين',  chakra:'العين الثالثة',
      organs:['القلب','الظهر','العمود الفقري','الغدة التيموثية']},
    {key:'moon',    name:'القمر',   en:'Moon',    energy:'طاقة الحس والشعور',     chakra:'التاج',
      organs:['الصدر','القصبة الهوائية','المعدة','الكبد','المرارة','القنوات الصفراوية','البنكرياس','الأمعاء','السوائل في الجسد']},
    {key:'mercury', name:'عطارد',   en:'Mercury', energy:'طاقة الفكر والتواصل',   chakra:'الجنس',
      organs:['الجهاز التنفسي','العقل','الجهاز العصبي']},
    {key:'venus',   name:'الزهرة',  en:'Venus',   energy:'طاقة الحب والاستمتاع',  chakra:'القلب',
      organs:['الحلق','الكليتين','الفقرات القطنية','الغدد الجار-درقية']},
    {key:'mars',    name:'المريخ',  en:'Mars',    energy:'طاقة الشجاعة والأفعال', chakra:'الجذر',
      organs:['العضلات','النظام التناسلي','المبايض','الخصية','الطاقة الجسدية','الطاقة الجنسية']},
    {key:'jupiter', name:'المشترى', en:'Jupiter', energy:'طاقة التوسع والفرص',    chakra:'الضفيرة الشمسية',
      organs:['الكبد','المرارة','الغدة الصنوبرية']},
    {key:'saturn',  name:'زحل',     en:'Saturn',  energy:'طاقة النضج والخبرة',    chakra:'الحلق',
      organs:['الطحال','البنكرياس','الحلق','الفم','العظام','الشعر','الأظافر']},
    {key:'uranus',  name:'أورانوس', en:'Uranus',  energy:'طاقة الحرية والحدس',    chakra:'التاج',
      organs:['الدورة الدموية','الغدد التناسلية','الغدة الصنوبرية','الرأس','الفقرات العنقية']},
    {key:'neptune', name:'نبتون',   en:'Neptune', energy:'طاقة الإبداع والروحانية', chakra:'العين الثالثة',
      organs:['النظام العصبي','المهاد العقلي']},
    {key:'pluto',   name:'بلوتو',   en:'Pluto',   energy:'طاقة التغيير والولادة', chakra:'الجنس',
      organs:['تكوين وإعادة بناء الخلايا','الجهاز التناسلي','الغدد التناسلية']}
  ];
  const SIGNS = [
    ['الحمل','Aries','الإرادة الحرة – المبادرة – الشجاعة'],
    ['الثور','Taurus','البحث عن المتعة – الحس – البحث عن الأمان'],
    ['الجوزاء','Gemini','التفكير العقلي والتعلم – التواصل البارع'],
    ['السرطان','Cancer','البحث عن الأمان وغلق النهايات المفتوحة'],
    ['الأسد','Leo','الوضوح – الكرم – محور الاهتمام'],
    ['العذراء','Virgo','الدقة – التميز – فعل الضروري'],
    ['الميزان','Libra','الإحساس بالجمال – التوازن – الانسجام'],
    ['العقرب','Scorpio','الحماس – التطرف – العاطفة'],
    ['القوس','Sagittarius','روح حرة – لامبالي – حب الانطلاق'],
    ['الجدي','Capricorn','وضع الأهداف – الإصرار – الطموح – الفخر'],
    ['الدلو','Aquarius','التواصل – الاهتمام بالإنسانية – التدرج – روح كونية'],
    ['الحوت','Pisces','التعاطف والإحساس – المساعدة – الاجتماعيات']
  ].map(([name,en,keys])=>({name,en,keys}));
  const CHAKRA_BLOCKERS = {
    'العين الثالثة':['الحدس','الاتصال مع عالم الروح','تجاوز وعي الزمان والمكان','التوسع','الارتقاء'],
    'التاج':['الروحانية','التغير والتحول','الحكمة','الاتصال بالإرشاد الروحي','الحرية'],
    'الجنس':['العاطفة','الإبداع','الرغبات','الجنس','المال والوفرة','التمتع بالحياة'],
    'القلب':['الحب لنفسي','قبول الحب','حب الآخرين','الحب الإلهي','الخدمة والرعاية','قبول النفس','الترفيه','الوفرة'],
    'الجذر':['القوة','العائلة','الجذور','الأمان','النجاة','الحماية','الأفعال','القيادة'],
    'الضفيرة الشمسية':['الثقة بالذات','القوة الداخلية','الحرية','الإحساس بالمرح','المسئولية','إرادة الحياة والمقاومة'],
    'الحلق':['التواصل','الاستماع للآخرين','التعبير عن النفس','الأصالة']
  };
  const ERAS = ['ليموريا','أطلانطس','مصر القديمة','ما وراء النهرين','المايا','الإغريق','الرومان','الفرس','البيزنطية','ما قبل الحديثة','الحديثة'];
  const RELIGIONS = ['اليهودية','الإسلام','المسيحية','البوذية','الهندوسية','الطاوية','الفيدية','الشامانية','ديانة قبلية','جماعة روحية سرية','أخرى','لا شيء'];
  const RELATIONS = ['أب','أم','ابن/ابنة','أخ/أخت','جد/جدة','عم/عمة','خال/خالة','ابن عم/ابن عمة','ابن خال/ابن خالة','زوج/زوجة','حبيب/حبيبة','زميل عمل','زميل دراسة','معلم','قائد','صديق','جار','مرشد روحي','تجسد لك','روح منقسمة'];
  const SOURCES = ['الحياة الحالية','حياة سابقة','عدة حيوات سابقة'];
  const BATHWAVE = ['اعتقاد (Belief)','أفكار (Thoughts)','كلمات (Words)','أفعال (Actions)','عادات (Habits)','قيم (Values)','سلوكيات (Attitudes)','مشاعر (Emotions)'];

  const planetRows = PLANETS.map(p=>({key:p.key, label:p.name, sub:p.energy}));

  /* ---------- exercises (records) ---------- */
  // field types: text | textarea | number | scale | chips | axes | select | date | time
  //              table: {rows:[{key,label,sub}]} fixed rows, or {addable:true, rowLabel}
  //                     cols:[{key,label,type:'text'|'number'|'select'|'chips', options|optionsByRow, multi, min, max}]
  const EXERCISES = [
    {id:'ex_mission', lesson:'b1', title:'رسالتي في الحياة', source:'body', axis:'spirit', fields:[
      {key:'mission', type:'textarea', label:'رسالتي في الحياة', default:'رسالتي أن أكون تجليًا لحقيقتي الإلهية على الأرض', hint:'لو تعرف تفاصيل حقيقتك الإلهية، كمّل الجملة بيها'},
      {key:'signal', type:'select', label:'بتاخد الإجابة إزاي؟', options:['اختبار العضلات','البندول','الاتنين']},
      {key:'yes_sign', type:'text', label:'شكل إجابة «آه» عندك', hint:'مثال: الحلقتين بيقفلوا جامد، أو البندول بيلف مع عقارب الساعة'},
      {key:'no_sign', type:'text', label:'شكل إجابة «لأ» عندك'}]},
    {id:'ex_question', lesson:'b1', title:'سؤال للسجلات', source:'body', axis:'spirit', fields:[
      {key:'step', type:'textarea', label:'السؤال بالصيغة الصح', hint:'«ما هي أفضل خطوة أخطوها (تتناغم مع رسالتي في الحياة ومع نسختي الأصلية) في … القادمة لـ …؟»'},
      {key:'period', type:'select', label:'المدة', options:['الأسبوع الجاي','الشهر الجاي','التلات شهور الجاية','الست شهور الجاية','السنة الجاية']},
      {key:'options', type:'table', addable:true, rowLabel:'اختيار', label:'الاختيارات وإجابة كل واحد', min:2, cols:[
        {key:'option', label:'الاختيار', type:'text'},
        {key:'answer', label:'الإجابة', type:'select', options:['آه','لأ','مفيش إجابة دلوقتي']}]}]},
    {id:'ex_hawkins', lesson:'b1', title:'مستوى الوعي (مقياس هوكنز)', source:'body', axis:'spirit', fields:[
      {key:'level', type:'number', label:'الرقم اللي طلع', min:20, max:1000, hint:'من 20 (العار) لـ 1000 (الاستنارة). 200 هي الشجاعة'},
      {key:'moment', type:'select', label:'إمتى قست؟', options:['قبل الجلسة','بعد الجلسة','يوم عادي']}]},
    {id:'ex_birth', lesson:'b2', title:'بيانات الميلاد', source:'body', axis:null, fields:[
      {key:'date', type:'date', label:'تاريخ الميلاد'},
      {key:'time', type:'time', label:'ساعة الميلاد'},
      {key:'time_unknown', type:'chips', label:'', options:['مش عارف الساعة'], multi:false},
      {key:'place', type:'text', label:'مكان الميلاد (المدينة والبلد)'}]},
    {id:'ex_star_chart', lesson:'b2', title:'جدول الطاقات النجمية', source:'body', axis:'spirit', fields:[
      {key:'chart', type:'table', label:'البرج قدام كل كوكب، من خريطتك على Astro-Seek', rows:planetRows, cols:[
        {key:'sign', label:'البرج', type:'select', options:SIGNS.map(s=>s.name)}]}]},
    {id:'ex_design_room', lesson:'b3', title:'غرفة التصميم', source:'body', axis:'body', fields:[
      {key:'body_message', type:'text', label:'رسالة جسدي في الحياة دي (3 لـ 4 كلمات)'},
      {key:'meanings', type:'table', label:'معنى المزيج بين كل كوكب وبرجه', rows:planetRows, cols:[
        {key:'meaning', label:'الجملة', type:'text'}]},
      {key:'free', type:'textarea', label:'كتابة حرة بعد التأمل'}]},
    {id:'ex_star_sailing', lesson:'b4', title:'الإبحار النجمي', source:'body', axis:'body', fields:[
      {key:'sailing', type:'table', label:'لكل كوكب: نسبة التناغم، والمعيق، والعضو، ومصدره', rows:planetRows.map(r=>({...r, sub:r.sub+' · '+PLANETS.find(p=>p.key===r.key).chakra})), cols:[
        {key:'pct', label:'نسبة التناغم %', type:'number', min:0, max:100},
        {key:'source', label:'مصدر المعيق', type:'select', options:SOURCES},
        {key:'blockers', label:'المعيق', type:'chips', multi:true, optionsByRow:Object.fromEntries(PLANETS.map(p=>[p.key, CHAKRA_BLOCKERS[p.chakra]]))},
        {key:'organs', label:'أثّر في', type:'chips', multi:true, optionsByRow:Object.fromEntries(PLANETS.map(p=>[p.key, p.organs]))}]}]},
    {id:'ex_lives_count', lesson:'b5', title:'عدد حيواتي', source:'body', axis:'spirit', fields:[
      {key:'human', type:'number', label:'حيوات سابقة بشرية', min:0},
      {key:'nonhuman', type:'number', label:'حيوات سابقة غير بشرية', min:0},
      {key:'now', type:'number', label:'المتاح والمفيد أعرفه دلوقتي', min:0, hint:'غالبًا بتبدأ بـ 5'}]},
    {id:'ex_past_lives', lesson:'b5', title:'جدول حيواتي', source:'body', axis:'spirit', fields:[
      {key:'lives', type:'table', addable:true, rowLabel:'الحياة', label:'صف لكل حياة، بالترتيب', cols:[
        {key:'era', label:'الحقبة', type:'select', options:ERAS},
        {key:'years', label:'السنين', type:'text'},
        {key:'in_civ', label:'في الحضارة نفسها؟', type:'select', options:['في الحضارة نفسها','في زمنها بس، في مكان تاني']},
        {key:'place', label:'المكان', type:'text'},
        {key:'gender', label:'النوع', type:'select', options:['ذكر','أنثى','نوع آخر']},
        {key:'free', label:'حر ولا عبد', type:'select', options:['حر','عبد']},
        {key:'family', label:'الجواز والأولاد', type:'text'},
        {key:'death', label:'الموت', type:'select', options:['طبيعي','درامي']},
        {key:'role', label:'كان له شأن', type:'select', options:['لا','سياسي','ديني','الاتنين']},
        {key:'awareness', label:'مستوى الوعي', type:'number', min:20, max:1000},
        {key:'religion', label:'الديانة', type:'select', options:RELIGIONS}]}]},
    {id:'ex_relations', lesson:'b5', title:'علاقاتي في الحيوات', source:'body', axis:'heart', fields:[
      {key:'people', type:'table', addable:true, rowLabel:'شخص', label:'لكل حد مهم في حياتك دلوقتي', cols:[
        {key:'name', label:'الاسم (ثنائي)', type:'text'},
        {key:'life', label:'كان معايا في', type:'text'},
        {key:'relation', label:'العلاقة وقتها', type:'select', options:RELATIONS},
        {key:'blocks', label:'فيه معيق بينّا؟', type:'select', options:['لأ، كانت علاقة نفع وتعلّم','كان واتعالج','موجود ومش مؤثر','موجود ومؤثر']},
        {key:'done', label:'سامحت أو طلبت المغفرة', type:'select', options:['لسه','تم']}]}]},
    {id:'ex_nonhuman', lesson:'b5', title:'حيواتي غير البشرية', source:'body', axis:'spirit', fields:[
      {key:'list', type:'textarea', label:'اكتبها بخيالك من غير حدود', hint:'نبات، حيوان، طير، مية، حجر، كائن من بعد تاني…'}]},
    {id:'ex_blocker_lives', lesson:'b5', title:'ربط المعيقات بالحيوات', source:'body', axis:'spirit', fields:[
      {key:'links', type:'table', addable:true, rowLabel:'معيق', label:'كل معيق من الإبحار النجمي حصل في أنهي حياة', cols:[
        {key:'blocker', label:'المعيق', type:'text'},
        {key:'life', label:'الحياة (رقمها في جدولك)', type:'text'}]}]},
    {id:'ex_bathwave', lesson:'b7', title:'جملي الإيجابية (BATHWAVE)', source:'body', axis:'mind', fields:[
      {key:'sentences', type:'table', addable:true, rowLabel:'جملة', label:'الجملة اللي هتعيش بيها بدل السلوك القديم', cols:[
        {key:'level', label:'مكانها في BATHWAVE', type:'select', options:BATHWAVE},
        {key:'sentence', label:'الجملة الإيجابية', type:'text'}]}],
      note:'اكتب الجملة الإيجابية بس. أسامي العهود مش بتتحفظ.'},
    {id:'ex_eft', lesson:'b9', title:'جملتي في EFT', source:'body', axis:'heart', fields:[
      {key:'sentence', type:'text', label:'الجملة الإيجابية', hint:'مثال: «أنا الآن أتمتع بحياة كلها وفرة»'},
      {key:'note', type:'textarea', label:'لاحظت إيه في جسمك؟'}],
      note:'الجملة الإيجابية بس. السلبي مش بيتحفظ.'}
  ];

  /* ---------- lessons ---------- */
  const LESSONS = [
    {id:'b1', no:'أولًا', title:'دخول السجلات الأكاشية ومقابلة الذات العليا', minutes:202, video:yt('KDM7oS3mM8o'), material:slides('1YhPsejDG8qTZq_hOgaNSsGkSPHK9_MjHP9PiVfdP6pA'),
      exercises:['ex_mission','ex_question','ex_hawkins'], body:'الأداة اللي كل الأمسيات بتبني عليها: إزاي تصيغ سؤالك صح، وتبرمج جسمك أو البندول على «آه» و«لأ»، وتقيس ذبذباتك، وتدخل السجلات بالأسانسير وتقفل الجلسة.'},
    {id:'b2', no:'ثانيًا', title:'المحاضرة التمهيدية لإعادة التناغم', minutes:12, video:yt('6nxxFLoKF5g'), material:slides('11-BG1HZMpF5kVa0fFKU3JKyiKYAxhghxby283trK0Pg'),
      exercises:['ex_birth','ex_star_chart'], body:'واجب قبل التأمل: طلّع خريطتك النجمية من Astro-Seek واملا البرج قدام كل كوكب من العشرة.'},
    {id:'b3', no:'ثالثًا', title:'تأمل التناغم مع الجسد', minutes:41, video:yt('TKwDz1noAno'), material:slides('11-BG1HZMpF5kVa0fFKU3JKyiKYAxhghxby283trK0Pg'),
      exercises:['ex_design_room'], body:'رحلة لغرفة التصميم قبل التجسد. اكتب وانت لسه في التأمل: رسالة جسمك، ومعنى كل كوكب مع برجه.'},
    {id:'b4', no:'رابعًا', title:'الإبحار النجمي', minutes:93, video:yt('-SgLczuOndc'), material:slides('11dYmtyC7niCkn1BBtWfB4z_zwhtXNKxAKETYAmZNsgc'),
      exercises:['ex_star_sailing'], body:'قيس تناغمك مع كل كوكب، واكتشف المعيق في الشاكرا والعضو اللي أثّر فيه ومصدره، وابدأ نية التنظيف 7 أيام.'},
    {id:'b5', no:'خامسًا', title:'رحلة الروح في الحيوات الأرضية', minutes:99, video:yt('plCWfqfCU2A'), material:slides('1EmB-r4ySrxHasppvR7yEe1RJlHFgDlbAmqScDfux7eE'),
      material2:'https://docs.google.com/spreadsheets/d/1S_UktaUwBLJ1CRmtVJ6n7BaYq5YwpDGQ-bwbIwBv3so/edit',
      exercises:['ex_lives_count','ex_past_lives','ex_relations','ex_nonhuman','ex_blocker_lives'], body:'كام حياة عشتها، وكل واحدة كانت إمتى وفين ومين كان معاك فيها. وفي الآخر اربط معيقات الإبحار النجمي بحيواتها.'},
    {id:'b6', no:'سادسًا · ج1', title:'بلوكات العهود والنذور (1)', minutes:27, video:yt('oyv4VupTUGo'), material:slides('1iBpz-1clruXFEfl4bX8jnnodIGS9vKVZhQnWl2XHqf0'),
      exercises:[], body:'ليه العهود خطيرة، ونية إنهاء كل العقود والعهود والنذور، وممارسات يومية قبل الفحص.'},
    {id:'b7', no:'سادسًا · ج2', title:'بلوكات العهود والنذور (2)', minutes:123, video:yt('yfIKyx9lCKg'), material:slides('1iBpz-1clruXFEfl4bX8jnnodIGS9vKVZhQnWl2XHqf0'),
      exercises:['ex_bathwave'], body:'افحص العهود العشرة وجمّعها في مجموعات كارمية واكتب حكايتها، وبعدين نظّف العقل بطريقة BATHWAVE لمدة 21 يوم.'},
    {id:'b8', no:'سابعًا · ج1', title:'بلوكات الإيذاء (1)', minutes:202, video:yt('IIiTbSl4Py8'), material:'https://drive.google.com/file/d/1XOC83cjdtpDg8OlUP7H3hKODv-RUR6Rf/view',
      exercises:[], body:'قبل أي تنظيف: تأمل المسامحة وتأمل طلب المغفرة. بعدها فحص بلوكات الإيذاء وتجميعها.'},
    {id:'b9', no:'سابعًا · ج2', title:'بلوكات الإيذاء (2)', minutes:50, video:yt('wIa3dlX77r4'), material:'https://drive.google.com/file/d/1XOC83cjdtpDg8OlUP7H3hKODv-RUR6Rf/view',
      exercises:['ex_eft'], body:'حكاية كل مجموعة، ونية التنظيف، وتنظيف العقل بـ EFT.'}
  ].map(l=>({...l, exercise:l.exercises[0]||null}));

  /* ---------- curriculum practices with a fixed duration → tasks ---------- */
  const PROGRAMS = [
    {id:'p_sailing', lesson:'b4', title:'نية التنظيف الطاقي', days:7, times:['22:00'], minutes:5, axis:'spirit',
      text:'«أنا – وفقًا للتالي – أضع النية الواضحة لاستعادة تناغمي مع جسدي ورسالته في التجسد الحالي، كما تم تصميمه من قبل ذاتي العليا قبل التجسد الحالي.. أزل كل الحواجز والمعيقات من جسدي، سواء التي قمت بخلقها في التجسد الحالي أو أي تجسد سابق، في هذا البعد أو أي بعد آخر، بوعي أو بغير وعي، وقم بمسح كل الطاقات السلبية الناتجة عن تلك الحواجز والمعيقات غير المتوافقة مع التصميم الأصلي لنسختي الحالية المتفق عليها في عالم الروح. أضع هذه النية قاصدًا بها الخير لكل الموجودات، واثقًا من وصولها بكل البهجة والفرحة الممكنة.. ليكن الأمر كذلك.. شكرًا، شكرًا، شكرًا»',
      how:'كررها 7 أيام على الأقل بعد أول دخول للسجلات.'},
    {id:'p_vows', lesson:'b7', title:'نية تنظيف العهود قبل النوم', days:21, times:['22:30'], minutes:5, axis:'spirit',
      text:'نية «بروتوكول تنظيف البلوكات من السجلات الأكاشية»، وتذكر فيها كل عهد ومكان تأثيره في الجسد والشاكرا.',
      how:'كل ليلة قبل النوم، 21 ليلة.'},
    {id:'p_bathwave', lesson:'b7', title:'جملي الإيجابية (BATHWAVE)', days:21, times:['07:30','22:00'], minutes:5, axis:'mind',
      text:'«أنا أقدر، أنا سوف، أنا الآن …» وانت بتمرّر إيدك على مسار الكون الصغير.', usesEntry:'ex_bathwave',
      how:'قبل النوم وعند الاستيقاظ، 21 يوم. ولو السلوك رجع خلال اليوم، 9 مرات.'}
  ];

  /* ---------- one-time milestones ---------- */
  // how: 'manual' (member taps «عملتها») | {entry:exId} | {program:id} | {rows:[exId,field,n]} | 'course'
  const ACHIEVEMENTS = [
    {id:'a_intent', lesson:'b1', icon:'🧭', title:'وضعت نية برمجة الجسد والبندول', how:'manual'},
    {id:'a_records', lesson:'b1', icon:'🛗', title:'أول دخول للسجلات الأكاشية', how:'manual'},
    {id:'a_chart', lesson:'b2', icon:'✨', title:'جهّزت خريطتك النجمية', how:{entry:'ex_star_chart'}},
    {id:'a_design', lesson:'b3', icon:'🕊️', title:'أول زيارة لغرفة التصميم', how:{entry:'ex_design_room'}},
    {id:'a_sailing', lesson:'b4', icon:'⛵', title:'أول إبحار نجمي', how:{entry:'ex_star_sailing'}},
    {id:'a_sailing7', lesson:'b4', icon:'🌙', title:'خلّصت 7 أيام نية التنظيف', how:{program:'p_sailing'}},
    {id:'a_lives', lesson:'b5', icon:'🌍', title:'عرفت عدد حيواتك', how:{entry:'ex_lives_count'}},
    {id:'a_lives5', lesson:'b5', icon:'📜', title:'كمّلت جدول أول 5 حيوات', how:{rows:['ex_past_lives','lives',5]}},
    {id:'a_link', lesson:'b5', icon:'🔗', title:'ربطت المعيقات بحيواتها', how:{entry:'ex_blocker_lives'}},
    {id:'a_soul_forgive', lesson:'b5', icon:'🤍', title:'سامحت أو طلبت المغفرة من روح ظهر بينكم معيق', how:'manual'},
    {id:'a_end_vows', lesson:'b6', icon:'✂️', title:'قلت نية إنهاء العقود والعهود والنذور', how:'manual'},
    {id:'a_vows_scan', lesson:'b7', icon:'🔍', title:'فحصت العهود العشرة وجمّعتها', how:'manual'},
    {id:'a_vows_story', lesson:'b7', icon:'🕯️', title:'كتبت حكاية مجموعاتك الكارمية', how:'manual'},
    {id:'a_vows_intent', lesson:'b7', icon:'🌿', title:'وضعت نية تنظيف العهود جوه السجلات', how:'manual'},
    {id:'a_bathwave21', lesson:'b7', icon:'🌊', title:'خلّصت 21 يوم BATHWAVE', how:{program:'p_bathwave'}},
    {id:'a_forgive', lesson:'b8', icon:'🫶', title:'عملت تأمل المسامحة', how:'manual'},
    {id:'a_pardon', lesson:'b8', icon:'🙏', title:'عملت تأمل طلب المغفرة', how:'manual'},
    {id:'a_harm_scan', lesson:'b8', icon:'🔍', title:'فحصت بلوكات الإيذاء وجمّعتها', how:'manual'},
    {id:'a_harm_story', lesson:'b9', icon:'🕯️', title:'كتبت حكاية مجموعات الإيذاء', how:'manual'},
    {id:'a_harm_intent', lesson:'b9', icon:'🌿', title:'وضعت نية تنظيف بلوكات الإيذاء', how:'manual'},
    {id:'a_eft', lesson:'b9', icon:'👐', title:'أول جلسة EFT', how:{entry:'ex_eft'}},
    {id:'a_course', lesson:'b9', icon:'🎓', title:'خلّصت الكورس المجاني', how:'course'}
  ];

  /* ---------- open-ended practices → «تذكّر» + one notification a day ---------- */
  const REMINDERS = [
    {id:'r_records', lesson:'b1', text:'ادخل السجلات النهارده ولو لسؤال واحد', sub:'الفرق الوحيد هو التطبيق اليومي'},
    {id:'r_water', lesson:'b1', text:'اشرب مية قبل ما تسأل', sub:'الجسم الناشف بيلخبط الإجابة'},
    {id:'r_first', lesson:'b1', text:'خد أول إجابة، وما تسألش مرتين', sub:'السؤال التاني بيفتح باب الشك'},
    {id:'r_intuition', lesson:'b4', text:'هل اتبعت حدسك النهارده؟', sub:'ابدأ بالقرارات الصغيرة'},
    {id:'r_daybyday', lesson:'b4', text:'اليوم بيومه', sub:'قبل النوم، سلّم بكره لنسختك الجاية'},
    {id:'r_lives', lesson:'b5', text:'كمّل باقي حيواتك براحتك', sub:'جدولك لسه فيه مكان', cond:'lives_incomplete'},
    {id:'r_compare', lesson:'b5', text:'ما تقارنش بين الجلسات، وما تحكمش على نفسك', sub:'كل جلسة بتطلّع اللي محتاجه دلوقتي'},
    {id:'r_promise', lesson:'b6', text:'امسك لسانك على الوعود', sub:'بدّل «أوعدك» بـ «لما نخلص ونشوف»'},
    {id:'r_ball', lesson:'b6', text:'كورة الحماية قبل النوم', sub:'الأحباب، وبيوتهم، والأرض، والكون'},
    {id:'r_nointerfere', lesson:'b6', text:'اعرض، ما تتدخّلش', sub:'في رحلة الآخرين'},
    {id:'r_nine', lesson:'b7', text:'لو السلوك رجع النهارده، قول جملتك 9 مرات', sub:'جملك في ملفك'},
    {id:'r_forgive', lesson:'b8', text:'سامح النهارده، واطلب المغفرة', sub:'«كل فترة، وإن شاء الله كل يوم»'},
    {id:'r_kids', lesson:'b8', text:'فك تعلّقك بأولادك، وسيبهم يكمّلوا رحلتهم', sub:'للي عنده أولاد', optional:true},
    {id:'r_eft', lesson:'b9', text:'جلسة EFT على جملتك', sub:'كل ما تحتاج'}
  ];

  window.CONTENT_BODY = {
    course:{id:'body', title:'إعادة التناغم مع الجسد', tagline:'الكورس التأسيسي للمنهج', is_free:true, order:1, cover:'linear-gradient(135deg,#e7d3a6,#b08429)', lessons:LESSONS},
    EXERCISES, PROGRAMS, ACHIEVEMENTS, REMINDERS,
    REF:{PLANETS, SIGNS, CHAKRA_BLOCKERS, ERAS, RELIGIONS, RELATIONS, SOURCES, BATHWAVE}
  };
})();
