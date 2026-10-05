# BaruKerja — web

Job board frontend: seekers browse and apply to jobs, bookmark them and track
applications; employers manage a company profile, post jobs and review
applicants. Built with Next.js 16 (App Router), React 19, TypeScript,
Tailwind CSS v4 and shadcn/base-ui primitives. The backend lives in a separate
repo (`barukerja-api`, Express + MongoDB).

See `CLAUDE.md` for architecture notes, conventions and the improvement plan,
and `docs/BACKEND-SUGGESTIONS.md` for suggested API changes.

## Getting started

```bash
cp .env.example .env.local   # fill in BACKEND_API_URL and CLOUDFLARE_R2_*
npm install
npm run dev                  # http://localhost:3000
```

| Script                            | What it does                                       |
| --------------------------------- | -------------------------------------------------- |
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve             |
| `npm run lint`                    | ESLint                                             |
| `npm run typecheck`               | `tsc --noEmit`                                     |
| `npm run test:e2e`                | Playwright against a mock API (`e2e/mock-api.mjs`) |

## How it works

- The browser calls `/api/...` on this site; `next.config.ts` rewrites it to
  `BACKEND_API_URL`. `/api/upload` is a local route handler that writes to
  Cloudflare R2 (the credentials never reach the browser).
- The access token is kept in memory only; the refresh token is an HttpOnly
  cookie set by the API. `lib/api.ts` retries once after a silent refresh.
- Data fetching goes through `hooks/use-api-query.ts`.

## Structure

```text
app/(app)/          jobs, companies, bookmarked, history, applications, dashboard/*
app/auth/           signin, signup
app/api/upload/     R2 upload route
components/         feature components; ui/ holds primitives
hooks/              data hooks (use-api-query and wrappers)
lib/                api client, per-resource api modules, helpers
e2e/                Playwright tests, mock API, screenshot sweep
```
