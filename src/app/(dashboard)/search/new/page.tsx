"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import TagInput from "@/components/ui/TagInput";
import ChipSelect from "@/components/ui/ChipSelect";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import AlertInfo from "@/components/ui/AlertInfo";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { ALLOWED_INDUSTRIES } from "@/lib/apify-industries";
import type { SearchFilters } from "@/types/database";

const SENIORITY_OPTIONS = [
  "Founder",
  "Owner",
  "C-Level",
  "Director",
  "VP",
  "Head",
  "Manager",
  "Senior",
  "Entry",
  "Trainee",
];

const FUNCTIONAL_OPTIONS = [
  "C-Level",
  "Finance",
  "Product",
  "Engineering",
  "Design",
  "HR",
  "IT",
  "Legal",
  "Marketing",
  "Operations",
  "Sales",
  "Support",
];

const EMAIL_STATUS_OPTIONS = ["Validated", "Not Validated", "Unknown"];

const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-20",
  "21-50",
  "51-100",
  "101-200",
  "201-500",
  "501-1000",
  "1001-2000",
  "2001-5000",
  "5001-10000",
  "10001-20000",
  "20001-50000",
  "50000+",
];

const FUNDING_OPTIONS = [
  "Seed",
  "Angel",
  "Series A",
  "Series B",
  "Series C",
  "Series D",
  "Series E",
  "Series F",
  "Venture",
  "Debt Financing",
  "Convertible Note",
  "Private Equity",
  "Other",
];

const REVENUE_OPTIONS = [
  "",
  "100K",
  "500K",
  "1M",
  "5M",
  "10M",
  "25M",
  "50M",
  "100M",
  "250M",
  "500M",
  "1B",
  "5B",
  "10B",
];

function revenueToNumber(val: string): number {
  if (!val) return 0;
  const multipliers: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
  const suffix = val.slice(-1);
  const num = parseFloat(val.slice(0, -1));
  return num * (multipliers[suffix] ?? 1);
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--neutral-300)",
  fontSize: 14,
  outline: "none",
  background: "white",
};

export default function NewSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Form state ---
  const [searchName, setSearchName] = useState("");
  const [fetchCount, setFetchCount] = useState(25);

  const [jobTitleInclude, setJobTitleInclude] = useState<string[]>([]);
  const [jobTitleExclude, setJobTitleExclude] = useState<string[]>([]);
  const [seniority, setSeniority] = useState<string[]>([]);
  const [functional, setFunctional] = useState<string[]>([]);

  const [locationInclude, setLocationInclude] = useState<string[]>([]);
  const [cityInclude, setCityInclude] = useState<string[]>([]);
  const [locationExclude, setLocationExclude] = useState<string[]>([]);
  const [cityExclude, setCityExclude] = useState<string[]>([]);

  const [emailStatus, setEmailStatus] = useState<string[]>(["Validated"]);

  const [companyDomain, setCompanyDomain] = useState<string[]>([]);
  const [industryInclude, setIndustryInclude] = useState<string[]>([]);
  const [industryExclude, setIndustryExclude] = useState<string[]>([]);
  const [keywordsInclude, setKeywordsInclude] = useState<string[]>([]);
  const [keywordsExclude, setKeywordsExclude] = useState<string[]>([]);
  const [companySize, setCompanySize] = useState<string[]>([]);

  const [minRevenue, setMinRevenue] = useState("");
  const [maxRevenue, setMaxRevenue] = useState("");
  const [funding, setFunding] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // --- Load template if templateId is in URL ---
  useEffect(() => {
    const templateId = searchParams.get("templateId");
    if (!templateId) return;

    const supabase = createClient();
    supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const f = data.filters as SearchFilters;

        if (f.file_name) setSearchName(f.file_name);
        if (f.fetch_count) setFetchCount(f.fetch_count);
        if (f.contact_job_title) setJobTitleInclude(f.contact_job_title);
        if (f.contact_not_job_title) setJobTitleExclude(f.contact_not_job_title);
        if (f.seniority_level) setSeniority(f.seniority_level);
        if (f.functional_level) setFunctional(f.functional_level);
        if (f.contact_location) setLocationInclude(f.contact_location);
        if (f.contact_city) setCityInclude(f.contact_city);
        if (f.contact_not_location) setLocationExclude(f.contact_not_location);
        if (f.contact_not_city) setCityExclude(f.contact_not_city);
        if (f.email_status) setEmailStatus(f.email_status);
        if (f.company_domain) setCompanyDomain(f.company_domain);
        if (f.company_industry) setIndustryInclude(f.company_industry);
        if (f.company_not_industry) setIndustryExclude(f.company_not_industry);
        if (f.company_keywords) setKeywordsInclude(f.company_keywords);
        if (f.company_not_keywords) setKeywordsExclude(f.company_not_keywords);
        if (f.size) setCompanySize(f.size);
        if (f.min_revenue) setMinRevenue(f.min_revenue);
        if (f.max_revenue) setMaxRevenue(f.max_revenue);
        if (f.funding) setFunding(f.funding);
      });
  }, [searchParams]);

  // --- Derived state ---
  const showLeadCountWarning = fetchCount > 10000;
  const showLocationCityWarning = locationInclude.length > 0 && cityInclude.length > 0;
  const revenueError =
    minRevenue && maxRevenue && revenueToNumber(minRevenue) > revenueToNumber(maxRevenue)
      ? "La Revenue Minima non può essere maggiore della Revenue Massima."
      : "";

  // --- Build filters ---
  function buildFilters(): SearchFilters {
    const filters: SearchFilters = {};

    if (searchName.trim()) filters.file_name = searchName.trim();
    if (fetchCount) filters.fetch_count = fetchCount;

    if (jobTitleInclude.length) filters.contact_job_title = jobTitleInclude;
    if (jobTitleExclude.length) filters.contact_not_job_title = jobTitleExclude;
    if (seniority.length) filters.seniority_level = seniority;
    if (functional.length) filters.functional_level = functional;

    if (locationInclude.length) filters.contact_location = locationInclude;
    if (cityInclude.length) filters.contact_city = cityInclude;
    if (locationExclude.length) filters.contact_not_location = locationExclude;
    if (cityExclude.length) filters.contact_not_city = cityExclude;

    if (emailStatus.length) filters.email_status = emailStatus;

    if (companyDomain.length) filters.company_domain = companyDomain;
    if (industryInclude.length) filters.company_industry = industryInclude;
    if (industryExclude.length) filters.company_not_industry = industryExclude;
    if (keywordsInclude.length) filters.company_keywords = keywordsInclude;
    if (keywordsExclude.length) filters.company_not_keywords = keywordsExclude;
    if (companySize.length) filters.size = companySize;

    if (minRevenue) filters.min_revenue = minRevenue;
    if (maxRevenue) filters.max_revenue = maxRevenue;
    if (funding.length) filters.funding = funding;

    return filters;
  }

  function hasAtLeastOneFilter(): boolean {
    return (
      jobTitleInclude.length > 0 ||
      jobTitleExclude.length > 0 ||
      seniority.length > 0 ||
      functional.length > 0 ||
      locationInclude.length > 0 ||
      cityInclude.length > 0 ||
      locationExclude.length > 0 ||
      cityExclude.length > 0 ||
      companyDomain.length > 0 ||
      industryInclude.length > 0 ||
      industryExclude.length > 0 ||
      keywordsInclude.length > 0 ||
      keywordsExclude.length > 0 ||
      companySize.length > 0 ||
      !!minRevenue ||
      !!maxRevenue ||
      funding.length > 0
    );
  }

  // --- Reset ---
  function handleReset() {
    setSearchName("");
    setFetchCount(25);
    setJobTitleInclude([]);
    setJobTitleExclude([]);
    setSeniority([]);
    setFunctional([]);
    setLocationInclude([]);
    setCityInclude([]);
    setLocationExclude([]);
    setCityExclude([]);
    setEmailStatus(["Validated"]);
    setCompanyDomain([]);
    setIndustryInclude([]);
    setIndustryExclude([]);
    setKeywordsInclude([]);
    setKeywordsExclude([]);
    setCompanySize([]);
    setMinRevenue("");
    setMaxRevenue("");
    setFunding([]);
    setSubmitError("");
  }

  // --- Submit ---
  async function handleSubmit() {
    setSubmitError("");

    if (!hasAtLeastOneFilter()) {
      setSubmitError("Compila almeno un filtro prima di avviare la ricerca.");
      return;
    }

    if (revenueError) {
      setSubmitError(revenueError);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/search/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: buildFilters() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Errore durante l'avvio della ricerca.");
      }

      const data = await res.json();
      router.push(`/search/${data.searchId}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Errore sconosciuto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Save as template ---
  async function handleSaveTemplate() {
    const name = window.prompt("Nome del template:");
    if (!name || !name.trim()) return;

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), filters: buildFilters() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Errore durante il salvataggio del template.");
      }

      alert("Template salvato con successo!");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Errore durante il salvataggio.");
    }
  }

  return (
    <div className="px-6 py-8 md:px-10" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          className="text-navy-800"
          style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}
        >
          Nuova Ricerca
        </h1>
        <p className="text-neutral-500 mt-1" style={{ fontSize: 14 }}>
          Configura i filtri per trovare le lead più rilevanti per il tuo business.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col" style={{ gap: 20 }}>
        {/* Section 1 — Configurazione Base */}
        <FormSection number={1} title="Configurazione Base">
          <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Nome Ricerca
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Es: CMO SaaS USA"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Numero di Lead
              </label>
              <input
                type="number"
                value={fetchCount}
                onChange={(e) => setFetchCount(Math.max(1, Math.min(50000, Number(e.target.value) || 1)))}
                min={1}
                max={50000}
                style={inputStyle}
              />
            </div>
          </div>
          {showLeadCountWarning && (
            <div className="mt-3">
              <AlertInfo>La ricerca potrebbe richiedere diversi minuti</AlertInfo>
            </div>
          )}
        </FormSection>

        {/* Section 2 — Targeting Persona */}
        <FormSection number={2} title="Targeting Persona">
          <div className="flex flex-col" style={{ gap: 16 }}>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Job Title — Includi
              </label>
              <TagInput
                value={jobTitleInclude}
                onChange={setJobTitleInclude}
                placeholder="Scrivi e premi Enter per aggiungere..."
              />
            </div>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Job Title — Escludi
              </label>
              <TagInput
                value={jobTitleExclude}
                onChange={setJobTitleExclude}
                placeholder="Scrivi e premi Enter per aggiungere..."
              />
            </div>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Livello Seniority
              </label>
              <ChipSelect options={SENIORITY_OPTIONS} value={seniority} onChange={setSeniority} />
            </div>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Livello Funzionale
              </label>
              <ChipSelect options={FUNCTIONAL_OPTIONS} value={functional} onChange={setFunctional} />
            </div>
          </div>
        </FormSection>

        {/* Section 3 — Localizzazione */}
        <FormSection number={3} title="Localizzazione">
          <div className="flex flex-col" style={{ gap: 16 }}>
            <AlertInfo>
              Usa &apos;Location&apos; per filtrare per regione, paese o stato (es: United States, EMEA,
              California). Usa &apos;Città&apos; per targeting specifico su una città. Non combinare
              Location e Città per lo stesso target.
            </AlertInfo>
            <div className="grid grid-cols-2" style={{ gap: 16 }}>
              <div>
                <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                  Location — Includi
                </label>
                <TagInput
                  value={locationInclude}
                  onChange={setLocationInclude}
                  placeholder="Regione, paese o stato..."
                />
              </div>
              <div>
                <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                  Città — Includi
                </label>
                <TagInput
                  value={cityInclude}
                  onChange={setCityInclude}
                  placeholder="Città specifica..."
                />
              </div>
              <div>
                <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                  Location — Escludi
                </label>
                <TagInput
                  value={locationExclude}
                  onChange={setLocationExclude}
                  placeholder="Regioni da escludere..."
                />
              </div>
              <div>
                <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                  Città — Escludi
                </label>
                <TagInput
                  value={cityExclude}
                  onChange={setCityExclude}
                  placeholder="Città da escludere..."
                />
              </div>
            </div>
            {showLocationCityWarning && (
              <AlertInfo>
                Stai usando sia Location che Città per includere. Questo potrebbe restringere
                eccessivamente i risultati. Si consiglia di usare solo uno dei due campi.
              </AlertInfo>
            )}
          </div>
        </FormSection>

        {/* Section 4 — Qualità Email */}
        <FormSection number={4} title="Qualità Email">
          <div>
            <ChipSelect options={EMAIL_STATUS_OPTIONS} value={emailStatus} onChange={setEmailStatus} />
            <p className="text-neutral-500 mt-2" style={{ fontSize: 12 }}>
              Seleziona solo &apos;Validated&apos; per liste pronte all&apos;outreach. Aggiungi
              &apos;Unknown&apos; per aumentare il volume.
            </p>
          </div>
        </FormSection>

        {/* Section 5 — Targeting Azienda */}
        <FormSection number={5} title="Targeting Azienda">
          <div className="flex flex-col" style={{ gap: 16 }}>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Dominio Azienda
              </label>
              <TagInput
                value={companyDomain}
                onChange={setCompanyDomain}
                placeholder="Es: google.com, apple.com"
              />
            </div>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Industry — Includi
              </label>
              <SearchableSelect
                options={ALLOWED_INDUSTRIES}
                value={industryInclude}
                onChange={setIndustryInclude}
                placeholder="Cerca settore..."
              />
            </div>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Industry — Escludi
              </label>
              <SearchableSelect
                options={ALLOWED_INDUSTRIES}
                value={industryExclude}
                onChange={setIndustryExclude}
                placeholder="Cerca settore da escludere..."
              />
            </div>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Keywords — Includi
              </label>
              <TagInput
                value={keywordsInclude}
                onChange={setKeywordsInclude}
                placeholder="Ricerca libera nel profilo aziendale..."
              />
            </div>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Keywords — Escludi
              </label>
              <TagInput
                value={keywordsExclude}
                onChange={setKeywordsExclude}
                placeholder="Scrivi e premi Enter per aggiungere..."
              />
            </div>
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Dimensione Azienda
              </label>
              <ChipSelect options={COMPANY_SIZE_OPTIONS} value={companySize} onChange={setCompanySize} />
            </div>
          </div>
        </FormSection>

        {/* Section 6 — Dati Finanziari */}
        <FormSection number={6} title="Dati Finanziari">
          <div className="flex flex-col" style={{ gap: 16 }}>
            <div className="grid grid-cols-2" style={{ gap: 16 }}>
              <div>
                <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                  Revenue Minima
                </label>
                <select
                  value={minRevenue}
                  onChange={(e) => setMinRevenue(e.target.value)}
                  style={inputStyle}
                >
                  {REVENUE_OPTIONS.map((opt) => (
                    <option key={`min-${opt}`} value={opt}>
                      {opt || "Nessun minimo"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                  Revenue Massima
                </label>
                <select
                  value={maxRevenue}
                  onChange={(e) => setMaxRevenue(e.target.value)}
                  style={inputStyle}
                >
                  {REVENUE_OPTIONS.map((opt) => (
                    <option key={`max-${opt}`} value={opt}>
                      {opt || "Nessun massimo"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {revenueError && (
              <p className="text-red-600" style={{ fontSize: 13 }}>
                {revenueError}
              </p>
            )}
            <div>
              <label className="text-neutral-600" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Tipo di Funding
              </label>
              <ChipSelect options={FUNDING_OPTIONS} value={funding} onChange={setFunding} />
            </div>
          </div>
        </FormSection>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mt-4">
          <p className="text-red-600" style={{ fontSize: 13, fontWeight: 500 }}>
            {submitError}
          </p>
        </div>
      )}

      {/* Action bar */}
      <div className="flex justify-end mt-6" style={{ gap: 12, paddingBottom: 40 }}>
        <Button variant="ghost" type="button" onClick={handleReset}>
          Reset Filtri
        </Button>
        <Button variant="secondary" type="button" onClick={handleSaveTemplate}>
          Salva come Template
        </Button>
        <Button variant="primary" type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Avvio in corso...
            </>
          ) : (
            "Avvia Ricerca"
          )}
        </Button>
      </div>
    </div>
  );
}
