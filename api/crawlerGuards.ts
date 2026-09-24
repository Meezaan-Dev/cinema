const BLOCKED_CRAWLER_TOKENS = ['meta-externalagent', 'meta-externalfetcher']

export function isBlockedCrawlerUserAgent(userAgent: string | undefined) {
  if (!userAgent) return false
  const normalized = userAgent.toLowerCase()
  return BLOCKED_CRAWLER_TOKENS.some((token) => normalized.includes(token))
}
