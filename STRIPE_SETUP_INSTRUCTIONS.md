# Stripe Product Setup Instructions

## Overview
This document provides step-by-step instructions for creating the "SleekInvoices Pro" subscription product in Stripe Dashboard and configuring the price ID in your application.

**Time Required:** 5-10 minutes  
**Prerequisites:** Stripe account (test mode or live mode)

---

## Step 1: Access Stripe Dashboard

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Log in with your Stripe account
3. **Important:** Make sure you're in the correct mode:
   - **Test Mode** (recommended for development) - toggle in top right
   - **Live Mode** (for production) - only after testing

---

## Step 2: Navigate to Products

1. In the left sidebar, click **"Products"**
2. Click the **"+ Add product"** button (top right)

---

## Step 3: Create SleekInvoices Pro Product

### Product Information:
- **Name:** `SleekInvoices Pro`
- **Description:** `Unlimited invoices, Stripe payments, email sending, and analytics`
- **Statement descriptor:** `INVOICEFLOW PRO` (appears on customer's credit card statement)
- **Image:** (optional) Upload a logo or product image

### Pricing Information:
- **Pricing model:** Select **"Standard pricing"**
- **Price:** `12.00`
- **Currency:** `USD` (or your preferred currency)
- **Billing period:** Select **"Monthly"**
- **Usage type:** Select **"Licensed"** (not metered)

### Additional Settings:
- **Tax behavior:** (configure based on your tax requirements)
- **Trial period:** Leave empty (we handle free tier separately)

Click **"Save product"**

---

## Step 4: Copy the Price ID

After creating the product, you'll see the product details page.

1. Look for the **"Pricing"** section
2. Find the price you just created ($12/month)
3. Click on the price to expand details
4. **Copy the Price ID** - it looks like: `price_1AbCdEfGhIjKlMnO`

**Important:** The Price ID format is always `price_` followed by alphanumeric characters.

---

## Step 5: Set Environment Variable

### For Development (Local):
Add to your `.env` file (or set in your environment):
```bash
STRIPE_PRO_PRICE_ID=price_1AbCdEfGhIjKlMnO
```

### For Production (Manus Platform):
The environment variable is already configured in the Manus platform. You just need to update the value:

1. Go to your project settings in Manus
2. Navigate to **Secrets** or **Environment Variables**
3. Find `STRIPE_PRO_PRICE_ID`
4. Update the value with your new price ID
5. Restart the application

---

## Step 6: Verify Configuration

### Test the Setup:
1. Restart your development server (if running locally)
2. Navigate to `/subscription` page
3. Click **"Upgrade to Pro"** button
4. You should be redirected to Stripe Checkout
5. The checkout page should show:
   - Product name: "SleekInvoices Pro"
   - Price: $12.00/month
   - Payment form

### Test Card Numbers (Test Mode Only):
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)

---

## Troubleshooting

### Error: "Stripe price ID not configured"
- **Cause:** Environment variable `STRIPE_PRO_PRICE_ID` is not set
- **Solution:** Follow Step 5 to set the environment variable

### Error: "Stripe price ID is still a placeholder"
- **Cause:** Price ID contains "PLACEHOLDER" or is still `price_1234567890`
- **Solution:** Replace with actual price ID from Step 4

### Checkout page shows wrong price
- **Cause:** Wrong price ID or product configuration
- **Solution:** 
  1. Verify price ID in Stripe Dashboard
  2. Check that price is set to $12/month
  3. Update environment variable with correct price ID

### "No such price" error from Stripe
- **Cause:** Price ID doesn't exist or is from wrong mode (test vs live)
- **Solution:**
  1. Verify you're in the correct Stripe mode
  2. Copy price ID from the same mode you're testing in
  3. Ensure price ID is copied correctly (no extra spaces)

---

## Production Checklist

Before going live with subscriptions:

- [ ] Create product in **Live Mode** (not test mode)
- [ ] Copy **Live Mode** price ID
- [ ] Update `STRIPE_PRO_PRICE_ID` with live price ID
- [ ] Test checkout flow with real card (small amount)
- [ ] Verify webhook is configured for live mode
- [ ] Set up tax collection (if required)
- [ ] Configure email receipts in Stripe settings
- [ ] Test subscription cancellation flow
- [ ] Monitor first few subscriptions closely

---

## Additional Resources

- [Stripe Products Documentation](https://stripe.com/docs/billing/prices-guide)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

---

## Summary

**What You Created:**
- Product: "SleekInvoices Pro"
- Price: $12/month (recurring)
- Price ID: `price_xxxxxxxxxxxxx`

**What You Configured:**
- Environment variable: `STRIPE_PRO_PRICE_ID`
- Backend: `server/routers.ts` now uses this price ID
- Frontend: Subscription page displays $12/month from constants

**Next Steps:**
- Phase 2: Implement invoice limit enforcement
- Phase 3: Add premium feature gating
- Phase 4: Set up subscription webhooks

---

**Need Help?**
If you encounter issues not covered in troubleshooting, check:
1. Stripe Dashboard logs
2. Application console errors
3. Network tab in browser dev tools
4. Stripe API error messages
