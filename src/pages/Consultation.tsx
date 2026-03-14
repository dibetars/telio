import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Appointment } from '../types'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, FileText, X,
  User, AlertCircle, Loader2,
} from 'lucide-react'
import { cn } from '../lib/utils'

declare global {
  interface Window {
    DailyIframe: any
  }
}

type CallState = 'loading' | 'waiting' | 'joining' | 'active' | 'ended' | 'error'

export default function Consultation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [callState, setCallState] = useState<CallState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [roomUrl, setRoomUrl] = useState<string | null>(null)

  const frameRef = useRef<HTMLDivElement>(null)
  const dailyRef = useRef<any>(null)
  const startTimeRef = useRef<Date>(new Date())

  useEffect(() => {
    if (id) fetchAppointment(id)
    return () => { dailyRef.current?.destroy() }
  }, [id])

  const fetchAppointment = async (apptId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          providers!inner(id, user_id, specialty, users!inner(name, email))
        `)
        .eq('id', apptId)
        .single()

      if (error) throw error

      // Fetch patient name separately to avoid ambiguous join alias
      const { data: patientData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', data.patient_id)
        .single()

      setAppointment({ ...data, patientUser: patientData })

      if (data.status !== 'confirmed') {
        setCallState('error')
        setErrorMsg('This appointment is not yet confirmed. The provider must confirm it before the call can begin.')
        return
      }

      setCallState('waiting')
      loadDailyScript()
    } catch (err: any) {
      setCallState('error')
      setErrorMsg(err.message || 'Failed to load appointment.')
    }
  }

  const loadDailyScript = () => {
    if (window.DailyIframe) { initRoom(); return }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@daily-co/daily-js'
    script.onload = initRoom
    script.onerror = () => { setCallState('error'); setErrorMsg('Failed to load video SDK.') }
    document.head.appendChild(script)
  }

  const initRoom = async () => {
    try {
      // Create or get room via Daily.co API
      const apiKey = import.meta.env.VITE_DAILY_API_KEY
      if (!apiKey) {
        // Demo mode: use a public Daily.co test room
        setRoomUrl('https://telio.daily.co/hello')
        setCallState('waiting')
        return
      }

      const roomName = `appt-${id!.replace(/-/g, '').slice(0, 32)}`
      const res = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })

      let url: string
      if (res.ok) {
        const room = await res.json()
        url = room.url
      } else {
        // Create room
        const createRes = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: roomName,
            properties: { exp: Math.floor(Date.now() / 1000) + 7200 }, // 2h expiry
          }),
        })
        const room = await createRes.json()
        url = room.url
      }

      setRoomUrl(url)
    } catch (err: any) {
      setCallState('error')
      setErrorMsg('Failed to create video room: ' + err.message)
    }
  }

  const joinCall = async () => {
    if (!roomUrl || !frameRef.current || !window.DailyIframe) return
    setCallState('joining')
    startTimeRef.current = new Date()

    try {
      const frame = window.DailyIframe.createFrame(frameRef.current, {
        iframeStyle: { width: '100%', height: '100%', border: 'none' },
        showLeaveButton: false,
        showFullscreenButton: true,
      })
      dailyRef.current = frame

      frame.on('joined-meeting', () => setCallState('active'))
      frame.on('left-meeting', handleEnd)
      frame.on('error', () => {
        setCallState('error')
        setErrorMsg('Video call encountered an error.')
      })

      frame.join({
        url: roomUrl,
        userName: user?.name || 'Guest',
      })
    } catch (err: any) {
      setCallState('error')
      setErrorMsg('Failed to join call: ' + err.message)
    }
  }

  const handleEnd = () => {
    dailyRef.current?.destroy()
    dailyRef.current = null
    setCallState('ended')
  }

  const endCall = async () => {
    dailyRef.current?.leave()
    handleEnd()
  }

  const toggleMute = () => {
    if (!dailyRef.current) return
    const muted = !isMuted
    dailyRef.current.setLocalAudio(!muted)
    setIsMuted(muted)
  }

  const toggleCamera = () => {
    if (!dailyRef.current) return
    const off = !isCameraOff
    dailyRef.current.setLocalVideo(!off)
    setIsCameraOff(off)
  }

  const saveConsultation = async () => {
    if (!appointment || !user) return
    setSavingNotes(true)
    try {
      const durationMs = new Date().getTime() - startTimeRef.current.getTime()
      const durationMin = Math.round(durationMs / 60000)

      await supabase.from('consultations').insert({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        provider_id: appointment.provider_id,
        consultation_date: new Date().toISOString(),
        duration_minutes: durationMin || appointment.duration_minutes,
        consultation_notes: notes,
        status: 'completed',
      })

      await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointment.id)

      navigate('/appointments')
    } catch (err: any) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSavingNotes(false)
    }
  }

  const providerName = (appointment?.providers as any)?.users?.name
  const patientName = (appointment as any)?.patientUser?.name
  const isProvider = user?.role === 'provider'

  // Loading
  if (callState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-white animate-spin" />
      </div>
    )
  }

  // Error
  if (callState === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cannot Start Consultation</h2>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => navigate('/appointments')}
            className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    )
  }

  // Ended
  if (callState === 'ended') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Consultation Ended</h2>
          <p className="text-gray-500 text-sm mb-6">
            {isProvider ? 'Please add your consultation notes below before finishing.' : 'Your consultation is complete.'}
          </p>
          {isProvider && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Notes <span className="text-gray-400 text-xs">(diagnosis, treatment plan, follow-up)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Patient presented with... Diagnosis... Treatment plan..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              />
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={saveConsultation}
              disabled={savingNotes}
              className="flex-1 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {savingNotes ? 'Saving...' : isProvider ? 'Save & Finish' : 'Return to Appointments'}
            </button>
            {!isProvider && (
              <button
                onClick={() => navigate('/appointments')}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800">
        <div>
          <h1 className="text-white font-semibold">
            Consultation with {isProvider ? patientName : `Dr. ${providerName}`}
          </h1>
          <p className="text-gray-400 text-xs">{(appointment?.providers as any)?.specialty}</p>
        </div>
        <div className="flex items-center gap-3">
          {isProvider && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                showNotes ? 'bg-brand-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              <FileText className="h-4 w-4" />
              Notes
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative">
          {callState === 'waiting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center max-w-sm">
                <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-6">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-white text-xl font-semibold mb-2">
                  {isProvider
                    ? `Consultation with ${patientName}`
                    : `Waiting for Dr. ${providerName}`}
                </h2>
                <p className="text-gray-400 text-sm mb-8">
                  {isProvider
                    ? 'You will start the video consultation below.'
                    : 'The provider will start the call shortly.'}
                </p>
                {roomUrl ? (
                  <button
                    onClick={joinCall}
                    className="px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    {isProvider ? 'Start Consultation' : 'Join Call'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 justify-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Preparing room...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {callState === 'joining' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">Joining...</p>
              </div>
            </div>
          )}

          {/* Daily.co iframe container */}
          <div
            ref={frameRef}
            className={cn('absolute inset-0', callState !== 'active' && callState !== 'joining' && 'hidden')}
          />
        </div>

        {/* Notes panel */}
        {showNotes && isProvider && (
          <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-white font-medium text-sm">Consultation Notes</span>
              <button onClick={() => setShowNotes(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              className="flex-1 bg-gray-900 text-white text-sm px-4 py-3 resize-none outline-none placeholder-gray-600"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      {(callState === 'active' || callState === 'joining') && (
        <div className="flex items-center justify-center gap-4 py-5 bg-gray-800">
          <button
            onClick={toggleMute}
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center transition-colors',
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            )}
          >
            {isMuted ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
          </button>
          <button
            onClick={toggleCamera}
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center transition-colors',
              isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            )}
          >
            {isCameraOff ? <VideoOff className="h-5 w-5 text-white" /> : <Video className="h-5 w-5 text-white" />}
          </button>
          <button
            onClick={endCall}
            className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
          >
            <PhoneOff className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
