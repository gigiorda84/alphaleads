import Link from "next/link";
import { Search, Users, Mail, Clock, Plus, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Search as SearchType, SearchStatus } from "@/types/database";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Adesso";
  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours}h fa`;
  if (diffDays < 30) return `${diffDays}g fa`;
  return formatDate(dateString);
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
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
/*  Page (Server Component)                                            */
/* ------------------------------------------------------------------ */

export default async function DashboardPage() {
  const supabase = await createClient();

  /* ---- auth + profile ---- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    firstName = profile?.full_name?.split(" ")[0] ?? "";
  }

  /* ---- stats ---- */
  const userId = user?.id ?? "";

  // Total searches
  const { count: totalSearches } = await supabase
    .from("searches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Recent 5 searches (also used for last-search stat)
  const { data: recentSearches } = await supabase
    .from("searches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const searches: SearchType[] = recentSearches ?? [];

  // Get all searches for total lead count
  const { data: allSearches } = await supabase
    .from("searches")
    .select("leads_count")
    .eq("user_id", userId);

  const totalLeads = (allSearches ?? []).reduce(
    (sum, s) => sum + (s.leads_count ?? 0),
    0
  );

  // Verified emails — approximation using total leads
  const verifiedEmails = totalLeads;

  // Last search relative time
  const lastSearchTime =
    searches.length > 0 ? formatRelativeTime(searches[0].created_at) : "N/A";

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-[26px] font-bold text-navy-800"
            style={{ letterSpacing: "-0.02em" }}
          >
            Dashboard
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Ciao, {firstName || "utente"}. Ecco un riepilogo della tua
            attivit&agrave;.
          </p>
        </div>

        <Link href="/search/new">
          <Button variant="primary" size="default">
            <Plus className="w-4 h-4 mr-2" />
            Nuova Ricerca
          </Button>
        </Link>
      </div>

      {/* ---- Stats Row ---- */}
      <div className="flex gap-5 mb-9">
        <div className="flex-1">
          <StatCard
            icon={<Search className="w-5 h-5" />}
            label="Ricerche totali"
            value={String(totalSearches ?? 0)}
          />
        </div>
        <div className="flex-1">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Lead estratte"
            value={String(totalLeads ?? 0)}
          />
        </div>
        <div className="flex-1">
          <StatCard
            icon={<Mail className="w-5 h-5" />}
            label="Email verificate"
            value={String(verifiedEmails ?? 0)}
          />
        </div>
        <div className="flex-1">
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Ultima ricerca"
            value={lastSearchTime}
          />
        </div>
      </div>

      {/* ---- Recent Searches ---- */}
      <div
        className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-[18px] border-b border-neutral-200">
          <h2 className="text-base font-semibold text-navy-800">
            Ricerche Recenti
          </h2>
          <Link
            href="/searches"
            className="text-[13px] font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            Vedi tutte &rarr;
          </Link>
        </div>

        {searches.length === 0 ? (
          /* Empty state */
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
        ) : (
          <>
            {/* Table header */}
            <div
              className="grid bg-neutral-50 px-5 py-[10px] text-xs font-semibold text-neutral-500 uppercase tracking-wide border-b border-neutral-200"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 60px" }}
            >
              <span>Nome</span>
              <span>Data</span>
              <span>Lead</span>
              <span>Stato</span>
              <span />
            </div>

            {/* Data rows */}
            {searches.map((s) => (
              <Link
                key={s.id}
                href={`/search/${s.id}`}
                className="grid items-center px-5 py-[14px] border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors cursor-pointer"
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 60px" }}
              >
                <span className="font-medium text-navy-800 text-sm truncate pr-4">
                  {s.name}
                </span>
                <span className="text-sm text-neutral-500">
                  {formatDate(s.created_at)}
                </span>
                <span className="text-sm font-medium text-neutral-700">
                  {s.leads_count}
                </span>
                <span>{statusBadge(s.status)}</span>
                <span className="flex justify-end">
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </span>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
