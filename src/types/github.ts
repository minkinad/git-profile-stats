export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

export interface LanguageBreakdownItem {
  language: string;
  count: number;
  stars: number;
  forks: number;
  commits: number;
}

export interface RepoInsight {
  id: number;
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string;
  updatedAt: string;
}

export interface SummaryMetric {
  label: string;
  value: number;
}

export interface LanguageMetricPoint {
  language: string;
  value: number;
}

export interface RepoMetricPoint {
  name: string;
  language: string;
  value: number;
}

export interface MonthlyCommitPoint {
  month: string;
  commits: number;
}

export interface GitHubAnalytics {
  repositories: RepoInsight[];
  totalStars: number;
  averageStarsPerRepo: number;
  mostUsedLanguage: string;
  mostRecentlyUpdatedRepo: RepoInsight | null;
  mostStarredRepos: RepoInsight[];
  languageDistribution: LanguageBreakdownItem[];
  summaryMetrics: SummaryMetric[];
  reposPerLanguageChart: LanguageMetricPoint[];
  starsPerLanguageChart: LanguageMetricPoint[];
  commitsPerLanguageChart: LanguageMetricPoint[];
  commitsPerRepoChart: RepoMetricPoint[];
  starsPerRepoChart: RepoMetricPoint[];
  monthlyCommitsChart: MonthlyCommitPoint[];
}

export type GitHubApiErrorCode =
  | 'empty_input'
  | 'not_found'
  | 'rate_limit'
  | 'network'
  | 'unknown';

export interface GitHubAnalysisResult {
  user: GitHubUser;
  repos: GitHubRepo[];
  analytics: GitHubAnalytics;
}
