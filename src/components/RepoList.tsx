import { GitHubAnalytics } from '../types/github';
import { getGitHubStyleColor } from '../utils/githubColors';
import { formatDate, formatNumber } from '../utils/format';

interface RepoListProps {
  analytics: GitHubAnalytics;
}

export function RepoList({ analytics }: RepoListProps) {
  return (
    <section className="repo-panel">
      <div className="panel-head">
        <span className="section-label">Repositories</span>
        <p>
          {formatNumber(analytics.repositories.length)} public repositories, ordered by
          most recently updated.
        </p>
      </div>

      <div className="repo-list">
        {analytics.repositories.map((repo) => (
          <article className="repo-item" key={repo.id}>
            <div className="repo-main">
              <div className="repo-heading">
                <a href={repo.url} target="_blank" rel="noreferrer">
                  {repo.name}
                </a>
                <span className="repo-language">
                  <span
                    className="repo-language-dot"
                    aria-hidden="true"
                    style={{ backgroundColor: getGitHubStyleColor(repo.language) }}
                  />
                  {repo.language}
                </span>
              </div>
              <p>{repo.description ?? 'No repository description provided.'}</p>
            </div>
            <div className="repo-stats">
              <span>Stars {formatNumber(repo.stars)}</span>
              <span>Forks {formatNumber(repo.forks)}</span>
              <span>Updated {formatDate(repo.updatedAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
