export const cinemaBranches = [
  { id: 'sk:blue-route', name: 'Ster-Kinekor Blue Route', siteUrl: 'https://www.sterkinekor.com/program?location=blue-route' },
  { id: 'nm:22', name: 'Nu Metro Canal Walk', siteUrl: 'https://numetro.co.za/now-showing/' },
  { id: 'nm:45', name: 'Nu Metro Cavendish Square', siteUrl: 'https://numetro.co.za/now-showing/' },
] as const

export function allowedDates(now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(`${today}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + offset)
    return date.toISOString().slice(0, 10)
  })
}

export function cinemaDateSelection(activeDate: string | undefined, now = new Date()) {
  const dates = allowedDates(now)
  return { dates, activeDate: activeDate && dates.includes(activeDate) ? activeDate : dates[0]! }
}

export type CinemaId = (typeof cinemaBranches)[number]['id']
export type CinemaStatus = 'playing' | 'none' | 'uncertain' | 'unavailable'
export type Showtime = { time: string; format: string }
export type CinemaResult = {
  id: CinemaId
  status: CinemaStatus
  showtimes: Showtime[]
  bookingUrl: string
  checkedAt: string
}

export type CinemaResponse = { date: string; results: CinemaResult[] }
