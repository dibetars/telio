export interface User {
  id: string
  email: string
  role: 'patient' | 'provider' | 'admin' | 'organization'
  name: string
  phone?: string
  medical_history?: Record<string, unknown>
  created_at?: string
}

export interface Provider {
  id: string
  user_id: string
  specialty: string
  license_number: string
  years_of_experience?: number
  education?: string
  bio?: string
  availability: Record<string, TimeSlot[]>
  consultation_fee: number
  is_verified: boolean
  created_at?: string
  // Joined fields
  users?: User
  average_rating?: number
  review_count?: number
}

export interface TimeSlot {
  start: string // "HH:MM"
  end: string   // "HH:MM"
}

export interface WeekAvailability {
  monday: TimeSlot[]
  tuesday: TimeSlot[]
  wednesday: TimeSlot[]
  thursday: TimeSlot[]
  friday: TimeSlot[]
  saturday: TimeSlot[]
  sunday: TimeSlot[]
}

export interface Appointment {
  id: string
  patient_id: string
  provider_id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  appointment_type: 'video' | 'phone' | 'in-person'
  notes?: string
  reason?: string
  fee?: number
  created_at?: string
  // Joined fields
  providers?: Provider & { users?: User }
  users?: User
}

export interface Consultation {
  id: string
  appointment_id: string
  patient_id: string
  provider_id: string
  consultation_date: string
  duration_minutes?: number
  consultation_notes?: string
  prescription?: Record<string, unknown>
  follow_up_required?: boolean
  follow_up_date?: string
  video_recording_url?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  consultation_id?: string
  message: string
  message_type: 'text' | 'file' | 'image'
  is_read: boolean
  created_at: string
  // Joined fields
  sender?: User
  receiver?: User
}

export interface MedicalRecord {
  id: string
  patient_id: string
  record_type: string
  description?: string
  file_url?: string
  file_name?: string
  uploaded_by?: string
  consultation_id?: string
  created_at: string
}

export interface Review {
  id: string
  patient_id: string
  provider_id: string
  appointment_id?: string
  rating: number
  review_text?: string
  created_at: string
  // Joined
  users?: User
}

export interface Prescription {
  id: string
  consultation_id?: string
  appointment_id?: string
  patient_id: string
  provider_id: string
  medications: Medication[]
  instructions?: string
  status: 'active' | 'sent_to_pharmacy' | 'dispensed' | 'expired' | 'cancelled'
  pharmacy_id?: string
  issued_at: string
  dispensed_at?: string
  created_at: string
  // Joined
  patient?: User
  provider?: Provider & { users?: User }
  pharmacy?: Organization
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  notes?: string
}

// ─── Organization ─────────────────────────────────────────────────────────────

export type OrganizationType = 'hospital' | 'clinic' | 'pharmacy' | 'lab' | 'other'

export interface Organization {
  id: string
  user_id: string
  name: string
  organization_type?: OrganizationType
  description?: string
  address?: string
  phone?: string
  website?: string
  logo_url?: string
  is_verified: boolean
  created_at?: string
  updated_at?: string
}

export interface OrgProviderDetail {
  org_id: string
  provider_id: string
  role_in_org: string
  joined_at: string
  specialty: string
  consultation_fee: number
  is_verified: boolean
  user_id: string
  provider_name: string
  provider_email: string
  provider_phone?: string
}

// ─── ERP / Data Sovereignty ────────────────────────────────────────────────────

export type ERPType =
  | 'sap_healthcare'
  | 'oracle_cerner'
  | 'epic'
  | 'meditech'
  | 'allscripts'
  | 'hl7_fhir'
  | 'custom_csv'

export type ERPSyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export interface ERPConnection {
  id: string
  organization_id?: string
  name: string
  erp_type: ERPType
  endpoint_url?: string
  auth_method?: 'api_key' | 'oauth' | 'basic' | 'none'
  sync_schedule?: 'manual' | 'daily' | 'weekly'
  last_sync_at?: string
  sync_status: ERPSyncStatus
  sync_error?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  // Joined
  organization?: Organization
}

export type HospitalRecordType =
  | 'admission'
  | 'discharge'
  | 'lab_result'
  | 'imaging'
  | 'surgical'
  | 'medication'
  | 'vitals'
  | 'diagnosis'
  | 'referral'
  | 'other'

export type HospitalRecordSource = 'manual' | 'csv_import' | 'erp_sync' | 'hl7_fhir'

export interface HospitalRecord {
  id: string
  patient_id: string
  organization_id?: string
  erp_connection_id?: string
  erp_record_id?: string
  record_type: HospitalRecordType
  record_date?: string
  title?: string
  data: Record<string, unknown>
  source: HospitalRecordSource
  import_batch_id?: string
  status: 'active' | 'archived' | 'pending_review'
  created_at: string
  updated_at?: string
  // Joined
  patient?: User
  organization?: Organization
  erp_connection?: ERPConnection
}

export interface ImportJob {
  id: string
  organization_id?: string
  erp_connection_id?: string
  file_name?: string
  total_rows: number
  processed_rows: number
  success_rows: number
  error_rows: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errors: Array<{ row: number; message: string }>
  created_by?: string
  created_at: string
  completed_at?: string
}
