export type TmdbMovie = {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  media_type?: 'movie' | 'tv'
  genre_ids?: number[]
}

export type TmdbGenre = {
  id: number
  name: string
}

export type TmdbPagedResponse<T> = {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export type TmdbMovieDetails = TmdbMovie & {
  runtime: number | null
  genres: TmdbGenre[]
  tagline: string
  status: string
}

export type TmdbSeason = {
  id: number
  name: string
  overview: string
  poster_path: string | null
  air_date: string
  episode_count: number
  season_number: number
}

export type TmdbSeriesDetails = {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genres: TmdbGenre[]
  status: string
  number_of_seasons: number
  number_of_episodes: number
  seasons: TmdbSeason[]
  media_type: 'tv'
}

export type TmdbCastMember = {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export type TmdbCredits = {
  id: number
  cast: TmdbCastMember[]
}

export type TmdbVideo = {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export type TmdbVideos = {
  id: number
  results: TmdbVideo[]
}
