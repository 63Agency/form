-- Preserve payment logs when a booking row is deleted
ALTER TABLE payment_logs DROP CONSTRAINT IF EXISTS payment_logs_booking_id_fkey;
ALTER TABLE payment_logs ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE payment_logs ADD CONSTRAINT payment_logs_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- Allow server-side routes to delete bookings (failed / stale pending cleanup)
CREATE POLICY "Allow public delete on bookings"
ON bookings FOR DELETE
TO anon
USING (true);
