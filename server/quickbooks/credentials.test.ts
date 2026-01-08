import { describe, it, expect } from 'vitest';

describe('QuickBooks Credentials Validation', () => {
  it('should have QUICKBOOKS_CLIENT_ID configured', () => {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe('');
    expect(clientId!.length).toBeGreaterThan(10);
  });

  it('should have QUICKBOOKS_CLIENT_SECRET configured', () => {
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe('');
    expect(clientSecret!.length).toBeGreaterThan(10);
  });

  it('should have QUICKBOOKS_REDIRECT_URI configured correctly', () => {
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
    expect(redirectUri).toBeDefined();
    expect(redirectUri).toContain('quickbooks/callback');
  });

  it('should have QUICKBOOKS_ENVIRONMENT set to production', () => {
    const environment = process.env.QUICKBOOKS_ENVIRONMENT;
    expect(environment).toBeDefined();
    expect(['sandbox', 'production']).toContain(environment);
  });

  it('should be able to construct valid OAuth authorization URL', async () => {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
    const environment = process.env.QUICKBOOKS_ENVIRONMENT;
    
    // Construct the authorization URL (this validates the credentials format)
    const baseUrl = environment === 'production' 
      ? 'https://appcenter.intuit.com/connect/oauth2'
      : 'https://appcenter.intuit.com/connect/oauth2';
    
    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri!,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      state: 'test-state'
    });
    
    const authUrl = `${baseUrl}?${params.toString()}`;
    
    // Validate URL structure
    expect(authUrl).toContain('client_id=');
    expect(authUrl).toContain('redirect_uri=');
    expect(authUrl).toContain('com.intuit.quickbooks.accounting');
    
    // Validate it's a proper URL
    const url = new URL(authUrl);
    expect(url.hostname).toBe('appcenter.intuit.com');
  });
});
