import {
  GitHubAnalytics,
  GitHubRepo,
  GitHubUser,
  LanguageBreakdownItem,
  LanguageMetricPoint,
  MonthlyCommitPoint,
  RepoInsight,
  RepoMetricPoint,
} from '../types/github';

function normalizeLanguage(language: string | null): string {
  return language ?? 'Unknown';
}

function mapRepo(repo: GitHubRepo): RepoInsight {
  return {
    id: repo.id,
    name: repo.name,
    description: repo.description,
    url: repo.html_url,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: normalizeLanguage(repo.language),
    updatedAt: repo.updated_at,
  };
}

export function buildAnalytics(
  user: GitHubUser,
  repos: GitHubRepo[],
  commitTotalsByRepoId: Record<number, number> = {},
  monthlyCommitsChart: MonthlyCommitPoint[] = [],
): GitHubAnalytics {
  const repositories = repos
    .map(mapRepo)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );

  const totalStars = repositories.reduce((sum, repo) => sum + repo.stars, 0);
  const averageStarsPerRepo =
    repositories.length > 0 ? totalStars / repositories.length : 0;

  const languageMap = repositories.reduce<Map<string, LanguageBreakdownItem>>(
    (accumulator, repo) => {
      const current = accumulator.get(repo.language) ?? {
        language: repo.language,
        count: 0,
        stars: 0,
        forks: 0,
        commits: 0,
      };

      current.count += 1;
      current.stars += repo.stars;
      current.forks += repo.forks;
      current.commits += commitTotalsByRepoId[repo.id] ?? 0;

      accumulator.set(repo.language, current);
      return accumulator;
    },
    new Map(),
  );

  const languageDistribution = Array.from(languageMap.values()).sort((left, right) => {
    if (right.count === left.count) {
      return right.stars - left.stars;
    }

    return right.count - left.count;
  });

  const mostUsedLanguage = languageDistribution[0]?.language ?? 'None';
  const mostRecentlyUpdatedRepo = repositories[0] ?? null;
  const mostStarredRepos = [...repositories]
    .sort((left, right) => {
      if (right.stars === left.stars) {
        return right.forks - left.forks;
      }

      return right.stars - left.stars;
    })
    .slice(0, 5);

  const summaryMetrics = [
    { label: 'Public Repos', value: user.public_repos },
    { label: 'Followers', value: user.followers },
    { label: 'Following', value: user.following },
    { label: 'Total Stars', value: totalStars },
    { label: 'Avg Stars', value: Number(averageStarsPerRepo.toFixed(1)) },
  ];

  const reposPerLanguageChart: LanguageMetricPoint[] = languageDistribution.map((item) => ({
    language: item.language,
    value: item.count,
  }));

  const starsPerLanguageChart: LanguageMetricPoint[] = languageDistribution
    .map((item) => ({
      language: item.language,
      value: item.stars,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 10);

  const commitsPerLanguageChart: LanguageMetricPoint[] = languageDistribution
    .map((item) => ({
      language: item.language,
      value: item.commits,
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 10);

  const starsPerRepoChart: RepoMetricPoint[] = [...repositories]
    .sort((left, right) => right.stars - left.stars)
    .slice(0, 10)
    .map((repo) => ({
      name: repo.name,
      language: repo.language,
      value: repo.stars,
    }));

  const commitsPerRepoChart: RepoMetricPoint[] = [...repositories]
    .map((repo) => ({
      name: repo.name,
      language: repo.language,
      value: commitTotalsByRepoId[repo.id] ?? 0,
    }))
    .filter((repo) => repo.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 10);

  return {
    repositories,
    totalStars,
    averageStarsPerRepo,
    mostUsedLanguage,
    mostRecentlyUpdatedRepo,
    mostStarredRepos,
    languageDistribution,
    summaryMetrics,
    reposPerLanguageChart,
    starsPerLanguageChart,
    commitsPerLanguageChart,
    commitsPerRepoChart,
    starsPerRepoChart,
    monthlyCommitsChart,
  };
}
