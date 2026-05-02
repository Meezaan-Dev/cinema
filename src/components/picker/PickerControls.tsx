import type { MoodKey } from '@/lib/constants'
import { moodProfiles } from '@/lib/constants'
import type { TmdbGenre } from '@/types/tmdb'
import type { WatchPreference } from '@/types/movie'

type PickerControlsProps = {
  genres: TmdbGenre[]
  mood: MoodKey
  genre: string
  maxRuntime: string
  minRating: string
  preference: WatchPreference
  onChange: (updates: Partial<{ mood: MoodKey; genre: string; maxRuntime: string; minRating: string; preference: WatchPreference }>) => void
}

export function PickerControls({ genres, mood, genre, maxRuntime, minRating, preference, onChange }: PickerControlsProps) {
  return (
    <div className="grid gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.045] p-4 backdrop-blur-2xl lg:grid-cols-5">
      <label className="space-y-2 text-sm font-medium text-slate-300">
        <span>Mood</span>
        <select className="field" value={mood} onChange={(event) => onChange({ mood: event.target.value as MoodKey })}>
          {Object.entries(moodProfiles).map(([key, profile]) => (
            <option key={key} value={key}>{profile.label}</option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium text-slate-300">
        <span>Genre</span>
        <select className="field" value={genre} onChange={(event) => onChange({ genre: event.target.value })}>
          <option value="">Mood decides</option>
          {genres.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium text-slate-300">
        <span>Max runtime</span>
        <select className="field" value={maxRuntime} onChange={(event) => onChange({ maxRuntime: event.target.value })}>
          <option value="">Any</option>
          <option value="95">95 min</option>
          <option value="120">2 hours</option>
          <option value="150">2.5 hours</option>
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium text-slate-300">
        <span>Min rating</span>
        <select className="field" value={minRating} onChange={(event) => onChange({ minRating: event.target.value })}>
          <option value="6.5">6.5+</option>
          <option value="7">7+</option>
          <option value="8">8+</option>
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium text-slate-300">
        <span>Preference</span>
        <select className="field" value={preference} onChange={(event) => onChange({ preference: event.target.value as WatchPreference })}>
          <option value="any">Any source</option>
          <option value="unwatched">Unwatched</option>
          <option value="watched">Rewatch</option>
        </select>
      </label>
    </div>
  )
}
