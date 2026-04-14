import { FormEvent } from 'react';

interface SearchFormProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  label?: string;
  buttonLabel?: string;
  inputId?: string;
}

export function SearchForm({
  username,
  onUsernameChange,
  onSubmit,
  isLoading,
  label = 'GitHub username',
  buttonLabel = 'Analyze',
  inputId = 'github-username',
}: SearchFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <label className="search-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="search-row">
        <input
          id={inputId}
          className="search-input"
          type="text"
          autoComplete="off"
          placeholder="e.g. torvalds"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          aria-label="GitHub username"
        />
        <button className="search-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Analyzing...' : buttonLabel}
        </button>
      </div>
    </form>
  );
}
