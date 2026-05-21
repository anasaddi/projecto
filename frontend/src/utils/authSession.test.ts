import { describe, it, expect, beforeEach } from 'vitest';
import { isAdminRole, setAdminSession, clearAuthSessionFlags } from '../utils/authSession';

describe('authSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('isAdminRole false by default', () => {
    expect(isAdminRole()).toBe(false);
  });

  it('setAdminSession sets admin role without JWT in localStorage', () => {
    setAdminSession(true);
    expect(isAdminRole()).toBe(true);
    expect(localStorage.getItem('km-training-allowed')).toBe('1');
    expect(localStorage.getItem('km-admin-token')).toBeNull();
  });

  it('clearAuthSessionFlags removes session flags', () => {
    setAdminSession(true);
    clearAuthSessionFlags();
    expect(isAdminRole()).toBe(false);
  });
});
