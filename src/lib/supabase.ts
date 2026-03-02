import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

export const createClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        // Fallback for build time if keys are not yet in Vercel
        return createBrowserClient<Database>(
            url || 'https://placeholder.supabase.co',
            key || 'placeholder-key'
        );
    }

    return createBrowserClient<Database>(url, key);
};
