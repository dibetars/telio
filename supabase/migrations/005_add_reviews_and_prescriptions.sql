-- Reviews/Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_patient_id ON reviews(patient_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Patients can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = patient_id);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  medications JSONB DEFAULT '[]',
  instructions TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_provider_id ON prescriptions(provider_id);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their prescriptions" ON prescriptions
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Providers can create and view prescriptions" ON prescriptions
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_id));

-- Add reason column to appointments if missing
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reason TEXT;

-- Update grants
GRANT ALL PRIVILEGES ON reviews TO authenticated;
GRANT ALL PRIVILEGES ON prescriptions TO authenticated;
