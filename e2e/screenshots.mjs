// Visual sweep: screenshots + horizontal-overflow check for every page at
// phone / tablet / desktop widths, against the mock API.
//
//   node e2e/mock-api.mjs &                       # mock API on :8099
//   BACKEND_API_URL=http://localhost:8099 npx next dev -p 3100 &
//   PW_CHROMIUM=/path/to/chromium node e2e/screenshots.mjs [outDir] [baseURL]
//
// Prints one line per page/width that scrolls sideways (exit code 1 if any).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = process.argv[2] || "shots";
const base = process.argv[3] || "http://localhost:3100";
mkdirSync(out, { recursive: true });

const PAGES = [
  ["jobs", "/jobs", null],
  ["job-long-title", "/jobs/job-3", null],
  ["job-detail", "/jobs/job-1", "seeker"],
  ["company-public", "/companies/company-3", null],
  ["signin", "/auth/signin", null],
  ["signup", "/auth/signup", null],
  ["applications", "/applications", "seeker"],
  ["bookmarked", "/bookmarked", "seeker"],
  ["history", "/history", "seeker"],
  ["my-jobs", "/dashboard/jobs", "employer"],
  ["applicants", "/dashboard/jobs/job-1/applicants", "employer"],
  ["new-job", "/dashboard/jobs/new", "employer"],
  ["edit-job", "/dashboard/jobs/job-1/edit", "employer"],
  ["company", "/dashboard/company", "employer"],
  ["not-found", "/this-page-does-not-exist", null],
];
const WIDTHS = { m: 375, t: 768, d: 1280 };

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ["--no-sandbox"],
});
let overflows = 0;
for (const [wk, width] of Object.entries(WIDTHS)) {
  for (const [name, url, role] of PAGES) {
    const ctx = await browser.newContext({ viewport: { width, height: 812 } });
    if (role)
      await ctx.addCookies([{ name: "refreshToken", value: role, url: base }]);
    const page = await ctx.newPage();
    await page
      .goto(base + url, { waitUntil: "networkidle", timeout: 90_000 })
      .catch(() => {});
    await page.waitForTimeout(600);
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    const title = await page.title();
    if (sw > cw) {
      overflows++;
      console.log(`OVERFLOW ${wk}/${name}: content ${sw}px > viewport ${cw}px`);
    }
    console.log(`  ${wk}/${name}  title="${title}"`);
    await page.screenshot({ path: `${out}/${wk}-${name}.png`, fullPage: true });
    await ctx.close();
  }
}
await browser.close();
console.log(
  overflows
    ? `\n${overflows} page(s) overflow horizontally`
    : "\nno horizontal overflow",
);
process.exit(overflows ? 1 : 0);
