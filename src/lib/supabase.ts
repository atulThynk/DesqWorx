import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please connect to Supabase first.');
}

if (!supabaseServiceKey) {
  throw new Error('Missing Supabase service role key. This is required for admin operations.');
}

// Regular client for normal operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client with elevated privileges - only use for admin operations
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});