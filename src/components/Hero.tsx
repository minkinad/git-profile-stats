import { SearchForm } from './SearchForm';

interface HeroProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onAnalyze: () => void;
  onExamplePick: (value: string) => void;
  isLoading: boolean;
  statusMessage: string;
  errorMessage: string | null;
}

const exampleUsernames = ['torvalds', 'gaearon', 'sindresorhus'];

export function Hero({
  username,
  onUsernameChange,
  onAnalyze,
  onExamplePick,
  isLoading,
  statusMessage,
  errorMessage,
}: HeroProps) {
  return (
    <section className="hero hero-home">
      <div className="hero-copy">
        <span className="eyebrow">GitHub profile analytics</span>
        <h1>Check any public GitHub profile in a few seconds.</h1>
        <p className="hero-description">
          Open a focused snapshot of profile metrics, repository activity, language mix,
          and notable projects without leaving the browser.
        </p>
      </div>
      <div className="hero-panel panel">
        <SearchForm
          username={username}
          onUsernameChange={onUsernameChange}
          onSubmit={onAnalyze}
          isLoading={isLoading}
          buttonLabel="Analyze profile"
          inputId="hero-github-username"
          hideLabel
        />
        <div className="hero-examples">
          <span className="hero-examples-label">Try an example</span>
          <div className="hero-example-list">
            {exampleUsernames.map((exampleUsername) => (
              <button
                key={exampleUsername}
                className="hero-example-chip"
                type="button"
                onClick={() => onExamplePick(exampleUsername)}
                disabled={isLoading}
              >
                @{exampleUsername}
              </button>
            ))}
          </div>
        </div>
        <div
          className={errorMessage ? 'hero-status hero-status-error' : 'hero-status'}
          aria-live="polite"
        >
          {errorMessage ?? statusMessage}
        </div>
        <div className="hero-footnote">
          Public data only. Charts and repository insights are calculated in the browser.
        </div>
      </div>
    </section>
  );
}
