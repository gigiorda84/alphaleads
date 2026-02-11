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

          return NextResponse.json({
            status: 'failed',
            leads_count: 0,
            error_message: `La ricerca ha superato il tempo massimo di ${TIMEOUT_MINUTES} minuti`,
          });
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

          return NextResponse.json({
            status: 'failed',
            leads_count: 0,
            error_message: 'Errore nel recupero dei risultati dal dataset Apify',
          });
        }

        const items: Record<string, unknown>[] = await datasetResponse.json();

        // Deduplicate results
        const deduplicatedItems = deduplicateLeads(items);

        // Map and insert leads into DB
        if (deduplicatedItems.length > 0) {
          const leads = deduplicatedItems.map((item) => ({
            search_id: search.id,
            first_name: item.first_name ?? null,
            last_name: item.last_name ?? null,
            full_name: item.full_name ?? null,
            job_title: item.job_title ?? null,
            headline: item.headline ?? null,
            functional_level: item.functional_level ?? null,
            seniority_level: item.seniority_level ?? null,
            email: item.email ?? null,
            mobile_number: item.mobile_number ?? null,
            personal_email: item.personal_email ?? null,
            linkedin: item.linkedin ?? null,
            city: item.city ?? null,
            state: item.state ?? null,
            country: item.country ?? null,
            company_name: item.company_name ?? null,
            company_domain: item.company_domain ?? null,
            company_website: item.company_website ?? null,
            company_linkedin: item.company_linkedin ?? null,
            company_linkedin_uid: item.company_linkedin_uid ?? null,
            company_size: item.company_size ?? null,
            industry: item.industry ?? null,
            company_description: item.company_description ?? null,
            company_annual_revenue: item.company_annual_revenue ?? null,
            company_annual_revenue_clean: item.company_annual_revenue_clean ?? null,
            company_total_funding: item.company_total_funding ?? null,
            company_total_funding_clean: item.company_total_funding_clean ?? null,
            company_founded_year: item.company_founded_year ?? null,
            company_phone: item.company_phone ?? null,
            company_street_address: item.company_street_address ?? null,
            company_city: item.company_city ?? null,
            company_state: item.company_state ?? null,
            company_country: item.company_country ?? null,
            company_postal_code: item.company_postal_code ?? null,
            company_full_address: item.company_full_address ?? null,
            company_market_cap: item.company_market_cap ?? null,
            keywords: item.keywords ?? null,
            company_technologies: item.company_technologies ?? null,
          }));

          // Batch insert in chunks of 500 to avoid payload limits
          const BATCH_SIZE = 500;
          for (let i = 0; i < leads.length; i += BATCH_SIZE) {
            const batch = leads.slice(i, i + BATCH_SIZE);
            await supabase.from('leads').insert(batch);
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

        return NextResponse.json({
          status: 'succeeded',
          leads_count: leadsCount,
          error_message: null,
        });
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

        return NextResponse.json({
          status: 'failed',
          leads_count: 0,
          error_message: errorMsg,
        });
      }

      // Still running
      return NextResponse.json({
        status: 'running',
        leads_count: 0,
        error_message: null,
      });
    }

    // Search is not running -- return current state
    return NextResponse.json({
      status: search.status,
      leads_count: search.leads_count,
      error_message: search.error_message,
    });
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
