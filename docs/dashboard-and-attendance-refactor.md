# Dashboard & Attendance Refactor — Tasks & Design Guidance

Purpose
- Capture the tasks required to implement a modern, data-driven Admin Dashboard focused on Attendance and related operational KPIs for the hostel management app.
- Record design guidance that matches the current app aesthetic (rounded cards, purple primary, orange accents, soft shadows) and provide concrete color tokens and chart pairings.

NOTE: This file lists tasks (brief descriptions) so we can convert each to a full spec later (similar to `doc/staff-features.md`).

---

## Immediate tasks (first pass)

1. Shared design foundations (tokens & palettes)
- Create a single shared token file (`tokens.css` / Tailwind config) with colors, spacing, radii and elevation tokens. Define two named palette variants (`admin`, `student`) and document which palette is used where; see the "Shared design tokens & palettes" section below for detailed mappings.

### Shared design foundations — Detailed implementation guide

Overview
- This guide defines the concrete files, token naming conventions, usage patterns, Tailwind integration, migration steps and tests required to implement a single source of truth for the UI design system used by both Admin and Student surfaces.

Goals
- Create a small, maintainable token surface that covers: colors, spacing, radii, elevation (shadows), typography tokens, motion (timing & easing), and a simple palette-variant system (`admin` | `student`).
- Ensure components use semantic tokens (e.g. `--color-success`) rather than raw hex values so visual changes are centralized and safe.
- Provide Tailwind mappings so teams can use both utility classes and CSS variables consistently.

Scope
- Files to add/update:
  - `client/src/index.css` — add the canonical variables block here (single source of truth for tokens; avoid creating additional CSS files).
  - `client/tailwind.config.js` — extend the theme to reference CSS vars where helpful.
  - `docs/dashboard-and-attendance-refactor.md` — this documentation (updated here).
  - Note: prefer keeping theme overrides as small class selectors in `client/src/index.css` (e.g., `.theme-admin`, `.theme-student`) rather than creating many CSS files.

Token naming conventions
- Use semantic names (what the token means) not presentation names. Prefix categories for clarity:
	- Colors: `--color-*` (e.g., `--color-primary`, `--color-danger`, `--color-success`)
	- Text: `--text-*` (e.g., `--text-primary`, `--text-muted`)
	- Spacing: `--space-*` (scale based: `--space-0`, `--space-1`, ...)
	- Radius: `--radius-*` (e.g., `--radius-sm`, `--radius-md`, `--radius-lg`)
	- Elevation/shadows: `--elevation-*` (e.g., `--elevation-1` with full box-shadow value)
	- Motion: `--motion-duration-*`, `--motion-easing-*`

Canonical tokens (what to include)
- Colors (example): `--color-primary`, `--color-primary-2`, `--color-accent`, `--color-success`, `--color-danger`, `--color-excused`, `--bg-page`, `--bg-surface`, `--bg-muted`, `--text-primary`, `--text-muted`, decorative accents and Google icon colors.
- Spacing scale (example):
	- `--space-0: 0px;`
	- `--space-1: 4px;`
	- `--space-2: 8px;`
	- `--space-3: 12px;`
	- `--space-4: 16px;`
	- `--space-5: 24px;`
	- `--space-6: 32px;`
- Radii (example): `--radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px;`
- Elevation (example):
	- `--elevation-1: 0 1px 2px rgba(16,24,40,0.04);`
	- `--elevation-2: 0 6px 18px rgba(16,24,40,0.06);`

- Motion: `--motion-duration-fast: 150ms`, `--motion-duration-medium: 300ms`, `--motion-easing`: `cubic-bezier(.2,.8,.2,1)`

Sample tokens block (place inside `client/src/index.css`)
```css
:root {
	/* Colors */
	--color-primary: #7C3AED;
	--color-primary-2: #A78BFA;
	--color-accent: #FF9F43;
	--color-success: #10B981;
	--color-danger: #EF4444;
	--color-excused: #FFB591;

	--text-primary: #111827;
	--text-muted: #6B7280;

	--bg-page: #F8FAFC;
	--bg-surface: #FFFFFF;
	--bg-muted: #F9F9F9;

	/* Spacing */
	--space-0: 0px;
	--space-1: 4px;
	--space-2: 8px;
	--space-3: 12px;
	--space-4: 16px;
	--space-5: 24px;
	--space-6: 32px;

	/* Radii */
	--radius-sm: 6px;
	--radius-md: 8px;
	--radius-lg: 12px;

	/* Elevation */
	--elevation-1: 0 1px 2px rgba(16,24,40,0.04);
	--elevation-2: 0 6px 18px rgba(16,24,40,0.06);

	/* Motion */
	--motion-duration-fast: 150ms;
	--motion-duration-medium: 300ms;
	--motion-easing: cubic-bezier(.2,.8,.2,1);
}

/* Theme variants (place into the same file as small class overrides) */
.theme-admin { --color-primary: #7C3AED; --color-primary-2: #A78BFA; }
.theme-student { --color-primary: #A78BFA; --color-primary-2: #C9B8FF; }
```

Tailwind integration (example)
- Approach A — add semantic colors in `tailwind.config.js` that reference CSS vars. This lets you use `text-primary` or `bg-primary` utilities while keeping CSS variables editable at runtime.

```js
export default {
	content: ["./index.html", "./src/**/*.{js,jsx}"],
	theme: {
		extend: {
			colors: {
				primary: 'var(--color-primary)',
				accent: 'var(--color-accent)',
				success: 'var(--color-success)',
				danger: 'var(--color-danger)'
			},
			spacing: {
				'1': 'var(--space-1)',
				'2': 'var(--space-2)',
				'3': 'var(--space-3)'
			},
			borderRadius: {
				sm: 'var(--radius-sm)',
				md: 'var(--radius-md)'
			},
			boxShadow: {
				card: 'var(--elevation-2)'
			}
		}
	},
	plugins: []
}
```

Notes:
- Tailwind can reference CSS variables as string values — this gives the best of both worlds: utility classes and runtime theming.
- Keep heavy theming in CSS variables rather than in Tailwind static tokens if you need runtime theme switching (e.g., `.theme-student`).

Component usage patterns
- Prefer semantic tokens in component styles:
	- Text color: `color: var(--text-primary)`
	- Card background: `background: var(--bg-surface); box-shadow: var(--elevation-2); border-radius: var(--radius-md)`
- For inline JSX styles you can use `style={{ backgroundColor: 'var(--bg-surface)' }}` but prefer class-based styles for reusability.
- Charts: use `--color-primary`, `--color-success`, `--color-danger`, and the heatmap ramp `--heatmap-mid`/`--heatmap-high` for consistent visuals.

Migration plan (recommended incremental approach)
1. Add the canonical tokens block directly into `client/src/index.css` near the top (single source of truth).
2. Add alias variables (temporary) matching colors currently used across the app (e.g., `--color-brand`) so components can be migrated gradually.
3. Run a project-wide search for hex/rgb literals and group by frequency (we already did a scan).
4. Replace the highest-frequency literals first with semantic tokens (open PRs with small scoped changes per component). Example change: replace `bg-[#F8FAFC]` with `bg-[var(--bg-page)]` or add `class="bg-page"` if you add a small helper.
5. Remove deprecated literals and old token aliases after the codebase is fully migrated.

Automation suggestions
- Use simple codemods (jscodeshift) or search-and-replace scripts to automate literal -> var substitution for many files, but review each visually.
- Add a lint rule (ESLint custom or Stylelint) to detect hard-coded hex values and suggest tokens.

Accessibility & contrast
- Test all primary token pairs for WCAG AA/AAA where appropriate (text sizes, UI states). Tools: `axe`, `pa11y`, or the Color Contrast Analyzer.
- Keep an accessible contrast table in the docs: list token pairs and their contrast ratio.

Testing & visual QA
- Unit tests: snapshot critical components that depend on tokens (KPI card, donut, table row) so token regressions are obvious.
- Visual regression: use Percy/Chromatic or Playwright screenshot comparisons for the dashboard with both `theme-admin` and `theme-student` applied.

Acceptance criteria
- Canonical token block present in `client/src/index.css` and loaded by the app root.
- Tailwind theme references `var(--*)` values for at least `primary`, `accent`, `success`, `danger`.
- No new components are introduced with raw hex colors in PRs after migration (lint gate).
- Visual snapshots for the dashboard pass for both admin/student palettes.

Deliverables
- Canonical tokens added to `client/src/index.css` (single source of truth).  
- Tailwind config updates in `client/tailwind.config.js`.  
- Small migration PRs replacing top-10 repeated color literals with tokens.  
- Documentation added here (`docs/dashboard-and-attendance-refactor.md`) describing token usage and migration steps.

Estimated effort (rough)
- Token file + Tailwind small changes: 0.5 day.  
- Migrate top 10 color hotspots: 0.5–1 day.  
- Full visual regression + accessibility pass: 1 day.

Decisions required
- Dark mode strategy — variables only, or Tailwind `dark:` utilities?  
- How aggressive should the migration be (big-bang codemod vs incremental PRs)?

Next steps (recommended)
1. Add the canonical tokens block to `client/src/index.css` (I can do this now).  
2. Add a minimal Tailwind mapping for `primary`/`accent` so devs can use `bg-primary` / `text-primary`.  
3. Migrate the top 10 color literal occurrences into tokens with small PRs.


2. Dashboard layout scaffold
- Add `client/src/pages/admin/AttendanceDashboard.jsx` and a parent `DashboardLayout` scaffold. Implement a responsive grid (cards on top, two-column middle section, table below).

### Dashboard layout scaffold — Detailed implementation guide

Overview
- The Attendance Dashboard is the admin's main operational view: KPI cards at the top, charts and summary widgets in a two-column middle section, and the roster/attendance table below. The scaffold should provide the page-level composition, shared data loading, responsive breakpoints and slot areas where composable child components render.

Goals
- Fast initial render of top-level KPIs and skeleton loaders for heavy chart/table content.
- Clear component boundaries so each chart/card/table can be developed, tested and replaced independently.
- Responsive behaviour: single-column mobile, two-column tablet/desktop, and fluid card wrapping for smaller screens.
- Accessibility, keyboard navigation and screen-reader friendly markup.

Scope — files to add / update
- `client/src/pages/admin/AttendanceDashboard.jsx` — page container: coordinates data loads, realtime subscriptions, error handling and page-level state (filters/date range).
- `client/src/components/DashboardLayout.jsx` — reusable layout wrapper (header slot, top-cards slot, main two-column grid, footer/actions area).
- `client/src/components/KpiCard.jsx` — compact metric card used in top row.
- `client/src/components/AttendanceTrendChart.jsx` — trend chart component (area/line) using chart library.
- `client/src/components/PresentDonut.jsx` — donut/gauge widget for present/absent/excused distribution.
- `client/src/components/Heatmap.jsx` — heatmap grid view for hour×day density.
- `client/src/components/AttendanceTable.jsx` — virtualized/paginated table with search & bulk actions.
- `client/src/components/StudentDetailDrawer.jsx` — slide-over for student details and actions.
- `client/src/hooks/useAttendance*.js` — small fetch hooks (summary, trend, heatmap, list) that use `fetchClient.js` and can integrate React Query or SWR later.

Layout specification
- Grid (desktop >= 1024px):
	- Top: full-width row of KPI cards (auto-grid with `grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4`).
	- Middle: two-column grid `grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6` — left: large trend chart + heatmap (stacked), right: donut, staff coverage, alerts (stacked cards).
	- Bottom: full-width AttendanceTable with filters toolbar above.
- Tablet (>= 768px < 1024px): two columns for KPI cards, middle stacks vertically but keeps compact charts side-by-side where space permits.
- Mobile (< 768px): single column; show greeting/KPIs first, then quick actions, then charts, then table (table collapsed into compact list with expand actions).

Responsive Tailwind example (structure):
```jsx
<DashboardLayout>
	<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">{/* KpiCard instances */}</div>
	<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-6">{/* left/right */}</div>
	<div className="mt-6">{/* AttendanceTable */}</div>
</DashboardLayout>
```

Component contracts (recommended props)
- `KpiCard`:
	- props: `{ title, value, delta, sparklineData, onClick }`
	- behavior: clickable to open drill-down; shows loading skeleton when `value` null.
- `AttendanceTrendChart`:
	- props: `{ start, end, granularity='day', data, onSeriesToggle }`
	- produces accessible legend, aria labels, and an option to export chart data.
- `PresentDonut`:
	- props: `{ present, absent, excused, onClickSegment }` — segments clickable for drilldowns.
- `Heatmap`:
	- props: `{ matrix, xLabels, yLabels }` — tooltip on hover and accessible description provided.
- `AttendanceTable`:
	- props: `{ start, end, page, limit, filters, onRowClick, onBulkAction }`
	- should support virtualization (react-window) or pagination and server-side sorting/filtering.
- `StudentDetailDrawer`:
	- props: `{ studentId, open, onClose }` — fetches student detail (or accepts `student` object) and displays actions (message, mark excused).

Data wiring & fetching strategy
- Endpoints used:
	- `GET /api/attendance/summary?start=&end=&area=` — top KPIs.
	- `GET /api/attendance/trend?start=&end=&granularity=` — trend series.
	- `GET /api/attendance/heatmap?start=&end=` — matrix for heatmap.
	- `GET /api/attendance/list?start=&end=&page=&limit=&q=` — paginated table rows.
	- `GET /api/coverage` — staff coverage & suggestions.
- Load sequence:
	1. Load `summary` immediately on mount (KPIs visible fast).
	2. In parallel fetch `trend` and `heatmap` while showing skeletons.
	3. Defer `list` (table) fetch until after summary/trend to reduce DB contention; show lightweight skeleton or first-page loader.
	4. Subscribe to websocket updates for `attendance.updated` and patch local cache for summary & list rows (consider optimistic UI for minor updates).
- Use `client/src/api/fetchClient.js` (existing project helper) for network calls; wrap in small hooks: `useAttendanceSummary`, `useAttendanceTrend`, etc. Consider adding React Query later for caching and revalidation.

Error handling & UX
- Show contextual toasts for fetch errors (retry action) and soft fallback UIs (empty states with help copy).
- Provide retry button on the page-level if multiple requests fail.

Styling & tokens
- Use semantic tokens from `tokens.css`: `var(--bg-surface)`, `var(--text-primary)`, `var(--color-primary)` for chart accents, and `var(--elevation-2)` for card shadows. Keep all spacing and radii mapped to `--space-*` and `--radius-*` tokens.

Accessibility
- Use semantic HTML: `role="region" aria-labelledby` for each major area.
- Table must be a real `<table>` with `aria-sort` on sortable headers and keyboard focusable rows. Provide `aria-live` polite region for live KPIs/alerts updates.
- Charts must expose summary text in visually-hidden elements and provide keyboard controls for series toggles.

Testing & QA
- Unit tests: render `AttendanceDashboard` with mocked hooks (summary/trend/list) and test loading -> success -> error flows.
- Integration tests: simulate APIs returning varying dataset sizes and ensure layout remains stable.
- Visual regression: capture screenshots for mobile/tablet/desktop, and compare after token/theme changes.

Performance
- Virtualize table rows (`react-window`) when list length > 100.
- Debounce filter/search inputs (250–400ms) and cancel in-flight requests when new queries are issued.
- Lazy-load heavy charts (only render when chart area is visible) and memoize chart data transforms.

Acceptance criteria
- KPIs (summary) render within 200ms on a warm cache or within one network RTT for mock dev server.
- Layout responds correctly at three breakpoints (mobile/tablet/desktop) with no horizontal scroll.
- Table supports search, sort, pagination and row drill-down via `StudentDetailDrawer`.
- Realtime updates patch KPI values and show new `CoverageAlerts` without full page reload.

Deliverables
- `client/src/pages/admin/AttendanceDashboard.jsx` (page).  
- `client/src/components/DashboardLayout.jsx` (wrapper).  
- Stubs for `KpiCard`, `AttendanceTrendChart`, `PresentDonut`, `Heatmap`, `AttendanceTable`, `StudentDetailDrawer`.  
- `client/src/hooks/useAttendanceSummary.js` and related hooks.  
- Unit & visual tests for the dashboard.

Estimated effort (rough)
- Scaffold page + layout + skeletons: 0.5 day.  
- Implement KPIs + basic chart wiring: 0.5–1 day.  
- Table + virtualization + slide-over: 1–2 days.  
- Realtime subscriptions + polishing: 0.5–1 day.

Decisions required
- Chart library: `recharts` (lightweight, declarative) vs `apexcharts` (more features) — I recommend `recharts` for MVP.  
- Data fetching: use bare `fetch` hooks or adopt `react-query` for caching and ease of background revalidation? I recommend `react-query` if we'll build more realtime dashboards.

Next steps (recommended)
1. I can scaffold `AttendanceDashboard.jsx` + `DashboardLayout.jsx` with skeleton components and placeholder data now.  
2. Then implement `KpiCard` and hook it to `GET /api/attendance/summary` (server mock if endpoint missing).  
3. After that, implement `AttendanceTrendChart` and `AttendanceTable` in sequence.

Implementation notes
- Keep each component small and testable; wire API errors to a single page-level error banner to avoid per-component clutter.  
- Use the tokens and Tailwind mappings added earlier so CSS values are centralized and theme-ready.


-3. KPI cards component
- Implement compact `KpiCard` component (metric, delta, sparkline). Cards: Total Students, Present %, Absent, Late, Staff On Duty.

### KPI cards component — Detailed implementation guide

Overview
- `KpiCard` is a small, highly-reusable metric card used in the dashboard's top row. Each card shows a primary value, an optional unit, a small delta (absolute or percent) with an arrow, and a tiny sparkline summarizing recent history. Cards should be keyboard-focusable and provide an accessible summary for screen readers.

Goals
- Provide a compact, consistent visual for top-level KPIs.
- Render quickly with a skeleton placeholder while data loads.
- Support click/drill-down, accessible descriptions, and realtime updates.
- Keep visual styling driven by tokens (`client/src/index.css`) and Tailwind utilities.

Scope — Files to add / update
- `client/src/components/KpiCard.jsx` — the component implementation and local styles.
- `client/src/components/KpiCard.css` (optional) — tiny helper classes, prefer token usage in `index.css`.
- `client/src/hooks/useAttendanceSummary.js` — data hook that fetches the summary used by KPIs.
- `client/src/components/KpiCard.test.jsx` — unit tests (React Testing Library + Jest).
- `client/src/components/KpiCard.stories.jsx` — Storybook stories (optional but recommended).
- `client/tailwind.config.js` — ensure semantic colors reference `var(--*)` tokens if not already.

Component contract (props)
- `id` (string): unique id for the metric (e.g., `total_students`).
- `title` (string): label shown under/above the value.
- `value` (number|string|null): primary value; `null` means loading placeholder.
- `unit` (string|undefined): optional unit suffix (e.g., `%`, `students`).
- `delta` (number|undefined): delta value (absolute or percent) compared to previous period.
- `deltaDirection` (`'up'|'down'|'neutral'`): used to color the delta and choose an arrow.
- `sparklineData` (number[]|undefined): small series for the inline sparkline.
- `loading` (boolean): show skeleton when true.
- `onClick` (fn|undefined): optional drill-down handler.
- `ariaLabel` (string|undefined): override for accessibility.

Behavior & UX
- Loading: show a compact skeleton box for value and greyed sparkline.
- Delta: show an up/down chevron with color: `--color-success` for up, `--color-danger` for down, `--text-muted` for neutral.
- Sparkline: small inline SVG or lightweight `recharts` line with no axes; hidden at very small breakpoints.
- Click: if `onClick` provided, card is keyboard-focusable (`tabIndex=0`) and triggers on Enter/Space.

Design & tokens
- Background: `var(--bg-surface)`; card shadow: `var(--elevation-2)`; border-radius: `var(--radius-md)`.
- Text: `var(--text-primary)` for labels, `var(--ui-ink)` for numeric value.
- Accent strokes (sparkline/delta): `var(--color-primary)` and status colors `var(--color-success)` / `var(--color-danger)`.
- Example Tailwind-friendly class: `bg-[var(--bg-surface)] shadow-card rounded-md p-3 flex items-center justify-between`.

Data wiring & recommended API shape
- Preferred endpoint: `GET /api/attendance/summary?start=&end=&area=` — returns an array of cards or a keyed object.
- Recommended response shape (cards array):

```json
{
	"timestamp": "2026-04-19T08:00:00Z",
	"cards": [
		{ "id": "total_students", "title": "Total Students", "value": 420, "unit": null, "delta": 0, "deltaDirection": "neutral", "sparkline": [410,412,415,418,420] },
		{ "id": "present_pct", "title": "Present %", "value": 76.19, "unit": "%", "delta": 2.3, "deltaDirection": "up", "sparkline": [72,73,74,75,76.19] },
		{ "id": "absent", "title": "Absent", "value": 80, "unit": null, "delta": -5, "deltaDirection": "down", "sparkline": [95,90,88,82,80] },
		{ "id": "late", "title": "Late", "value": 20, "unit": null, "delta": 1, "deltaDirection": "up", "sparkline": [18,19,20,19,20] },
		{ "id": "staff_on_duty", "title": "Staff On Duty", "value": 12, "unit": null, "delta": 0, "deltaDirection": "neutral", "sparkline": [11,12,12,12,12] }
	]
}
```

Hook contract (`useAttendanceSummary`)
- Returns `{ data, loading, error, refetch }` where `data.cards` is the array above.
- Implementation notes: use `client/src/api/fetchClient.js` (do not add Axios). Provide a `pollInterval` option (e.g., 30s) and a `realtimeSubscribe` option to patch the cached values from websocket events.

Implementation details & examples
- `KpiCard.jsx`: prefer function component with `React.memo`. Use an inline SVG sparkline renderer (tiny, ~40×16) to avoid heavy chart deps; fallback to `recharts` if team prefers consistency.
- Number formatting: use `Intl.NumberFormat` with compact notation for large counts (e.g., `420` stays `420`, `1200` → `1.2K`).
- Delta formatting: show `+2.3%` or `+2` depending on `unit`. Add `title` attribute with full precision for hover.
- Loading skeleton: use CSS shimmer tied to token colors (subtle grey).

Accessibility
- Each card exposes an `aria-label` summarizing the metric (e.g., "Total Students: 420, no change from previous period").
- Use `role="button"` when clickable, and keyboard handlers for Enter/Space.
- Provide visually-hidden text describing the sparkline trend for screen-reader users when relevant.

Testing & QA
- Unit tests: render with mock `cards` and assert numeric formatting, delta coloring and onClick behavior.
- Accessibility tests: run `axe` against the component stories and ensure no critical violations.
- Visual snapshot: storybook snapshot or jest snapshot for default, loading and error states.

Performance
- Memoize `KpiCard` and inline sparkline rendering; avoid re-rendering all cards on unrelated state changes.
- If sparkline data is large, downsample to 20 points before rendering.

Acceptance criteria
- `KpiCard` component exists and implements the props contract above.
- KPI row renders 5 cards (Total Students, Present %, Absent, Late, Staff On Duty) with skeletons on load.
- Cards are keyboard accessible and provide screen-reader summaries.
- Hook `useAttendanceSummary` fetches `GET /api/attendance/summary` and maps response to card props.
- Unit tests and storybook stories added.

Deliverables
- `client/src/components/KpiCard.jsx` (component).  
- `client/src/hooks/useAttendanceSummary.js` (data hook).  
- Test and story files for `KpiCard`.  
- API contract documentation (in this doc) and a sample response body.

Estimated effort (rough)
- Doc + component scaffold: 0.25–0.5 day.  
- Hook + basic wiring to mock endpoint: 0.25 day.  
- Tests + storybook: 0.25 day.  
- Polishing & accessibility fixes: 0.25 day.

Next steps (recommended)
1. I can scaffold `KpiCard.jsx` and `useAttendanceSummary.js` with example data now.  
2. Add Storybook stories and snapshot tests.  
3. Wire hook to real `GET /api/attendance/summary` endpoint or a mock server for the initial UI.

4. Attendance trend chart
- Create `AttendanceTrendChart` (area/line) with stacked series (present, absent, excused). Wire to `GET /api/attendance/trend`.

### AttendanceTrendChart — Detailed implementation guide

Overview
- `AttendanceTrendChart` is a responsive, accessible stacked area chart that visualizes attendance over time (present / absent / excused). It supports multiple granularities (hour/day/week), an interactive brush/zoom, series toggle, and optional percent-mode (stacked %). The component must follow the app's existing UI design language (tokens, spacing, radii, shadows, typography) so its visuals align with other dashboard components.

Goals
- Provide a clear, at-a-glance trend of attendance that aids operational decisions.
- Support toggling series visibility and switching between absolute counts and relative percentages.
- Render fast with skeleton UI, support downsampling for long ranges, and accept realtime patches via websockets.
- Use the canonical tokens in `client/src/index.css` for all colors, spacing, radii and elevation so the chart matches the rest of the app.

Scope — Files to add / update
- `client/src/components/AttendanceTrendChart.jsx` — component implementation.
- `client/src/hooks/useAttendanceTrend.js` — data hook using `fetchClient.js` (no Axios).
- `client/src/components/AttendanceTrendChart.test.jsx` — unit tests (Jest + RTL) and tiny data transform tests.
- `client/src/components/AttendanceTrendChart.stories.jsx` — Storybook stories for different time ranges and modes.
- `client/tailwind.config.js` — ensure chart-related semantic colors reference `var(--*)` tokens if not already.

Component contract (props)
- `start` (ISO date string | Date | undefined): start of range.
- `end` (ISO date string | Date | undefined): end of range.
- `granularity` (`'hour'|'day'|'week'`): aggregation unit.
- `mode` (`'absolute'|'percent'`): show raw counts or stacked percent.
- `area` (string|undefined): optional campus/area filter.
- `height` (number|undefined): chart height in px (default 260).
- `onPointClick` (fn|undefined): drill-down handler when clicking a point.
- `autoRefresh` (boolean|number): false or poll interval in seconds.

Behavior & UX
- Loading: display a skeleton card matching other cards (use `var(--bg-surface)` and `var(--elevation-2)`), with an inline placeholder graph.
- Tooltip: on hover show timestamp and per-series counts and percentages; include an export button for CSV of visible series.
- Series toggle: show checkboxes/chips in the chart header to show/hide `present`, `absent`, `excused` series.
- Brush: support a horizontal brush to zoom into sub-range and emit `onRangeChange` events for other components.
- Accessibility: keyboard-focusable legend controls, aria-label describing the current range and visible series, and a visually-hidden data summary for screen readers.

Design & token usage
- Colors: use tokens `--color-primary` (present series accent), `--color-danger` (absent), `--color-excused` (excused). If the chart lib requires concrete colors, read tokens at runtime:

```js
const root = getComputedStyle(document.documentElement);
const primary = root.getPropertyValue('--color-primary').trim();
```

- Card: wrap the chart in a container styled with `background: var(--bg-surface); box-shadow: var(--elevation-2); border-radius: var(--radius-md); padding: var(--space-4)` so it matches other dashboard cards.
- Typography: use `--text-primary` and typographic scales already used by `KpiCard` (match font-weight and sizes).

Recommended chart library & patterns
- Use `recharts` for MVP (lightweight, React-friendly). Implement a `ResponsiveContainer` + `AreaChart` with stacked `Area` components.
- If `recharts` can't accept CSS variable strings for colors in your build, read token values at mount and pass hex strings to the `fill`/`stroke` props.

Sample implementation sketch (high-level)

```jsx
<Card className="p-4 bg-[var(--bg-surface)] shadow-card rounded-md">
	<Header title="Attendance Trend">
		<SeriesToggles />
		<ModeSwitch />
		<ExportButton />
	</Header>
	<ResponsiveContainer width="100%" height={height}>
		<AreaChart data={data} stackOffset={mode==='percent'? 'expand' : undefined}>
			<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} />
			<XAxis dataKey="x" />
			<YAxis />
			<Tooltip />
			<Area dataKey="present" stackId="a" stroke={primary} fill={primary} />
			<Area dataKey="absent" stackId="a" stroke={danger} fill={danger} />
			<Area dataKey="excused" stackId="a" stroke={excused} fill={excused} />
			<Brush dataKey="x" />
		</AreaChart>
	</ResponsiveContainer>
</Card>
```

Data wiring & recommended API shape
- Endpoint: `GET /api/attendance/trend?start=&end=&granularity=hour|day|week&area=`.
- Recommended response:

```json
{
	"start": "2026-04-01T00:00:00Z",
	"end": "2026-04-18T23:59:59Z",
	"granularity": "day",
	"series": [
		{ "x": "2026-04-01", "present": 320, "absent": 90, "excused": 10 },
		{ "x": "2026-04-02", "present": 330, "absent": 85, "excused": 12 }
	],
	"meta": { "units": "count" }
}
```

Hook contract (`useAttendanceTrend`)
- Usage: `const { data, loading, error, refetch } = useAttendanceTrend({ start, end, granularity, area, autoRefresh })`.
- Implementation notes:
	- Use `client/src/api/fetchClient.js` for requests.
	- Provide an `autoRefresh` option (seconds) and efficiently patch `data.series` on websocket `attendance.updated` events rather than re-fetching whole ranges.
	- Expose a `transform` hook option to convert counts to percentages for `mode='percent'`.

Implementation details & edge cases
- Downsampling: when `series.length > 500`, downsample to a 300–500 point set (simple largest-triangle-three-buckets or uniform sampling) to keep rendering performant.
- Timezones: accept UTC timestamps; display x-axis labels in local timezone with `Intl.DateTimeFormat` and label the axis with the timezone abbreviation.
- Empty data: show a friendly empty state card with guidance (e.g., "No attendance data for selected range").
- Large ranges: default `granularity` to `day` for ranges > 30 days; allow user to switch to `percent` to see composition.

Accessibility
- Provide `aria-label` summarizing the chart like: "Attendance trend from April 1 to April 18 showing present, absent and excused counts".
- Ensure legend controls are reachable via keyboard and work with Enter/Space.
- Supply a visually-hidden textual summary of data points and the latest values for screen readers.

Testing & QA
- Unit tests: verify the transform logic (counts -> percent), ensure brush emits correct ranges, assert series toggle updates rendering props.
- Storybook: stories for `default`, `percent-mode`, `empty-data`, `long-range-downsampled`.
- Visual regression: snapshot stories at mobile/tablet/desktop widths; ensure colors match tokens.

Performance
- Memoize transformed series and color lookups with `useMemo`.
- Throttle realtime patches (e.g., coalesce updates every 1s) to avoid re-render storms.

Acceptance criteria
- `AttendanceTrendChart` renders stacked series for present/absent/excused and matches the app's token-driven visual language.
- Supports granularity controls, series toggles, brush zoom and tooltip with counts and percentages.
- Uses `client/src/api/fetchClient.js` and respects `autoRefresh` or websocket patching.
- Accessible (aria labels, keyboard toggles) and passes `axe` checks in stories.

Deliverables
- `client/src/components/AttendanceTrendChart.jsx` (component).  
- `client/src/hooks/useAttendanceTrend.js` (data hook).  
- Test and story files.  
- API contract example (in this doc).

Estimated effort (rough)
- Doc + component scaffold: 0.5 day.  
- Hook + basic wiring to mock endpoint: 0.25–0.5 day.  
- Tests & stories: 0.25 day.  
- Polishing, accessibility & perf: 0.25–0.5 day.

Next steps (recommended)
1. I can scaffold `AttendanceTrendChart.jsx` and `useAttendanceTrend.js` now (with a mocked endpoint).  
2. Add Storybook stories and snapshot tests.  
3. Wire to the real `GET /api/attendance/trend` backend or provide a small mock server if backend work is pending.

5. Donut/Gauge & Summary widgets
- `PresentDonut` to show present/absent/excused and a `StaffCoverageCard` with staffed vs required counts.

### Donut/Gauge & Summary widgets — Detailed implementation guide

Overview
- Two compact summary widgets for the dashboard right column: `PresentDonut` (donut/pie or gauge visualizing present / absent / excused) and `StaffCoverageCard` (staffed vs required counts, coverage %, and suggested replacements). These widgets are snapshot views and must match the app's existing UI language via tokens in `client/src/index.css` and the Tailwind mappings — do not introduce hard-coded hex values or new visual primitives that break the established look.

Goals
- Provide an immediate distribution visual for attendance and a clear staffing coverage indicator with quick actions.
- Keep visuals compact, accessible, and theme-driven (tokens + Tailwind). Support drill-down interactions to the roster or detail drawers.

Scope — Files to add / update
- `client/src/components/PresentDonut.jsx` — donut/gauge component.
- `client/src/components/StaffCoverageCard.jsx` — summary card for staffing coverage and actions.
- `client/src/hooks/usePresentSummary.js` — data hook returning counts and percentages.
- `client/src/hooks/useCoverage.js` — data hook for staffing coverage and suggestions.
- Test and story files for both components.

Component contracts (props)
- `PresentDonut` props:
	- `present` (number), `absent` (number), `excused` (number)
	- `total` (number | optional; computed if omitted)
	- `size` (number, optional) — default `140`
	- `mode` (`'donut'|'gauge'`) — visual style
	- `showLegend` (boolean)
	- `onSegmentClick(segmentId)` — drill-down handler
	- `loading` (boolean)

- `StaffCoverageCard` props:
	- `staffed` (number), `required` (number)
	- `suggestions` (array<{id,name,role,available}>), optional
	- `onAssign(staffId)`, `onNotify(staffId)` — action handlers
	- `loading` (boolean)

Behavior & UX
- `PresentDonut`:
	- Center label shows either total or percent (e.g., "76% Present").
	- Hover tooltip shows counts and percentages per segment. Segments are clickable for drill-down.
	- For `mode='gauge'`, render a single arc representing present% with tick marks and a center value.

- `StaffCoverageCard`:
	- Show `staffed / required` numeric pair and a horizontal progress bar with rounded ends. Color the fill using semantic tokens: green (`--color-success`) when >=100%, orange when 80–99%, red when <80%.
	- When understaffed, show up to 3 suggested replacements with small CTA buttons (`Notify`, `Assign`).

Design & token usage
- Enforce token usage everywhere: `--bg-surface` for card background, `--elevation-2` for shadow, `--radius-md` for border-radius, `--text-primary` and `--text-muted` for labels. Segment colors must use `--color-primary`, `--color-danger`, `--color-excused`.
- If a charting library requires hex color strings, read tokens at runtime via `getComputedStyle(document.documentElement)` and pass hex values to the library — do not hard-code colors.

Recommended implementation
- Use `recharts` `PieChart` + `Pie` + `Cell` for `PresentDonut` (consistent with other charts). For gauge, configure `startAngle`/`endAngle` to draw a single arc.
- Implement `StaffCoverageCard` using simple div-based progress bar and a compact list for suggestions to keep bundle size small.

Sample `PresentDonut` sketch

```jsx
<div className="bg-[var(--bg-surface)] shadow-card rounded-md p-3">
	<div className="flex items-center gap-3">
		<div style={{width:size, height:size}}>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie data={data} dataKey="value" innerRadius={size*0.32} outerRadius={size*0.46} startAngle={90} endAngle={-270}>
						{data.map((d,i) => <Cell key={d.name} fill={colors[i]} />)}
					</Pie>
					<Tooltip formatter={(val) => formatNumber(val)} />
				</PieChart>
			</ResponsiveContainer>
		</div>
		<div className="flex-1">
			<div className="text-sm text-[var(--text-muted)]">Present</div>
			<div className="text-lg font-semibold text-[var(--ui-ink)]">{present} / {total}</div>
			<div className="text-xs text-[var(--text-muted)]">{presentPct}% present</div>
		</div>
	</div>
</div>
```

Data wiring & API shapes
- Prefer `GET /api/attendance/summary` to include present/absent/excused counts (the same summary endpoint used by KPIs). Example snippet: `{ presentSummary: { present:320, absent:90, excused:10, timestamp } }`.
- Coverage endpoint: `GET /api/coverage?start=&end=&area=` returns `{ staffed: 12, required: 15, suggestions: [{id,name,role,available}] }`.

Hook contracts
- `usePresentSummary({ start, end, area })` => `{ data: { present, absent, excused, total }, loading, error, refetch }`.
- `useCoverage({ start, end, area })` => `{ data: { staffed, required, suggestions }, loading, error, refetch }`.

Implementation details & edge cases
- If `total === 0`, show an empty state with help copy (e.g., "No attendance recorded for this range").
- Ensure tiny segments remain visible in legend/tooltips even if arc is too small; show exact values in tooltip.
- Debounce frequent realtime updates; coalesce updates every 500–1000ms to avoid re-render storms.

Accessibility
- Provide `aria-label` summarizing the donut (e.g., "76% present — 320 of 420 students").
- Make legend, suggestion actions and donut segments keyboard accessible; use `aria-live` for changes when a notification is sent.

Testing & QA
- Unit tests: verify counts -> segments mapping, percent calculations, click handlers and action flows.
- Stories: `default`, `understaffed`, `zero-data`, `gauge-mode` with visual snapshots.

Performance
- Memoize derived `data` arrays and color lookups. Render small DOM-only progress bars instead of heavy components for coverage to keep bundle small.

Acceptance criteria
- `PresentDonut` and `StaffCoverageCard` implemented and styled using token-driven classes.
- Donut segments clickable with correct tooltips and drill behavior.
- `StaffCoverageCard` shows progress, suggestions and action handlers; passes accessibility checks.

Deliverables
- `client/src/components/PresentDonut.jsx`  
- `client/src/components/StaffCoverageCard.jsx`  
- `client/src/hooks/usePresentSummary.js`  
- `client/src/hooks/useCoverage.js`  
- Test & story files for both components.

Estimated effort (rough)
- Scaffold + mock wiring: 0.25–0.5 day.  
- Tests & stories: 0.25 day.  
- Polishing & accessibility: 0.25 day.

Next steps (recommended)
1. I can scaffold `PresentDonut.jsx` and `usePresentSummary.js` with mocked data now.  
2. Add `StaffCoverageCard.jsx` and `useCoverage.js` and wire quick action handlers to demo mocks.  
3. Wire both widgets to real endpoints (or a mock server) and add stories.

6. Attendance heatmap / availability
- Heatmap component showing hour×day attendance density. Useful for identifying recurring problem windows.

### Attendance Heatmap / Availability — Detailed implementation guide

Overview
- `AttendanceHeatmap` visualizes attendance density across time-of-day and day-of-week (or a specified date range) as an hour×day matrix. Cells are colored by counts or percentages and surface recurring patterns (e.g., repeated absences at particular hours). Cells support drill-down to open roster slices or student lists filtered for that time window.

Goals
- Provide a compact, scannable matrix to identify problem windows quickly.
- Support multiple axes (hour×day, date×hour), timezone awareness, aggregation windows, and both percent and absolute modes.
- Strictly match the app's existing UI design language: use tokens from `client/src/index.css`, Tailwind mappings, spacing and radii. Do not change core UI primitives or hard-code colors.

Scope — Files to add / update
- `client/src/components/AttendanceHeatmap.jsx` — component implementation and lightweight styles.
- `client/src/hooks/useAttendanceHeatmap.js` — data hook using `client/src/api/fetchClient.js`.
- `client/src/components/AttendanceHeatmap.test.jsx` — unit tests for transforms and rendering.
- `client/src/components/AttendanceHeatmap.stories.jsx` — Storybook stories for week, multi-week, and edge cases.
- `client/tailwind.config.js` — ensure heatmap ramp uses `var(--*)` tokens.

Component contract (props)
- `start`, `end` (ISO string | Date | undefined) — range to visualize.
- `granularity` (`'hour'|'day'`) — aggregation unit (default `'hour'`).
- `timezone` (string | undefined) — e.g., `UTC` or `Asia/Kolkata`; default `UTC`.
- `mode` (`'count'|'percent'`) — color by absolute counts or percent of present.
- `area` (string | undefined) — campus/area filter.
- `onCellClick({ xLabel, yLabel, count, start, end })` — drill handler.
- `height`, `width` (number | optional) — layout hints for responsiveness.
- `loading` (boolean).

Behavior & UX
- X axis: days (Mon–Sun) or date labels when range > 14 days. Y axis: hourly buckets (00:00–23:00) or custom buckets.
- Color ramp: use `--heatmap-low`, `--heatmap-mid`, `--heatmap-high` with a perceptually uniform interpolation (avoid hard-coded hexes).
- Tooltip: on hover show exact count, percent, and a link/button to open the roster filtered for the cell's time window.
- Click: `onCellClick` triggers a drawer or roster view pre-filtered for that cell.
- Keyboard: arrow-key navigation across cells, Enter to activate; focus visuals use token-driven outlines.
- Legend: compact legend with numeric stops and ability to switch between linear/log scaling.

Design & token usage
- Card shell: `background: var(--bg-surface); box-shadow: var(--elevation-2); border-radius: var(--radius-md); padding: var(--space-4)`.
- Axis labels and captions: `--text-primary` and `--text-muted`.
- Heatmap colors: `--heatmap-low`, `--heatmap-mid`, `--heatmap-high` (fallback to `--color-primary` for high intensity).
- If a rendering library requires hex values, read tokens at runtime via `getComputedStyle(document.documentElement)` and pass computed hexes.

Recommended implementation & libraries
- Lightweight approach: render an SVG grid of `<rect>` elements; this is easy to control, accessible, and performs well for typical dashboard sizes.
- For very large matrices (>3000 cells) consider a Canvas fallback or server-side aggregation to larger buckets (e.g., 3-hour buckets).
- Prefer a custom SVG solution over adding a heavy dependency just for heatmaps. Use `d3-scale` color interpolation if needed (small dependency).

Sample implementation sketch (high-level)

```jsx
<Card className="bg-[var(--bg-surface)] shadow-card rounded-md p-3">
	<Header title="Attendance Heatmap">
		<Controls granularityToggle timezoneSelector />
		<Legend />
	</Header>
	<div className="overflow-auto">
		<svg width={computedWidth} height={computedHeight} role="img" aria-label={ariaLabel}>
			{matrix.map((row,y) => row.map((value,x) => (
				<rect
					key={`cell-${x}-${y}`}
					x={x*cellW} y={y*cellH} width={cellW} height={cellH}
					fill={colorScale(value)}
					onMouseEnter={(e) => showTooltip(...)}
					onClick={() => onCellClick({ xLabel, yLabel, count: value, start, end })}
					role="button"
					tabIndex={0}
				/>
			)))}
		</svg>
	</div>
</Card>
```

Data wiring & recommended API shape
- Endpoint: `GET /api/attendance/heatmap?start=&end=&granularity=hour&area=&tz=`.
- Recommended response:

```json
{
	"start":"2026-04-01T00:00:00Z",
	"end":"2026-04-07T23:59:59Z",
	"granularity":"hour",
	"xLabels":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
	"yLabels":["00:00","01:00",...,"23:00"],
	"matrix":[
		[12,8,5,...],
		[9,7,6,...],
		...
	],
	"meta":{ "max":45, "units":"count" }
}
```

Hook contract (`useAttendanceHeatmap`)
- `const { data, loading, error, refetch } = useAttendanceHeatmap({ start, end, granularity, area, timezone })` where `data` contains `xLabels`, `yLabels`, `matrix`, `meta`.
- Implementation notes: use `client/src/api/fetchClient.js`; provide caching and options `autoRefresh` and `realtimePatch` to apply socket updates incrementally.

Implementation details & edge cases
- Timezones & DST: prefer server-side bucketing into requested timezone; if client-side bucketing is necessary, use consistent `Intl.DateTimeFormat` logic.
- Empty data: render an empty-state with help text (e.g., "No attendance recorded for this range").
- Tiny values: ensure minimal visual differentiation for very small counts by adjusting colorScale mapping; always show exact values in tooltip.
- Large ranges: aggregate or downsample on server to keep client rendering responsive.

Accessibility
- SVG should include `role="img"` and `aria-label`. Each interactive cell must include `aria-label` like "Mon 09:00 — 12 present (28%)" and be keyboard-focusable.
- Provide a visually-hidden summary table for screen readers listing top 3 peak windows and averages.

Testing & QA
- Unit tests: validate matrix transforms and colorScale outputs, keyboard navigation and `onCellClick` behavior.
- Storybook: stories for `week`, `multi-week`, `empty-range`, and `dst-transition` cases with snapshots.

Performance
- Memoize matrix and color computations. Throttle mousemove events used by tooltips and batch realtime patches.
- For very large matrices (>3000 rects), render to Canvas or reduce resolution via server aggregation.

Acceptance criteria
- `AttendanceHeatmap` renders an hour×day matrix using tokens for styling and is interactive (hover tooltip, click drill, keyboard nav).
- Hook `useAttendanceHeatmap` returns matrix data matching API contract and supports `autoRefresh`/`realtimePatch`.
- Component has unit tests and stories and passes accessibility checks.

Deliverables
- `client/src/components/AttendanceHeatmap.jsx`  
- `client/src/hooks/useAttendanceHeatmap.js`  
- Test & story files  
- API contract example (documented here).

Estimated effort (rough)
- Doc + component scaffold: 0.5 day.  
- Hook + mock wiring: 0.25 day.  
- Tests & stories: 0.25 day.  
- Canvas fallback & perf tuning (if required): 0.5 day.

Next steps (recommended)
1. I can scaffold `AttendanceHeatmap.jsx` and `useAttendanceHeatmap.js` with mocked data now.  
2. Add Storybook stories and snapshot tests.  
3. If large ranges are needed, add a Canvas fallback and/or server aggregation.

7. Roster / Attendance table
- Implement `AttendanceTable` with student rows, daily status cells (green/red/dash), search, and inline bulk actions (mark excused, message). Add sparklines per row for 14-day trend.

### Roster / Attendance table — Detailed implementation guide

Overview
- `AttendanceTable` is the primary roster grid for the dashboard. It displays students (or staff) as rows and their daily status for a selected date range. It must behave like an enterprise table: server-side pagination, sorting, column-level filtering, bulk actions, row drill-down, and sparklines for recent history. The component must use the project's token-driven UI (do not modify core UI tokens or hard-code colors) and match responsive/accessible patterns used elsewhere in the app.

Goals
- Provide a fast, keyboard-accessible, and filterable roster that works with large data sets.
- Enable inline and bulk actions (mark excused, message) and quick drill-down to `StudentDetailDrawer`.
- Keep visual styling consistent via `client/src/index.css` tokens and Tailwind mapping.

Scope — Files to add / update
- `client/src/components/AttendanceTable.jsx` — component with table, filters toolbar, and pagination controls.
- `client/src/components/AttendanceTableRow.jsx` — optional row component for separation of concerns.
- `client/src/components/AttendanceSparklines.jsx` — tiny sparkline used per row (14-day).
- `client/src/hooks/useAttendanceList.js` — data hook for list fetching and bulk actions.
- `client/src/components/AttendanceTable.test.jsx` and stories.
- Integrations: wire to `StudentDetailDrawer` (existing component) for row drill-down.

Component contract (props)
- `start`, `end` (Date|ISO string) — date range shown in the table.
- `page`, `limit` (number) — pagination controls (server-side).
- `filters` (object) — column filters (q, status, floor, room, tags).
- `sort` (object) — `{ column, direction }`.
- `onRowClick(studentId)` — open detail drawer.
- `onBulkAction(action, ids)` — optional callback for parent to handle bulk actions.
- `loading` (boolean) — show skeletons when true.

Behavior & UX
- Server-side pagination & sorting: request only visible page and sort criteria; show a compact pagination control with page size selector.
- Column types: student name (clickable), room, status cells for each day in range (green=present, red=absent, amber=excused/different color token), last-seen time, actions.
- Status cells: small pill/circle per day with `aria-label` like "Present — 2026-04-18"; use token colors (`--color-success`, `--color-danger`, `--color-excused`).
- Row sparklines: 14-point inline sparkline rendered as small SVG (40×12); click on sparkline or status to open row drill.
- Bulk actions toolbar: select rows (checkbox), then actions menu: `Mark Excused`, `Send Message`, `Export Selected`.
- Row virtualisation: for lists > 100 rows use `react-window` to virtualize to maintain perf.
- Filters toolbar: quick search (`q`), status filter, room/floor filter, date range picker. Debounce input (300ms).
- Inline editing: small confirm dialog for `Mark Excused` action with optional reason and audit note.

Data wiring & recommended API shape
- Primary endpoint: `GET /api/attendance/list?start=&end=&page=&limit=&q=&status=&sortColumn=&sortDir=&area=` returns paginated rows and per-row sparklines.
- Recommended response shape:

```json
{
	"page": 1,
	"limit": 50,
	"total": 1245,
	"rows": [
		{
			"studentId": "s_123",
			"name": "Alice Kumar",
			"room": "101",
			"lastSeen": "2026-04-18T08:23:00Z",
			"statusCells": ["P","P","A","P",...],
			"sparkline": [1,1,0,1,1,1,1,1,0,1,1,1,1,1]
		}
	]
}
```

- Bulk action endpoint: `POST /api/attendance/bulk` with payload `{ action: "mark_excused", ids: [...], reason: "" }` returns audit entries.
- Single update: `PUT /api/attendance/:id` for inline updates (requires audit log server-side).

Hook contract (`useAttendanceList`)
- `const { data, loading, error, fetchPage, markExcused, sendMessage } = useAttendanceList({ start, end, page, limit, filters, sort })`.
- Implementation notes: use `client/src/api/fetchClient.js` for requests; provide optimistic UI for bulk updates and a clear rollback path on error; return audit info from bulk action responses.

Implementation details & edge cases
- Virtualization + sticky columns: virtualize only the rows; keep the student name and actions columns sticky to preserve context while horizontal scrolling dates.
- Date range width: cap displayed days by default (e.g., max 31 columns) and provide a "condensed" mode for very wide ranges (group days into weekly summaries).
- Accessibility: implement table with `<table>` semantics for smaller datasets; when virtualized, ensure aria attributes, focus management, and keyboard navigation are maintained (use `react-aria` patterns or custom focus management).
- Audit trail: every bulk/single action must create server-side audit logs; display a success toast with a link to the audit entry when available.

Accessibility
- Use real table semantics where possible; for virtualization, expose accessible names via `aria-rowindex` and `aria-colindex` and maintain focus order.
- Provide `aria-live` region for bulk action results and unobtrusive announcements when rows change state.

Testing & QA
- Unit tests: data transforms, sparkline rendering, status cell mapping, bulk action handlers (success + failure rollback).
- Integration tests: pagination + filters + sorting flows against a mock API.
- Visual tests: snapshot stories for default, empty, filtered, and wide-range views.

Performance
- Debounce user inputs; cache row sparklines separately to avoid re-fetching on pagination changes.
- Limit DOM columns by default; aggregate columns when range > 31 days.

Acceptance criteria
- `AttendanceTable` supports server-side pagination, sorting, filtering and bulk actions.  
- Rows show daily status cells with token-driven colors and 14-day sparklines.  
- Table is keyboard accessible, virtualized for large lists, and uses `fetchClient.js` for network calls.

Deliverables
- `client/src/components/AttendanceTable.jsx`  
- `client/src/components/AttendanceTableRow.jsx`  
- `client/src/components/AttendanceSparklines.jsx`  
- `client/src/hooks/useAttendanceList.js`  
- Tests & story files.

Estimated effort (rough)
- Scaffold + hook + mock wiring: 0.5–1 day.  
- Virtualization + sticky columns: 0.5 day.  
- Tests & stories: 0.5 day.  
- Audit integration & polishing: 0.5 day.

Next steps (recommended)
1. I can scaffold `AttendanceTable.jsx` and `useAttendanceList.js` with mocked data and basic pagination now.  
2. Add virtualization, row sparklines and bulk action wiring.  
3. Wire bulk action APIs and add audit log display.

8. Student slide-over detail
- Clicking a student opens `StudentDetailDrawer` showing profile, attendance history, leaves, tickets and audit trail.

### Student slide-over detail — Detailed implementation guide

Overview
- `StudentDetailDrawer` is a right-anchored slide-over that surfaces everything an admin or staff member needs about one student: profile, contact info, attendance history, leave requests, tickets/repairs, and a chronological audit trail of actions. The drawer must render immediately with minimal profile data and progressively load heavier sections (attendance history, tickets, audit) on demand.

Goals
- Provide a fast, focused detail view for drill-down from the roster.  
- Keep interactions accessible and keyboard-friendly (focus trap, close with Esc).  
- Preserve the app's visual language by using tokens from `client/src/index.css` (do not hard-code colors or override core UI tokens).

Scope — Files to add / update
- `client/src/components/StudentDetailDrawer.jsx` — main drawer component and layout.  
- `client/src/components/StudentProfilePanel.jsx` — compact profile + actions block.  
- `client/src/components/AttendanceHistory.jsx` — paginated attendance history + calendar/sparkline.  
- `client/src/components/LeavesList.jsx` — recent leave requests with status and actions.  
- `client/src/components/TicketsList.jsx` — maintenance/incident tickets for the student.  
- `client/src/components/AuditTrail.jsx` — chronological audit entries with paging/filter.  
- `client/src/hooks/useStudentDetail.js` — composite hook that fetches profile and lazily loads children.  
- Tests & stories for each component.

Component contract (props)
- `studentId` (string): id to fetch.  
- `open` (boolean): whether drawer is open.  
- `onClose()` (fn): close handler.  
- `initialTab` (string|optional): open drawer on a specific tab (`overview|attendance|leaves|tickets|audit`).

Behavior & UX
- Fast initial render: fetch profile and summary counts (attendance last 7 days, open leaves, open tickets) to populate header.  
- Lazy load: fetch `attendanceHistory`, `leaves`, `tickets`, and `audit` only when their tab becomes active.  
- Actions: allow `Mark Excused` for a day, `Approve/Reject` leave (if permitted), `Message Student` (open composer), and `Add Audit Note`.  
- Offline/queued actions: queue actions locally (PWA) and sync when online; surface sync state in the drawer header.  
- Close & focus: trap focus while open and restore focus to triggering element on close. Use existing `Modal.jsx` patterns where possible.

Design & token usage
- Shell: `background: var(--bg-surface); box-shadow: var(--elevation-2); border-radius: var(--radius-md);`  
- Header: `--color-primary` accents for title and primary CTAs; secondary text uses `--text-muted`.  
- Status chips and badges: use `--color-success`, `--color-danger`, `--color-excused`.  
- Keep typography, spacing and radii consistent with other dashboard cards via the token set in `client/src/index.css`.

Data wiring & recommended API shapes
- Profile: `GET /api/students/:id` → `{ id, name, photoUrl, contact, room, roll, extraFields }`.  
- Attendance history (paginated): `GET /api/attendance/history?studentId=:id&start=&end&page=&limit=` → returns rows with date,status,notes.  
- Leaves: `GET /api/leaves?studentId=:id` and `PUT /api/leaves/:id/approve` / `:reject`.  
- Tickets: `GET /api/tickets?studentId=:id` and `POST /api/tickets/:id/comment` / `PATCH` for status.  
- Audit: `GET /api/audit?entity=student&id=:id&page=&limit=` → entries `{ actorId, actorName, action, createdAt, details }`.

Hook contract (`useStudentDetail`)
- `const { profile, summary, loading, error, fetchTabData } = useStudentDetail(studentId, { preloadTabs: ['overview'] })`  
- `fetchTabData(tabName)` loads data for a specific tab (attendance, leaves, tickets, audit).  
- Implementation note: use `client/src/api/fetchClient.js` for calls and cache tab results to avoid refetching while drawer remains open.

Implementation details & edge cases
- Permissions: hide/disable actions/users/fields depending on the current user's roles (use existing auth/context middleware). Respect privacy-only fields.  
- Large audit lists: paginate and allow filtering (actor, action type, date range).  
- Timezone: display timestamps in the user's local timezone; always store & transfer UTC on the API.  
- Photo & attachments: lazily load large media and display placeholders; show download links routed through signed URLs (S3).  
- Optimistic updates: when approving a leave or marking excused, optimistically update UI and create an audit entry; rollback if server fails and show error toast.

Accessibility
- Focus trap while open; `aria-labelledby` for the drawer title; `aria-describedby` for brief summary.  
- Ensure tab order is logical and all action buttons have accessible labels.  
- Provide keyboard shortcuts for common actions (e.g., `M` to message, `E` to mark excused) with discoverable hints.

Testing & QA
- Unit tests: component rendering, tab lazy-loading, action handlers and optimistic updates.  
- Integration tests: open drawer from a row, perform `Mark Excused`/`Message Student` flows against mock API.  
- Accessibility tests: run `axe` on stories (overview + attendance + audit).  

Performance
- Lazy-load heavy tab data and attachments. Cache tab results for the drawer session. Batch audit/tooltips updates and throttle UI updates from realtime events.  

Acceptance criteria
- `StudentDetailDrawer` opens from the roster and shows profile + header summary quickly.  
- Tabs load lazily and can be refreshed independently.  
- Actions (mark excused, message, leave approve/reject) work with optimistic updates and create audit entries.  
- Drawer follows token-driven styling and passes accessibility checks.

Deliverables
- `client/src/components/StudentDetailDrawer.jsx`  
- `client/src/components/StudentProfilePanel.jsx`  
- `client/src/components/AttendanceHistory.jsx`  
- `client/src/components/LeavesList.jsx`  
- `client/src/components/TicketsList.jsx`  
- `client/src/components/AuditTrail.jsx`  
- `client/src/hooks/useStudentDetail.js`  
- Tests & story files.

Estimated effort (rough)
- Doc + component scaffold: 0.5 day.  
- Tabbed data hooks + lazy loading: 0.5 day.  
- Actions + audit integration: 0.5 day.  
- Tests & accessibility: 0.25–0.5 day.

Next steps (recommended)
1. I can scaffold `StudentDetailDrawer.jsx` and `useStudentDetail.js` with mocked data now.  
2. Add tabs and lazy-load hooks, then wire a small message composer for sending quick messages.  
3. Integrate audit-log creation on actions and add stories.

9. Alerts & incidents feed
- `CoverageAlertsPanel` showing active coverage alerts (link to coverage page) and recent incidents affecting attendance.

### Alerts & incidents feed — Detailed implementation guide

Overview
- `CoverageAlertsPanel` is a compact, real-time alert stream that surfaces active coverage issues (understaffed shifts, missed clock-ins), incidents (security, maintenance, attendance spikes) and actionable items. It sits in the dashboard's right column and must match the app's existing UI language (tokens in `client/src/index.css`) and interaction patterns.

Goals
- Surface high-priority operational alerts with quick actions (Acknowledge, Snooze, Escalate, Open) and links to the full coverage page.
- Provide clear severity, area, time, and related entity info; support grouping, filtering, and paging for larger feeds.
- Integrate with websocket events for realtime updates and with the audit system for traceability. Must not introduce hard-coded color values — use tokens.

Scope — Files to add / update
- `client/src/components/CoverageAlertsPanel.jsx` — main panel UI and item list.  
- `client/src/components/AlertItem.jsx` — small list item with severity, message and action buttons.  
- `client/src/hooks/useCoverageAlerts.js` — hook for fetching active alerts and subscribing to websocket events.  
- `client/src/hooks/useAckAlert.js` — helper hook for acknowledge/snooze/escalate actions.  
- `client/src/components/CoverageAlertsPanel.test.jsx` and `.stories.jsx` — tests & stories.

Component contract (props)
- `area` (string|optional): scope filter.  
- `limit` (number|optional): how many alerts to show (default 10).  
- `showResolved` (boolean|optional): whether to include resolved incidents.  
- `onOpenCoverage()` (fn): handler to open the full coverage page or view.  
- `autoRefresh` (boolean|number): poll interval or false; websocket primary.

Behavior & UX
- Ordering: show active/high-severity alerts first; show a small severity badge (P0/P1/P2) with accessible label.
- Actions per item: `Acknowledge`, `Snooze (1h/4h/day)`, `Escalate` (opens modal), and `Open` (drill into incident or roster).  
- Grouping: optionally group multiple alerts for the same area/entity (e.g., repeated missed check-ins for Room 101) with a summary entry that expands to item list.  
- Overflow: when >limit alerts exist show "View all alerts" linking to the coverage page.  
- Realtime: subscribe to `alert.created`, `alert.updated`, `alert.resolved` websocket events and patch local state; show a subtle badge animation for new alerts.

Design & token usage
- Use tokens for all visual styles: background `--bg-surface`, text `--text-primary`/`--text-muted`, severity color mapping (`--color-danger` for critical, `--color-accent` or `--color-primary` for warnings/infos).  
- Badge & severity: map P0->`--color-danger`, P1->`--color-accent`, P2->`--color-primary` and use a small pill with `border-radius: var(--radius-sm)`.  
- Keep spacing and typography consistent with other dashboard cards via `--space-*` and `--radius-*` tokens.

Data wiring & recommended API shapes
- Primary endpoint: `GET /api/alerts/active?area=&limit=` returns active alerts (paginated).  
- Example alert object:

```json
{
	"id": "alert_123",
	"type": "coverage",
	"severity": "P0",
	"area": "Floor 1",
	"message": "Understaffed: 2 required, 0 on duty",
	"related": { "entity": "roster", "id": "roster_2026_04_19" },
	"createdAt": "2026-04-19T08:15:00Z",
	"acknowledged": false
}
```

- Actions endpoints:
	- `POST /api/alerts/:id/ack` → acknowledge alert (creates audit entry).  
	- `POST /api/alerts/:id/snooze` { duration } → snooze.  
	- `POST /api/alerts/:id/escalate` { toRole } → escalate and notify.

Realtime contract
- Websocket events to subscribe:
	- `alert.created` — payload: alert object.  
	- `alert.updated` — payload: partial update.  
	- `alert.resolved` — payload: { id, resolvedAt }.

Hook contract (`useCoverageAlerts`)
- `const { data, loading, error, ack, snooze, escalate, refetch } = useCoverageAlerts({ area, limit, autoRefresh })`.
- Implementation notes: use `client/src/api/fetchClient.js` for REST calls and the existing websocket helper to subscribe. Provide optimistic UI for ack/snooze with rollback on error and create audit entries on success.

Implementation details & edge cases
- Burst handling: coalesce incoming websocket events and batch state updates (e.g., group new alerts over 500ms) to avoid UI thrash.  
- Duplicate alerts: de-duplicate by `related.entity + related.id + type` with a short TTL to avoid repeated items.  
- Offline: show cached alerts and mark realtime state as stale; queue ack/snooze actions when offline and sync on reconnect.

Accessibility
- Each alert item must be keyboard-focusable and expose a full `aria-label` (e.g., "P0 Understaffed: Floor 1, 2 required, 0 on duty, reported 8:15 AM").  
- Provide an `aria-live` polite region for new high-priority alerts and visually-hidden counts for screen readers.

Testing & QA
- Unit tests: action handlers, optimistic update rollback, grouping logic and color mapping.  
- Stories: `default`, `many-alerts`, `grouped`, `offline-mode`, `action-failure` with snapshots.  

Performance
- Memoize rendered lists; use windowing/virtualization if the panel needs to display many items.  
- Keep alert payloads minimal in the UI stream; fetch full incident detail only on drill/open.

Acceptance criteria
- `CoverageAlertsPanel` renders active alerts with correct severity coloring and tokens.  
- Action buttons (Acknowledge/Snooze/Escalate/Open) work and create audit entries.  
- Panel receives realtime updates via websocket and coalesces bursts.  
- Components pass accessibility checks and have unit tests & stories.

Deliverables
- `client/src/components/CoverageAlertsPanel.jsx`  
- `client/src/components/AlertItem.jsx`  
- `client/src/hooks/useCoverageAlerts.js`  
- `client/src/hooks/useAckAlert.js`  
- Tests & story files.  

Estimated effort (rough)
- Doc + scaffold: 0.25–0.5 day.  
- Hook + websocket wiring: 0.25–0.5 day.  
- Tests & stories: 0.25 day.  
- Polishing & accessibility fixes: 0.25 day.

Next steps (recommended)
1. I can scaffold `CoverageAlertsPanel.jsx` and `useCoverageAlerts.js` (mock websocket + mock REST) now.  
2. Add action hooks (`useAckAlert`) and wire optimistic updates with audit creation.  
3. Add stories & accessibility tests.

10. Exports & scheduling
- Add Export button for CSV/PDF of current filtered view and a scheduled reports panel (uses export_jobs API).

### Exports & scheduling — Detailed implementation guide

Overview
- Provide ad-hoc exports (CSV/PDF) of the current filtered view (attendance, roster, reports) and support scheduled recurring reports delivered via signed download links and optional email. Implement a resilient background `export_jobs` pattern (enqueue, worker, store, notify) and a small UI for scheduling, running and managing reports. All UI must use the canonical tokens in `client/src/index.css` and follow existing layout/spacing/radius rules.

Goals
- Fast ad-hoc exports from any filtered list or chart.  
- Scheduled reports with cron-like recurrence, next-run preview, and `Run now` action.  
- Background worker that streams large datasets to object storage (S3), produces signed download URLs, and cleans up old exports on a retention schedule.  
- RBAC and audit trail for every export request and download.

Scope — Files to add / update
- Client:
	- `client/src/components/ExportButton.jsx` — small button + menu for CSV/PDF and export options.  
	- `client/src/components/ScheduledReportsPanel.jsx` — list/manage scheduled reports and a `Run now` control.  
	- `client/src/hooks/useExportJobs.js` — create job, poll status, cancel.  
	- `client/src/hooks/useScheduledReports.js` — CRUD scheduled reports.  
- Server:
	- Migration: `server/migrations/003_add_export_jobs_table.sql` (or next number).  
	- `server/src/controllers/exportController.js` — endpoints for creating/listing/canceling jobs.  
	- `server/src/routes/exportRouter.js` — routes mounted at `/api/export_jobs`.  
	- Worker: `server/src/workers/exportWorker.js` — background job processor (Bull/Agenda).  
	- `server/src/utils/exporters/` — CSV and PDF exporter helpers (streaming-friendly).

Database & migration (recommended schema)
- Table `export_jobs` (columns): `id (uuid)`, `user_id`, `type` (csv|pdf), `params jsonb`, `status` (queued|processing|completed|failed|cancelled), `s3_key`, `filename`, `content_type`, `size`, `error text`, `created_at`, `started_at`, `completed_at`, `scheduled_at` (nullable), `cron_expr` (nullable), `attempts int`.
- Create an index on `user_id` and `status` for fast listing.

API contracts
- Create job:
	- `POST /api/export_jobs` { format: 'csv'|'pdf', filename, params: {...}, notify: boolean, schedule?: { cron, tz } } → 201 `{ id, status }`
- Get job status / result:
	- `GET /api/export_jobs/:id` → `{ id, status, downloadUrl?, filename, expiresAt?, error?, createdAt, startedAt, completedAt }`
- List jobs:
	- `GET /api/export_jobs?userId=&status=&limit=&page=` → paginated list.
- Cancel job:
	- `POST /api/export_jobs/:id/cancel` → 200.

Background worker pattern
- Use a queue (Bull recommended for Redis-backed reliability). Worker flow:
	1. Pop job from queue, set `status=processing`, `started_at`.  
	2. Stream query results (from DB) to exporter (CSV stringify or render HTML→PDF). For large exports, stream multipart upload directly to S3 to avoid local disk.  
	3. On success, save S3 key, set `status=completed`, `completed_at`, and notify user (email/in-app) with signed URL.  
	4. On failure, increment attempts, set status `failed` when attempts exhausted, record `error`. Retry/backoff policy configurable.
- Scheduled reports: scheduler service (cron runner or use Bull's repeatable jobs) enqueues jobs at schedule times and records `next_run` metadata.

Storage & download security
- Store files in object storage `exports/{jobId}/{filename}` and generate signed download URLs that expire (e.g., 24h). Optionally provide short-lived token endpoints that validate the user's session before redirecting to S3 signed URL.
- Enforce access controls: only the requesting user (or admins) can access the download.

Client UX & contracts
- `ExportButton.jsx` (props: `{ query, filenamePrefix, defaultFormat='csv' }`):
	- Opens menu: `Download now (CSV)`, `Download now (PDF)`, `Schedule report`.  
	- On `Download now`, POST `/api/export_jobs` with `notify=false`; poll `GET /api/export_jobs/:id` for `status` and present `downloadUrl` when ready. Show progress and use token-driven UI tokens.
- `ScheduledReportsPanel.jsx`:
	- Lists scheduled reports with `name`, `nextRun`, `lastRun`, `status`, `owner`. Actions: `Edit`, `Run now`, `Disable`, `Delete`. Use `useScheduledReports` hook and token-driven styles.
- Hooks:
	- `useExportJobs` → `{ createJob, getJob, listJobs, cancelJob, pollJob }`. Use `fetchClient.js`.
	- `useScheduledReports` → `{ list, create, update, delete, runNow }`.

Notifications & audit
- Create an audit entry for every export creation and result download (store actor, job id, params).  
- Optional: send email with signed download link when `notify=true` using configured mail adapter (SendGrid/Twilio gateway pattern).

Retention & cleanup
- Implement a cleanup job to delete S3 objects and mark jobs `archived` after `EXPORT_RETENTION_DAYS` (configurable; e.g., 30 days). Provide an admin endpoint for immediate purge.

Edge cases & considerations
- Large datasets: stream to S3, avoid buffering large data in memory. For PDF generation, prefer server-side templates and headless renderer with streaming to S3 if possible. Consider splitting very large exports into chunks and zipping.  
- Query safety: sanitize/validate `params` server-side; avoid allowing free-form SQL from clients. Use parametrized query builders or pre-approved report templates.  
- Offline UX: for slow exports, provide clear queued/processing states and allow users to continue using app; show notification when ready.

Accessibility & tokens
- Use `--bg-surface`, `--text-primary`, `--color-primary` and other tokens for buttons, lists and dialogs. Keep spacing and radii matching other dashboard patterns. Do not change core UI tokens in this flow.

Deliverables
- `client/src/components/ExportButton.jsx`  
- `client/src/components/ScheduledReportsPanel.jsx`  
- `client/src/hooks/useExportJobs.js`  
- `client/src/hooks/useScheduledReports.js`  
- `server/migrations/003_add_export_jobs_table.sql`  
- `server/src/controllers/exportController.js` + `server/src/routes/exportRouter.js`  
- `server/src/workers/exportWorker.js` + exporter utils  
- Tests & stories (button, scheduled panel, job polling)

Acceptance criteria
- Users can download ad-hoc CSV/PDF exports of the current filtered view.  
- Users can create scheduled reports and the system enqueues and runs them at the scheduled times.  
- Generated exports are stored securely, downloadable via signed URLs, and cleaned up per retention policy.  
- UI is token-driven and matches existing theme; server creates audit entries for requests and downloads.

Estimated effort (rough)
- Doc + scaffold: 0.25–0.5 day.  
- Worker + streaming export implementation: 0.5–1 day.  
- Scheduled reports UI + cron wiring: 0.5 day.  
- Tests, retention & security hardening: 0.5 day.

Next steps (recommended)
1. I can scaffold `ExportButton.jsx`, `ScheduledReportsPanel.jsx`, and `useExportJobs.js` with a mock REST backend now.  
2. Add server migration and a simple `POST /api/export_jobs` that enqueues a mock job (worker returns a canned CSV).  
3. Wire S3 signed URLs and scheduled repeatable jobs.

**UI consistency note**
- Keep the theme/UI tokens unchanged. If you must change a core UI primitive (tokens, major Tailwind mappings, or shared layout components), record those changes here (between tasks 10 and 11) with the file paths and a short rationale so the team can review and revert if needed.

11. Realtime updates
- Wire websocket updates for live attendance events, alert creation, and message counters (Socket.io or WebSocket bridge).

### Realtime updates — Detailed implementation guide

Overview
- Provide a robust realtime layer (Socket.io or WebSocket bridge) for low-latency delivery of attendance events, alerts and message counters. Implement client-side subscription helpers, a server-side emitter with authorization checks, and fallbacks for missed events. All UI produced for realtime flows must use the canonical tokens in `client/src/index.css` and must not alter core theme tokens without an explicit recorded rationale (see UI consistency note below).

Goals
- Deliver near-real-time updates for: `attendance.updated`, `alert.created|updated|resolved`, `message.unread_count`, and operational events (shift changes, task verification).  Provide reconnection/backoff, per-user/area scoping, and burst coalescing to avoid UI thrash.

Scope — Files to add / update
- Client:
	- `client/src/contexts/RealtimeProvider.jsx` — socket lifecycle, auth handshake, and context provider.
	- `client/src/hooks/useSocket.js` — low-level socket wrapper (connect, emit, subscribe, unsubscribe).
	- `client/src/hooks/useAttendanceSocket.js`, `useAlertsSocket.js`, `useMessageCounter.js` — domain subscriptions that call fetchClient when needed.
	- UI components that render live changes (e.g., `KpiCard`, `CoverageAlertsPanel`, `AttendanceTable`) should accept incremental patch updates from hooks and must apply token-driven styles.
- Server:
	- `server/src/socket.js` or integrate into `server/src/app.js` — initialize Socket.io, JWT auth middleware, and Redis adapter for scaling.
	- Emitters in controllers: emit on key actions (attendance created/updated, alert created/updated, message sent).
	- Optionally `server/src/services/realtimeService.js` to centralize event shapes and permission checks.

Event contracts (recommended shapes)
- `attendance.updated` — { id, studentId, status, timestamp, actorId, patch: { fields... } }
- `alert.created|alert.updated|alert.resolved` — full alert object (same shape as API) or minimal delta for updates.
- `message.unread_count` — { userId, conversationId?, unreadCount }
- `task.verification_scans` — { taskId, scans: [{ scannerId, timestamp, tokenId }] }

Security & authorization
- Authenticate socket connections via JWT in the handshake or a short-lived socket token issued from `POST /api/socket/token` (recommended). Validate permissions server-side before emitting events to a socket/room. Use rooms for area-scoped events (e.g., `area:floor:1`) and user-specific rooms (`user:{id}`). Never broadcast sensitive details; server must sanitize payloads per the recipient's RBAC.

Scaling & reliability
- For multi-instance setups use the `socket.io-redis` adapter (or equivalent) so emits propagate across nodes.  
- Apply rate-limiting and coalescing on high-frequency events (batch updates every 300–1000ms) server-side to reduce client thrash.  
- Persist critical events to DB and provide a small fallback endpoint `GET /api/events?since=` for clients to reconcile missed events during reconnect.

Client contracts & hook behavior
- `useSocket()` — manages connection, reconnection, and exposes `emit`, `on`, `off`, `connected`.  
- `useAttendanceSocket({ onPatch })` — subscribes to `attendance.updated` and calls `onPatch(patch)` with debounced updates; supports `subscribe(area)` and `unsubscribe(area)`.
- `useMessageCounter(userId)` — keeps unread counts in sync; exposes `unreadCount` and `markRead(conversationId)`.

Offline and reconnection handling
- Queue outgoing actions while offline and retry on reconnect (keep queue in memory/localStorage with bounded size).  
- On reconnect, fetch missed events via `GET /api/events?since=lastSeenAt` and apply them in chronological order to ensure state consistency.  

Monitoring & observability
- Track metrics: connection count, reconnection rate, event rates, dropped events, queue lengths.  
- Log auth failures and permission-denied emits for auditability.

Testing & QA
- Unit tests for hook reconnection logic, event de-duplication and coalescing.  
- Integration tests: run a local socket server and assert UI components update correctly.  
- Load tests for burst event handling and rate limiting.

Accessibility & UX
- For high-priority alerts surface an `aria-live` polite/assertive region with a concise human-readable summary.  
- Avoid unexpected focus shifts when new data arrives; animate subtle badges instead and provide an explicit keyboard-focusable list of recent events.

Deliverables
- `client/src/contexts/RealtimeProvider.jsx`  
- `client/src/hooks/useSocket.js`  
- `client/src/hooks/useAttendanceSocket.js`, `useAlertsSocket.js`, `useMessageCounter.js`  
- `server/src/socket.js` (or integration in `app.js`) and `server/src/services/realtimeService.js`  
- Tests & stories demonstrating realtime updates in `AttendanceDashboard` and `CoverageAlertsPanel`.

Acceptance criteria
- Live attendance/alert/message events appear in the UI within 1–3s under normal network conditions.  
- Socket connections authenticate and are scoped by area/user; unauthorized events are never received by clients.  
- Reconnect and missed-event reconciliation work robustly; UI does not thrash during bursts.

Estimated effort (rough)
- Doc + scaffold: 0.25–0.5 day.  
- Server socket integration + auth: 0.5 day.  
- Client hooks + component wiring: 0.5 day.  
- Tests, monitoring and scaling hardening: 0.5 day.

Next steps (recommended)
1. I can scaffold `RealtimeProvider.jsx` and `useSocket.js` with a mock Socket.io server now.  
2. Instrument `attendanceController` and `alertController` to emit events on create/update.  
3. Add integration tests and a simple load simulation for burst handling.

**UI consistency record (core UI changes log)**
- Use this space to record any changes made to core UI tokens, Tailwind mappings, or shared layout primitives caused by realtime work. For each change include: file path, diff summary, and rationale. Leave blank if none.

12. Accessibility & responsive polish
- Ensure keyboard navigation, color contrast, and ARIA labels for charts and table.

---

## Design language analysis (what I see in your examples)
- Visual style: modern SaaS dashboard with rounded cards, soft drop shadows, pastel backgrounds, and strong purple accent. Use of circular donut charts and subtle gradients.
- Primary mood: friendly, slightly playful yet professional — emphasis on purple + warm accent (orange) and clear status colors (green/red).
- Card density: spacious cards with whitespace; large bold numbers for KPIs and small secondary labels.

Guidelines to match existing design
- Use rounded corners (8–12px) for cards and table cells.
- Card background: pure white `#FFFFFF` on a very light page background `#F8F9FB`.
- Shadows: subtle `box-shadow: 0 6px 18px rgba(16,24,40,0.06)`.
- Use subtle separators, not heavy borders.
- Typeface: match existing (system/Inter). Use bold Lg for KPI numeric values, medium for labels.


Shared design tokens & palettes

Purpose
- Establish a single source of truth for design tokens (colors, spacing, radii, elevation) and two palette variants targeted at different product surfaces.

Canonical theme tokens (single source of truth)

- Primary / brand
	- `--color-primary`: #7C3AED — primary brand purple (Admin emphasis)
	- `--color-primary-2`: #A78BFA — lighter primary (Student surfaces)
	- `--color-accent`: #FF9F43 — CTA / accent orange

- Brand aliases (for gradual migration)
	- `--color-brand`: var(--color-primary)
	- `--color-brand-hover`: var(--color-primary-2)
	- `--color-brand-strong`: #5B3AC7
	- `--brand-glow`: #7C3AED66

- Semantic & status colors
	- `--color-success`: #10B981 (present)
	- `--color-danger`: #EF4444 (absent)
	- `--color-excused`: #FFB591 (excused/leave)

- Text & surfaces
	- `--text-primary`: #111827
	- `--text-muted`: #6B7280
	- `--bg-page`: #F8FAFC
	- `--bg-surface`: #FFFFFF
	- `--bg-muted`: #F9F9F9
	- `--ui-ink`: #1a1a1a

- Decorative accents
	- `--accent-warm`: #FFDEE9
	- `--accent-cool`: #B5FFFC
	- `--accent-cream`: #FFF3E0
	- `--accent-soft`: #F7EEF6

- Heatmap ramp
	- `--heatmap-low`: #F3F4F6
	- `--heatmap-mid`: #C7B3FF
	- `--heatmap-high`: var(--color-primary)

- Google logo colors (used by auth icons)
	- `--google-blue`: #4285F4
	- `--google-green`: #34A853
	- `--google-yellow`: #F4B400
	- `--google-red`: #EA4335

Note: these variables are mirrored in `client/src/index.css` as the canonical source of truth. Prefer referencing the semantic tokens (`--color-success`, `--color-danger`, etc.) in components so the UI theme can be adjusted centrally.

Palette mapping (which palette is for which surface)
- Admin Panel: use the full-strength `--color-primary` purple as the dominant accent for KPI cards, charts and emphasis; prefer stronger contrasts and deeper gradient accents. Reserve `--color-accent` for secondary controls and callouts.
- Student Panel: prefer lighter, friendlier visuals — favor `--color-primary-2` and white space; use `--color-accent` as primary CTA color for quick actions. Avoid heavy gradients and prefer flatter color blocks for clarity on mobile.

Implementation
- Provide `tokens.css` and `tailwind.config.js` entries with two named palette variants (e.g., `palette.admin`, `palette.student`) that override a small set of base tokens; document where to use each palette in component guidelines.

### Shared design foundations — Detailed implementation guide

Overview
- This guide defines the concrete files, token naming conventions, usage patterns, Tailwind integration, migration steps and tests required to implement a single source of truth for the UI design system used by both Admin and Student surfaces.

Goals
- Create a small, maintainable token surface that covers: colors, spacing, radii, elevation (shadows), typography tokens, motion (timing & easing), and a simple palette-variant system (`admin` | `student`).
- Ensure components use semantic tokens (e.g. `--color-success`) rather than raw hex values so visual changes are centralized and safe.
- Provide Tailwind mappings so teams can use both utility classes and CSS variables consistently.

Scope
- Files to add/update:
	- `client/src/styles/tokens.css` — canonical variables file (imported by `client/src/index.css`).
	- `client/tailwind.config.js` — extend theme to reference CSS vars where helpful.
	- `docs/dashboard-and-attendance-refactor.md` — this documentation (updated here).
	- Optional: `client/src/styles/theme-admin.css` and `theme-student.css` (small overrides for `.theme-admin` / `.theme-student`).

Token naming conventions
- Use semantic names (what the token means) not presentation names. Prefix categories for clarity:
	- Colors: `--color-*` (e.g., `--color-primary`, `--color-danger`, `--color-success`)
	- Text: `--text-*` (e.g., `--text-primary`, `--text-muted`)
	- Spacing: `--space-*` (scale based: `--space-0`, `--space-1`, ...)
	- Radius: `--radius-*` (e.g., `--radius-sm`, `--radius-md`, `--radius-lg`)
	- Elevation/shadows: `--elevation-*` (e.g., `--elevation-1` with full box-shadow value)
	- Motion: `--motion-duration-*`, `--motion-easing-*`

Canonical tokens (what to include)
- Colors (example): `--color-primary`, `--color-primary-2`, `--color-accent`, `--color-success`, `--color-danger`, `--color-excused`, `--bg-page`, `--bg-surface`, `--bg-muted`, `--text-primary`, `--text-muted`, decorative accents and Google icon colors.
- Spacing scale (example):
	- `--space-0: 0px;`
	- `--space-1: 4px;`
	- `--space-2: 8px;`
	- `--space-3: 12px;`
	- `--space-4: 16px;`
	- `--space-5: 24px;`
	- `--space-6: 32px;`
- Radii (example): `--radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px;`
- Elevation (example):
	- `--elevation-1: 0 1px 2px rgba(16,24,40,0.04);`
	- `--elevation-2: 0 6px 18px rgba(16,24,40,0.06);`

- Motion: `--motion-duration-fast: 150ms`, `--motion-duration-medium: 300ms`, `--motion-easing`: `cubic-bezier(.2,.8,.2,1)`

Sample `tokens.css` (starter)
```css
:root {
	/* Colors */
	--color-primary: #7C3AED;
	--color-primary-2: #A78BFA;
	--color-accent: #FF9F43;
	--color-success: #10B981;
	--color-danger: #EF4444;
	--color-excused: #FFB591;

	--text-primary: #111827;
	--text-muted: #6B7280;

	--bg-page: #F8FAFC;
	--bg-surface: #FFFFFF;
	--bg-muted: #F9F9F9;

	/* Spacing */
	--space-0: 0px;
	--space-1: 4px;
	--space-2: 8px;
	--space-3: 12px;
	--space-4: 16px;
	--space-5: 24px;
	--space-6: 32px;

	/* Radii */
	--radius-sm: 6px;
	--radius-md: 8px;
	--radius-lg: 12px;

	/* Elevation */
	--elevation-1: 0 1px 2px rgba(16,24,40,0.04);
	--elevation-2: 0 6px 18px rgba(16,24,40,0.06);

	/* Motion */
	--motion-duration-fast: 150ms;
	--motion-duration-medium: 300ms;
	--motion-easing: cubic-bezier(.2,.8,.2,1);
}

/* Theme variants (apply on body or root element) */
.theme-admin { --color-primary: #7C3AED; --color-primary-2: #A78BFA; }
.theme-student { --color-primary: #A78BFA; --color-primary-2: #C9B8FF; }
```

Tailwind integration (example)
- Approach A — add semantic colors in `tailwind.config.js` that reference CSS vars. This lets you use `text-primary` or `bg-primary` utilities while keeping CSS variables editable at runtime.

```js
export default {
	content: ["./index.html", "./src/**/*.{js,jsx}"],
	theme: {
		extend: {
			colors: {
				primary: 'var(--color-primary)',
				accent: 'var(--color-accent)',
				success: 'var(--color-success)',
				danger: 'var(--color-danger)'
			},
			spacing: {
				'1': 'var(--space-1)',
				'2': 'var(--space-2)',
				'3': 'var(--space-3)'
			},
			borderRadius: {
				sm: 'var(--radius-sm)',
				md: 'var(--radius-md)'
			},
			boxShadow: {
				card: 'var(--elevation-2)'
			}
		}
	},
	plugins: []
}
```

Notes:
- Tailwind can reference CSS variables as string values — this gives the best of both worlds: utility classes and runtime theming.
- Keep heavy theming in CSS variables rather than in Tailwind static tokens if you need runtime theme switching (e.g., `.theme-student`).

Component usage patterns
- Prefer semantic tokens in component styles:
	- Text color: `color: var(--text-primary)`
	- Card background: `background: var(--bg-surface); box-shadow: var(--elevation-2); border-radius: var(--radius-md)`
- For inline JSX styles you can use `style={{ backgroundColor: 'var(--bg-surface)' }}` but prefer class-based styles for reusability.
- Charts: use `--color-primary`, `--color-success`, `--color-danger`, and the heatmap ramp `--heatmap-mid`/`--heatmap-high` for consistent visuals.

Migration plan (recommended incremental approach)
1. Add `client/src/styles/tokens.css` and import it near the top of `client/src/index.css`.
2. Add alias variables (temporary) matching colors currently used across the app (e.g., `--color-brand`) so components can be migrated gradually.
3. Run a project-wide search for hex/rgb literals and group by frequency (we already did a scan).
4. Replace the highest-frequency literals first with semantic tokens (open PRs with small scoped changes per component). Example change: replace `bg-[#F8FAFC]` with `bg-[var(--bg-page)]` or add `class="bg-page"` if you add a small helper.
5. Remove deprecated literals and old token aliases after the codebase is fully migrated.

Automation suggestions
- Use simple codemods (jscodeshift) or search-and-replace scripts to automate literal -> var substitution for many files, but review each visually.
- Add a lint rule (ESLint custom or Stylelint) to detect hard-coded hex values and suggest tokens.

Accessibility & contrast
- Test all primary token pairs for WCAG AA/AAA where appropriate (text sizes, UI states). Tools: `axe`, `pa11y`, or the Color Contrast Analyzer.
- Keep an accessible contrast table in the docs: list token pairs and their contrast ratio.

Testing & visual QA
- Unit tests: snapshot critical components that depend on tokens (KPI card, donut, table row) so token regressions are obvious.
- Visual regression: use Percy/Chromatic or Playwright screenshot comparisons for the dashboard with both `theme-admin` and `theme-student` applied.

Acceptance criteria
- `tokens.css` exists and is imported in the app root.
- Tailwind theme references `var(--*)` values for at least `primary`, `accent`, `success`, `danger`.
- No new components are introduced with raw hex colors in PRs after migration (lint gate).
- Visual snapshots for the dashboard pass for both admin/student palettes.

Deliverables
- `client/src/styles/tokens.css` (canonical tokens).  
- Tailwind config updates in `client/tailwind.config.js`.  
- Small migration PRs replacing top-10 repeated color literals with tokens.  
- Documentation added here (`docs/dashboard-and-attendance-refactor.md`) describing token usage and migration steps.

Estimated effort (rough)
- Token file + Tailwind small changes: 0.5 day.  
- Migrate top 10 color hotspots: 0.5–1 day.  
- Full visual regression + accessibility pass: 1 day.

Decisions required
- Dark mode strategy — variables only, or Tailwind `dark:` utilities?  
- How aggressive should the migration be (big-bang codemod vs incremental PRs)?

Next steps (recommended)
1. Create `client/src/styles/tokens.css` and import it in `client/src/index.css` (I can do this now).  
2. Add a minimal Tailwind mapping for `primary`/`accent` so devs can use `bg-primary` / `text-primary`.  
3. Migrate the top 10 color literal occurrences into tokens with small PRs.


Recommended chart palettes
- Attendance (present): green `#10B981`.  
- Absent (critical): red `#EF4444`.  
- Excused/Leave: orange `#FFB591` or `--color-accent` muted.  
- Trend fill gradient: linear gradient from `--color-primary` to `--color-primary-2`.

Contrast note
- Ensure donut center text and KPI numerics use `#111827` for contrast; small delta text can use `--text-muted`.

---

## Chart & layout pairing ideas (two charts per row suggestions)
- Row A: Attendance Trend (left, wide) + Present Donut (right, compact)
- Row B: Heatmap (left) + Staff Coverage bar list (right)
- Row C: Top reasons for absence (bar) + Recent incidents (list)

Why two-per-row works
- Pairs well on 2-column responsive grid; enables quick visual correlations (trend vs distribution) while keeping the roster table below.

---

## Minimal required endpoints (backend hints)
- `GET /api/attendance/summary?start=&end=&area=` — totals (present/absent/late), on-duty staff counts.  
- `GET /api/attendance/trend?granularity=hour|day&start=&end=&area=` — series for charts.  
- `GET /api/attendance/heatmap?start=&end=&area=` — matrix data for heatmap.  
- `GET /api/attendance/list?start=&end=&page=&limit=&q=` — paginated student rows for table.  
- `GET /api/coverage` — shortages and suggestions for staff replacements.  
- `POST /api/attendance/adjust` — admin corrections (requires audit reason).

Server-side tips
- Provide aggregated endpoints to avoid heavy JOINs on UI request. Materialized views or nightly rollups for historical queries are recommended.

---

## Acceptance criteria (high level)
- Top KPI cards load within 200ms (aggregated queries).  
- Trend chart renders and allows toggling series (present/absent/excused).  
- Table supports filtering, searching and bulk actions; slide-over shows student details.  
- Realtime events update KPIs and open alerts without page refresh.  
- Exports respect filters and RBAC; admin can schedule recurring exports.

---

## Implementation tasks (short checklist for devs)
- [ ] Create design tokens and update `tailwind.config.js` or tokens.css.  
- [ ] Scaffold `AttendanceDashboard.jsx` and grid layout.  
- [ ] Implement `KpiCard`, `AttendanceTrendChart`, `PresentDonut`, `Heatmap`, `AttendanceTable`, `StudentDetailDrawer`.  
- [ ] Add backend endpoints described above and lightweight aggregations.  
- [ ] Integrate websocket to update KPIs and alerts.  
- [ ] Add export button and wire to `export_jobs` API.  
-- [ ] Accessibility pass.  

---

## Next steps (pick one)
- I can scaffold the React components and example chart (using `recharts` or `apexcharts`) and wire them to mock endpoints.  
- Or I can create the backend aggregated endpoints and a small `/api/attendance/summary` implementation for immediate KPI data.

Tell me which one you want me to start with and I will proceed.

---

File created by the team; this is a first-pass task list and design guide to implement the dashboard and attendance admin UI. We'll expand each task into a full spec and migration/controller/component code when you approve the priority order.

---

## Student Dashboard — Suggested content & priority

Purpose
- Student-facing dashboard should be focused, lightweight, and actionable: quick view of today's attendance, upcoming shifts/allocations (if staff), announcements for students, personal tasks or mess menu, and easy access to raise tickets or contact staff.

Priority widgets (order: highest to lowest)
1. Today's Attendance Summary
 - Present/Absent indicator for the student's class/room (if applicable) and quick toggle to view full class roster.
2. My Schedule / Next Shift (for staff-students or student workers)
 - Next shift or duty, location, and countdown timer.
3. Announcements / Urgent Banner
 - Top announcements targeted to the student (in-app banners for urgent items).
4. Quick Actions
 - Request Leave, Report Issue, View Mess Menu, Contact Warden/Staff.
5. Attendance History mini sparkline
 - Compact 14/30-day sparkline showing personal presence rate.
6. Tasks & Fees Snapshot
 - Upcoming tasks assigned to student devices and pending fee reminders.
7. Notifications & Messages
 - Recent messages from staff/admin and unread counts.
8. Events / Calendar
 - Upcoming events (exam, meeting) synced from roster or external calendar.

Layout & flow
- Top row: large greeting + today's attendance summary + quick actions (left-to-right).
- Middle row: two-column — left: announcements & events list; right: schedule + tasks card (two stacked cards).
- Bottom: attendance history and messages section in a single row (two smaller cards side-by-side).

Color & interaction guidance
- Maintain the same token palette as admin to match brand. Use lighter variants for student cards and slightly more vibrant call-to-action colors for quick actions.
- Provide clear affordances for urgent banners (use `--color-danger` for critical messages).

Permissions & data
- Student dashboard views limited data to the student and public fields (respect `visibility` tokens). Do not expose other students' personal contact info.

Accessibility & mobile-first
- Prioritise mobile layout with stacked cards and a single-column flow for smaller screens. Ensure primary quick actions are reachable.

Testing & performance (place at end)
- Unit tests: widget rendering and filter behavior.
- Integration tests: attendance fetch -> card aggregation -> action flows (leave request, report issue).
- Load tests: ensure dashboard queries scale when many simultaneous students request the same aggregated endpoints.

