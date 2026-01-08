declare module "intuit-oauth" {
  interface OAuthClientConfig {
    clientId: string;
    clientSecret: string;
    environment: "sandbox" | "production";
    redirectUri: string;
    logging?: boolean;
  }

  interface TokenData {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId?: string;
  }

  interface AuthResponse {
    getJson(): TokenData;
    text(): string;
  }

  interface ApiCallOptions {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    body?: string;
  }

  class OAuthClient {
    constructor(config: OAuthClientConfig);
    authorizeUri(options: { scope: string[]; state: string }): string;
    createToken(url: string): Promise<AuthResponse>;
    refresh(): Promise<AuthResponse>;
    refreshUsingToken(refreshToken: string): Promise<AuthResponse>;
    setToken(token: TokenData): void;
    getToken(): TokenData;
    makeApiCall(options: ApiCallOptions): Promise<AuthResponse>;
    static scopes: {
      Accounting: string;
      Payment: string;
      Payroll: string;
      TimeTracking: string;
      Benefits: string;
      Profile: string;
      Email: string;
      Phone: string;
      Address: string;
      OpenId: string;
    };
  }

  export default OAuthClient;
}
