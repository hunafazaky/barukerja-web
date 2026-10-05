# BaruKerja

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

BaruKerja is a job board web app for two audiences: job seekers and employers.
Candidates can discover roles, save interesting jobs, upload a CV, and track their
applications. Employers can create a company profile, post jobs, and review
applicants from a dedicated dashboard.

This repo contains the Next.js frontend only. The API runs in the separate
`barukerja-api` project (Express + MongoDB) and is treated as a backend dependency
for this app.

---

## Table of contents

- [About the project](#about-the-project)
- [Core features](#core-features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Architecture notes](#architecture-notes)
- [Backend suggestions](#backend-suggestions)
- [License](#license)

---

## About the project

BaruKerja is designed to feel like a modern mobile-first job board while still
working well on desktop. The app uses a server-side proxy layer so the browser
never calls the backend directly, and the frontend keeps auth and refresh flow
inside the app shell.

The product spans three main user journeys:

- Job seekers can browse and filter jobs, bookmark roles, view details, and apply
  with a CV.
- Employers can create or edit a company profile, publish vacancies, and review
  incoming applications.
- Both roles can manage account state with a clean dashboard and responsive layout.

---

## Core features

- Job search and discovery with filtering and paginated results.
- Detailed job pages with company context, deadlines, salary info, and role status.
- Save-to-bookmarks and recent job history for candidates.
- Application flow with CV upload and status tracking.
- Employer dashboard for company and job management.
- Applicant review and job status updates for employers.
- Signup/signin flow with token refresh handling and protected routes.
- Mobile-friendly interface with a bottom navigation and responsive breakpoints.
- Upload support for CVs via a local `/api/upload` route that forwards to a
  Cloudflare R2-backed backend flow.

---

## Tech stack

- Framework: Next.js 16 (App Router)
- UI: React 19 + Tailwind CSS v4
- Styling: shadcn/base-ui primitives + custom design tokens
- Language: TypeScript
- API/client layer: custom fetch wrapper + reusable hooks
- Testing: Playwright + mock API for end-to-end checks
- Package manager: Bun
- Backend: separate `barukerja-api` (Express + MongoDB)

---

## Project structure

```text
.
├── app/
│   ├── (app)/            # main app shell, jobs, bookmarks, history, applications
│   ├── auth/             # sign in / sign up pages
│   ├── api/upload/       # local upload route
│   ├── globals.css      # global styles and design tokens
│   ├── layout.tsx       # root layout
│   ├── page.tsx         # landing / entry page
│   └── not-found.tsx    # app-level not found page
├── components/
│   ├── ui/              # reusable primitives
│   └── ...              # feature components for jobs, forms, dashboards, lists
├── e2e/
│   ├── mock-api.mjs     # mock backend for E2E tests
│   └── ...              # smoke tests and screenshot sweep
├── hooks/
│   └── use-api-query.ts # shared data fetching helper
├── lib/
│   ├── api.ts           # fetch + auth logic
│   ├── ...              # API modules, utilities, and formatting helpers
│   └── safe-redirect.ts # next-path redirect helpers
├── docs/
│   ├── BACKEND-SUGGESTIONS.md
│   └── ...
├── .env.example         # env template
├── next.config.ts       # proxy rewrites for backend calls
├── package.json         # scripts and dependencies
├── bun.lock             # Bun lockfile
├── LICENSE              # MIT license
├── README.md            # project documentation
└── tsconfig.json
```

---

## Getting started

### Prerequisites

Make sure you have:

- Node.js 20+
- Bun
- A running `barukerja-api` backend
- Access to a Cloudflare R2 bucket for CV uploads if you want local file upload
  flow to work end-to-end

### 1) Install dependencies

```bash
bun install
```

### 2) Set up environment variables

Copy the sample env file and fill in the required values:

```bash
cp .env.example .env.local
```

Example values:

```env
BACKEND_API_URL=https://your-api-domain.example.com
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=...
CLOUDFLARE_R2_PUBLIC_URL=https://your-r2-public-url.example.com
```

> `BACKEND_API_URL` is the real API origin without `/api` at the end. The browser
> still calls the app on the same site (`/api/...`), and `next.config.ts` forwards
> those requests to the backend.

### 3) Run the app

```bash
bun dev
```

The app is typically available at:

```text
http://localhost:3000
```

---

## Available scripts

```bash
bun dev
bun run lint
bun run typecheck
bun run test:e2e
```

| Command | Description |
| --- | --- |
| `bun dev` | Start the Next.js development server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript validation (`tsc --noEmit`) |
| `bun run test:e2e` | Run Playwright smoke tests against the mock API |

If this is your first time running Playwright on a new machine:

```bash
npx playwright install chromium
```

---

## Architecture notes

- The browser calls `/api/...` on the same origin; `next.config.ts` rewrites it to
  the configured backend URL.
- Auth tokens are handled in memory on the client, while refresh tokens stay in an
  HttpOnly cookie.
- Data fetching is centralized in `hooks/use-api-query.ts` so reads are deduped,
  protected against stale responses, and avoid unnecessary refetches.
- The app uses a role-aware shell and protected routes for employer-only or
  authenticated-only flows.
- Uploading CVs relies on a server-side path and API-provided signed URLs for the
  final storage layer.

---

## Backend suggestions

The frontend project intentionally keeps the API in a separate repository. For
backend improvement notes, see:

- `docs/BACKEND-SUGGESTIONS.md`

This file records API-side concerns that affect the frontend experience, such as
upload auth, data clearing semantics, deadline handling, and public/private access
rules.

---

## License

This project is distributed under the MIT License. See the [LICENSE](LICENSE)
file for more information.

---
