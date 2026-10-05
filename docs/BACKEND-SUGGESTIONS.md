# Backend suggestions (barukerja-api)

Collected while reviewing `barukerja-web` on 2026-10-03/04. **Nothing here has
been changed in the API** — the frontend work only used the backend as a
reference. Each item says what the API does today (with the file), what a
future change could be, and what the frontend does in the meantime so nothing
is blocked on it.

Priority: **H** = affects security/privacy or loses data, **M** = causes
user-visible bugs or forces workarounds, **L** = polish / nice to have.

| #   | Pri | Area         | Summary                                                           |
| --- | --- | ------------ | ----------------------------------------------------------------- |
| B1  | H   | Privacy      | Public user endpoints return every user's email                   |
| B2  | H   | Data         | Draft/closed jobs are readable by anyone with the link            |
| B3  | H   | Data         | Deleting a user leaves dangling bookmarks/history/applications    |
| B4  | H   | Security     | Frontend `/api/upload` has no auth; uploads belong behind the API |
| B5  | M   | Jobs         | PATCH can't clear `experience_level`, salary, currency, deadline  |
| B6  | M   | Jobs         | Deadline semantics (date-only = midnight UTC)                     |
| B7  | M   | Platform     | 10kb JSON body limit vs. job descriptions                         |
| B8  | M   | Auth         | Rate limiter is in-memory and may key on the proxy's IP           |
| B9  | M   | Auth         | Refresh token is never revoked                                    |
| B10 | L   | Jobs         | Owner viewing their own job inflates `view_count` / history       |
| B11 | L   | Applications | No way to know "already applied" before uploading a CV            |
| B12 | L   | API          | Mixed Indonesian/English messages; list totals vs. null refs      |

---

## B1 (H) Public user endpoints expose email addresses

- **Today:** `GET /api/users/:id` and `GET /api/users` are public
  (`routes/user.routes.ts`) and return the whole user document minus the
  password (`controllers/user.controller.ts` → `findOne`, `findAll`). That
  includes `email`.
- **Suggest:** return a public shape (`id, display_name, photo, bio, role`)
  unless the caller _is_ that user. Consider requiring auth for the list.
- **Frontend meanwhile:** only reads `/users/:id` for the signed-in user's own
  profile after sign-in/refresh, so it keeps working after the change. (It
  could also use the `user` object signin/signup already return — see B12/P3.)

## B2 (H) Draft and closed jobs are public by URL

- **Today:** `services/job.service.ts` → `getJobById` has no status check, so
  `GET /api/jobs/:id` returns drafts (and counts a view / writes history for
  them). The _list_ correctly filters `status: 'open'` and unexpired deadlines.
- **Suggest:** drafts → 404 unless `posted_by === caller`. Closed jobs can stay
  readable (applicants/bookmarkers still want to see them).
- **Frontend meanwhile:** the job page shows a "Draft" badge and never offers
  Apply for draft/closed/expired jobs (Phase 1, `getApplyState`).

## B3 (H) Deleting a user leaves orphans

- **Today:** `services/user.service.ts` → `deleteUser` removes the user, their
  `Job`s, and the user's _own_ History and Bookmarks. It does **not** remove
  other people's Bookmarks/History/Applications that point at those jobs, nor
  the user's Company. Mongoose then populates `job: null` in other users'
  `/bookmarks`, `/history`, `/applications/mine`.
  (`job.service.deleteJob` does clean up History/Bookmarks, so only the
  account-deletion path is affected.)
- **Suggest:** on account deletion, for each of the user's jobs delete its
  History/Bookmarks and close-or-delete its Applications (same rule as
  `deleteJob`), and delete the Company. Filter null refs in list endpoints
  and keep `total` consistent.
- **Frontend meanwhile:** all three list pages render a "This job is no longer
  available" row instead of crashing (Phase 1).

## B4 (H) Move uploads behind the API (or authenticate the Next route)

- **Today:** the Next route `app/api/upload/route.ts` accepts any POST — no
  sign-in — and writes to R2 with the server's credentials. It trusts the
  client-supplied MIME type and takes the file extension from the filename. On
  Vercel, request bodies over ~4.5 MB are rejected before reaching the route
  although the UI allows 5 MB images / 10 MB PDFs.
- **Suggest:** an authenticated API endpoint that returns a **presigned PUT
  URL** (key chosen server-side, content-type + size pinned in the signature);
  the browser uploads straight to R2. Fixes auth, the size limit, and keeps CV
  keys under the API's control (it already signs CV _downloads_ in
  `utils/r2Client.ts`). The R2 bucket needs a CORS rule for the site origin.
- **Frontend meanwhile:** Phase 3 adds a token check to the route, derives the
  extension from the validated MIME type, and shows a clear message for
  oversize files. Phase 1 already makes `uploadFile` survive non-JSON errors.

## B5 (M) PATCH /jobs/:id can't clear optional fields

- **Today:** `utils/validationSchemas.ts` → `jobUpdateSchema`: `location`
  allows `''`, but `experience_level` is `Joi.string().trim()` (rejects `''`),
  and `salary_min`, `salary_max`, `currency`, `deadline` don't allow `null` or
  `''`. `job.service.updateJob` also skips `undefined` fields. Result: once set,
  these can never be removed.
- **Suggest:** `.allow('', null)` on those fields and `$unset` on null.
- **Frontend meanwhile:** the edit form sends only changed fields, sends
  `location: ""` to clear a location, and for the five non-clearable fields
  shows "X can't be removed once it's set" instead of silently keeping the old
  value. When this is fixed, delete `NON_CLEARABLE` in `components/job-form.tsx`.

## B6 (M) Deadline semantics

- **Today:** `deadline: Joi.date().greater('now')`. A date-only value from an
  `<input type="date">` parses as **midnight UTC** of that day, so (a) "today" is
  always rejected, (b) a job disappears from the list (`listJobs`: deadline
  `$gte now`) at 00:00 UTC — 07:00 in Jakarta — on its deadline day, not at the
  end of it, and (c) any edit re-validates an unchanged, already-passed deadline
  and fails.
- **Suggest:** decide the intended meaning (end of the deadline day in a fixed
  timezone, e.g. Asia/Jakarta) and store/compare that; only validate
  `greater('now')` when the deadline is _changing_ (create, or value differs).
- **Frontend meanwhile:** the date picker starts at tomorrow; edits never
  re-send an unchanged deadline.

## B7 (M) 10 kb JSON body limit

- **Today:** `server.ts` → `express.json({ limit: '10kb' })`. A long job
  description returns a bare 413 "request entity too large"; the schemas have
  no `max()` on `title`/`description`/`location`/etc.
- **Suggest:** add explicit `max()` limits in Joi (so the message is friendly)
  and raise the body limit for job routes, or keep 10 kb and document the max.
- **Frontend meanwhile:** the job form checks the payload size (~9.5 KB) before
  sending and explains the limit.

## B8 (M) Rate limiter

- **Today:** `utils/rateLimiter.ts` keeps counters in a process-local `Map`
  (resets on deploy, not shared across instances) and keys on `req.ip`
  (`app.set('trust proxy', 2)`). Behind Vercel's rewrite → Render the client IP
  must come from `X-Forwarded-For`; if the hop count is wrong, every visitor
  shares one IP key and five failed logins by anyone lock out everyone.
  Attempts are counted _before_ the password is checked (successes reset it).
- **Suggest:** verify what `req.ip` really is in production (log it once), use a
  shared store (Mongo TTL collection / Redis), and key on email + IP separately.
- **Frontend meanwhile:** shows the API's message as-is.

## B9 (M) Refresh tokens can't be revoked

- **Today:** `signout` only clears the cookie; the refresh JWT stays valid for
  7 days and is not rotated or stored (`jwtHelper`, `user.service`
  `renewUserTokens`).
- **Suggest:** store a hash of the current refresh token (or a per-user token
  version) and rotate on refresh; invalidate on signout/password change.
- **Frontend meanwhile:** nothing needed; `lib/api.ts` already shares one
  in-flight refresh and tolerates failure.

## B10 (L) Owners' own views count

- **Today:** `getJobById` increments `view_count` and writes History for any
  signed-in first-time viewer, including the employer opening their own job —
  and the edit page has no other endpoint to load a job from.
- **Suggest:** skip both when `posted_by === caller`; or add a side-effect-free
  `GET /jobs/mine/:id`.

## B11 (L) "Already applied?" is only known after submitting

- **Today:** a duplicate application returns 409 _after_ the CV has been
  uploaded (leaving an orphan file in R2); `GET /jobs/:id` has no hint.
- **Suggest:** include `has_applied` (or the application id/status) in
  `GET /jobs/:id` for a signed-in seeker. Optionally a cleanup job for
  unreferenced `applications/cvs/*` keys.

## B12 (L) Consistency

- Messages mix Indonesian (rate limiter) and English (everything else).
- `POST /users/signin|signup` already return `user` (the web types say they
  don't) — worth documenting so the client can skip the extra `GET /users/:id`.
- List endpoints can contain null refs (B3); make `total` reflect what is
  returned.
