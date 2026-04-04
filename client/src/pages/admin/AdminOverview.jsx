import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/ui'
import { adminApi } from '@/api'
import toast from 'react-hot-toast'

export default function AdminOverview() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getOverview()
      .then(res => setData(res.data?.data))
      .catch(() => toast.error('Failed to load overview'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
  if (!data) return null

  const counts = {
    hospitals: data?.hospitals || 0,
    patients: data?.patients || 0,
    appointments: data?.appointments || 0,
    pendingAdmissions: data?.admissions || 0,
    openServiceRequests: data?.pendingServiceRequests || 0,
    pendingOnboarding: data?.pendingSignups || 0,
  }

  const recentSignupRequests = []
  const recentAdmissions = []
  const hospitals = []
  
  const STATS = [
    { icon: '🏥', label: 'Total Hospitals', num: counts.hospitals || 0, color: '#4f46e5' },
    { icon: '👥', label: 'Registered Patients', num: counts.patients || 0, color: '#059669' },
    { icon: '📅', label: 'Total Appointments', num: counts.appointments || 0, color: '#b45309' },
    { icon: '✅', label: 'Pending Onboarding', num: counts.pendingOnboarding || 0, color: '#dc2626' },
    { icon: '🏥', label: 'Pending Admissions', num: counts.pendingAdmissions || 0, color: '#7c3aed' },
    { icon: '🔧', label: 'Open Requests', num: counts.openServiceRequests || 0, color: '#0d9488' },
  ]

  const QUICK_LINKS = [
    { icon: '✅', label: 'Onboarding', to: '/admin/onboarding', badge: counts.pendingOnboarding || 0 },
    { icon: '🏥', label: 'Hospitals', to: '/admin/hospitals' },
    { icon: '👥', label: 'Patients', to: '/admin/patients' },
    { icon: '🏥', label: 'Admissions', to: '/admin/admissions', badge: counts.pendingAdmissions || 0 },
    { icon: '🎁', label: 'Promotions', to: '/admin/promos' },
    { icon: '🔧', label: 'Service Requests', to: '/admin/requests', badge: counts.openServiceRequests || 0 },
    { icon: '👨‍💼', label: 'Team', to: '/admin/team' },
  ]

  return (
    <div>
      <PageTitle icon="📊">Admin Dashboard</PageTitle>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.num}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 mb-5">
        {QUICK_LINKS.map(l => (
          <button key={l.label} onClick={() => navigate(l.to)}
            className="bg-white border border-primary-100 rounded-2xl p-4 text-left shadow-card hover:border-primary-400 hover:bg-primary-50 transition-all relative">
            <p className="text-2xl mb-1">{l.icon}</p>
            <p className="text-xs font-bold text-primary-950">{l.label}</p>
            {l.badge > 0 && <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{l.badge}</span>}
          </button>
        ))}
      </div>

      {recentSignupRequests.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pending Onboarding</p>
          <div className="space-y-2">
            {recentSignupRequests.slice(0, 3).map(r => (
              <div key={r.id} className="bg-primary-50 border border-primary-200 rounded-xl p-3 flex gap-3 items-start">
                <span className="text-base flex-shrink-0">🏥</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary-950">{r.name}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{r.city} · {r.type}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hospital Overview</p>
        <div className="space-y-2">
          {hospitals.map(h => (
            <div key={h.id} className="bg-white border border-primary-100 rounded-2xl p-4 flex items-center gap-3 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl flex-shrink-0 border border-primary-200">🏥</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary-950 truncate">{h.name}</p>
                <p className="text-xs text-gray-500">{h.city} · {h.beds || '—'} beds</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
