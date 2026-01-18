export const SEED_CONFIG = {
  users: 3,
  clientsPerUser: 15,
  productsPerUser: 10,
  invoicesPerUser: 50,
  recurringInvoicesPerUser: 5,
  estimatesPerUser: 10,
  expensesPerUser: 30,
  paymentsPerUser: 25,
  emailLogsPerUser: 40,
  templatesPerUser: 3,
  customFieldsPerUser: 5,
  batchTemplatesPerUser: 2,
  clientTagsPerUser: 5,
  auditLogsPerUser: 50,
  aiLogsPerUser: 15,
};

export const INVOICE_STATUS_DISTRIBUTION = {
  draft: 10,
  sent: 10,
  viewed: 10,
  paid: 15,
  overdue: 3,
  canceled: 2,
};

export const ESTIMATE_STATUS_DISTRIBUTION = {
  draft: 2,
  sent: 2,
  viewed: 2,
  accepted: 2,
  rejected: 1,
  expired: 1,
};

export const RECURRING_FREQUENCY_DISTRIBUTION = {
  weekly: 1,
  monthly: 3,
  yearly: 1,
};

export const PAYMENT_METHOD_DISTRIBUTION = {
  stripe: 0.5,
  manual: 0.2,
  bank_transfer: 0.15,
  check: 0.1,
  cash: 0.03,
  crypto: 0.02,
};

export const PAYMENT_STATUS_DISTRIBUTION = {
  completed: 0.8,
  pending: 0.1,
  failed: 0.05,
  refunded: 0.05,
};

export const EMAIL_DELIVERY_STATUS_DISTRIBUTION = {
  sent: 1.0,
  delivered: 0.7,
  opened: 0.4,
  clicked: 0.2,
  bounced: 0.05,
  failed: 0.05,
};

export const EXPENSE_PAYMENT_METHOD_DISTRIBUTION = {
  cash: 0.15,
  credit_card: 0.4,
  bank_transfer: 0.3,
  check: 0.1,
  other: 0.05,
};

export const TEMPLATE_PRESETS = ["sleek", "modern", "classic"] as const;

export const CRYPTO_CURRENCIES = [
  { code: "BTC", network: "mainnet" },
  { code: "ETH", network: "mainnet" },
  { code: "USDC", network: "polygon" },
  { code: "USDT", network: "arbitrum" },
];

export const CUSTOM_FIELD_TYPES = ["text", "number", "date", "select"] as const;

export const AI_OPERATION_TYPES = ["smart_compose", "ai_assistant"] as const;

export const AUDIT_LOG_ACTIONS = [
  "create",
  "update",
  "delete",
  "view",
  "send",
  "pay",
] as const;

export const AUDIT_LOG_ENTITY_TYPES = [
  "invoice",
  "client",
  "payment",
  "product",
  "expense",
  "estimate",
] as const;

export const USER_IPS = [
  "192.168.1.100",
  "10.0.0.50",
  "172.16.0.10",
  "192.168.0.25",
  "10.1.1.100",
];

export const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

export const DISCOUNT_TYPE_DISTRIBUTION = {
  percentage: 0.5,
  fixed: 0.3,
  none: 0.2,
};

export const TAX_RATE_DISTRIBUTION = {
  0: 0.4,
  10: 0.3,
  20: 0.3,
};
