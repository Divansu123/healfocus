import { useState, useEffect } from 'react'
import { Tabs, EmptyState, PageTitle } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { hospitalApi } from '@/api'

function exportApptsExcel(appointments, tab) {
  const headers = ['#', 'Patient', 'Doctor', 'Date', 'Time', 'Reason', 'Status']
  const rows = appointments.map((a, i) => [
    i + 1,
    a.patient?.user?.name || a.patientName || '',
    a.doctor?.name || '',
    fmtDate(a.date) || a.date || '',
    a.time || '',
    a.reason || '',
    a.status || '',
  ])
  const bom = '\uFEFF'
  const csv = bom + [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `appointments_${tab}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Downloaded!')
}

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')

  const TABS = [
    { id: 'pending',   label: 'Pending'   },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ]

  const load = () => {
    setLoading(true)
    hospitalApi.getAppointments()
      .then(res => setAppointments(res.data?.data || []))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = appointments.filter(a => a.status === tab)

  const update = async (id, status) => {
    try {
      await hospitalApi.updateAppointment(id, { status })
      toast.success('Status updated')
      load()
    } catch { toast.error('Failed to update') }
  }

  const STATUS_COLOR = {
    pending:   'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <PageTitle icon="📅">Appointments</PageTitle>
        <button
          onClick={() => exportApptsExcel(filtered, tab)}
          disabled={!filtered.length}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-full transition-all"
        >
          <Download size={12} /> Export
        </button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : !filtered.length ? (
        <EmptyState icon="📅" title={`No ${tab} appointments`} />
      ) : (
        <div className="space-y-3 mt-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm font-black text-primary-950">{a.patient?.user?.name || '—'}</p>
                  <p className="text-xs text-gray-500">Dr. {a.doctor?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{fmtDate(a.date)} · {a.time}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[a.status]}`}>
                  {a.status}
                </span>
              </div>
              {a.reason && (
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mt-1">{a.reason}</p>
              )}
              {tab === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => update(a.id, 'confirmed')}
                    className="flex-1 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg">
                    ✅ Confirm
                  </button>
                  <button onClick={() => update(a.id, 'cancelled')}
                    className="flex-1 py-1.5 text-xs font-bold bg-red-100 text-red-600 rounded-lg">
                    ✕ Cancel
                  </button>
                </div>
              )}
              {tab === 'confirmed' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => update(a.id, 'completed')}
                    className="flex-1 py-1.5 text-xs font-bold bg-primary-600 text-white rounded-lg">
                    ✔ Mark Completed
                  </button>
                  <button onClick={() => update(a.id, 'cancelled')}
                    className="flex-1 py-1.5 text-xs font-bold bg-red-100 text-red-600 rounded-lg">
                    ✕ Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
