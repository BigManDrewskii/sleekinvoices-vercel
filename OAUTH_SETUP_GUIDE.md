# OAuth Provider Setup Guide

This guide walks you through setting up Google and GitHub OAuth providers for Auth.js integration.

---

## Step 1: Google OAuth Setup

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project name: `SleekInvoices Auth` (or your preference)
4. Click "Create"

### 1.2 Enable OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (for testing) → Click **Create**
3. Fill in required fields:
   - **App name**: SleekInvoices
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue** (skip all optional sections for now)
5. Click **Back to Dashboard**

### 1.3 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: SleekInvoices Web
5. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:5173/api/auth/callback/google
   ```
   (Add your production domain later: `https://your-domain.com/api/auth/callback/google`)
7. Click **Create**

### 1.4 Save Google Credentials

You'll see a popup with:

- **Client ID**: Save this as `AUTH_GOOGLE_ID`
- **Client Secret**: Save this as `AUTH_GOOGLE_SECRET`

Example format:

```
AUTH_GOOGLE_ID=123456789-abcdef.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-abc123xyz456
```

---

## Step 2: GitHub OAuth Setup

### 2.1 Register GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the form:
   - **Application name**: SleekInvoices
   - **Homepage URL**: `http://localhost:5173`
   - **Application description**: Invoice management application
   - **Authorization callback URL**: `http://localhost:5173/api/auth/callback/github`
     (Add production later: `https://your-domain.com/api/auth/callback/github`)

### 2.2 Save GitHub Credentials

After registering, you'll see:

- **Client ID**: Save as `AUTH_GITHUB_ID`
- **Generate a new client secret**: Click → Save as `AUTH_GITHUB_SECRET`

Example format:

```
AUTH_GITHUB_ID=Iv1abc123xyz456
AUTH_GITHUB_SECRET=ghp_abc123xyz456789
```

---

## Step 3: Update .env.local

Add these credentials to your `.env.local` file:

```bash
# Auth.js Configuration
AUTH_SECRET=your-super-secret-jwt-key-min-32-chars

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id-here
AUTH_GOOGLE_SECRET=your-google-client-secret-here

# GitHub OAuth
AUTH_GITHUB_ID=your-github-client-id-here
AUTH_GITHUB_SECRET=your-github-client-secret-here
```

### Generate AUTH_SECRET

Run this command to generate a secure JWT secret:

```bash
openssl rand -base64 32
```

Copy the output and save it as `AUTH_SECRET`.

---

## Step 4: Production Redirect URIs

When you're ready to deploy to production, add these redirect URIs:

### Google OAuth

- `https://your-domain.com/api/auth/callback/google`

### GitHub OAuth

- Update callback URL to:
  `https://your-domain.com/api/auth/callback/github`

---

## Testing Checklist

Before proceeding to Phase 2:

- [ ] Google OAuth app created
- [ ] GitHub OAuth app created
- [ ] AUTH_SECRET generated
- [ ] All credentials added to `.env.local`
- [ ] Redirect URIs configured for localhost:5173

---

## Troubleshooting

### Google OAuth: "redirect_uri_mismatch"

**Cause**: Redirect URI doesn't match exactly

**Fix**:

1. Check the callback URL in the error message
2. Update the Authorized redirect URIs in Google Cloud Console
3. Must include the full path: `http://localhost:5173/api/auth/callback/google`

### GitHub OAuth: "redirect_uri parameter mismatch"

**Cause**: Callback URL doesn't match

**Fix**:

1. Go to GitHub OAuth app settings
2. Update Authorization callback URL to match exactly
3. Must be: `http://localhost:5173/api/auth/callback/github`

### "Invalid client secret"

**Cause**: Copied wrong value or has extra spaces

**Fix**:

- Double-check you copied the full secret (no truncation)
- Remove any extra whitespace
- Ensure no quotes in .env.local values

---

## Next Steps

Once OAuth providers are configured:

1. ✅ Proceed to **Phase 2: Database Schema Changes**
2. This will add Auth.js tables and modify the users table

---

## Security Notes

⚠️ **Important**:

- Never commit `.env.local` to Git
- Use strong secrets in production
- Add `.env.local` to `.gitignore` (already done)
- Use separate OAuth apps for development and production
- Monitor OAuth usage in Google/GitHub dashboards
