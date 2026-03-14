# Telio Health — Beta Testing Brief

Thank you for helping test Telio Health! This guide walks you through the key flows to verify.

🔗 **App URL:** https://telio-health.vercel.app

---

## Login Credentials

### As a Patient
- **Email:** dibelaba@gmail.com
- **Password:** TelioTest123!

### As a Provider (Dr. Fabrice)
- **Email:** fabrice@tarsusstudios.com
- **Password:** TelioTest123!

> Both accounts already have a **confirmed appointment on Monday, March 9** — so you can test the full consultation flow without having to book from scratch.

---

## What to Test

### 1 — Registration & Login
- [ ] Register a new **patient** account via "Get Started"
- [ ] Register a new **provider** account via "Get Started"
- [ ] Log in with the provided test credentials above
- [ ] Log out and confirm you're redirected to the login page
- [ ] Try logging in with a wrong password — expect an error message

---

### 2 — Finding a Doctor (Patient)
- [ ] Log in as the patient
- [ ] Go to **Find Doctors**
- [ ] Open Dr. Fabrice's profile — verify the verified badge, bio, specialty, and consultation fee are shown
- [ ] Confirm the **Book Appointment** and **Message** buttons appear

---

### 3 — Booking an Appointment (Patient)
- [ ] From Dr. Fabrice's profile, click **Book Appointment**
- [ ] Select an available date and time slot
- [ ] Choose appointment type (Video / In-person)
- [ ] Add a reason for the visit
- [ ] Complete the booking
- [ ] Go to **Appointments** and confirm the new booking appears with status **Scheduled**

---

### 4 — Confirming an Appointment (Provider)
- [ ] Log in as Dr. Fabrice
- [ ] Open the appointment with Dibelaba
- [ ] Click **Confirm Appointment**
- [ ] Verify the status changes to **Confirmed**
- [ ] Verify the **Start Consultation** button appears

---

### 5 — Video Consultation
- [ ] As Dr. Fabrice, click **Start Consultation** on the confirmed appointment
- [ ] Wait for "Preparing room…" to resolve — the **Start Consultation** button should become active
- [ ] Click it — you should enter the video room with mic, camera, and hang-up controls
- [ ] Open the **Notes** panel and type some clinical notes
- [ ] End the call — you should be taken to a notes summary/save screen
- [ ] As the patient, open the same appointment and try **Join Call**

---

### 6 — Messaging
- [ ] As the patient, go to **Messages** and open the conversation with Dr. Fabrice
- [ ] Send a message
- [ ] Log in as Dr. Fabrice → **Messages** — confirm the message appears with an unread badge
- [ ] Reply as Dr. Fabrice
- [ ] Switch back to patient and verify the reply is visible

---

### 7 — Medical Records (Patient)
- [ ] Log in as the patient → **Medical Records**
- [ ] Click **+ Upload Record**
- [ ] Select a record type from the dropdown (Lab Results, Imaging, etc.)
- [ ] Attach a file (PDF, JPG, or PNG — max 10 MB)
- [ ] Add an optional description and click **Upload**
- [ ] Confirm the record appears in the list
- [ ] Check the **Consultation Notes** tab

---

### 8 — Provider Availability
- [ ] Log in as Dr. Fabrice → **Set Availability**
- [ ] Toggle a day on/off and adjust the hours
- [ ] Save — confirm the changes persist on page refresh
- [ ] Log in as the patient, book an appointment, and verify the updated slots are reflected

---

### 9 — Edge Cases
- [ ] Paste `https://telio-health.vercel.app/dashboard` while **logged out** — should redirect to login
- [ ] Refresh the page while logged in — should stay on the same page (no redirect to login)
- [ ] Open the app on a **mobile device** — layout should adapt with a hamburger menu

---

## How to Report Issues

Please share the following when flagging a bug:

1. Which account you were using (patient or provider)
2. The URL where it happened
3. Steps to reproduce
4. What you expected vs. what actually happened
5. A screenshot if possible

---

*Telio Health Beta — March 2026*
