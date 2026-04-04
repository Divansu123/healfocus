import { useState, useEffect } from 'react'
import { Modal, FormGroup, Input, Button, PageTitle, EmptyState } from '@/components/ui'
import { Star, Plus, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/api'

export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'',city:'',address:'',beds:'',phone:'',email:'' })
  const set = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}))

  const load = () => {
    setLoading(true)
    adminApi.getHospitals()
      .then(res => setHospitals(res.data?.data || []))
      .catch(() => toast.error('Failed to load hospitals'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = hospitals.filter(h => !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase()))

  const toggleStatus = async (h) => {
    try {
      await adminApi.updateHospitalStatus(h.id, { status: h.status === 'active' ? 'suspended' : 'active' })
      toast.success('Status updated')
      load()
    } catch { toast.error('Failed to update status') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageTitle icon="🏥">Hospitals ({hospitals.length})</PageTitle>
      </div>
      <div className="relative mb-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search hospitals..."
          className="w-full pl-4 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500" />
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !filtered.length ? <EmptyState icon="🏥" title="No hospitals found" /> : (
        <div className="space-y-3">
          {filtered.map(h => (
            <div key={h.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl flex-shrink-0 border border-primary-200">🏥</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-primary-950">{h.name}</p>
                      <p className="text-xs text-gray-500">{h.city} · {h.beds || '—'} beds</p>
                      <p className="text-xs text-gray-400">{h.address}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${h.status==='active'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{h.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {h.rating > 0 && <div className="flex items-center gap-1"><Star size={10} className="text-amber-400 fill-amber-400"/><span className="text-xs">{h.rating}</span></div>}
                    <span className="text-xs text-gray-400">{h.phone}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => toggleStatus(h)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${h.status==='active'?'border-red-200 text-red-600 bg-red-50':'border-green-200 text-green-600 bg-green-50'}`}>
                      {h.status==='active'?'Suspend':'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
