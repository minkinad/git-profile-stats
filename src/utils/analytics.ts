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
    openIssues: repo.open_issues_count,
    language: normalizeLanguage(repo.language),
    isFork: repo.fork,
    isArchived: repo.archived,
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
  const totalForks = repositories.reduce((sum, repo) => sum + repo.forks, 0);
  const totalOpenIssues = repositories.reduce((sum, repo) => sum + repo.openIssues, 0);
  const totalRecentCommits = Object.values(commitTotalsByRepoId).reduce(
    (sum, commits) => sum + commits,
    0,
  );
  const originalRepositoryCount = repositories.filter((repo) => !repo.isFork).length;
  const forkedRepositoryCount = repositories.length - originalRepositoryCount;
  const archivedRepositoryCount = repositories.filter((repo) => repo.isArchived).length;
  const commitAnalyticsRepoCount = Object.keys(commitTotalsByRepoId).length;
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

  const knownLanguages = languageDistribution.filter(
    (item) => item.language !== 'Unknown',
  );
  const languageCount = knownLanguages.length;
  const mostUsedLanguage = knownLanguages[0]?.language ?? 'None';
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
    { label: 'Original Repos', value: originalRepositoryCount },
    { label: 'Total Stars', value: totalStars },
    { label: 'Total Forks', value: totalForks },
    { label: 'Open Issues', value: totalOpenIssues },
    { label: 'Languages', value: languageCount },
    { label: 'Commits (52w)', value: totalRecentCommits },
    { label: 'Repos Sampled', value: commitAnalyticsRepoCount },
    {
      label: 'Avg Stars / Repo',
      value: Number(averageStarsPerRepo.toFixed(1)),
      format: 'decimal' as const,
    },
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
    totalForks,
    totalOpenIssues,
    totalRecentCommits,
    originalRepositoryCount,
    forkedRepositoryCount,
    archivedRepositoryCount,
    languageCount,
    commitAnalyticsRepoCount,
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
