// Matches barukerja-api's Company model (see api/src/models/company.model.ts).
// One company per employer — `owner` is unique on the backend.
export interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  location?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

// The trimmed-down shape GET /jobs and GET /jobs/:id populate onto a Job
// (`.populate("company", "name logo location")`, or "...website" on the
// single-job route) — NOT the full Company above.
export interface JobCompany {
  id: string;
  name: string;
  logo?: string;
  location?: string;
  website?: string;
}

// What POST /companies and PATCH /companies/:id accept.
// See api/src/utils/validationSchemas.ts -> companyCreateSchema / companyUpdateSchema.
export interface CompanyFormInput {
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  location?: string;
}
