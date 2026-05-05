drop policy if exists "Members can read watchlists" on public.watchlists;
drop policy if exists "Owners and members can read watchlists" on public.watchlists;

create policy "Owners and members can read watchlists"
on public.watchlists for select
using (owner_id = auth.uid() or public.is_watchlist_member(id));
