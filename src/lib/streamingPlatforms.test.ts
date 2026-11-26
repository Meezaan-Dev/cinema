import { describe, expect, it } from 'vitest'

import {
  STREAMING_PLATFORMS,
  STREAMING_PLATFORM_LIST,
  getPlatformProviderId,
  isStreamingPlatformId,
} from './streamingPlatforms'

describe('streamingPlatforms', () => {
  it('contains the 4 required streaming platforms', () => {
    expect(STREAMING_PLATFORMS.netflix).toBeDefined()
    expect(STREAMING_PLATFORMS.disney).toBeDefined()
    expect(STREAMING_PLATFORMS.prime).toBeDefined()
    expect(STREAMING_PLATFORMS.apple).toBeDefined()
    expect(STREAMING_PLATFORM_LIST).toHaveLength(4)
  })

  it('assigns correct TMDB provider IDs', () => {
    expect(STREAMING_PLATFORMS.netflix.providerId).toBe('8')
    expect(STREAMING_PLATFORMS.disney.providerId).toBe('337')
    expect(STREAMING_PLATFORMS.prime.providerId).toBe('9|119')
    expect(STREAMING_PLATFORMS.apple.providerId).toBe('350')
  })

  it('identifies valid and invalid streaming platform IDs', () => {
    expect(isStreamingPlatformId('netflix')).toBe(true)
    expect(isStreamingPlatformId('disney')).toBe(true)
    expect(isStreamingPlatformId('prime')).toBe(true)
    expect(isStreamingPlatformId('apple')).toBe(true)
    expect(isStreamingPlatformId('hbo')).toBe(false)
    expect(isStreamingPlatformId('__proto__')).toBe(false)
    expect(isStreamingPlatformId('')).toBe(false)
  })

  it('retrieves provider ID correctly', () => {
    expect(getPlatformProviderId('netflix')).toBe('8')
    expect(getPlatformProviderId('disney')).toBe('337')
    expect(getPlatformProviderId('unknown')).toBeUndefined()
    expect(getPlatformProviderId('')).toBeUndefined()
  })

})
