import { JobSummary } from "@/types/job";

// A single viewing-history entry, as returned inside GET /history's
// "items". One per (user, job) pair — viewing the same job again
// updates last_read_at rather than creating a new entry (see
// history.controller.createOrUpdate's upsert).
export interface HistoryEntry {
  id: string;
  job: JobSummary;
  last_read_at: string;
}
