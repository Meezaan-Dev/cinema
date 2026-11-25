export type StreamingPlatformId = 'netflix' | 'disney' | 'prime' | 'apple'

export interface StreamingPlatform {
  id: StreamingPlatformId
  name: string
  providerId: string
}

export const STREAMING_PLATFORMS: Record<StreamingPlatformId, StreamingPlatform> = {
  netflix: { id: 'netflix', name: 'Netflix', providerId: '8' },
  disney: { id: 'disney', name: 'Disney+', providerId: '337' },
  prime: { id: 'prime', name: 'Prime Video', providerId: '9|119' },
  apple: { id: 'apple', name: 'Apple TV+', providerId: '350' },
}

export const STREAMING_PLATFORM_LIST: StreamingPlatform[] = Object.values(STREAMING_PLATFORMS)

export function isStreamingPlatformId(id: string): id is StreamingPlatformId {
  return Object.prototype.hasOwnProperty.call(STREAMING_PLATFORMS, id)
}

export function getPlatformProviderId(id: string | null | undefined): string | undefined {
  return id && isStreamingPlatformId(id) ? STREAMING_PLATFORMS[id].providerId : undefined
}
