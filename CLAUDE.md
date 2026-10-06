# BaruKerja web (`barukerja-web`) — project guide & improvement tracker

Next.js 16 (App Router) + React 19 + Tailwind v4 + base-ui/shadcn primitives.
Job board: seekers browse/apply/bookmark; employers post jobs and review
applicants. The API lives in a separate repo (`barukerja-api`, Express +
MongoDB) and is **reference only** for this work — do not change it from here;
record wanted API changes in `docs/BACKEND-SUGGESTIONS.md`.

> Keep this file current. After finishing any item below, tick it, add a line
> to the Progress log, and commit. It is the source of truth for "what's done
> and what's next".

## Commands

| | |
|---|---|
| `bun install` | install (a `bun.lock` is committed) |
| `bun dev` | dev server (needs `BACKEND_API_URL`, see `.env.example`) |
| `bun run typecheck` | `tsc --noEmit` — must be clean |
| `bun run lint` | ESLint — must be clean (0 errors, 0 warnings) |
| `bun run test:e2e` | Playwright smoke suite against a **mock API** (no DB needed). Sandboxes: `PW_CHROMIUM=/path/to/chromium bun run test:e2e` |

**Definition of done for any change:** typecheck clean, lint clean, e2e green,
and — for UI work — looked at in a browser at 375 px and 1280 px.

## How the app is wired (read before changing things)

- **Same-origin API proxy.** The browser only calls `/api/...` on this site;
  `next.config.ts` rewrites it to `${BACKEND_API_URL}/api/...` (server-side).
  `app/api/upload/route.ts` is the one real route handler (uploads to R2) and
  is *not* forwarded.
- **Auth.** Access token lives in memory only (`context/AuthContext.tsx`); the
  refresh token is an HttpOnly cookie. On load we silently refresh, decode the
  JWT for the user id, then `GET /users/:id`. `lib/api.ts` → `apiFetch` retries
  once after a `TOKEN_EXPIRED` 401 via a shared in-flight refresh.
  - Read the token at call time with `getAccessToken()`; **don't** list
    `accessToken` in effect dependencies (it changes every ~15 min and would
    refetch/unmount forms).
- **Data fetching.** Use `hooks/use-api-query.ts` (`useApiQuery(key, fetcher,
  {auth})`) for every read. It ignores superseded responses, waits for the
  session when `auth` is `"optional"`/`"required"`, dedupes StrictMode double
  effects, and derives loading state (no setState in effects). `key` must change
  whenever the request's inputs change. List hooks (`use-jobs`, `use-bookmarks`,
  …) are thin wrappers around it.
- **Shell.** `app/(app)/layout.tsx` → `AppShell` (top bar, one `max-w-3xl`
  column, mobile bottom tabs). Auth pages are outside the shell. Role-gated
  pages wrap their content in `<RequireAuth role=…>`.
- **Pagination** lives in the URL (`?page=`) via `usePageParam`;
  `useClampPage` steps back when the page no longer exists.

### Conventions introduced in Phase 1 (keep using them)

- **Errors in actions:** `try/catch` + `<InlineError>` (`role="alert"`); never
  leave an `await` in an event handler without a `catch`.
- **Destructive/irreversible actions** (withdraw, reject, delete): `ConfirmDialog`.
- **Rows that reference a job** (`bookmark.job`, `entry.job`, `application.job`)
  are typed `| null` — render `<DeletedJobNotice />` for null.
- **Post-sign-in redirect:** `safeNextPath()` (`lib/safe-redirect.ts`); only
  `app/auth/signin/page.tsx` navigates away after sign-in.
- **Opening a CV link:** `openUrlInNewTab()` (opens the tab synchronously so
  mobile Safari doesn't block it).
- **Select dropdowns:** pass `items={…labels}` to `<Select>` or the trigger
  shows the raw value (`full_time`).
- **Editing = send a diff.** The backend rejects an unchanged-but-expired
  deadline and can't clear several fields (see backend suggestions B5/B6).

### UI primitives — gotchas
- `Badge` draws no border/padding (just small caps text); `style.borderColor`
  has no effect.
- `Button` is square-cornered, uppercase, `text-xs`; `sm` is 36 px tall.
- `Input`/`Textarea`/`SelectTrigger` are underline-style. `Textarea` uses
  `field-sizing-content`, so `rows` is ignored (min height 64 px).
- Tailwind v4 `divide-y` already adds borders — don't add `border-t` too.
- Design tokens are CSS variables in `app/globals.css` (`--color-bg`,
  `--color-text`, `--color-text-muted`, `--color-border`, `--color-brand`,
  `--color-highlight`, `--color-danger`); shadcn tokens map onto them. Fonts:
  Atkinson Hyperlegible (body), Archivo (headings). Dark-mode tokens exist but
  nothing applies the `.dark` class yet.

## Plan & progress

Findings come from a read-through of both repos plus running the app against a
mock API in Chromium at 375 px and 1280 px (2026-10-03). Status: ☐ todo,
☑ done.

### Phase 0 — Safety net ☑
- ☑ Baseline commit, `tsc` clean, ESLint baseline recorded (12 errors, all
  `set-state-in-effect` in fetching code).
- ☑ `e2e/` Playwright suite + stateful mock API (`e2e/mock-api.mjs`). Written
  against *correct* behaviour: **16 failed / 6 passed on the original code**;
  now 22/22.

### Phase 1 — Crashes, data loss, wrong behaviour ☑ (2026-10-04)
- ☑ P1-01 Null `job` in bookmarks/history/applications crashed the page → `DeletedJobNotice`, types `| null`.
- ☑ P1-02 `?next=` ignored after sign-in (two competing redirects) + `//host` open-redirect shape → `safeNextPath`, single redirect point. `RequireAuth` no longer adds a stale `?next=` on sign-out.
- ☑ P1-03 `apiFetch`/`uploadFile` crashed on non-JSON (502 HTML, 413, 204) and on network failure → defensive parsing + friendly messages.
- ☑ P1-04 Nine copy-pasted fetch hooks → one `useApiQuery`: no stale-response overwrite (search), no anonymous+authenticated double fetch, no refetch on token refresh. Fixed all 12 lint errors.
- ☑ P1-05 Token refresh while editing/applying reloaded the page and wiped the form (job detail, edit job).
- ☑ P1-06 Actions failed silently (remove/withdraw/delete/status/CV/bookmark) → inline errors; Withdraw / Reject / Delete ask for confirmation; Remove can't be double-fired (it toggles!).
- ☑ P1-07 Removing the last item on the last page left an empty page → `useClampPage`.
- ☑ P1-08 "View CV" blocked as popup on mobile Safari → `openUrlInNewTab`.
- ☑ P1-09 Draft / past-deadline jobs showed Apply → disabled with reason; Draft badge.
- ☑ P1-10 Job form: dropdowns showed raw enum values; deadline picker allowed "today" (API rejects); editing an expired job always failed; clearing fields did nothing; >10 KB body gave a cryptic 413 → labels, tomorrow-min, diff payload, clear `location`, explicit message for fields the API can't clear, size guard.
- ☑ P1-11 Company form: emptied description/website/location weren't cleared.
- ☑ P1-12 Search typing pushed a history entry / stale `?page=`; now `replace`.
- ☑ P1-13 `error.tsx` boundaries (app + shell) so a render error doesn't blank the page.
- ☑ Backend change ideas written down: `docs/BACKEND-SUGGESTIONS.md` (B1–B12).

### Phase 2 — UI & responsive polish ☐ (CSS/markup only; screenshot before/after)
- ☑ P2-01 Horizontal overflow on mobile (and desktop for a long title): add `min-w-0 break-words` to flex text columns in `job-card`, list rows, applicants (long email), company page, job detail heading, status badges.
- ☑ P2-02 Double 2 px dividers: drop the manual `border-t` where `divide-y` is used; remove `px-1` indent on `JobCard` (4 px misaligned with headings).
- ☑ P2-03 Signup: "Confirm Password" wraps and misaligns the two inputs at 375 px (stack on mobile / shorter label).
- ☑ P2-04 Job form: 3-column salary row cramped at 375 px; description box ignores `rows` (64 px) → set a real `min-h`.
- ☑ P2-05 `viewport-fit=cover` (Next `viewport` export) so the bottom nav's `safe-area-inset-bottom` works; recheck `pb-24` content padding.
- ☑ P2-06 Tap targets: header links/Sign out are ~20 px tall → ≥ 40 px hit area.
- ☐ P2-07 (deferred — design call, not a bug) Radius consistency (square buttons/inputs vs `rounded-md` cards/links) — pick one language.
- ☑ P2-08 `SiteLoader`: full-screen overlay with "still connecting to the database…" on every guard → inline variant + neutral copy.
- ☑ P2-09 Per-page `<title>`s (everything is "BaruKerja"), `not-found.tsx`, `loading.tsx`.
- ☑ P2-10 Status colours/labels duplicated in 4 pages → shared module/tokens; `Badge` border props are dead.
- ☑ P2-11 Job description: render paragraphs/bullets nicely (currently `whitespace-pre-wrap` raw text).
- ☑ P2-12 Re-run screenshot sweep at 375 / 768 / 1280.

### Phase 3 — Hardening & cleanup ☑
- ☑ P3-01 `/api/upload`: require a valid access token, derive extension from validated MIME, wrap `formData()` in try/catch, clear 413/400s; warn client-side above ~4.5 MB on Vercel (or move to presigned uploads — backend B4).
- ☑ P3-02 Use the `user` already returned by signin/signup (skip the extra `GET /users/:id`).
- ☑ P3-03 Debounce job search (~300 ms).
- ☑ P3-04 Signup password hint: backend also requires a lowercase letter.
- ☑ P3-05 ApplyForm re-uploads the CV on every retry after a failed submit (orphan files) → reuse the uploaded key.
- ☑ P3-06 Company page: saving an existing company redirects to `/dashboard/jobs` — confirm intent.
- ☑ P3-07 Remove dead code: unused `public/*.svg`, `components/ui/sonner` (no Toaster mounted) or mount it, dark tokens (or add a theme provider), self-referential `--font-sans: var(--font-sans)` in `globals.css`.
- ☑ P3-08 Rewrite `README.md` (still describes a "reading platform"); fix stale comments in `types/user.ts` (signin *does* return `user`).
- ☑ P3-09 Accessibility pass: duplicate `<h1>` on auth pages, focus after dialogs, label associations.

### Out of scope here (API repo) — see `docs/BACKEND-SUGGESTIONS.md`
Email exposure (B1), draft jobs public (B2), orphans on user delete (B3), upload
auth/presign (B4), clearing fields (B5), deadline semantics (B6), body-size
limit (B7), rate limiter (B8), refresh revocation (B9), owner views (B10),
"already applied" (B11), message consistency (B12).

### Phase 2 notes
- `components/site-loader.tsx` must stay `"use client"` (used from the server component `app/(app)/loading.tsx`; the icon lib breaks otherwise).
- Shared: `lib/job-format.ts`, `lib/status.ts` + `StatusBadge`, `JobDescription`, `hooks/use-document-title.ts` (call in every page), `app/not-found.tsx`.
- Long text in flex rows needs `min-w-0` + `wrap-anywhere`; don't combine `divide-y` with `border-t`.
- `node e2e/screenshots.mjs [outDir] [baseURL]` (with `PW_CHROMIUM`) sweeps 15 pages x 375/768/1280 and fails on horizontal overflow; e2e also has overflow tests at 375 px.

### Phase 3 notes
- `/api/upload` needs a Bearer token (structural + expiry check only — no secret here; real enforcement = backend B4). `uploadFile(file, kind, accessToken)`. Extension comes from the MIME type; oversize → 413.
- signin/signup return `user`; refresh does not (`AuthResponse.user` optional).
- `--font-sans: var(--font-sans)` in globals.css is intentional (next/font runtime var) — do not remove.
- P3-06: company edit now stays on the page ("saved" message); first-time create still goes to `/dashboard/jobs`. Revert if you wanted the redirect on edit.
- P3-07: removed unused `public/*.svg`, `components/ui/sonner.tsx`, and the `sonner`/`next-themes` deps; `.dark` tokens left in place (harmless, no theme switcher).
- P3-09: duplicate `<h1>` on auth pages fixed (wordmark is a `<p>`); all labels already had `htmlFor`.

## Progress log
- 2026-10-03 — Review of both repos; screenshots + behaviour checks against a mock API (findings above).
- 2026-10-03 — Phase 0 done: baseline commit, e2e suite (16 red on original code).
- 2026-10-04 — Phase 1 done: `useApiQuery`, safe redirect, confirm dialogs, null-job guards, job/company form fixes, error boundaries. typecheck + lint clean, e2e 22/22. Added `docs/BACKEND-SUGGESTIONS.md` and this file.
- 2026-10-04 — Phase 2 done (P2-07 deferred): overflow 11 → 0 page/width combos, titles, shared status/format helpers, loader, not-found. typecheck + lint clean, e2e 29/29. `next build` unverifiable in sandbox (Google Fonts blocked) — run it locally.
- 2026-10-05 — Phase 3 done: upload hardening, user from signin, debounced search, apply-retry reuse, README rewrite, dead code removed. typecheck + lint clean, e2e 33/33.
- 2026-10-05 — Follow-ups: "already applied" state on job detail (`use-existing-application`, looks through /applications/mine), `/account` page (edit profile, change password, delete account) + header "Account" link, e2e 36/36. First-time e2e setup on a new machine: `npx playwright install chromium`. CV "File storage is not configured" is an API env issue (see README / BACKEND-SUGGESTIONS), not a frontend bug.
- 2026-10-06 — Cold-start page: `lib/server-wakeup.ts` (tracks in-flight `apiFetch` calls) + `components/server-wakeup-notice.tsx` mounted in the root layout; shows a full-screen "Waking up the server…" after 3 s of waiting, hides when the API answers. e2e 38/38.
