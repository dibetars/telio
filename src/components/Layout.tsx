import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { TelioLogoFull } from './TelioLogo'
import {
  LayoutDashboard,
  Search,
  Calendar,
  MessageSquare,
  FileText,
  User,
  Users,
  Clock,
  LogOut,
  Menu,
  X,
  Bell,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Message } from '../types'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles?: ('patient' | 'provider' | 'admin' | 'organization')[]
}

interface NotifSender { id: string; name: string; role: string }
interface UnreadMessage extends Omit<Message, 'sender'> {
  sender?: NotifSender
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Find Doctors', path: '/doctors', icon: <Search className="h-5 w-5" />, roles: ['patient'] },
  { label: 'Appointments', path: '/appointments', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Messages', path: '/messages', icon: <MessageSquare className="h-5 w-5" /> },
  { label: 'Medical Records', path: '/medical-records', icon: <FileText className="h-5 w-5" />, roles: ['patient'] },
  { label: 'Availability', path: '/availability', icon: <Clock className="h-5 w-5" />, roles: ['provider'] },
  { label: 'Manage Doctors', path: '/dashboard?tab=doctors', icon: <Users className="h-5 w-5" />, roles: ['organization'] },
  { label: 'Health Dashboard', path: '/admin', icon: <ShieldCheck className="h-5 w-5" />, roles: ['admin'] },
]

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Notification state
  const [unread, setUnread] = useState<UnreadMessage[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch unread messages + subscribe to new ones
  useEffect(() => {
    if (!user) return

    const fetchUnread = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:users!sender_id(id, name, role)')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(15)
      if (data) setUnread(data as UnreadMessage[])
    }

    fetchUnread()

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message
          if (msg.receiver_id === user.id) {
            // Re-fetch to get the joined sender name
            fetchUnread()
          }
        }
      )
      // Also listen for messages being marked read elsewhere (e.g. in Conversation)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message
          if (msg.receiver_id === user.id && msg.is_read) {
            setUnread((prev) => prev.filter((m) => m.id !== msg.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const markAllRead = async () => {
    if (!user || unread.length === 0) return
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)
    setUnread([])
  }

  const openConversation = (senderId: string) => {
    setNotifOpen(false)
    navigate(`/messages/${senderId}`)
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    return (
      <button
        onClick={() => { navigate(item.path); setMobileOpen(false) }}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          active
            ? 'bg-brand-600 text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        {item.icon}
        {item.label}
      </button>
    )
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn('flex flex-col h-full', mobile && 'p-4')}>
      {/* Logo */}
      <div className="px-3 py-4 mb-2">
        <TelioLogoFull size="sm" />
      </div>

      {/* Nav links */}
      <div className="flex-1 space-y-1 px-2">
        {visibleItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </div>

      {/* Profile + sign out */}
      <div className="px-2 py-4 border-t border-gray-200 space-y-1 mt-2">
        <button
          onClick={() => { navigate('/profile'); setMobileOpen(false) }}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            location.pathname === '/profile'
              ? 'bg-brand-600 text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          <User className="h-5 w-5" />
          Profile
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </nav>
  )

  const NotificationDropdown = () => (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Message list */}
      {unread.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No new notifications</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
          {unread.map((msg) => (
            <button
              key={msg.id}
              onClick={() => openConversation(msg.sender_id)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-left"
            >
              {/* Avatar */}
              <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-brand-700 font-semibold text-sm">
                  {(msg.sender?.name ?? '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {msg.sender?.role === 'provider'
                      ? `Dr. ${msg.sender.name}`
                      : (msg.sender?.name ?? 'Unknown')}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate mt-0.5">{msg.message}</p>
              </div>
              {/* Unread dot */}
              <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2.5">
        <button
          onClick={() => { setNotifOpen(false); navigate('/messages') }}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium w-full text-center"
        >
          View all messages →
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-white border-r border-gray-200 flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl z-50">
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} className="p-1 text-gray-500 hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setMobileOpen(true)} className="p-1 text-gray-600">
            <Menu className="h-6 w-6" />
          </button>
          <TelioLogoFull size="sm" />
          <button onClick={() => navigate('/profile')} className="p-1 text-gray-600">
            <User className="h-6 w-6" />
          </button>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex items-center justify-end px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unread.length > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold leading-none">
                      {unread.length > 9 ? '9+' : unread.length}
                    </span>
                  </span>
                )}
              </button>
              {notifOpen && <NotificationDropdown />}
            </div>

            {/* User info */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-brand-600 font-semibold text-xs">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{user?.name}</span>
              <span className="text-xs text-gray-400 capitalize">({user?.role})</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
