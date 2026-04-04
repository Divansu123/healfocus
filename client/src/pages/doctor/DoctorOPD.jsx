import { useState, useEffect } from 'react'
import { Tabs, Modal, FormGroup, Input, Select, Textarea, Button, Badge, PageTitle, EmptyState } from '@/components/ui'
import { today, nowTime } from '@/lib/utils'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { hospitalApi } from '@/api'

export default function DoctorOPD() {
  const [opdPatients, setOpdPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('today')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'',age:'',gender:'Male',phone:'',complaint:'',doctorId:'',status:'waiting' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = () => {
    setLoading(true)
    Promise.all([hospitalApi.getOpdPatients(), hospitalApi.getDoctors()])
      .then(([opdRes, docRes]) => {
        setOpdPatients(opdRes.data?.data || [])
        setDoctors(docRes.data?.data || [])
      })
      .catch(() => toast.error('Failed to load OPD'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const todayStr = today()
  const filtered = opdPatients.filter(o => {
    const matchDate = tab === 'today' ? o.visitDate === todayStr : o.visitDate !== todayStr
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.phone?.includes(search)
    return matchDate && matchSearch
  })

  const save = async () => {
    if (!form.name) { toast.error('Patient name required'); return }
    setSaving(true)
    try {
      if (editing) {
        await hospitalApi.updateOpdPatient(editing.id, form)
        toast.success('Updated')
      } else {
        await hospitalApi.addOpdPatient({ ...form, visitDate: todayStr, time: nowTime(), tokenNo: opdPatients.length + 1 })
        toast.success('Patient added')
      }
      setModal(false); setEditing(null)
      setForm({ name:'',age:'',gender:'Male',phone:'',complaint:'',doctorId:'',status:'waiting' })
      load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const STATUS_COLOR = { waiting:'bg-amber-100 text-amber-700', 'in-progress':'bg-blue-100 text-blue-700', completed:'bg-green-100 text-green-700' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageTitle icon="🏃">OPD Management</PageTitle>
        <button onClick={() => { setEditing(null); setForm({ name:'',age:'',gender:'Male',phone:'',complaint:'',doctorId:'',status:'waiting' }); setModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> Add Patient
        </button>
      </div>
      <Tabs tabs={[{id:'today',label:"Today's OPD"},{id:'past',label:'Past'}]} active={tab} onChange={setTab} />
      <div className="relative my-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patients..."
          className="w-full pl-4 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500" />
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !filtered.length ? <EmptyState icon="🏃" title="No OPD patients" /> : (
        <div className="space-y-3">
          {filtered.map(o => (
            <div key={o.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm font-black text-primary-950">#{o.tokenNo} · {o.name}</p>
                  <p className="text-xs text-gray-500">{o.age}y · {o.gender} · {o.phone}</p>
                  {o.complaint && <p className="text-xs text-gray-600 mt-0.5">{o.complaint}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]||'bg-gray-100 text-gray-600'}`}>{o.status}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setEditing(o); setForm({name:o.name,age:String(o.age||''),gender:o.gender||'Male',phone:o.phone||'',complaint:o.complaint||'',doctorId:o.doctorId||'',status:o.status}); setModal(true) }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold border border-primary-200 text-primary-600 rounded-lg"><Edit2 size={11}/> Edit</button>
                {o.status === 'waiting' && <button onClick={async () => { await hospitalApi.updateOpdPatient(o.id, { status:'in-progress' }); load() }} className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg">In Progress</button>}
                {o.status === 'in-progress' && <button onClick={async () => { await hospitalApi.updateOpdPatient(o.id, { status:'completed' }); load() }} className="px-2.5 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-lg">Done</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={(editing?'✏️ Edit':'➕ Add') + ' OPD Patient'}>
        <FormGroup label="Patient Name *"><Input placeholder="Full name" value={form.name} onChange={set('name')} /></FormGroup>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Age"><Input type="number" placeholder="25" value={form.age} onChange={set('age')} /></FormGroup>
          <FormGroup label="Gender"><Select value={form.gender} onChange={set('gender')}>{['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}</Select></FormGroup>
        </div>
        <FormGroup label="Phone"><Input placeholder="+91..." value={form.phone} onChange={set('phone')} /></FormGroup>
        <FormGroup label="Doctor">
          <Select value={form.doctorId} onChange={set('doctorId')}>
            <option value="">Select Doctor</option>
            {doctors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Complaint"><Textarea placeholder="Chief complaint..." value={form.complaint} onChange={set('complaint')} /></FormGroup>
        <FormGroup label="Status">
          <Select value={form.status} onChange={set('status')}>{['waiting','in-progress','completed'].map(s=><option key={s}>{s}</option>)}</Select>
        </FormGroup>
        <Button onClick={save} loading={saving}>{editing?'Save Changes':'Add Patient'}</Button>
      </Modal>
    </div>
  )
}
