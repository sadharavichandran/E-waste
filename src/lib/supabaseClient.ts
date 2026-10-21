import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'ecoloop_supabase_url';
const STORAGE_KEY_KEY = 'ecoloop_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  source: 'env' | 'storage' | 'none';
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let storedUrl = '';
  let storedKey = '';

  if (typeof window !== 'undefined') {
    try {
      storedUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
      storedKey = (localStorage.getItem(STORAGE_KEY_KEY) || '').trim();
    } catch (e) {
      console.warn('Unable to read supabase credentials from localStorage', e);
    }
  }

  // Stored takes precedence over env if explicitly provided by user in UI
  if (storedUrl.startsWith('https://') && storedKey.length > 20) {
    return { url: storedUrl, anonKey: storedKey, source: 'storage' };
  }

  if (
    envUrl.startsWith('https://') &&
    !envUrl.includes('your-project') &&
    envKey.length > 20 &&
    !envKey.includes('your-anon-key')
  ) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  return { url: storedUrl || envUrl, anonKey: storedKey || envKey, source: 'none' };
};

export const isSupabaseConfigured = (): boolean => {
  const config = getSupabaseConfig();
  return (
    typeof config.url === 'string' &&
    config.url.startsWith('https://') &&
    !config.url.includes('your-project') &&
    typeof config.anonKey === 'string' &&
    config.anonKey.length > 20 &&
    !config.anonKey.includes('your-anon-key')
  );
};

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!isSupabaseConfigured()) {
    cachedClient = null;
    return null;
  }

  if (cachedClient && lastUsedUrl === config.url && lastUsedKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUsedUrl = config.url;
    lastUsedKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
};

export const saveSupabaseCredentials = (url: string, anonKey: string): boolean => {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (!cleanUrl.startsWith('https://')) {
    throw new Error('Supabase URL must start with https://');
  }
  if (cleanKey.length < 20) {
    throw new Error('Supabase Anon Key is too short or invalid.');
  }

  try {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    // Force recreate client
    cachedClient = null;
    return true;
  } catch (e: any) {
    throw new Error(`Failed to save credentials: ${e.message}`);
  }
};

export const removeSupabaseCredentials = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
  } catch (e) {
    console.warn('Failed to clear supabase credentials', e);
  }
};

// Export proxy instance for backward compatibility with existing code
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      return undefined;
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});
