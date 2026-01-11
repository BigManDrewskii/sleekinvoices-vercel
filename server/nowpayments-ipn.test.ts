/**
 * NOWPayments IPN Signature Verification Tests
 * 
 * Tests that the IPN secret is properly configured and signature verification works.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// Mock environment variables before importing the module
const originalEnv = process.env;

describe('NOWPayments IPN Signature Verification', () => {
  beforeEach(() => {
    // Reset modules to pick up new env vars
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should have NOWPAYMENTS_IPN_SECRET environment variable set', () => {
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    expect(ipnSecret).toBeDefined();
    expect(ipnSecret).not.toBe('');
    expect(typeof ipnSecret).toBe('string');
  });

  it('should have NOWPAYMENTS_API_KEY environment variable set', () => {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
  });

  it('should have NOWPAYMENTS_PUBLIC_KEY environment variable set', () => {
    const publicKey = process.env.NOWPAYMENTS_PUBLIC_KEY;
    expect(publicKey).toBeDefined();
    expect(publicKey).not.toBe('');
  });

  it('should correctly verify a valid IPN signature', async () => {
    const { verifyIPNSignature } = await import('./lib/nowpayments');
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET!;
    
    // Create a test payload
    const payload = {
      payment_id: 12345,
      payment_status: 'finished',
      pay_address: '0x1234567890abcdef',
      price_amount: 100,
      price_currency: 'usd',
      order_id: 'test-order-123',
    };

    // Sort and stringify the payload (same as NOWPayments does)
    const sortedPayload = Object.keys(payload)
      .sort()
      .reduce((acc, key) => {
        acc[key] = (payload as Record<string, unknown>)[key];
        return acc;
      }, {} as Record<string, unknown>);
    
    const payloadString = JSON.stringify(sortedPayload);
    
    // Generate a valid signature using the IPN secret
    const hmac = crypto.createHmac('sha512', ipnSecret);
    hmac.update(payloadString);
    const validSignature = hmac.digest('hex');

    // Verify the signature
    const isValid = verifyIPNSignature(payload, validSignature);
    expect(isValid).toBe(true);
  });

  it('should reject an invalid IPN signature', async () => {
    const { verifyIPNSignature } = await import('./lib/nowpayments');
    
    const payload = {
      payment_id: 12345,
      payment_status: 'finished',
      order_id: 'test-order-123',
    };

    // Use an invalid signature
    const invalidSignature = 'invalid-signature-that-should-not-match';

    const isValid = verifyIPNSignature(payload, invalidSignature);
    expect(isValid).toBe(false);
  });

  it('should reject a signature generated with wrong secret', async () => {
    const { verifyIPNSignature } = await import('./lib/nowpayments');
    
    const payload = {
      payment_id: 12345,
      payment_status: 'finished',
      order_id: 'test-order-123',
    };

    // Generate signature with wrong secret
    const wrongSecret = 'wrong-secret-key';
    const sortedPayload = Object.keys(payload)
      .sort()
      .reduce((acc, key) => {
        acc[key] = (payload as Record<string, unknown>)[key];
        return acc;
      }, {} as Record<string, unknown>);
    
    const payloadString = JSON.stringify(sortedPayload);
    const hmac = crypto.createHmac('sha512', wrongSecret);
    hmac.update(payloadString);
    const wrongSignature = hmac.digest('hex');

    const isValid = verifyIPNSignature(payload, wrongSignature);
    expect(isValid).toBe(false);
  });
});
