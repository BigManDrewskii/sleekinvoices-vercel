/**
 * QuickBooks API Client
 */
import OAuthClient from "intuit-oauth";
import { getValidAccessToken, createOAuthClient } from "./oauth";

const QB_API_BASE = {
  sandbox: "https://sandbox-quickbooks.api.intuit.com/v3/company",
  production: "https://quickbooks.api.intuit.com/v3/company",
};

const QUICKBOOKS_ENVIRONMENT = (process.env.QUICKBOOKS_ENVIRONMENT ||
  "sandbox") as "sandbox" | "production";

export interface QBApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export async function makeQBApiCall<T = any>(
  userId: number,
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: any
): Promise<QBApiResponse<T>> {
  const tokenData = await getValidAccessToken(userId);

  if (!tokenData) {
    return {
      success: false,
      error: "Not connected to QuickBooks",
      errorCode: "NOT_CONNECTED",
    };
  }

  const { token, realmId } = tokenData;
  const baseUrl = QB_API_BASE[QUICKBOOKS_ENVIRONMENT];
  const url = `${baseUrl}/${realmId}${endpoint}`;

  try {
    const oauthClient = createOAuthClient();
    oauthClient.setToken({
      access_token: token,
      refresh_token: "",
      token_type: "bearer",
      expires_in: 3600,
      x_refresh_token_expires_in: 0,
      realmId,
    });

    const response = await oauthClient.makeApiCall({
      url,
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = response.text();
    const data = responseText ? JSON.parse(responseText) : null;

    if (data?.Fault) {
      return {
        success: false,
        error: data.Fault.Error?.[0]?.Message || "QuickBooks API error",
        errorCode: data.Fault.Error?.[0]?.code || "QB_ERROR",
      };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("QuickBooks API call error:", error);
    return {
      success: false,
      error: error.message || "Failed to call QuickBooks API",
      errorCode: "API_ERROR",
    };
  }
}

export async function queryQB<T = any>(
  userId: number,
  query: string
): Promise<QBApiResponse<T[]>> {
  const encodedQuery = encodeURIComponent(query);
  const response = await makeQBApiCall<{
    QueryResponse: { [key: string]: T[] };
  }>(userId, `/query?query=${encodedQuery}`, "GET");

  if (!response.success)
    return {
      success: false,
      error: response.error,
      errorCode: response.errorCode,
    };

  const queryResponse = response.data?.QueryResponse;
  if (!queryResponse) return { success: true, data: [] };

  const entityKey = Object.keys(queryResponse).find(
    k => k !== "startPosition" && k !== "maxResults" && k !== "totalCount"
  );
  const entities = entityKey ? queryResponse[entityKey] : [];

  return { success: true, data: entities };
}

export async function getQBEntity<T = any>(
  userId: number,
  entityType: string,
  entityId: string
): Promise<QBApiResponse<T>> {
  const response = await makeQBApiCall<{ [key: string]: T }>(
    userId,
    `/${entityType.toLowerCase()}/${entityId}`,
    "GET"
  );
  if (!response.success) return response as QBApiResponse<T>;
  const entity = response.data?.[entityType];
  return { success: true, data: entity };
}

export async function createQBEntity<T = any>(
  userId: number,
  entityType: string,
  data: any
): Promise<QBApiResponse<T>> {
  const response = await makeQBApiCall<{ [key: string]: T }>(
    userId,
    `/${entityType.toLowerCase()}`,
    "POST",
    data
  );
  if (!response.success) return response as QBApiResponse<T>;
  const entity = response.data?.[entityType];
  return { success: true, data: entity };
}

export async function updateQBEntity<T = any>(
  userId: number,
  entityType: string,
  data: any
): Promise<QBApiResponse<T>> {
  const response = await makeQBApiCall<{ [key: string]: T }>(
    userId,
    `/${entityType.toLowerCase()}?operation=update`,
    "POST",
    data
  );
  if (!response.success) return response as QBApiResponse<T>;
  const entity = response.data?.[entityType];
  return { success: true, data: entity };
}

export async function deleteQBEntity(
  userId: number,
  entityType: string,
  entityId: string,
  syncToken: string
): Promise<QBApiResponse<void>> {
  return await makeQBApiCall(
    userId,
    `/${entityType.toLowerCase()}?operation=delete`,
    "POST",
    { Id: entityId, SyncToken: syncToken }
  );
}
