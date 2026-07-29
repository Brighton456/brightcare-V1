/**
 * Brightcare — Safe Supabase Proxy
 * 
 * Previously wrapped supabase.from() with offline fallback,
 * but the Proxy approach broke PostgREST method chaining
 * (.select().eq().order() etc.) causing silent query failures.
 * 
 * Now re-exports the raw client directly for reliability.
 * All 83+ files importing safeSupabase continue to work unchanged.
 */

import { supabase } from '@/integrations/supabase/client';

export const safeSupabase = supabase;

export function safeFrom(table: string) {
  return supabase.from(table as any);
}
