import { AppError } from '@/lib/errors'
import { getSupabaseClient } from '@/lib/supabaseClient'
import type { UserMovie } from '@/types/movie'
import {
  type CloudWatchlist,
  type CloudWatchlistDetail,
  type CloudWatchlistItem,
  type CloudWatchlistItemState,
  type WatchStatus,
  type WatchlistMovieInput,
  type WatchlistRole,
  toWatchlistMovieInput,
} from '@/types/watchlist'

type WatchlistRow = {
  id: string
  name: string
  description: string | null
  owner_id: string
  invite_token: string
  created_at: string
  updated_at: string
}

type MembershipRow = {
  watchlist_id: string
  user_id: string
  role: WatchlistRole
  joined_at: string
  left_at: string | null
}

type ItemRow = {
  id: string
  watchlist_id: string
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genres: string[] | null
  added_by: string | null
  created_at: string
  updated_at: string
}

type StateRow = {
  item_id: string
  user_id: string
  status: WatchStatus
  is_favourite: boolean
  personal_rating: number | null
  notes: string | null
  hidden_at: string | null
  updated_at: string
}

function requireUser(userId: string | undefined) {
  if (!userId) {
    throw new AppError('auth', 'Sign in with Google to use shared watchlists.')
  }

  return userId
}

function toCloudError(error: { message?: string } | null, fallback: string) {
  if (!error) return
  throw new AppError('http', error.message ? `${fallback} ${error.message}` : fallback)
}

function sanitizeListName(name: string) {
  const cleanName = name.trim().replace(/\s+/g, ' ').slice(0, 80)
  if (!cleanName) {
    throw new AppError('invalid-data', 'Give this watchlist a name first.')
  }

  return cleanName
}

function mapWatchlist(row: WatchlistRow, role: WatchlistRole, itemCount = 0): CloudWatchlist {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    inviteToken: row.invite_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role,
    itemCount,
  }
}

function mapState(row: StateRow): CloudWatchlistItemState {
  return {
    itemId: row.item_id,
    userId: row.user_id,
    status: row.status,
    isFavourite: row.is_favourite,
    personalRating: row.personal_rating ?? undefined,
    notes: row.notes ?? undefined,
    hiddenAt: row.hidden_at ?? undefined,
    updatedAt: row.updated_at,
  }
}

function mapItem(row: ItemRow, state?: CloudWatchlistItemState): CloudWatchlistItem {
  return {
    id: row.id,
    watchlistId: row.watchlist_id,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    title: row.title,
    overview: row.overview,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    releaseDate: row.release_date,
    voteAverage: Number(row.vote_average),
    genres: row.genres ?? [],
    addedBy: row.added_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    state,
  }
}

function itemPayload(watchlistId: string, movie: WatchlistMovieInput, userId: string) {
  return {
    watchlist_id: watchlistId,
    tmdb_id: movie.tmdbId,
    media_type: movie.mediaType,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.posterPath,
    backdrop_path: movie.backdropPath,
    release_date: movie.releaseDate,
    vote_average: movie.voteAverage,
    genres: movie.genres,
    added_by: userId,
  }
}

function statePayload(itemId: string, userId: string, state: Partial<CloudWatchlistItemState>) {
  return {
    item_id: itemId,
    user_id: userId,
    status: state.status ?? 'to_watch',
    is_favourite: state.isFavourite ?? false,
    personal_rating: state.personalRating ?? null,
    notes: state.notes ?? null,
    hidden_at: state.hiddenAt ?? null,
  }
}

export const cloudWatchlistKeys = {
  lists: (userId?: string) => ['cloud-watchlists', userId] as const,
  detail: (watchlistId?: string, userId?: string) => ['cloud-watchlist', watchlistId, userId] as const,
  presence: (userId: string | undefined, mediaType: string, tmdbId: number) =>
    ['cloud-watchlist-presence', userId, mediaType, tmdbId] as const,
}

export async function listCloudWatchlists(userId: string | undefined): Promise<CloudWatchlist[]> {
  const currentUserId = requireUser(userId)
  const client = getSupabaseClient()
  const { data: memberships, error: membershipError } = await client
    .from('watchlist_members')
    .select('watchlist_id,user_id,role,joined_at,left_at')
    .eq('user_id', currentUserId)
    .is('left_at', null)

  toCloudError(membershipError, 'Could not load your watchlists.')

  const activeMemberships = (memberships ?? []) as MembershipRow[]
  const watchlistIds = activeMemberships.map((membership) => membership.watchlist_id)
  if (watchlistIds.length === 0) return []

  const { data: watchlists, error: watchlistError } = await client
    .from('watchlists')
    .select('id,name,description,owner_id,invite_token,created_at,updated_at')
    .in('id', watchlistIds)
    .order('updated_at', { ascending: false })

  toCloudError(watchlistError, 'Could not load watchlist details.')

  const { data: items, error: itemsError } = await client
    .from('watchlist_items')
    .select('id,watchlist_id')
    .in('watchlist_id', watchlistIds)

  toCloudError(itemsError, 'Could not load watchlist counts.')

  const roleByList = new Map(activeMemberships.map((membership) => [membership.watchlist_id, membership.role]))
  const counts = new Map<string, number>()
  for (const item of items ?? []) {
    const watchlistId = (item as { watchlist_id: string }).watchlist_id
    counts.set(watchlistId, (counts.get(watchlistId) ?? 0) + 1)
  }

  return ((watchlists ?? []) as WatchlistRow[]).map((watchlist) =>
    mapWatchlist(watchlist, roleByList.get(watchlist.id) ?? 'editor', counts.get(watchlist.id) ?? 0),
  )
}

export async function createCloudWatchlist(name: string, userId: string | undefined) {
  const currentUserId = requireUser(userId)
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('watchlists')
    .insert({ name: sanitizeListName(name), owner_id: currentUserId })
    .select('id,name,description,owner_id,invite_token,created_at,updated_at')
    .single()

  toCloudError(error, 'Could not create the watchlist.')

  return mapWatchlist(data as WatchlistRow, 'owner')
}

export async function getCloudWatchlistDetail(
  watchlistId: string | undefined,
  userId: string | undefined,
): Promise<CloudWatchlistDetail> {
  const currentUserId = requireUser(userId)
  if (!watchlistId) {
    throw new AppError('not-found', 'Choose a watchlist first.')
  }

  const client = getSupabaseClient()
  const { data: watchlist, error: watchlistError } = await client
    .from('watchlists')
    .select('id,name,description,owner_id,invite_token,created_at,updated_at')
    .eq('id', watchlistId)
    .single()

  toCloudError(watchlistError, 'Could not load this watchlist.')

  const { data: membership, error: membershipError } = await client
    .from('watchlist_members')
    .select('watchlist_id,user_id,role,joined_at,left_at')
    .eq('watchlist_id', watchlistId)
    .eq('user_id', currentUserId)
    .is('left_at', null)
    .single()

  toCloudError(membershipError, 'You are not a member of this watchlist.')

  const { data: itemRows, error: itemError } = await client
    .from('watchlist_items')
    .select(
      'id,watchlist_id,tmdb_id,media_type,title,overview,poster_path,backdrop_path,release_date,vote_average,genres,added_by,created_at,updated_at',
    )
    .eq('watchlist_id', watchlistId)
    .order('created_at', { ascending: false })

  toCloudError(itemError, 'Could not load watchlist titles.')

  const items = (itemRows ?? []) as ItemRow[]
  const itemIds = items.map((item) => item.id)
  const statesByItem = new Map<string, CloudWatchlistItemState>()

  if (itemIds.length > 0) {
    const { data: stateRows, error: stateError } = await client
      .from('watchlist_item_user_states')
      .select('item_id,user_id,status,is_favourite,personal_rating,notes,hidden_at,updated_at')
      .eq('user_id', currentUserId)
      .in('item_id', itemIds)

    toCloudError(stateError, 'Could not load your watch state.')

    for (const state of (stateRows ?? []) as StateRow[]) {
      statesByItem.set(state.item_id, mapState(state))
    }
  }

  const visibleItems = items
    .map((item) => mapItem(item, statesByItem.get(item.id)))
    .filter((item) => !item.state?.hiddenAt)

  return {
    ...mapWatchlist(watchlist as WatchlistRow, (membership as MembershipRow).role, visibleItems.length),
    items: visibleItems,
  }
}

export async function getCloudMoviePresence(
  userId: string | undefined,
  movie: WatchlistMovieInput,
): Promise<Set<string>> {
  const currentUserId = requireUser(userId)
  const client = getSupabaseClient()
  const lists = await listCloudWatchlists(currentUserId)
  const watchlistIds = lists.map((list) => list.id)
  if (watchlistIds.length === 0) return new Set()

  const { data, error } = await client
    .from('watchlist_items')
    .select('watchlist_id')
    .in('watchlist_id', watchlistIds)
    .eq('tmdb_id', movie.tmdbId)
    .eq('media_type', movie.mediaType)

  toCloudError(error, 'Could not check where this title is saved.')

  return new Set((data ?? []).map((item) => (item as { watchlist_id: string }).watchlist_id))
}

export async function addMovieToCloudWatchlist(
  watchlistId: string,
  movie: WatchlistMovieInput | UserMovie,
  userId: string | undefined,
) {
  const currentUserId = requireUser(userId)
  const client = getSupabaseClient()
  const watchlistMovie = toWatchlistMovieInput(movie)
  const { data, error } = await client
    .from('watchlist_items')
    .upsert(itemPayload(watchlistId, watchlistMovie, currentUserId), {
      onConflict: 'watchlist_id,media_type,tmdb_id',
    })
    .select(
      'id,watchlist_id,tmdb_id,media_type,title,overview,poster_path,backdrop_path,release_date,vote_average,genres,added_by,created_at,updated_at',
    )
    .single()

  toCloudError(error, 'Could not add this title.')

  const item = mapItem(data as ItemRow)
  await saveCloudItemState(item.id, currentUserId, {
    itemId: item.id,
    userId: currentUserId,
    status: 'to_watch',
    isFavourite: false,
    hiddenAt: undefined,
    updatedAt: new Date().toISOString(),
  })

  return item
}

export async function saveCloudItemState(
  itemId: string,
  userId: string | undefined,
  state: Partial<CloudWatchlistItemState>,
) {
  const currentUserId = requireUser(userId)
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('watchlist_item_user_states')
    .upsert(statePayload(itemId, currentUserId, state), {
      onConflict: 'item_id,user_id',
    })
    .select('item_id,user_id,status,is_favourite,personal_rating,notes,hidden_at,updated_at')
    .single()

  toCloudError(error, 'Could not update your watch state.')

  return mapState(data as StateRow)
}

export async function hideCloudItemForUser(item: CloudWatchlistItem, userId: string | undefined) {
  return saveCloudItemState(item.id, userId, {
    itemId: item.id,
    userId: userId ?? '',
    status: item.state?.status ?? 'to_watch',
    isFavourite: item.state?.isFavourite ?? false,
    personalRating: item.state?.personalRating,
    notes: item.state?.notes,
    hiddenAt: new Date().toISOString(),
    updatedAt: item.state?.updatedAt ?? new Date().toISOString(),
  })
}

export async function deleteCloudWatchlistItem(itemId: string) {
  const client = getSupabaseClient()
  const { error } = await client.from('watchlist_items').delete().eq('id', itemId)
  toCloudError(error, 'Could not remove this title for everyone.')
}

export async function joinCloudWatchlist(inviteToken: string, userId: string | undefined) {
  requireUser(userId)
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('join_watchlist_by_token', {
    invite_token_value: inviteToken,
  })

  toCloudError(error, 'Could not join this watchlist.')

  if (typeof data !== 'string') {
    throw new AppError('invalid-data', 'The invite link returned an unexpected response.')
  }

  return data
}

export async function importLocalMoviesToCloud(userId: string | undefined, movies: UserMovie[]) {
  const watchlist = await createCloudWatchlist('Imported from this browser', userId)

  for (const movie of movies) {
    await addMovieToCloudWatchlist(watchlist.id, movie, userId)
  }

  return watchlist
}
