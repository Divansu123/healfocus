import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { BottomNav, Sidebar } from '@/components/ui'
import { Menu, Bell, LogOut } from 'lucide-react'
import { authApi } from '@/api'

const BOTTOM_TABS = [
  { id: '/patient',              label: 'Home',    icon: '🏠' },
  { id: '/patient/appointments', label: 'Appts',   icon: '📅' },
  { id: '/patient/book',         label: 'Book',    icon: '➕' },
  { id: '/patient/records',      label: 'Records', icon: '📋' },
  { id: '/patient/health',       label: 'Health',  icon: '❤️' },
]

const NAV_ITEMS = [
  { section: 'Main' },
  { id: '/patient',              icon: '🏠', label: 'Home' },
  { id: '/patient/appointments', icon: '📅', label: 'Appointments' },
  { id: '/patient/book',         icon: '➕', label: 'Book Appointment' },
  { section: 'Health' },
  { id: '/patient/records',      icon: '📋', label: 'My Records' },
  { id: '/patient/health',       icon: '❤️', label: 'Health Tracker' },
  { id: '/patient/wellness',     icon: '💊', label: 'Wellness' },
  { id: '/patient/admissions',   icon: '🏥', label: 'Admissions' },
  { section: 'More' },
  { id: '/patient/genz',         icon: '✨', label: 'GenZ Features' },
  { id: '/patient/notifications',icon: '🔔', label: 'Notifications' },
  { id: '/patient/profile',      icon: '👤', label: 'Profile' },
]

export default function PatientLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activePath = location.pathname
  const activeBottom = BOTTOM_TABS.find(t => t.id === activePath)?.id || '/patient'
  const activeLabel = NAV_ITEMS.find(n => n.id === activePath)?.label || 'Patient Portal'
  const activeIcon  = NAV_ITEMS.find(n => n.id === activePath)?.icon || '🏥'

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#eef0f8] lg:flex">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={NAV_ITEMS}
        activeTab={activePath}
        onTabChange={(id) => { navigate(id); setSidebarOpen(false) }}
        role={user?.name || 'Patient'}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col lg:min-h-screen">
        <header className="bg-primary-950 text-white px-4 h-14 flex items-center gap-3 sticky top-0 z-20 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1"><Menu size={22} /></button>
          <h1 className="text-base font-black flex-1 tracking-tight">{activeIcon} {activeLabel}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/patient/notifications')} className="relative p-1">
              <Bell size={18} />
            </button>
            <button onClick={handleLogout} className="hidden lg:flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-full text-xs font-bold">
              <LogOut size={12} /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-0 lg:p-6">
            <Outlet />
          </div>
        </main>
        <div className="lg:hidden">
          <BottomNav tabs={BOTTOM_TABS} active={activeBottom} onChange={(id) => navigate(id)} />
        </div>
      </div>
    </div>
  )
}
