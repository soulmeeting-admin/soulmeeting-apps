-- Soul Meeting v3 — Academy + Protocol (one Supabase project, shared auth)
-- Draft schema. Apply on Farouk's NEW Supabase project. The old ReHarMoney app is not touched.

-- ---------- people ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  name text,
  role text not null default 'member' check (role in ('member','admin')),
  ical_token text unique default encode(extensions.gen_random_bytes(16),'hex'),
  created_at timestamptz default now(),
  last_seen timestamptz
);
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;

-- auto-create a profile + the free foundational course on sign-up
create function public.on_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,email,name) values (new.id, new.email, split_part(new.email,'@',1));
  insert into entitlements(user_id,space,source) values (new.id,'course:body','free_body');
  return new;
end $$;

-- ---------- catalog: products are bundles of timed rights ----------
create table public.products (
  id text primary key,                 -- free_body, money_rec, money_live, proto_q, proto_y, evenings
  name text not null,
  price numeric, currency text default 'USD',
  grants jsonb not null,               -- [{"space":"course:money","days":null},{"space":"protocol","days":90}, ...]
  active boolean default true
);

-- one row per (user, space). forever = ends_at null. timed rights stack on renewal.
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  space text not null,                 -- course:<id> | protocol | community
  starts_at timestamptz default now(),
  ends_at timestamptz,                 -- null = forever
  source text references products,
  unique (user_id, space)
);
create view public.my_access with (security_invoker = true) as
  select space, ends_at, (ends_at is null or ends_at > now()) as active,
         (space='protocol' and ends_at is not null and ends_at <= now()) as read_only
  from entitlements where user_id = auth.uid();

create function public.has_access(p_space text) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from entitlements where user_id=auth.uid() and space=p_space and (ends_at is null or ends_at>now())) $$;

-- grant a product (admin, or later the EasyKash webhook via service role)
create function public.grant_product(p_email text, p_product text) returns void language plpgsql security definer set search_path=public as $$
declare u uuid; g jsonb;
begin
  if not is_admin() and current_setting('request.jwt.claim.role',true) <> 'service_role' then raise exception 'not allowed'; end if;
  select id into u from profiles where lower(email)=lower(p_email);
  if u is null then raise exception 'user must sign in once first (magic link creates the account)'; end if;
  for g in select value from jsonb_array_elements((select grants from products where id=p_product)) loop
    insert into entitlements(user_id,space,ends_at,source)
    values (u, g->>'space', case when g->>'days' is null then null else now() + ((g->>'days')||' days')::interval end, p_product)
    on conflict (user_id,space) do update set
      ends_at = case
        when entitlements.ends_at is null then null
        when g->>'days' is null then null
        else greatest(entitlements.ends_at, now()) + ((g->>'days')||' days')::interval end,
      source = p_product;
  end loop;
end $$;

-- manual transfers (InstaPay / bank / Western Union) waiting for approval
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete set null,
  email text not null,
  product_id text references products,
  amount numeric, currency text,
  method text,                         -- EasyKash | InstaPay | تحويل بنكي | Western Union
  account text,                        -- receiving bank account (feeds the finance sheet)
  proof_path text,                     -- storage: payment-proofs/<uuid>.jpg
  status text default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

-- ---------- academy ----------
create table public.courses (
  id text primary key, title text not null, tagline text, is_free boolean default false,
  cover text, sort int default 0, published boolean default true
);
create table public.lessons (
  id text primary key, course_id text references courses on delete cascade,
  title text not null, minutes int, video_url text, body text,
  exercise_id text, sort int default 0
);
create table public.lesson_progress (
  user_id uuid references profiles on delete cascade, lesson_id text references lessons on delete cascade,
  done_at timestamptz default now(), primary key (user_id, lesson_id)
);

-- ---------- protocol ----------
create table public.exercises (
  id text primary key, title text not null, source_course text references courses,
  axis text check (axis in ('mind','heart','body','spirit')), fields jsonb not null default '[]', sort int default 0
);
create table public.entries (          -- the member's personal file. PRIVATE: admins see counts only (via view)
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  exercise_id text references exercises,
  data jsonb not null, created_at timestamptz default now()
);
create table public.plans (
  id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade,
  summary text, source text default 'paste', created_at timestamptz default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade,
  plan_id uuid references plans on delete set null, title text not null,
  axis text, due_at timestamptz, minutes int default 15, done_at timestamptz, note text
);
create table public.user_badges (
  user_id uuid references profiles on delete cascade, badge text, at timestamptz default now(), primary key(user_id,badge)
);
create table public.messages (         -- reminder templates + broadcasts (sent through OneSignal by an edge function)
  id uuid primary key default gen_random_uuid(), kind text, title text, body text,
  audience text, schedule text, active boolean default true, sent_at timestamptz, opened int
);
create function public.admin_member_activity()  -- counts only, never contents; admins only
returns table(id uuid, email text, name text, last_seen timestamptz, entries bigint, tasks_done_7d bigint)
language sql stable security definer set search_path=public as $$
  select p.id, p.email, p.name, p.last_seen,
    (select count(*) from entries e where e.user_id=p.id),
    (select count(*) from tasks t where t.user_id=p.id and t.done_at > now()-interval '7 days')
  from profiles p where is_admin() $$;

-- ---------- RLS ----------
alter table profiles enable row level security;       alter table entitlements enable row level security;
alter table payments enable row level security;       alter table products enable row level security;
alter table courses enable row level security;        alter table lessons enable row level security;
alter table lesson_progress enable row level security;alter table exercises enable row level security;
alter table entries enable row level security;        alter table plans enable row level security;
alter table tasks enable row level security;          alter table user_badges enable row level security;
alter table messages enable row level security;

create policy own_profile on profiles for select using (id=auth.uid() or is_admin());
create policy own_profile_upd on profiles for update using (id=auth.uid()) with check (role = (select role from profiles where id=auth.uid()));
create policy read_ents on entitlements for select using (user_id=auth.uid() or is_admin());
create policy admin_ents on entitlements for all using (is_admin()) with check (is_admin());
create policy read_catalog on products for select using (true);
create policy admin_catalog on products for all using (is_admin()) with check (is_admin());
create policy pay_insert on payments for insert with check (user_id=auth.uid());
create policy pay_read on payments for select using (user_id=auth.uid() or is_admin());
create policy pay_admin on payments for update using (is_admin());
create policy read_courses on courses for select using (published or is_admin());
create policy admin_courses on courses for all using (is_admin()) with check (is_admin());
-- lesson content only for people who own the course (free course = everyone signed in, via the sign-up grant)
create policy read_lessons on lessons for select using (is_admin() or has_access('course:'||course_id));
create policy admin_lessons on lessons for all using (is_admin()) with check (is_admin());
create policy own_progress on lesson_progress for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy read_ex on exercises for select using (auth.uid() is not null);
create policy admin_ex on exercises for all using (is_admin()) with check (is_admin());
-- entries: logging allowed in every state (free / active / read-only). Admin has NO policy here on purpose.
create policy own_entries on entries for all using (user_id=auth.uid()) with check (user_id=auth.uid());
-- plans: creating a plan needs an active protocol right
create policy own_plans_read on plans for select using (user_id=auth.uid());
create policy own_plans_new on plans for insert with check (user_id=auth.uid() and has_access('protocol'));
create policy own_tasks on tasks for select using (user_id=auth.uid());
create policy own_tasks_upd on tasks for update using (user_id=auth.uid());
create policy own_tasks_new on tasks for insert with check (user_id=auth.uid() and has_access('protocol'));
create policy own_tasks_del on tasks for delete using (user_id=auth.uid());
create policy own_badges on user_badges for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy admin_msgs on messages for all using (is_admin()) with check (is_admin());

-- ---------- curriculum (free course «إعادة التناغم مع الجسد») ----------
-- content source of truth today: shared/content-body.js (seeded into these tables on deploy)
alter table public.lessons add column if not exists no text;              -- «أولًا»، «سادسًا · ج1» …
alter table public.lessons add column if not exists exercise_ids text[] default '{}';
alter table public.lessons add column if not exists material_url text;
alter table public.lessons add column if not exists material2_url text;
alter table public.exercises add column if not exists lesson_id text references lessons;
alter table public.exercises add column if not exists note text;
create table public.achievements (       -- one-time milestones
  id text primary key, lesson_id text references lessons, icon text, title text not null,
  how jsonb not null,                      -- "manual" | {"entry":ex} | {"program":id} | {"rows":[ex,field,n]} | "course"
  sort int default 0
);
create table public.user_achievements (
  user_id uuid references profiles on delete cascade, achievement_id text references achievements,
  at timestamptz default now(), primary key(user_id, achievement_id)
);
create table public.programs (           -- practices with a fixed duration → tasks
  id text primary key, lesson_id text references lessons, title text not null, days int not null,
  times text[] not null, minutes int default 5, axis text, body text, how text, uses_exercise text references exercises
);
create table public.program_runs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade,
  program_id text references programs, times text[], started_at timestamptz default now(), stopped_at timestamptz
);
alter table public.tasks add column if not exists run_id uuid references program_runs on delete cascade;
alter table public.tasks add column if not exists program_id text references programs;
create table public.reminders (          -- open-ended practices → «تذكّر» + one push a day (unlocked by lesson_progress)
  id text primary key, lesson_id text references lessons, text text not null, sub text,
  cond text, optional boolean default false, sort int default 0
);
create table public.user_reminder_off (  -- member switched a reminder off
  user_id uuid references profiles on delete cascade, reminder_id text references reminders, primary key(user_id, reminder_id)
);
alter table achievements enable row level security; alter table user_achievements enable row level security;
alter table programs enable row level security;     alter table program_runs enable row level security;
alter table reminders enable row level security;    alter table user_reminder_off enable row level security;
create policy read_ach on achievements for select using (auth.uid() is not null);
create policy admin_ach on achievements for all using (is_admin()) with check (is_admin());
create policy own_ach on user_achievements for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy read_prog on programs for select using (auth.uid() is not null);
create policy admin_prog on programs for all using (is_admin()) with check (is_admin());
create policy own_runs on program_runs for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy read_rem on reminders for select using (auth.uid() is not null);
create policy admin_rem on reminders for all using (is_admin()) with check (is_admin());
create policy own_rem_off on user_reminder_off for all using (user_id=auth.uid()) with check (user_id=auth.uid());
-- free-course practices are part of the free course: their tasks don't need a protocol subscription (AI plans still do)
drop policy own_tasks_new on tasks;
create policy own_tasks_new on tasks for insert with check (user_id=auth.uid() and (has_access('protocol') or program_id is not null));

create trigger after_signup after insert on auth.users for each row execute function public.on_new_user();

-- Edge functions (next step): ical/<token>.ics (reads tasks by ical_token), easykash-webhook (calls grant_product),
-- onesignal-dispatch (scheduled reminders), expiry-notice (7 days before protocol ends).
