-- AlphaLeads Initial Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- Table: profiles
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  apify_api_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: searches
-- ============================================
CREATE TABLE searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  apify_run_id TEXT,
  apify_dataset_id TEXT,
  leads_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: leads
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES searches(id) ON DELETE CASCADE,

  -- Persona
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  job_title TEXT,
  headline TEXT,
  functional_level TEXT,
  seniority_level TEXT,
  email TEXT,
  mobile_number TEXT,
  personal_email TEXT,
  linkedin TEXT,
  city TEXT,
  state TEXT,
  country TEXT,

  -- Azienda
  company_name TEXT,
  company_domain TEXT,
  company_website TEXT,
  company_linkedin TEXT,
  company_linkedin_uid TEXT,
  company_size TEXT,
  industry TEXT,
  company_description TEXT,
  company_annual_revenue TEXT,
  company_annual_revenue_clean NUMERIC,
  company_total_funding TEXT,
  company_total_funding_clean NUMERIC,
  company_founded_year INTEGER,
  company_phone TEXT,
  company_street_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_country TEXT,
  company_postal_code TEXT,
  company_full_address TEXT,
  company_market_cap TEXT,

  -- Contesto
  keywords TEXT[],
  company_technologies TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: templates
-- ============================================
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_leads_search_id ON leads(search_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_company_name ON leads(company_name);
CREATE INDEX idx_searches_user_id ON searches(user_id);
CREATE INDEX idx_searches_status ON searches(status);
CREATE INDEX idx_templates_user_id ON templates(user_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Searches: users can CRUD their own searches
CREATE POLICY "Users can access own searches"
  ON searches FOR ALL
  USING (auth.uid() = user_id);

-- Leads: users can access leads from their own searches
CREATE POLICY "Users can access own leads"
  ON leads FOR ALL
  USING (
    search_id IN (
      SELECT id FROM searches WHERE user_id = auth.uid()
    )
  );

-- Templates: users can CRUD their own templates
CREATE POLICY "Users can access own templates"
  ON templates FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- Trigger: auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Trigger: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
