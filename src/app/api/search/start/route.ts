import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ALLOWED_LOCATIONS } from '@/lib/apify-locations';
import type { SearchFilters } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const filters: SearchFilters = body.filters;

    if (!filters || !hasAtLeastOneFilter(filters)) {
      return NextResponse.json(
        { error: 'Almeno un filtro deve essere compilato' },
        { status: 400 }
      );
    }

    // Build search name
    const now = new Date();
    const name =
      filters.file_name?.trim() ||
      `Ricerca ${now.toLocaleDateString('it-IT')} ${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;

    // Create search record
    const { data: search, error: insertError } = await supabase
      .from('searches')
      .insert({
        user_id: user.id,
        name,
        filters,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !search) {
      return NextResponse.json(
        { error: 'Errore nella creazione della ricerca' },
        { status: 500 }
      );
    }

    // Get Apify token: prefer user's own key, fall back to env
    let apifyToken = process.env.APIFY_API_TOKEN;

    const { data: profile } = await supabase
      .from('profiles')
      .select('apify_api_token')
      .eq('id', user.id)
      .single();

    if (profile?.apify_api_token) {
      apifyToken = profile.apify_api_token;
    }

    if (!apifyToken) {
      await supabase
        .from('searches')
        .update({ status: 'failed', error_message: 'Token API Apify non configurato' })
        .eq('id', search.id);

      return NextResponse.json(
        { error: 'Token API Apify non configurato' },
        { status: 500 }
      );
    }

    // Build Apify payload — map UI display values to Apify API values
    const apifyInput: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'file_name') continue; // file_name is internal only
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;

      if (Array.isArray(value)) {
        apifyInput[key] = value.map((v) => mapToApifyValue(key, v));
      } else {
        apifyInput[key] = value;
      }
    }

    // Resolve contact_location: match user input to allowed values,
    // move unresolvable entries to contact_city as fallback
    if (Array.isArray(apifyInput.contact_location)) {
      const resolved: string[] = [];
      const fallbackCity: string[] = [];

      for (const raw of apifyInput.contact_location as string[]) {
        const match = resolveLocation(raw);
        if (match) {
          resolved.push(match);
        } else {
          fallbackCity.push(raw);
        }
      }

      if (resolved.length > 0) {
        apifyInput.contact_location = resolved;
      } else {
        delete apifyInput.contact_location;
      }

      // Merge unresolved locations into contact_city
      if (fallbackCity.length > 0) {
        const existing = (apifyInput.contact_city as string[]) || [];
        apifyInput.contact_city = [...existing, ...fallbackCity];
      }
    }

    // Call Apify
    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/IoSHqwTR9YGhzccez/runs?token=${apifyToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apifyInput),
      }
    );

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      await supabase
        .from('searches')
        .update({
          status: 'failed',
          error_message: `Errore Apify: ${apifyResponse.status} - ${errorText}`,
        })
        .eq('id', search.id);

      // Try to extract a readable error from Apify's response
      let userMessage = 'Errore nell\'avvio della ricerca su Apify';
      try {
        const apifyError = JSON.parse(errorText);
        if (apifyError?.error?.message) {
          userMessage = apifyError.error.message;
        }
      } catch { /* use default message */ }

      return NextResponse.json(
        { error: userMessage },
        { status: 500 }
      );
    }

    const apifyData = await apifyResponse.json();

    await supabase
      .from('searches')
      .update({
        apify_run_id: apifyData.data.id,
        apify_dataset_id: apifyData.data.defaultDatasetId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', search.id);

    return NextResponse.json({ searchId: search.id });
  } catch (error) {
    console.error('Errore in POST /api/search/start:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

/** Maps UI display labels to the exact values the Apify actor accepts */
const APIFY_VALUE_MAP: Record<string, Record<string, string>> = {
  seniority_level: {
    'Founder': 'founder',
    'Owner': 'owner',
    'C-Level': 'c_suite',
    'Director': 'director',
    'Partner': 'partner',
    'VP': 'vp',
    'Head': 'head',
    'Manager': 'manager',
    'Senior': 'senior',
    'Entry': 'entry',
    'Trainee': 'trainee',
  },
  functional_level: {
    'C-Level': 'c_suite',
    'Finance': 'finance',
    'Product': 'product_management',
    'Engineering': 'engineering',
    'Design': 'design',
    'Education': 'education',
    'HR': 'human_resources',
    'IT': 'information_technology',
    'Legal': 'legal',
    'Marketing': 'marketing',
    'Operations': 'operations',
    'Sales': 'sales',
    'Support': 'support',
  },
  email_status: {
    'Validated': 'validated',
    'Not Validated': 'not_validated',
    'Unknown': 'unknown',
  },
  funding: {
    'Seed': 'seed',
    'Angel': 'angel',
    'Series A': 'series_a',
    'Series B': 'series_b',
    'Series C': 'series_c',
    'Series D': 'series_d',
    'Series E': 'series_e',
    'Series F': 'series_f',
    'Venture': 'venture_round',
    'Debt Financing': 'debt_financing',
    'Convertible Note': 'convertible_note',
    'Private Equity': 'private_equity_round',
    'Other': 'other_round',
  },
};

function mapToApifyValue(field: string, uiValue: string): string {
  return APIFY_VALUE_MAP[field]?.[uiValue] ?? uiValue;
}

/** Resolve a user-entered location to an allowed Apify value.
 *  "piemonte" → "piemonte, italy", "italy" → "italy", "xyz" → null */
function resolveLocation(input: string): string | null {
  const lower = input.toLowerCase().trim();
  // Exact match
  if (ALLOWED_LOCATIONS.has(lower)) return lower;
  // Prefix match: "piemonte" → "piemonte, italy"
  for (const loc of ALLOWED_LOCATIONS) {
    if (loc.startsWith(lower + ', ')) return loc;
  }
  return null;
}

function hasAtLeastOneFilter(filters: SearchFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === 'file_name') return false;
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
}
