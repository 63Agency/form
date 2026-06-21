-- Run this on an existing Supabase project (bookings table already exists).
-- Do NOT re-run 001_init.sql — that will fail with "relation bookings already exists".

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_time TIME;

-- Refresh PostgREST schema cache so the API sees the new column immediately
NOTIFY pgrst, 'reload schema';
