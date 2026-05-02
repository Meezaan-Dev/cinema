import type { TmdbGenre } from '@/types/tmdb'

type SearchFiltersProps = {
  genres: TmdbGenre[]
  genre: string
  year: string
  minRating: string
  sortBy: string
  onChange: (filters: { genre?: string; year?: string; minRating?: string; sortBy?: string }) => void
}

const sortOptions = [
  { value: 'popularity.desc', label: 'Popularity' },
  { value: 'vote_average.desc', label: 'Rating' },
  { value: 'primary_release_date.desc', label: 'Release date' },
]

export function SearchFilters({ genres, genre, year, minRating, sortBy, onChange }: SearchFiltersProps) {
  return (
    <div className="grid gap-3 rounded-3xl border border-white/[0.07] bg-white/[0.045] p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="space-y-2 text-sm font-medium text-slate-300">
        <span>Genre</span>
        <select className="field" value={genre} onChange={(event) => onChange({ genre: event.target.value })}>
          <option value="">Any genre</option>
          {genres.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium text-slate-300">
        <span>Year</span>
        <input className="field" inputMode="numeric" maxLength={4} placeholder="2026" value={year} onChange={(event) => onChange({ year: event.target.value })} />
      </label>
      <label className="space-y-2 text-sm font-medium text-slate-300">
        <span>Minimum rating</span>
        <select className="field" value={minRating} onChange={(event) => onChange({ minRating: event.target.value })}>
          <option value="">Any rating</option>
          <option value="6">6+</option>
          <option value="7">7+</option>
          <option value="8">8+</option>
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium text-slate-300">
        <span>Sort by</span>
        <select className="field" value={sortBy} onChange={(event) => onChange({ sortBy: event.target.value })}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
