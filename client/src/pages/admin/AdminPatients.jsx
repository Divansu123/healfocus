import { useState, useEffect } from 'react'
import { PageTitle, EmptyState } from '@/components/ui'
import { Search, Download } from 'lucide-react'
import { adminApi } from '@/api'
import toast from 'react-hot-toast'

function exportPatientsExcel(patients) {
  const headers = ['#', 'Name', 'Email', 'Phone', 'Age', 'Gender', 'Blood Type', 'City', 'Allergies', 'Conditions']
  const rows = patients.map((p, i) => [
    i + 1,
    p.user?.name || '',
    p.user?.email || '',
    p.user?.phone || '',
    p.patient?.age || '',
    p.patient?.gender || '',
    p.patient?.bloodType || '',
    p.patient?.city || '',
    p.patient?.allergies || '',
    p.patient?.conditions || '',
  ])
  const bom = '\uFEFF'
  const csv = bom + [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `healfocus_patients_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Excel file downloaded!')
}

export default function AdminPatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    adminApi.getPatients()
      .then(res => setPatients(res.data?.data || []))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p =>
    !search || p.user?.name?.toLowerCase().includes(search.toLowerCase()) || p.user?.phone?.includes(search) || p.user?.email?.includes(search)
  )

  if (selected) {
    const pat = selected
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-primary-600 text-sm font-bold mb-4 flex items-center gap-1">← Back to Patients</button>
        <div className="bg-white border border-primary-100 rounded-2xl p-5 shadow-card mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-3xl border border-primary-200">👤</div>
            <div>
              <p className="text-base font-black text-primary-950">{pat.user?.name}</p>
              <p className="text-xs text-gray-500">{pat.user?.email}</p>
              <p className="text-xs text-gray-400">{pat.user?.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Age', pat.patient?.age || '—'],
              ['Gender', pat.patient?.gender || '—'],
              ['Blood Type', pat.patient?.bloodType || '—'],
              ['City', pat.patient?.city || '—'],
              ['Allergies', pat.patient?.allergies || 'None'],
              ['Conditions', pat.patient?.conditions || 'None'],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase">{k}</p>
                <p className="font-bold text-gray-700 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <PageTitle icon="👥">Patients ({patients.length})</PageTitle>
        <button
          onClick={() => exportPatientsExcel(patients)}
          disabled={!patients.length}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-full transition-all"
        >
          <Download size={12} /> Download Excel
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
          className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500" />
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !filtered.length ? <EmptyState icon="👥" title="No patients found" /> : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card flex items-center gap-3 cursor-pointer hover:border-primary-300">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl border border-primary-200">👤</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary-950">{p.user?.name}</p>
                <p className="text-xs text-gray-500">{p.user?.email}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">active</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
