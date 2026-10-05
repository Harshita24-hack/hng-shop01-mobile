import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aknovujvomrmjrvyskvz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xsWxwgUtvNy9-WVN0eQ2_Q_n6doH3SA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});