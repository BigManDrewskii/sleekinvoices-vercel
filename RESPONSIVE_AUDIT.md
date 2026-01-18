# Responsive Design Audit Report

**Project:** SleekInvoices  
**Date:** January 18, 2026  
**Breakpoints Tested:** 320px, 375px, 428px, 768px, 1024px, 1280px, 1440px

---

## Critical Issues (Break Usability)

### 1. Template Editor Fixed Width Causes Horizontal Overflow
**File:** `client/src/components/templates/SleekDefaultTemplate.tsx`  
**Line:** 152  
**Problem:** Fixed width `w-[612px]` on invoice template causes horizontal scroll on all mobile viewports (320px-428px)  
**Severity:** Critical  
**Recommended Fix:** Use `w-full max-w-[612px]` with responsive scaling, or implement a zoom/scale transform for mobile preview

### 2. Template Editor Sidebar Fixed Width
**File:** `client/src/components/templates/SleekTemplateEditor.tsx`  
**Line:** 345  
**Problem:** Fixed widths `lg:w-[380px] xl:w-[420px]` don't account for smaller tablets (768px-1024px), causing cramped layout  
**Severity:** Critical  
**Recommended Fix:** Add `md:w-[320px]` breakpoint and ensure main content area has `min-w-0` to prevent overflow

### 3. Dashboard Layout Skeleton Fixed Width
**File:** `client/src/components/DashboardLayoutSkeleton.tsx`  
**Line:** 7  
**Problem:** Fixed `w-[280px]` sidebar doesn't collapse on mobile, causing layout break  
**Severity:** Critical  
**Recommended Fix:** Add `hidden md:block` to hide sidebar on mobile, or use responsive width classes

---

## Major Issues (Significant UX Impact)

### 4. AI Assistant Panel Width on Small Screens
**File:** `client/src/components/AIAssistant.tsx`  
**Line:** 303  
**Problem:** `sm:w-[440px]` is too wide for 375px devices when combined with any padding  
**Severity:** Major  
**Recommended Fix:** Change to `w-full sm:max-w-[440px]` to ensure it respects viewport boundaries

### 5. Google Font Picker Popover Width
**File:** `client/src/components/ui/google-font-picker.tsx`  
**Line:** 278  
**Problem:** `w-[calc(100vw-2rem)]` is good, but `sm:w-[500px]` may overflow on 375px-428px when positioned  
**Severity:** Major  
**Recommended Fix:** Use `sm:w-[min(500px,calc(100vw-2rem))]` or adjust positioning

### 6. Currency Selector Popover Fixed Width
**File:** `client/src/components/CurrencySelector.tsx`  
**Line:** 113  
**Problem:** Fixed `w-[300px]` popover may overflow on 320px viewport  
**Severity:** Major  
**Recommended Fix:** Use `w-[min(300px,calc(100vw-2rem))]`

### 7. Product Selector Popover Fixed Width
**File:** `client/src/components/invoices/ProductSelector.tsx`  
**Line:** 94  
**Problem:** Fixed `w-[350px]` popover overflows on mobile viewports  
**Severity:** Major  
**Recommended Fix:** Use `w-full sm:w-[350px]` with proper positioning

### 8. Tables Without Horizontal Scroll Container
**Files:** Multiple table implementations  
**Problem:** Tables in Clients, Invoices, Expenses, Products pages lack proper horizontal scroll containers for mobile  
**Severity:** Major  
**Recommended Fix:** Wrap all `<Table>` components in `<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">` for mobile scroll

### 9. Email Template Editor Select Fixed Width
**File:** `client/src/components/EmailTemplateEditor.tsx`  
**Line:** 394  
**Problem:** Fixed `w-[220px]` may cause layout issues on narrow screens  
**Severity:** Major  
**Recommended Fix:** Use `w-full sm:w-[220px]`

---

## Minor Issues (Polish/Enhancement)

### 10. Touch Target Size - Default Button Height
**File:** `client/src/components/ui/button.tsx`  
**Line:** 87  
**Problem:** Default button height `h-9` (36px) is below the 44px touch target recommendation for mobile  
**Severity:** Minor  
**Recommended Fix:** Consider `h-10` (40px) or `h-11` (44px) for mobile-first design, or add `touch-target` utility class

### 11. Small Icon Buttons Under 44px
**File:** `client/src/components/AIAssistant.tsx`  
**Lines:** 358, 367, 378  
**Problem:** `h-9 w-9` (36px) icon buttons are below touch target minimum  
**Severity:** Minor  
**Recommended Fix:** Increase to `h-11 w-11` or add touch padding with `min-h-[44px] min-w-[44px]`

### 12. Very Small Text Sizes
**Files:** Multiple components  
**Problem:** `text-[10px]` and `text-[11px]` used in several places may be too small for readability on mobile  
**Locations:**
- `AIAssistant.tsx:592` - character counter
- `AIAssistant.tsx:617` - helper text
- `AIAssistant.tsx:619, 623` - keyboard shortcuts
- `AIAssistant.tsx:662` - badge text
**Severity:** Minor  
**Recommended Fix:** Use minimum `text-xs` (12px) for body text, reserve smaller sizes for decorative elements only

### 13. Batch Invoice Select Fixed Width
**File:** `client/src/pages/BatchInvoice.tsx`  
**Line:** 633  
**Problem:** Fixed `w-[180px]` select trigger  
**Severity:** Minor  
**Recommended Fix:** Use `w-full sm:w-[180px]`

### 14. Estimate Page Select Fixed Widths
**Files:** `client/src/pages/CreateEstimate.tsx`, `client/src/pages/EditEstimate.tsx`  
**Lines:** 350, 472, 397, 514  
**Problem:** Fixed widths `w-[200px]` and `w-[100px]` on select triggers  
**Severity:** Minor  
**Recommended Fix:** Add responsive variants `w-full sm:w-[200px]`

### 15. Payments Page Filter Selects
**File:** `client/src/pages/Payments.tsx`  
**Lines:** 483, 501, 517  
**Problem:** Fixed widths on filter selects may stack poorly on mobile  
**Severity:** Minor  
**Recommended Fix:** Use grid or flex-wrap layout with responsive widths

### 16. Navigation Hamburger Menu Sheet Width
**File:** `client/src/components/Navigation.tsx`  
**Line:** 463, 638  
**Problem:** `w-80 max-w-[85vw]` is appropriate but could use smoother animation on 320px  
**Severity:** Minor  
**Recommended Fix:** Consider `w-[min(320px,85vw)]` for more predictable sizing

### 17. Images Without Explicit Dimensions
**Files:** Multiple image implementations  
**Problem:** Some `<img>` tags lack explicit width/height attributes, potentially causing layout shift  
**Locations:**
- `LandingNavigation.tsx:40`
- `HeroSection.tsx:10`
- `DemoVideoSection.tsx:17`
**Severity:** Minor  
**Recommended Fix:** Add `width` and `height` attributes or use `aspect-ratio` CSS

### 18. Line Length Control Missing
**Files:** Long-form content pages  
**Problem:** Some text content areas lack `max-w-prose` or similar constraints, potentially exceeding 75 characters per line on wide screens  
**Severity:** Minor  
**Recommended Fix:** Add `max-w-prose` (65ch) or `max-w-2xl` to paragraph containers

---

## Summary

| Severity | Count | Priority |
|----------|-------|----------|
| Critical | 3 | Fix immediately |
| Major | 6 | Fix before next release |
| Minor | 9 | Address in polish phase |

### Top Priority Fixes

1. **Template Editor overflow** - Affects core invoice creation flow
2. **Table horizontal scroll** - Affects data viewing on all mobile devices  
3. **AI Assistant panel width** - Affects AI feature usability on mobile
4. **Touch targets** - Affects overall mobile usability

### Positive Findings

- Good use of Tailwind responsive prefixes (513 instances of `sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- Proper `truncate` usage for text overflow handling
- Navigation has proper mobile/tablet/desktop breakpoint handling
- Most dialogs use `sm:max-w-*` pattern correctly
- Z-index values are reasonable and don't conflict
- Good use of `max-w-*` constraints on modals and popovers
