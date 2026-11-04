import { describe, expect, it } from 'vitest'

import { matchMovie, parseCinemaRequest, parseNuDates, parseNuMovies, parseNuSessions, parseSterKinekor } from '../../api/cinemaData'
import { allowedDates, cinemaDateSelection } from '../types/cinema'

const now = new Date('2026-11-01T10:00:00Z')

describe('cinema request', () => {
  it('accepts only the three fixed branches and a Cape Town date within seven days', () => {
    const dates = allowedDates(now)
    expect(dates).toHaveLength(7)
    expect(parseCinemaRequest(`/api/cinema-showtimes?movieId=42&date=${dates[6]}&cinemas=sk:blue-route,nm:22,nm:45`, now)?.cinemas).toHaveLength(3)
    expect(parseCinemaRequest(`/api/cinema-showtimes?movieId=42&date=${dates[0]}&cinemas=nm:99`, now)).toBeNull()
    expect(parseCinemaRequest(`/api/cinema-showtimes?movieId=42&date=${dates[0]}&cinemas=nm:22,nm:22`, now)).toBeNull()
    expect(parseCinemaRequest(`/api/cinema-showtimes?movieId=42&date=2026-11-08&cinemas=nm:22`, now)).toBeNull()
    expect(parseCinemaRequest(`/api/cinema-showtimes?movieId=0&date=${dates[0]}&cinemas=nm:22`, now)).toBeNull()
  })

  it('moves the seven-day window at Cape Town midnight and preserves valid selections', () => {
    const before = new Date('2026-11-01T21:59:00Z')
    const after = new Date('2026-11-01T22:00:00Z')
    const initial = cinemaDateSelection(undefined, before)
    expect(initial.activeDate).toBe('2026-11-01')
    expect(cinemaDateSelection(initial.activeDate, after).activeDate).toBe('2026-11-02')
    expect(cinemaDateSelection('2026-11-04', after).activeDate).toBe('2026-11-04')
    expect(cinemaDateSelection('2026-11-08', after).dates.at(-1)).toBe('2026-11-08')
  })
})

describe('conservative film matching', () => {
  it('accepts exact normalized or original titles and rejects a runtime conflict', () => {
    expect(matchMovie({ title: 'Spider-Man: Brand New Day', runtime: 145 }, [{ title: 'Spider Man Brand New Day', runtime: 145 }])).toEqual({ status: 'matched', index: 0 })
    expect(matchMovie({ title: 'My Title', originalTitle: 'André Rieu', runtime: 120 }, [{ title: 'Andre Rieu', runtime: 120 }])).toEqual({ status: 'matched', index: 0 })
    expect(matchMovie({ title: 'Clayface', runtime: 108 }, [{ title: 'Clayface', runtime: 190 }])).toEqual({ status: 'uncertain' })
    expect(matchMovie({ title: 'Clayface' }, [{ title: 'Clayface: Extended Cut' }])).toEqual({ status: 'uncertain' })
    expect(matchMovie({ title: 'Clayface' }, [{ title: 'Wildwood' }])).toEqual({ status: 'none' })
  })
})

describe('public source parsing', () => {
  it('reads a Ster-Kinekor film card without using a session booking URL', () => {
    const html = `<div class="program-movie-card-container"><a class="movieDetailsCard__title" href="/f/clayface/750">Clayface</a><div class="movieDetailsCard__info">1h 48m</div><div class="gr-showtimes__container"><div class="gr-showtimes__bordered-text">2D</div><a class="showtime_card" stophref="/showtime/17-1"><span class="text-nowrap">6:45 PM</span></a></div></div>`
    expect(parseSterKinekor(html, { title: 'Clayface', runtime: 108 })).toEqual({ status: 'playing', showtimes: [{ time: '18:45', format: '2D' }], bookingUrl: 'https://www.sterkinekor.com/f/clayface/750' })
    expect(parseSterKinekor(html, { title: 'Other Movie' }).status).toBe('none')
    expect(parseSterKinekor('<div class="program-empty-section">Bookings soon</div>', { title: 'Clayface' }).status).toBe('none')
    expect(() => parseSterKinekor('<html></html>', { title: 'Clayface' })).toThrow()
  })

  it('reads Nu Metro dates, session times, and formats', () => {
    expect(parseNuMovies([{ id: '7025', title: 'Spider-Man', running_time: '145' }, { id: 'bad', title: 'Bad' }])).toHaveLength(1)
    expect(parseNuDates([{ '2026-11-01': 'Sun 01 Nov' }, { '2026-11-02': 'Mon 02 Nov' }])).toEqual(['2026-11-01', '2026-11-02'])
    expect(parseNuSessions([{ ',**,2D': { '536471': ['Cinema 10', '19:30:00', true] } }, { 'Scene VIP,3D': { '536472': ['Cinema 7', '17:00:00', true] } }])).toEqual([
      { time: '17:00', format: 'Scene VIP · 3D' },
      { time: '19:30', format: '2D' },
    ])
    expect(() => parseNuSessions({ error: true })).toThrow()
    expect(() => parseNuSessions([{ error: 'unavailable' }])).toThrow('Nu Metro session format changed')
    expect(parseNuSessions([])).toEqual([])
    expect(parseNuSessions([{ '2D': {} }])).toEqual([])
  })
})
