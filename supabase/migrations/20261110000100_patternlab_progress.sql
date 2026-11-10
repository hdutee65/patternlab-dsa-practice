create table if not exists public.patternlab_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  snapshot jsonb not null default '{"version":1,"progress":{"schemaVersion":2,"attempts":[],"categories":{},"challengeStates":{},"activity":[]},"drafts":{}}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.patternlab_progress enable row level security;

revoke all on table public.patternlab_progress from anon;
grant select, insert, update on table public.patternlab_progress to authenticated;

drop policy if exists "Users can read their own PatternLab progress" on public.patternlab_progress;
create policy "Users can read their own PatternLab progress"
  on public.patternlab_progress for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own PatternLab progress" on public.patternlab_progress;
create policy "Users can create their own PatternLab progress"
  on public.patternlab_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own PatternLab progress" on public.patternlab_progress;
create policy "Users can update their own PatternLab progress"
  on public.patternlab_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
