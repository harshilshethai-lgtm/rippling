# Rippling Bulk Change — Scaffolding

A faithful visual scaffolding of Rippling's People page, built to serve as the foundation for prototyping a bulk-change flow.

## What's here

- A People list showing 100 fake employees with realistic variation (10 departments, 10 work locations, varied managers, employment types, statuses).
- Working **search** (matches name, email, title, manager, department).
- Working **filters** (department, location, manager, employment type, status) with a slide-out panel and active-filter chips.
- Working **row selection** with select-all, indeterminate state, and a sticky selection bar.
- A **"Bulk Changes"** entry point in the page header that you'll wire your bulk-change flow into.
- An identical entry point on the selection bar so the flow can start with a pre-scoped population.

## Running it

```bash
npm install
npm run dev
```

Opens at http://localhost:5173.

## Project structure

```
src/
├── App.jsx                          # Top-level orchestration
├── main.jsx                         # React entry
├── index.css                        # Tailwind + custom CSS (animations, scrollbar, checkboxes)
├── data/
│   └── employees.js                 # 100 fake employees + seeded RNG so data is stable
├── lib/
│   └── utils.js                     # Avatar gradient hashing, initials, classNames
└── components/
    ├── TopNav.jsx                   # Deep plum nav bar (logo, search, icons, company switcher)
    ├── Sidebar.jsx                  # Left nav with HR/Finance/IT sections
    ├── PageHeader.jsx               # Page title, search, filter, Bulk Changes CTA
    ├── ActiveFilterChips.jsx        # Removable chips bar shown when filters are applied
    ├── EmployeeTable.jsx            # The 100-row data grid with sort, selection, status pills
    ├── FilterPanel.jsx              # Slide-out filter panel
    └── SelectionBar.jsx             # Sticky bottom bar shown when rows are selected
```

## Design tokens (in `tailwind.config.js`)

The `rippling.*` colors are matched from Rippling's actual UI:

| Token                     | Hex       | Where it's used                         |
| ------------------------- | --------- | --------------------------------------- |
| `rippling-plum`           | `#481138` | Top nav background                      |
| `rippling-plum-hover`     | `#3a0d2d` | Primary button hover                    |
| `rippling-primary`        | `#7B1F5C` | Active states, accents                  |
| `rippling-accent`         | `#D946A8` | AI sparkle, gradient highlights         |
| `rippling-ink`            | `#0F0F0F` | Primary text                            |
| `rippling-line`           | `#E5E5E5` | Borders                                 |
| `rippling-chip`           | `#F4F1F3` | Selected nav items, active filter chips |
| `rippling-surface`        | `#FAFAFA` | App background                          |

## Wiring up the bulk-change flow

Both entry points (the **Bulk Changes** button in the page header and **Start bulk change** in the selection bar) call `handleStartBulkChange` in `App.jsx`. Right now it shows an `alert()`. Replace this with your flow:

```jsx
function handleStartBulkChange() {
  const scope = selected.size > 0
    ? [...selected]
    : filteredEmployees.map(e => e.id)
  // → push to your bulk-change wizard, modal, or route
  // → pass `scope` (employee IDs), and optionally the active filters
}
```

A reasonable next step is a wizard modal (matching Rippling's actual pattern from the screenshots: Profile changes → Upload changes → Review changes → Effective date → Agreements → Processing → Changes submitted).

## Notes on fidelity

- The fonts use **Inter** as a free stand-in for Rippling's actual brand font. Swap to whatever your demo expects.
- The "RR" logo is a simplified inline SVG of the three-wave mark.
- Animations are plain CSS keyframes (no `tailwindcss-animate` dependency).
- Status pills (Active/On Leave/Onboarding) use a dot+text pattern; Rippling's exact UI sometimes uses checkmark/cross icons — easy to swap in `EmployeeTable.jsx`.
- Avatar colors are deterministic from the employee name — stable across reloads.
