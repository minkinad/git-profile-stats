import { buildAnalytics } from '../utils/analytics';
import {
  GitHubAnalysisResult,
  GitHubApiErrorCode,
  GitHubRepo,
  GitHubUser,
  MonthlyCommitPoint,
} from '../types/github';

const API_BASE_URL = 'https://api.github.com';
const apiToken = import.meta.env.VITE_GITHUB_TOKEN;

export class GitHubApiError extends Error {
  code: GitHubApiErrorCode;
  status?: number;
  resetAt?: string;

  constructor(
    message: string,
    code: GitHubApiErrorCode,
    status?: number,
    resetAt?: string,
  ) {
    super(message);
    this.name = 'GitHubApiError';
    this.code = code;
    this.status = status;
    this.resetAt = resetAt;
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };

  if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`;
  }

  return headers;
}

function parseRateLimitReset(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);
  if (Number.isNaN(seconds)) {
    return undefined;
  }

  return new Date(seconds * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchFromGitHub<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: buildHeaders(),
    });
  } catch {
    throw new GitHubApiError(
      'Network error while reaching GitHub.',
      'network',
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new GitHubApiError('GitHub user was not found.', 'not_found', 404);
    }

    if (response.status === 403 || response.status === 429) {
      throw new GitHubApiError(
        'GitHub API rate limit reached.',
        'rate_limit',
        response.status,
        parseRateLimitReset(response.headers.get('x-ratelimit-reset')),
      );
    }

    throw new GitHubApiError(
      'Unexpected GitHub API error.',
      'unknown',
      response.status,
    );
  }

  return (await response.json()) as T;
}

async function fetchGitHubResponse(path: string): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      headers: buildHeaders(),
    });
  } catch {
    throw new GitHubApiError(
      'Network error while reaching GitHub.',
      'network',
    );
  }
}

async function fetchUser(username: string): Promise<GitHubUser> {
  return fetchFromGitHub<GitHubUser>(`/users/${encodeURIComponent(username)}`);
}

async function fetchRepos(username: string, publicRepoCount: number): Promise<GitHubRepo[]> {
  if (publicRepoCount === 0) {
    return [];
  }

  const pages = Math.ceil(publicRepoCount / 100);
  const repositories: GitHubRepo[] = [];

  for (let page = 1; page <= pages; page += 1) {
    const pageRepositories = await fetchFromGitHub<GitHubRepo[]>(
      `/users/${encodeURIComponent(
        username,
      )}/repos?per_page=100&page=${page}&sort=updated`,
    );

    repositories.push(...pageRepositories);
  }

  return repositories;
}

interface GitHubContributor {
  contributions: number;
}

async function fetchRepoCommitTotal(
  username: string,
  repoName: string,
): Promise<number> {
  const contributors = await fetchFromGitHub<GitHubContributor[]>(
    `/repos/${encodeURIComponent(username)}/${encodeURIComponent(
      repoName,
    )}/contributors?per_page=100&anon=1`,
  );

  return contributors.reduce(
    (total, contributor) => total + contributor.contributions,
    0,
  );
}

async function fetchCommitTotalsForTopRepos(
  username: string,
  repos: GitHubRepo[],
): Promise<Record<number, number>> {
  const results = await Promise.all(
    getTopReposForCommitAnalytics(repos).map(async (repo) => {
      try {
        const commitTotal = await fetchRepoCommitTotal(username, repo.name);
        return [repo.id, commitTotal] as const;
      } catch {
        return [repo.id, 0] as const;
      }
    }),
  );

  return Object.fromEntries(results);
}

interface GitHubCommitActivityWeek {
  total: number;
  week: number;
  days: number[];
}

function getTopReposForCommitAnalytics(repos: GitHubRepo[]): GitHubRepo[] {
  return [...repos]
    .sort((left, right) => {
      if (right.stargazers_count === left.stargazers_count) {
        return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
      }

      return right.stargazers_count - left.stargazers_count;
    })
    .slice(0, 10);
}

function getMonthlyRangeExcludingCurrentMonth(): Date[] {
  const today = new Date();
  const months: Date[] = [];

  for (let offset = 12; offset >= 1; offset -= 1) {
    months.push(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1)));
  }

  return months;
}

function getMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

async function fetchRepoCommitActivity(
  username: string,
  repoName: string,
  attempt = 0,
): Promise<GitHubCommitActivityWeek[]> {
  const response = await fetchGitHubResponse(
    `/repos/${encodeURIComponent(username)}/${encodeURIComponent(
      repoName,
    )}/stats/commit_activity`,
  );

  if (response.status === 202) {
    if (attempt >= 2) {
      return [];
    }

    await new Promise((resolve) => window.setTimeout(resolve, 700));
    return fetchRepoCommitActivity(username, repoName, attempt + 1);
  }

  if (response.status === 204) {
    return [];
  }

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new GitHubApiError(
        'GitHub API rate limit reached.',
        'rate_limit',
        response.status,
        parseRateLimitReset(response.headers.get('x-ratelimit-reset')),
      );
    }

    if (response.status === 404) {
      return [];
    }

    throw new GitHubApiError(
      'Unexpected GitHub API error.',
      'unknown',
      response.status,
    );
  }

  return (await response.json()) as GitHubCommitActivityWeek[];
}

async function fetchMonthlyCommitSeries(
  username: string,
  repos: GitHubRepo[],
): Promise<MonthlyCommitPoint[]> {
  const months = getMonthlyRangeExcludingCurrentMonth();
  const monthMap = new Map<string, MonthlyCommitPoint>(
    months.map((monthDate) => [
      getMonthKey(monthDate),
      {
        month: formatMonthLabel(monthDate),
        commits: 0,
      },
    ]),
  );

  const commitActivityResults = await Promise.all(
    getTopReposForCommitAnalytics(repos).map(async (repo) => {
      try {
        return await fetchRepoCommitActivity(username, repo.name);
      } catch {
        return [];
      }
    }),
  );

  for (const repoWeeks of commitActivityResults) {
    for (const week of repoWeeks) {
      week.days.forEach((count, index) => {
        if (!count) {
          return;
        }

        const dayDate = new Date((week.week + index * 86400) * 1000);
        const monthKey = getMonthKey(dayDate);
        const monthPoint = monthMap.get(monthKey);

        if (monthPoint) {
          monthPoint.commits += count;
        }
      });
    }
  }

  return months.map((monthDate) => monthMap.get(getMonthKey(monthDate))!).filter(Boolean);
}

export async function analyzeGitHubUser(
  rawUsername: string,
): Promise<GitHubAnalysisResult> {
  const username = rawUsername.trim();

  if (!username) {
    throw new GitHubApiError(
      'Please enter a GitHub username to analyze.',
      'empty_input',
    );
  }

  const user = await fetchUser(username);
  const repos = await fetchRepos(username, user.public_repos);
  const [commitTotalsByRepoId, monthlyCommitsChart] = await Promise.all([
    fetchCommitTotalsForTopRepos(username, repos),
    fetchMonthlyCommitSeries(username, repos),
  ]);
  const analytics = buildAnalytics(
    user,
    repos,
    commitTotalsByRepoId,
    monthlyCommitsChart,
  );

  return {
    user,
    repos,
    analytics,
  };
}
