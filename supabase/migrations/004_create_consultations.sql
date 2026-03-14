-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    room_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultations_room_id ON consultations(room_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- Grant permissions
GRANT SELECT ON consultations TO anon;
GRANT ALL PRIVILEGES ON consultations TO authenticated;