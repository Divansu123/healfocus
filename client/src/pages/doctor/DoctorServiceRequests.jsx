import { useState, useEffect } from 'react'
import { Modal, FormGroup, Input, Select, Textarea, Button, Badge, PageTitle, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { hospitalApi } from '@/api'

export default function DoctorServiceRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ category:'equipment',title:'',description:'',priority:'medium' })
  const set = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}))

  const PRIORITY_COLORS = { high:'bg-red-100 text-red-700', medium:'bg-amber-100 text-amber-700', low:'bg-green-100 text-green-700' }

  const load = () => {
    setLoading(true)
    hospitalApi.getServiceRequests()
      .then(res => setRequests(res.data?.data || []))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title || !form.category) { toast.error('Title and category required'); return }
    setSaving(true)
    try {
      await hospitalApi.addServiceRequest(form)
      toast.success('Request submitted')
      setModal(false)
      setForm({ category:'equipment',title:'',description:'',priority:'medium' })
      load()
    } catch { toast.error('Failed to submit') } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageTitle icon="🔧">Service Requests</PageTitle>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> New Request
        </button>
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !requests.length ? <EmptyState icon="🔧" title="No service requests" /> : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-black text-primary-950">{r.title}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[r.priority]||'bg-gray-100 text-gray-600'}`}>{r.priority}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{r.category}</p>
              <p className="text-xs text-gray-600">{r.description}</p>
              {r.adminNotes && <p className="text-xs text-primary-700 bg-primary-50 rounded-lg p-2 mt-2">📝 Admin: {r.adminNotes}</p>}
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-gray-400">{fmtDate(r.createdAt)}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status==='resolved'?'bg-green-100 text-green-700':r.status==='reviewing'?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'}`}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="🔧 New Service Request">
        <FormGroup label="Category">
          <Select value={form.category} onChange={set('category')}>
            {['equipment','marketing','claim','staffing','infrastructure','other'].map(c=><option key={c}>{c}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Title *"><Input placeholder="Brief title" value={form.title} onChange={set('title')} /></FormGroup>
        <FormGroup label="Description"><Textarea placeholder="Details of your request..." value={form.description} onChange={set('description')} /></FormGroup>
        <FormGroup label="Priority">
          <Select value={form.priority} onChange={set('priority')}>{['low','medium','high'].map(p=><option key={p}>{p}</option>)}</Select>
        </FormGroup>
        <Button onClick={save} loading={saving}>Submit Request</Button>
      </Modal>
    </div>
  )
}
