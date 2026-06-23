# UI/UX Upgrade — Phase 1

## Goal
Transform the current basic dashboard into a premium dark-theme SaaS app matching the reference screenshots. Keep all business logic, routes, AI pipeline, and functionality intact.

---

## Phase 0 — Dependencies & Design System

### 0.1 Install packages
- `framer-motion` — subtle page/component animations
- `recharts` — analytics charts (minimal style)
- Add to `package.json`

### 0.2 Install additional shadcn components
Run `npx shadcn add` for each (base-nova style):
- `progress` — AI pipeline progress bar
- `tooltip` — hover tooltips on icons/actions
- `scroll-area` — scrollable panels (campaign detail)
- `command` — search bar (cmdk-style)
- `dialog` — already installed, use for confirmation modals
- `avatar` — already installed, use for user profile

### 0.3 Update `globals.css` — Force dark theme with exact colors
**Background:** `#09090B` → Tailwind `zinc-950`
**Sidebar:** `#0F1115` → custom
**Cards:** `#111318` → custom
**Borders:** `rgba(255,255,255,0.06)`
**Primary:** `#8B5CF6` → `violet-500`
**Primary Hover:** `#7C3AED` → `violet-600`
**Text Primary:** `#FAFAFA` → `zinc-50`
**Text Secondary:** `#A1A1AA` → `zinc-400`
**Success/Warning/Error/Info:** matching hex values

Remove light mode entirely (`.dark` becomes the default root). Add custom CSS variables for sidebar brand color.

### 0.4 Update `layout.tsx` (root)
- Remove `suppressHydrationWarning` if present
- Add `dark` class to `<html>` (force dark)

---

## Phase 1 — Global Layout

### 1.1 Create `src/components/sidebar.tsx`
A client component containing:
- **Brand logo** at top ("Vernio" wordmark + icon)
- **Nav items** with Lucide icons and active/hover states:
  - Dashboard (`LayoutDashboard`)
  - Campaigns (`Megaphone`)
  - Asset Library (`Image`) — *new page*
  - Templates (`LayoutTemplate`) — *new page*
  - Analytics (`BarChart3`) — *new page*
  - Settings (`Settings`)
- **User profile card** at bottom with avatar, email, sign-out
- **Width:** 240px (`w-60`)
- **Background:** `#0F1115`
- **Transitions:** 150ms fade/scale on active state
- **Responsive:** collapses to icon-only at ≤1024px, hidden at ≤768px (Sheet drawer)

### 1.2 Create `src/components/top-nav.tsx`
A client component with:
- **Search bar** (command-dialog style, opens Command menu)
- **Notification bell** icon (decorative)
- **"Create Campaign" button** linking to `/projects/new`
- **User avatar** (small, links to dropdown — reuse existing logic)
- **Sticky**, `bg-[#09090B]/80 backdrop-blur-xl`

### 1.3 Update `src/app/(dashboard)/layout.tsx`
Replace current layout:
- Wrap with `<div className="flex min-h-screen bg-[#09090B]">`
- Insert `<Sidebar />` on the left
- Right side: `<TopNav />` + `<main>` with `flex-1 overflow-auto`
- Remove the old `DashboardNav` import
- Keep auth check (redirect if no user)

### 1.4 Create `src/components/shell.tsx`
Reusable page wrapper component:
- `ShellHeader` — title + description
- `ShellSection` — section with optional header
- Consistent padding (`px-8 py-8`)
- Consistent max-width or full-width (no `max-w-5xl` centering — sidebar provides structure)

---

## Phase 2 — Page Upgrades

### 2.1 Dashboard (`/dashboard`)
**File:** `src/app/(dashboard)/dashboard/page.tsx`  
**Type:** Server Component

Sections:
1. **KPI Cards** — 4 glass-style cards in a grid
   - Campaigns Generated (count of completed projects)
   - Total Slides (sum of creative counts)
   - Pending Review (draft projects)
   - Success Rate (completed / total)
   Each card: `bg-[#111318] border border-white/[0.06] rounded-xl p-6`
2. **Recent Campaigns** — table/card hybrid
   - Use shadcn `<Table>` component
   - Columns: Name, Status, Platform, Slides, Created
   - Fetch from `getProjects()` — same data source
3. **Activity Feed** — right column (or below on smaller screens)
   - Recent actions: "AI generated 5 slides for X", "Campaign completed", etc.
   - Static for now (no activity table — just derived from project data)

### 2.2 Campaign List (`/dashboard` — already exists)
**Actually: the dashboard page IS the campaign list** (projects list).  
Enhance with:
- **Search input** filtering projects by name (client component wrapper)
- **Status filter tabs** (All, Draft, Processing, Completed, Failed)
- **Premium empty state** — illustration placeholder + "Upload your first document" CTA
- **Loading skeleton** — 5 row skeletons

### 2.3 Create Campaign (`/projects/new`)
**File:** `src/app/(dashboard)/projects/new/page.tsx`  
**Type:** Client Component  
**Biggest change** — convert flat form into 6-step wizard.

**Wizard Shell:**
- Step indicator at top (numbered circles with connector lines)
- Step content area
- Navigation buttons (Back / Next / Generate)
- Sticky footer with progress

**Step 1 — Content Source**
Radio/tab selector:
- Upload PDF (file input)
- Upload DOCX (file input)
- Paste Content (textarea)
- Google Doc URL (text input — decorative, not functional)

**Step 2 — Platform**
Existing platform selector, enhanced with visual card layout instead of dropdown.

**Step 3 — Brand Configuration**
New fields (can default to empty):
- Brand Name (input)
- Primary Color (color input / text)
- Secondary Color (color input / text)
- Logo Upload (file input)
- Brand Prompt (textarea)
*These fields save to a `brand_config` JSON field on the project (add column to schema? — No, keep as UI-only for now, store as part of content_text metadata, or add a simple `brand_config` text column to projects in a follow-up migration). For this UI upgrade, keep fields but pass them through when creating the project.*

**Step 4 — Output Configuration**
Existing template + dimension selectors, plus:
- Resolution display
- Creative Count hint (AI decides)

**Step 5 — Review**
Summary card showing all selections before generation.

**Step 6 — Generation**
Animated pipeline progress:
```
✓ Content Parsed
✓ AI Analysis Complete
✓ Structure Generated
✓ Prompt Generation Complete
⏳ Generating Image 3 of 8
```
Uses shadcn `<Progress>` + checkmarks. Polls project status every 3s.

**Behavior:** On Step 5 "Generate" click → create project → upload files → redirect to `/projects/[id]` with processing state showing the pipeline screen.

### 2.4 Campaign Detail (`/projects/[id]`)
**File:** `src/app/(dashboard)/projects/[id]/page.tsx`  
**Type:** Server Component  
**Layout:** Two-panel

**Left Panel (60%):**
- Campaign metadata header (name, platform, dimension, status badge)
- Content text (collapsible)
- Uploaded assets list
- Generated slides list (numbered cards)

**Right Panel (40%):**
- Slide preview (selected slide — default: first)
  - Slide number, title, subtitle, body, key_takeaway displayed in a preview card
- JSON view toggle (raw creative set JSON)
- Metadata section (creative type, count, created date)
- "Regenerate" button (re-runs pipeline)

**Interactive:** Clicking a slide in left panel selects it in right panel. Add state via URL search params (`?slide=2`) for shareable links.

### 2.5 Asset Library (`/assets`)
**New file:** `src/app/(dashboard)/assets/page.tsx`  
**Type:** Server Component (with client sub-components)  
**Route:** `/assets`  
**Content:** Grid of all assets across all projects (Pinterest style)
- Fetch from `assets` table joined with projects
- Cards show: thumbnail icon (file type), file name, project name, platform, date
- Click → navigates to parent project
- Filters: platform, file type

### 2.6 Template Library (`/templates`)
**New file:** `src/app/(dashboard)/templates/page.tsx`  
**Type:** Server Component  
**Route:** `/templates`  
**Content:** Card grid of templates
- Fetch from `templates` table
- Each card: template name, description, supported dimensions, "Use" button → creates new project with template pre-selected
- Static data (templates are seeded via `TEMPLATES` constant)

### 2.7 Analytics (`/analytics`)
**New file:** `src/app/(dashboard)/analytics/page.tsx`  
**Type:** Client Component (needs recharts)  
**Route:** `/analytics`  
**Content:**
- Metric cards: Campaigns Generated, Images Generated, Avg Generation Time, Est Cost
- Simple line/bar chart (recharts) showing projects over time
- Data derived from existing projects table

### 2.8 Login Page upgrade
**File:** `src/app/(auth)/login/page.tsx`  
**Changes:**
- Match dark theme (already works with globals.css)
- Better visual — centered card with subtle glow
- Add brand logo + tagline
- Smooth transition between sign-in / sign-up

---

## Phase 3 — UX Components

### 3.1 Processing Screen
**New file:** `src/components/processing-screen.tsx`  
Reusable component showing pipeline progress.
Props: `steps: { label: string; status: 'pending' | 'processing' | 'completed' | 'failed' }[]`, `currentStep: number`
- Animated checkmarks (Framer Motion scale + fade)
- Progress bar between steps
- Used in: campaign detail (processing state), create campaign wizard (step 6)

### 3.2 Empty States
**New file:** `src/components/empty-state.tsx`  
Reusable component.
Props: `icon: LucideIcon`, `title: string`, `description: string`, `action?: { label: string; href: string }`
- Centered layout with icon, text, optional CTA button
- Used on: dashboard (no campaigns), asset library (no assets), etc.

### 3.3 Loading Skeleton Components
**New file:** `src/components/skeletons.tsx`  
Pre-built skeletons:
- `DashboardSkeleton` — KPI cards + table rows
- `CampaignTableSkeleton` — 5 row skeletons
- `AssetGridSkeleton` — 6 card skeletons
- `DetailPanelSkeleton` — two-column skeleton
- `WizardSkeleton` — step form skeleton

### 3.4 Framer Motion Wrapper
**New file:** `src/components/page-animation.tsx`  
Simple wrapper component: `<PageAnimation>` — wraps page content with `motion.div` fade-in/slide-up (150ms).

---

## Phase 4 — Sidebar Navigation Structure

Add new nav items to sidebar and ensure routes work:

| Nav Item | Route | Page File | Status |
|----------|-------|-----------|--------|
| Dashboard | `/dashboard` | Existing | Enhance |
| Campaigns | `/dashboard` (or `/campaigns`) | Existing | Existing + Enhance |
| Asset Library | `/assets` | New | Create |
| Templates | `/templates` | New | Create |
| Analytics | `/analytics` | New | Create |
| Settings | `/settings` | Stub | Defer |

**Note:** "Campaigns" and "Dashboard" currently are the same page (projects list). The sidebar will show "Campaigns" as the primary nav item. Dashboard will show KPI overview + recent campaigns.

---

## Phase 5 — Responsiveness

### 5.1 Sidebar
- `≥1024px`: Full 240px sidebar
- `<1024px`: Icon-only sidebar (56px)
- `<768px`: Hidden, replaced by Sheet drawer (hamburger in top nav)

### 5.2 Tables
- `≥1024px`: Full table layout
- `<1024px`: Cards layout (hide columns via responsive classes)
- `<640px`: Single column, stacked cards

### 5.3 Dashboard KPI Grid
- `≥1024px`: 4 columns
- `<1024px`: 2 columns
- `<640px`: 1 column

### 5.4 Create Campaign Wizard
- `≥1024px`: Sidebar visible, full-width content
- `<768px`: Full-width wizard, no sidebar (Sheet replaces)

---

## Files to Create (14)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/components/sidebar.tsx` | Sidebar navigation |
| 2 | `src/components/top-nav.tsx` | Top navigation bar |
| 3 | `src/components/shell.tsx` | Page layout wrapper |
| 4 | `src/components/processing-screen.tsx` | AI pipeline progress |
| 5 | `src/components/empty-state.tsx` | Empty state components |
| 6 | `src/components/skeletons.tsx` | Loading skeletons |
| 7 | `src/components/page-animation.tsx` | Framer Motion wrapper |
| 8 | `src/app/(dashboard)/assets/page.tsx` | Asset Library page |
| 9 | `src/app/(dashboard)/templates/page.tsx` | Template Library page |
| 10 | `src/app/(dashboard)/analytics/page.tsx` | Analytics page |
| 11 | `src/app/(dashboard)/loading.tsx` | Dashboard loading state |

## Files to Modify (9)

| # | File | Change |
|---|------|--------|
| 1 | `src/app/globals.css` | Dark theme colors |
| 2 | `src/app/layout.tsx` | Force dark mode, Inter font |
| 3 | `src/app/(dashboard)/layout.tsx` | Sidebar + top nav layout |
| 4 | `src/app/(dashboard)/dashboard/page.tsx` | KPI cards + table + activity |
| 5 | `src/app/(dashboard)/projects/new/page.tsx` | 6-step wizard |
| 6 | `src/app/(dashboard)/projects/[id]/page.tsx` | Two-panel layout |
| 7 | `src/app/(auth)/login/page.tsx` | Dark theme polish |
| 8 | `src/components/dashboard-nav.tsx` | Remove (replaced by sidebar + top-nav) |
| 9 | `package.json` | Add framer-motion, recharts |

## Files to Delete (1)
| # | File | Reason |
|---|------|--------|
| 1 | `src/components/dashboard-nav.tsx` | Replaced by sidebar + top-nav |

---

## Verification
1. `npx tsc --noEmit` — zero type errors
2. `npm run build` — successful build
3. Manual test: all existing routes work (`/login`, `/dashboard`, `/projects/new`, `/projects/[id]`)
4. Manual test: create project flow works (form submit → redirect)
5. Manual test: generation pipeline still works (click generate → status updates)
6. Responsive testing at 1440px, 1024px, 768px
7. Verify no Phase 2 functionality added (no editor, no export, no drag-drop)
