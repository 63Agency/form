CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(50),
  selected_date DATE NOT NULL,
  age VARCHAR(50),
  status VARCHAR(100),
  education_level VARCHAR(100),
  field_choice VARCHAR(100),
  countries TEXT[],
  consultation VARCHAR(100),
  consultation_format VARCHAR(100),
  investment500 VARCHAR(10),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payzone_charge_id VARCHAR(255),
  payzone_order_id VARCHAR(255),
  calendly_event_uri VARCHAR(500),
  calendly_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  event_type VARCHAR(100),
  payzone_status VARCHAR(100),
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon key to insert bookings
CREATE POLICY "Allow public insert on bookings"
ON bookings FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon key to read bookings
CREATE POLICY "Allow public select on bookings"
ON bookings FOR SELECT
TO anon
USING (true);

-- Allow anon key to update bookings
CREATE POLICY "Allow public update on bookings"
ON bookings FOR UPDATE
TO anon
USING (true);

-- Allow anon key to insert payment_logs
CREATE POLICY "Allow public insert on payment_logs"
ON payment_logs FOR INSERT
TO anon
WITH CHECK (true);
