import { GitHubAnalytics, GitHubUser } from '../types/github';
import { formatDate, formatDecimal, formatNumber } from '../utils/format';

interface StatsGridProps {
  user: GitHubUser;
  analytics: GitHubAnalytics;
}

export function StatsGrid({ user, analytics }: StatsGridProps) {
  const items = [
    { label: 'Public Repositories', value: formatNumber(user.public_repos) },
    { label: 'Followers', value: formatNumber(user.followers) },
    { label: 'Following', value: formatNumber(user.following) },
    { label: 'Total Stars', value: formatNumber(analytics.totalStars) },
    { label: 'Total Forks', value: formatNumber(analytics.totalForks) },
    { label: 'Open Issues', value: formatNumber(analytics.totalOpenIssues) },
    {
      label: 'Average Stars / Repo',
      value: formatDecimal(analytics.averageStarsPerRepo),
    },
    {
      label: 'Original / Forked Repos',
      value: `${formatNumber(analytics.originalRepositoryCount)} / ${formatNumber(analytics.forkedRepositoryCount)}`,
    },
    {
      label: 'Commits, last 52 weeks (sampled)',
      value: formatNumber(analytics.totalRecentCommits),
    },
    { label: 'Most Used Language', value: analytics.mostUsedLanguage },
    {
      label: 'Most Recently Updated',
      value: analytics.mostRecentlyUpdatedRepo?.name ?? 'No repositories',
    },
    { label: 'Account Created', value: formatDate(user.created_at) },
  ];

  return (
    <dl className="stats-grid" aria-label="Profile statistics">
      {items.map((item) => (
        <div className="stat-row" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
