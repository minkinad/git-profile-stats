import { buildAnalytics } from '../utils/analytics';
import {
  GitHubAnalysisResult,
  GitHubApiErrorCode,
  GitHubRepo,
  GitHubUser,
  MonthlyCommitPoint,
} from '../types/github';
import { isValidGitHubUsername } from '../utils/githubUsername';

const API_BASE_URL = 'https://api.github.com';
const apiToken = import.meta.env.VITE_GITHUB_TOKEN;
const ANALYSIS_CACHE_PREFIX = 'gitProfileStats-analysis:';
const ANALYSIS_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_REPOS_FOR_DEEP_ANALYTICS = 8;
const MAX_PARALLEL_REQUESTS = 4;

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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function abortableDelay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, milliseconds);

    function handleAbort() {
      window.clearTimeout(timeoutId);
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    }

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

function getCacheKey(username: string): string {
  return `${ANALYSIS_CACHE_PREFIX}${username.toLowerCase()}`;
}

function readCachedAnalysis(username: string): GitHubAnalysisResult | null {
  try {
    const cached = window.sessionStorage.getItem(getCacheKey(username));

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as {
      createdAt: number;
      value: GitHubAnalysisResult;
    };

    if (!parsed.createdAt || Date.now() - parsed.createdAt > ANALYSIS_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(getCacheKey(username));
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

function writeCachedAnalysis(username: string, value: GitHubAnalysisResult): void {
  try {
    window.sessionStorage.setItem(
      getCacheKey(username),
      JSON.stringify({
        createdAt: Date.now(),
        value,
      }),
    );
  } catch {
    // Storage can be unavailable in private browsing or full quota states.
  }
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

async function fetchFromGitHub<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: buildHeaders(),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

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

async function fetchGitHubResponse(path: string, signal?: AbortSignal): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      headers: buildHeaders(),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new GitHubApiError(
      'Network error while reaching GitHub.',
      'network',
    );
  }
}

async function fetchUser(username: string, signal?: AbortSignal): Promise<GitHubUser> {
  return fetchFromGitHub<GitHubUser>(`/users/${encodeURIComponent(username)}`, signal);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

async function fetchRepos(
  username: string,
  publicRepoCount: number,
  signal?: AbortSignal,
): Promise<GitHubRepo[]> {
  if (publicRepoCount === 0) {
    return [];
  }

  const pages = Math.ceil(publicRepoCount / 100);
  const pageNumbers = Array.from({ length: pages }, (_, index) => index + 1);
  const repoPages = await mapWithConcurrency(
    pageNumbers,
    MAX_PARALLEL_REQUESTS,
    (page) => fetchFromGitHub<GitHubRepo[]>(
      `/users/${encodeURIComponent(
        username,
      )}/repos?per_page=100&page=${page}&sort=updated`,
      signal,
    ),
  );

  return repoPages.flat();
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
    .slice(0, MAX_REPOS_FOR_DEEP_ANALYTICS);
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
  signal?: AbortSignal,
  attempt = 0,
): Promise<GitHubCommitActivityWeek[]> {
  const response = await fetchGitHubResponse(
    `/repos/${encodeURIComponent(username)}/${encodeURIComponent(
      repoName,
    )}/stats/commit_activity`,
    signal,
  );

  if (response.status === 202) {
    if (attempt >= 2) {
      return [];
    }

    await abortableDelay(700, signal);
    return fetchRepoCommitActivity(username, repoName, signal, attempt + 1);
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

async function fetchCommitActivityForTopRepos(
  username: string,
  repos: GitHubRepo[],
  signal?: AbortSignal,
): Promise<Record<number, GitHubCommitActivityWeek[]>> {
  const results = await mapWithConcurrency(
    getTopReposForCommitAnalytics(repos),
    MAX_PARALLEL_REQUESTS,
    async (repo) => {
      try {
        const activity = await fetchRepoCommitActivity(username, repo.name, signal);
        return [repo.id, activity] as const;
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }

        return [repo.id, []] as const;
      }
    },
  );

  return Object.fromEntries(results);
}

function buildCommitTotalsByRepoId(
  commitActivityByRepoId: Record<number, GitHubCommitActivityWeek[]>,
): Record<number, number> {
  return Object.fromEntries(
    Object.entries(commitActivityByRepoId).map(([repoId, weeks]) => [
      Number(repoId),
      weeks.reduce((total, week) => total + week.total, 0),
    ]),
  );
}

function buildMonthlyCommitSeries(
  commitActivityByRepoId: Record<number, GitHubCommitActivityWeek[]>,
): MonthlyCommitPoint[] {
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

  for (const repoWeeks of Object.values(commitActivityByRepoId)) {
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
  signal?: AbortSignal,
): Promise<GitHubAnalysisResult> {
  const username = rawUsername.trim();

  if (!username) {
    throw new GitHubApiError(
      'Please enter a GitHub username to analyze.',
      'empty_input',
    );
  }

  if (!isValidGitHubUsername(username)) {
    throw new GitHubApiError(
      'Please enter a valid GitHub username.',
      'invalid_input',
    );
  }

  const cachedAnalysis = readCachedAnalysis(username);

  if (cachedAnalysis) {
    return cachedAnalysis;
  }

  const user = await fetchUser(username, signal);
  const repos = await fetchRepos(username, user.public_repos, signal);
  const commitActivityByRepoId = await fetchCommitActivityForTopRepos(
    username,
    repos,
    signal,
  );
  const commitTotalsByRepoId = buildCommitTotalsByRepoId(commitActivityByRepoId);
  const monthlyCommitsChart = buildMonthlyCommitSeries(commitActivityByRepoId);
  const analytics = buildAnalytics(
    user,
    repos,
    commitTotalsByRepoId,
    monthlyCommitsChart,
  );
  const result = {
    user,
    repos,
    analytics,
  };

  writeCachedAnalysis(username, result);

  return result;
}
