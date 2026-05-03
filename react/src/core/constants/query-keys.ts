export const QUERY_KEYS = {
  user: "user",
  webpush: "webpush",
} as const;

export const STALE_TIME = {
  REALTIME: 0,
  SHORT: 1000 * 60,
  DEFAULT: 1000 * 60 * 5,
  LONG: 1000 * 60 * 15,
} as const;

export const CACHE_TIME = {
  NO_CACHE: 0,
  SHORT: 1000 * 60 * 5,
  DEFAULT: 1000 * 60 * 15,
  LONG: 1000 * 60 * 30,
} as const;
