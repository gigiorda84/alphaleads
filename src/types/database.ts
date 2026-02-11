export type SearchStatus = 'pending' | 'running' | 'succeeded' | 'failed';

export interface Profile {
  id: string;
  full_name: string | null;
  apify_api_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Search {
  id: string;
  user_id: string;
  name: string;
  filters: SearchFilters;
  status: SearchStatus;
  apify_run_id: string | null;
  apify_dataset_id: string | null;
  leads_count: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  search_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  job_title: string | null;
  headline: string | null;
  functional_level: string | null;
  seniority_level: string | null;
  email: string | null;
  mobile_number: string | null;
  personal_email: string | null;
  linkedin: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  company_name: string | null;
  company_domain: string | null;
  company_website: string | null;
  company_linkedin: string | null;
  company_linkedin_uid: string | null;
  company_size: string | null;
  industry: string | null;
  company_description: string | null;
  company_annual_revenue: string | null;
  company_annual_revenue_clean: number | null;
  company_total_funding: string | null;
  company_total_funding_clean: number | null;
  company_founded_year: number | null;
  company_phone: string | null;
  company_street_address: string | null;
  company_city: string | null;
  company_state: string | null;
  company_country: string | null;
  company_postal_code: string | null;
  company_full_address: string | null;
  company_market_cap: string | null;
  keywords: string[] | null;
  company_technologies: string[] | null;
  created_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  filters: SearchFilters;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  fetch_count?: number;
  file_name?: string;
  contact_job_title?: string[];
  contact_not_job_title?: string[];
  seniority_level?: string[];
  functional_level?: string[];
  contact_location?: string[];
  contact_city?: string[];
  contact_not_location?: string[];
  contact_not_city?: string[];
  email_status?: string[];
  company_domain?: string[];
  size?: string[];
  company_industry?: string[];
  company_not_industry?: string[];
  company_keywords?: string[];
  company_not_keywords?: string[];
  min_revenue?: string;
  max_revenue?: string;
  funding?: string[];
}
