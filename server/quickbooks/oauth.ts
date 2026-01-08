/**
 * QuickBooks OAuth 2.0 Service
 */
import OAuthClient from "intuit-oauth";
import { getDb } from "../db";
import { quickbooksConnections } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const QUICKBOOKS_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || "";
const QUICKBOOKS_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || "";
const QUICKBOOKS_REDIRECT_URI = process.env.QUICKBOOKS_REDIRECT_URI || "";
const QUICKBOOKS_ENVIRONMENT = (process.env.QUICKBOOKS_ENVIRONMENT || "sandbox") as "sandbox" | "production";

const QUICKBOOKS_SCOPES = [
  "com.intuit.quickbooks.accounting",
  "openid",
];

export function createOAuthClient(): OAuthClient {
  if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET) {
    throw new Error("QuickBooks OAuth credentials not configured");
  }
  return new OAuthClient({
    clientId: QUICKBOOKS_CLIENT_ID,
    clientSecret: QUICKBOOKS_CLIENT_SECRET,
    environment: QUICKBOOKS_ENVIRONMENT,
    redirectUri: QUICKBOOKS_REDIRECT_URI,
    logging: process.env.NODE_ENV !== "production",
  });
}

export function getAuthorizationUrl(state: string): string {
  const oauthClient = createOAuthClient();
  return oauthClient.authorizeUri({
    scope: QUICKBOOKS_SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(
  code: string,
  realmId: string,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  try {
    const oauthClient = createOAuthClient();
    const redirectUrl = `${QUICKBOOKS_REDIRECT_URI}?code=${code}&realmId=${realmId}`;
    const authResponse = await oauthClient.createToken(redirectUrl);
    const tokenData = authResponse.getJson();

    const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const refreshTokenExpiresAt = new Date(Date.now() + tokenData.x_refresh_token_expires_in * 1000);

    const existing = await db.select().from(quickbooksConnections)
      .where(eq(quickbooksConnections.userId, userId)).limit(1);

    if (existing.length > 0) {
      await db.update(quickbooksConnections)
        .set({
          realmId,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          isActive: true,
          environment: QUICKBOOKS_ENVIRONMENT,
          updatedAt: new Date(),
        })
        .where(eq(quickbooksConnections.userId, userId));
    } else {
      await db.insert(quickbooksConnections).values({
        userId,
        realmId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt,
        refreshTokenExpiresAt,
        isActive: true,
        environment: QUICKBOOKS_ENVIRONMENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("QuickBooks token exchange error:", error);
    return { success: false, error: error.message || "Failed to exchange code for tokens" };
  }
}

export async function refreshAccessToken(userId: number): Promise<{ success: boolean; token?: string; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  try {
    const connections = await db.select().from(quickbooksConnections)
      .where(eq(quickbooksConnections.userId, userId)).limit(1);

    if (connections.length === 0) {
      return { success: false, error: "No QuickBooks connection found" };
    }

    const connection = connections[0];
    const oauthClient = createOAuthClient();
    oauthClient.setToken({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      token_type: "bearer",
      expires_in: 3600,
      x_refresh_token_expires_in: 8726400,
      realmId: connection.realmId,
    });

    const authResponse = await oauthClient.refresh();
    const tokenData = authResponse.getJson();

    const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const refreshTokenExpiresAt = new Date(Date.now() + tokenData.x_refresh_token_expires_in * 1000);

    await db.update(quickbooksConnections)
      .set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt,
        refreshTokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(quickbooksConnections.userId, userId));

    return { success: true, token: tokenData.access_token };
  } catch (error: any) {
    console.error("QuickBooks token refresh error:", error);
    return { success: false, error: error.message || "Failed to refresh token" };
  }
}

export async function getValidAccessToken(userId: number): Promise<{ token: string; realmId: string } | null> {
  const db = await getDb();
  if (!db) return null;

  const connections = await db.select().from(quickbooksConnections)
    .where(eq(quickbooksConnections.userId, userId)).limit(1);

  if (!connections || connections.length === 0 || !connections[0] || !connections[0].isActive) {
    return null;
  }

  const connection = connections[0];
  const now = new Date();

  if (connection.tokenExpiresAt > now) {
    return { token: connection.accessToken, realmId: connection.realmId };
  }

  if (connection.refreshTokenExpiresAt <= now) {
    await db.update(quickbooksConnections)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(quickbooksConnections.userId, userId));
    return null;
  }

  const refreshResult = await refreshAccessToken(userId);
  if (refreshResult.success && refreshResult.token) {
    return { token: refreshResult.token, realmId: connection.realmId };
  }

  return null;
}

export async function getConnectionStatus(userId: number): Promise<{
  connected: boolean;
  companyName: string | null;
  realmId: string | null;
  environment: string | null;
  lastSyncAt: Date | null;
}> {
  const db = await getDb();
  if (!db) {
    return { connected: false, companyName: null, realmId: null, environment: null, lastSyncAt: null };
  }

  const connections = await db.select().from(quickbooksConnections)
    .where(eq(quickbooksConnections.userId, userId)).limit(1);

  if (connections.length === 0 || !connections[0].isActive) {
    return { connected: false, companyName: null, realmId: null, environment: null, lastSyncAt: null };
  }

  const connection = connections[0];
  return {
    connected: true,
    companyName: connection.companyName,
    realmId: connection.realmId,
    environment: connection.environment,
    lastSyncAt: connection.lastSyncAt,
  };
}

export async function disconnectQuickBooks(userId: number): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  try {
    await db.update(quickbooksConnections)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(quickbooksConnections.userId, userId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLastSyncTime(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(quickbooksConnections)
    .set({ lastSyncAt: new Date(), updatedAt: new Date() })
    .where(eq(quickbooksConnections.userId, userId));
}

export function isQuickBooksConfigured(): boolean {
  return !!(QUICKBOOKS_CLIENT_ID && QUICKBOOKS_CLIENT_SECRET && QUICKBOOKS_REDIRECT_URI);
}
