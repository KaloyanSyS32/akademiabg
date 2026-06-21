if (typeof window.supabase === 'undefined') {
    throw new Error('Supabase UMD script missing or not loaded before module execution.');
}

const SUPABASE_URL = 'https://nnigkcvvpggukwqeavuy.supabase.co';
const PUBLIC_TOKEN = 'sb_publishable_xvo15GPMbJ08c__oUA7ekA_z8HJRIB5';

export const supabase = window.supabase.createClient(SUPABASE_URL, PUBLIC_TOKEN, {
    auth: {
        persistSession: true,
        autoRefreshToken: true
    }
});