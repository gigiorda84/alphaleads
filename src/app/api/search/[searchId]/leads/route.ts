import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
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

    // Verify search belongs to user
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('id')
      .eq('id', searchId)
      .eq('user_id', user.id)
      .single();

    if (searchError || !search) {
      return NextResponse.json({ error: 'Ricerca non trovata' }, { status: 404 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') === 'asc' ? true : false; // ascending = true
    const q = searchParams.get('q')?.trim() || '';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('search_id', searchId);

    // Text search across multiple columns
    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,email.ilike.%${q}%,company_name.ilike.%${q}%,job_title.ilike.%${q}%`
      );
    }

    // Apply sorting and pagination
    query = query.order(sort, { ascending: order }).range(from, to);

    const { data: leads, count, error: leadsError } = await query;

    if (leadsError) {
      console.error('Errore query leads:', leadsError);
      return NextResponse.json(
        { error: 'Errore nel recupero dei lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: leads || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Errore in GET /api/search/[searchId]/leads:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
