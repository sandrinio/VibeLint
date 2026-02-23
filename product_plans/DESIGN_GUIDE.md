# VibeLint Design Guide & Patterns

*Minimalistic design system for a developer workbench*

---

## Design Philosophy

VibeLint is a tool developers leave open alongside their editor. The interface should disappear — no visual noise, no decoration, just information and controls. Every element earns its place by being useful.

**Principles:**

1. **Content-first** — UI chrome is minimal. Data and controls dominate.
2. **Quiet until needed** — Status indicators are subtle. Only warnings and errors demand attention.
3. **Consistent density** — Developer tools can be information-dense. Embrace it with clear hierarchy, not excessive whitespace.
4. **Two modes, one system** — Light and dark themes share identical layout, spacing, and type scale. Only color values change.

---

## Color System

All colors are defined as CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark). Components never use raw color values — always reference tokens.

### Semantic Tokens

```css
:root {
  /* --- Backgrounds --- */
  --bg-primary:       #FFFFFF;
  --bg-secondary:     #F8F9FA;
  --bg-tertiary:      #F1F3F5;
  --bg-inverse:       #1A1A2E;
  --bg-elevated:      #FFFFFF;

  /* --- Surfaces (cards, panels, modals) --- */
  --surface-primary:  #FFFFFF;
  --surface-secondary:#F8F9FA;
  --surface-hover:    #F1F3F5;
  --surface-active:   #E9ECEF;

  /* --- Borders --- */
  --border-primary:   #DEE2E6;
  --border-secondary: #E9ECEF;
  --border-focus:     #5B5FC7;

  /* --- Text --- */
  --text-primary:     #212529;
  --text-secondary:   #495057;
  --text-tertiary:    #868E96;
  --text-inverse:     #F8F9FA;
  --text-link:        #5B5FC7;

  /* --- Brand --- */
  --accent-primary:   #5B5FC7;
  --accent-hover:     #4B4FB7;
  --accent-active:    #3B3FA7;
  --accent-subtle:    #EDEDFA;

  /* --- Status --- */
  --status-pass:      #2B8A3E;
  --status-pass-bg:   #EBFBEE;
  --status-warn:      #E67700;
  --status-warn-bg:   #FFF4E6;
  --status-fail:      #C92A2A;
  --status-fail-bg:   #FFF5F5;
  --status-info:      #1971C2;
  --status-info-bg:   #E7F5FF;

  /* --- Code / Editor --- */
  --code-bg:          #F8F9FA;
  --code-text:        #212529;
  --code-border:      #DEE2E6;

  /* --- Shadows --- */
  --shadow-sm:        0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md:        0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg:        0 4px 16px rgba(0, 0, 0, 0.10);

  /* --- Focus ring --- */
  --focus-ring:       0 0 0 2px var(--bg-primary), 0 0 0 4px var(--accent-primary);
}

[data-theme="dark"] {
  /* --- Backgrounds --- */
  --bg-primary:       #16161E;
  --bg-secondary:     #1C1C28;
  --bg-tertiary:      #232332;
  --bg-inverse:       #F8F9FA;
  --bg-elevated:      #1C1C28;

  /* --- Surfaces --- */
  --surface-primary:  #1C1C28;
  --surface-secondary:#232332;
  --surface-hover:    #2A2A3C;
  --surface-active:   #323246;

  /* --- Borders --- */
  --border-primary:   #2E2E42;
  --border-secondary: #262638;
  --border-focus:     #7B7FD7;

  /* --- Text --- */
  --text-primary:     #E4E4ED;
  --text-secondary:   #A9A9C0;
  --text-tertiary:    #6C6C8A;
  --text-inverse:     #16161E;
  --text-link:        #8B8FE0;

  /* --- Brand --- */
  --accent-primary:   #7B7FD7;
  --accent-hover:     #8B8FE0;
  --accent-active:    #9B9FE8;
  --accent-subtle:    #252540;

  /* --- Status --- */
  --status-pass:      #51CF66;
  --status-pass-bg:   #162316;
  --status-warn:      #FFC078;
  --status-warn-bg:   #2A2016;
  --status-fail:      #FF6B6B;
  --status-fail-bg:   #2A1616;
  --status-info:      #74C0FC;
  --status-info-bg:   #161E2A;

  /* --- Code / Editor --- */
  --code-bg:          #12121A;
  --code-text:        #E4E4ED;
  --code-border:      #2E2E42;

  /* --- Shadows --- */
  --shadow-sm:        0 1px 2px rgba(0, 0, 0, 0.20);
  --shadow-md:        0 2px 8px rgba(0, 0, 0, 0.30);
  --shadow-lg:        0 4px 16px rgba(0, 0, 0, 0.40);

  /* --- Focus ring --- */
  --focus-ring:       0 0 0 2px var(--bg-primary), 0 0 0 4px var(--accent-primary);
}
```

### Color Usage Rules

| Context | Token | Never |
|---------|-------|-------|
| Page background | `--bg-primary` | Raw `#fff` or `white` |
| Card / panel | `--surface-primary` | `bg-gray-100` |
| Body text | `--text-primary` | `text-black` |
| Muted labels | `--text-tertiary` | Opacity hacks |
| Dividers | `--border-primary` | `border-gray-200` |
| Pass/fail/warn | `--status-*` tokens | Green/red/orange raw values |

---

## Typography

One font family. One scale. Monospace for code only.

```css
:root {
  --font-sans:  'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;

  /* Type scale — based on 14px base (developer tool density) */
  --text-xs:    0.6875rem;   /* 11px — badges, footnotes */
  --text-sm:    0.75rem;     /* 12px — secondary labels, table cells */
  --text-base:  0.875rem;    /* 14px — body text, controls */
  --text-lg:    1rem;        /* 16px — section headers */
  --text-xl:    1.25rem;     /* 20px — page titles */
  --text-2xl:   1.5rem;      /* 24px — wizard headers */

  /* Line heights */
  --leading-tight:  1.3;
  --leading-normal: 1.5;
  --leading-relaxed:1.65;

  /* Font weights */
  --weight-normal:  400;
  --weight-medium:  500;
  --weight-semibold:600;
}
```

### Type Patterns

| Element | Size | Weight | Color | Tracking |
|---------|------|--------|-------|----------|
| Page title | `--text-xl` | `--weight-semibold` | `--text-primary` | -0.01em |
| Section heading | `--text-lg` | `--weight-semibold` | `--text-primary` | normal |
| Body text | `--text-base` | `--weight-normal` | `--text-primary` | normal |
| Secondary label | `--text-sm` | `--weight-normal` | `--text-secondary` | normal |
| Badge / tag | `--text-xs` | `--weight-medium` | varies | 0.02em |
| Code / paths | `--text-sm` | `--weight-normal` (mono) | `--text-primary` | normal |
| Table header | `--text-sm` | `--weight-medium` | `--text-secondary` | 0.03em (uppercase) |

---

## Spacing & Layout

An 4px base grid. All spacing uses multiples of 4.

```css
:root {
  --space-0:    0;
  --space-1:    0.25rem;   /* 4px */
  --space-2:    0.5rem;    /* 8px */
  --space-3:    0.75rem;   /* 12px */
  --space-4:    1rem;      /* 16px */
  --space-5:    1.25rem;   /* 20px */
  --space-6:    1.5rem;    /* 24px */
  --space-8:    2rem;      /* 32px */
  --space-10:   2.5rem;    /* 40px */
  --space-12:   3rem;      /* 48px */

  /* Border radius */
  --radius-sm:  4px;
  --radius-md:  6px;
  --radius-lg:  8px;
  --radius-xl:  12px;
  --radius-full:9999px;
}
```

### Layout Constants

| Element | Value |
|---------|-------|
| Sidebar width | 220px |
| Sidebar collapsed | 48px |
| Top nav height | 48px |
| Page max-width | 1200px |
| Card padding | `--space-4` (16px) |
| Card gap | `--space-3` (12px) |
| Section gap | `--space-6` (24px) |
| Table row height | 40px |
| Input height | 32px |
| Button height (sm) | 28px |
| Button height (md) | 32px |
| Button height (lg) | 36px |

---

## Tailwind Configuration

Map design tokens to Tailwind in `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/client/**/*.{ts,tsx}', './src/client/index.html'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary:  'var(--bg-tertiary)',
          elevated:  'var(--bg-elevated)',
        },
        surface: {
          primary:   'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          hover:     'var(--surface-hover)',
          active:    'var(--surface-active)',
        },
        border: {
          primary:   'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          focus:     'var(--border-focus)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary:  'var(--text-tertiary)',
          link:      'var(--text-link)',
        },
        accent: {
          DEFAULT:   'var(--accent-primary)',
          hover:     'var(--accent-hover)',
          active:    'var(--accent-active)',
          subtle:    'var(--accent-subtle)',
        },
        status: {
          pass:      'var(--status-pass)',
          'pass-bg': 'var(--status-pass-bg)',
          warn:      'var(--status-warn)',
          'warn-bg': 'var(--status-warn-bg)',
          fail:      'var(--status-fail)',
          'fail-bg': 'var(--status-fail-bg)',
          info:      'var(--status-info)',
          'info-bg': 'var(--status-info-bg)',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', 'Fira Code', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        xs:   ['0.6875rem', { lineHeight: '1.3' }],
        sm:   ['0.75rem',   { lineHeight: '1.5' }],
        base: ['0.875rem',  { lineHeight: '1.5' }],
        lg:   ['1rem',      { lineHeight: '1.5' }],
        xl:   ['1.25rem',   { lineHeight: '1.3' }],
        '2xl':['1.5rem',    { lineHeight: '1.3' }],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
} satisfies Config;
```

---

## Theme Switching

### Implementation

Theme is toggled via a `data-theme` attribute on `<html>`. Default follows system preference.

```tsx
// src/client/lib/theme.ts

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'vibelint-theme';

export function getStoredTheme(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system';
}

export function applyTheme(theme: Theme) {
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  document.documentElement.setAttribute('data-theme', resolved);
  localStorage.setItem(STORAGE_KEY, theme);
}

// Call on app init + listen for system changes
export function initTheme() {
  applyTheme(getStoredTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() === 'system') applyTheme('system');
  });
}
```

### Toggle Component

A three-state toggle in the top nav: Light / System / Dark. Represented as a segmented control, not a dropdown.

---

## Component Patterns

### Shell Layout

```
┌─ Top Nav (48px) ─────────────────────────────────────────────┐
│ [Logo]   Repos ▾    Skills    Rules    Analysis    ...   [◐] │
├─────────┬────────────────────────────────────────────────────┤
│ Sidebar │  Page Content                                      │
│ (220px) │                                                    │
│         │  ┌─ Section ──────────────────────────────────┐   │
│ • Repos │  │  Section heading                            │   │
│   my-app│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│   api   │  │  │  Card   │ │  Card   │ │  Card   │     │   │
│         │  │  └─────────┘ └─────────┘ └─────────┘     │   │
│ • Quick │  └─────────────────────────────────────────────┘   │
│   actions│                                                    │
│         │  ┌─ Section ──────────────────────────────────┐   │
│         │  │  ...                                        │   │
│         │  └─────────────────────────────────────────────┘   │
└─────────┴────────────────────────────────────────────────────┘
```

- Top nav: fixed, `--bg-primary`, thin bottom border `--border-primary`
- Sidebar: fixed, `--bg-secondary`, right border `--border-primary`
- Content: scrollable, `--bg-primary`, padded `--space-6`

### Cards

The primary container for grouped information.

```
┌─ Card ─────────────────────────────────┐
│  Card Title            [Action Button] │
│  ─────────────────────────────────     │
│  Content here                          │
│                                        │
└────────────────────────────────────────┘
```

**Styles:**
```css
.card {
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}
```

**Rules:**
- No colored backgrounds on cards. Cards are always `--surface-primary`.
- Use border, not shadow, as the primary card delimiter. Shadow is subtle reinforcement only.
- Card title is `--text-lg`, `--weight-semibold`. Optional inline actions are right-aligned.

### Buttons

Three variants. Two sizes commonly used (sm, md).

| Variant | Background | Text | Border | Use for |
|---------|-----------|------|--------|---------|
| **Primary** | `--accent-primary` | `white` | none | Main actions (Inject, Save, Run Analysis) |
| **Secondary** | transparent | `--text-primary` | `--border-primary` | Secondary actions (Cancel, Reset, Edit) |
| **Ghost** | transparent | `--text-secondary` | none | Tertiary actions, inline actions, icon buttons |

**States:** hover darkens primary by one step, lightens ghost to `--surface-hover`. Disabled uses 40% opacity. Focus uses `--focus-ring`.

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ■ Inject All │  │ ○ Cancel     │  │   Edit       │
│   (primary)  │  │  (secondary) │  │   (ghost)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Button text rules:**
- Always sentence case ("Run analysis", not "Run Analysis")
- Verb-first ("Save changes", "Add repo", "Run analysis")
- No ellipsis unless it opens a dialog

### Status Indicators

Used throughout analysis views, repo cards, and doc status.

```
 ✓ Pass     ⚠ Warning     ✕ Fail     ● Info
```

Rendered as small pills/badges:

```css
.badge-pass { color: var(--status-pass); background: var(--status-pass-bg); }
.badge-warn { color: var(--status-warn); background: var(--status-warn-bg); }
.badge-fail { color: var(--status-fail); background: var(--status-fail-bg); }
.badge-info { color: var(--status-info); background: var(--status-info-bg); }
```

Size: `--text-xs`, `--weight-medium`, `padding: 2px 8px`, `border-radius: --radius-full`.

### Tables

Used for analysis results, file lists, metric breakdowns.

```
┌──────────────────┬──────────┬─────────────────┐
│ CHECK            │ STATUS   │ DETAILS          │
├──────────────────┼──────────┼─────────────────┤
│ Complexity       │ ⚠ Warn   │ +8 in auth.ts   │
│ Duplicates       │ ✕ Fail   │ 3 clones        │
│ Error Handling   │ ✓ Pass   │ —               │
└──────────────────┴──────────┴─────────────────┘
```

**Styles:**
- Header row: `--text-sm`, `--weight-medium`, `--text-secondary`, uppercase tracking, `--bg-secondary` background
- Body rows: `--text-base`, `--text-primary`, alternating row colors off (clean look), hover `--surface-hover`
- Cell padding: `--space-2` vertical, `--space-3` horizontal
- Borders: horizontal only, `--border-secondary`
- No outer border on the table — cards provide the container

### Form Inputs

Text inputs, selects, textareas.

```css
.input {
  height: 32px;
  padding: 0 var(--space-3);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--text-primary);
}
.input:focus {
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
  outline: none;
}
.input::placeholder {
  color: var(--text-tertiary);
}
```

Labels: `--text-sm`, `--weight-medium`, `--text-secondary`, `margin-bottom: --space-1`.

### Sidebar Navigation

```
┌─ Sidebar ──────┐
│                 │
│  REPOS          │  ← section label: --text-xs, --text-tertiary, uppercase
│  ● my-app      │  ← active: --accent-subtle bg, --accent-primary text
│    api-service  │  ← inactive: --text-secondary, hover: --surface-hover
│    docs-site    │
│                 │
│  TOOLS          │
│    Analysis     │
│    Trends       │
│    Docs         │
│                 │
│  ─────────────  │
│    Settings     │
└─────────────────┘
```

- Active item: `--accent-subtle` background, `--accent-primary` text, left 2px accent border
- Hover: `--surface-hover` background
- Section labels: `--text-xs`, `--text-tertiary`, uppercase, `letter-spacing: 0.05em`, `margin: --space-4 0 --space-2 0`
- Items: `--text-base`, `padding: --space-2 --space-3`, `border-radius: --radius-md`

### Markdown Editor

The skill/rules editor uses CodeMirror or Monaco wrapped in VibeLint's design tokens.

```
┌─ Editor ──────────────────────────────────────────────────┐
│  ┌─ Tab: Edit ─┐ ┌─ Tab: Preview ─┐                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ # Error Handling Patterns                             │ │
│  │                                                       │ │
│  │ ## Rules                                              │ │
│  │ - Never use empty catch blocks                        │ │
│  │ - Always propagate errors or handle explicitly        │ │
│  │ |                                                     │ │
│  │                                                       │ │
│  └──────────────────────────────────────────────────────┘ │
│  [Save]  [Reset to default]                               │
└───────────────────────────────────────────────────────────┘
```

- Editor background: `--code-bg`
- Editor text: `--code-text`
- Editor border: `--code-border`
- Tab bar: `--bg-secondary`, active tab underlined with `--accent-primary`
- Line numbers: `--text-tertiary`

### Metric Cards (Dashboard)

Small summary cards on the repo overview.

```
┌─────────────────┐
│  Health Score    │  ← --text-sm, --text-secondary
│  87 / 100       │  ← --text-xl, --weight-semibold, --text-primary
│  ▲ 3 this week  │  ← --text-xs, --status-pass (green for improvement)
└─────────────────┘
```

- Fixed width within a grid (3–4 columns)
- No icons in the card — text only
- Trend indicator: `▲` green for improvement, `▼` orange/red for regression, `—` gray for no change

### Toast / Notification

Appears top-right. Auto-dismisses in 5 seconds.

```
┌──────────────────────────────────┐
│ ✓  Analysis complete.        [×] │
└──────────────────────────────────┘
```

- Background: `--surface-primary` with `--shadow-lg`
- Border-left: 3px solid, color matches type (pass/warn/fail/info)
- Text: `--text-base`
- Dismiss button: `--text-tertiary`, ghost style
- Animation: slide in from right, 200ms ease-out. Fade out on dismiss.

### Wizard (Setup Flow)

Full-page centered layout. No sidebar. No top nav beyond logo.

```
┌─────────────────────────────────────────────┐
│                                              │
│              VibeLint                         │
│              Step 1 of 3                     │
│                                              │
│  ┌─ Card ──────────────────────────────┐    │
│  │  Which AI coding tool do you use?    │    │
│  │                                      │    │
│  │  ● Claude Code        ✓ Detected    │    │
│  │  ○ Cursor             ✓ Detected    │    │
│  │  ○ Windsurf                         │    │
│  │  ○ Other                            │    │
│  │                                      │    │
│  │                       [Next →]       │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ● ○ ○                                       │
└─────────────────────────────────────────────┘
```

- Max-width: 560px, centered
- Step indicator: simple dots, `--accent-primary` for current, `--border-primary` for upcoming
- Card styling matches standard cards
- "Detected" labels use `--status-pass` color

---

## Iconography

Use [Lucide Icons](https://lucide.dev/) — open source, consistent stroke width, tree-shakeable.

**Size conventions:**

| Context | Size |
|---------|------|
| Inline with text | 14px |
| Button with label | 16px |
| Sidebar nav item | 16px |
| Standalone icon button | 18px |
| Empty state illustration | 48px |

**Rules:**
- Stroke width: 1.5px (Lucide default). Never change it.
- Color: inherit from parent text color. Never color icons independently unless they represent status.
- No filled icons. Outline only.

**Commonly used icons:**

| Purpose | Icon name |
|---------|-----------|
| Repo | `folder-git-2` |
| File | `file-text` |
| Skill | `sparkles` |
| Analysis / scan | `scan-search` |
| Run / execute | `play` |
| Inject | `download` |
| Settings | `settings` |
| Branch | `git-branch` |
| Trend up | `trending-up` |
| Trend down | `trending-down` |
| Warning | `alert-triangle` |
| Error | `alert-circle` |
| Success | `check-circle-2` |
| Edit | `pencil` |
| Delete | `trash-2` |
| Add | `plus` |
| Close | `x` |
| Theme toggle | `sun` / `moon` |
| Docs | `book-open` |
| External link | `external-link` |

---

## Motion & Transitions

Minimal. Functional only.

```css
:root {
  --transition-fast:   100ms ease;
  --transition-normal: 200ms ease;
  --transition-slow:   300ms ease;
}
```

| Element | Property | Duration |
|---------|----------|----------|
| Button hover | background-color, border-color | `--transition-fast` |
| Sidebar item hover | background-color | `--transition-fast` |
| Toast enter/exit | transform, opacity | `--transition-normal` |
| Theme switch | color, background-color, border-color | `--transition-normal` |
| Page transition | none — instant |
| Modal open | opacity | `--transition-normal` |

**Rules:**
- No spring/bounce animations
- No skeleton loaders — use a simple centered spinner (16px, `--text-tertiary`)
- No page transition animations
- Toasts are the only element that slides

---

## Responsive Behavior

VibeLint is a localhost tool. Typical viewport is 1280px+. Support down to 1024px gracefully.

| Viewport | Sidebar | Content | Grid columns |
|----------|---------|---------|-------------|
| >= 1280px | 220px visible | Fluid | 4 |
| 1024–1279px | 220px visible | Fluid | 3 |
| < 1024px | Collapsed (48px icons) | Fluid | 2 |

No mobile breakpoints. This is a desktop developer tool.

---

## Page-Specific Patterns

### Dashboard (Repos Overview)

```
[Page title: "Repositories"]

Grid of repo cards:
┌────────────────────────────────┐
│  my-app                    [↗] │
│  TypeScript, Python            │
│  ─────────────────────────     │
│  Health: 87    Branches: 12    │
│  Last scan: 2h ago             │
│  ─────────────────────────     │
│  [Run analysis]  [Re-inject]   │
└────────────────────────────────┘
```

### Analysis View

- Summary table (as described in Tables pattern)
- Per-file expandable rows
- Threshold config sidebar or inline controls
- "Run analysis" primary button at top

### Skills Editor

- Left panel: file tree of skills (built-in + custom)
- Right panel: markdown editor
- Bottom bar: Save / Reset actions
- Files show an "unsaved" dot indicator when modified

### Trends

- Line charts use the accent color palette
- Chart background: `--bg-primary`
- Grid lines: `--border-secondary`
- Data lines: `--accent-primary` (main metric), `--text-tertiary` (comparison)
- Axis labels: `--text-sm`, `--text-tertiary`
- Chart library: lightweight (e.g., `recharts` — already React-based, tree-shakeable)

---

## Accessibility

- All interactive elements must be keyboard-navigable
- Focus visible: `--focus-ring` on all focusable elements
- Color is never the sole indicator — always pair with text or icons (e.g., "✓ Pass" not just green)
- Contrast ratios meet WCAG AA:
  - `--text-primary` on `--bg-primary`: >= 7:1 (both themes)
  - `--text-secondary` on `--bg-primary`: >= 4.5:1 (both themes)
  - `--text-tertiary` on `--bg-primary`: >= 3:1 (used only for non-essential labels)
- ARIA labels on icon-only buttons
- Screen reader announcements for toast notifications (`role="status"`)

---

## Anti-Patterns (Do Not)

1. **No gradients** — flat colors only
2. **No colored card backgrounds** — cards are always `--surface-primary`
3. **No icon-only navigation** (except collapsed sidebar) — always pair with labels
4. **No modals for content editing** — edit inline or in-page, not in a dialog
5. **No hover-only information** — if data matters, show it always
6. **No custom scrollbars** — use native
7. **No animations longer than 300ms**
8. **No more than 2 font weights on a single screen** (normal + semibold)
9. **No nested cards** — cards don't contain cards
10. **No full-width colored banners** — status uses inline badges

---

## File Organization

```
src/client/
├── styles/
│   ├── tokens.css          ← CSS custom properties (light + dark)
│   ├── base.css            ← reset, body defaults, typography
│   └── utilities.css       ← any non-Tailwind utility classes
├── components/
│   ├── ui/                 ← atomic: Button, Badge, Input, Card, etc.
│   ├── layout/             ← Shell, Sidebar, TopNav, PageContainer
│   └── domain/             ← MetricCard, AnalysisSummary, DiffViewer, etc.
├── pages/
└── lib/
    └── theme.ts            ← theme toggle logic
```

**Naming:**
- Components: PascalCase (`Button.tsx`, `MetricCard.tsx`)
- CSS token files: kebab-case
- One component per file. Colocate component + its types.

---

*This guide is the single source of truth for VibeLint's visual design. When in doubt, choose the simpler option.*
