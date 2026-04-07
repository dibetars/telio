import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import { MessageSquare, Search, Circle } from 'lucide-react'
import { cn } from '../lib/utils'

interface Thread {
  userId: string
  name: string
  lastMessage: string
  lastTime: string
  unreadCount: number
}

export default function Messages() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    fetchThreads()

    // Layer 1: postgres_changes — catches all inserts (requires publication setup)
    const pgChannel = supabase
      .channel(`messages-list-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as any
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            fetchThreads()
          }
        }
      )
      .subscribe()

    // Layer 2: Broadcast — instant update when other user sends from Conversation page
    // We listen on any conversation channel involving this user by subscribing to
    // a presence room and re-fetching when a broadcast new_message arrives
    const broadcastChannel = supabase
      .channel(`inbox-${user.id}`)
      .on('broadcast', { event: 'new_message' }, () => {
        fetchThreads()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(pgChannel)
      supabase.removeChannel(broadcastChannel)
    }
  }, [user])

  const fetchThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, name),
          receiver:users!receiver_id(id, name)
        `)
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      const threadMap = new Map<string, Thread>()
      for (const msg of (data || []) as any[]) {
        const other = msg.sender_id === user!.id ? msg.receiver : msg.sender
        if (!other) continue
        if (!threadMap.has(other.id)) {
          threadMap.set(other.id, {
            userId: other.id,
            name: other.name || 'Unknown',
            lastMessage: msg.message,
            lastTime: msg.created_at,
            unreadCount: 0,
          })
        }
        if (msg.receiver_id === user!.id && !msg.is_read) {
          threadMap.get(other.id)!.unreadCount++
        }
      }

      setThreads(Array.from(threadMap.values()))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = threads.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
            <p className="text-gray-500 text-sm">
              Start a conversation by messaging a {user?.role === 'patient' ? 'doctor' : 'patient'} from their profile.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden tour-messages-list">
            {filtered.map((thread, i) => (
              <button
                key={thread.userId}
                onClick={() => navigate(`/messages/${thread.userId}`)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left',
                  i < filtered.length - 1 && 'border-b border-gray-100'
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="h-11 w-11 rounded-full bg-brand-100 flex items-center justify-center">
                    <span className="text-brand-600 font-semibold text-sm">
                      {thread.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {thread.unreadCount > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-brand-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{thread.unreadCount}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn('text-sm font-medium truncate', thread.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700')}>
                      {thread.name}
                    </p>
                    <p className="text-xs text-gray-400 flex-shrink-0">{formatTime(thread.lastTime)}</p>
                  </div>
                  <p className={cn('text-xs truncate mt-0.5', thread.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500')}>
                    {thread.lastMessage}
                  </p>
                </div>

                {thread.unreadCount > 0 && (
                  <Circle className="h-2.5 w-2.5 text-brand-600 fill-current flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
