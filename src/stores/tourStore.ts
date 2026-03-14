import { create } from 'zustand'

export interface TourStep {
  id: string
  title: string
  description: string
  path: string
  targetSelector: string
  placement: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Telio Health',
    description:
      "This is your provider dashboard — your command centre. From here you can see today's appointments, access patient records, and manage your practice.",
    path: '/dashboard',
    targetSelector: '.tour-provider-root',
    placement: 'bottom',
  },
  {
    id: 'availability',
    title: 'Set Your Availability',
    description:
      'Define your working hours for each day of the week. Patients can only book consultations during your open time slots — full control, zero scheduling conflicts.',
    path: '/availability',
    targetSelector: '.tour-availability-grid',
    placement: 'bottom',
  },
  {
    id: 'schedule',
    title: "Today's Schedule at a Glance",
    description:
      "Every confirmed appointment shows the patient's name, time, and reason for visit. One click takes you directly into the details — no hunting around.",
    path: '/dashboard',
    targetSelector: '.tour-appointments-list',
    placement: 'top',
  },
  {
    id: 'consult',
    title: 'Launch a Video Consultation',
    description:
      "When it's time, hit Start Consultation for a secure HD video call — no downloads, no plugins. Your patient connects instantly from any device.",
    path: '/appointments',
    targetSelector: '.tour-join-btn',
    placement: 'top',
  },
  {
    id: 'message',
    title: 'Message Patients in Real Time',
    description:
      'Send follow-ups, share results, or answer quick questions between visits. Messages are delivered instantly and stay attached to the patient record.',
    path: '/messages',
    targetSelector: '.tour-messages-list',
    placement: 'right',
  },
  {
    id: 'wrapup',
    title: 'Everything in One Place',
    description:
      'Telio Health gives your organisation a complete view of patient care — from booking to consultation to follow-up. Built for hospitals. Designed for doctors.',
    path: '/dashboard',
    targetSelector: '.tour-provider-root',
    placement: 'bottom',
  },
]

interface TourState {
  isActive: boolean
  currentStepIndex: number
  steps: TourStep[]
  startTour: () => void
  endTour: () => void
  nextStep: () => void
  prevStep: () => void
}

export const useTourStore = create<TourState>((set, get) => ({
  isActive: false,
  currentStepIndex: 0,
  steps: TOUR_STEPS,

  startTour: () => set({ isActive: true, currentStepIndex: 0 }),

  endTour: () => set({ isActive: false, currentStepIndex: 0 }),

  nextStep: () => {
    const { currentStepIndex, steps } = get()
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 })
    } else {
      set({ isActive: false, currentStepIndex: 0 })
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get()
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 })
    }
  },
}))
