import { useState, useEffect } from 'react'
import { PageTitle, EmptyState } from '@/components/ui'
import { Search } from 'lucide-react'
import { hospitalApi } from '@/api'
import toast from 'react-hot-toast'

export default function DoctorPatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    hospitalApi.getPatients()
      .then(res => setPatients(res.data?.data || []))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p =>
    !search || p.user?.name?.toLowerCase().includes(search.toLowerCase()) || p.user?.phone?.includes(search)
  )

  return (
    <div>
      <PageTitle icon="👥">Patient Records</PageTitle>
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
          className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500" />
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !filtered.length ? <EmptyState icon="👥" title="No patients found" /> : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl border border-primary-200">👤</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary-950">{p.user?.name || '—'}</p>
                  <p className="text-xs text-gray-500">{p.user?.email}</p>
                  <div className="flex gap-2 mt-1">
                    {p.age && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{p.age}y</span>}
                    {p.bloodType && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{p.bloodType}</span>}
                    {p.city && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{p.city}</span>}
                  </div>
                </div>
              </div>
              {p.conditions && p.conditions !== 'None' && (
                <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">Conditions: {p.conditions}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
