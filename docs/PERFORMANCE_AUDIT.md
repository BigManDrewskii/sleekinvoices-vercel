# Performance Audit Report

## Date: January 8, 2026

## Executive Summary

The SleekInvoices application has a main bundle (index.js) of **1.87MB** (527KB gzipped), which is significantly larger than recommended. The primary causes are heavy dependencies being bundled into the main chunk rather than being code-split.

## Current Bundle Analysis

### Main Bundle (index-BJj4KLqJ.js)
- **Size**: 1.87MB (527KB gzipped)
- **Status**: CRITICAL - Exceeds 500KB warning threshold

### Heavy Dependencies Identified

| Dependency | Size | Source | Used In | Recommendation |
|------------|------|--------|---------|----------------|
| mermaid | 432KB | streamdown | AIAssistant, AIChatBox | Lazy load or replace |
| cytoscape | 442KB | mermaid | Unused directly | Remove via streamdown config |
| emacs-lisp | 779KB | shiki/mermaid | Code highlighting | Lazy load syntax highlighters |
| cpp | 626KB | shiki | Code highlighting | Lazy load syntax highlighters |
| wasm | 622KB | shiki | Code highlighting | Lazy load syntax highlighters |
| recharts | ~200KB | chart.tsx | Analytics | Already lazy loaded via Analytics page |
| treemap | 330KB | recharts | Analytics | Already lazy loaded via Analytics page |

### What's Working Well

1. **Route-based code splitting** - Already implemented with React.lazy() for authenticated pages
2. **Suspense boundaries** - Properly configured with loading fallback
3. **Public pages eager loaded** - Landing, Home, ClientPortal load immediately
4. **Authenticated pages lazy loaded** - Dashboard, Invoices, Settings, etc.

## Root Cause Analysis

### 1. Streamdown Library (Primary Issue)
The `streamdown` package is imported in AIAssistant and AIChatBox components. It bundles:
- mermaid (432KB) - diagram rendering
- cytoscape (442KB) - graph visualization
- shiki with ALL language grammars (~3MB total)

This single import adds approximately **4MB** of uncompressed JavaScript to the bundle.

### 2. Shiki Language Grammars
The build output shows many language-specific chunks (emacs-lisp, cpp, typescript, etc.) which are syntax highlighting grammars. While they're code-split, they're still being included in the build.

## Optimization Recommendations

### Priority 1: Streamdown Optimization (High Impact)

**Option A: Lazy Load AI Components**
```tsx
// Instead of direct import in main bundle
const AIAssistant = lazy(() => import('./components/AIAssistant'));
```

**Option B: Replace Streamdown with Lighter Alternative**
- Use `react-markdown` for basic markdown rendering
- Only load mermaid/shiki when needed via dynamic imports

**Expected Impact**: Reduce main bundle by ~500KB-1MB

### Priority 2: Manual Chunks Configuration

Add to vite.config.ts:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', ...],
        'vendor-charts': ['recharts'],
        'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
      }
    }
  }
}
```

**Expected Impact**: Better caching, parallel loading

### Priority 3: Tree Shaking Improvements

1. **Lucide React** - Already using named imports (good)
2. **Radix UI** - Already using individual packages (good)
3. **Date-fns** - Verify tree-shaking is working

### Priority 4: Asset Optimization

1. Enable Brotli compression on server
2. Add preload hints for critical chunks
3. Implement service worker for caching

## Implementation Plan

### Phase 1: Quick Wins (1-2 hours)
- [ ] Lazy load AIAssistant component
- [ ] Add manual chunks configuration
- [ ] Enable build analyzer

### Phase 2: Streamdown Replacement (2-4 hours)
- [ ] Evaluate react-markdown + remark-gfm as replacement
- [ ] Create lightweight markdown renderer
- [ ] Lazy load mermaid only when diagrams detected

### Phase 3: Advanced Optimizations (4-8 hours)
- [ ] Implement preload hints
- [ ] Add service worker
- [ ] Configure CDN caching headers

## Success Metrics

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| Main bundle size | 1.87MB | <500KB | Bundle analyzer |
| First Contentful Paint | TBD | <1.5s | Lighthouse |
| Time to Interactive | TBD | <3.5s | Lighthouse |
| Largest Contentful Paint | TBD | <2.5s | Lighthouse |

## Next Steps

1. Implement Phase 1 optimizations
2. Re-run build and measure impact
3. Proceed to Phase 2 if needed
