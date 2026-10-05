import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const MOCK = "http://localhost:8099";
type LogEntry = {
  method: string;
  path: string;
  query: string;
  body: Record<string, unknown>;
};

const getLog = async (): Promise<LogEntry[]> =>
  (await fetch(`${MOCK}/__log`)).json();
const count = async (method: string, pathRe: RegExp) =>
  (await getLog()).filter((e) => e.method === method && pathRe.test(e.path))
    .length;

async function signedIn(context: BrowserContext, role: "seeker" | "employer") {
  await context.addCookies([
    { name: "refreshToken", value: role, url: "http://localhost:3100" },
  ]);
}

test.beforeEach(async () => {
  await fetch(`${MOCK}/__reset`, { method: "POST" });
});

// ---------------------------------------------------------------- browsing
test.describe("browse", () => {
  test("lists open jobs and hides drafts / expired", async ({ page }) => {
    await page.goto("/jobs");
    await expect(
      page.getByRole("heading", { name: "Senior Backend Engineer" }),
    ).toBeVisible();
    await expect(page.getByText("Designer")).toHaveCount(0); // draft
    await expect(page.getByRole("heading", { name: "Cashier" })).toHaveCount(0); // deadline passed
  });

  test("search shows results for the LAST query, not a stale slower one", async ({
    page,
  }) => {
    await page.goto("/jobs");
    await page.getByRole("searchbox").click();
    await page.keyboard.type("ar", { delay: 30 }); // "a" answers in 700ms, "ar" in 80ms
    await page.waitForTimeout(1500);
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Barista" })).toBeVisible();
  });

  test("a non-JSON 502 shows a friendly error, not a JSON parse error", async ({
    page,
  }) => {
    await page.goto("/jobs");
    await page.getByRole("searchbox").fill("boom");
    await expect(page.getByText(/try again/i).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /unexpected token|JSON/i,
    );
  });

  test("signed-in visitors fetch the job list exactly once", async ({
    page,
    context,
  }) => {
    await signedIn(context, "seeker");
    await page.goto("/jobs");
    await expect(
      page.getByRole("heading", { name: "Senior Backend Engineer" }),
    ).toBeVisible();
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
  test("RequireAuth sends signed-out users to sign-in with next", async ({
    page,
  }) => {
    await page.goto("/applications");
    await expect(page).toHaveURL(/\/auth\/signin\?next=%2Fapplications/);
  });
});

// --------------------------------------------------------------- job detail
test.describe("job detail", () => {
  test("open job: seeker can apply (upload + create)", async ({
    page,
    context,
  }) => {
    await signedIn(context, "seeker");
    await page.route("**/api/upload", (r) =>
      r.fulfill({ json: { key: "applications/cvs/x.pdf" } }),
    );
    await page.goto("/jobs/job-1");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await page.setInputFiles("#cv-upload", {
      name: "cv.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    });
    await page.getByRole("button", { name: /submit application/i }).click();
    await expect(page.getByText(/application submitted/i)).toBeVisible();
    expect(await count("POST", /^\/api\/applications$/)).toBe(1);
  });
  for (const [label, id] of [
    ["draft", "job-6"],
    ["past-deadline", "job-5"],
  ] as const) {
    test(`${label} job has no Apply button`, async ({ page, context }) => {
      await signedIn(context, "seeker");
      await page.goto(`/jobs/${id}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Apply", exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText(/not accepting|closed|deadline/i).first(),
      ).toBeVisible();
    });
  }
});

// ------------------------------------------------------------ seeker lists
test.describe("seeker pages", () => {
  test("bookmarked: a deleted job does not crash the page", async ({
    page,
    context,
  }) => {
    await signedIn(context, "seeker");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/bookmarked");
    await expect(page.getByText("Senior Backend Engineer")).toBeVisible();
    await expect(page.getByText(/no longer available/i)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("bookmarked: double-clicking Remove toggles only once", async ({
    page,
    context,
  }) => {
    await signedIn(context, "seeker");
    await page.goto("/bookmarked");
    const btn = page.getByRole("button", { name: "Remove" });
    await btn.dblclick({ delay: 10 });
    await page.waitForTimeout(800);
    expect(await count("POST", /bookmarks\/toggle/)).toBe(1);
    await expect(page.getByText("Senior Backend Engineer")).toHaveCount(0);
  });

  test("history: a deleted job does not crash the page", async ({
    page,
    context,
  }) => {
    await signedIn(context, "seeker");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/history");
    await expect(page.getByText("Barista")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("applications: orphaned application does not crash; withdraw asks to confirm", async ({
    page,
    context,
  }) => {
    await signedIn(context, "seeker");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/applications");
    await expect(page.getByText("Locked Posting")).toBeVisible();
    expect(errors).toEqual([]);
    const card = page.getByTestId("application-app-locked");
    await card.getByRole("button", { name: "Withdraw" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Cancel" })
      .click();
    expect(await count("DELETE", /^\/api\/applications\//)).toBe(0);
  });

  test("applications: a failing withdraw shows the backend message", async ({
    page,
    context,
  }) => {
    await signedIn(context, "seeker");
    await page.goto("/applications");
    const card = page.getByTestId("application-app-locked");
    await card.getByRole("button", { name: "Withdraw" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: /withdraw/i })
      .click();
    await expect(page.getByText(/can no longer be withdrawn/i)).toBeVisible();
  });

  test("applications: withdrawing the last item on the last page steps back a page", async ({
    page,
    context,
  }) => {
    await signedIn(context, "seeker");
    await page.goto("/applications?page=2");
    await expect(page.getByText("Last Page Job")).toBeVisible();
    await page.getByRole("button", { name: "Withdraw" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: /withdraw/i })
      .click();
    await expect(page.getByText("Locked Posting")).toBeVisible(); // page 1 content
    await expect(page.getByText(/haven.t applied/i)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------- employer
test.describe("employer pages", () => {
  test("rejecting an applicant needs confirmation", async ({
    page,
    context,
  }) => {
    await signedIn(context, "employer");
    await page.goto("/dashboard/jobs/job-1/applicants");
    await page.getByRole("button", { name: /mark as rejected/i }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Cancel" })
      .click();
    expect(await count("PATCH", /status$/)).toBe(0);
    await page.getByRole("button", { name: /mark as rejected/i }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: /reject/i })
      .click();
    await expect.poll(() => count("PATCH", /status$/)).toBe(1);
  });

  test("marking as reviewed needs no confirmation", async ({
    page,
    context,
  }) => {
    await signedIn(context, "employer");
    await page.goto("/dashboard/jobs/job-1/applicants");
    await page.getByRole("button", { name: /mark as reviewed/i }).click();
    await expect.poll(() => count("PATCH", /status$/)).toBe(1);
  });

  test("job form dropdowns show labels, not raw enum values", async ({
    page,
    context,
  }) => {
    await signedIn(context, "employer");
    await page.goto("/dashboard/jobs/new");
    const triggers = page.locator("[data-slot=select-trigger]");
    await expect(triggers.nth(0)).toHaveText(/On-site/);
    await expect(triggers.nth(1)).toHaveText(/Full-time/);
    await expect(triggers.nth(2)).toHaveText(/Open/);
  });

  test("editing a job whose deadline already passed only sends what changed", async ({
    page,
    context,
  }) => {
    await signedIn(context, "employer");
    await page.goto("/dashboard/jobs/job-7/edit");
    await page.fill("#job-title", "Old Posting v2");
    await page.fill("#job-location", ""); // cleared on purpose
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/jobs$/);
    const patch = (await getLog()).find(
      (e) => e.method === "PATCH" && e.path === "/api/jobs/job-7",
    )!;
    expect(patch.body.title).toBe("Old Posting v2");
    expect(patch.body.location).toBe("");
    expect("deadline" in patch.body).toBe(false);
  });

  test("a mid-submit token refresh does not reload (and wipe) the edit form", async ({
    page,
    context,
  }) => {
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
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Cancel" })
      .click();
    expect(await count("DELETE", /^\/api\/jobs\//)).toBe(0);
  });
});
