"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  XCircle,
  Copy,
  FileSpreadsheet,
  FileDown,
  Search,
  ExternalLink,
  Columns3,
  Check,
  ArrowLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import type { Search as SearchType, Lead, SearchFilters } from "@/types/database";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StatusResponse {
  search: SearchType;
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}

type ExtraColumnKey =
  | "personal_email"
  | "seniority_level"
  | "functional_level"
  | "headline"
  | "company_linkedin"
  | "company_total_funding"
  | "company_founded_year"
  | "company_description"
  | "company_technologies"
  | "keywords"
  | "company_full_address";

const EXTRA_COLUMNS: { key: ExtraColumnKey; label: string }[] = [
  { key: "personal_email", label: "Email personale" },
  { key: "seniority_level", label: "Seniority" },
  { key: "functional_level", label: "Functional Level" },
  { key: "headline", label: "Headline" },
  { key: "company_linkedin", label: "Company LinkedIn" },
  { key: "company_total_funding", label: "Funding" },
  { key: "company_founded_year", label: "Founded Year" },
  { key: "company_description", label: "Description" },
  { key: "company_technologies", label: "Tech Stack" },
  { key: "keywords", label: "Keywords" },
  { key: "company_full_address", label: "Full Address" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function buildFilterChips(filters: SearchFilters): string[] {
  const chips: string[] = [];

  const labelMap: Record<string, string> = {
    contact_job_title: "Job",
    contact_not_job_title: "Escludi Job",
    seniority_level: "Seniority",
    functional_level: "Functional Level",
    contact_location: "Location",
    contact_city: "Citt\u00e0",
    contact_not_location: "Escludi Location",
    contact_not_city: "Escludi Citt\u00e0",
    email_status: "Email Status",
    company_domain: "Dominio",
    size: "Dimensione",
    company_industry: "Industry",
    company_not_industry: "Escludi Industry",
    company_keywords: "Keywords",
    company_not_keywords: "Escludi Keywords",
    funding: "Funding",
  };

  for (const [key, label] of Object.entries(labelMap)) {
    const value = filters[key as keyof SearchFilters];
    if (Array.isArray(value) && value.length > 0) {
      chips.push(`${label}: ${value.join(", ")}`);
    }
  }

  if (filters.min_revenue || filters.max_revenue) {
    const parts: string[] = [];
    if (filters.min_revenue) parts.push(`da ${filters.min_revenue}`);
    if (filters.max_revenue) parts.push(`a ${filters.max_revenue}`);
    chips.push(`Revenue: ${parts.join(" ")}`);
  }

  if (filters.fetch_count) {
    chips.push(`Lead richieste: ${filters.fetch_count}`);
  }

  return chips;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SearchResultsPage() {
  const params = useParams();
  const searchId = params.searchId as string;

  /* ---- Core state ---- */
  const [search, setSearch] = useState<SearchType | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- UI state ---- */
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleExtras, setVisibleExtras] = useState<Set<ExtraColumnKey>>(new Set());
  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  /* ---- Elapsed time ---- */
  const [elapsedMs, setElapsedMs] = useState(0);

  /* ---- Refs for cleanup ---- */
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 25;

  /* ---------------------------------------------------------------- */
  /*  Fetch status                                                     */
  /* ---------------------------------------------------------------- */

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/search/${searchId}/status`);
      if (!res.ok) throw new Error("Errore nel recupero dello stato della ricerca.");
      const data: StatusResponse = await res.json();
      setSearch(data.search);
      return data.search;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto.");
      return null;
    }
  }, [searchId]);

  /* ---------------------------------------------------------------- */
  /*  Fetch leads                                                      */
  /* ---------------------------------------------------------------- */

  const fetchLeads = useCallback(
    async (page: number) => {
      try {
        const res = await fetch(
          `/api/search/${searchId}/leads?page=${page}&limit=${PAGE_SIZE}`
        );
        if (!res.ok) throw new Error("Errore nel recupero delle lead.");
        const data: LeadsResponse = await res.json();
        setLeads(data.leads);
        setTotalLeads(data.total);
        setCurrentPage(data.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore sconosciuto.");
      }
    },
    [searchId]
  );

  /* ---------------------------------------------------------------- */
  /*  Initial mount + polling                                          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      const searchData = await fetchStatus();
      if (cancelled) return;

      if (!searchData) {
        setLoading(false);
        return;
      }

      if (searchData.status === "succeeded") {
        await fetchLeads(1);
      }

      setLoading(false);

      // Set up polling if still running/pending
      if (searchData.status === "running" || searchData.status === "pending") {
        pollingRef.current = setInterval(async () => {
          const updated = await fetchStatus();
          if (cancelled || !updated) return;

          if (updated.status === "succeeded") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (elapsedRef.current) clearInterval(elapsedRef.current);
            await fetchLeads(1);
          } else if (updated.status === "failed") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (elapsedRef.current) clearInterval(elapsedRef.current);
          }
        }, 5000);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [fetchStatus, fetchLeads]);

  /* ---------------------------------------------------------------- */
  /*  Elapsed timer for running state                                  */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (
      search &&
      (search.status === "running" || search.status === "pending") &&
      search.started_at
    ) {
      const startTime = new Date(search.started_at).getTime();

      const tick = () => {
        setElapsedMs(Date.now() - startTime);
      };
      tick();

      elapsedRef.current = setInterval(tick, 1000);

      return () => {
        if (elapsedRef.current) clearInterval(elapsedRef.current);
      };
    }
  }, [search?.status, search?.started_at]);

  /* ---------------------------------------------------------------- */
  /*  Close column dropdown on outside click                           */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(e.target as Node)
      ) {
        setColumnDropdownOpen(false);
      }
    }

    if (columnDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [columnDropdownOpen]);

  /* ---------------------------------------------------------------- */
  /*  Client-side search filtering                                     */
  /* ---------------------------------------------------------------- */

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter((lead) => {
      const fields = [
        lead.full_name,
        lead.first_name,
        lead.last_name,
        lead.email,
        lead.company_name,
        lead.job_title,
      ];
      return fields.some((f) => f && f.toLowerCase().includes(q));
    });
  }, [leads, searchQuery]);

  /* ---------------------------------------------------------------- */
  /*  Selection handling                                                */
  /* ---------------------------------------------------------------- */

  function handleSelectionChange(selectedRows: Record<string, unknown>[]) {
    const ids = new Set<string>();
    for (const row of selectedRows) {
      if (row.id) ids.add(row.id as string);
    }
    setSelectedIds(ids);
  }

  /* ---------------------------------------------------------------- */
  /*  Copy single email                                                */
  /* ---------------------------------------------------------------- */

  async function copyEmail(email: string) {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1500);
  }

  /* ---------------------------------------------------------------- */
  /*  Copy all emails                                                  */
  /* ---------------------------------------------------------------- */

  async function copyAllEmails() {
    const source =
      selectedIds.size > 0
        ? leads.filter((l) => selectedIds.has(l.id))
        : leads;
    const emails = source.map((l) => l.email).filter(Boolean) as string[];
    await navigator.clipboard.writeText(emails.join(", "));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  /* ---------------------------------------------------------------- */
  /*  Export                                                            */
  /* ---------------------------------------------------------------- */

  async function triggerExport(format: "xlsx" | "csv") {
    const selectedParam =
      selectedIds.size > 0 ? `&ids=${Array.from(selectedIds).join(",")}` : "";
    try {
      const res = await fetch(
        `/api/search/${searchId}/export?format=${format}${selectedParam}`
      );
      if (!res.ok) return;
      const blob = await res.blob();
      const name = (search?.name || "export").replace(/[^a-zA-Z0-9_\-\s]/g, "").trim() || "export";
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${name}.${format}`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
    } catch {
      /* silent */
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Toggle extra column                                              */
  /* ---------------------------------------------------------------- */

  function toggleExtraColumn(key: ExtraColumnKey) {
    setVisibleExtras((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Pagination handler                                               */
  /* ---------------------------------------------------------------- */

  function handlePageChange(page: number) {
    setSearchQuery("");
    fetchLeads(page);
  }

  /* ---------------------------------------------------------------- */
  /*  Build table columns                                              */
  /* ---------------------------------------------------------------- */

  const tableColumns: Column<Record<string, unknown>>[] = useMemo(() => {
    const base: Column<Record<string, unknown>>[] = [
      {
        key: "full_name",
        label: "Nome completo",
        render: (value, row) => {
          const name = (value as string) || "\u2014";
          const linkedin = row.linkedin as string | null;
          return linkedin ? (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:text-orange-600 transition-colors"
            >
              {name}
              <ExternalLink size={12} className="text-neutral-400" />
            </a>
          ) : (
            <span className="font-semibold text-navy-800">{name}</span>
          );
        },
      },
      {
        key: "job_title",
        label: "Job Title",
        render: (value) => (
          <span className="text-neutral-600">{(value as string) || "\u2014"}</span>
        ),
      },
      {
        key: "email",
        label: "Email",
        render: (value) => {
          const email = value as string | null;
          if (!email) return <span className="text-neutral-400">\u2014</span>;
          return (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="text-neutral-700"
                style={{ fontFamily: "monospace", fontSize: 12 }}
              >
                {email}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyEmail(email);
                }}
                className="p-0.5 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Copia email"
              >
                {copiedEmail === email ? (
                  <Check size={13} className="text-green-600" />
                ) : (
                  <Copy size={13} className="text-neutral-400" />
                )}
              </button>
            </span>
          );
        },
      },
      {
        key: "mobile_number",
        label: "Telefono",
        render: (value) => (
          <span className="text-neutral-600">{(value as string) || "\u2014"}</span>
        ),
      },
      {
        key: "company_name",
        label: "Azienda",
        render: (value, row) => {
          const name = (value as string) || "\u2014";
          const website = row.company_website as string | null;
          return website ? (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-navy-700 hover:text-orange-600 transition-colors"
            >
              {name}
              <ExternalLink size={12} className="text-neutral-400" />
            </a>
          ) : (
            <span className="font-medium text-navy-700">{name}</span>
          );
        },
      },
      {
        key: "industry",
        label: "Industry",
        render: (value) => (
          <span className="text-neutral-500">{(value as string) || "\u2014"}</span>
        ),
      },
      {
        key: "location",
        label: "Location",
        render: (_value, row) => {
          const parts = [row.city as string | null, row.country as string | null].filter(
            Boolean
          );
          return (
            <span className="text-neutral-500">
              {parts.length > 0 ? parts.join(", ") : "\u2014"}
            </span>
          );
        },
      },
      {
        key: "company_annual_revenue",
        label: "Revenue",
        render: (value) => (
          <span className="text-neutral-600">{(value as string) || "\u2014"}</span>
        ),
      },
      {
        key: "company_size",
        label: "Dimensione",
        render: (value) => (
          <span className="text-neutral-500">{(value as string) || "\u2014"}</span>
        ),
      },
    ];

    // Append visible extra columns
    for (const extra of EXTRA_COLUMNS) {
      if (visibleExtras.has(extra.key)) {
        base.push({
          key: extra.key,
          label: extra.label,
          render: (value) => {
            if (extra.key === "company_linkedin" && value) {
              const url = String(value);
              return (
                <a
                  href={url.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-navy-700 hover:text-orange-600 transition-colors"
                >
                  <span className="underline underline-offset-2 text-[13px] truncate max-w-[200px]">{url}</span>
                  <ExternalLink size={11} className="text-neutral-400 shrink-0" />
                </a>
              );
            }
            if (Array.isArray(value)) {
              return (
                <span className="text-neutral-500 text-[12px]">
                  {value.length > 0 ? value.join(", ") : "\u2014"}
                </span>
              );
            }
            return (
              <span className="text-neutral-500">
                {value != null ? String(value) : "\u2014"}
              </span>
            );
          },
        });
      }
    }

    return base;
  }, [visibleExtras, copiedEmail]);

  /* ---------------------------------------------------------------- */
  /*  Convert leads to Record<string, unknown> for DataTable           */
  /* ---------------------------------------------------------------- */

  const tableData: Record<string, unknown>[] = useMemo(() => {
    return filteredLeads.map((lead) => ({
      ...lead,
      location: [lead.city, lead.country].filter(Boolean).join(", ") || null,
    }));
  }, [filteredLeads]);

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Error state (no search found)                                    */
  /* ---------------------------------------------------------------- */

  if (error && !search) {
    return (
      <div className="max-w-[1200px] mx-auto px-10 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <XCircle size={48} className="text-coral-600 mb-4" />
          <h2 className="text-xl font-bold text-navy-800 mb-2">Errore</h2>
          <p className="text-sm text-neutral-500 mb-6">{error}</p>
          <Link href="/dashboard">
            <Button variant="secondary" size="default">
              Torna al Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!search) return null;

  /* ================================================================ */
  /*  STATE: Running / Pending                                         */
  /* ================================================================ */

  if (search.status === "running" || search.status === "pending") {
    const filterChips = buildFilterChips(search.filters);

    return (
      <div className="max-w-[1200px] mx-auto px-10 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange-600 mb-6" size={44} />

          <h2
            className="text-xl font-bold text-navy-800 mb-2"
            style={{ letterSpacing: "-0.01em" }}
          >
            Ricerca in corso...
          </h2>

          <p className="text-sm text-neutral-500 max-w-md text-center mb-6">
            Stiamo recuperando le tue lead. Questo pu&ograve; richiedere da pochi
            secondi a diversi minuti a seconda del volume richiesto.
          </p>

          {/* Elapsed time */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6"
            style={{
              background: "var(--navy-50)",
              border: "1px solid var(--navy-100)",
            }}
          >
            <span className="text-xs font-semibold text-navy-700">Tempo trascorso:</span>
            <span
              className="text-sm font-bold text-navy-800"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatElapsed(elapsedMs)}
            </span>
          </div>

          {/* Search name + filter summary */}
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-navy-800 mb-2">{search.name}</p>
            {filterChips.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {filterChips.map((chip) => (
                  <span
                    key={chip}
                    className="text-xs font-medium px-3 py-1 rounded-md"
                    style={{
                      background: "var(--navy-100)",
                      color: "var(--navy-700)",
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Link href="/dashboard">
            <Button variant="ghost" size="default">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna al Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  STATE: Failed                                                    */
  /* ================================================================ */

  if (search.status === "failed") {
    return (
      <div className="max-w-[1200px] mx-auto px-10 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <XCircle size={48} className="text-coral-600 mb-4" />

          <h2 className="text-xl font-bold text-navy-800 mb-2">
            La ricerca non ha prodotto risultati.
          </h2>

          {search.error_message && (
            <p className="text-sm text-neutral-500 max-w-md text-center mb-6">
              {search.error_message}
            </p>
          )}

          <div
            className="rounded-lg px-5 py-4 mb-8 max-w-md w-full"
            style={{
              background: "var(--neutral-50)",
              border: "1px solid var(--neutral-200)",
            }}
          >
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
              Suggerimenti
            </p>
            <ul className="space-y-1.5">
              <li className="text-sm text-neutral-500 flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">&bull;</span>
                Prova ad allargare i filtri
              </li>
              <li className="text-sm text-neutral-500 flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">&bull;</span>
                Rimuovi filtri esclusivi
              </li>
              <li className="text-sm text-neutral-500 flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">&bull;</span>
                Consenti email con stato &quot;Unknown&quot;
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/search/new?retry=${searchId}`}>
              <Button variant="primary" size="default">
                Riprova
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="default">
                Torna al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  STATE: Succeeded                                                 */
  /* ================================================================ */

  const filterChips = buildFilterChips(search.filters);

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1
            className="text-[26px] font-bold text-navy-800"
            style={{ letterSpacing: "-0.02em" }}
          >
            {search.name}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {search.completed_at ? formatDate(search.completed_at) : formatDate(search.created_at)}
            {" \u00B7 "}
            {totalLeads} lead trovate
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyAllEmails}>
            {copiedAll ? (
              <Check className="w-4 h-4 mr-1.5 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 mr-1.5" />
            )}
            {copiedAll ? "Copiato!" : "Copia Email"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => triggerExport("xlsx")}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Esporta Excel
          </Button>
          <Button variant="primary" size="sm" onClick={() => triggerExport("csv")}>
            <FileDown className="w-4 h-4 mr-1.5" />
            Esporta CSV
          </Button>
        </div>
      </div>

      {/* ---- Filter chips ---- */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {filterChips.map((chip) => (
            <span
              key={chip}
              className="text-xs font-medium px-3 py-1 rounded-md"
              style={{
                background: "var(--navy-100)",
                color: "var(--navy-700)",
                fontSize: 12,
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* ---- Search bar + counter + column toggle ---- */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Cerca per nome, email, azienda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-[9px] rounded-lg border border-neutral-200 bg-white text-[13px] text-neutral-700 placeholder:text-neutral-400 focus:border-orange-500 focus:bg-white"
          />
        </div>

        <p
          className="text-neutral-500 whitespace-nowrap"
          style={{ fontSize: 13 }}
        >
          Mostrando {filteredLeads.length} di {totalLeads} lead
        </p>

        {/* Column toggle dropdown */}
        <div className="relative" ref={columnDropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColumnDropdownOpen((prev) => !prev)}
          >
            <Columns3 className="w-4 h-4 mr-1.5" />
            Colonne
          </Button>

          {columnDropdownOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg border border-neutral-200 py-1 min-w-[200px]"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
            >
              {EXTRA_COLUMNS.map((col) => {
                const isActive = visibleExtras.has(col.key);
                return (
                  <button
                    key={col.key}
                    onClick={() => toggleExtraColumn(col.key)}
                    className={`w-full text-left px-3 py-2 text-[13px] cursor-pointer transition-colors flex items-center gap-2 ${
                      isActive
                        ? "text-navy-800 bg-navy-50"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: isActive
                          ? "var(--orange-600)"
                          : "var(--neutral-300)",
                        background: isActive ? "var(--orange-600)" : "transparent",
                      }}
                    >
                      {isActive && <Check size={12} className="text-white" />}
                    </span>
                    {col.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ---- Data Table ---- */}
      <DataTable
        columns={tableColumns}
        data={tableData}
        pageSize={PAGE_SIZE}
        searchable={false}
        onSelectionChange={handleSelectionChange}
        totalCount={totalLeads}
      />

      {/* ---- Server-side pagination ---- */}
      {totalLeads > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-1 mt-4">
          {Array.from(
            { length: Math.ceil(totalLeads / PAGE_SIZE) },
            (_, i) => i + 1
          )
            .reduce<(number | "...")[]>((pages, p, _i, arr) => {
              const total = arr.length;
              if (total <= 7) {
                pages.push(p);
              } else {
                if (p === 1 || p === total) {
                  pages.push(p);
                } else if (p >= currentPage - 1 && p <= currentPage + 1) {
                  pages.push(p);
                } else if (
                  pages.length > 0 &&
                  pages[pages.length - 1] !== "..."
                ) {
                  pages.push("...");
                }
              }
              return pages;
            }, [])
            .map((p, idx) =>
              p === "..." ? (
                <span
                  key={`dots-${idx}`}
                  className="px-2 text-[13px] text-neutral-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p as number)}
                  className={`px-[12px] py-[7px] rounded-md text-[13px] font-medium cursor-pointer transition-colors ${
                    currentPage === p
                      ? "bg-orange-600 text-white"
                      : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                  }`}
                  style={currentPage === p ? { border: "none" } : undefined}
                >
                  {p}
                </button>
              )
            )}
        </div>
      )}
    </div>
  );
}
