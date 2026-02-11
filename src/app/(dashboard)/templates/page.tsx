"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Template, SearchFilters } from "@/types/database";
import Button from "@/components/ui/Button";

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

/** Readable labels for filter keys */
const filterLabels: Record<string, string> = {
  fetch_count: "Quantita",
  contact_job_title: "Job Title",
  contact_not_job_title: "Escludi Job Title",
  seniority_level: "Seniority",
  functional_level: "Funzione",
  contact_location: "Localita",
  contact_city: "Citta",
  contact_not_location: "Escludi Localita",
  contact_not_city: "Escludi Citta",
  email_status: "Email Status",
  company_domain: "Dominio",
  size: "Dimensione Azienda",
  company_industry: "Settore",
  company_not_industry: "Escludi Settore",
  company_keywords: "Keywords",
  company_not_keywords: "Escludi Keywords",
  min_revenue: "Revenue Min",
  max_revenue: "Revenue Max",
  funding: "Funding",
  file_name: "Nome File",
};

/** Build compact chips from filters object */
function getFilterChips(filters: SearchFilters): { label: string; value: string }[] {
  const chips: { label: string; value: string }[] = [];

  for (const [key, val] of Object.entries(filters)) {
    if (val === undefined || val === null || val === "") continue;
    if (Array.isArray(val) && val.length === 0) continue;

    const label = filterLabels[key] || key;

    if (Array.isArray(val)) {
      chips.push({ label, value: val.join(", ") });
    } else {
      chips.push({ label, value: String(val) });
    }
  }

  return chips;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  /* ---- Fetch templates ---- */
  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTemplates(data as Template[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Delete handler ---- */
  const handleDelete = async (templateId: string) => {
    const confirmed = window.confirm(
      "Sei sicuro di voler eliminare questo template? L'azione non puo essere annullata."
    );
    if (!confirmed) return;

    await supabase.from("templates").delete().eq("id", templateId);
    fetchTemplates();
  };

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[26px] font-bold text-navy-800"
          style={{ letterSpacing: "-0.02em" }}
        >
          I tuoi Template
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-neutral-200 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        /* Empty state */
        <div
          className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col items-center justify-center py-16 px-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <Bookmark className="w-10 h-10 text-neutral-300 mb-4" />
          <p className="text-sm text-neutral-500 text-center max-w-md">
            Non hai ancora salvato nessun template. Salva una configurazione di
            filtri durante una ricerca per riutilizzarla in futuro.
          </p>
        </div>
      ) : (
        /* Templates grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => {
            const chips = getFilterChips(t.filters);

            return (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-neutral-200 p-5"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                {/* Name */}
                <h3 className="text-base font-semibold text-navy-800 mb-1">
                  {t.name}
                </h3>

                {/* Date */}
                <p className="text-xs text-neutral-500 mb-3">
                  Creato il {formatDate(t.created_at)}
                </p>

                {/* Filter chips */}
                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {chips.map((chip, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600 border border-neutral-200"
                      >
                        <span className="font-medium mr-1">{chip.label}:</span>
                        <span className="truncate max-w-[180px]">
                          {chip.value}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <Link href={`/search/new?templateId=${t.id}`}>
                    <Button variant="primary" size="sm">
                      Usa Template
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Elimina
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
