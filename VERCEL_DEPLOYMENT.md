# Vercel Deployment Guide

## Overview

SleekInvoices is deployed on Vercel with a hybrid architecture:
- **Frontend**: Static files from `dist/public/` served by Vercel CDN
- **Backend**: Serverless function at `api/index.js` using Express + tRPC
- **Database**: MySQL/TiDB (external connection via DATABASE_URL)

## Architecture

### Build Process

```bash
pnpm build
```

This creates:
1. **Frontend bundle**: `dist/public/` - React app with Vite
2. **Backend bundle**: `dist/index.js` - Express server bundled with esbuild

### File Structure

```
├── api/
│   └── index.js          # Vercel serverless function entry point
├── dist/
│   ├── index.js          # Bundled Express app (imported by api/index.js)
│   └── public/           # Static frontend assets
├── vercel.json           # Vercel configuration
└── server/
    └── _core/index.ts    # Express app source (exports app factory)
```

## Configuration

### vercel.json

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/(.*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json))", "dest": "/dist/public/$1" },
    { "src": "/(.*)", "dest": "/dist/public/index.html" }
  ]
}
```

**Key points**:
- API routes → serverless function (`api/index.js`)
- Static assets → CDN from `dist/public/`
- SPA fallback → `index.html` for client-side routing

### Environment Variables

Required in Vercel dashboard:

**Authentication**:
- `SKIP_AUTH` - Set to bypass OAuth for testing (⚠️ use carefully)
- `AUTH_SECRET` - Auth.js session secret
- `AUTH_GOOGLE_ID` - Google OAuth client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth secret
- `AUTH_GITHUB_ID` - GitHub OAuth client ID
- `AUTH_GITHUB_SECRET` - GitHub OAuth secret
- `OAUTH_SERVER_URL` - OAuth callback URL (https://sleekinvoices.vercel.app)

**Database**:
- `DATABASE_URL` - MySQL/TiDB connection string

**Payment Processing**:
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_PRO_PRICE_ID` - Pro subscription price ID
- `NOWPAYMENTS_API_KEY` - NOWPayments API key
- `NOWPAYMENTS_IPN_SECRET` - NOWPayments webhook secret
- `NOWPAYMENTS_PUBLIC_KEY` - NOWPayments public key

**Services**:
- `RESEND_API_KEY` - Resend email API key
- `OPENROUTER_API_KEY` - OpenRouter API key for AI features

**Frontend** (VITE_ prefix for client-side access):
- `VITE_SKIP_AUTH` - Client-side auth bypass
- `VITE_OAUTH_PORTAL_URL` - OAuth portal URL
- `VITE_APP_ID` - App identifier
- `VITE_APP_TITLE` - App title
- `VITE_APP_LOGO` - Logo path
- `VITE_ANALYTICS_WEBSITE_ID` - Analytics tracking ID
- `VITE_ANALYTICS_ENDPOINT` - Analytics endpoint URL

## Critical Implementation Details

### API Handler Pattern

**Why `api/index.js` imports from `dist/index.js`:**

```javascript
// api/index.js (Vercel serverless function)
import { app } from '../dist/index.js';

export default function handler(req, res) {
  app(req, res);
}
```

**Not** from TypeScript source:
```javascript
// ❌ WRONG - source files don't exist in deployment
import { app } from '../server/_core/index';
```

**Reason**: Vercel serverless functions are bundled independently. The TypeScript source in `server/` isn't deployed - only the bundled `dist/index.js` exists.

### App Factory Pattern

```typescript
// server/_core/index.ts
export function createApp(): Express {
  const app = express();
  // ... configure middleware, routes, etc.
  return app;
}

// Export app instance for serverless deployment
export const app = createApp();
export default app;

// Auto-start server in local development only
if (require.main === module || process.env.NODE_ENV === 'development') {
  startServer().catch(console.error);
}
```

**Benefits**:
- Can import `app` without starting server
- Serverless function handles requests directly
- Local development auto-starts server

### Cron Jobs in Vercel

Cron jobs are **disabled** in Vercel deployment:

```typescript
if (!process.env.VERCEL) {
  initializeScheduler();
}
```

**Reason**: Serverless functions can't run continuous background processes.

**Solution**: Use Vercel Cron Jobs (Phase 2):
1. Create `api/crons/recurring-invoices.ts`
2. Configure `vercel.json` with `crons` array
3. Each scheduled execution = serverless function invocation

## Deployment Workflow

### Initial Setup

1. **Connect GitHub repo to Vercel**
   - Vercel auto-deploys on push to `main`

2. **Configure environment variables**
   - Add all required env vars in Vercel dashboard
   - Select "All Environments" for production + preview

3. **Set build output**
   - Framework preset: Other
   - Build command: `pnpm build`
   - Install command: `pnpm install`
   - Output directory: `dist/public` (for static files)
   - Serverless function: `api/index.js`

### Deploying Changes

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel automatically:
1. Runs `pnpm install`
2. Runs `pnpm build`
3. Deploys `dist/public/` to CDN
4. Deploys `api/index.js` as serverless function
5. Updates routes

### Rollback

In Vercel dashboard:
1. Go to Deployments
2. Find previous successful deployment
3. Click "Promote to Production"

## Troubleshooting

### Issue: API returns 404 NOT_FOUND

**Symptom**: `/api/health` returns 404

**Cause**: API handler import path incorrect

**Fix**: Ensure `api/index.js` imports from `../dist/index.js` (bundled code), not TypeScript source.

### Issue: "Cannot find module '../dist/index.js'"

**Symptom**: Serverless function fails to load

**Cause**: Build didn't complete before deployment

**Fix**:
1. Run `pnpm build` locally to verify
2. Ensure `dist/index.js` exists
3. Check esbuild bundling in `package.json` build script

### Issue: Cron jobs not running

**Symptom**: Recurring invoices not generated

**Cause**: Cron jobs disabled in Vercel (by design)

**Fix**: Implement Vercel Cron Jobs (see above)

### Issue: Environment variables undefined

**Symptom**: `process.env.DATABASE_URL` undefined in serverless function

**Cause**: Env vars not set in Vercel dashboard

**Fix**: Add env vars in Vercel dashboard → Settings → Environment Variables

### Issue: Static assets 404

**Symptom**: Images, CSS, JS files return 404

**Cause**: Incorrect route configuration in `vercel.json`

**Fix**: Ensure static route comes before SPA fallback:
```json
{ "src": "/(.*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json))", "dest": "/dist/public/$1" }
```

## Performance Optimization

### CDN Caching

Static assets cached for 1 year (immutable):
```json
{
  "source": "/(.*)\\.js",
  "headers": [{
    "key": "Cache-Control",
    "value": "public, max-age=31536000, immutable"
  }]
}
```

### Serverless Function

- Memory: 1024MB (for PDF generation)
- Max duration: 30 seconds (PDF generation timeout)
- Region: `iad1` (US East) - can add more regions

### Code Splitting

Frontend uses manual chunks for better caching:
- `vendor-react.js` - React core (rarely changes)
- `vendor-radix.js` - Radix UI components
- `vendor-data.js` - tRPC + React Query
- `vendor-stripe.js` - Stripe SDK
- etc.

## Security Checklist

- [ ] All env vars set in Vercel dashboard (not in code)
- [ ] `SKIP_AUTH=false` in production
- [ ] Database connection uses SSL
- [ ] Webhook signatures verified (Stripe, Resend, NOWPayments)
- [ ] Rate limiting applied (standard + strict)
- [ ] CSRF protection enabled
- [ ] CORS configured properly
- [ ] Secrets rotated regularly

## Monitoring

### Vercel Analytics

- Deploy frequency
- Build times
- Function invocations
- Error rates

### Health Checks

- `/api/health` - Basic health check
- `/api/health/detailed` - Includes DB connectivity

### Error Tracking

Sentry integration for error monitoring (configured in `server/_core/errorMonitoring.ts`).

## Future Improvements

### Phase 2: Cron Jobs

Implement Vercel Cron Jobs for:
- Recurring invoice generation
- Overdue invoice detection
- Payment reminder scheduling

### Phase 3: Multi-Region Deployment

Add regions for better global performance:
```json
"regions": ["iad1", "hnd1", "fra1"]
```

### Phase 4: Edge Functions

Migrate static endpoints to Edge Functions for faster cold starts:
- `/api/health`
- OAuth callbacks
- Webhook receivers (with streaming)

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
