import type { ApplicationStatus } from "@/types/application";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  reviewed: "Reviewed",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
};
