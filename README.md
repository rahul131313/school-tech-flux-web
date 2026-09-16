# SchoolConnect — Web Admin Frontend

> Multi-tenant SaaS school-management platform — React web admin dashboard.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev/)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Architecture Decisions](#architecture-decisions)
- [Design System](#design-system)
- [API Layer](#api-layer)
- [Authentication Flow](#authentication-flow)
- [Shared Component Library](#shared-component-library)
- [Routing & Guards](#routing--guards)
- [State Management](#state-management)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Multi-Tenant Branding](#multi-tenant-branding)
- [Available Scripts](#available-scripts)
- [Module Roadmap](#module-roadmap)
- [Contributing](#contributing)

---

## Overview

SchoolConnect is a **multi-tenant SaaS** platform for school management. This repository contains the **web admin frontend** — an internal dashboard behind a login wall used by school administrators, teachers, accountants, and librarians.

**Key characteristics:**
- No SSR/SEO — entirely behind authentication
- Data-dense tables are the default for list screens
- Role-based access control (RBAC) determines navigation and page access
- Per-tenant branding (logo, accent color) applied at runtime
- Consumes a Spring Boot REST API (separate backend repo)

---

## Tech Stack

| Category | Technology | Version |
|---|---|---|
| **Framework** | React | 19.x |
| **Build Tool** | Vite | 8.x |
| **Language** | TypeScript | 6.x (strict mode) |
| **Routing** | React Router | 8.x |
| **Server State** | TanStack Query (React Query) | 5.x |
| **Data Tables** | TanStack Table | 9.x |
| **Client State** | Zustand | 5.x |
| **Validation** | Zod | 4.x |
| **HTTP Client** | Axios | 1.x |
| **Icons** | Lucide React | 1.x |
| **Notifications** | React Hot Toast | 2.x |
| **Styling** | Vanilla CSS + CSS Modules + CSS Custom Properties | — |

> **Do not substitute libraries** without team discussion. No Tailwind, MUI, Chakra, or shadcn/ui unless explicitly agreed upon.

---

## Prerequisites

- **Node.js** ≥ 22.x
- **npm** ≥ 10.x
- A running instance of the **SchoolConnect Spring Boot API** on `http://localhost:8080` (or configure `VITE_API_URL`)

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd school-tech-flux-frontend

# 2. Install dependencies
npm install

# 3. Create your local env file (already provided with defaults)
cp .env .env.local   # (optional — edit if API is on a different host)

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**.

- Login page: `http://localhost:5173/login`
- Dashboard (requires auth): `http://localhost:5173/`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` | Base URL for the Spring Boot backend API |
| `VITE_APP_NAME` | `SchoolConnect` | Application display name |

Create a `.env.local` file to override defaults for your local setup. **Never commit secrets to `.env`.**

---

## Project Structure

```
src/
├── api/                          # API client & typed endpoints
│   ├── client.ts                 # Axios instance, 401 interceptor, token mgmt
│   ├── types.ts                  # Shared types (error envelope, User, etc.)
│   └── endpoints/
│       └── auth.ts               # Auth API functions (login, logout, etc.)
│
├── components/                   # Shared component library (build once, reuse)
│   ├── ui/                       # Core UI components
│   │   ├── Button.tsx            # Primary/secondary/ghost/danger variants
│   │   ├── Button.module.css
│   │   ├── FormInput.tsx         # Label + input + error display
│   │   ├── FormInput.module.css
│   │   └── Toast.tsx             # useToast() hook + ToastProvider
│   ├── dialog/
│   │   ├── ConfirmDialog.tsx     # useConfirm() → Promise<boolean>
│   │   └── ConfirmDialog.module.css
│   ├── feedback/
│   │   ├── EmptyState.tsx        # Icon + message + CTA for empty data
│   │   ├── EmptyState.module.css
│   │   ├── Skeleton.tsx          # Shimmer loaders (text/circle/rect/table)
│   │   ├── Skeleton.module.css
│   │   ├── Spinner.tsx           # SVG circular spinner (inline + fullscreen)
│   │   └── Spinner.module.css
│   └── layout/
│       ├── AppLayout.tsx         # Sidebar + TopBar + <Outlet />
│       ├── AppLayout.module.css
│       ├── Sidebar.tsx           # Persistent left nav (role-filtered)
│       ├── Sidebar.module.css
│       ├── TopBar.tsx            # Page title + user menu + notifications
│       └── TopBar.module.css
│
├── features/                     # Feature modules (one folder per domain)
│   └── auth/
│       ├── schemas.ts            # Zod validation schemas
│       ├── hooks/
│       │   ├── useLogin.ts       # TanStack Query mutation
│       │   ├── useCurrentUser.ts # Session rehydration query
│       │   ├── useForgotPassword.ts
│       │   └── useResetPassword.ts
│       └── pages/
│           ├── LoginPage.tsx
│           ├── LoginPage.module.css
│           ├── ForgotPasswordPage.tsx
│           ├── ForgotPasswordPage.module.css
│           ├── ResetPasswordPage.tsx
│           └── ResetPasswordPage.module.css
│
├── hooks/                        # Global custom hooks (future)
│
├── lib/
│   └── queryClient.ts            # TanStack Query client config
│
├── router/
│   ├── index.tsx                 # Route definitions
│   └── guards.tsx                # AuthGuard, PublicGuard, RoleGuard
│
├── stores/
│   ├── authStore.ts              # Zustand — user, tokens, permissions
│   └── themeStore.ts             # Zustand — branding config (persisted)
│
├── styles/
│   ├── reset.css                 # Modern CSS reset
│   ├── tokens.css                # Design tokens (spacing, colors, etc.)
│   └── global.css                # Body defaults, scrollbar, typography
│
├── App.tsx                       # Root — providers (Query, Router, Toast, Confirm)
└── main.tsx                      # Entry — style imports + React render
```

---

## Architecture Decisions

### 1. Feature-based modules
Code is organized by **feature domain** (`features/auth/`, `features/students/`, etc.), not by file type. Each module contains its own pages, hooks, components, and schemas.

### 2. Two-store strategy
- **TanStack Query** — all server state (API data). Never `useEffect` + `fetch`.
- **Zustand** — client/UI state only (auth session, branding, sidebar toggle).

### 3. No ad-hoc fetch calls
Every API call goes through `src/api/client.ts` → wrapped in a typed function in `src/api/endpoints/` → consumed via TanStack Query hooks. Components **never** import axios or call fetch directly.

### 4. Tokens in memory
Access tokens are stored in a module-scoped variable (not localStorage) for security. Refresh tokens are expected to be managed via httpOnly cookies by the backend.

### 5. CSS Modules + Custom Properties
No CSS-in-JS runtime. Styles use CSS Modules for scoping and CSS custom properties (from `tokens.css`) for the design system. This gives zero runtime overhead and full IDE support.

---

## Design System

All visual constants live in [`src/styles/tokens.css`](src/styles/tokens.css) as CSS custom properties.

### Spacing Scale
| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

### Color Palette
- **Neutral:** Slate 50–950
- **Primary:** Indigo 50–900 (overridable per-tenant via branding)
- **Semantic:** Success (green), Warning (amber), Error (red), Info (blue)
- **Surfaces:** Card, input, sidebar, overlay backgrounds

### Typography
- **Font:** Inter (Google Fonts), with system font fallbacks
- **Scale:** xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px), 3xl (30px), 4xl (36px)
- **Weights:** Regular (400), Medium (500), Semibold (600), Bold (700)

### Rules
> ⚠️ **Never hardcode a pixel value or hex color inline.** Always reference a token.
> ```css
> /* ✅ Correct */
> padding: var(--space-4);
> color: var(--color-text-primary);
>
> /* ❌ Wrong */
> padding: 16px;
> color: #0f172a;
> ```

---

## API Layer

### Error Envelope
Every backend error response follows this shape:
```typescript
interface ApiError {
  success: false;
  errorCode: string;        // e.g. "VALIDATION_ERROR", "UNAUTHORIZED"
  message: string;           // Human-readable, shown in toasts
  fieldErrors: Record<string, string>;  // Maps field name → error message
  traceId: string;           // For backend debugging
}
```

### Success Envelope
```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}
```

### Global 401 Interceptor
A single interceptor in [`src/api/client.ts`](src/api/client.ts):
1. Catches any 401 response
2. Attempts token refresh (if a refresh token exists)
3. Queues concurrent requests while refreshing
4. On refresh failure → clears auth state → redirects to `/login`

**No per-screen 401 checks are needed.** The interceptor handles it globally.

### Adding a New Endpoint
```typescript
// 1. Add types to src/api/types.ts
export interface Student { id: string; name: string; ... }

// 2. Create src/api/endpoints/students.ts
import { apiClient } from '../client';
import type { ApiResponse, Student, PageResponse } from '../types';

export const studentsApi = {
  getAll: async (params: PageRequest): Promise<PageResponse<Student>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<Student>>>(
      '/v1/students', { params }
    );
    return response.data.data;
  },
};

// 3. Create a TanStack Query hook in features/students/hooks/
export function useStudents(params: PageRequest) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentsApi.getAll(params),
  });
}
```

---

## Authentication Flow

```
┌─────────┐     POST /auth/login     ┌──────────┐
│  Login   │ ───────────────────────► │ Backend  │
│  Page    │ ◄─────────────────────── │          │
└────┬─────┘  { accessToken, user }   └──────────┘
     │
     ▼
┌──────────────────────────────┐
│  authStore.setAuth()         │
│  • stores user + permissions │
│  • sets access token in mem  │
│  • fetches branding config   │
└────────────┬─────────────────┘
             │
             ▼
     Navigate to "/" (Dashboard)
```

### Session Rehydration
On app mount, `useCurrentUser()` checks if a token exists and calls `GET /auth/me` to rehydrate. If the token is expired, the 401 interceptor handles redirect.

### Roles
| Role | Description |
|---|---|
| `SUPER_ADMIN` | Platform-level access across all tenants |
| `SCHOOL_ADMIN` | Full access within their school/tenant |
| `TEACHER` | Academic features (attendance, grades, timetable) |
| `ACCOUNTANT` | Fee management, financial reports |
| `LIBRARIAN` | Library management |

---

## Shared Component Library

Every component listed below is **built once and reused everywhere**. No one-off UI elements.

| Component | Import | Key Props |
|---|---|---|
| `<FormInput>` | `components/ui/FormInput` | `label`, `value`, `onChange`, `error`, `type`, `required` |
| `<Button>` | `components/ui/Button` | `variant`, `size`, `loading`, `icon`, `fullWidth` |
| `useToast()` | `components/ui/Toast` | Returns `{ success, error, warning, info, dismiss }` |
| `useConfirm()` | `components/dialog/ConfirmDialog` | Returns `{ confirm }` → `Promise<boolean>` |
| `<EmptyState>` | `components/feedback/EmptyState` | `icon`, `message`, `description`, `ctaLabel`, `onAction` |
| `<Skeleton>` | `components/feedback/Skeleton` | `variant` (`text`/`circle`/`rect`/`table-row`), `lines`, `columns` |
| `<Spinner>` | `components/feedback/Spinner` | `fullScreen`, `size`, `label` |
| `<Sidebar>` | `components/layout/Sidebar` | Role-based nav, collapsible, branding |
| `<TopBar>` | `components/layout/TopBar` | `title`, user menu, notifications |
| `<AppLayout>` | `components/layout/AppLayout` | Sidebar + TopBar + `<Outlet />` |

### Usage Example
```tsx
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/dialog/ConfirmDialog';

function MyPage() {
  const toast = useToast();
  const { confirm } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Student',
      message: 'This action cannot be undone.',
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (confirmed) {
      // proceed with delete
      toast.success('Student deleted.');
    }
  };

  return (
    <form>
      <FormInput label="Name" value={name} onChange={setName} error={errors.name} required />
      <Button variant="danger" onClick={handleDelete}>Delete</Button>
    </form>
  );
}
```

---

## Routing & Guards

### Route Structure
| Path | Page | Guard |
|---|---|---|
| `/login` | LoginPage | `PublicGuard` (redirects to `/` if authenticated) |
| `/forgot-password` | ForgotPasswordPage | `PublicGuard` |
| `/reset-password/:token` | ResetPasswordPage | `PublicGuard` |
| `/` | Dashboard | `AuthGuard` |
| `/students` | *(coming soon)* | `AuthGuard` |
| `/attendance` | *(coming soon)* | `AuthGuard` |
| `/timetable` | *(coming soon)* | `AuthGuard` |
| `/exams` | *(coming soon)* | `AuthGuard` |
| `/notices` | *(coming soon)* | `AuthGuard` |
| `/*` | 404 Not Found | None |

### Guard Components
- **`AuthGuard`** — Checks `isAuthenticated`. Shows `<Spinner>` while hydrating. Redirects to `/login` if not authenticated (preserves intended destination in `state.from`).
- **`PublicGuard`** — Redirects to `/` if already authenticated.
- **`RoleGuard`** — Checks `user.role` against an `allowedRoles` array. Renders 403 if unauthorized.

---

## State Management

### Server State (TanStack Query)
- All data fetched from APIs is managed by TanStack Query
- Global `QueryClient` in [`src/lib/queryClient.ts`](src/lib/queryClient.ts)
- 5-minute stale time, no refetch on window focus
- Smart retry: skips 4xx errors, retries 3 times for 5xx/network errors
- Global error caches: uncaught query/mutation errors → toast

### Client State (Zustand)

| Store | File | Persisted? | Purpose |
|---|---|---|---|
| `authStore` | `stores/authStore.ts` | ❌ (memory only) | User, permissions, auth status, hydration flag |
| `themeStore` | `stores/themeStore.ts` | ✅ (localStorage) | School branding (name, logo, accent color) |

---

## Validation

All form validation uses **Zod v4** schemas defined once per feature in a `schemas.ts` file.

### Rules
1. **Schemas mirror backend Bean Validation** — same field names, same constraints
2. **Client-side validates on blur + submit** via `validateField()` helper
3. **Server-side errors map to the same form inputs** — identical visual treatment
4. **Never trust client validation alone** — the server is the final gate

### Password Policy (default)
| Rule | Constraint |
|---|---|
| Minimum length | 8 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Digit | At least 1 |
| Special character | At least 1 |

---

## Error Handling

### Flow
```
API Error Response
    │
    ▼
Axios Interceptor (client.ts)
    │
    ├── 401 → Refresh token → Retry or redirect to /login
    │
    ├── fieldErrors present?
    │       ├── YES → Map onto <FormInput error="..."> props
    │       └── NO  → (skip)
    │
    └── message present?
            └── YES → Show via toast.error(message)
```

### Important
- A **server-side rejection** renders **identically** to a client-side validation failure — same `<FormInput>` component, same red border + red helper text, two different triggers.
- The `onFieldErrors` callback in mutation hooks bridges server errors into form state.

---

## Multi-Tenant Branding

### How it works
1. **Tenant identification**: Parsed from subdomain (`springfield.schoolconnect.app` → `springfield`)
2. **Branding fetch**: `GET /api/v1/branding/{tenantId}` on login success
3. **CSS variable injection**: `themeStore.setBranding()` calls `document.documentElement.style.setProperty()` to override `--brand-accent`, `--brand-accent-hover`, `--brand-accent-light`
4. **Persistence**: Branding cached in localStorage for instant load on return visits
5. **Fallback**: Default SchoolConnect indigo theme if branding fetch fails or no custom branding exists

### Affected elements
- Primary buttons, active sidebar links, focus rings
- School logo + name in sidebar header and login page
- Favicon (if provided by the tenant)

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| **Dev** | `npm run dev` | Start Vite dev server on port 5173 with HMR |
| **Build** | `npm run build` | Type-check with `tsc` then build for production |
| **Preview** | `npm run preview` | Preview the production build locally |
| **Type Check** | `npx tsc --noEmit` | Run TypeScript compiler without emitting files |

---

## Module Roadmap

| # | Module | Status | Description |
|---|---|---|---|
| 1 | **Authentication** | ✅ Done | Login, forgot password, reset password, session rehydration |
| 2 | **Dashboard** | 📋 Planned | Role-based landing pages with summary cards & charts |
| 3 | **Student Management** | 📋 Planned | CRUD data table, student profiles, bulk import |
| 4 | **Attendance** | 📋 Planned | Mark/view attendance, calendar views, reports |
| 5 | **Timetable** | 📋 Planned | Schedule management grid, period/class assignment |
| 6 | **Exams & Grades** | 📋 Planned | Exam CRUD, grade entry, report cards, analytics |
| 7 | **Notices** | 📋 Planned | Notice board, rich text, role/class targeting |

---

## Contributing

### Adding a New Feature Module

1. Create `src/features/<module-name>/` with:
   - `schemas.ts` — Zod validation schemas
   - `hooks/` — TanStack Query hooks
   - `pages/` — Page components + CSS Modules
   - `components/` — Module-specific components (if any)

2. Add API endpoint functions in `src/api/endpoints/<module-name>.ts`

3. Add route entries in `src/router/index.tsx`

4. Add navigation items in `src/components/layout/Sidebar.tsx` → `NAV_GROUPS`

### Code Standards
- **No inline hex colors or pixel values** — use design tokens
- **No raw fetch/axios in components** — use the API client + Query hooks
- **Every form field** gets both client-side (Zod) and server-side error display
- **Every "are you sure?"** uses `useConfirm()`, not a custom modal
- **Every success/error message** uses `useToast()`, not `alert()` or a custom banner
- **Skeleton loaders** for lists/cards, `<Spinner fullScreen>` only for blocking actions (login)
- **TypeScript strict mode** — no `any`, no untyped responses

---

## License

Proprietary — SchoolConnect. All rights reserved.
