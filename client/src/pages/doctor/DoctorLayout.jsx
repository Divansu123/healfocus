import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/ui'
import { Menu, LogOut } from 'lucide-react'
import { authApi } from '@/api'

const NAV = [
  { section: 'Appointments' },
  { id: 'appointments', icon: '📅', label: 'Appointments' },
  { id: 'opd', icon: '🏃', label: 'OPD Management' },
  { section: 'Patients' },
  { id: 'patients', icon: '👥', label: 'Patient Records' },
  { id: 'discharge', icon: '📋', label: 'Discharge Summary' },
  { id: 'bills', icon: '💰', label: 'Indoor Bills' },
  { section: 'Hospital' },
  { id: 'doctors', icon: '👨‍⚕️', label: 'Doctors' },
  { id: 'promos', icon: '🎁', label: 'Promotions' },
  { id: 'requests', icon: '🔧', label: 'Service Requests' },
]

export default function DoctorLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeTab = location.pathname.split('/hospital/')[1] || 'appointments'

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
        onTabChange={(id) => navigate(`/hospital/${id}`)}
        role={user?.name || 'Hospital Staff'}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col lg:min-h-screen">
        <header className="bg-primary-950 text-white px-4 h-14 flex items-center gap-3 sticky top-0 z-20 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1"><Menu size={22} /></button>
          <h1 className="text-base font-black flex-1 tracking-tight">
            {NAV.find(n => n.id === activeTab)?.icon} {NAV.find(n => n.id === activeTab)?.label || 'Hospital Portal'}
          </h1>
          <button onClick={handleLogout} className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-full text-xs font-bold">
            <LogOut size={12} /> Logout
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
