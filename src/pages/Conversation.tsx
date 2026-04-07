import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import { Message } from '../types'
import { ArrowLeft, Send, Loader2, Wifi, WifiOff } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Conversation() {
  const { id: otherId } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<Message[]>([])
  const [otherName, setOtherName] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const channelId = user && otherId
    ? ['conv', ...([user.id, otherId].sort())].join('-')
    : null

  useEffect(() => {
    if (!user || !otherId || !channelId) return

    fetchMessages()
    fetchOtherUser()
    markAsRead()

    // ── Dual-layer real-time ──────────────────────────────────────────────
    // Layer 1: Supabase Broadcast — instant delivery (no publication needed)
    // Layer 2: postgres_changes — catches messages from other sessions/tabs
    const channel = supabase
      .channel(channelId)
      // Broadcast: sender pushes message directly to channel after DB insert
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        const msg = payload as Message
        if (
          (msg.sender_id === otherId && msg.receiver_id === user.id) ||
          (msg.sender_id === user.id && msg.receiver_id === otherId)
        ) {
          setMessages((prev) =>
            prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]
          )
          if (msg.receiver_id === user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id)
          }
        }
      })
      // postgres_changes: backup for cross-device / missed broadcasts
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message
          const inThisConvo =
            (msg.sender_id === otherId && msg.receiver_id === user.id) ||
            (msg.sender_id === user.id && msg.receiver_id === otherId)
          if (!inThisConvo) return
          setMessages((prev) =>
            prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]
          )
          if (msg.receiver_id === user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id)
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [user, otherId, channelId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user!.id},receiver_id.eq.${otherId}),` +
        `and(sender_id.eq.${otherId},receiver_id.eq.${user!.id})`
      )
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setLoading(false)
  }

  const fetchOtherUser = async () => {
    const { data } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', otherId)
      .single()
    if (data) setOtherName(data.role === 'provider' ? `Dr. ${data.name}` : data.name)
  }

  const markAsRead = async () => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherId)
      .eq('receiver_id', user!.id)
      .eq('is_read', false)
  }

  const sendMessage = async () => {
    if (!text.trim() || !user || !otherId) return
    setSending(true)
    const content = text.trim()
    setText('')

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: otherId,
          message: content,
          message_type: 'text',
          is_read: false,
        })
        .select()
        .single()

      if (error) throw error

      // Optimistic add
      setMessages((prev) => [...prev, data])

      // Broadcast 1: notify the conversation channel (other user sees message instantly)
      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'new_message', payload: data })
      }
      // Broadcast 2: notify the receiver's inbox channel (updates their notification bell)
      supabase.channel(`inbox-${otherId}`).send({
        type: 'broadcast',
        event: 'new_message',
        payload: data,
      })
    } catch (err) {
      setText(content)
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const date = formatDate(msg.created_at)
    if (!grouped.length || grouped[grouped.length - 1].date !== date) {
      grouped.push({ date, msgs: [msg] })
    } else {
      grouped[grouped.length - 1].msgs.push(msg)
    }
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => navigate('/messages')}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-600 font-semibold text-sm">
              {otherName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{otherName || '...'}</p>
            <p className="text-xs text-gray-400">{connected ? 'Online' : 'Connecting...'}</p>
          </div>
          {/* Connection indicator */}
          <div title={connected ? 'Connected' : 'Connecting...'}>
            {connected
              ? <Wifi className="h-4 w-4 text-green-500" />
              : <WifiOff className="h-4 w-4 text-gray-400 animate-pulse" />}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.date}>
                <div className="text-center my-4">
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {group.date}
                  </span>
                </div>
                {group.msgs.map((msg, i) => {
                  const isMine = msg.sender_id === user?.id
                  const prevIsMine = i > 0 ? group.msgs[i - 1].sender_id === user?.id : !isMine
                  const showAvatar = !isMine && (i === 0 || prevIsMine)

                  return (
                    <div
                      key={msg.id}
                      className={cn('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start', i > 0 ? 'mt-1' : '')}
                    >
                      {!isMine && (
                        <div className={cn('h-6 w-6 rounded-full bg-brand-100 flex-shrink-0 flex items-center justify-center', !showAvatar && 'invisible')}>
                          <span className="text-brand-600 text-xs font-semibold">
                            {otherName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="max-w-xs sm:max-w-sm lg:max-w-md">
                        <div
                          className={cn(
                            'px-4 py-2.5 rounded-2xl text-sm',
                            isMine
                              ? 'bg-brand-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                          )}
                        >
                          {msg.message}
                        </div>
                        <p className={cn('text-xs text-gray-400 mt-0.5 px-1', isMine ? 'text-right' : '')}>
                          {formatTime(msg.created_at)}
                          {isMine && msg.is_read && <span className="ml-1 text-brand-400">✓✓</span>}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none max-h-28 overflow-y-auto"
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className="p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors flex-shrink-0"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </Layout>
  )
}
