import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ttmsuklhbhzuvpabccdw.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0bXN1a2xoYmh6dXZwYWJjY2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3ODgwNTcsImV4cCI6MjA1MzM2NDA1N30.dKPFKrlA537wCXvHZqvRTUvVNPjwgEZx6PUiXDKUYGA"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})