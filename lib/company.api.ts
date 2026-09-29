import { apiFetch } from "@/lib/api";
import { Company } from "@/types/company";

// ==================================================
// Get a single company's public profile by id.
// Backend route: GET /api/companies/:id (public)
//
// Returns the Company document directly (no wrapper object, no
// pagination) — unlike GET /jobs, this one isn't a list endpoint.
// ==================================================
export function getCompanyById(id: string): Promise<Company> {
  return apiFetch<Company>(`/companies/${id}`);
}
