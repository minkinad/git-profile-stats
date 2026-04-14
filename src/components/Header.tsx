import { MouseEvent } from 'react';
import { Logo } from './Logo';

interface HeaderProps {
  theme: 'light' | 'dark';
  isThemeAnimating: boolean;
  onToggleTheme: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function Header({
  theme,
  isThemeAnimating,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="site-header">
      <a className="brand-home-link" href="#" aria-label="Return to home page">
        <div className="brand-lockup">
          <Logo />
          <div>
            <span className="brand-name">gitProfileStats</span>
            <p className="brand-tagline">Public GitHub analytics, reduced to signal.</p>
          </div>
        </div>
      </a>

      <button
        className="theme-toggle"
        type="button"
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        aria-pressed={theme === 'dark'}
        onClick={onToggleTheme}
        disabled={isThemeAnimating}
      >
        <span className="theme-toggle-track" aria-hidden="true">
          <span className="theme-toggle-thumb" />
        </span>
        <span className="theme-toggle-label">
          {theme === 'light' ? 'Dark theme' : 'Light theme'}
        </span>
      </button>
    </header>
  );
}
