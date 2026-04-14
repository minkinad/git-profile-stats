import { SearchForm } from './SearchForm';

interface HeroProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export function Hero({
  username,
  onUsernameChange,
  onAnalyze,
  isLoading,
}: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">GitHub analytics dashboard</span>
        <h1>Minimal signal for any public GitHub profile.</h1>
        <p className="hero-description">
          gitProfileStats turns usernames into a calm, monochrome snapshot of profile data,
          repository health, language mix, and standout projects.
        </p>
      </div>
      <div className="hero-panel">
        <SearchForm
          username={username}
          onUsernameChange={onUsernameChange}
          onSubmit={onAnalyze}
          isLoading={isLoading}
          buttonLabel="Open dashboard"
          inputId="hero-github-username"
        />
        <div className="hero-footnote">
          Public data only. Charts and repository insights are calculated directly in
          the browser.
        </div>
      </div>
    </section>
  );
}
