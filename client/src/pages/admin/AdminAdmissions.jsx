import { useState, useEffect } from 'react'
import { Badge, PageTitle, EmptyState, Tabs } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/api'

function exportAdmissionsExcel(admissions, tab) {
  const headers = ['#', 'Patient', 'Treatment', 'Type', 'Hospital', 'Preferred Date', 'Urgency', 'Status', 'Notes']
  const rows = admissions.map((a, i) => [
    i + 1,
    a.patient?.user?.name || a.patientName || '',
    a.treatmentName || '',
    a.type || '',
    a.hospital?.name || '',
    fmtDate(a.preferredDate) || '',
    a.urgency || '',
    a.status || '',
    a.notes || '',
  ])
  const bom = '\uFEFF'
  const csv = bom + [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `healfocus_admissions_${tab}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Downloaded!')
}

export default function AdminAdmissions() {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const TABS = [
    { id: 'pending',   label: 'Pending'   },
    { id: 'reviewing', label: 'Reviewing' },
    { id: 'approved',  label: 'Approved'  },
    { id: 'rejected',  label: 'Rejected'  },
  ]
  const URGENCY = { planned:'bg-blue-100 text-blue-700', 'semi-urgent':'bg-amber-100 text-amber-700', urgent:'bg-red-100 text-red-700' }

  const load = () => {
    setLoading(true)
    adminApi.getAdmissions()
      .then(res => setAdmissions(res.data?.data || []))
      .catch(() => toast.error('Failed to load admissions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = admissions.filter(a => a.status === tab)

  const updateStatus = async (id, status) => {
    try {
      await adminApi.updateAdmissionStatus(id, { status })
      toast.success('Status updated')
      load()
    } catch { toast.error('Failed to update') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <PageTitle icon="🏥">Admissions</PageTitle>
        <button
          onClick={() => exportAdmissionsExcel(filtered, tab)}
          disabled={!filtered.length}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-full transition-all"
        >
          <Download size={12} /> Export
        </button>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !filtered.length ? <EmptyState icon="🏥" title={`No ${tab} admissions`} /> : (
        <div className="space-y-3 mt-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-black text-primary-950">{a.patient?.user?.name || a.patientName || '—'}</p>
                  <p className="text-xs text-gray-600 font-medium">{a.treatmentName} · {a.type}</p>
                  <p className="text-xs text-gray-400">Preferred: {fmtDate(a.preferredDate)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${URGENCY[a.urgency] || 'bg-gray-100 text-gray-600'}`}>{a.urgency}</span>
              </div>
              {a.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-2">{a.notes}</p>}
              {tab === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(a.id, 'reviewing')} className="flex-1 py-1.5 text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200 rounded-lg">Review</button>
                  <button onClick={() => updateStatus(a.id, 'approved')} className="flex-1 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg">Approve</button>
                  <button onClick={() => updateStatus(a.id, 'rejected')} className="flex-1 py-1.5 text-xs font-bold bg-red-100 text-red-600 rounded-lg">Reject</button>
                </div>
              )}
              {tab === 'reviewing' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(a.id, 'approved')} className="flex-1 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg">Approve</button>
                  <button onClick={() => updateStatus(a.id, 'rejected')} className="flex-1 py-1.5 text-xs font-bold bg-red-100 text-red-600 rounded-lg">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
