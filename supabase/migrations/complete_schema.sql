-- Complete Telehealth Database Schema
-- This file contains all the tables needed for the telehealth platform

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'provider', 'admin')),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    medical_history JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Providers table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    years_of_experience INTEGER,
    education TEXT,
    bio TEXT,
    availability JSONB DEFAULT '{}',
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    appointment_type VARCHAR(20) DEFAULT 'video' CHECK (appointment_type IN ('video', 'phone', 'in-person')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    consultation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    consultation_notes TEXT,
    prescription JSONB DEFAULT '{}',
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    video_recording_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical records table
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

-- Messages table for patient-provider communication
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_specialty ON providers(specialty);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_provider_id ON consultations(provider_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_consultation_id ON messages(consultation_id);

-- Grant permissions for anon and authenticated roles
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT SELECT ON providers TO anon;
GRANT ALL PRIVILEGES ON providers TO authenticated;
GRANT SELECT ON appointments TO anon;
GRANT ALL PRIVILEGES ON appointments TO authenticated;
GRANT SELECT ON consultations TO anon;
GRANT ALL PRIVILEGES ON consultations TO authenticated;
GRANT SELECT ON medical_records TO anon;
GRANT ALL PRIVILEGES ON medical_records TO authenticated;
GRANT SELECT ON messages TO anon;
GRANT ALL PRIVILEGES ON messages TO authenticated;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Providers can view patient profiles" ON users FOR SELECT USING (auth.jwt() ->> 'role' = 'provider');
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for providers table
CREATE POLICY "Anyone can view verified providers" ON providers FOR SELECT USING (is_verified = true);
CREATE POLICY "Providers can update their own profile" ON providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all providers" ON providers FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for appointments table
CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT USING (auth.uid() = patient_id OR auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_id));
CREATE POLICY "Users can create their own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Providers can update their appointments" ON appointments FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_id));

-- Create RLS policies for consultations table
CREATE POLICY "Users can view their own consultations" ON consultations FOR SELECT USING (auth.uid() = patient_id OR auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_id));
CREATE POLICY "Providers can update their consultations" ON consultations FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_id));

-- Create RLS policies for medical records table
CREATE POLICY "Users can view their own medical records" ON medical_records FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Providers can view patient medical records" ON medical_records FOR SELECT USING (auth.uid() IN (SELECT user_id FROM providers WHERE id = consultation_id));
CREATE POLICY "Users can create their own medical records" ON medical_records FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Create RLS policies for messages table
CREATE POLICY "Users can view messages they sent or received" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);