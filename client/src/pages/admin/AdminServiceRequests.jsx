import { useState, useEffect } from 'react'
import { Tabs, Badge, PageTitle, EmptyState, Modal, FormGroup, Input, Button } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { adminApi } from '@/api'

export default function AdminServiceRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [noteModal, setNoteModal] = useState(null)
  const [note, setNote] = useState('')

  const TABS = [
    { id:'all',       label:'All' },
    { id:'pending',   label:'Pending' },
    { id:'reviewing', label:'Reviewing' },
    { id:'resolved',  label:'Resolved' },
  ]
  const PRIORITY = { high:'bg-red-100 text-red-700', medium:'bg-amber-100 text-amber-700', low:'bg-green-100 text-green-700' }

  const load = () => {
    setLoading(true)
    adminApi.getAllServiceRequests()
      .then(res => setRequests(res.data?.data || []))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = tab === 'all' ? requests : requests.filter(r => r.status === tab)

  const update = async (id, data) => {
    try {
      await adminApi.updateServiceRequest(id, data)
      toast.success('Updated')
      setNoteModal(null); setNote('')
      load()
    } catch { toast.error('Failed to update') }
  }

  return (
    <div>
      <PageTitle icon="🔧">Service Requests</PageTitle>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !filtered.length ? <EmptyState icon="🔧" title="No requests" /> : (
        <div className="space-y-3 mt-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-black text-primary-950">{r.title}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY[r.priority]||'bg-gray-100 text-gray-600'}`}>{r.priority}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{r.hospital?.name || '—'} · {r.category}</p>
              <p className="text-xs text-gray-600">{r.description}</p>
              {r.adminNotes && <p className="text-xs text-primary-700 bg-primary-50 rounded-lg p-2 mt-2">📝 {r.adminNotes}</p>}
              <p className="text-[10px] text-gray-400 mt-2">{fmtDate(r.createdAt)}</p>
              <div className="flex gap-2 mt-2">
                {r.status === 'pending' && <button onClick={() => update(r.id, { status:'reviewing' })} className="px-3 py-1 text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200 rounded-lg">Review</button>}
                {r.status !== 'resolved' && <button onClick={() => update(r.id, { status:'resolved' })} className="px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-lg">Resolve</button>}
                <button onClick={() => { setNoteModal(r); setNote(r.adminNotes||'') }} className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded-lg">Add Note</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!noteModal} onClose={() => setNoteModal(null)} title="Add Admin Note">
        <FormGroup label="Note"><Input placeholder="Your note..." value={note} onChange={e=>setNote(e.target.value)} /></FormGroup>
        <Button onClick={() => update(noteModal.id, { adminNotes: note })}>Save Note</Button>
      </Modal>
    </div>
  )
}
