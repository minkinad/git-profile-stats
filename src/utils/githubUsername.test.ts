import { describe, expect, it } from 'vitest';
import {
  isValidGitHubUsername,
  normalizeGitHubUsernameInput,
} from './githubUsername';

describe('normalizeGitHubUsernameInput', () => {
  it.each([
    [' torvalds ', 'torvalds'],
    ['@torvalds', 'torvalds'],
    ['github.com/torvalds', 'torvalds'],
    ['www.github.com/torvalds/', 'torvalds'],
    ['https://github.com/torvalds?tab=repositories', 'torvalds'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeGitHubUsernameInput(input)).toBe(expected);
  });

  it('does not extract a username from a non-GitHub URL', () => {
    expect(normalizeGitHubUsernameInput('https://example.com/torvalds')).toBe(
      'https://example.com/torvalds',
    );
  });
});

describe('isValidGitHubUsername', () => {
  it.each(['a', 'github-actions', 'user123'])('accepts %s', (username) => {
    expect(isValidGitHubUsername(username)).toBe(true);
  });

  it.each(['-user', 'user-', 'user_name', 'a'.repeat(40)])(
    'rejects %s',
    (username) => {
      expect(isValidGitHubUsername(username)).toBe(false);
    },
  );
});
