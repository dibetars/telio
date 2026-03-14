-- Complete Telehealth Database Schema
-- Run this script in your Supabase SQL editor

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'provider', 'admin')),
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create providers table (extends users for healthcare providers)
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  license_number TEXT UNIQUE NOT NULL,
  specialty TEXT NOT NULL,
  sub_specialty TEXT,
  years_of_experience INTEGER,
  education TEXT,
  certifications TEXT[],
  languages TEXT[],
  consultation_fee DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  availability_schedule JSONB,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  bio TEXT,
  profile_completeness INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency', 'routine_checkup')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  consultation_fee DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  meeting_link TEXT,
  meeting_id TEXT,
  notes TEXT,
  patient_notes TEXT,
  provider_notes TEXT,
  cancellation_reason TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consultations table (for completed appointments)
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  consultation_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  chief_complaint TEXT,
  symptoms TEXT[],
  diagnosis TEXT,
  treatment_plan TEXT,
  prescriptions TEXT,
  recommendations TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  documents JSONB,
  video_recording_url TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('visit_note', 'lab_result', 'imaging', 'prescription', 'vaccination', 'allergy', 'medication', 'procedure')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  is_confidential BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'patient_provider' CHECK (access_level IN ('patient_only', 'patient_provider', 'all_providers')),
  recorded_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table (for patient-provider communication)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'video')),
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('appointment_reminder', 'appointment_confirmed', 'appointment_cancelled', 'consultation_completed', 'message_received', 'prescription_ready', 'follow_up_reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table (for provider ratings)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_providers_specialty ON providers(specialty);
CREATE INDEX IF NOT EXISTS idx_providers_verified ON providers(is_verified);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_provider ON consultations(provider_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_appointment ON messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Providers can view patient profiles" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.patient_id = users.id 
      AND appointments.provider_id = auth.uid()
      AND appointments.status IN ('scheduled', 'confirmed', 'completed')
    )
  );

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- RLS Policies for providers table
CREATE POLICY "Providers can view their own profile" ON providers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Providers can update their own profile" ON providers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Patients can view provider profiles" ON providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'patient'
    )
  );

CREATE POLICY "Admins can view all providers" ON providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS Policies for appointments table
CREATE POLICY "Patients can view their own appointments" ON appointments
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Providers can view their own appointments" ON appointments
  FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Patients can create appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Providers can update their own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = provider_id);

-- RLS Policies for consultations table
CREATE POLICY "Patients can view their consultations" ON consultations
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Providers can view their consultations" ON consultations
  FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Providers can create consultations" ON consultations
  FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update consultations" ON consultations
  FOR UPDATE USING (auth.uid() = provider_id);

-- RLS Policies for medical_records table
CREATE POLICY "Patients can view their medical records" ON medical_records
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Providers can view patient medical records" ON medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.patient_id = medical_records.patient_id 
      AND appointments.provider_id = auth.uid()
      AND appointments.status IN ('scheduled', 'confirmed', 'completed')
    )
  );

CREATE POLICY "Providers can create medical records" ON medical_records
  FOR INSERT WITH CHECK (
    auth.uid() = provider_id OR 
    EXISTS (
      SELECT 1 FROM providers WHERE providers.id = auth.uid()
    )
  );

CREATE POLICY "Providers can update medical records" ON medical_records
  FOR UPDATE USING (
    auth.uid() = provider_id OR 
    EXISTS (
      SELECT 1 FROM providers WHERE providers.id = auth.uid()
    )
  );

-- RLS Policies for messages table
CREATE POLICY "Users can view messages they sent or received" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for reviews table
CREATE POLICY "Patients can view their own reviews" ON reviews
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Providers can view reviews about them" ON reviews
  FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Patients can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their reviews" ON reviews
  FOR UPDATE USING (auth.uid() = patient_id);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON users TO anon, authenticated;
GRANT INSERT ON users TO anon, authenticated;
GRANT UPDATE ON users TO authenticated;

GRANT SELECT ON providers TO anon, authenticated;
GRANT INSERT ON providers TO authenticated;
GRANT UPDATE ON providers TO authenticated;

GRANT SELECT ON appointments TO anon, authenticated;
GRANT INSERT ON appointments TO authenticated;
GRANT UPDATE ON appointments TO authenticated;

GRANT SELECT ON consultations TO anon, authenticated;
GRANT INSERT ON consultations TO authenticated;
GRANT UPDATE ON consultations TO authenticated;

GRANT SELECT ON medical_records TO anon, authenticated;
GRANT INSERT ON medical_records TO authenticated;
GRANT UPDATE ON medical_records TO authenticated;

GRANT SELECT ON messages TO anon, authenticated;
GRANT INSERT ON messages TO authenticated;
GRANT UPDATE ON messages TO authenticated;

GRANT SELECT ON notifications TO anon, authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;

GRANT SELECT ON reviews TO anon, authenticated;
GRANT INSERT ON reviews TO authenticated;
GRANT UPDATE ON reviews TO authenticated;

-- Create function to automatically create user record when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, 'patient', NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample specialties
INSERT INTO providers (id, license_number, specialty, years_of_experience, consultation_fee, is_verified, verification_status, bio, profile_completeness) VALUES
('00000000-0000-0000-0000-000000000000', 'SAMPLE-001', 'Family Medicine', 10, 150.00, true, 'verified', 'Sample family medicine provider for testing', 100)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON appointments(appointment_date, appointment_time) 
WHERE status IN ('scheduled', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_consultations_recent ON consultations(consultation_date DESC);

CREATE INDEX IF NOT EXISTS idx_medical_records_recent ON medical_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read, created_at DESC) 
WHERE is_read = false;

-- Add some helpful views
CREATE OR REPLACE VIEW active_appointments AS
SELECT 
  a.*,
  p.full_name as patient_name,
  pr.full_name as provider_name,
  pr.specialty
FROM appointments a
JOIN users p ON a.patient_id = p.id
JOIN users pr ON a.provider_id = pr.id
WHERE a.status IN ('scheduled', 'confirmed')
AND a.appointment_date >= CURRENT_DATE;

CREATE OR REPLACE VIEW provider_availability AS
SELECT 
  p.*,
  u.full_name,
  u.email,
  u.phone,
  u.profile_image_url
FROM providers p
JOIN users u ON p.id = u.id
WHERE p.is_verified = true AND u.is_active = true;

-- Success message
SELECT 'Database schema created successfully!' as status;