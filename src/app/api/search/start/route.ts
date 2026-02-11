import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    // Build Apify payload -- keys in SearchFilters already match the Apify input schema
    const apifyInput: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'file_name') continue; // file_name is internal only
      if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        apifyInput[key] = value;
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

      return NextResponse.json(
        { error: 'Errore nell\'avvio della ricerca su Apify' },
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

function hasAtLeastOneFilter(filters: SearchFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === 'file_name') return false;
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
}
