import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const TIMEOUT_MINUTES = 30;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ searchId: string }> }
) {
  try {
    const { searchId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Fetch search record
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('*')
      .eq('id', searchId)
      .eq('user_id', user.id)
      .single();

    if (searchError || !search) {
      return NextResponse.json({ error: 'Ricerca non trovata' }, { status: 404 });
    }

    // If the search is still running, poll Apify for an update
    if (search.status === 'running') {
      // Get Apify token
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
        return NextResponse.json(
          { error: 'Token API Apify non configurato' },
          { status: 500 }
        );
      }

      // Check timeout first
      if (search.started_at) {
        const startedAt = new Date(search.started_at).getTime();
        const now = Date.now();
        if (now - startedAt > TIMEOUT_MINUTES * 60 * 1000) {
          await supabase
            .from('searches')
            .update({
              status: 'failed',
              error_message: `La ricerca ha superato il tempo massimo di ${TIMEOUT_MINUTES} minuti`,
            })
            .eq('id', search.id);

          const { data: timedOutSearch } = await supabase
            .from('searches')
            .select('*')
            .eq('id', search.id)
            .single();

          return NextResponse.json({ search: timedOutSearch ?? search });
        }
      }

      // Poll Apify run status
      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/IoSHqwTR9YGhzccez/runs/${search.apify_run_id}?token=${apifyToken}`
      );

      if (!runResponse.ok) {
        return NextResponse.json({
          status: search.status,
          leads_count: search.leads_count,
          error_message: search.error_message,
        });
      }

      const runData = await runResponse.json();
      const apifyStatus: string = runData.data?.status;

      if (apifyStatus === 'SUCCEEDED') {
        // Fetch dataset items
        const datasetResponse = await fetch(
          `https://api.apify.com/v2/datasets/${search.apify_dataset_id}/items?token=${apifyToken}&format=json`
        );

        if (!datasetResponse.ok) {
          await supabase
            .from('searches')
            .update({
              status: 'failed',
              error_message: 'Errore nel recupero dei risultati dal dataset Apify',
            })
            .eq('id', search.id);

          const { data: failedDatasetSearch } = await supabase
            .from('searches')
            .select('*')
            .eq('id', search.id)
            .single();

          return NextResponse.json({ search: failedDatasetSearch ?? search });
        }

        const items: Record<string, unknown>[] = await datasetResponse.json();
        console.log(`[Status] Dataset fetched: ${items.length} items for search ${search.id}`);
        if (items.length > 0) {
          console.log('[Status] Sample item keys:', Object.keys(items[0]).join(', '));
        }

        // Deduplicate results
        const deduplicatedItems = deduplicateLeads(items);

        // Map and insert leads into DB
        if (deduplicatedItems.length > 0) {
          const leads = deduplicatedItems.map((item) => ({
            search_id: search.id,
            first_name: toStr(item.first_name),
            last_name: toStr(item.last_name),
            full_name: toStr(item.full_name),
            job_title: toStr(item.job_title),
            headline: toStr(item.headline),
            functional_level: toStr(item.functional_level),
            seniority_level: toStr(item.seniority_level),
            email: toStr(item.email),
            mobile_number: toStr(item.mobile_number),
            personal_email: toStr(item.personal_email),
            linkedin: toStr(item.linkedin),
            city: toStr(item.city),
            state: toStr(item.state),
            country: toStr(item.country),
            company_name: toStr(item.company_name),
            company_domain: toStr(item.company_domain),
            company_website: toStr(item.company_website),
            company_linkedin: toStr(item.company_linkedin),
            company_linkedin_uid: toStr(item.company_linkedin_uid),
            company_size: toStr(item.company_size),
            industry: toStr(item.industry),
            company_description: toStr(item.company_description),
            company_annual_revenue: toStr(item.company_annual_revenue),
            company_annual_revenue_clean: toNum(item.company_annual_revenue_clean),
            company_total_funding: toStr(item.company_total_funding),
            company_total_funding_clean: toNum(item.company_total_funding_clean),
            company_founded_year: toInt(item.company_founded_year),
            company_phone: toStr(item.company_phone),
            company_street_address: toStr(item.company_street_address),
            company_city: toStr(item.company_city),
            company_state: toStr(item.company_state),
            company_country: toStr(item.company_country),
            company_postal_code: toStr(item.company_postal_code),
            company_full_address: toStr(item.company_full_address),
            company_market_cap: toStr(item.company_market_cap),
            keywords: toStrArray(item.keywords),
            company_technologies: toStrArray(item.company_technologies),
          }));

          // Batch insert in chunks of 500 to avoid payload limits
          const BATCH_SIZE = 500;
          for (let i = 0; i < leads.length; i += BATCH_SIZE) {
            const batch = leads.slice(i, i + BATCH_SIZE);
            const { error: insertError } = await supabase.from('leads').insert(batch);
            if (insertError) {
              console.error('Errore inserimento leads batch:', insertError);
            }
          }
        }

        const leadsCount = deduplicatedItems.length;

        await supabase
          .from('searches')
          .update({
            status: 'succeeded',
            leads_count: leadsCount,
            completed_at: new Date().toISOString(),
          })
          .eq('id', search.id);

        const { data: succeededSearch } = await supabase
          .from('searches')
          .select('*')
          .eq('id', search.id)
          .single();

        return NextResponse.json({ search: succeededSearch ?? search });
      } else if (apifyStatus === 'FAILED' || apifyStatus === 'ABORTED' || apifyStatus === 'TIMED-OUT') {
        const errorMsg =
          runData.data?.statusMessage || `La ricerca Apify e terminata con stato: ${apifyStatus}`;

        await supabase
          .from('searches')
          .update({
            status: 'failed',
            error_message: errorMsg,
          })
          .eq('id', search.id);

        const { data: failedApifySearch } = await supabase
          .from('searches')
          .select('*')
          .eq('id', search.id)
          .single();

        return NextResponse.json({ search: failedApifySearch ?? search });
      }

      // Still running — refetch to return the latest record
      const { data: updatedSearch } = await supabase
        .from('searches')
        .select('*')
        .eq('id', searchId)
        .single();

      return NextResponse.json({ search: updatedSearch ?? search });
    }

    // Search is not running -- return current state
    return NextResponse.json({ search });
  } catch (error) {
    console.error('Errore in GET /api/search/[searchId]/status:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

/**
 * Deduplicates an array of lead records using three priority levels:
 * 1. Email (highest priority)
 * 2. LinkedIn URL
 * 3. full_name + company_domain combination
 */
function deduplicateLeads(items: Record<string, unknown>[]): Record<string, unknown>[] {
  const seenEmails = new Set<string>();
  const seenLinkedins = new Set<string>();
  const seenNameDomain = new Set<string>();
  const result: Record<string, unknown>[] = [];

  for (const item of items) {
    const email = typeof item.email === 'string' ? item.email.toLowerCase().trim() : '';
    const linkedin = typeof item.linkedin === 'string' ? item.linkedin.toLowerCase().trim() : '';
    const fullName = typeof item.full_name === 'string' ? item.full_name.toLowerCase().trim() : '';
    const companyDomain = typeof item.company_domain === 'string' ? item.company_domain.toLowerCase().trim() : '';

    // Priority 1: deduplicate by email
    if (email) {
      if (seenEmails.has(email)) continue;
      seenEmails.add(email);
    }

    // Priority 2: deduplicate by linkedin URL
    if (linkedin) {
      if (seenLinkedins.has(linkedin)) continue;
      seenLinkedins.add(linkedin);
    }

    // Priority 3: deduplicate by full_name + company_domain
    if (fullName && companyDomain) {
      const key = `${fullName}::${companyDomain}`;
      if (seenNameDomain.has(key)) continue;
      seenNameDomain.add(key);
    }

    result.push(item);
  }

  return result;
}

/** Safe type casters for Apify → Supabase */
function toStr(val: unknown): string | null {
  if (val == null || val === '') return null;
  return String(val);
}

function toNum(val: unknown): number | null {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function toInt(val: unknown): number | null {
  if (val == null || val === '') return null;
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : null;
}

function toStrArray(val: unknown): string[] | null {
  if (val == null) return null;
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string' && val.trim()) return val.split(',').map((s) => s.trim());
  return null;
}
