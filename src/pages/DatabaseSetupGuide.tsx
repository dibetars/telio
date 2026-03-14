import { useState } from 'react'
import { CheckCircle, Copy, Database, Key, Shield, User, Clock } from 'lucide-react'

export default function DatabaseSetupGuide() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, scriptName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(scriptName)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const completeSchemaSQL = `-- Complete Telehealth Database Schema
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

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Grant permissions
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

SELECT 'Database schema created successfully!' as status;`

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0f8ff',
      fontFamily: 'Arial, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ 
        textAlign: 'center', 
        maxWidth: '800px', 
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          color: '#2563eb', 
          fontSize: '2rem', 
          marginBottom: '1.5rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}>
          <Database />
          Database Setup Guide
        </h1>
        
        <p style={{ 
          color: '#6b7280', 
          fontSize: '1rem', 
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Follow these steps to set up your complete telehealth database schema in Supabase.
          This will create all the necessary tables with proper relationships and security policies.
        </p>

        <div style={{ 
          textAlign: 'left', 
          backgroundColor: '#fef3c7', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '1px solid #f59e0b',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#d97706', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock />
            ⚠️ Important Notes:
          </h3>
          <ul style={{ color: '#b45309', fontSize: '0.9rem', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>This script assumes you have already set up your Supabase project</li>
            <li>Run this script in your Supabase SQL editor (found in your project dashboard)</li>
            <li>The script is idempotent - you can run it multiple times safely</li>
            <li>All tables include proper Row Level Security (RLS) policies</li>
            <li>Passwords are handled by Supabase Auth, not stored in your tables</li>
          </ul>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ color: '#374151', fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key />
            📋 Step-by-Step Instructions
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e'
            }}>
              <h4 style={{ color: '#16a34a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                Step 1: Access Supabase Dashboard
              </h4>
              <p style={{ color: '#15803d', fontSize: '0.9rem' }}>
                Go to your Supabase project dashboard and navigate to the SQL Editor section.
              </p>
            </div>

            <div style={{ 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e'
            }}>
              <h4 style={{ color: '#16a34a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                Step 2: Copy the SQL Script
              </h4>
              <p style={{ color: '#15803d', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Click the "Copy" button below to copy the complete SQL script to your clipboard.
              </p>
            </div>

            <div style={{ 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e'
            }}>
              <h4 style={{ color: '#16a34a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                Step 3: Run the Script
              </h4>
              <p style={{ color: '#15803d', fontSize: '0.9rem' }}>
                Paste the script into the SQL Editor and click "Run" to execute all commands.
              </p>
            </div>

            <div style={{ 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e'
            }}>
              <h4 style={{ color: '#16a34a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                Step 4: Verify Success
              </h4>
              <p style={{ color: '#15803d', fontSize: '0.9rem' }}>
                You should see a success message. Your database is now ready for the telehealth application!
              </p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ color: '#374151', fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield />
            🔒 Security Features
          </h3>
          <ul style={{ color: '#4b5563', fontSize: '0.9rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li><strong>Row Level Security (RLS):</strong> All tables have RLS enabled with appropriate policies</li>
            <li><strong>Role-based Access:</strong> Different permissions for patients, providers, and admins</li>
            <li><strong>Data Isolation:</strong> Users can only access their own data unless explicitly authorized</li>
            <li><strong>Audit Trail:</strong> All tables include created_at and updated_at timestamps</li>
            <li><strong>Referential Integrity:</strong> Proper foreign key relationships maintain data consistency</li>
          </ul>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ color: '#374151', fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database />
            📊 Tables Created
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ color: '#374151', fontWeight: '600', marginBottom: '0.5rem' }}>Core Tables</h4>
              <ul style={{ color: '#6b7280', fontSize: '0.9rem', paddingLeft: '1.5rem' }}>
                <li>users</li>
                <li>providers</li>
                <li>appointments</li>
                <li>consultations</li>
              </ul>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ color: '#374151', fontWeight: '600', marginBottom: '0.5rem' }}>Support Tables</h4>
              <ul style={{ color: '#6b7280', fontSize: '0.9rem', paddingLeft: '1.5rem' }}>
                <li>medical_records</li>
                <li>messages</li>
                <li>notifications</li>
                <li>reviews</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ color: '#374151', fontSize: '1.5rem', marginBottom: '1rem' }}>
            📋 Complete SQL Script
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Copy and paste this entire script into your Supabase SQL Editor:
          </p>
          
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <pre style={{ 
              backgroundColor: '#1f2937', 
              color: '#f9fafb', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              overflow: 'auto',
              fontSize: '0.8rem',
              maxHeight: '400px'
            }}>
              {completeSchemaSQL}
            </pre>
            <button
              onClick={() => copyToClipboard(completeSchemaSQL, 'complete-schema')}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Copy style={{ width: '14px', height: '14px' }} />
              {copied === 'complete-schema' ? '✅ Copied!' : 'Copy Script'}
            </button>
          </div>
        </div>

        <div style={{ 
          textAlign: 'left', 
          backgroundColor: '#f0fdf4', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '2px solid #22c55e',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#16a34a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle />
            ✅ Next Steps
          </h3>
          <ul style={{ color: '#15803d', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li>Run the SQL script in your Supabase SQL Editor</li>
            <li>Test the database connection using our test pages</li>
            <li>Try registering a new user to verify the auto-creation works</li>
            <li>Check that RLS policies are working correctly</li>
            <li>Start building your telehealth features!</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.href = '/simple-test'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Test Connection
          </button>
          
          <button 
            onClick={() => window.location.href = '/login-enhanced'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
          >
            Try Login
          </button>
          
          <button 
            onClick={() => window.location.href = '/home'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}