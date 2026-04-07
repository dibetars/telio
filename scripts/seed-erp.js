/**
 * ERP Connectors + Hospital Records Seeder
 * Run: SUPABASE_SERVICE_KEY=<your-service-key> node scripts/seed-erp.js
 *
 * Get service key from: Supabase Dashboard → Project Settings → API → service_role key
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zrotpnurlipgykxtxbnf.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_SERVICE_KEY env var')
  console.error('   Get it from: Supabase Dashboard → Project Settings → API → service_role key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Starting ERP + Hospital Records seed...\n')

  // 1. Fetch existing patients and org
  const { data: patients, error: pErr } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('role', 'patient')

  if (pErr || !patients?.length) {
    console.error('❌  No patients found:', pErr?.message)
    process.exit(1)
  }
  console.log(`✅  Found ${patients.length} patients:`, patients.map(p => p.name).join(', '))

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)

  const org = orgs?.[0]
  console.log(`✅  Org: ${org?.name ?? '(none — records will be global)'}`)

  // ─── 2. ERP Connections ──────────────────────────────────────────────────

  console.log('\n📡  Seeding ERP connections...')

  const erpConnections = [
    {
      name: 'City General Hospital — SAP Healthcare',
      erp_type: 'sap_healthcare',
      endpoint_url: 'https://api.citygeneralhospital.example.com/sap/hc/v1',
      auth_method: 'oauth',
      sync_schedule: 'daily',
      sync_status: 'success',
      last_sync_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
      is_active: true,
      organization_id: org?.id ?? null,
    },
    {
      name: 'St Marys Medical Center — Oracle Cerner',
      erp_type: 'oracle_cerner',
      endpoint_url: 'https://fhir.stmarys.example.com/cerner/r4',
      auth_method: 'api_key',
      sync_schedule: 'daily',
      sync_status: 'success',
      last_sync_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago
      is_active: true,
      organization_id: org?.id ?? null,
    },
    {
      name: 'Northside Clinic — Epic FHIR R4',
      erp_type: 'epic',
      endpoint_url: 'https://fhir.northsideclinic.example.com/api/FHIR/R4',
      auth_method: 'oauth',
      sync_schedule: 'weekly',
      sync_status: 'error',
      sync_error: 'OAuth token expired — re-authentication required',
      last_sync_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      is_active: true,
      organization_id: org?.id ?? null,
    },
    {
      name: 'Regional Lab Network — HL7/FHIR',
      erp_type: 'hl7_fhir',
      endpoint_url: 'https://hl7.regionallabs.example.com/fhir/stu3',
      auth_method: 'basic',
      sync_schedule: 'daily',
      sync_status: 'success',
      last_sync_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1h ago
      is_active: true,
      organization_id: org?.id ?? null,
    },
    {
      name: 'Archive — Legacy CSV Import',
      erp_type: 'custom_csv',
      auth_method: 'none',
      sync_schedule: 'manual',
      sync_status: 'idle',
      is_active: false,
      organization_id: org?.id ?? null,
    },
  ]

  const { data: insertedConns, error: connErr } = await supabase
    .from('erp_connections')
    .insert(erpConnections)
    .select()

  if (connErr) {
    console.error('❌  ERP connections insert failed:', connErr.message)
    process.exit(1)
  }
  console.log(`✅  Inserted ${insertedConns.length} ERP connections`)

  const [sap, cerner, epic, hl7, csv] = insertedConns

  // ─── 3. Hospital Records ─────────────────────────────────────────────────

  console.log('\n🏥  Seeding hospital records...')

  const records = []

  for (const patient of patients) {
    // Admission record — from SAP
    records.push({
      patient_id: patient.id,
      organization_id: org?.id ?? null,
      erp_connection_id: sap.id,
      erp_record_id: `SAP-ADM-${Math.floor(Math.random() * 90000) + 10000}`,
      record_type: 'admission',
      record_date: daysAgo(Math.floor(Math.random() * 180) + 30),
      title: 'Inpatient Admission',
      source: 'erp_sync',
      status: 'active',
      data: {
        department: randomItem(['Cardiology', 'General Medicine', 'Orthopedics', 'Neurology']),
        admitting_physician: 'Dr. Sarah Mitchell',
        reason: randomItem(['Chest pain evaluation', 'Post-surgical monitoring', 'Acute infection', 'Diagnostic workup']),
        ward: randomItem(['Ward A', 'Ward B', 'ICU', 'Day Surgery']),
        bed_number: `${randomItem(['A', 'B', 'C'])}${Math.floor(Math.random() * 20) + 1}`,
        insurance_id: `INS-${Math.floor(Math.random() * 900000) + 100000}`,
      },
    })

    // Discharge record — from SAP
    records.push({
      patient_id: patient.id,
      organization_id: org?.id ?? null,
      erp_connection_id: sap.id,
      erp_record_id: `SAP-DIS-${Math.floor(Math.random() * 90000) + 10000}`,
      record_type: 'discharge',
      record_date: daysAgo(Math.floor(Math.random() * 90) + 5),
      title: 'Discharge Summary',
      source: 'erp_sync',
      status: 'active',
      data: {
        discharge_diagnosis: randomItem(['Resolved pneumonia', 'Stable cardiac condition', 'Post-op recovery complete', 'Hypertension managed']),
        discharge_condition: randomItem(['Good', 'Stable', 'Fair']),
        follow_up_required: true,
        follow_up_date: daysAgo(-14),
        prescriptions_issued: Math.floor(Math.random() * 3) + 1,
        attending_physician: 'Dr. Sarah Mitchell',
      },
    })

    // Lab results — from HL7/FHIR
    records.push({
      patient_id: patient.id,
      organization_id: org?.id ?? null,
      erp_connection_id: hl7.id,
      erp_record_id: `HL7-LAB-${Math.floor(Math.random() * 90000) + 10000}`,
      record_type: 'lab_result',
      record_date: daysAgo(Math.floor(Math.random() * 60) + 1),
      title: 'Complete Blood Count (CBC)',
      source: 'hl7_fhir',
      status: 'active',
      data: {
        test_name: 'CBC with Differential',
        ordered_by: 'Dr. James Okafor',
        lab: 'Regional Lab Network',
        results: {
          wbc: `${(Math.random() * 5 + 4).toFixed(1)} K/uL`,
          rbc: `${(Math.random() * 2 + 4).toFixed(2)} M/uL`,
          hemoglobin: `${(Math.random() * 4 + 12).toFixed(1)} g/dL`,
          hematocrit: `${(Math.random() * 10 + 36).toFixed(1)}%`,
          platelets: `${Math.floor(Math.random() * 150 + 150)} K/uL`,
        },
        status: 'final',
        interpretation: randomItem(['Normal', 'Mild anaemia noted', 'Within reference range', 'Borderline WBC — monitor']),
      },
    })

    // Imaging — from Cerner
    records.push({
      patient_id: patient.id,
      organization_id: org?.id ?? null,
      erp_connection_id: cerner.id,
      erp_record_id: `CRN-IMG-${Math.floor(Math.random() * 90000) + 10000}`,
      record_type: 'imaging',
      record_date: daysAgo(Math.floor(Math.random() * 120) + 10),
      title: randomItem(['Chest X-Ray', 'CT Abdomen', 'MRI Brain', 'Ultrasound Abdomen']),
      source: 'erp_sync',
      status: 'active',
      data: {
        modality: randomItem(['X-Ray', 'CT', 'MRI', 'Ultrasound']),
        body_part: randomItem(['Chest', 'Abdomen', 'Brain', 'Knee', 'Spine']),
        radiologist: 'Dr. Elena Vasquez',
        facility: 'St Marys Medical Center',
        findings: randomItem([
          'No acute cardiopulmonary findings',
          'Mild degenerative changes — clinically correlate',
          'No significant abnormality identified',
          'Possible mild effusion — follow-up recommended',
        ]),
        impression: randomItem(['Normal study', 'Clinically stable', 'Recommend follow-up in 6 months']),
        report_status: 'final',
      },
    })

    // Diagnosis — from Epic
    records.push({
      patient_id: patient.id,
      organization_id: org?.id ?? null,
      erp_connection_id: epic.id,
      erp_record_id: `EPC-DX-${Math.floor(Math.random() * 90000) + 10000}`,
      record_type: 'diagnosis',
      record_date: daysAgo(Math.floor(Math.random() * 200) + 20),
      title: randomItem(['Hypertension — Stage 1', 'Type 2 Diabetes Mellitus', 'Allergic Rhinitis', 'Osteoarthritis — Right Knee']),
      source: 'erp_sync',
      status: 'active',
      data: {
        icd10_code: randomItem(['I10', 'E11.9', 'J30.9', 'M17.11']),
        diagnosing_provider: 'Dr. Amara Osei',
        clinical_status: 'active',
        onset_date: daysAgo(Math.floor(Math.random() * 365) + 60),
        notes: 'Patient informed and management plan initiated.',
        severity: randomItem(['Mild', 'Moderate', 'Well-controlled']),
      },
    })

    // Vitals — from CSV import
    records.push({
      patient_id: patient.id,
      organization_id: org?.id ?? null,
      erp_connection_id: csv.id,
      record_type: 'vitals',
      record_date: daysAgo(Math.floor(Math.random() * 30) + 1),
      title: 'Routine Vitals Check',
      source: 'csv_import',
      status: 'active',
      data: {
        blood_pressure: `${Math.floor(Math.random() * 40 + 110)}/${Math.floor(Math.random() * 20 + 70)} mmHg`,
        heart_rate: `${Math.floor(Math.random() * 30 + 62)} bpm`,
        temperature: `${(Math.random() * 1.5 + 36.5).toFixed(1)} °C`,
        respiratory_rate: `${Math.floor(Math.random() * 6 + 14)} breaths/min`,
        oxygen_saturation: `${Math.floor(Math.random() * 4 + 96)}%`,
        weight: `${(Math.random() * 40 + 60).toFixed(1)} kg`,
        height: `${(Math.random() * 30 + 160).toFixed(0)} cm`,
        bmi: `${(Math.random() * 10 + 20).toFixed(1)}`,
        recorded_by: 'Nurse J. Williams',
        notes: 'Routine pre-consultation vitals',
      },
    })
  }

  const { data: insertedRecs, error: recErr } = await supabase
    .from('hospital_records')
    .insert(records)
    .select()

  if (recErr) {
    console.error('❌  Hospital records insert failed:', recErr.message)
    process.exit(1)
  }
  console.log(`✅  Inserted ${insertedRecs.length} hospital records (${records.length / patients.length} per patient)`)

  // ─── 4. Import Jobs ──────────────────────────────────────────────────────

  console.log('\n📋  Seeding import job history...')

  const { data: adminUser } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .single()

  const importJobs = [
    {
      organization_id: org?.id ?? null,
      erp_connection_id: csv.id,
      file_name: 'patient_records_Q1_2026.csv',
      total_rows: 142,
      processed_rows: 142,
      success_rows: 139,
      error_rows: 3,
      status: 'completed',
      errors: [
        { row: 14, message: 'Patient not found: unknown@example.com' },
        { row: 67, message: 'Invalid record_type: "xray" — defaulted to "imaging"' },
        { row: 103, message: 'Missing record_date — row skipped' },
      ],
      created_by: adminUser?.id ?? null,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45000).toISOString(),
    },
    {
      organization_id: org?.id ?? null,
      erp_connection_id: csv.id,
      file_name: 'lab_results_march.csv',
      total_rows: 58,
      processed_rows: 58,
      success_rows: 58,
      error_rows: 0,
      status: 'completed',
      errors: [],
      created_by: adminUser?.id ?? null,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 22000).toISOString(),
    },
  ]

  const { error: jobErr } = await supabase.from('import_jobs').insert(importJobs)
  if (jobErr) {
    console.error('❌  Import jobs insert failed:', jobErr.message)
  } else {
    console.log(`✅  Inserted ${importJobs.length} import jobs`)
  }

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log('\n🎉  Seed complete!')
  console.log(`   ERP Connections : ${insertedConns.length}`)
  console.log(`   Hospital Records: ${insertedRecs.length}`)
  console.log(`   Import Jobs     : ${importJobs.length}`)
  console.log(`   Patients seeded : ${patients.length}`)
}

seed().catch((e) => { console.error(e); process.exit(1) })
