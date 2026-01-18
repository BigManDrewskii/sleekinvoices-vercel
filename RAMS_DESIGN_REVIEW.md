# Rams Design Review: SleekInvoices

═══════════════════════════════════════════════════════════════════════════════

## Project Summary

- **Total Components Scanned:** 117 TSX files (62 UI components, 55 pages)
- **Review Date:** January 18, 2026
- **Framework:** React + TypeScript + Tailwind CSS v4

═══════════════════════════════════════════════════════════════════════════════

## CRITICAL ISSUES (4 issues)

───────────────────────────────────────────────────────────────────────────────

### [A11Y] Icon-only buttons missing accessible names

**Files affected:** 27 instances across multiple files

| File | Line | Code |
|------|------|------|
| `AIAssistant.tsx` | 357, 366, 377, 598 | `<Button size="icon">` without `aria-label` |
| `MagicInput.tsx` | 157 | `<Button size="icon">` without `aria-label` |
| `Navigation.tsx` | 455, 630 | `<Button size="icon">` without `aria-label` |
| `PortalAccessDialog.tsx` | 190, 202, 249 | `<Button size="icon">` without `aria-label` |
| `BatchInvoice.tsx` | 504, 781 | `<Button size="icon">` without `aria-label` |
| `Payments.tsx` | 777, 840, 857, 892 | `<Button size="icon">` without `aria-label` |
| `Products.tsx` | 621 | `<Button size="icon">` without `aria-label` |
| `Estimates.tsx` | 533 | `<Button size="icon">` without `aria-label` |
| `GuidedInvoiceCreator.tsx` | 575 | `<Button size="icon">` without `aria-label` |

**WCAG:** 4.1.2 Name, Role, Value

**Fix:** Add `aria-label` describing the button's action:
```tsx
<Button size="icon" aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

───────────────────────────────────────────────────────────────────────────────

### [A11Y] Decorative images with empty alt but missing role="presentation"

**Files affected:** 3 instances

| File | Line | Code |
|------|------|------|
| `Navigation.tsx` | 813-816 | Logo image with `alt=""` |
| `Navigation.tsx` | 819-822 | Monogram image with `alt=""` |
| `EmptyState.tsx` | 102-105 | Illustration with `alt=""` |

**WCAG:** 1.1.1 Non-text Content

**Fix:** Add `role="presentation"` for decorative images:
```tsx
<img src="/logo.svg" alt="" role="presentation" />
```

**Note:** `LandingFooter.tsx:19` correctly uses `role="presentation"` - good pattern to follow.

───────────────────────────────────────────────────────────────────────────────

### [A11Y] Form inputs without associated labels

**Files affected:** 20+ instances

| File | Line | Pattern |
|------|------|---------|
| `BatchTemplateDialog.tsx` | 88 | `<Input>` without label association |
| `DeleteAccountDialog.tsx` | 219 | `<Input>` without label association |
| `GlobalSearch.tsx` | 135 | `<Input>` without label association |
| `ClientDialog.tsx` | 345, 366, 387, 438 | Multiple inputs without labels |
| `ExpenseDialog.tsx` | 123, 138, 169, 207 | Multiple inputs without labels |
| `TagDialog.tsx` | 121 | `<Input>` without label association |
| `CategoryDialog.tsx` | 75, 91 | `<Input>` without label association |

**WCAG:** 1.3.1 Info and Relationships

**Fix:** Either use `<Label htmlFor="inputId">` with matching `id`, or add `aria-label`:
```tsx
<Label htmlFor="client-name">Client Name</Label>
<Input id="client-name" ... />
// OR
<Input aria-label="Client name" ... />
```

───────────────────────────────────────────────────────────────────────────────

### [A11Y] Heading hierarchy skips (h1 → h3)

**Files affected:** Multiple pages

| File | Pattern |
|------|---------|
| `Analytics.tsx` | h1 (194) → h3 (351) - skips h2 |
| `Dashboard.tsx` | h1 (124) → h3 (208) - skips h2 |
| `Invoices.tsx` | h1 (760) → h3 (946) - skips h2 |

**WCAG:** 1.3.1 Info and Relationships

**Fix:** Ensure heading levels are sequential (h1 → h2 → h3):
```tsx
<h1>Dashboard</h1>
<h2>Statistics</h2>  {/* Add intermediate heading */}
<h3>Revenue</h3>
```

═══════════════════════════════════════════════════════════════════════════════

## SERIOUS ISSUES (3 issues)

───────────────────────────────────────────────────────────────────────────────

### [A11Y] Focus outline removed without visible replacement

**Files affected:** 1 instance

| File | Line | Code |
|------|------|------|
| `CommandPalette.tsx` | 259 | `outline-none` on input without focus-visible replacement |

**WCAG:** 2.4.7 Focus Visible

**Fix:** Add visible focus state:
```tsx
className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
```

**Note:** Most components correctly use `outline-none focus-visible:ring-[3px]` pattern - good!

───────────────────────────────────────────────────────────────────────────────

### [VISUAL] Cursor-pointer elements without hover states

**Files affected:** 8 instances

| File | Line | Element |
|------|------|---------|
| `AvatarSelector.tsx` | 178 | Button with cursor-pointer, no hover |
| `CurrencySelector.tsx` | 70 | Div with cursor-pointer, no hover |
| `InvoiceExportDialog.tsx` | 264, 280 | Labels with cursor-pointer, no hover |

**Fix:** Add hover state for visual feedback:
```tsx
className="cursor-pointer hover:bg-accent/50 transition-colors"
```

───────────────────────────────────────────────────────────────────────────────

### [VISUAL] Z-index inconsistency

**Files affected:** 2 components

| File | Line | Z-index |
|------|------|---------|
| `CookieConsentBanner.tsx` | 48, 202 | `z-[1500]` |
| `feature-tooltip.tsx` | 171, 309 | `z-[9998]`, `z-[9997]` |

**Recommendation:** Create a z-index scale in your design tokens:
```css
--z-dropdown: 50;
--z-modal: 100;
--z-toast: 150;
--z-tooltip: 200;
```

═══════════════════════════════════════════════════════════════════════════════

## MODERATE ISSUES (2 issues)

───────────────────────────────────────────────────────────────────────────────

### [A11Y] Small button size variant (h-9 = 36px)

**File:** `button.tsx` line 88

The `sm` size variant uses `h-9` (36px), which is below the 44px recommended touch target.

**WCAG:** 2.5.5 Target Size

**Current:** `sm: "h-9 px-3 py-1.5 text-xs rounded-md"`

**Fix:** Consider increasing to `h-10` or adding `min-h-[44px]` for mobile:
```tsx
sm: "h-9 sm:h-9 min-h-[44px] sm:min-h-0 px-3 py-1.5 text-xs rounded-md"
```

**Note:** Default button size is `h-10` (40px) which is acceptable.

───────────────────────────────────────────────────────────────────────────────

### [VISUAL] Mixed font usage patterns

**Observation:** Consistent use of `font-mono` for:
- Keyboard shortcuts (`<kbd>`)
- Currency symbols
- Code snippets
- Confirmation inputs

This is **good practice** - maintains visual hierarchy.

═══════════════════════════════════════════════════════════════════════════════

## POSITIVE FINDINGS ✓

───────────────────────────────────────────────────────────────────────────────

### Accessibility Wins

1. **StatusBadge component** - Includes `role="status"` and `sr-only` text for screen readers
2. **Focus management** - Most components use `focus-visible:ring-[3px]` pattern correctly
3. **No positive tabIndex** - No instances of `tabIndex > 0` found
4. **No non-semantic click handlers** - All `onClick` handlers are on proper elements
5. **Proper link usage** - No `<a>` tags without `href` using only `onClick`

### Visual Design Wins

1. **Consistent spacing** - Uses Tailwind spacing scale consistently (gap-4, p-5, etc.)
2. **Proper color system** - Uses CSS variables for theming (--foreground, --background, etc.)
3. **Good typography hierarchy** - Consistent use of text-xs, text-sm, text-base, text-lg
4. **Responsive design** - Good use of responsive prefixes (sm:, md:, lg:)
5. **Dark mode support** - Proper dark: variants throughout

═══════════════════════════════════════════════════════════════════════════════

## SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 4 | Must fix before production |
| Serious | 3 | Should fix soon |
| Moderate | 2 | Consider fixing |
| **Total** | **9** | |

───────────────────────────────────────────────────────────────────────────────

## ACCESSIBILITY SCORE: 78/100

**Breakdown:**
- Images & Alt Text: 85/100 (minor issues with decorative images)
- Interactive Elements: 65/100 (icon buttons need aria-labels)
- Form Accessibility: 70/100 (inputs need label associations)
- Focus Management: 95/100 (excellent focus-visible usage)
- Semantic Structure: 75/100 (heading hierarchy needs work)
- Keyboard Navigation: 90/100 (good tabIndex usage)

───────────────────────────────────────────────────────────────────────────────

## VISUAL DESIGN SCORE: 88/100

**Breakdown:**
- Spacing Consistency: 95/100 (excellent Tailwind usage)
- Typography: 90/100 (good hierarchy, consistent fonts)
- Color & Contrast: 85/100 (good theming, minor hover state gaps)
- Component States: 80/100 (some missing hover states)
- Responsive Design: 90/100 (good breakpoint usage)
- Z-index Management: 75/100 (needs standardization)

═══════════════════════════════════════════════════════════════════════════════

## RECOMMENDED PRIORITY ORDER

1. **Add aria-labels to icon buttons** (27 instances) - Quick win, high impact
2. **Associate form inputs with labels** (20+ instances) - Medium effort, high impact
3. **Fix heading hierarchy** - Low effort, medium impact
4. **Add role="presentation" to decorative images** - Quick win, low impact
5. **Standardize z-index values** - Medium effort, maintenance benefit

═══════════════════════════════════════════════════════════════════════════════

Would you like me to fix these issues? I can start with the critical ones.
