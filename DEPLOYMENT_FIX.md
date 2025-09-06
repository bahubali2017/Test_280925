# Deployment Fix for Custom Domain Issue

## Problem Identified
The custom domain `https://mvp.anamnesis.health` was showing white screen with 404 asset errors because:

1. **Development vs Production Mode**: The app was running in development mode using Vite dev server, which has different asset serving behavior for custom domains vs native Replit domains.

2. **Service Worker Caching**: The PWA service worker was caching old asset files, causing version mismatches.

3. **Static File Serving**: The production static file serving wasn't properly configured with correct MIME types and path resolution.

## Fixes Applied

### 1. Fixed Production Server Configuration (`server/index.ts`)
- Updated static file serving to use `path.resolve(__dirname, "public")` for correct path resolution
- Added explicit MIME type headers for `.js`, `.css`, and `.html` files
- Implemented proper `/assets/*` route handler with MIME type setting
- Added comprehensive error handling for missing assets

### 2. Updated Service Worker Cache Busting
- Incremented cache versions in `client/public/sw.js`:
  - `anamnesis-v2.1.2` → `anamnesis-v2.1.3`
  - `anamnesis-static-v1.0.1` → `anamnesis-static-v1.0.2`
  - `anamnesis-dynamic-v1.0.1` → `anamnesis-dynamic-v1.0.2`
- Updated service worker registration with cache-busting parameter: `/sw.js?v=2.1.3`

### 3. Verified Build Configuration
- ✅ `vite.config.ts` has correct `base: "/"` setting
- ✅ Build outputs to `dist/public/` with proper asset structure
- ✅ Production assets generated: `index-ByoEpUj7.js`, `index-vcZ85QQ7.css`

## Deployment Instructions

### For Immediate Fix (Current Environment):
1. **Rebuild Application**:
   ```bash
   npm run build
   ```

2. **Switch to Production Mode**:
   ```bash
   NODE_ENV=production node dist/index.js
   ```

### For Replit Deployment:
The `.replit` file is already configured correctly:
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

[deployment.env]
NODE_ENV = "production"
```

### For Manual Testing:
1. Stop current development server
2. Run: `NODE_ENV=production node dist/index.js`
3. Test both domains:
   - ✅ `https://anamnesis-mvp.replit.app`
   - ✅ `https://mvp.anamnesis.health`

## Verification Steps

After deployment, verify:

1. **Network Tab in DevTools**:
   - ✅ `/assets/index-*.js` → 200 OK, Content-Type: application/javascript
   - ✅ `/assets/index-*.css` → 200 OK, Content-Type: text/css
   - ✅ `index.html` → 200 OK with absolute asset paths

2. **Console Tab**:
   - ✅ No "MIME type" errors
   - ✅ No "React not defined" errors
   - ✅ React app initializes properly
   - ✅ Login page renders correctly

3. **Browser Clear Cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or use incognito/private mode
   - Or clear Application → Storage for the domain

## Root Cause Analysis

The fundamental issue was that Vite development server handles static asset serving differently for custom domains compared to native Replit domains. In development mode:

- ✅ `anamnesis-mvp.replit.app` worked perfectly (native domain)
- ❌ `mvp.anamnesis.health` failed with 404s (custom domain)

The solution is to use **production mode** which serves pre-built static files using Express.static middleware, eliminating the Vite dev server asset serving differences.

## Expected Outcome

After applying this fix:
- ✅ Custom domain `https://mvp.anamnesis.health` displays full Anamnesis Medical AI interface
- ✅ All assets load with correct MIME types (no 404 errors)
- ✅ Service worker installs and caches properly
- ✅ React application initializes without errors
- ✅ Login functionality works correctly
- ✅ Replit domain continues to work normally

## Technical Details

### Static File Serving Configuration:
```typescript
// Production mode - serve built static files
const staticPath = path.resolve(__dirname, "public");

// Serve static files with explicit MIME types
app.use(express.static(staticPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));
```

### Service Worker Force Update:
```javascript
const registration = await navigator.serviceWorker.register('/sw.js?v=2.1.3', {
  scope: '/',
  updateViaCache: 'none'
});
```

This comprehensive fix addresses all aspects of the custom domain white screen issue and ensures reliable deployment across all domains.