# Telio Health — Tester's Guide

**Live URL:** https://telio-health.vercel.app

---

## Test Accounts

### Patient Account
| Field | Value |
|-------|-------|
| Email | `dibelaba@gmail.com` |
| Password | `TelioTest123!` |
| Role | Patient |

### Provider Account (Dr. Fabrice)
| Field | Value |
|-------|-------|
| Email | `fabrice@tarsusstudios.com` |
| Password | `TelioTest123!` |
| Role | Healthcare Provider |

> **Note:** Both accounts already have a confirmed appointment on **Monday, March 9**, so you can jump straight into the full consultation flow without booking from scratch.

---

## Test Scenarios

### 1. Authentication

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 1.1 | Patient login | Sign in with patient credentials | Redirected to patient dashboard |
| 1.2 | Provider login | Sign in with provider credentials | Redirected to provider dashboard |
| 1.3 | New patient registration | Click "Get Started" → fill form → select "Patient" | Account created, redirected to dashboard |
| 1.4 | New provider registration | Click "Get Started" → fill form → select "Healthcare Provider" | Account created, redirected to provider dashboard |
| 1.5 | Invalid credentials | Enter wrong password | Error message shown, no redirect |
| 1.6 | Logout | Click profile icon → Sign out | Redirected to login page, session cleared |

---

### 2. Find a Doctor (Patient)

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 2.1 | Browse doctors | Log in as patient → "Find Doctors" | List of verified providers displayed |
| 2.2 | View doctor profile | Click on Dr. Fabrice | Profile shows bio, specialty, fee, verified badge, availability |
| 2.3 | Book button visible | Open any doctor profile | "Book Appointment" and "Message" buttons present |

---

### 3. Booking an Appointment (Patient)

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 3.1 | Book new appointment | Doctor profile → "Book Appointment" → select date → select time → select type → fill reason → confirm | Appointment created with "Scheduled" status |
| 3.2 | View appointments | Navigate to "Appointments" | New appointment appears in list |
| 3.3 | Appointment detail | Click on appointment | Shows date, time, provider, type, status, and cost |

---

### 4. Appointment Management (Provider)

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 4.1 | View incoming appointments | Log in as Dr. Fabrice → Dashboard | Appointment with Dibelaba shown in "Today's Appointments" |
| 4.2 | Confirm appointment | Open appointment detail → "Confirm Appointment" | Status changes to "Confirmed", "Start Consultation" button appears |
| 4.3 | Provider stats | Provider dashboard | Total, today's, and confirmed appointment counts update |

---

### 5. Video Consultation

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 5.1 | Start consultation (provider) | Log in as Dr. Fabrice → Dashboard → "Start Consultation" on confirmed appointment | Consultation room loads, "Preparing room…" → "Start Consultation" button appears |
| 5.2 | Join call | Click "Start Consultation" | Video room joins, call controls appear (mic, camera, hang-up) |
| 5.3 | Consultation notes | During call → click "Notes" | Side panel opens with text area for clinical notes |
| 5.4 | End call | Click hang-up (red phone icon) | Call ends, consultation notes/save screen shown |
| 5.5 | Save notes | Fill notes → "Save & Finish" | Consultation saved, redirected to appointments |
| 5.6 | Patient view | Log in as patient → open appointment → "Join Call" | Patient joins same room |

---

### 6. Messaging

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 6.1 | Patient sends message | Log in as patient → "Messages" → open Dr. Fabrice conversation → type message → send | Message appears in conversation with timestamp |
| 6.2 | Provider receives message | Log in as Dr. Fabrice → "Messages" | Dibelaba's conversation shows with unread count badge |
| 6.3 | Provider replies | Open conversation → type reply → send | Reply appears, conversation updates |
| 6.4 | Read receipts | Open conversation | Unread badge clears after viewing |

---

### 7. Medical Records (Patient)

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 7.1 | View records page | Log in as patient → "Medical Records" | Page shows "My Records" and "Consultation Notes" tabs |
| 7.2 | Upload modal opens | Click "+ Upload Record" | Modal shows record type dropdown, file picker, description field |
| 7.3 | Record type options | Open upload modal → click dropdown | Options include Lab Results, Imaging, Prescription, Other |
| 7.4 | Upload a file | Select file (PDF/JPG/PNG ≤ 10MB) → fill description → "Upload" | File uploaded, appears in records list |
| 7.5 | Consultation notes tab | Click "Consultation Notes" tab | Shows notes from completed consultations |

---

### 8. Provider Profile & Availability

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 8.1 | View provider profile | Log in as Dr. Fabrice → Dashboard → "Provider Profile" section | Shows name, email, specialty, stats |
| 8.2 | Edit availability | Dashboard → "Set Availability" | Weekly schedule with toggle + time pickers per day |
| 8.3 | Save availability | Toggle days on/off → set hours → save | Changes persisted and reflected in booking calendar |

---

### 9. Edge Cases

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 9.1 | Direct URL access (unauthenticated) | Paste `https://telio-health.vercel.app/dashboard` while logged out | Redirected to login |
| 9.2 | Role access control | Log in as patient → try `/dashboard` (provider-only sections) | Patient dashboard shown, provider sections not accessible |
| 9.3 | Page refresh | Refresh any page while logged in | Stays on same page, session preserved |
| 9.4 | Mobile layout | Open on mobile device or resize browser narrow | Layout adapts, navigation collapses to hamburger menu |

---

## Reporting Issues

Please note the following when reporting a bug:
- **URL** where the issue occurred
- **Account used** (patient or provider)
- **Steps to reproduce**
- **Expected vs actual behaviour**
- **Screenshot** if applicable
