import { describe, expect, it } from 'vitest';
import { GitHubRepo, GitHubUser, MonthlyCommitPoint } from '../types/github';
import { buildAnalytics } from './analytics';

const user: GitHubUser = {
  login: 'octocat',
  avatar_url: 'https://example.com/avatar.png',
  html_url: 'https://github.com/octocat',
  name: 'The Octocat',
  bio: null,
  company: null,
  location: null,
  blog: null,
  public_repos: 3,
  followers: 10,
  following: 2,
  created_at: '2011-01-25T18:44:36Z',
};

const repos: GitHubRepo[] = [
  {
    id: 1,
    name: 'alpha',
    full_name: 'octocat/alpha',
    html_url: 'https://github.com/octocat/alpha',
    description: null,
    stargazers_count: 4,
    forks_count: 1,
    language: 'TypeScript',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'beta',
    full_name: 'octocat/beta',
    html_url: 'https://github.com/octocat/beta',
    description: null,
    stargazers_count: 8,
    forks_count: 2,
    language: 'TypeScript',
    updated_at: '2025-03-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'gamma',
    full_name: 'octocat/gamma',
    html_url: 'https://github.com/octocat/gamma',
    description: null,
    stargazers_count: 0,
    forks_count: 0,
    language: null,
    updated_at: '2025-02-01T00:00:00Z',
  },
];

describe('buildAnalytics', () => {
  it('aggregates repositories without mutating the API response order', () => {
    const monthlyCommits: MonthlyCommitPoint[] = [{ month: "Jan '25", commits: 9 }];
    const analytics = buildAnalytics(user, repos, { 1: 3, 2: 6 }, monthlyCommits);

    expect(repos.map((repo) => repo.name)).toEqual(['alpha', 'beta', 'gamma']);
    expect(analytics.repositories.map((repo) => repo.name)).toEqual([
      'beta',
      'gamma',
      'alpha',
    ]);
    expect(analytics.totalStars).toBe(12);
    expect(analytics.averageStarsPerRepo).toBe(4);
    expect(analytics.mostUsedLanguage).toBe('TypeScript');
    expect(analytics.languageDistribution).toEqual([
      { language: 'TypeScript', count: 2, stars: 12, forks: 3, commits: 9 },
      { language: 'Unknown', count: 1, stars: 0, forks: 0, commits: 0 },
    ]);
    expect(analytics.monthlyCommitsChart).toBe(monthlyCommits);
  });
});
