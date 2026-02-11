import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { apiKey }: { apiKey: string } = body;

    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: 'API key obbligatoria' },
        { status: 400 }
      );
    }

    // Test the key against Apify
    const response = await fetch(
      `https://api.apify.com/v2/users/me?token=${apiKey.trim()}`
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        valid: true,
        username: data.data?.username || data.data?.name || null,
      });
    }

    return NextResponse.json({ valid: false });
  } catch (error) {
    console.error('Errore in POST /api/settings/verify-apify-key:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
