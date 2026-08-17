const GITHUB_HOSTS = new Set(['github.com', 'www.github.com']);

export const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

export function normalizeGitHubUsernameInput(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  const withoutAtSign = trimmed.startsWith('@')
    ? trimmed.slice(1).trim()
    : trimmed;
  const looksLikeGitHubUrl = /^(?:https?:\/\/)?(?:www\.)?github\.com(?:\/|$)/i.test(
    withoutAtSign,
  );

  if (!looksLikeGitHubUrl) {
    return withoutAtSign;
  }

  try {
    const url = new URL(
      /^https?:\/\//i.test(withoutAtSign)
        ? withoutAtSign
        : `https://${withoutAtSign}`,
    );

    if (!GITHUB_HOSTS.has(url.hostname.toLowerCase())) {
      return withoutAtSign;
    }

    const firstPathSegment = url.pathname.split('/').filter(Boolean)[0];
    return firstPathSegment ? decodeURIComponent(firstPathSegment).trim() : '';
  } catch {
    return withoutAtSign;
  }
}

export function isValidGitHubUsername(value: string): boolean {
  return GITHUB_USERNAME_PATTERN.test(value);
}
