import { describe, expect, it } from 'vitest';
import { getProfileHash, parseAppRoute } from './hashRoute';

describe('hash routing', () => {
  it('round-trips a profile route', () => {
    expect(parseAppRoute(getProfileHash('github-actions'))).toEqual({
      page: 'profile',
      username: 'github-actions',
    });
  });

  it('falls back to home for an invalid encoded hash', () => {
    expect(parseAppRoute('#/user/%E0%A4%A')).toEqual({ page: 'home' });
  });

  it('falls back to home for unrelated and empty routes', () => {
    expect(parseAppRoute('#/settings')).toEqual({ page: 'home' });
    expect(parseAppRoute('#/user/')).toEqual({ page: 'home' });
  });
});
