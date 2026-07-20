import { describe, expect, it } from 'vitest'

import {
  buildImdbUrl,
  buildMagicLinkUrl,
  sanitizeDisplayText,
  sanitizeImdbId,
  sanitizeTmdbImagePath,
  sanitizeTmdbImageSize,
  sanitizeYoutubeKey,
} from '@/lib/sanitize'

describe('sanitize helpers', () => {
  it('accepts only valid TMDB image paths', () => {
    expect(sanitizeTmdbImagePath('/abc123.jpg')).toBe('/abc123.jpg')
    expect(sanitizeTmdbImagePath('https://evil.test/x.jpg')).toBeNull()
    expect(sanitizeTmdbImagePath('/../secret')).toBeNull()
    expect(sanitizeTmdbImagePath(null)).toBeNull()
  })

  it('whitelists TMDB image sizes', () => {
    expect(sanitizeTmdbImageSize('w780')).toBe('w780')
    expect(sanitizeTmdbImageSize('original')).toBe('original')
    expect(sanitizeTmdbImageSize('huge')).toBe('w500')
  })

  it('accepts only valid IMDb ids', () => {
    expect(sanitizeImdbId('tt0137523')).toBe('tt0137523')
    expect(sanitizeImdbId('nm0000158')).toBeNull()
    expect(sanitizeImdbId('tt0137523<script>')).toBeNull()
  })

  it('builds external links only from valid IMDb ids', () => {
    expect(buildImdbUrl('tt0137523')).toBe('https://www.imdb.com/title/tt0137523/')
    expect(buildMagicLinkUrl('tt0137523')).toBe('https://www.playimdb.com/title/tt0137523/')
    expect(buildImdbUrl('bad-id')).toBeUndefined()
  })

  it('accepts only valid YouTube keys', () => {
    expect(sanitizeYoutubeKey('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(sanitizeYoutubeKey('bad key!')).toBeNull()
  })

  it('normalizes display text', () => {
    expect(sanitizeDisplayText('  hello   world  ', 10)).toBe('hello worl')
  })
})
