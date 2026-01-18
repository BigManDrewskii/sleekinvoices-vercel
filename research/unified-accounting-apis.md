# Unified Accounting API Platforms Research

## The Problem

Direct integration with accounting providers like QuickBooks requires:

- Lengthy compliance questionnaires
- Security audits
- Terms of Service and Privacy Policy pages
- IP address whitelisting
- Ongoing maintenance for each provider

## Solution: Unified API Platforms

These platforms have already completed the compliance work with all major accounting providers. You integrate once with them, and get access to 10+ accounting systems.

---

## 1. Merge.dev

**Website:** https://www.merge.dev/categories/accounting-api

**Supported Accounting Integrations:**

- QuickBooks Online
- QuickBooks Desktop (Beta)
- Xero
- NetSuite
- Sage Business Cloud Accounting
- Sage Intacct (Beta)
- FreshBooks
- Wave Financial
- Zoho Books
- Microsoft Dynamics 365 Business Central (Beta)
- FreeAgent
- Clear Books
- Moneybird

**Pricing:**

- **Launch (Free tier):** 3 free linked accounts, then $650/month for up to 10 accounts ($65/account after)
- **Professional:** Contract-based, custom fields, field-level scopes
- **Enterprise:** Contract-based, audit trail, dedicated support

**Pros:**

- One API for all accounting systems
- Normalized data models (invoices, customers, etc. work the same across all providers)
- They handle OAuth, token refresh, compliance
- Good documentation

**Cons:**

- Gets expensive at scale ($65/connected account)
- Some integrations are in Beta

---

## 2. Rutter

**Website:** https://www.rutter.com/

**Supported Accounting Integrations:**

- QuickBooks Online
- QuickBooks Desktop
- Xero
- NetSuite
- Sage Intacct
- Microsoft Dynamics
- FreshBooks
- Zoho Books
- Plus commerce platforms (Shopify, Stripe, etc.)

**Pricing:**

- **Free Starter Plan:** 30 days free, sandbox testing
- **Full Access Plan:** Custom quote (contact sales)

**Pros:**

- Free 30-day trial with sandbox
- Also covers commerce/payments platforms
- 99.999% uptime claimed
- SOC 2 Type II and ISO 27001 compliant

**Cons:**

- Pricing not transparent (requires sales call)
- Smaller company than Merge

---

## 3. Codat

**Website:** https://codat.io/

**Supported Integrations:**

- 20+ accounting platforms
- Banking integrations
- Commerce platforms

**Pricing:**

- Not publicly listed (enterprise-focused)

**Pros:**

- Strong in UK/Europe market
- Good for lending/financial services use cases

**Cons:**

- More enterprise-focused
- Less transparent pricing

---

## Recommendation for SleekInvoices

**Best Option: Merge.dev**

Reasons:

1. **Free tier available** - 3 free linked accounts to start
2. **Covers all major providers** - QuickBooks, Xero, FreshBooks, Wave, etc.
3. **One integration = 12+ accounting systems** - No need to repeat compliance for each
4. **Normalized API** - Same code works for all providers
5. **They handle compliance** - No more Intuit questionnaires

**Implementation approach:**

1. Sign up for Merge.dev free account
2. Replace our direct QuickBooks integration with Merge's unified API
3. Users can then connect to QuickBooks, Xero, or any other supported system
4. Same sync logic works for all providers

**Cost consideration:**

- Free for first 3 users
- $650/month for up to 10 users
- At SleekInvoices' $12/month pricing, need ~55 paying users to break even on Merge costs
- Could offer accounting sync as a premium add-on ($5/month extra)

---

## Alternative: Keep Direct Integration

If you want to avoid third-party costs:

1. Complete Intuit's questionnaire (one-time pain)
2. Get production credentials
3. Only QuickBooks users can sync

The direct integration we built is fully functional - just needs the compliance approval.
