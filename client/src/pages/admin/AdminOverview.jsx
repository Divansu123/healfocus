import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/ui'
import { adminApi } from '@/api'
import toast from 'react-hot-toast'

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 88 }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0)
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 6} fill="none" stroke="#e5e7eb" strokeWidth="12" />
      </svg>
    )
  }
  const cx = size / 2, cy = size / 2, r = size / 2 - 6
  const circ = 2 * Math.PI * r
  let offset = 0
  const arcs = segments.map((seg) => {
    const frac = seg.value / total
    const dash = frac * circ
    const el = (
      <circle
        key={seg.label}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth="12"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    )
    offset += dash
    return el
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize="13" fontWeight="800" fill="#1e1b4b">{total}</text>
    </svg>
  )
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ bars }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="flex items-end gap-1.5" style={{ height: 90 }}>
      {bars.map((b, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <span className="text-[9px] font-bold text-gray-500">{b.value}</span>
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${Math.max(4, (b.value / max) * 62)}px`,
              background: b.color || '#4f46e5',
            }}
          />
          <span className="text-[8px] text-gray-400 text-center leading-tight truncate w-full">{b.label}</span>
        </div>
      ))}
    </div>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
}

// ─────────────────────────────────────────────────────────────────────────────

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

  if (loading) return (
    <div>
      <PageTitle icon="📊">Analytics Overview</PageTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
      <Skeleton className="h-40 mb-4" />
      <Skeleton className="h-40" />
    </div>
  )

  if (!data) return null

  const {
    hospitals = 0, patients = 0, appointments = 0, doctors = 0,
    pendingServiceRequests = 0, pendingSignups = 0, pendingAdmissions = 0,
    apptByStatus = {}, patientByGender = {},
    monthlyAppointments = [], appointmentsPerHospital = [], popularSpecialties = [],
  } = data

  const STAT_CARDS = [
    { icon: '📅', label: 'Total Appointments', num: appointments, color: '#b45309' },
    { icon: '👥', label: 'Registered Patients', num: patients, color: '#059669' },
    { icon: '🏥', label: 'Hospitals', num: hospitals, color: '#4f46e5' },
    { icon: '👨‍⚕️', label: 'Doctors', num: doctors, color: '#7c3aed' },
  ]

  const apptSegments = [
    { value: apptByStatus.confirmed || 0, color: '#1e8a4c', label: 'Confirmed' },
    { value: apptByStatus.pending || 0, color: '#c45f00', label: 'Pending' },
    { value: apptByStatus.completed || 0, color: '#6b21a8', label: 'Completed' },
    { value: apptByStatus.cancelled || 0, color: '#c62828', label: 'Cancelled' },
  ]

  const genderSegments = [
    { value: patientByGender.Male || 0, color: '#1a73e8', label: 'Male' },
    { value: patientByGender.Female || 0, color: '#e91e63', label: 'Female' },
    { value: patientByGender.Other || 0, color: '#9e9e9e', label: 'Other' },
  ]

  const PALETTE = ['#4f46e5', '#059669', '#7c3aed', '#b45309', '#0d9488', '#dc2626']

  const monthBars = monthlyAppointments.map(m => ({
    label: m.month, value: m.count, color: '#4f46e5',
  }))

  const hospBars = appointmentsPerHospital.map((h, i) => ({
    label: h.name.split(' ').slice(0, 2).join(' '),
    value: h.count,
    color: PALETTE[i % PALETTE.length],
  }))

  const specBars = popularSpecialties.map(s => ({
    label: s.name.slice(0, 10),
    value: s.count,
    color: '#0d9488',
  }))

  const QUICK_LINKS = [
    { icon: '✅', label: 'Onboarding', to: '/admin/onboarding', badge: pendingSignups },
    { icon: '🏥', label: 'Hospitals', to: '/admin/hospitals' },
    { icon: '👥', label: 'Patients', to: '/admin/patients' },
    { icon: '🛏️', label: 'Admissions', to: '/admin/admissions', badge: pendingAdmissions },
    { icon: '🎁', label: 'Promotions', to: '/admin/promos' },
    { icon: '🔧', label: 'Requests', to: '/admin/requests', badge: pendingServiceRequests },
    { icon: '👫', label: 'Team', to: '/admin/team' },
  ]

  return (
    <div>
      <PageTitle icon="📊">Analytics Overview</PageTitle>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.num}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-5">
        {QUICK_LINKS.map(l => (
          <button key={l.label} onClick={() => navigate(l.to)}
            className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all relative">
            <p className="text-xl mb-1">{l.icon}</p>
            <p className="text-[10px] font-bold text-gray-700 leading-tight">{l.label}</p>
            {l.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {l.badge > 9 ? '9+' : l.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Donut Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-3">📊 Appointment Status</p>
          <div className="flex items-center gap-4">
            <DonutChart segments={apptSegments} size={88} />
            <div className="flex flex-col gap-1.5 flex-1">
              {apptSegments.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-[11px] text-gray-500 flex-1">{s.label}:</span>
                  <span className="text-[11px] font-bold text-gray-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-3">👥 Patient Demographics</p>
          <div className="flex items-center gap-4">
            <DonutChart segments={genderSegments} size={88} />
            <div className="flex flex-col gap-1.5 flex-1">
              {genderSegments.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-[11px] text-gray-500 flex-1">{s.label}:</span>
                  <span className="text-[11px] font-bold text-gray-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Appointments */}
      {monthBars.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm font-bold text-gray-700 mb-3">📈 Monthly Appointments (Last 6 Months)</p>
          <BarChart bars={monthBars} />
        </div>
      )}

      {/* Appointments per Hospital */}
      {hospBars.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm font-bold text-gray-700 mb-3">🏥 Appointments per Hospital</p>
          <BarChart bars={hospBars} />
        </div>
      )}

      {/* Popular Specialties */}
      {specBars.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm font-bold text-gray-700 mb-3">🩺 Popular Specialties</p>
          <BarChart bars={specBars} />
        </div>
      )}

      {/* Live Alerts */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
        <p className="text-sm font-bold text-gray-700 mb-3">⚠️ Live Alerts</p>
        {apptByStatus.pending > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-[12px] font-medium mb-2">
            {apptByStatus.pending} appointment{apptByStatus.pending > 1 ? 's' : ''} pending confirmation
          </div>
        )}
        {pendingAdmissions > 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-3 py-2 text-[12px] font-medium mb-2">
            {pendingAdmissions} admission request{pendingAdmissions > 1 ? 's' : ''} pending review
          </div>
        )}
        {pendingSignups > 0 && (
          <div className="bg-purple-50 border border-purple-200 text-purple-800 rounded-xl px-3 py-2 text-[12px] font-medium mb-2">
            {pendingSignups} hospital onboarding request{pendingSignups > 1 ? 's' : ''} pending
          </div>
        )}
        {pendingServiceRequests > 0 && (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 rounded-xl px-3 py-2 text-[12px] font-medium mb-2">
            {pendingServiceRequests} open service request{pendingServiceRequests > 1 ? 's' : ''} to handle
          </div>
        )}
        {apptByStatus.pending === 0 && pendingAdmissions === 0 && pendingSignups === 0 && pendingServiceRequests === 0 && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-3 py-2 text-[12px] font-medium">
            ✅ All clear! No pending actions.
          </div>
        )}
      </div>
    </div>
  )
}
