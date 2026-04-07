/**
 * Fixes Supabase Realtime for public.messages table.
 * Run: SUPABASE_SERVICE_KEY=<key> node scripts/fix-realtime.js
 */
import pg from 'pg'

const { Client } = pg

// Supabase DB connection — get from Dashboard > Project Settings > Database > Connection string (URI)
// Replace [YOUR-PASSWORD] with your DB password
const DB_URL = process.env.SUPABASE_DB_URL

if (!DB_URL) {
  console.log('⚠️  No SUPABASE_DB_URL — run the following SQL manually in the Supabase SQL editor:\n')
  console.log(`-- Fix realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;`)
  process.exit(0)
}

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
await client.connect()
await client.query('ALTER PUBLICATION supabase_realtime ADD TABLE public.messages')
await client.query('ALTER TABLE public.messages REPLICA IDENTITY FULL')
await client.end()
console.log('✅  Realtime enabled for public.messages')
