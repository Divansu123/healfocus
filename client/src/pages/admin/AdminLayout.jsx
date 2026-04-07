import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/ui'
import { Menu, LogOut, Bell } from 'lucide-react'
import { authApi, adminApi } from '@/api'
import AdminNotifications from './AdminNotifications'

const NAV = [
  { section: 'Overview' },
  { id: 'overview',   icon: '📊', label: 'Dashboard' },
  { section: 'Network' },
  { id: 'hospitals',  icon: '🏥', label: 'Hospitals' },
  { id: 'onboarding', icon: '✅', label: 'Onboarding' },
  { section: 'Patients' },
  { id: 'patients',   icon: '👥', label: 'Patients' },
  { id: 'admissions', icon: '🛏️', label: 'Admissions' },
  { section: 'Operations' },
  { id: 'promos',     icon: '🎁', label: 'Promotions' },
  { id: 'requests',   icon: '🔧', label: 'Service Requests' },
  { id: 'team',       icon: '👨‍💼', label: 'Team' },
  { section: 'AI Tools' },
  { id: 'billcheck',  icon: '🔍', label: 'AI Bill Analyzer' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    adminApi.getNotifications()
      .then(res => {
        const data = res.data?.data || []
        setUnreadCount(data.filter(n => !n.read).length)
      })
      .catch(() => {})
  }, [showNotifs])

  const activeTab = location.pathname.split('/admin/')[1] || 'overview'

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
        navItems={NAV}
        activeTab={activeTab}
        onTabChange={(id) => navigate(`/admin/${id}`)}
        role="Super Admin"
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col lg:min-h-screen">
        <header className="bg-primary-950 text-white px-4 h-14 flex items-center gap-3 sticky top-0 z-20 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1"><Menu size={22} /></button>
          <h1 className="text-base font-black flex-1 tracking-tight">
            {NAV.find(n => n.id === activeTab)?.icon} {NAV.find(n => n.id === activeTab)?.label || 'Admin Panel'}
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotifs(true)} className="relative p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-full text-xs font-bold">
              <LogOut size={12} /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      {showNotifs && <AdminNotifications onClose={() => setShowNotifs(false)} />}
    </div>
  )
}
