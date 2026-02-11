"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Copy, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Search as SearchType, SearchStatus } from "@/types/database";
import Badge from "@/components/ui/Badge";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDateTime(dateString: string): string {
  const d = new Date(dateString);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function statusBadge(status: SearchStatus) {
  const map: Record<
    SearchStatus,
    { variant: "success" | "warning" | "error" | "info"; label: string }
  > = {
    succeeded: { variant: "success", label: "Completata" },
    running: { variant: "warning", label: "In corso" },
    failed: { variant: "error", label: "Fallita" },
    pending: { variant: "info", label: "In attesa" },
  };
  const { variant, label } = map[status] ?? map.pending;
  return <Badge variant={variant}>{label}</Badge>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SearchesPage() {
  const [searches, setSearches] = useState<SearchType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const supabase = createClient();

  /* ---- Fetch searches ---- */
  const fetchSearches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("searches")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSearches(data as SearchType[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSearches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Client-side filter ---- */
  const filtered = useMemo(() => {
    if (!query.trim()) return searches;
    const q = query.toLowerCase();
    return searches.filter((s) => s.name.toLowerCase().includes(q));
  }, [searches, query]);

  /* ---- Delete handler ---- */
  const handleDelete = async (searchId: string) => {
    const confirmed = window.confirm(
      "Sei sicuro di voler eliminare questa ricerca? L'azione non puo essere annullata."
    );
    if (!confirmed) return;

    await supabase.from("searches").delete().eq("id", searchId);
    fetchSearches();
  };

  /* ---- Duplicate handler ---- */
  const handleDuplicate = (search: SearchType) => {
    const encodedFilters = encodeURIComponent(JSON.stringify(search.filters));
    window.location.href = `/search/new?template=${encodedFilters}`;
  };

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* Header */}
      <h1
        className="text-[26px] font-bold text-navy-800 mb-6"
        style={{ letterSpacing: "-0.02em" }}
      >
        Le tue Ricerche
      </h1>

      {/* Search bar */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Cerca tra le ricerche..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-[10px] rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Searches list card */}
      <div
        className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-6 h-6 border-2 border-neutral-200 border-t-orange-600 rounded-full animate-spin"
            />
          </div>
        ) : filtered.length === 0 && searches.length === 0 ? (
          /* Empty state — no searches at all */
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Search className="w-10 h-10 text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-500 text-center">
              Non hai ancora effettuato nessuna ricerca.{" "}
              <Link
                href="/search/new"
                className="text-orange-600 font-semibold hover:underline"
              >
                Inizia ora!
              </Link>
            </p>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state — filter returned nothing */
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Search className="w-10 h-10 text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-500 text-center">
              Nessuna ricerca trovata per &ldquo;{query}&rdquo;.
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div
              className="grid bg-neutral-50 px-5 py-[10px] border-b border-neutral-200"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 100px" }}
            >
              <span className="text-[11px] font-bold uppercase text-neutral-500 tracking-wide">
                Nome
              </span>
              <span className="text-[11px] font-bold uppercase text-neutral-500 tracking-wide">
                Data
              </span>
              <span className="text-[11px] font-bold uppercase text-neutral-500 tracking-wide">
                Lead
              </span>
              <span className="text-[11px] font-bold uppercase text-neutral-500 tracking-wide">
                Stato
              </span>
              <span className="text-[11px] font-bold uppercase text-neutral-500 tracking-wide">
                Azioni
              </span>
            </div>

            {/* Data rows */}
            {filtered.map((s) => (
              <div
                key={s.id}
                className="grid items-center px-5 py-[14px] border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors"
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 100px" }}
              >
                {/* Name — clickable link */}
                <Link
                  href={`/search/${s.id}`}
                  className="font-medium text-navy-800 text-sm truncate pr-4 hover:underline"
                >
                  {s.name}
                </Link>

                {/* Date */}
                <span className="text-sm text-neutral-500">
                  {formatDateTime(s.created_at)}
                </span>

                {/* Leads count */}
                <span className="text-sm font-medium text-neutral-700">
                  {s.leads_count}
                </span>

                {/* Status */}
                <span>{statusBadge(s.status)}</span>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(s)}
                    title="Duplica ricerca"
                    className="p-1.5 rounded-md text-neutral-400 hover:text-navy-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    title="Elimina ricerca"
                    className="p-1.5 rounded-md text-neutral-400 hover:text-coral-600 hover:bg-coral-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
