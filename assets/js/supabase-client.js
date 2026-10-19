import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase-config.js';

export async function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('O blog ainda não foi conectado ao Supabase. Siga o guia SUPABASE-SETUP.md.');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(SUPABASE_URL);
  } catch {
    throw new Error('A URL do Supabase em assets/js/supabase-config.js é inválida.');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('A URL do Supabase precisa usar HTTPS.');
  }

  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
