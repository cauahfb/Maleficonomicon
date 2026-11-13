const CACHE_TTL_MS = 45_000

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const pending = new Map<string, Promise<unknown>>()
const generations = new Map<string, number>()

export async function getCachedData<T>(
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key) as CacheEntry<T> | undefined

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const existingRequest = pending.get(key) as Promise<T> | undefined
  if (existingRequest) return existingRequest

  const generation = generations.get(key) ?? 0
  const request = loader()
    .then((value) => {
      if ((generations.get(key) ?? 0) === generation) {
        cache.set(key, {
          value,
          expiresAt: Date.now() + CACHE_TTL_MS,
        })
      }
      return value
    })
    .finally(() => {
      if (pending.get(key) === request) pending.delete(key)
    })

  pending.set(key, request)
  return request
}

export function invalidateDataCache(prefix: string): void {
  const keys = new Set([
    ...cache.keys(),
    ...pending.keys(),
    ...generations.keys(),
  ])

  for (const key of keys) {
    if (!key.startsWith(prefix)) continue
    generations.set(key, (generations.get(key) ?? 0) + 1)
    cache.delete(key)
    pending.delete(key)
  }
}

export function clearDataCache(): void {
  for (const key of new Set([...cache.keys(), ...pending.keys()])) {
    generations.set(key, (generations.get(key) ?? 0) + 1)
  }
  cache.clear()
  pending.clear()
}