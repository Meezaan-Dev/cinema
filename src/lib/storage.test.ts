import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  readLocalStorageValue,
  readWatchlistStorage,
  writeLocalStorageValue,
  writeWatchlistStorage,
} from '@/lib/storage'

function stubStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    }),
  }

  vi.stubGlobal('window', { localStorage: storage })
  return { storage, values }
}

describe('watchlist storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('migrates legacy arrays and deduplicates movie/tv keys', () => {
    const legacy = [
      {
        id: 1,
        title: 'Heat',
        posterPath: null,
        backdropPath: null,
        releaseDate: '1995-12-15',
        voteAverage: 8.2,
        genres: ['Crime'],
        addedAt: '2024-01-01T00:00:00.000Z',
        isWatched: false,
        isFavourite: false,
        mediaType: 'movie',
      },
      {
        id: 1,
        title: 'Heat duplicate',
        posterPath: null,
        backdropPath: null,
        releaseDate: '1995-12-15',
        voteAverage: 8.2,
        genres: ['Crime'],
        addedAt: '2024-01-01T00:00:00.000Z',
        isWatched: false,
        isFavourite: false,
        mediaType: 'movie',
      },
      {
        id: 1,
        title: 'Heat TV',
        posterPath: null,
        backdropPath: null,
        releaseDate: '1995-12-15',
        voteAverage: 8.2,
        genres: ['Crime'],
        addedAt: '2024-01-01T00:00:00.000Z',
        isWatched: false,
        isFavourite: false,
        mediaType: 'tv',
      },
    ]
    const { values } = stubStorage({ watchlist: JSON.stringify(legacy) })

    const movies = readWatchlistStorage('watchlist')

    expect(movies.map((movie) => `${movie.mediaType}:${movie.id}`)).toEqual(['movie:1', 'tv:1'])
    expect(JSON.parse(values.get('watchlist') ?? '{}')).toMatchObject({ version: 1 })
  })

  it('returns an empty list for corrupt JSON', () => {
    stubStorage({ watchlist: '{bad json' })

    expect(readWatchlistStorage('watchlist')).toEqual([])
  })

  it('keeps storage helper failures from escaping render flows', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('blocked')
      }),
      setItem: vi.fn(() => {
        throw new Error('quota')
      }),
    }
    vi.stubGlobal('window', { localStorage: storage })

    expect(readLocalStorageValue('x')).toBeNull()
    expect(writeLocalStorageValue('x', '1')).toBe(false)
    expect(() => writeWatchlistStorage('watchlist', [])).not.toThrow()
  })
})
