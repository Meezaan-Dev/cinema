create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text,
  invite_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlist_members (
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (watchlist_id, user_id)
);

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  overview text not null default '',
  poster_path text,
  backdrop_path text,
  release_date text not null default '',
  vote_average numeric not null default 0,
  genres text[] not null default '{}',
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (watchlist_id, media_type, tmdb_id)
);

create table if not exists public.watchlist_item_user_states (
  item_id uuid not null references public.watchlist_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'to_watch' check (status in ('to_watch', 'watched')),
  is_favourite boolean not null default false,
  personal_rating integer check (personal_rating between 1 and 5),
  notes text,
  hidden_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

create table if not exists public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('movie', 'tv')),
  tmdb_id integer not null,
  title text not null,
  summary jsonb not null,
  model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_type, tmdb_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger watchlists_set_updated_at
before update on public.watchlists
for each row execute function public.set_updated_at();

create trigger watchlist_items_set_updated_at
before update on public.watchlist_items
for each row execute function public.set_updated_at();

create trigger watchlist_item_user_states_set_updated_at
before update on public.watchlist_item_user_states
for each row execute function public.set_updated_at();

create trigger ai_summaries_set_updated_at
before update on public.ai_summaries
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.watchlist_members (watchlist_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (watchlist_id, user_id) do update
  set role = 'owner', left_at = null;

  return new;
end;
$$;

create trigger on_watchlist_created
after insert on public.watchlists
for each row execute function public.add_owner_membership();

create or replace function public.is_watchlist_member(list_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.watchlist_members member
    where member.watchlist_id = list_id
      and member.user_id = auth.uid()
      and member.left_at is null
  );
$$;

create or replace function public.current_watchlist_role(list_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select member.role
  from public.watchlist_members member
  where member.watchlist_id = list_id
    and member.user_id = auth.uid()
    and member.left_at is null
  limit 1;
$$;

create or replace function public.join_watchlist_by_token(invite_token_value text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  select id into target_id
  from public.watchlists
  where invite_token = invite_token_value;

  if target_id is null then
    raise exception 'invalid_invite';
  end if;

  insert into public.watchlist_members (watchlist_id, user_id, role)
  values (target_id, auth.uid(), 'editor')
  on conflict (watchlist_id, user_id) do update
  set
    role = case when public.watchlist_members.role = 'owner' then 'owner' else 'editor' end,
    left_at = null;

  return target_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_members enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.watchlist_item_user_states enable row level security;
alter table public.ai_summaries enable row level security;

create policy "Profiles are visible to themselves"
on public.profiles for select
using (id = auth.uid());

create policy "Users can insert their profile"
on public.profiles for insert
with check (id = auth.uid());

create policy "Users can update their profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Owners and members can read watchlists"
on public.watchlists for select
using (owner_id = auth.uid() or public.is_watchlist_member(id));

create policy "Users can create owned watchlists"
on public.watchlists for insert
with check (owner_id = auth.uid());

create policy "Owners can update watchlists"
on public.watchlists for update
using (public.current_watchlist_role(id) = 'owner')
with check (public.current_watchlist_role(id) = 'owner');

create policy "Owners can delete watchlists"
on public.watchlists for delete
using (public.current_watchlist_role(id) = 'owner');

create policy "Members can read memberships"
on public.watchlist_members for select
using (public.is_watchlist_member(watchlist_id) or user_id = auth.uid());

create policy "Members can read items"
on public.watchlist_items for select
using (public.is_watchlist_member(watchlist_id));

create policy "Owners and editors can add items"
on public.watchlist_items for insert
with check (public.current_watchlist_role(watchlist_id) in ('owner', 'editor'));

create policy "Owners and editors can refresh item snapshots"
on public.watchlist_items for update
using (public.current_watchlist_role(watchlist_id) in ('owner', 'editor'))
with check (public.current_watchlist_role(watchlist_id) in ('owner', 'editor'));

create policy "Only owners can remove shared items"
on public.watchlist_items for delete
using (public.current_watchlist_role(watchlist_id) = 'owner');

create policy "Users can read their item states"
on public.watchlist_item_user_states for select
using (user_id = auth.uid());

create policy "Users can create their item states"
on public.watchlist_item_user_states for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.watchlist_items item
    where item.id = item_id
      and public.is_watchlist_member(item.watchlist_id)
  )
);

create policy "Users can update their item states"
on public.watchlist_item_user_states for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their item states"
on public.watchlist_item_user_states for delete
using (user_id = auth.uid());

grant execute on function public.join_watchlist_by_token(text) to authenticated;
