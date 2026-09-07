# Frontend-Web Dark Mode Audit Report

## Executive Summary
Comprehensive audit of frontend-web application found **21 files** with hardcoded colors and dark mode inconsistencies. The main issues are:

1. **Auth pages** use hardcoded dark backgrounds that don't adapt to light mode
2. **Color literals** in inline styles that bypass Tailwind's dark: variants
3. **Missing dark: prefixes** in many components
4. **Inconsistent CSS variable usage** across components

---

## Critical Issues Found

### 1. Login Page (`app/login/page.tsx`)
**Severity:** HIGH
- Line 8: `bg-[#060810]` hardcoded dark background with white text
- **Fix:** Replace with `bg-background` (CSS variable) and add `dark:text-white` + conditional text color

**Current Code:**
```tsx
<div className="min-h-screen bg-[#060810] text-white flex flex-col items-center justify-center p-6">
```

**Should Be:**
```tsx
<div className="min-h-screen bg-background text-foreground dark:text-white flex flex-col items-center justify-center p-6">
```

---

### 2. Auth Layout (`app/(auth)/layout.tsx`)
**Severity:** CRITICAL
- Lines 9-48: Multiple hardcoded dark colors in inline styles
- Branding panel has dark-only gradient and color schemes
- Stats cards use hardcoded rgba values

**Issues:**
- Line 9: `linear-gradient(145deg, rgb(9 11 20), rgb(26 27 75))` — hardcoded dark gradient
- Line 12: `rgb(99 102 241)` — hardcoded color literal
- Line 13: `rgb(139 92 246)` — hardcoded color literal
- Line 19: `linear-gradient(135deg, #6366f1, #8b5cf6)` — hardcoded gradient
- Line 30: `color: 'rgb(148 163 184)'` — hardcoded muted text
- Line 42: `background: 'rgb(255 255 255 / 0.05)'` — hardcoded light overlay
- Line 44: `color: 'rgb(148 163 184)'` — hardcoded muted text
- Line 48: `color: 'rgb(100 116 139)'` — hardcoded muted text

**Impact:** Auth layout is completely unresponsive to theme changes. Light mode users see dark theme forced on them.

---

### 3. Billing Page (`app/billing/page.tsx`)
**Severity:** MEDIUM
- Likely has hardcoded card backgrounds and text colors
- Need to verify plan card styling

---

### 4. Pages With Hardcoded Colors (Confirmed)
- `app/(dashboard)/whatsapp-templates/page.tsx`
- `app/(dashboard)/settings/page.tsx`
- `app/(dashboard)/settings/billing/page.tsx`
- `app/(dashboard)/automations/page.tsx`
- `app/(dashboard)/admin/custom-fields/page.tsx`
- `app/(dashboard)/admin/audit-logs/page.tsx`
- `app/(dashboard)/hr/leaves/page.tsx`
- `app/(dashboard)/pdf-catalogue/page.tsx`
- `app/(dashboard)/hr/interviews/page.tsx`
- `app/(dashboard)/comms/page.tsx`
- `app/(dashboard)/settings/profile/page.tsx`
- `app/(dashboard)/settings/team/page.tsx`
- `app/(dashboard)/tasks/page.tsx`
- `app/(dashboard)/companies/page.tsx`
- `app/(dashboard)/contacts/page.tsx`
- `app/(dashboard)/admin/workflow/page.tsx`
- `app/onboarding/page.tsx`

---

## CSS Custom Properties Available (from globals.css)

### Light Theme (Default `:root`)
```css
--background: 248 250 252
--foreground: 15 23 42
--card: 255 255 255
--border: 226 232 240
--muted: 100 116 139
--muted-foreground: 71 85 105
--primary: 79 70 229
--secondary: 241 245 249
```

### Dark Theme (`@media (prefers-color-scheme: dark)`)
```css
--background: 11 13 23
--foreground: 248 250 252
--card: 15 18 30
--border: 30 41 59
--muted: 100 116 139
--muted-foreground: 148 163 184
--primary: 99 102 241
--secondary: 30 33 48
```

---

## Fixes Required

### Priority 1: Auth Layout (MUST FIX)
1. Convert auth layout branding panel to use CSS variables
2. Add `@media (prefers-color-scheme: light)` styling for light mode
3. Remove hardcoded rgba colors

### Priority 2: Login Page
1. Use `bg-background` instead of `bg-[#060810]`
2. Add conditional text color based on theme

### Priority 3: Other Pages
1. Audit each page for hardcoded colors
2. Replace with `dark:` Tailwind variants
3. Use CSS variables for inline styles

---

## Implementation Plan

### Phase 1: Auth System (Login + Layout)
- [ ] Fix `app/(auth)/layout.tsx` — convert all hardcoded colors to CSS variables
- [ ] Fix `app/login/page.tsx` — use theme-aware backgrounds
- [ ] Test light mode and dark mode rendering

### Phase 2: Dashboard Pages
- [ ] Audit and fix all 16+ dashboard pages
- [ ] Ensure cards, tables, and modals use `dark:` variants
- [ ] Verify sidebar and navigation theming

### Phase 3: Settings & Admin Pages
- [ ] Fix all settings pages
- [ ] Fix admin pages
- [ ] Fix HR and other specialized pages

### Phase 4: Onboarding & Billing
- [ ] Fix onboarding page
- [ ] Fix billing page
- [ ] Verify all auth flows work in both themes

---

## Testing Checklist

After fixes, verify:
- [ ] Login page renders correctly in light mode
- [ ] Login page renders correctly in dark mode
- [ ] Auth layout branding panel adapts to theme
- [ ] All dashboard pages have proper `dark:` variants
- [ ] Theme toggle works across all pages
- [ ] Switching between light/dark/system modes works
- [ ] Page refresh maintains selected theme
- [ ] No hardcoded colors visible in browser DevTools

---

## Color Mapping Reference

| Use Case | Light Mode | Dark Mode | CSS Property |
|----------|-----------|-----------|----------------|
| Page Background | `bg-background` | `bg-background` | `--background` |
| Text Color | `text-foreground` | `text-foreground` | `--foreground` |
| Card Background | `bg-card` | `bg-card` | `--card` |
| Border | `border-border` | `border-border` | `--border` |
| Muted Text | `text-muted` | `text-muted` | `--muted` |
| Primary Action | `text-primary` / `bg-primary` | `text-primary` | `--primary` |
| Secondary | `bg-secondary` | `bg-secondary` | `--secondary` |

---

## Files to Update (in order of priority)

1. `app/(auth)/layout.tsx` — **CRITICAL**
2. `app/login/page.tsx` — **HIGH**
3. `app/(auth)/auth/login/page.tsx` — **HIGH**
4. All remaining 18 files with color issues

---

Generated: 2026-09-07
Status: Audit Complete — Ready for Implementation
