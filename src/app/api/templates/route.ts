import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SearchFilters } from '@/types/database';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Errore query templates:', error);
      return NextResponse.json(
        { error: 'Errore nel recupero dei template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error('Errore in GET /api/templates:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

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
    const { name, filters }: { name: string; filters: SearchFilters } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Il nome del template e obbligatorio' },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        name: name.trim(),
        filters: filters || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Errore creazione template:', error);
      return NextResponse.json(
        { error: 'Errore nella creazione del template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    console.error('Errore in POST /api/templates:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
