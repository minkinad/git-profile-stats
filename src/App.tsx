import {
  CSSProperties,
  MouseEvent,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProfileCard } from './components/ProfileCard';
import { RepoList } from './components/RepoList';
import { SearchForm } from './components/SearchForm';
import { StatsGrid } from './components/StatsGrid';
import { analyzeGitHubUser, GitHubApiError } from './services/githubApi';
import { GitHubAnalysisResult } from './types/github';

const ChartsSection = lazy(() =>
  import('./components/ChartsSection').then((module) => ({
    default: module.ChartsSection,
  })),
);

const initialMessage =
  'Search for a public GitHub username to see profile data, repository insights, and language analytics.';
const profileRoutePrefix = '#/user/';

type AppRoute =
  | { page: 'home' }
  | { page: 'profile'; username: string };

type ThemeMode = 'light' | 'dark';

interface ThemeWaveState {
  x: number;
  y: number;
  color: string;
}

function getCurrentRoute(): AppRoute {
  const hash = window.location.hash;

  if (hash.startsWith(profileRoutePrefix)) {
    const username = decodeURIComponent(hash.slice(profileRoutePrefix.length)).trim();

    if (username) {
      return {
        page: 'profile',
        username,
      };
    }
  }

  return { page: 'home' };
}

function getProfileHash(username: string): string {
  return `${profileRoutePrefix}${encodeURIComponent(username.trim())}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof GitHubApiError) {
    switch (error.code) {
      case 'empty_input':
        return 'Enter a GitHub username to begin.';
      case 'invalid_input':
        return 'Use a valid GitHub username: letters, numbers, or hyphens, up to 39 characters.';
      case 'not_found':
        return 'No public GitHub user was found for that username.';
      case 'rate_limit':
        return error.resetAt
          ? `GitHub API rate limit reached. Try again after ${error.resetAt}.`
          : 'GitHub API rate limit reached. Please try again later.';
      case 'network':
        return 'A network error interrupted the request. Check your connection and try again.';
      default:
        return 'Something unexpected happened while analyzing this profile.';
    }
  }

  return 'Something unexpected happened while analyzing this profile.';
}

function normalizeUsernameInput(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  const withoutAtSign = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;

  try {
    const url = new URL(
      withoutAtSign.startsWith('github.com/')
        ? `https://${withoutAtSign}`
        : withoutAtSign,
    );

    if (url.hostname === 'github.com' || url.hostname === 'www.github.com') {
      return url.pathname.split('/').filter(Boolean)[0] ?? '';
    }
  } catch {
    // Plain usernames are expected to fall through.
  }

  return withoutAtSign;
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = window.localStorage.getItem('gitProfileStats-theme');

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });
  const [route, setRoute] = useState<AppRoute>(() => getCurrentRoute());
  const [username, setUsername] = useState(
    route.page === 'profile' ? route.username : '',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(initialMessage);
  const [analysis, setAnalysis] = useState<GitHubAnalysisResult | null>(null);
  const [themeWave, setThemeWave] = useState<ThemeWaveState | null>(null);
  const [isThemeAnimating, setIsThemeAnimating] = useState(false);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const themeWaveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('gitProfileStats-theme', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (themeWaveTimeoutRef.current) {
        window.clearTimeout(themeWaveTimeoutRef.current);
      }

      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    function syncRoute() {
      setRoute(getCurrentRoute());
    }

    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  useEffect(() => {
    if (route.page === 'profile') {
      setUsername(route.username);
      return;
    }

    requestIdRef.current += 1;
    abortControllerRef.current?.abort();
    setAnalysis(null);
    setErrorMessage(null);
    setIsLoading(false);
    setStatusMessage(initialMessage);
  }, [route]);

  async function loadAnalysis(targetUsername: string) {
    const requestId = requestIdRef.current + 1;
    const abortController = new AbortController();

    requestIdRef.current = requestId;
    abortControllerRef.current?.abort();
    abortControllerRef.current = abortController;
    setIsLoading(true);
    setAnalysis(null);
    setErrorMessage(null);
    setStatusMessage('Fetching profile, repositories, and activity from GitHub...');

    try {
      const nextAnalysis = await analyzeGitHubUser(
        targetUsername,
        abortController.signal,
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      setAnalysis(nextAnalysis);
      setStatusMessage(`Analysis ready for @${nextAnalysis.user.login}.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      if (requestId !== requestIdRef.current) {
        return;
      }

      setAnalysis(null);
      setErrorMessage(getErrorMessage(error));
      setStatusMessage('Unable to load analytics for this profile.');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }

  useEffect(() => {
    if (route.page !== 'profile') {
      return;
    }

    void loadAnalysis(route.username);
  }, [route]);

  function handleAnalyze() {
    const trimmedUsername = normalizeUsernameInput(username);

    if (!trimmedUsername) {
      setErrorMessage('Enter a GitHub username to begin.');
      setStatusMessage(initialMessage);
      return;
    }

    setErrorMessage(null);
    setUsername(trimmedUsername);

    if (route.page === 'profile' && route.username === trimmedUsername) {
      void loadAnalysis(trimmedUsername);
      return;
    }

    window.location.hash = getProfileHash(trimmedUsername);
  }

  function handleThemeToggle(event: MouseEvent<HTMLButtonElement>) {
    if (isThemeAnimating) {
      return;
    }

    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    const rect = event.currentTarget.getBoundingClientRect();

    if (themeWaveTimeoutRef.current) {
      window.clearTimeout(themeWaveTimeoutRef.current);
    }

    setIsThemeAnimating(true);
    setThemeWave({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      color: nextTheme === 'dark' ? '#090909' : '#f3f3f3',
    });
    setTheme(nextTheme);

    themeWaveTimeoutRef.current = window.setTimeout(() => {
      setThemeWave(null);
      setIsThemeAnimating(false);
    }, 560);
  }

  return (
    <div className="app-shell">
      {themeWave ? (
        <div
          className="theme-wave"
          aria-hidden="true"
          style={
            {
              '--wave-x': `${themeWave.x}px`,
              '--wave-y': `${themeWave.y}px`,
              '--wave-fill': themeWave.color,
            } as CSSProperties
          }
        />
      ) : null}
      <div className="page-glow" aria-hidden="true" />
      <div className="page-grid" aria-hidden="true" />
      <main className="page">
        <Header
          theme={theme}
          isThemeAnimating={isThemeAnimating}
          onToggleTheme={handleThemeToggle}
        />

        {route.page === 'home' ? (
          <>
            <Hero
              username={username}
              onUsernameChange={setUsername}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
            />

            {errorMessage ? (
              <section className="status-panel">
                <span className="section-label">Status</span>
                <div className="error-message">{errorMessage}</div>
              </section>
            ) : (
              <section className="status-panel status-panel-muted">
                <span className="section-label">Status</span>
                <p>{statusMessage}</p>
              </section>
            )}
          </>
        ) : (
          <>
            <section className="results-toolbar">
              <div>
                <span className="section-label">Dashboard</span>
                <p>{statusMessage}</p>
              </div>
              <SearchForm
                username={username}
                onUsernameChange={setUsername}
                onSubmit={handleAnalyze}
                isLoading={isLoading}
                label="Analyze another profile"
                buttonLabel="Analyze"
                inputId="profile-github-username"
              />
            </section>

            {isLoading ? (
              <section className="loading-grid" aria-live="polite">
                <div className="panel skeleton tall" />
                <div className="panel skeleton" />
                <div className="panel skeleton" />
              </section>
            ) : null}

            {errorMessage && !isLoading ? (
              <section className="status-panel">
                <span className="section-label">Status</span>
                <div className="error-message">{errorMessage}</div>
              </section>
            ) : null}

            {analysis ? (
              <div className="results-stack">
                <ProfileCard user={analysis.user} analytics={analysis.analytics} />
                <StatsGrid user={analysis.user} analytics={analysis.analytics} />
                <Suspense
                  fallback={
                    <section className="chart-loading" aria-live="polite">
                      <div className="panel skeleton" />
                    </section>
                  }
                >
                  <ChartsSection analytics={analysis.analytics} theme={theme} />
                </Suspense>
                <RepoList analytics={analysis.analytics} />
              </div>
            ) : null}
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}
