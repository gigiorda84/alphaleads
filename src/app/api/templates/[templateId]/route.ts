import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SearchFilters } from '@/types/database';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { name, filters }: { name?: string; filters?: SearchFilters } = body;

    // Build update payload with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (filters !== undefined) updateData.filters = filters;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun dato da aggiornare' },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', templateId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Errore aggiornamento template:', error);
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento del template' },
        { status: 500 }
      );
    }

    if (!template) {
      return NextResponse.json({ error: 'Template non trovato' }, { status: 404 });
    }

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error('Errore in PUT /api/templates/[templateId]:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Errore eliminazione template:', error);
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione del template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore in DELETE /api/templates/[templateId]:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
