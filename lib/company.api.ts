import { apiFetch } from "@/lib/api";
import { Company, CompanyFormInput } from "@/types/company";

// ==================================================
// Get the signed-in employer's own company profile.
// Backend route: GET /api/companies/mine (requires sign-in, role: employer)
//
// Returns 404 if the employer hasn't created a company yet — callers
// should treat that as "show the create form", not as an error to
// surface. See hooks/use-my-company.ts.
// ==================================================
export function getMyCompany(accessToken: string): Promise<Company> {
  return apiFetch<Company>(`/companies/mine`, { accessToken });
}

// ==================================================
// Create the signed-in employer's company profile.
// Backend route: POST /api/companies (requires sign-in, role: employer)
//
// The backend enforces one company per employer (owner is unique) — a
// second call for an employer who already has one fails with a 409.
// ==================================================
export function createCompany(
  input: CompanyFormInput,
  accessToken: string,
): Promise<{ message: string; company: Company }> {
  return apiFetch(`/companies`, {
    method: "POST",
    body: input,
    accessToken,
  });
}

// ==================================================
// Update the signed-in employer's own company profile.
// Backend route: PATCH /api/companies/:id (requires sign-in, must own it)
// ==================================================
export function updateCompany(
  id: string,
  input: Partial<CompanyFormInput>,
  accessToken: string,
): Promise<{ message: string; company: Company }> {
  return apiFetch(`/companies/${id}`, {
    method: "PATCH",
    body: input,
    accessToken,
  });
}

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
