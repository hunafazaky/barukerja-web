// Tiny stateful mock of the barukerja-api, used ONLY by the e2e suite.
// Mirrors the real response shapes (see ../../barukerja-api). Start with:
//   node e2e/mock-api.mjs   (listens on MOCK_PORT, default 8099)
// Test helpers: POST /__reset, GET /__log, POST /__expire-next-patch
import http from "node:http";

const PORT = Number(process.env.MOCK_PORT || 8099);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
let tokenCounter = 0;
const mkToken = (u) =>
  `${b64({ alg: "HS256" })}.${b64({ id: u.id, email: u.email, display_name: u.display_name, role: u.role, iat: ++tokenCounter, exp: 9999999999 })}.sig`;

const users = {
  seeker: {
    id: "seeker-id",
    email: "seeker@test.dev",
    display_name: "Sari Seeker",
    photo: "",
    bio: "",
    role: "seeker",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  employer: {
    id: "employer-id",
    email: "boss@test.dev",
    display_name: "Budi Boss",
    photo: "",
    bio: "",
    role: "employer",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
};
const companies = [
  {
    id: "company-1",
    name: "PT Krakatau Steel Indonesia Persero Tbk Divisi Teknologi Informasi dan Komunikasi",
    logo: "",
    location: "Cilegon, Banten",
    website: "https://example.com",
  },
  {
    id: "company-2",
    name: "Warung Kopi",
    logo: "",
    location: "Jakarta",
    website: "",
  },
  {
    id: "company-3",
    name: "Averyveryverylongcompanynamewithoutanyspacesatalltotestoverflowbehaviour",
    logo: "",
    location: "Bandung",
    website: "",
  },
];
const LONG =
  "Supercalifragilisticexpialidocious_Engineer_Without_Spaces_To_Test_Overflow_On_Small_Screens";
const mkJob = (n, title, extra = {}) => ({
  id: `job-${n}`,
  title,
  description:
    "Line one.\n\nverylongwordwithoutspacesthatshouldwrapproperlyinsidethecontainerandnotoverflowhorizontallyonmobilescreens_____.",
  posted_by: { id: "employer-id", display_name: "Budi Boss" },
  company: companies[n % 3],
  location: undefined,
  work_mode: "onsite",
  job_type: "full_time",
  categories: ["Engineering"],
  status: "open",
  applicant_count: 1,
  view_count: 1,
  bookmarked: false,
  createdAt: new Date(Date.now() - n * 86400000).toISOString(),
  updatedAt: "2026-01-01",
  ...extra,
});
const baseJobs = () => [
  mkJob(1, "Senior Backend Engineer", {
    salary_min: 15000000,
    salary_max: 25000000,
    currency: "IDR",
  }),
  mkJob(2, "Barista"),
  mkJob(3, LONG),
  mkJob(4, "Data Analyst (Remote, Contract, Immediate Joiner Needed ASAP)"),
  mkJob(5, "Cashier", { deadline: "2026-09-01T00:00:00.000Z" }), // open but deadline passed
  mkJob(6, "Designer", { status: "draft" }),
  mkJob(7, "Old Posting", {
    deadline: "2026-09-01T00:00:00.000Z",
    location: "Old City",
  }),
];

let jobs, bookmarks, history, applications, applicants, log, expireNextPatch;
const jobSummary = (j) => ({
  id: j.id,
  title: j.title,
  company: j.company,
  posted_by: "employer-id",
  bookmarked: false,
});
function reset() {
  jobs = baseJobs();
  log = [];
  expireNextPatch = false;
  bookmarks = [
    { id: "bm-1", job: jobSummary(jobs[0]), createdAt: "2026-01-01" },
    { id: "bm-orphan", job: null, createdAt: "2026-01-01" }, // job was deleted
  ];
  history = [
    {
      id: "h-1",
      job: jobSummary(jobs[1]),
      last_read_at: new Date().toISOString(),
    },
    { id: "h-orphan", job: null, last_read_at: new Date().toISOString() },
  ];
  const app = (id, n, status, title) => ({
    id,
    job: n
      ? {
          id: `job-${n}`,
          title: title ?? jobs[n - 1].title,
          company: jobs[n - 1].company,
          status: "open",
        }
      : null,
    cv_key: "k",
    cover_letter: "",
    status,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  });
  applications = [
    app("app-locked", 2, "applied", "Locked Posting"),
    app("app-orphan", 0, "applied"),
  ];
  for (let i = 0; i < 10; i++)
    applications.push(app(`app-f${i}`, 1, "rejected"));
  applications.push(app("app-last", 4, "applied", "Last Page Job"));
  applicants = [
    {
      id: "ap-1",
      job: "job-1",
      applicant: {
        id: "seeker-id",
        display_name: "Sari Seeker With A Rather Long Display Name",
        email:
          "averyveryverylongemailaddress.for.testing@some-long-domain-name.example.com",
      },
      cv_key: "k",
      cover_letter: "Hello!",
      status: "applied",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];
}
reset();

const page = (items, q) => {
  const p = Number(q.get("page")) || 1,
    l = Number(q.get("limit")) || 12;
  return {
    items: items.slice((p - 1) * l, p * l),
    total: items.length,
    page: p,
    limit: l,
    totalPages: Math.max(1, Math.ceil(items.length / l)),
  };
};
const send = (res, code, obj, headers = {}) => {
  res.writeHead(code, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(obj));
};
const readBody = (req) =>
  new Promise((r) => {
    let b = "";
    req.on("data", (d) => (b += d));
    req.on("end", () => {
      try {
        r(b ? JSON.parse(b) : {});
      } catch {
        r({});
      }
    });
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

http
  .createServer(async (req, res) => {
    const u = new URL(req.url, "http://x"),
      p = u.pathname,
      q = u.searchParams,
      method = req.method;
    const cookie = (req.headers.cookie || "").match(/refreshToken=([a-z]+)/);
    const sessionRole = cookie ? cookie[1] : null;
    const body = ["POST", "PATCH", "PUT", "DELETE"].includes(method)
      ? await readBody(req)
      : {};
    if (!p.startsWith("/__"))
      log.push({ method, path: p, query: u.search, body });
    let m;

    if (p === "/__reset") {
      reset();
      return send(res, 200, { ok: true });
    }
    if (p === "/__log") return send(res, 200, log);
    if (p === "/__expire-next-patch") {
      expireNextPatch = true;
      return send(res, 200, { ok: true });
    }

    if (p === "/api/users/refresh") {
      if (!sessionRole || !users[sessionRole])
        return send(res, 401, {
          message: "The session is not found, please re-sign-in.",
        });
      return send(res, 200, { accessToken: mkToken(users[sessionRole]) });
    }
    if (p === "/api/users/signin") {
      const role = String(body.email || "").includes("boss")
        ? "employer"
        : "seeker";
      return send(
        res,
        200,
        { message: "ok", user: users[role], accessToken: mkToken(users[role]) },
        { "Set-Cookie": `refreshToken=${role}; Path=/; HttpOnly` },
      );
    }
    if (p === "/api/users/signout")
      return send(
        res,
        200,
        { message: "Sign Out success." },
        { "Set-Cookie": "refreshToken=; Path=/; Max-Age=0" },
      );
    if ((m = p.match(/^\/api\/users\/([\w-]+)$/))) {
      const found = Object.values(users).find((x) => x.id === m[1]);
      return found
        ? send(res, 200, found)
        : send(res, 404, { message: "The user is not found." });
    }

    if (p === "/api/jobs" && method === "GET") {
      const s = q.get("q");
      if (s === "boom") {
        res.writeHead(502, { "Content-Type": "text/html" });
        return res.end("<html>Bad gateway</html>");
      }
      let l = jobs.filter(
        (j) =>
          j.status === "open" &&
          (!j.deadline || new Date(j.deadline) >= new Date()),
      );
      if (s)
        l = l.filter((j) => j.title.toLowerCase().includes(s.toLowerCase()));
      if (q.get("company"))
        l = l.filter((j) => j.company.id === q.get("company"));
      await sleep(s ? (s.length % 2 ? 700 : 80) : 30); // odd-length queries answer slowly -> provokes stale responses
      return send(res, 200, page(l, q));
    }
    if (p === "/api/jobs/mine")
      return send(
        res,
        200,
        page(
          jobs
            .filter(
              (j) =>
                j.posted_by.id === "employer-id" &&
                [1, 7].includes(Number(j.id.slice(4))),
            )
            .map((j) => ({ ...j, posted_by: undefined })),
          q,
        ),
      );
    if ((m = p.match(/^\/api\/jobs\/([\w-]+)$/))) {
      const j = jobs.find((x) => x.id === m[1]);
      if (!j) return send(res, 404, { message: "The job is not found." });
      if (method === "GET") return send(res, 200, j);
      if (method === "PATCH") {
        if (expireNextPatch) {
          expireNextPatch = false;
          return send(res, 401, {
            message: "Session expired.",
            code: "TOKEN_EXPIRED",
          });
        }
        Object.assign(j, body);
        return send(res, 200, {
          message: "The job data updated successfully.",
          job: { id: j.id },
        });
      }
      if (method === "DELETE") {
        jobs = jobs.filter((x) => x.id !== j.id);
        return send(res, 200, {
          message: "The job and related activity are permanently deleted.",
        });
      }
    }
    if (p === "/api/jobs" && method === "POST") {
      const j = mkJob(jobs.length + 1, body.title || "New", body);
      jobs.push(j);
      return send(res, 201, { message: "ok", job: { id: j.id } });
    }

    if (p === "/api/bookmarks") return send(res, 200, page(bookmarks, q));
    if ((m = p.match(/^\/api\/bookmarks\/check\/([\w-]+)$/)))
      return send(res, 200, {
        is_bookmarked: bookmarks.some((b) => b.job?.id === m[1]),
        bookmarkId: null,
      });
    if ((m = p.match(/^\/api\/bookmarks\/toggle\/([\w-]+)$/))) {
      await sleep(250);
      const exists = bookmarks.some((b) => b.job?.id === m[1]);
      if (exists) bookmarks = bookmarks.filter((b) => b.job?.id !== m[1]);
      else
        bookmarks.push({
          id: `bm-${m[1]}`,
          job: jobSummary(jobs.find((j) => j.id === m[1]) || jobs[0]),
          createdAt: "2026-01-01",
        });
      return send(res, exists ? 200 : 201, {
        is_bookmarked: !exists,
        message: "ok",
      });
    }
    if (p === "/api/history") return send(res, 200, page(history, q));

    if (p === "/api/applications/mine")
      return send(res, 200, page(applications, q));
    if (p === "/api/applications" && method === "POST")
      return send(res, 201, {
        message: "Application submitted successfully.",
        application: { id: "new-app" },
      });
    if ((m = p.match(/^\/api\/applications\/job\//)))
      return send(res, 200, page(applicants, q));
    if (
      (m = p.match(/^\/api\/applications\/([\w-]+)\/status$/)) &&
      method === "PATCH"
    ) {
      const a = applicants.find((x) => x.id === m[1]);
      if (a) a.status = body.status;
      return send(res, 200, {
        message: "ok",
        application: { id: m[1], status: body.status },
      });
    }
    if ((m = p.match(/^\/api\/applications\/([\w-]+)\/cv-url$/)))
      return send(res, 200, {
        url: "https://example.com/cv.pdf",
        expiresIn: 60,
      });
    if (
      (m = p.match(/^\/api\/applications\/([\w-]+)$/)) &&
      method === "DELETE"
    ) {
      if (m[1] === "app-locked")
        return send(res, 400, {
          message:
            "This application can no longer be withdrawn — it's already being reviewed.",
        });
      applications = applications.filter((a) => a.id !== m[1]);
      return send(res, 200, { message: "Application withdrawn successfully." });
    }

    if (p === "/api/companies/mine")
      return send(res, 200, {
        ...companies[0],
        owner: "employer-id",
        createdAt: "x",
        updatedAt: "x",
      });
    if ((m = p.match(/^\/api\/companies\/([\w-]+)$/))) {
      const c = companies.find((x) => x.id === m[1]);
      return c
        ? send(res, 200, {
            ...c,
            description: "About us.",
            owner: "x",
            createdAt: "x",
            updatedAt: "x",
          })
        : send(res, 404, { message: "The company is not found." });
    }
    send(res, 404, { message: "Route Not Found" });
  })
  .listen(PORT, () => console.log(`mock api on ${PORT}`));
