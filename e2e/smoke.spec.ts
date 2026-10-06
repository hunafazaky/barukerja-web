import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const MOCK = "http://localhost:8099";
type LogEntry = { method: string; path: string; query: string; body: Record<string, unknown> };

const getLog = async (): Promise<LogEntry[]> => (await fetch(`${MOCK}/__log`)).json();
const count = async (method: string, pathRe: RegExp) =>
  (await getLog()).filter((e) => e.method === method && pathRe.test(e.path)).length;

async function signedIn(context: BrowserContext, role: "seeker" | "employer") {
  await context.addCookies([{ name: "refreshToken", value: role, url: "http://localhost:3100" }]);
}

test.beforeEach(async () => {
  await fetch(`${MOCK}/__reset`, { method: "POST" });
});

// ---------------------------------------------------------------- browsing
test.describe("browse", () => {
  test("lists open jobs and hides drafts / expired", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "Senior Backend Engineer" })).toBeVisible();
    await expect(page.getByText("Designer")).toHaveCount(0); // draft
    await expect(page.getByRole("heading", { name: "Cashier" })).toHaveCount(0); // deadline passed
  });

  test("search shows results for the LAST query, not a stale slower one", async ({ page }) => {
    await page.goto("/jobs");
    await page.getByRole("searchbox").click();
    await page.keyboard.type("ar", { delay: 30 }); // "a" answers in 700ms, "ar" in 80ms
    await page.waitForTimeout(1500);
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Barista" })).toBeVisible();
  });

  test("a non-JSON 502 shows a friendly error, not a JSON parse error", async ({ page }) => {
    await page.goto("/jobs");
    await page.getByRole("searchbox").fill("boom");
    await expect(page.getByText(/try again/i).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/unexpected token|JSON/i);
  });

  test("signed-in visitors fetch the job list exactly once", async ({ page, context }) => {
    await signedIn(context, "seeker");
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "Senior Backend Engineer" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(await count("GET", /^\/api\/jobs$/)).toBe(1);
  });
});

// -------------------------------------------------------------------- auth
test.describe("sign-in redirect", () => {
  async function signIn(page: Page, next: string) {
    await page.goto(`/auth/signin?next=${encodeURIComponent(next)}`);
    await page.fill("#email", "seeker@test.dev");
    await page.fill("#password", "Passw0rd!");
    await page.click("button[type=submit]");
  }
  test("honours ?next=", async ({ page }) => {
    await signIn(page, "/applications");
    await expect(page).toHaveURL(/\/applications$/);
  });
  test("ignores protocol-relative / external next values", async ({ page }) => {
    await signIn(page, "//example.org/x");
    await expect(page).toHaveURL(/localhost:3100\/jobs$/);
  });
  test("RequireAuth sends signed-out users to sign-in with next", async ({ page }) => {
    await page.goto("/applications");
    await expect(page).toHaveURL(/\/auth\/signin\?next=%2Fapplications/);
  });
});

// --------------------------------------------------------------- job detail
test.describe("job detail", () => {
  test("open job: seeker can apply (upload + create)", async ({ page, context }) => {
    await signedIn(context, "seeker");
    await page.route("**/api/upload", (r) => r.fulfill({ json: { key: "applications/cvs/x.pdf" } }));
    await page.goto("/jobs/job-1");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await page.setInputFiles("#cv-upload", { name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
    await page.getByRole("button", { name: /submit application/i }).click();
    await expect(page.getByText(/application submitted/i)).toBeVisible();
    expect(await count("POST", /^\/api\/applications$/)).toBe(1);
  });
  for (const [label, id] of [["draft", "job-6"], ["past-deadline", "job-5"]] as const) {
    test(`${label} job has no Apply button`, async ({ page, context }) => {
      await signedIn(context, "seeker");
      await page.goto(`/jobs/${id}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("button", { name: "Apply", exact: true })).toHaveCount(0);
      await expect(page.getByText(/not accepting|closed|deadline/i).first()).toBeVisible();
    });
  }
});

// ------------------------------------------------------------ seeker lists
test.describe("seeker pages", () => {
  test("bookmarked: a deleted job does not crash the page", async ({ page, context }) => {
    await signedIn(context, "seeker");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/bookmarked");
    await expect(page.getByText("Senior Backend Engineer")).toBeVisible();
    await expect(page.getByText(/no longer available/i)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("bookmarked: double-clicking Remove toggles only once", async ({ page, context }) => {
    await signedIn(context, "seeker");
    await page.goto("/bookmarked");
    const btn = page.getByRole("button", { name: "Remove" });
    await btn.dblclick({ delay: 10 });
    await page.waitForTimeout(800);
    expect(await count("POST", /bookmarks\/toggle/)).toBe(1);
    await expect(page.getByText("Senior Backend Engineer")).toHaveCount(0);
  });

  test("history: a deleted job does not crash the page", async ({ page, context }) => {
    await signedIn(context, "seeker");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/history");
    await expect(page.getByText("Barista")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("applications: orphaned application does not crash; withdraw asks to confirm", async ({ page, context }) => {
    await signedIn(context, "seeker");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/applications");
    await expect(page.getByText("Locked Posting")).toBeVisible();
    expect(errors).toEqual([]);
    const card = page.getByTestId("application-app-locked");
    await card.getByRole("button", { name: "Withdraw" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
    expect(await count("DELETE", /^\/api\/applications\//)).toBe(0);
  });

  test("applications: a failing withdraw shows the backend message", async ({ page, context }) => {
    await signedIn(context, "seeker");
    await page.goto("/applications");
    const card = page.getByTestId("application-app-locked");
    await card.getByRole("button", { name: "Withdraw" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /withdraw/i }).click();
    await expect(page.getByText(/can no longer be withdrawn/i)).toBeVisible();
  });

  test("applications: withdrawing the last item on the last page steps back a page", async ({ page, context }) => {
    await signedIn(context, "seeker");
    await page.goto("/applications?page=2");
    await expect(page.getByText("Last Page Job")).toBeVisible();
    await page.getByRole("button", { name: "Withdraw" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /withdraw/i }).click();
    await expect(page.getByText("Locked Posting")).toBeVisible(); // page 1 content
    await expect(page.getByText(/haven.t applied/i)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------- employer
test.describe("employer pages", () => {
  test("rejecting an applicant needs confirmation", async ({ page, context }) => {
    await signedIn(context, "employer");
    await page.goto("/dashboard/jobs/job-1/applicants");
    await page.getByRole("button", { name: /mark as rejected/i }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
    expect(await count("PATCH", /status$/)).toBe(0);
    await page.getByRole("button", { name: /mark as rejected/i }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /reject/i }).click();
    await expect.poll(() => count("PATCH", /status$/)).toBe(1);
  });

  test("marking as reviewed needs no confirmation", async ({ page, context }) => {
    await signedIn(context, "employer");
    await page.goto("/dashboard/jobs/job-1/applicants");
    await page.getByRole("button", { name: /mark as reviewed/i }).click();
    await expect.poll(() => count("PATCH", /status$/)).toBe(1);
  });

  test("job form dropdowns show labels, not raw enum values", async ({ page, context }) => {
    await signedIn(context, "employer");
    await page.goto("/dashboard/jobs/new");
    const triggers = page.locator("[data-slot=select-trigger]");
    await expect(triggers.nth(0)).toHaveText(/On-site/);
    await expect(triggers.nth(1)).toHaveText(/Full-time/);
    await expect(triggers.nth(2)).toHaveText(/Open/);
  });

  test("editing a job whose deadline already passed only sends what changed", async ({ page, context }) => {
    await signedIn(context, "employer");
    await page.goto("/dashboard/jobs/job-7/edit");
    await page.fill("#job-title", "Old Posting v2");
    await page.fill("#job-location", ""); // cleared on purpose
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/jobs$/);
    const patch = (await getLog()).find((e) => e.method === "PATCH" && e.path === "/api/jobs/job-7")!;
    expect(patch.body.title).toBe("Old Posting v2");
    expect(patch.body.location).toBe("");
    expect("deadline" in patch.body).toBe(false);
  });

  test("a mid-submit token refresh does not reload (and wipe) the edit form", async ({ page, context }) => {
    await signedIn(context, "employer");
    await page.goto("/dashboard/jobs/job-7/edit");
    await page.fill("#job-title", "Typed text");
    await fetch(`${MOCK}/__expire-next-patch`, { method: "POST" });
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/jobs$/);
    expect(await count("POST", /users\/refresh$/)).toBeGreaterThanOrEqual(1);
    expect(await count("GET", /^\/api\/jobs\/job-7$/)).toBe(1);
    expect(await count("PATCH", /^\/api\/jobs\/job-7$/)).toBe(2); // 401 then retried once
  });

  test("deleting a job asks to confirm", async ({ page, context }) => {
    await signedIn(context, "employer");
    await page.goto("/dashboard/jobs");
    await page.getByRole("button", { name: "Delete" }).first().click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
    expect(await count("DELETE", /^\/api\/jobs\//)).toBe(0);
  });
});

test.describe("responsive", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const pages: Array<[string, "seeker" | "employer" | null]> = [
    ["/jobs", null],
    ["/jobs/job-3", null],
    ["/companies/company-3", null],
    ["/applications", "seeker"],
    ["/dashboard/jobs", "employer"],
    ["/dashboard/jobs/job-1/applicants", "employer"],
    ["/auth/signup", null],
  ];

  for (const [path, role] of pages) {
    test(`no horizontal overflow: ${path}`, async ({ page, context }) => {
      if (role) await signedIn(context, role);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const { sw, cw } = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      expect(sw).toBeLessThanOrEqual(cw);
    });
  }
});

test.describe("phase 3", () => {
  test("upload route rejects anonymous requests", async ({ request }) => {
    const res = await request.post("/api/upload", { multipart: { kind: "cv", file: { name: "a.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") } } });
    expect(res.status()).toBe(401);
  });

  test("search is debounced: typing fast sends one query", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");
    const before = (await getLog()).filter((e) => e.method === "GET" && e.path === "/api/jobs").length;
    await page.getByRole("searchbox").click();
    await page.keyboard.type("barista", { delay: 40 });
    await page.waitForTimeout(1200);
    const after = (await getLog()).filter((e) => e.method === "GET" && e.path === "/api/jobs").length;
    expect(after - before).toBe(1);
  });

  test("sign-in uses the returned user (no extra profile fetch)", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("seeker@example.com");
    await page.getByLabel(/password/i).fill("Passw0rd1");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/jobs/);
    expect(await count("GET", /^\/api\/users\/[\w-]+$/)).toBe(0);
  });

  test("retrying a failed application reuses the uploaded CV", async ({ page, context }) => {
    await signedIn(context, "seeker");
    let uploads = 0;
    await page.route("**/api/upload", (r) => { uploads++; return r.fulfill({ json: { key: "applications/cvs/x.pdf" } }); });
    let posts = 0;
    await page.route("**/api/applications", (r) => {
      if (r.request().method() !== "POST") return r.fallback();
      posts++;
      return posts === 1 ? r.fulfill({ status: 500, json: { message: "Boom" } }) : r.fallback();
    });
    await page.goto("/jobs/job-1");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await page.setInputFiles("#cv-upload", { name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
    await page.getByRole("button", { name: /submit application/i }).click();
    await expect(page.getByText("Boom")).toBeVisible();
    await page.getByRole("button", { name: /submit application/i }).click();
    await expect(page.getByText(/application submitted/i)).toBeVisible();
    expect(uploads).toBe(1);
  });
});

test.describe("account & applied state", () => {
  test("a job you already applied to shows the status, not the Apply button", async ({ page, context }) => {
    await signedIn(context, "seeker");
    await page.goto("/jobs/job-4"); // mock: seeker has an application for job-4
    await expect(page.getByText(/already applied/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply", exact: true })).toHaveCount(0);
  });

  test("account page: edit profile and change password", async ({ page, context }) => {
    await signedIn(context, "seeker");
    await page.goto("/account");
    await page.getByLabel("Display name").fill("Sari Baru");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Profile saved.")).toBeVisible();
    await page.getByLabel("Current password").fill("wrong");
    await page.getByLabel("New password", { exact: true }).fill("Newpass123");
    await page.getByLabel("Confirm new password").fill("Newpass123");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText(/current password is invalid/i)).toBeVisible();
  });

  test("account page: deleting the account asks to confirm, then signs out", async ({ page, context }) => {
    await signedIn(context, "seeker");
    await page.goto("/account");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
    expect(await count("DELETE", /^\/api\/users\//)).toBe(0);
    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete account" }).click();
    await expect(page).toHaveURL(/\/auth\/signin/);
    expect(await count("DELETE", /^\/api\/users\/seeker-id$/)).toBe(1);
  });
});

test.describe("server wake-up", () => {
  test("a slow backend shows the startup page after 3 s, then continues on its own", async ({ page }) => {
    let delayed = false;
    await page.route("**/api/jobs?*", async (r) => {
      if (!delayed) {
        delayed = true;
        await new Promise((res) => setTimeout(res, 4500));
      }
      await r.fallback();
    });
    await page.goto("/jobs");
    await expect(page.getByTestId("server-wakeup")).toHaveCount(0);
    await expect(page.getByTestId("server-wakeup")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: "Waking up the server…" })).toBeVisible();
    await expect(page.getByTestId("server-wakeup")).toHaveCount(0, { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Senior Backend Engineer" })).toBeVisible();
  });

  test("a fast backend never shows it", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "Senior Backend Engineer" })).toBeVisible();
    await expect(page.getByTestId("server-wakeup")).toHaveCount(0);
  });
});
