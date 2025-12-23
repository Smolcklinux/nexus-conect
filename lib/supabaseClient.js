import { createClient } from '@supabase/supabase-js';

// Pegamos as variáveis do ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificação de segurança simples para JavaScript
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: Variáveis do Supabase não encontradas no .env.local");
}

// Em .js, removemos o "as string", pois o JavaScript já entende a variável
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from '@supabase/supabase-js';

// No Vite, usamos import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Variáveis de ambiente do Supabase não encontradas.");
}

// Em arquivo .js, não usamos "as string"
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
