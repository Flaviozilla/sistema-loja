import { createClient } from '@supabase/supabase-js';

// COLOQUE AQUI OS DADOS DO SEU PROJETO SUPABASE
const SUPABASE_URL = 'https://jrblqwlrdfahadiawezf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyYmxxd2xyZGZhaGFkaWF3ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Mjc5NjMsImV4cCI6MjA4MDMwMzk2M30.dWEtU1N0kVf_IxbyvHDCosk4pDRZnRqmUWysk2RVx3s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
