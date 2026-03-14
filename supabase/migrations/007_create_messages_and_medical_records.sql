-- ============================================================
-- Migration 007: Create messages and medical_records tables
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Medical Records table
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL,
    description TEXT,
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    uploaded_by UUID REFERENCES users(id),
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);

-- Grants
GRANT SELECT ON medical_records TO anon;
GRANT ALL PRIVILEGES ON medical_records TO authenticated;
GRANT SELECT ON messages TO anon;
GRANT ALL PRIVILEGES ON messages TO authenticated;

-- Enable RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: medical_records
CREATE POLICY "Users can view their own medical records"
  ON medical_records FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Users can create their own medical records"
  ON medical_records FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Providers can view patient medical records"
  ON medical_records FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM providers)
  );

-- RLS Policies: messages
CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);
