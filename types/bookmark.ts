import { JobSummary } from "@/types/job";

// A single bookmark, as returned inside GET /bookmarks's "items".
// job.bookmarked is always true here (the backend sets it explicitly —
// see bookmark.controller.findUserBookmarks) since obviously anything in
// this list is bookmarked.
export interface Bookmark {
  id: string;
  // null when the job no longer exists (e.g. its employer deleted their
  // account) — Mongoose populates a dangling reference as null.
  job: JobSummary | null;
  createdAt: string;
}
