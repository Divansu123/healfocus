import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TopBar, Tabs, FormGroup, Input, Select, Alert, Button } from '@/components/ui'
import { bsStatus, bpStatus, fmtDate, today, nowTime } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { patientApi } from '@/api'

function BloodSugar() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ value:'', type:'fasting', date: today(), time: nowTime(), notes:'' })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = () => {
    patientApi.getBloodSugar()
      .then(res => setReadings(res.data?.data || []))
      .catch(() => toast.error('Failed to load readings'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    if (!form.value) { toast.error('Value required'); return }
    setSaving(true)
    try {
      await patientApi.addBloodSugar({ ...form, value: parseFloat(form.value) })
      toast.success('Reading added')
      setForm({ value:'', type:'fasting', date: today(), time: nowTime(), notes:'' })
      load()
    } catch { toast.error('Failed to add') } finally { setSaving(false) }
  }

  const del = async (id) => {
    try { await patientApi.deleteBloodSugar(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const last = readings[0]
  const status = last ? bsStatus(last.value, last.type) : null

  return (
    <div className="space-y-4">
      {last && (
        <Alert type={status?.color?.includes('red') ? 'danger' : status?.color?.includes('amber') ? 'warning' : 'success'}>
          <p className="text-xs font-bold">{status?.label}</p>
          <p className="text-2xl font-black">{last.value} <span className="text-sm font-bold">mg/dL</span></p>
          <p className="text-xs opacity-70">{last.type} · {fmtDate(last.date)} {last.time}</p>
        </Alert>
      )}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-bold text-gray-600 mb-3">Add Reading</p>
        <form onSubmit={add}>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Value (mg/dL)"><Input type="number" placeholder="120" value={form.value} onChange={set('value')} required /></FormGroup>
            <FormGroup label="Type"><Select value={form.type} onChange={set('type')}>{['fasting','post-meal','random'].map(t=><option key={t}>{t}</option>)}</Select></FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Date"><Input type="date" value={form.date} onChange={set('date')} /></FormGroup>
            <FormGroup label="Time"><Input type="time" value={form.time} onChange={set('time')} /></FormGroup>
          </div>
          <FormGroup label="Notes"><Input placeholder="Optional notes" value={form.notes} onChange={set('notes')} /></FormGroup>
          <Button type="submit" loading={saving}>Add Reading</Button>
        </form>
      </div>
      {loading ? <div className="text-center py-6 text-gray-400">Loading...</div> : (
        <div className="space-y-2">
          {readings.map(r => {
            const s = bsStatus(r.value)
            return (
              <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-3 flex items-center gap-3 shadow-card">
                <div className={`w-2 h-10 rounded-full flex-shrink-0`} style={{ background: s?.dot || '#22c55e' }} />
                <div className="flex-1">
                  <p className="text-sm font-black text-primary-950">{r.value} mg/dL <span className="text-[10px] font-bold text-gray-400">{r.type}</span></p>
                  <p className="text-xs text-gray-400">{fmtDate(r.date)} · {r.time}</p>
                  {r.notes && <p className="text-[10px] text-gray-400">{r.notes}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s?.color || ''}`} style={{ background: s?.bg }}>{s?.label}</span>
                <button onClick={() => del(r.id)} className="p-1 text-gray-300 hover:text-red-400"><Trash2 size={14}/></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BloodPressure() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ systolic:'', diastolic:'', pulse:'', date: today(), time: nowTime(), notes:'' })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = () => {
    patientApi.getBloodPressure()
      .then(res => setReadings(res.data?.data || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    if (!form.systolic || !form.diastolic) { toast.error('Systolic and diastolic required'); return }
    setSaving(true)
    try {
      await patientApi.addBloodPressure({ ...form, systolic: parseInt(form.systolic), diastolic: parseInt(form.diastolic), pulse: parseInt(form.pulse) || undefined })
      toast.success('Reading added')
      setForm({ systolic:'', diastolic:'', pulse:'', date: today(), time: nowTime(), notes:'' })
      load()
    } catch { toast.error('Failed to add') } finally { setSaving(false) }
  }

  const del = async (id) => {
    try { await patientApi.deleteBloodPressure(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const last = readings[0]
  const status = last ? bpStatus(last.systolic, last.diastolic) : null

  return (
    <div className="space-y-4">
      {last && (
        <Alert type={status?.color?.includes('red') ? 'danger' : status?.color?.includes('amber') ? 'warning' : 'success'}>
          <p className="text-xs font-bold">{status?.label}</p>
          <p className="text-2xl font-black">{last.systolic}/{last.diastolic} <span className="text-sm font-bold">mmHg</span></p>
          {last.pulse && <p className="text-xs opacity-70">Pulse: {last.pulse} bpm · {fmtDate(last.date)}</p>}
        </Alert>
      )}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-bold text-gray-600 mb-3">Add Reading</p>
        <form onSubmit={add}>
          <div className="grid grid-cols-3 gap-2">
            <FormGroup label="Systolic"><Input type="number" placeholder="120" value={form.systolic} onChange={set('systolic')} required /></FormGroup>
            <FormGroup label="Diastolic"><Input type="number" placeholder="80" value={form.diastolic} onChange={set('diastolic')} required /></FormGroup>
            <FormGroup label="Pulse"><Input type="number" placeholder="72" value={form.pulse} onChange={set('pulse')} /></FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Date"><Input type="date" value={form.date} onChange={set('date')} /></FormGroup>
            <FormGroup label="Time"><Input type="time" value={form.time} onChange={set('time')} /></FormGroup>
          </div>
          <FormGroup label="Notes"><Input placeholder="Optional notes" value={form.notes} onChange={set('notes')} /></FormGroup>
          <Button type="submit" loading={saving}>Add Reading</Button>
        </form>
      </div>
      {loading ? <div className="text-center py-6 text-gray-400">Loading...</div> : (
        <div className="space-y-2">
          {readings.map(r => {
            const s = bpStatus(r.systolic, r.diastolic)
            return (
              <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-3 flex items-center gap-3 shadow-card">
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: s?.dot || '#22c55e' }} />
                <div className="flex-1">
                  <p className="text-sm font-black text-primary-950">{r.systolic}/{r.diastolic} mmHg</p>
                  <p className="text-xs text-gray-400">{r.pulse ? `Pulse: ${r.pulse} · ` : ''}{fmtDate(r.date)} · {r.time}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s?.color || ''}`} style={{ background: s?.bg }}>{s?.label}</span>
                <button onClick={() => del(r.id)} className="p-1 text-gray-300 hover:text-red-400"><Trash2 size={14}/></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PatientHealth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'bp' ? 'bp' : 'bs')

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="Health Tracker" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 lg:px-0 lg:pt-0">
        <Tabs tabs={[{ id: 'bs', label: '🩸 Blood Sugar' }, { id: 'bp', label: '💓 Blood Pressure' }]} active={tab} onChange={setTab} />
        <div className="mt-4">
          {tab === 'bs' ? <BloodSugar /> : <BloodPressure />}
        </div>
      </div>
    </div>
  )
}
