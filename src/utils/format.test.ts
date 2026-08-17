import { describe, expect, it } from 'vitest';
import { formatExternalLink } from './format';

describe('formatExternalLink', () => {
  it('adds HTTPS to a bare domain', () => {
    expect(formatExternalLink('example.com/profile')).toBe('https://example.com/profile');
  });

  it('keeps valid HTTP and HTTPS links', () => {
    expect(formatExternalLink('http://example.com')).toBe('http://example.com/');
    expect(formatExternalLink('https://example.com')).toBe('https://example.com/');
  });

  it.each(['javascript:alert(1)', 'not a domain', '', null])(
    'rejects unsafe or invalid value %s',
    (value) => {
      expect(formatExternalLink(value)).toBeNull();
    },
  );
});
