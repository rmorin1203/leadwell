-- LeadWell: The Difficult Conversations Lab — Supabase schema
-- Run in the Supabase SQL editor. Demo mode does not need any of this.

create type app_role as enum ('learner', 'admin');
create type sim_mode as enum ('practice', 'assessment');
create type difficulty as enum ('beginner', 'intermediate', 'advanced');

-- Users -----------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  job_title text,
  role app_role not null default 'learner',
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Content (JSON-driven; editable by admins) -----------------------------------
create table employee_personas (
  id text primary key,
  definition jsonb not null,            -- matches the Persona type
  updated_at timestamptz not null default now()
);

create table scenarios (
  id text primary key,
  title text not null,
  difficulty difficulty not null,
  status text not null check (status in ('available', 'upcoming', 'draft')),
  estimated_minutes int not null,
  definition jsonb not null,            -- full Scenario JSON: nodes, options, feedback, outcomes
  version int not null default 1,
  updated_at timestamptz not null default now()
);

-- Normalised views of branching content, for analytics on decisions.
create view scenario_branches as
  select s.id as scenario_id, n.key as node_id, n.value->>'label' as label
  from scenarios s, jsonb_each(s.definition->'nodes') n;

create view decision_options as
  select s.id as scenario_id, n.key as node_id, o->>'id' as option_id, o->>'quality' as quality, o->>'approach' as approach
  from scenarios s, jsonb_each(s.definition->'nodes') n, jsonb_array_elements(n.value->'options') o;

-- Learner records -------------------------------------------------------------
create table simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  scenario_id text not null references scenarios,
  mode sim_mode not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  decisions jsonb not null default '[]',        -- DecisionRecord[]
  outcome_id text,
  overall_score int,
  competency_scores jsonb,                      -- { competencyId: 0-100 }
  final_trust jsonb
);

-- One row per decision, written by trigger, for "most frequently selected" analytics.
create table feedback_records (
  id bigserial primary key,
  attempt_id uuid not null references simulation_attempts on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  scenario_id text not null,
  node_id text not null,
  option_id text not null,
  created_at timestamptz not null default now()
);

create table competency_scores (
  attempt_id uuid not null references simulation_attempts on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  competency text not null,
  score int not null check (score between 0 and 100),
  mode sim_mode not null,
  recorded_at timestamptz not null default now(),
  primary key (attempt_id, competency)
);

create table lesson_results (
  user_id uuid not null references profiles on delete cascade,
  module_id text not null references scenarios,
  completed_at timestamptz not null default now(),
  correct int not null,
  total int not null,
  primary key (user_id, module_id)
);

create table reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  scenario_id text references scenarios,
  attempt_id uuid references simulation_attempts on delete set null,
  prompt text not null,
  body text not null,
  commitment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security ----------------------------------------------------------
alter table profiles enable row level security;
alter table scenarios enable row level security;
alter table employee_personas enable row level security;
alter table simulation_attempts enable row level security;
alter table feedback_records enable row level security;
alter table competency_scores enable row level security;
alter table reflections enable row level security;
alter table lesson_results enable row level security;

create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid() and role = 'learner');
create policy "admins read profiles" on profiles for select using (is_admin());

create policy "content readable" on scenarios for select using (auth.role() = 'authenticated');
create policy "admins edit content" on scenarios for all using (is_admin()) with check (is_admin());
create policy "personas readable" on employee_personas for select using (auth.role() = 'authenticated');
create policy "admins edit personas" on employee_personas for all using (is_admin()) with check (is_admin());

create policy "own attempts" on simulation_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins read attempts" on simulation_attempts for select using (is_admin());
create policy "own decisions" on feedback_records for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins read decisions" on feedback_records for select using (is_admin());
create policy "own scores" on competency_scores for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins read scores" on competency_scores for select using (is_admin());

create policy "own lessons" on lesson_results for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Reflections are private: owner only. There is deliberately NO admin policy.
create policy "own reflections only" on reflections for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Aggregate view for administrators: counts only, never reflection text.
-- Runs as the view owner (bypassing the owner-only policy) but returns rows only to admins.
create view admin_reflection_counts as
  select scenario_id, count(*) as reflection_count from reflections where is_admin() group by scenario_id;
revoke all on admin_reflection_counts from anon;
