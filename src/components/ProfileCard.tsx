import { GitHubAnalytics, GitHubUser } from '../types/github';
import { formatDate, formatExternalLink, formatNumber } from '../utils/format';

interface ProfileCardProps {
  user: GitHubUser;
  analytics: GitHubAnalytics;
}

export function ProfileCard({ user, analytics }: ProfileCardProps) {
  const blogUrl = formatExternalLink(user.blog);

  return (
    <section className="profile-card">
      <div className="profile-topline">
        <span className="section-label">Profile</span>
        <a href={user.html_url} target="_blank" rel="noreferrer">
          View on GitHub
        </a>
      </div>

      <div className="profile-body">
        <img
          className="profile-avatar"
          src={user.avatar_url}
          alt={`${user.login} avatar`}
          width={104}
          height={104}
        />

        <div className="profile-copy">
          <div>
            <h2>{user.name ?? user.login}</h2>
            <p className="profile-username">@{user.login}</p>
          </div>
          <p className="profile-bio">{user.bio ?? 'No biography provided.'}</p>
          <div className="profile-meta">
            <span>{user.company ?? 'Independent'}</span>
            <span>{user.location ?? 'Location not listed'}</span>
            <span>Joined {formatDate(user.created_at)}</span>
          </div>
          {blogUrl ? (
            <a className="profile-link" href={blogUrl} target="_blank" rel="noreferrer">
              {user.blog}
            </a>
          ) : (
            <span className="profile-link muted">No website linked</span>
          )}
        </div>

        <div className="profile-callout">
          <span className="callout-label">Primary insight</span>
          <strong>{analytics.mostUsedLanguage}</strong>
          <p>
            Most used language across {formatNumber(analytics.repositories.length)} public
            repositories.
          </p>
        </div>
      </div>
    </section>
  );
}
