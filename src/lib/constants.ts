export const APP_NAME = 'Absolute Cinema'
export const WATCHLIST_STORAGE_KEY = 'absolute-cinema-watchlist'

export const moodProfiles = {
  electric: {
    label: 'Electric',
    query: '28|12|878',
    copy: 'High momentum, big swings, no quiet corners.',
  },
  cozy: {
    label: 'Cozy',
    query: '35|10749|16',
    copy: 'Warm, low-friction, and easy to sink into.',
  },
  haunted: {
    label: 'Haunted',
    query: '27|9648|53',
    copy: 'A little dread, a little mystery, lights turned low.',
  },
  thoughtful: {
    label: 'Thoughtful',
    query: '18|36|99',
    copy: 'Something with texture, patience, and an aftertaste.',
  },
} as const

export type MoodKey = keyof typeof moodProfiles
