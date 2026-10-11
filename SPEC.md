# Soul Meeting v3 — Academy + Protocol (spec for builders)

Client: محمد فاروق (Soul Meeting / لقاء الروح). Methodology: «إعادة التناغم». Owner/operator: أشرف.
Two NEW apps (the old ReHarMoney app stays untouched). Same Supabase project, same accounts (one login works in both).

## Files you must use (do not edit them; if you need a small addition, put it in your own page's <style>/<script>)
- `shared/kit.css` — design tokens + every component (cards, buttons, tasks, rings, streak, badges, sheet, modal, toast, admin shell, tables). Use these classes. Only add page-specific CSS when nothing fits.
- `shared/kit.js` — `window.Kit`: `$ $$ h esc fmtDate fmtShort fmtTime dayKey greeting toast modal sheet closeAll confetti celebrate ring doubleRing barChart radar VOICE pick BADGES streakFrom router googleCalLink I(icons) copyText`.
- `shared/data.js` — `window.DB` (async). **UI talks only to DB.** Read the file to learn the data shapes and methods. Today it's a mock; later a Supabase adapter with the same methods replaces it.
- `shared/assets/coin.png`, `coin-96.png` (Farouk gold coin — logo + reward coin), `icon-maskable.png`, `apple-touch-icon.png`.

Each page: `<link rel="stylesheet" href="../shared/kit.css">`, Google Fonts (Noto Sans Arabic 300–900 + Amiri 400/700), then `<script src="../shared/kit.js"></script><script src="../shared/data.js"></script>`, then your inline script. `<html lang="ar" dir="rtl">`. No frameworks, no build step, no other CDNs.

## Non-negotiable rules
- RTL Arabic. Digits Latin (wrap numbers in `.num` when mixed with Arabic).
- Copy: **Modern Standard Arabic with a light Egyptian touch** ("برافو عليك"، "قدّ كلمتك"، "تمام"، "يلا"). Short, warm, never corporate, never shaming, **never pushy** (no countdowns, no "only X left", no nagging popups; a reminder appears once and can be dismissed).
- Mobile-first for user apps (max-width 560px shell `.app`, fixed `.bottomnav`). Admin uses `.admin` shell (sidebar → drawer under 860px).
- Every screen opens in a realistic state from DB mock data. Every interactive control works against DB (state persists via DB).
- Content in data.js is SAMPLE content. Show a small discreet line in admin footers: «المحتوى الحالي تجريبي».
- Accessibility: buttons are `<button>`, labels on inputs, visible focus (kit handles), alt on images.
- Gamification is part of the UX, not decoration: rings, streak, weekly dots, badges, celebrations (Kit.celebrate + confetti) on meaningful completions only, encouraging messages from Kit.VOICE.
- Include a tiny **demo switcher** only in user apps, inside the profile/«حسابي» screen, titled «معاينة الحالات (للمراجعة فقط)» with 3 buttons calling `DB.setDemoUser('paid'|'free'|'expired')` + `DB.resetDemo()`.

## Access model (already implemented in DB.access / DB.admin)
- Spaces: `course:<id>` (forever once bought), `protocol` (paid features, timed), `community` (timed).
- Bundles (products): free course → `course:body`. Paid course (recorded or live) → `course:money` forever + `protocol` 90d + `community` 90d. Protocol subscription: quarterly (90d) or yearly (365d), both include community.
- Protocol states: **free** (no `protocol` right: can register + log exercise entries + view own file), **active** (everything), **read-only** (`protocol` expired: file + old tasks visible, can still log entries like free, no new plans, no AI, no community). One gentle notice 7 days before expiry.

---

## 1) Academy — learner (`academy/index.html`)
Bottom nav: الرئيسية · كورساتي · حسابي.
- **الرئيسية**: greeting + name; "continue where you stopped" hero (`.hero`) with next lesson + progress; course cards with progress ring; locked courses show a lock + "متاح ضمن …" + button «اعرف أكتر» (opens a calm info sheet, no pressure). Small stats row: lessons done, current streak of learning days.
- **Course page** (`#course/<id>`): cover, tagline, progress bar, lessons list (done ✓ / current / locked). 
- **Lesson page** (`#lesson/<courseId>/<lessonId>`): video area (if `video` empty show an elegant placeholder «الفيديو هيترفع قريبًا»), description, «خلّصت الدرس» → `DB.markLesson` → toast/`Kit.celebrate(Kit.VOICE.lessonDone)`; finishing the last lesson → `VOICE.courseDone` + badge `course_done`. 
- **The bridge «انتقل لمساعد التناغم»** on every lesson that has `exercise`: button that opens `../protocol/index.html#log/<exerciseId>`. Behaviour by state: protocol free/active → goes straight there (logging is allowed for everyone); show under the button a one-line hint of what the protocol does. For locked AI/plan features the protocol app itself shows the intro — academy does not upsell aggressively.
- **حسابي**: name/email, my products (from `DB.myEntitlements()` with end dates), sign-out, demo switcher.

## 2) Academy — admin (`academy/admin.html`)
Sidebar: نظرة عامة · الكورسات · الأعضاء · المدفوعات · الباقات.
- **نظرة عامة**: KPI tiles (members, protocol active, expiring in 7 days, pending payments), weekly active bar chart (`Kit.barChart`), completion per course.
- **الكورسات**: list of courses → course editor (title, tagline, free?, cover gradient) and lessons table: reorder ↑↓, edit (title, minutes, video URL — YouTube/Vimeo/Bunny link, description, linked protocol exercise via select from `DB.admin.exercises()`), delete with inline confirm (no `confirm()` dialogs — they don't work in previews), add lesson. Upload = paste a video link (real file hosting decided later).
- **الأعضاء**: searchable table (name, email, products, protocol state pill: active N days / expiring / read-only / free, last seen). Row → drawer with entitlements list (extend +90d / revoke) and **«إضافة باقة»**: pick product + email → `DB.admin.grant`. Also a top button «تفعيل عميل جديد» (email + product) — this is how manual activation works in v1.
- **المدفوعات**: queue of manual transfers (pending first): user, product, amount + currency, method, proof thumbnail placeholder, approve (→ grants bundle) / reject. History below.
- **الباقات**: read-only cards showing each product and what it grants (space + duration) — so the owner understands the rules.

## 3) Protocol — user (`protocol/index.html`)
Bottom nav: النهارده · المهام · ملفي · التقدّم · حسابي.
- **النهارده** (home): greeting; streak pill; gold hero with today's tasks progress (`Kit.doubleRing`: outer = today's completion, inner = week); the reminder nudge (`.nudge`) «عندك N مهام من البروتوكول النهارده» (dismissible, once per day); today's tasks list with check → `DB.toggleTask` → small toast from `VOICE.taskDone`; when all today's tasks done → `Kit.celebrate(pick(VOICE.dayDone))` + badge `day_done` (once per day). Each task row: axis icon (🧠🌊💪🪶), time, minutes, «أضف للكالندر» small icon button (`Kit.googleCalLink`). Quick action «سجّل تمرين».
- **المهام**: week strip (7 days, filled/partial/today) + tasks grouped by day; filter chips by axis; edit time of a task (sheet). Banner card «اربط الكالندر» → sheet explaining iCal subscription (copy link `DB.icalUrl()`, 3 steps for Google / iPhone) and per-task add button.
- **ملفي** (the personal database): exercises grouped by source course; each shows count + last entry; open exercise → history of entries (cards with date) + «سجّل جديد». **Log form** (`#log/<exerciseId>`) renders fields from the template: text, textarea, number, scale (`.scale` buttons), chips (single/multi), axes (4 scales with icons). Save → `DB.addEntry` → toast `VOICE.entrySaved` + first-entry badge. 
- **«حوّل ملفك لخطة»** (main AI feature) — available when protocol is active: 
  1. choose what to include (checkbox per exercise; default all) — privacy note «انت اللي بتختار إيه يتشارك».
  2. «جهّز الطلب» → builds a full Arabic prompt (role: مساعد يطبّق منهج إعادة التناغم؛ include the selected entries as structured text; ask for a 14-day plan of small daily tasks, each with axis, suggested time, minutes; **require output as a fenced JSON block** `[{"title","axis":"mind|heart|body|spirit","date":"YYYY-MM-DD","time":"HH:MM","minutes":15}]` and to respect the person's existing calendar if the AI can see it). Copy button.
  3. «الصق الرد هنا» textarea → parse JSON block (tolerant: find first `[`…`]`), preview tasks grouped by day with remove ✕, then «أضف للمهام» → `DB.savePlan` → celebrate + badge `first_plan`.
  Also a line: «مع Claude تقدر تربط التطبيق مباشرة (قريبًا)».
  In free/read-only: show an intro card explaining what the plan feature does + how to get it (course bundle or quarterly/yearly subscription) with one calm button «اعرف الباقات» — no popups.
- **التقدّم** (gamification): stats tiles (current streak, best streak, tasks done this week, entries total); `Kit.barChart` tasks done per day last 7 days; `Kit.radar` latest axes entry (from `ex_axes`) + small "balance of tasks by axis" bars; badges grid from `Kit.BADGES` (earned vs locked with hint).
- **حسابي**: subscription card (state + end date + days left; read-only explanation; renew options quarterly/yearly as text + button «تواصل للتجديد» linking to WhatsApp placeholder), community link (active only), notifications toggle (UI only), privacy: export my data (download JSON via Blob is blocked in previews → show the JSON in a sheet with copy button), delete my data (inline confirm), demo switcher.
- Read-only state: a slim top banner «اشتراكك انتهى — ملفك ومهامك محفوظين وتقدر تكمّل تسجيل تمارينك» + plan feature locked. 7-days-left state: one dismissible nudge.

## 4) Protocol — admin (`protocol/admin.html`)
Sidebar: نظرة عامة · التمارين · المشتركين · الرسائل والتذكيرات · الأوسمة.
- **نظرة عامة**: KPIs (active, expiring 7d, read-only, entries this week, task completion rate), weekly active chart, "who might need a hand" list (active members with no activity 7+ days — supportive framing).
- **التمارين**: list of exercise templates (title, source course, axis, fields count, entries count). Editor: title, source course select, axis select, **field builder** (add/remove/reorder fields; type select text/textarea/number/scale/chips/axes; label; options for chips; min/max for scale; multi toggle) with a live preview of the form as the member will see it. Save → `DB.admin.saveExercise`.
- **المشتركين**: table with protocol state, days left, entries count, last activity; row → drawer: entitlements (extend/revoke), activity summary. (Never show the member's private entry contents to admin — privacy. Show counts only.)
- **الرسائل والتذكيرات**: list of reminder templates (title, body, audience, schedule, active switch) + composer for a broadcast (title, body, audience select: all / protocol_active / expiring_7d / read_only / free; send now or schedule) with a phone-notification preview. Note that push goes through OneSignal when wired.
- **الأوسمة**: read-only list of Kit.BADGES with the rule text + how many earned (mock numbers fine).

## Quality bar
- Looks like a premium Arabic wellness app, consistent with the gold/cream identity. No emoji spam: emoji only as axis icons, badge icons, celebration icon.
- Phone 390px: no horizontal scroll; tap targets ≥ 40px.
- No console errors. Test by opening the file in a browser (Playwright is available in the sandbox: chromium at /opt/pw-browsers).

## المحتوى الحقيقي للكورس المجاني (اتضاف 11 أكتوبر)
- مصدر المحتوى: `shared/content-body.js` — الدروس التسعة بفيديوهاتها وملفات المادة، و14 تمرين بحقول مطابقة لكلام المادة (جداول الكواكب والأبراج والشاكرات والحقب والديانات والعلاقات).
- التصنيف حسب خريطة المحتوى المعتمدة:
  - **سجلات** = تمارين بتتحفظ في ملف العضو وبتروح للـ AI.
  - **22 إنجاز** مرة واحدة: يدوي («عملتها»)، أو تلقائي لما يسجّل تمرين، أو يخلّص ممارسة، أو جدول يوصل عدد معين، أو يخلّص الكورس.
  - **3 ممارسات بمدة** (7 أيام، 21 ليلة، 21 يوم صبح وليل) بتتحول لمهام في الكالندر.
  - **14 تذكير** بيتفتحوا مع كل درس، في قسم «تذكّر»، وتذكير واحد في اليوم.
- أسامي البلوكات (العهود والإيذاء) مش بتتحفظ. العضو بيسجّل جمله الإيجابية بس.
- بيانات الميلاد اختيارية، بس بتظهر كخطوة عادية في الدرس التاني.
- تعليمات الـ AI الثابتة جوه `buildPrompt` في `protocol/index.html`: أولوية أقل كواكب تناغمًا، عدم تكرار الإنجازات، احترام مدد المنهج، منع أسامي البلوكات والتشخيص الطبي، ومهمة مسامحة لأي علاقة معيقها مؤثر.
- ممارسات الكورس المجاني متاحة لأي حد (مش محتاجة اشتراك)، وخطة الـ AI بس هي اللي محتاجة اشتراك فعّال.
- تمارين المنهج في لوحة الإدارة للعرض بس، وبتتعدّل من ملف المحتوى عشان تفضل مطابقة للمادة.
