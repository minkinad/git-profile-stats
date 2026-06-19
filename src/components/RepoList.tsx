import { useDeferredValue, useState } from 'react';
import { GitHubAnalytics } from '../types/github';
import { getGitHubStyleColor } from '../utils/githubColors';
import { formatDate, formatNumber } from '../utils/format';

interface RepoListProps {
  analytics: GitHubAnalytics;
}

type RepoSort = 'updated' | 'stars' | 'forks' | 'name';

export function RepoList({ analytics }: RepoListProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<RepoSort>('updated');
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());

  const languages = Array.from(
    new Set(analytics.repositories.map((repo) => repo.language))
  ).sort();

  const filteredRepos = analytics.repositories
    .filter((repo) => selectedLanguage === 'all' || repo.language === selectedLanguage)
    .filter((repo) => {
      if (!deferredSearchQuery) {
        return true;
      }

      return [repo.name, repo.description ?? '', repo.language]
        .join(' ')
        .toLowerCase()
        .includes(deferredSearchQuery);
    })
    .sort((left, right) => {
      if (sortBy === 'stars') {
        return right.stars - left.stars;
      }

      if (sortBy === 'forks') {
        return right.forks - left.forks;
      }

      if (sortBy === 'name') {
        return left.name.localeCompare(right.name);
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

  const hasActiveFilters = selectedLanguage !== 'all' || searchQuery.trim() !== '';

  function clearFilters() {
    setSelectedLanguage('all');
    setSearchQuery('');
  }

  return (
    <section className="repo-panel">
      <div className="panel-head">
        <span className="section-label">Repositories</span>
        <p>
          {formatNumber(filteredRepos.length)} public repositories, ordered by
          {sortBy === 'updated' ? ' most recently updated.' : ` ${sortBy}.`}
        </p>
      </div>

      <div className="repo-controls" aria-label="Repository controls">
        <label className="repo-search-label" htmlFor="repo-search">
          Search
          <input
            id="repo-search"
            className="repo-search-input"
            type="search"
            placeholder="Name, description, language"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <label htmlFor="language-filter">
          Language
          <select
            id="language-filter"
            value={selectedLanguage}
            onChange={(event) => setSelectedLanguage(event.target.value)}
          >
            <option value="all">All languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="repo-sort">
          Sort
          <select
            id="repo-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as RepoSort)}
          >
            <option value="updated">Recently updated</option>
            <option value="stars">Most stars</option>
            <option value="forks">Most forks</option>
            <option value="name">Name A-Z</option>
          </select>
        </label>
        {hasActiveFilters ? (
          <button type="button" className="filter-reset-button" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredRepos.length > 0 ? (
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
                  {repo.isFork ? <span className="repo-badge">Fork</span> : null}
                  {repo.isArchived ? <span className="repo-badge">Archived</span> : null}
                </div>
                <p>{repo.description ?? 'No repository description provided.'}</p>
              </div>
              <div className="repo-stats">
                <span>Stars {formatNumber(repo.stars)}</span>
                <span>Forks {formatNumber(repo.forks)}</span>
                <span>Issues {formatNumber(repo.openIssues)}</span>
                <span>Updated {formatDate(repo.updatedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="repo-empty">
          No repositories match the current filters.
          {hasActiveFilters ? (
            <button type="button" onClick={clearFilters}>
              Reset filters
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
