# Manus.IM Production Deployment Guide

## Environment Variables for Manus.IM

### REQUIRED - Core Application Secrets

Add these to Manus.IM Environment Variables/Secrets:

```env
# ========================
# CRYPTO PAYMENTS (NOWPayments) - REQUIRED
# ========================
NOWPAYMENTS_API_KEY=0qWqCGrZq8cMmhwxDECxaF9EXH7A/fgl
NOWPAYMENTS_IPN_SECRET=533b3e8d-ab02-40d1-8209-dff57087cedd
NOWPAYMENTS_PUBLIC_KEY=Z530954-ZVG42WG-HM8C74B-1J0RF4Y

# ========================
# EMAIL (Resend) - REQUIRED
# ========================
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_your_production_key

# ========================
# S3 STORAGE (File Uploads) - REQUIRED
# ========================
# For logo uploads and attachments
S3_BUCKET=your-production-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key

# ========================
# APPLICATION URLs - REQUIRED
# ========================
VITE_APP_URL=https://sleekinvoices.com
VITE_APP_TITLE=SleekInvoices
VITE_APP_LOGO=/logos/wide/SleekInvoices-Wide.svg
```

---

### OPTIONAL - Enhanced Features

```env
# ========================
# QUICKBOOKS INTEGRATION - OPTIONAL
# ========================
# Get from: https://developer.intuit.com/
QUICKBOOKS_CLIENT_ID=your-production-client-id
QUICKBOOKS_CLIENT_SECRET=your-production-client-secret
QUICKBOOKS_ENVIRONMENT=production
QUICKBOOKS_REDIRECT_URI=https://sleekinvoices.com/api/quickbooks/callback

# ========================
# AI FEATURES (OpenRouter) - OPTIONAL
# ========================
# Get from: https://openrouter.ai/
# Required for AI Assistant and Smart Compose features
OPENROUTER_API_KEY=your-production-api-key

# ========================
# ANALYTICS - OPTIONAL
# ========================
VITE_ANALYTICS_WEBSITE_ID=your-analytics-id
VITE_ANALYTICS_ENDPOINT=https://analytics.yourdomain.com
```

---

### NOT NEEDED (Manus.IM Handles)

These are managed by Manus.IM platform:

```env
# ❌ DATABASE_URL - Manus provides
# ❌ JWT_SECRET - Manus provides
# ❌ OAUTH_SERVER_URL - Manus provides
# ❌ SKIP_AUTH - Production only (Manus manages)
# ❌ STRIPE_SECRET_KEY - Manus provides
# ❌ STRIPE_WEBHOOK_SECRET - Manus provides
# ❌ STRIPE_PRO_PRICE_ID - Manus provides
# ❌ VITE_STRIPE_PUBLISHABLE_KEY - Manus provides
```

---

## NOWPayments Webhook Configuration

**IMPORTANT:** Configure in NOWPayments dashboard:

1. Log in to https://nowpayments.io/
2. Navigate to Settings → API → IPN Settings
3. Set IPN Callback URL to:
   ```
   https://sleekinvoices.com/api/webhooks/nowpayments
   ```
4. Verify webhook ID: `533b3e8d-ab02-40d1-8209-dff57087cedd`
5. Ensure IPN secret matches `NOWPAYMENTS_PUBLIC_KEY` environment variable

---

## Resend Email Configuration

**Setup Steps:**

1. Create account at https://resend.com
2. Verify your domain: `sleekinvoices.com`
3. Add DNS records (SPF, DKIM) for authentication
4. Create API key and add to environment as `RESEND_API_KEY`
5. Set "From" email address (e.g., `invoices@sleekinvoices.com`)

**Email Features Using Resend:**
- Invoice email sending
- Payment confirmations
- Payment reminders
- Client portal invitations
- Subscription confirmations

---

## S3 Storage Configuration

**Setup Steps:**

1. Create AWS account or use existing
2. Create S3 bucket (e.g., `sleekinvoices-production`)
3. Enable public read access for uploaded files
4. Create IAM user with S3 permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::sleekinvoices-production/*"
       }
     ]
   }
   ```
5. Generate access keys for IAM user
6. Add credentials to Manus environment variables

**Used For:**
- Company logo uploads
- Invoice PDF storage
- File attachments

---

## Manus.IM Sync Prompt

Copy and paste this to Manus.IM:

```
Hey Manus team,

Please sync SleekInvoices to the latest commit from the main branch:

Repository: https://github.com/BigManDrewskii/sleekinvoices
Branch: main
Latest Commit: 79ebfb20cccc4fb50d2c93211ad66c728bbfed3c

Recent updates include:
- Template editor refinements with auto-accent color generation
- Production-ready fixes (batch queries, validation, race conditions)
- Independent scrolling, cleaned UI
- NOWPayments crypto integration updated (customer-side currency selection)
- Database schema fixes (expanded currency column for crypto)
- IPN secret support for webhook verification
- All deployment documentation complete

Please also verify the following environment variables are configured:

REQUIRED:
- NOWPAYMENTS_API_KEY
- NOWPAYMENTS_IPN_SECRET
- NOWPAYMENTS_PUBLIC_KEY
- RESEND_API_KEY
- S3_BUCKET
- S3_REGION
- S3_ACCESS_KEY_ID
- S3_SECRET_ACCESS_KEY
- VITE_APP_URL (should be https://sleekinvoices.com)

OPTIONAL (if features needed):
- QUICKBOOKS_CLIENT_ID
- QUICKBOOKS_CLIENT_SECRET
- QUICKBOOKS_ENVIRONMENT (set to: production)
- QUICKBOOKS_REDIRECT_URI (set to: https://sleekinvoices.com/api/quickbooks/callback)
- OPENROUTER_API_KEY (for AI features)

Please confirm sync is complete and all environment variables are properly configured.

Thanks!
```

---

## Environment Variables Checklist for Manus

### ✅ CRITICAL - Add These to Manus Secrets

| Variable | Value | Purpose |
|----------|-------|---------|
| `NOWPAYMENTS_API_KEY` | `0qWqCGrZq8cMmhwxDECxaF9EXH7A/fgl` | NOWPayments API authentication |
| `NOWPAYMENTS_IPN_SECRET` | `533b3e8d-ab02-40d1-8209-dff57087cedd` | Webhook signature verification (primary) |
| `NOWPAYMENTS_PUBLIC_KEY` | `Z530954-ZVG42WG-HM8C74B-1J0RF4Y` | Webhook signature verification (fallback) |
| `RESEND_API_KEY` | (Get from resend.com) | Email sending |
| `S3_BUCKET` | Your bucket name | File storage |
| `S3_REGION` | `us-east-1` (or your region) | AWS region |
| `S3_ACCESS_KEY_ID` | Your AWS access key | S3 authentication |
| `S3_SECRET_ACCESS_KEY` | Your AWS secret key | S3 authentication |
| `VITE_APP_URL` | `https://sleekinvoices.com` | Application base URL |

### 🟡 OPTIONAL - Add If Features Needed

| Variable | Purpose |
|----------|---------|
| `QUICKBOOKS_CLIENT_ID` | QuickBooks OAuth |
| `QUICKBOOKS_CLIENT_SECRET` | QuickBooks OAuth |
| `QUICKBOOKS_ENVIRONMENT` | Set to `production` |
| `QUICKBOOKS_REDIRECT_URI` | `https://sleekinvoices.com/api/quickbooks/callback` |
| `OPENROUTER_API_KEY` | AI Assistant and Smart Compose features |
| `VITE_ANALYTICS_WEBSITE_ID` | Analytics tracking |
| `VITE_ANALYTICS_ENDPOINT` | Analytics endpoint |

### ❌ NOT NEEDED - Manus Provides These

- `DATABASE_URL` - Manus provides database
- `JWT_SECRET` - Manus provides auth
- `OAUTH_SERVER_URL` - Manus provides OAuth
- `STRIPE_SECRET_KEY` - Manus provides Stripe
- `STRIPE_WEBHOOK_SECRET` - Manus webhook handling
- `STRIPE_PRO_PRICE_ID` - Manus Stripe config
- `VITE_STRIPE_PUBLISHABLE_KEY` - Manus provides
- `SKIP_AUTH` - Development only (never in production)

---

## Pre-Deployment Checklist

Before asking Manus to sync:

- [ ] All changes committed to GitHub main branch
- [ ] Latest commit hash noted: `git rev-parse HEAD`
- [ ] NOWPayments webhook configured: https://sleekinvoices.com/api/webhooks/nowpayments
- [ ] Resend account created and domain verified
- [ ] S3 bucket created with proper permissions
- [ ] All required environment variables prepared
- [ ] Optional features decided (QuickBooks, AI, Analytics)

---

## Quick Copy-Paste for Manus

**CRITICAL Environment Variables (Production):**

```
NOWPAYMENTS_API_KEY=0qWqCGrZq8cMmhwxDECxaF9EXH7A/fgl
NOWPAYMENTS_IPN_SECRET=533b3e8d-ab02-40d1-8209-dff57087cedd
NOWPAYMENTS_PUBLIC_KEY=Z530954-ZVG42WG-HM8C74B-1J0RF4Y
RESEND_API_KEY=[YOUR_RESEND_KEY]
S3_BUCKET=[YOUR_S3_BUCKET]
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=[YOUR_AWS_KEY]
S3_SECRET_ACCESS_KEY=[YOUR_AWS_SECRET]
VITE_APP_URL=https://sleekinvoices.com
VITE_APP_TITLE=SleekInvoices
VITE_APP_LOGO=/logos/wide/SleekInvoices-Wide.svg
```

**OPTIONAL (if enabling features):**

```
QUICKBOOKS_CLIENT_ID=[YOUR_QB_CLIENT_ID]
QUICKBOOKS_CLIENT_SECRET=[YOUR_QB_SECRET]
QUICKBOOKS_ENVIRONMENT=production
QUICKBOOKS_REDIRECT_URI=https://sleekinvoices.com/api/quickbooks/callback
OPENROUTER_API_KEY=[YOUR_OPENROUTER_KEY]
```

---

## Post-Deployment Verification

After Manus syncs, verify:

1. **Application loads:** https://sleekinvoices.com
2. **Crypto subscription works:** Go to /subscription → "Pay with Crypto"
3. **Invoice crypto payment works:** View any invoice → "Pay with Crypto" button
4. **Webhooks receive:** Check NOWPayments dashboard for IPN logs
5. **Emails send:** Test invoice email sending
6. **File uploads work:** Test logo upload in template editor
7. **QuickBooks sync:** (if enabled) Test connection
8. **AI features:** (if enabled) Test AI assistant

---

## Troubleshooting

**If crypto payments don't work:**
- Verify `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_PUBLIC_KEY` are correct
- Check NOWPayments webhook URL is exactly: `https://sleekinvoices.com/api/webhooks/nowpayments`
- Verify webhook ID matches in NOWPayments dashboard

**If emails don't send:**
- Verify `RESEND_API_KEY` is valid production key
- Check domain verification in Resend dashboard
- Verify DNS records (SPF, DKIM) are configured

**If file uploads fail:**
- Verify S3 bucket exists and is accessible
- Check IAM credentials have proper permissions
- Verify bucket policy allows public read for uploaded files

**If webhooks don't process:**
- Check Manus logs for webhook errors
- Verify signature verification with correct `NOWPAYMENTS_PUBLIC_KEY`
- Test webhook manually with NOWPayments sandbox

---

## Support Contacts

- **Manus.IM Support:** Contact via Manus dashboard
- **NOWPayments Support:** support@nowpayments.io
- **Resend Support:** support@resend.com
- **AWS S3 Support:** AWS support console

---

## Next Steps After Deployment

1. Monitor NOWPayments webhook logs for first few payments
2. Test crypto payment flow end-to-end in production
3. Verify email deliverability
4. Check S3 storage and public access
5. Enable optional features (QuickBooks, AI) as needed
6. Set up monitoring/alerting for webhook failures
