
import { createClient } from '@supabase/supabase-js';

// Substitua pelas suas credenciais do projeto Supabase
const supabaseUrl = 'SUA_URL_DO_SUPABASE';
const supabaseAnonKey = 'SUA_ANON_KEY_DO_SUPABASE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
