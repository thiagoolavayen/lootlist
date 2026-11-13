import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://xdxkfshxmmghmbrtwrer.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XBcA7-WYi0gKfLtRgH2mZA_V8Zxbwyb';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
