import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  }),
  getClientById: vi.fn(),
  getClientsByUserId: vi.fn().mockResolvedValue([]),
  getInvoiceById: vi.fn(),
  getInvoicesByUserId: vi.fn().mockResolvedValue([]),
  getLineItemsByInvoiceId: vi.fn().mockResolvedValue([]),
}));

// Mock intuit-oauth
vi.mock("intuit-oauth", () => {
  const mockClient = {
    authorizeUri: vi.fn().mockReturnValue("https://appcenter.intuit.com/connect/oauth2?test=1"),
    createToken: vi.fn().mockResolvedValue({
      getJson: () => ({
        access_token: "test_access_token",
        refresh_token: "test_refresh_token",
        expires_in: 3600,
        x_refresh_token_expires_in: 8726400,
        realmId: "test_realm_id",
      }),
    }),
    refresh: vi.fn().mockResolvedValue({
      getJson: () => ({
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
        expires_in: 3600,
        x_refresh_token_expires_in: 8726400,
      }),
    }),
    setToken: vi.fn(),
    makeApiCall: vi.fn().mockResolvedValue({
      text: () => JSON.stringify({ Customer: { Id: "123", DisplayName: "Test Customer" } }),
    }),
  };

  return {
    default: vi.fn().mockImplementation(() => mockClient),
  };
});

describe("QuickBooks OAuth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.QUICKBOOKS_CLIENT_ID = "test_client_id";
    process.env.QUICKBOOKS_CLIENT_SECRET = "test_client_secret";
    process.env.QUICKBOOKS_REDIRECT_URI = "http://localhost:3000/quickbooks/callback";
    process.env.QUICKBOOKS_ENVIRONMENT = "sandbox";
  });

  describe("isQuickBooksConfigured", () => {
    it("should return true when all required env vars are set", async () => {
      const { isQuickBooksConfigured } = await import("./oauth");
      expect(isQuickBooksConfigured()).toBe(true);
    });
  });

  describe("createOAuthClient", () => {
    it("should create an OAuth client with correct configuration", async () => {
      const { createOAuthClient } = await import("./oauth");
      const client = createOAuthClient();
      expect(client).toBeDefined();
    });
  });

  describe("getAuthorizationUrl", () => {
    it("should return a valid authorization URL", async () => {
      const { getAuthorizationUrl } = await import("./oauth");
      const state = "test_state";
      const url = getAuthorizationUrl(state);
      expect(url).toContain("https://appcenter.intuit.com");
    });
  });
});

describe("QuickBooks API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.QUICKBOOKS_CLIENT_ID = "test_client_id";
    process.env.QUICKBOOKS_CLIENT_SECRET = "test_client_secret";
    process.env.QUICKBOOKS_REDIRECT_URI = "http://localhost:3000/quickbooks/callback";
    process.env.QUICKBOOKS_ENVIRONMENT = "sandbox";
  });

  describe("makeQBApiCall", () => {
    it("should return NOT_CONNECTED when user has no connection", async () => {
      const { makeQBApiCall } = await import("./client");
      const result = await makeQBApiCall(999, "/test", "GET");
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NOT_CONNECTED");
    });
  });
});

describe("Customer Sync Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.QUICKBOOKS_CLIENT_ID = "test_client_id";
    process.env.QUICKBOOKS_CLIENT_SECRET = "test_client_secret";
    process.env.QUICKBOOKS_REDIRECT_URI = "http://localhost:3000/quickbooks/callback";
    process.env.QUICKBOOKS_ENVIRONMENT = "sandbox";
  });

  describe("getCustomerMapping", () => {
    it("should return null when no mapping exists", async () => {
      const { getCustomerMapping } = await import("./customerSync");
      const result = await getCustomerMapping(1, 1);
      expect(result).toBeNull();
    });
  });

  describe("getClientSyncStatus", () => {
    it("should return not synced when no mapping exists", async () => {
      const { getClientSyncStatus } = await import("./customerSync");
      const result = await getClientSyncStatus(1, 1);
      expect(result.synced).toBe(false);
      expect(result.qbCustomerId).toBeNull();
    });
  });
});

describe("Invoice Sync Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.QUICKBOOKS_CLIENT_ID = "test_client_id";
    process.env.QUICKBOOKS_CLIENT_SECRET = "test_client_secret";
    process.env.QUICKBOOKS_REDIRECT_URI = "http://localhost:3000/quickbooks/callback";
    process.env.QUICKBOOKS_ENVIRONMENT = "sandbox";
  });

  describe("getInvoiceMapping", () => {
    it("should return null when no mapping exists", async () => {
      const { getInvoiceMapping } = await import("./invoiceSync");
      const result = await getInvoiceMapping(1, 1);
      expect(result).toBeNull();
    });
  });

  describe("getInvoiceSyncStatus", () => {
    it("should return not synced when no mapping exists", async () => {
      const { getInvoiceSyncStatus } = await import("./invoiceSync");
      const result = await getInvoiceSyncStatus(1, 1);
      expect(result.synced).toBe(false);
      expect(result.qbInvoiceId).toBeNull();
    });
  });

  describe("getSyncHistory", () => {
    it("should return empty array when no history exists", async () => {
      const { getSyncHistory } = await import("./invoiceSync");
      const result = await getSyncHistory(1);
      expect(result).toEqual([]);
    });
  });
});
