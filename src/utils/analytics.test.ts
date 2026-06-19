import { describe, expect, it } from 'vitest';
import { GitHubRepo, GitHubUser } from '../types/github';
import { buildAnalytics } from './analytics';

const user: GitHubUser = {
  login: 'octocat',
  avatar_url: 'https://example.com/avatar.png',
  html_url: 'https://github.com/octocat',
  name: 'Octocat',
  bio: null,
  company: null,
  location: null,
  blog: null,
  public_repos: 2,
  followers: 10,
  following: 3,
  created_at: '2011-01-25T18:44:36Z',
};

const repos: GitHubRepo[] = [
  {
    id: 1,
    name: 'alpha',
    full_name: 'octocat/alpha',
    html_url: 'https://github.com/octocat/alpha',
    description: null,
    stargazers_count: 10,
    forks_count: 3,
    open_issues_count: 4,
    language: 'TypeScript',
    fork: false,
    archived: false,
    updated_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'beta',
    full_name: 'octocat/beta',
    html_url: 'https://github.com/octocat/beta',
    description: 'Fork without a detected language',
    stargazers_count: 2,
    forks_count: 1,
    open_issues_count: 1,
    language: null,
    fork: true,
    archived: true,
    updated_at: '2026-05-01T00:00:00Z',
  },
];

describe('buildAnalytics', () => {
  it('aggregates repository totals and exposes commit sample coverage', () => {
    const analytics = buildAnalytics(user, repos, { 1: 30, 2: 5 });

    expect(analytics.totalStars).toBe(12);
    expect(analytics.totalForks).toBe(4);
    expect(analytics.totalOpenIssues).toBe(5);
    expect(analytics.totalRecentCommits).toBe(35);
    expect(analytics.originalRepositoryCount).toBe(1);
    expect(analytics.forkedRepositoryCount).toBe(1);
    expect(analytics.archivedRepositoryCount).toBe(1);
    expect(analytics.commitAnalyticsRepoCount).toBe(2);
    expect(analytics.repositories[0]).toMatchObject({
      name: 'alpha',
      openIssues: 4,
      isFork: false,
      isArchived: false,
    });
  });

  it('does not report Unknown as the most used language', () => {
    const analytics = buildAnalytics(user, repos);

    expect(analytics.mostUsedLanguage).toBe('TypeScript');
    expect(analytics.languageCount).toBe(1);
    expect(analytics.languageDistribution).toEqual([
      expect.objectContaining({ language: 'TypeScript', count: 1 }),
      expect.objectContaining({ language: 'Unknown', count: 1 }),
    ]);
  });

  it('returns stable zero-value metrics for a profile without repositories', () => {
    const analytics = buildAnalytics({ ...user, public_repos: 0 }, []);

    expect(analytics.totalStars).toBe(0);
    expect(analytics.totalForks).toBe(0);
    expect(analytics.averageStarsPerRepo).toBe(0);
    expect(analytics.mostUsedLanguage).toBe('None');
    expect(analytics.mostRecentlyUpdatedRepo).toBeNull();
    expect(analytics.languageDistribution).toEqual([]);
    expect(analytics.commitAnalyticsRepoCount).toBe(0);
  });
});
