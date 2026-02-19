import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';
import type { Lead } from '@/types/database';

const EXPORT_COLUMNS: { header: string; key: keyof Lead }[] = [
  // Contact info
  { header: 'First Name', key: 'first_name' },
  { header: 'Last Name', key: 'last_name' },
  { header: 'Full Name', key: 'full_name' },
  { header: 'Job Title', key: 'job_title' },
  { header: 'Headline', key: 'headline' },
  { header: 'Seniority', key: 'seniority_level' },
  { header: 'Functional Level', key: 'functional_level' },
  { header: 'Email', key: 'email' },
  { header: 'Personal Email', key: 'personal_email' },
  { header: 'Phone', key: 'mobile_number' },
  { header: 'LinkedIn', key: 'linkedin' },
  { header: 'City', key: 'city' },
  { header: 'State', key: 'state' },
  { header: 'Country', key: 'country' },
  // Company info
  { header: 'Company', key: 'company_name' },
  { header: 'Company Domain', key: 'company_domain' },
  { header: 'Company Website', key: 'company_website' },
  { header: 'Company LinkedIn', key: 'company_linkedin' },
  { header: 'Industry', key: 'industry' },
  { header: 'Company Size', key: 'company_size' },
  { header: 'Company Description', key: 'company_description' },
  { header: 'Revenue', key: 'company_annual_revenue' },
  { header: 'Total Funding', key: 'company_total_funding' },
  { header: 'Founded Year', key: 'company_founded_year' },
  { header: 'Company Phone', key: 'company_phone' },
  { header: 'Company Street Address', key: 'company_street_address' },
  { header: 'Company City', key: 'company_city' },
  { header: 'Company State', key: 'company_state' },
  { header: 'Company Country', key: 'company_country' },
  { header: 'Company Postal Code', key: 'company_postal_code' },
  { header: 'Company Full Address', key: 'company_full_address' },
  { header: 'Market Cap', key: 'company_market_cap' },
  { header: 'Keywords', key: 'keywords' },
  { header: 'Technologies', key: 'company_technologies' },
];

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
      .select('id, name')
      .eq('id', searchId)
      .eq('user_id', user.id)
      .single();

    if (searchError || !search) {
      return NextResponse.json({ error: 'Ricerca non trovata' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const idsParam = searchParams.get('ids');

    // Fetch leads
    let query = supabase
      .from('leads')
      .select('*')
      .eq('search_id', searchId);

    if (idsParam) {
      const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        query = query.in('id', ids);
      }
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      return NextResponse.json(
        { error: 'Errore nel recupero dei lead' },
        { status: 500 }
      );
    }

    const rows = (leads || []).map((lead) => {
      const row: Record<string, string> = {};
      for (const col of EXPORT_COLUMNS) {
        const value = lead[col.key];
        if (Array.isArray(value)) {
          row[col.header] = value.join(', ');
        } else {
          row[col.header] = value != null ? String(value) : '';
        }
      }
      return row;
    });

    const fileName = (search.name || 'export').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'export';

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(rows, {
        header: EXPORT_COLUMNS.map((c) => c.header),
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
        },
      });
    }

    // Default: CSV
    const headers = EXPORT_COLUMNS.map((c) => c.header);
    const csvLines: string[] = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map((h) => {
        const val = row[h] || '';
        // Escape double quotes and wrap in quotes if necessary
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvLines.push(values.join(','));
    }

    const csvContent = csvLines.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}.csv"`,
      },
    });
  } catch (error) {
    console.error('Errore in GET /api/search/[searchId]/export:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
