import { useState } from 'react';
import { GitHubAnalytics } from '../types/github';
import { getGitHubStyleColor } from '../utils/githubColors';
import { formatDate, formatNumber } from '../utils/format';

interface RepoListProps {
  analytics: GitHubAnalytics;
}

export function RepoList({ analytics }: RepoListProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  const languages = Array.from(
    new Set(analytics.repositories.map((repo) => repo.language))
  ).sort();

  const filteredRepos = selectedLanguage === 'all'
    ? analytics.repositories
    : analytics.repositories.filter((repo) => repo.language === selectedLanguage);

  return (
    <section className="repo-panel">
      <div className="panel-head">
        <span className="section-label">Repositories</span>
        <div className="repo-filters">
          <label htmlFor="language-filter">Filter by language:</label>
          <select
            id="language-filter"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="all">All languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <p>
          {formatNumber(filteredRepos.length)} public repositories, ordered by
          most recently updated.
        </p>
      </div>

      <div className="repo-list">
        {filteredRepos.map((repo) => (
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
