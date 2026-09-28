import { describe, expect, it } from 'vitest';
import { safeRedirect } from '#utils/urls.js';

describe('safeRedirect', () => {
  it('allows relative paths', () => {
    expect(safeRedirect('/account')).toBe('/account');
    expect(safeRedirect('/auth/login?next=1')).toBe('/auth/login?next=1');
  });

  it('rejects absolute URLs and protocol-relative URLs', () => {
    expect(safeRedirect('https://evil.example/phish')).toBe('/');
    expect(safeRedirect('//evil.example/phish')).toBe('/');
    expect(safeRedirect('http://localhost:3000/ok')).toBe('/');
  });

  it('rejects backslash and nested-auth tricks', () => {
    expect(safeRedirect('\\evil')).toBe('/');
    expect(safeRedirect('/\\evil')).toBe('/');
    expect(safeRedirect('javascript:alert(1)')).toBe('/');
  });

  it('uses the provided fallback', () => {
    expect(safeRedirect(null, '/home')).toBe('/home');
  });
});
