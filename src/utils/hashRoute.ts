const PROFILE_ROUTE_PREFIX = '#/user/';

export type AppRoute =
  | { page: 'home' }
  | { page: 'profile'; username: string };

export function parseAppRoute(hash: string): AppRoute {
  if (!hash.startsWith(PROFILE_ROUTE_PREFIX)) {
    return { page: 'home' };
  }

  try {
    const username = decodeURIComponent(hash.slice(PROFILE_ROUTE_PREFIX.length)).trim();

    return username
      ? { page: 'profile', username }
      : { page: 'home' };
  } catch {
    return { page: 'home' };
  }
}

export function getProfileHash(username: string): string {
  return `${PROFILE_ROUTE_PREFIX}${encodeURIComponent(username.trim())}`;
}
