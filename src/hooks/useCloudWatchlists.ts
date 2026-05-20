import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addMovieToCloudWatchlist,
  cloudWatchlistKeys,
  createCloudWatchlist,
  deleteCloudWatchlist,
  deleteCloudWatchlistItem,
  getCloudMoviePresence,
  getCloudWatchlistDetail,
  hideCloudItemForUser,
  importLocalMoviesToCloud,
  joinCloudWatchlist,
  listCloudWatchlists,
  saveCloudItemState,
} from '@/api/cloudWatchlists'
import { useAuth } from '@/hooks/useAuth'
import type { UserMovie } from '@/types/movie'
import type { CloudWatchlistItem, CloudWatchlistItemState, WatchlistMovieInput } from '@/types/watchlist'

export function useCloudWatchlists() {
  const { user, authConfigured } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.uid
  const query = useQuery({
    queryKey: cloudWatchlistKeys.lists(userId),
    queryFn: () => listCloudWatchlists(userId),
    enabled: Boolean(authConfigured && userId),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => createCloudWatchlist(name, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudWatchlistKeys.lists(userId) })
    },
  })

  const importMutation = useMutation({
    mutationFn: (movies: UserMovie[]) => importLocalMoviesToCloud(userId, movies),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudWatchlistKeys.lists(userId) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (watchlistId: string) => deleteCloudWatchlist(watchlistId, userId),
    onSuccess: (_data, watchlistId) => {
      queryClient.invalidateQueries({ queryKey: cloudWatchlistKeys.lists(userId) })
      queryClient.removeQueries({ queryKey: cloudWatchlistKeys.detail(watchlistId, userId) })
    },
  })
  const hasBlockingError = query.isError && !query.data

  return {
    ...query,
    error: createMutation.error ?? importMutation.error ?? deleteMutation.error ?? (hasBlockingError ? query.error : null),
    isError: query.isError || createMutation.isError || importMutation.isError || deleteMutation.isError,
    hasBlockingError,
    isRefreshing: query.isFetching && Boolean(query.data),
    createWatchlist: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    importLocalMovies: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    deleteWatchlist: deleteMutation.mutateAsync,
    deletingWatchlistId: deleteMutation.isPending ? deleteMutation.variables : undefined,
    isDeleting: deleteMutation.isPending,
  }
}

export function useCloudWatchlistDetail(watchlistId: string | undefined) {
  const { user, authConfigured } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.uid
  const query = useQuery({
    queryKey: cloudWatchlistKeys.detail(watchlistId, userId),
    queryFn: () => getCloudWatchlistDetail(watchlistId, userId),
    enabled: Boolean(authConfigured && userId && watchlistId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: cloudWatchlistKeys.detail(watchlistId, userId) })
    queryClient.invalidateQueries({ queryKey: cloudWatchlistKeys.lists(userId) })
  }

  const saveStateMutation = useMutation({
    mutationFn: ({ item, state }: { item: CloudWatchlistItem; state: Partial<CloudWatchlistItemState> }) => {
      const hasPersonalRating = Object.prototype.hasOwnProperty.call(state, 'personalRating')
      const hasNotes = Object.prototype.hasOwnProperty.call(state, 'notes')
      const hasHiddenAt = Object.prototype.hasOwnProperty.call(state, 'hiddenAt')

      return saveCloudItemState(item.id, userId, {
        itemId: item.id,
        userId: userId ?? '',
        status: state.status ?? item.state?.status ?? 'to_watch',
        isFavourite: state.isFavourite ?? item.state?.isFavourite ?? false,
        personalRating: hasPersonalRating ? state.personalRating : item.state?.personalRating,
        notes: hasNotes ? state.notes : item.state?.notes,
        hiddenAt: hasHiddenAt ? state.hiddenAt : item.state?.hiddenAt,
        updatedAt: item.state?.updatedAt ?? new Date().toISOString(),
      })
    },
    onSuccess: invalidate,
  })

  const hideMutation = useMutation({
    mutationFn: (item: CloudWatchlistItem) => hideCloudItemForUser(item, userId),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => deleteCloudWatchlistItem(itemId),
    onSuccess: invalidate,
  })

  const deleteWatchlistMutation = useMutation({
    mutationFn: () => deleteCloudWatchlist(watchlistId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudWatchlistKeys.lists(userId) })
      queryClient.removeQueries({ queryKey: cloudWatchlistKeys.detail(watchlistId, userId) })
    },
  })

  return {
    ...query,
    hasBlockingError: query.isError && !query.data,
    isRefreshing: query.isFetching && Boolean(query.data),
    saveState: saveStateMutation.mutateAsync,
    hideForMe: hideMutation.mutateAsync,
    removeGlobally: deleteMutation.mutateAsync,
    deleteWatchlist: deleteWatchlistMutation.mutateAsync,
    isDeletingWatchlist: deleteWatchlistMutation.isPending,
    isUpdating: saveStateMutation.isPending || hideMutation.isPending || deleteMutation.isPending,
  }
}

export function useAddToCloudWatchlist(movie: WatchlistMovieInput | null) {
  const { user, authConfigured } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.uid
  const presenceKey = movie
    ? cloudWatchlistKeys.presence(userId, movie.mediaType, movie.tmdbId)
    : cloudWatchlistKeys.presence(userId, 'movie', 0)
  const listsQuery = useQuery({
    queryKey: cloudWatchlistKeys.lists(userId),
    queryFn: () => listCloudWatchlists(userId),
    enabled: Boolean(authConfigured && userId && movie),
  })
  const presenceQuery = useQuery({
    queryKey: presenceKey,
    queryFn: () => getCloudMoviePresence(userId, movie as WatchlistMovieInput),
    enabled: Boolean(authConfigured && userId && movie),
  })

  const addMutation = useMutation({
    mutationFn: ({ watchlistId, targetMovie }: { watchlistId: string; targetMovie: WatchlistMovieInput }) =>
      addMovieToCloudWatchlist(watchlistId, targetMovie, userId),
    onSuccess: (_item, variables) => {
      queryClient.setQueryData<Set<string>>(presenceKey, (current) => {
        const next = new Set(current ?? [])
        next.add(variables.watchlistId)
        return next
      })
      queryClient.invalidateQueries({ queryKey: cloudWatchlistKeys.lists(userId) })
      queryClient.invalidateQueries({ queryKey: cloudWatchlistKeys.detail(variables.watchlistId, userId) })
      queryClient.invalidateQueries({ queryKey: presenceKey })
    },
  })

  const createMutation = useMutation({
    mutationFn: async ({ name, targetMovie }: { name: string; targetMovie: WatchlistMovieInput }) => {
      const list = await createCloudWatchlist(name, userId)
      await addMovieToCloudWatchlist(list.id, targetMovie, userId)
      return list
    },
    onSuccess: (list) => {
      queryClient.setQueryData<Set<string>>(presenceKey, (current) => {
        const next = new Set(current ?? [])
        next.add(list.id)
        return next
      })
      queryClient.invalidateQueries({ queryKey: cloudWatchlistKeys.lists(userId) })
      queryClient.invalidateQueries({ queryKey: presenceKey })
    },
  })
  const hasBlockingError = (listsQuery.isError && !listsQuery.data) || (presenceQuery.isError && !presenceQuery.data)

  return {
    lists: listsQuery.data ?? [],
    isLoading: listsQuery.isLoading || presenceQuery.isLoading,
    isRefreshing: listsQuery.isFetching || presenceQuery.isFetching,
    error: addMutation.error ?? createMutation.error ?? (hasBlockingError ? listsQuery.error ?? presenceQuery.error : null),
    hasBlockingError,
    presence: presenceQuery.data ?? new Set<string>(),
    addToList: addMutation.mutateAsync,
    createListWithMovie: createMutation.mutateAsync,
    isSaving: addMutation.isPending || createMutation.isPending,
  }
}

export function useJoinCloudWatchlist(inviteToken: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.uid

  return useMutation({
    mutationFn: () => joinCloudWatchlist(inviteToken ?? '', userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudWatchlistKeys.lists(userId) })
    },
  })
}
