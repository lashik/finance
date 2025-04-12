

import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://erhugbiefmpxmyhcxxej.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaHVnYmllZm1weG15aGN4eGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxNzQ4MTEsImV4cCI6MjA1NDc1MDgxMX0.pzhAQ_P6Keogfgyyi3tnAWlK_NZF8umfRViyWWfTqZM'
export const supabase = createClient(supabaseUrl, supabaseKey);
