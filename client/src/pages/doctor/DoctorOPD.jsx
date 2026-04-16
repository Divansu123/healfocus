import { useState, useEffect } from 'react'
import { Tabs, Modal, FormGroup, Input, Select, Textarea, Button, Badge, PageTitle, EmptyState } from '@/components/ui'
import { today, nowTime } from '@/lib/utils'
import { Plus, Edit2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { hospitalApi } from '@/api'

// ─── Payment options ──────────────────────────────────────────────────────────
const PAYMENT_OPTIONS = ['Cash', 'UPI', 'Credit', 'Others']

// ─── PDF Download per patient ─────────────────────────────────────────────────
function downloadOpdPdf(o) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>OPD Slip - ${o.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; padding: 30px; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #4f46e5; padding-bottom: 14px; margin-bottom: 20px; }
  .hospital-name { font-size: 22px; font-weight: 800; color: #4f46e5; }
  .badge { background: #ede9fe; color: #4f46e5; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 20px; }
  .token { font-size: 32px; font-weight: 900; color: #4f46e5; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6366f1; margin-bottom: 8px; border-bottom: 1px solid #e0e7ff; padding-bottom: 4px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .field { margin-bottom: 8px; }
  .label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-size: 13px; font-weight: 600; color: #111827; margin-top: 2px; }
  .value.big { font-size: 15px; }
  .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="hospital-name">HealFocus OPD</div>
    <div style="color:#6b7280;font-size:12px;margin-top:4px;">OPD Patient Slip</div>
  </div>
  <div style="text-align:right;">
    <div class="token">#${o.tokenNo || '--'}</div>
    <div class="badge">Token Number</div>
  </div>
</div>
<div class="section">
  <div class="section-title">Patient Information</div>
  <div class="grid2">
    <div class="field"><div class="label">Full Name</div><div class="value big">${o.name || '--'}</div></div>
    <div class="field"><div class="label">Phone</div><div class="value">${o.phone || '--'}</div></div>
    <div class="field"><div class="label">Age</div><div class="value">${o.age ? o.age + ' yrs' : '--'}</div></div>
    <div class="field"><div class="label">Gender</div><div class="value">${o.gender || '--'}</div></div>
  </div>
</div>
<div class="section">
  <div class="section-title">Visit Details</div>
  <div class="grid2">
    <div class="field"><div class="label">Visit Date</div><div class="value">${o.visitDate || '--'}</div></div>
    <div class="field"><div class="label">Time</div><div class="value">${o.time || '--'}</div></div>
    <div class="field"><div class="label">Doctor</div><div class="value">${o.doctor?.name || '--'}</div></div>
    <div class="field"><div class="label">Speciality</div><div class="value">${o.doctor?.speciality || '--'}</div></div>
  </div>
</div>
<div class="section">
  <div class="section-title">Vitals</div>
  <div class="grid2">
    <div class="field"><div class="label">Weight</div><div class="value">${o.weight || '--'}</div></div>
    <div class="field"><div class="label">Blood Pressure</div><div class="value">${o.bloodPressure || '--'}</div></div>
    <div class="field"><div class="label">Temperature</div><div class="value">${o.temperature || '--'}</div></div>
    <div class="field"><div class="label">General Appearance</div><div class="value">${o.generalAppearance || '--'}</div></div>
  </div>
</div>
<div class="section">
  <div class="section-title">Clinical Details</div>
  <div class="field"><div class="label">Chief Complaint</div><div class="value">${o.complaint || '--'}</div></div>
  <div style="margin-top:8px;" class="field"><div class="label">Follow-Up Date</div><div class="value">${o.followUpDate || '--'}</div></div>
</div>
<div class="section">
  <div class="section-title">Payment</div>
  <div class="grid2">
    <div class="field"><div class="label">Payment Mode</div><div class="value">${o.paymentMode || '--'}</div></div>
    <div class="field"><div class="label">OPD Fee</div><div class="value">Rs. ${o.opdFee != null ? Number(o.opdFee).toFixed(2) : '--'}</div></div>
  </div>
</div>
<div class="footer">
  <div>Generated on: ${new Date().toLocaleString('en-IN')}</div>
  <div>HealFocus Healthcare Management</div>
</div>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

export default function DoctorOPD() {
  const [opdPatients, setOpdPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('today')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = {
    name: '', age: '', gender: 'Male', phone: '', complaint: '',
    doctorId: '',
    weight: '', bloodPressure: '', temperature: '', generalAppearance: '',
    paymentMode: '', opdFee: '', followUpDate: ''
  }
  const [form, setForm] = useState(emptyForm)
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
      setForm(emptyForm)
      load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const openEdit = (o) => {
    setEditing(o)
    setForm({
      name: o.name,
      age: String(o.age || ''),
      gender: o.gender || 'Male',
      phone: o.phone || '',
      complaint: o.complaint || '',
      doctorId: o.doctorId || '',
      weight: o.weight || '',
      bloodPressure: o.bloodPressure || '',
      temperature: o.temperature || '',
      generalAppearance: o.generalAppearance || '',
      paymentMode: o.paymentMode || '',
      opdFee: o.opdFee != null ? String(o.opdFee) : '',
      followUpDate: o.followUpDate || ''
    })
    setModal(true)
  }

  const vitalsBadge = (o) => {
    const parts = []
    if (o.weight) parts.push(`Wt: ${o.weight}`)
    if (o.bloodPressure) parts.push(`BP: ${o.bloodPressure}`)
    if (o.temperature) parts.push(`Temp: ${o.temperature}`)
    if (o.generalAppearance) parts.push(`GA: ${o.generalAppearance}`)
    return parts.join(' · ')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <PageTitle icon="🏃">OPD Management</PageTitle>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setModal(true) }}
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
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {vitalsBadge(o) && <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">💊 {vitalsBadge(o)}</span>}
                    {o.paymentMode && <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">💳 {o.paymentMode}</span>}
                    {(o.opdFee != null && o.opdFee !== '') && <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">₹{o.opdFee}</span>}
                    {o.followUpDate && <span className="text-[10px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full">📅 {o.followUpDate}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <button onClick={() => openEdit(o)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold border border-primary-200 text-primary-600 rounded-lg"><Edit2 size={11}/> Edit</button>
                <button onClick={() => downloadOpdPdf(o)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all">
                  <FileText size={11}/> Download PDF
                </button>
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

        <div className="my-2">
          <p className="text-xs font-bold text-primary-700 uppercase tracking-wide mb-2 border-b border-primary-100 pb-1">🩺 Vitals</p>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Weight">
              <Input placeholder="e.g. 70 kg" value={form.weight} onChange={set('weight')} />
            </FormGroup>
            <FormGroup label="Blood Pressure (B.P.)">
              <Input placeholder="e.g. 120/80 mmHg" value={form.bloodPressure} onChange={set('bloodPressure')} />
            </FormGroup>
            <FormGroup label="Temperature">
              <Input placeholder="e.g. 98.6 °F" value={form.temperature} onChange={set('temperature')} />
            </FormGroup>
            <FormGroup label="General Appearance">
              <Input placeholder="e.g. Well-nourished" value={form.generalAppearance} onChange={set('generalAppearance')} />
            </FormGroup>
          </div>
        </div>

        <FormGroup label="Payment Mode">
          <Select value={form.paymentMode} onChange={set('paymentMode')}>
            <option value="">Select Payment Mode</option>
            {PAYMENT_OPTIONS.map(p=><option key={p}>{p}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="OPD Fee (₹)"><Input type="number" placeholder="500" value={form.opdFee} onChange={set('opdFee')} /></FormGroup>
        <FormGroup label="Follow-Up Date"><Input type="date" value={form.followUpDate} onChange={set('followUpDate')} /></FormGroup>
        <Button onClick={save} loading={saving}>{editing?'Save Changes':'Add Patient'}</Button>
      </Modal>
    </div>
  )
}
