export type StreamingPlatformId = 'netflix' | 'disney' | 'prime' | 'apple'

export interface StreamingPlatform {
  id: StreamingPlatformId
  name: string
  shortName: string
  providerId: string
  badgeText: string
  tagline: string
  heroKicker: string
  accentColor: string
  borderClass: string
  bgGlowClass: string
  badgeClass: string
  activeTabClass: string
  logoUrl: string
  iconUrl: string
}

export const STREAMING_PLATFORMS: Record<StreamingPlatformId, StreamingPlatform> = {
  netflix: {
    id: 'netflix',
    name: 'Netflix',
    shortName: 'Netflix',
    providerId: '8',
    badgeText: 'N',
    tagline: 'Stream award-winning originals, global phenomena, and binge-worthy cinema.',
    heroKicker: 'Now screening on Netflix',
    accentColor: '#E50914',
    borderClass: 'border-red-500/30 hover:border-red-500/60',
    bgGlowClass: 'from-red-950/40 via-[#071326] to-[#071326]',
    badgeClass: 'bg-red-600 text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]',
    activeTabClass: 'border-red-500 bg-red-950/40 text-white shadow-[0_0_20px_rgba(229,9,20,0.25)]',
    logoUrl: '/logos/netflix.svg',
    iconUrl: '/logos/netflix-icon.svg',
  },
  disney: {
    id: 'disney',
    name: 'Disney+',
    shortName: 'Disney+',
    providerId: '337',
    badgeText: 'D+',
    tagline: 'The home of Disney, Pixar, Marvel, Star Wars, and National Geographic.',
    heroKicker: 'Now streaming on Disney+',
    accentColor: '#113CCF',
    borderClass: 'border-blue-500/30 hover:border-blue-500/60',
    bgGlowClass: 'from-blue-950/40 via-[#071326] to-[#071326]',
    badgeClass: 'bg-blue-600 text-white shadow-[0_0_15px_rgba(17,60,207,0.4)]',
    activeTabClass: 'border-blue-500 bg-blue-950/40 text-white shadow-[0_0_20px_rgba(17,60,207,0.25)]',
    logoUrl: '/logos/disney.svg',
    iconUrl: '/logos/disney.svg',
  },
  prime: {
    id: 'prime',
    name: 'Prime Video',
    shortName: 'Prime',
    providerId: '9|119',
    badgeText: 'Prime',
    tagline: 'Acclaimed Amazon Originals, blockbuster hits, and timeless favorites.',
    heroKicker: 'Now playing on Prime Video',
    accentColor: '#00A8E1',
    borderClass: 'border-sky-500/30 hover:border-sky-500/60',
    bgGlowClass: 'from-sky-950/40 via-[#071326] to-[#071326]',
    badgeClass: 'bg-sky-500 text-[#071326] shadow-[0_0_15px_rgba(0,168,225,0.4)]',
    activeTabClass: 'border-sky-500 bg-sky-950/40 text-white shadow-[0_0_20px_rgba(0,168,225,0.25)]',
    logoUrl: '/logos/prime.svg',
    iconUrl: '/logos/prime.svg',
  },
  apple: {
    id: 'apple',
    name: 'Apple TV+',
    shortName: 'Apple TV',
    providerId: '350',
    badgeText: 'TV+',
    tagline: 'Compelling star-powered Apple Originals and critically acclaimed cinema.',
    heroKicker: 'Now premiering on Apple TV+',
    accentColor: '#E2E8F0',
    borderClass: 'border-slate-400/30 hover:border-slate-400/60',
    bgGlowClass: 'from-slate-900/60 via-[#071326] to-[#071326]',
    badgeClass: 'bg-slate-200 text-[#071326] shadow-[0_0_15px_rgba(255,255,255,0.3)]',
    activeTabClass: 'border-slate-300 bg-slate-800/60 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    logoUrl: '/logos/apple.svg',
    iconUrl: '/logos/apple.svg',
  },
}

export const STREAMING_PLATFORM_LIST: StreamingPlatform[] = Object.values(STREAMING_PLATFORMS)

export function isStreamingPlatformId(id: string): id is StreamingPlatformId {
  return id in STREAMING_PLATFORMS
}

export function getPlatformById(id: string | null | undefined): StreamingPlatform {
  if (id && isStreamingPlatformId(id)) {
    return STREAMING_PLATFORMS[id]
  }
  return STREAMING_PLATFORMS.netflix
}

export function getPlatformProviderId(id: string | null | undefined): string | undefined {
  if (id && isStreamingPlatformId(id)) {
    return STREAMING_PLATFORMS[id].providerId
  }
  return undefined
}
