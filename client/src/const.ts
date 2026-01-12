export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Check if we're in local development mode with auth bypass enabled.
 * This is determined by the VITE_SKIP_AUTH environment variable.
 */
export const isLocalDevMode = () => {
  return import.meta.env.VITE_SKIP_AUTH === "true" || 
         import.meta.env.MODE === "development" && !import.meta.env.VITE_OAUTH_PORTAL_URL;
};

/**
 * Generate login URL at runtime so redirect URI reflects the current origin.
 * In local dev mode with SKIP_AUTH, returns a placeholder that won't be used.
 */
export const getLoginUrl = () => {
  // In local dev mode, return a safe placeholder URL
  // The auth system will bypass login anyway when SKIP_AUTH=true
  if (isLocalDevMode()) {
    if (import.meta.env.DEV) {
      console.log("[Auth] Local dev mode detected - auth bypass enabled");
    }
    return "/"; // Redirect to home instead of OAuth
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Validate required environment variables
  if (!oauthPortalUrl || !appId) {
    if (import.meta.env.DEV) {
      console.error("[Auth] Missing required environment variables:");
      if (!oauthPortalUrl) console.error("  - VITE_OAUTH_PORTAL_URL");
      if (!appId) console.error("  - VITE_APP_ID");
      console.error("[Auth] Set VITE_SKIP_AUTH=true for local development without OAuth");
    }
    return "/";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
