import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://idiufntnksyvkmluiamk.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXVmbnRua3N5dmttbHVpYW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDc5MTksImV4cCI6MjEwNDEyMzkxOX0.QFbAYjBxUpBVPt3T3RmOO7sfoqJxLx_qBmr146qc5sg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
