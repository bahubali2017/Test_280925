# Production Deployment Checklist
## Project: Anamnesis - Medical AI Assistant MVP

This checklist ensures all technical components are verified for a secure, stable production deployment.

## 1. Build & Environment Configuration
- [ ] Configure vite.config.js for production build mode
- [ ] Set base path correctly (e.g., '' or /) depending on hosting

Create .env.production with:
- [ ] VITE_API_BASE_URL
- [ ] VITE_APP_NAME
- [ ] VITE_ENV=production
- [ ] Ensure .env is not committed (.gitignore check)
- [ ] Verify Tailwind and shadcn/ui styles compile correctly in vite build

```bash
# Run final build test
npm run build
```

## 2. Security Hardening
- [ ] Ensure no mock authentication code is used in production (remove fallback login)
- [ ] Sanitize all user input (especially login/email forms)
- [ ] Disable console logging (or replace with Winston if needed)
- [ ] Verify no hardcoded API keys or secrets in the frontend
- [ ] Confirm CORS and headers setup in Express backend

## 3. Deployment Setup
- [ ] Choose hosting provider:
  - [ ] Replit deployment OR
  - [ ] Vercel/Netlify for frontend + Fly.io/Render for backend
- [ ] Add deployment secrets (API keys, DB URLs) in hosting environment
- [ ] Enable HTTPS / SSL where applicable
- [ ] Confirm backend endpoints (/api/llm, /auth, etc.) resolve correctly
- [ ] Use health check endpoint (/status or /ping) for server status

## 4. Final Testing
- [ ] Test login with demo credentials
- [ ] Submit an AI message and get a response
- [ ] Try accessing protected routes as guest (should redirect)
- [ ] Confirm favicon, title, and branding render properly
- [ ] Test on mobile, tablet, and desktop viewports

Check metadata:
- [ ] `<meta name="description">`
- [ ] `<title>` tag
- [ ] OpenGraph & social tags

## 5. Post-Deployment Final Checks
- [ ] Run full ESLint check again:
```bash
npx eslint client/ --ext .js,.jsx
```

- [ ] Ensure all .jsx files have valid JSX and no TypeScript leftovers

Confirm absence of:
- [ ] @ts-ignore, eslint-disable, or commented-out code
- [ ] Placeholder UI components not wired to logic
- [ ] Check that ChatPage, LoginPage, and root navigation all work with zero runtime errors
- [ ] Verify favicon, logo, and app name show up in tab and social shares

## 6. Ready to Deploy
When all tasks are checked ✅:
- [ ] Push to production or main branch
- [ ] Trigger deployment build
- [ ] Test final production instance URL
- [ ] Monitor logs and usage (optional)

## Current Status
- [x] TypeScript to JavaScript migration complete (45+ files)
- [x] All ESLint suppression directives removed
- [x] ESLint configuration updated with component whitelist
- [x] JSDoc annotations added to maintain type safety
- [x] Login and Chat interfaces fully functional
- [ ] Production environment configuration
- [ ] Final security review