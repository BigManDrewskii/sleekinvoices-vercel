import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Authentication Flow Enhancement', () => {
  describe('LandingNavigation Component', () => {
    const landingNavPath = path.join(__dirname, '../client/src/components/LandingNavigation.tsx');
    let landingNavContent: string;

    beforeEach(() => {
      landingNavContent = fs.readFileSync(landingNavPath, 'utf-8');
    });

    it('should import useAuth hook', () => {
      expect(landingNavContent).toContain('import { useAuth }');
    });

    it('should use useAuth hook with redirectOnUnauthenticated: false', () => {
      expect(landingNavContent).toContain('useAuth({ redirectOnUnauthenticated: false })');
    });

    it('should have conditional rendering for authenticated state', () => {
      expect(landingNavContent).toContain('isAuthenticated');
    });

    it('should show Dashboard link for authenticated users', () => {
      expect(landingNavContent).toContain('Dashboard');
      expect(landingNavContent).toContain('href="/dashboard"');
    });

    it('should show Sign In link for unauthenticated users', () => {
      expect(landingNavContent).toContain('Sign In');
      expect(landingNavContent).toContain('getLoginUrl()');
    });

    it('should have loading state handling', () => {
      expect(landingNavContent).toContain('loading');
      expect(landingNavContent).toContain('Loader2');
    });

    it('should have getSignUpUrl function for sign up', () => {
      expect(landingNavContent).toContain('getSignUpUrl');
      expect(landingNavContent).toContain('type", "signUp"');
    });
  });

  describe('AIAssistantContext', () => {
    const contextPath = path.join(__dirname, '../client/src/contexts/AIAssistantContext.tsx');
    let contextContent: string;

    beforeEach(() => {
      contextContent = fs.readFileSync(contextPath, 'utf-8');
    });

    it('should import useAuth hook', () => {
      expect(contextContent).toContain('import { useAuth }');
    });

    it('should check authentication state', () => {
      expect(contextContent).toContain('isAuthenticated');
    });

    it('should define public pages where AI should not show', () => {
      expect(contextContent).toContain('PUBLIC_PAGES');
      expect(contextContent).toContain('/landing');
      expect(contextContent).toContain('/portal');
    });

    it('should have isAvailable property in context', () => {
      expect(contextContent).toContain('isAvailable');
      expect(contextContent).toContain('isAvailable: boolean');
    });

    it('should only show AI components when authenticated and not on public pages', () => {
      expect(contextContent).toContain('isAvailable && (');
    });

    it('should prevent open/toggle when not available', () => {
      expect(contextContent).toContain('if (!isAvailable) return');
    });
  });

  describe('AIAssistant Component', () => {
    const assistantPath = path.join(__dirname, '../client/src/components/AIAssistant.tsx');
    let assistantContent: string;

    beforeEach(() => {
      assistantContent = fs.readFileSync(assistantPath, 'utf-8');
    });

    it('should have auth-aware queries with enabled flag', () => {
      expect(assistantContent).toContain('enabled: isAuthenticated');
    });

    it('should handle authentication errors in chat mutation', () => {
      expect(assistantContent).toContain('UNAUTHORIZED');
      expect(assistantContent).toContain('session has expired');
    });

    it('should have retry: false for protected queries', () => {
      expect(assistantContent).toContain('retry: false');
    });
  });

  describe('Home Page Routing', () => {
    const homePath = path.join(__dirname, '../client/src/pages/Home.tsx');
    let homeContent: string;

    beforeEach(() => {
      homeContent = fs.readFileSync(homePath, 'utf-8');
    });

    it('should use useAuth hook', () => {
      expect(homeContent).toContain('useAuth');
    });

    it('should redirect authenticated users to dashboard', () => {
      expect(homeContent).toContain('isAuthenticated');
      expect(homeContent).toContain('/dashboard');
    });

    it('should redirect unauthenticated users to landing', () => {
      expect(homeContent).toContain('/landing');
    });

    it('should show loading state while checking auth', () => {
      expect(homeContent).toContain('loading');
      expect(homeContent).toContain('GearLoader');
    });
  });

  describe('useAuth Hook', () => {
    const authHookPath = path.join(__dirname, '../client/src/_core/hooks/useAuth.ts');
    let authHookContent: string;

    beforeEach(() => {
      authHookContent = fs.readFileSync(authHookPath, 'utf-8');
    });

    it('should have redirectOnUnauthenticated option', () => {
      expect(authHookContent).toContain('redirectOnUnauthenticated');
    });

    it('should return isAuthenticated state', () => {
      expect(authHookContent).toContain('isAuthenticated');
    });

    it('should return loading state', () => {
      expect(authHookContent).toContain('loading');
    });

    it('should handle local dev mode', () => {
      expect(authHookContent).toContain('isLocalDevMode');
    });

    it('should persist user info to localStorage', () => {
      expect(authHookContent).toContain('localStorage.setItem');
      expect(authHookContent).toContain('manus-runtime-user-info');
    });
  });
});
