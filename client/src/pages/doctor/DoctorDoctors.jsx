import { useState, useEffect } from 'react'
import { Modal, FormGroup, Input, Select, Button, PageTitle, EmptyState } from '@/components/ui'
import { fmtMoney } from '@/lib/utils'
import { Plus, Edit2, Trash2, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { hospitalApi } from '@/api'

const ICONS = ['👨‍⚕️','👩‍⚕️','🧑‍⚕️']
const BLANK = { name:'',speciality:'',fee:'',exp:'',icon:'👨‍⚕️',slots:'09:00,10:00,11:00,14:00,15:00',availability:'Mon,Tue,Wed,Thu,Fri' }

export default function DoctorDoctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(BLANK)
  const set = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}))

  const load = () => {
    setLoading(true)
    hospitalApi.getDoctors()
      .then(res => setDoctors(res.data?.data || []))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name || !form.speciality) { toast.error('Name and speciality required'); return }
    setSaving(true)
    try {
      const payload = { ...form, fee: parseFloat(form.fee)||0, exp: parseInt(form.exp)||0 }
      if (editing) {
        await hospitalApi.updateDoctor(editing.id, payload)
        toast.success('Updated')
      } else {
        await hospitalApi.addDoctor(payload)
        toast.success('Doctor added')
      }
      setModal(false); setEditing(null); setForm(BLANK); load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Remove this doctor?')) return
    try { await hospitalApi.deleteDoctor(id); toast.success('Removed'); load() }
    catch { toast.error('Failed to remove') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageTitle icon="👨‍⚕️">Doctors ({doctors.length})</PageTitle>
        <button onClick={() => { setEditing(null); setForm(BLANK); setModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> Add Doctor
        </button>
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !doctors.length ? <EmptyState icon="👨‍⚕️" title="No doctors added yet" /> : (
        <div className="space-y-3">
          {doctors.map(d => (
            <div key={d.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl border border-primary-200">{d.icon||'👨‍⚕️'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-primary-950">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.speciality}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {d.fee > 0 && <span className="text-xs font-bold text-primary-700">{fmtMoney(d.fee)}</span>}
                    {d.exp > 0 && <span className="text-xs text-gray-400">{d.exp}y exp</span>}
                    {d.rating > 0 && <div className="flex items-center gap-1"><Star size={10} className="text-amber-400 fill-amber-400"/><span className="text-xs">{d.rating}</span></div>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(d); setForm({name:d.name,speciality:d.speciality||'',fee:String(d.fee||''),exp:String(d.exp||''),icon:d.icon||'👨‍⚕️',slots:(d.slots||[]).map(s=>s.time||s).join(','),availability:d.availability||''}); setModal(true) }}
                    className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center border border-primary-200"><Edit2 size={11}/></button>
                  <button onClick={() => del(d.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center border border-red-200"><Trash2 size={11} className="text-red-500"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={(editing?'✏️ Edit':'👨‍⚕️ Add') + ' Doctor'}>
        <FormGroup label="Full Name *"><Input placeholder="Dr. Name" value={form.name} onChange={set('name')} /></FormGroup>
        <FormGroup label="Speciality *"><Input placeholder="e.g. Cardiologist" value={form.speciality} onChange={set('speciality')} /></FormGroup>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Fee (₹)"><Input type="number" placeholder="500" value={form.fee} onChange={set('fee')} /></FormGroup>
          <FormGroup label="Experience (yrs)"><Input type="number" placeholder="5" value={form.exp} onChange={set('exp')} /></FormGroup>
        </div>
        <FormGroup label="Icon">
          <div className="flex gap-2">{ICONS.map(ic=><button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} className={`text-2xl p-1 rounded-lg border-2 ${form.icon===ic?'border-primary-500':'border-transparent'}`}>{ic}</button>)}</div>
        </FormGroup>
        <FormGroup label="Time Slots (comma-separated)"><Input placeholder="09:00,10:00,11:00" value={form.slots} onChange={set('slots')} /></FormGroup>
        <FormGroup label="Availability (comma-separated)"><Input placeholder="Mon,Tue,Wed" value={form.availability} onChange={set('availability')} /></FormGroup>
        <Button onClick={save} loading={saving}>{editing?'Save Changes':'Add Doctor'}</Button>
      </Modal>
    </div>
  )
}
