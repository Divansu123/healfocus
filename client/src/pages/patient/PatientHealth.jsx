import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TopBar, Tabs, FormGroup, Input, Select, Alert, Button } from '@/components/ui'
import { bsStatus, bpStatus, fmtDate, today, nowTime } from '@/lib/utils'
import { Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import toast from 'react-hot-toast'
import { patientApi } from '@/api'

// ── Mini Bar Chart (last 7 readings) ──────────────────────────────────────────
function MiniBarChart({ readings, valueKey, colorFn, unit, maxBars = 7 }) {
  const recent = [...readings].slice(0, maxBars).reverse()
  if (!recent.length) return null
  const vals = recent.map(r => r[valueKey] || 0)
  const maxV  = Math.max(...vals) || 1
  return (
    <div className="flex items-end gap-1.5 h-12 mt-3">
      {recent.map((r, i) => {
        const pct = Math.max(10, Math.round((vals[i] / maxV) * 100))
        const clr = colorFn ? colorFn(vals[i]) : '#6366f1'
        return (
          <div key={r.id || i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[7px] text-gray-400 font-bold leading-none">{vals[i]}</span>
            <div className="w-full rounded-t-sm min-h-1 transition-all duration-700"
              style={{ height: `${Math.round(pct * 0.36)}px`, background: clr, opacity: 0.8 }} />
          </div>
        )
      })}
    </div>
  )
}

// ── Trend indicator ────────────────────────────────────────────────────────────
function TrendBadge({ readings, valueKey }) {
  if (readings.length < 2) return null
  const latest = readings[0]?.[valueKey]
  const prev   = readings[1]?.[valueKey]
  if (!latest || !prev) return null
  const diff = latest - prev
  if (Math.abs(diff) < 1) return <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-bold"><Minus size={9}/> Stable</span>
  if (diff > 0) return <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-bold"><TrendingUp size={9}/> +{Math.abs(diff).toFixed(0)}</span>
  return <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-bold"><TrendingDown size={9}/> -{Math.abs(diff).toFixed(0)}</span>
}

// ── Blood Sugar Tab ────────────────────────────────────────────────────────────
function BloodSugar() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState({ value: '', type: 'fasting', date: today(), time: nowTime(), notes: '' })
  const [saving, setSaving]     = useState(false)
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
      setForm({ value: '', type: 'fasting', date: today(), time: nowTime(), notes: '' })
      load()
    } catch { toast.error('Failed to add') } finally { setSaving(false) }
  }

  const del = async (id) => {
    try { await patientApi.deleteBloodSugar(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const last   = readings[0]
  const status = last ? bsStatus(last.value, last.type) : null
  const bsColor = (v) => v < 70 ? '#ef4444' : v <= 99 ? '#22c55e' : v <= 125 ? '#f59e0b' : v <= 199 ? '#ef4444' : '#dc2626'

  // 7-day average
  const last7 = readings.slice(0, 7)
  const avg7   = last7.length ? Math.round(last7.reduce((s, r) => s + r.value, 0) / last7.length) : null

  return (
    <div className="space-y-4">
      {/* Status card */}
      {last && (
        <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Latest Reading</p>
              <p className="text-4xl font-black" style={{ color: bsColor(last.value) }}>{last.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">mg/dL · {last.type} · {fmtDate(last.date)} {last.time}</p>
              <span className={`inline-block mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-full ${
                status?.label === 'Normal' ? 'bg-green-100 text-green-700' :
                status?.label === 'Critical' ? 'bg-red-200 text-red-800 animate-pulse' :
                status?.label?.includes('High') || status?.label === 'Pre-diabetic' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>{status?.label}</span>
            </div>
            <div className="text-right">
              <TrendBadge readings={readings} valueKey="value" />
              {avg7 && (
                <div className="mt-1">
                  <p className="text-[9px] text-gray-400">7-day avg</p>
                  <p className="text-sm font-black" style={{ color: bsColor(avg7) }}>{avg7}</p>
                </div>
              )}
            </div>
          </div>
          {/* Mini chart */}
          <MiniBarChart readings={readings} valueKey="value" colorFn={bsColor} unit="mg/dL" />
          <p className="text-[9px] text-gray-400 mt-1">Last {Math.min(7, readings.length)} readings</p>
        </div>
      )}

      {/* Add reading form */}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-bold text-gray-600 mb-3">Add Reading</p>
        <form onSubmit={add}>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Value (mg/dL)">
              <Input type="number" placeholder="120" value={form.value} onChange={set('value')} required />
            </FormGroup>
            <FormGroup label="Type">
              <Select value={form.type} onChange={set('type')}>
                {['fasting', 'post-meal', 'random'].map(t => <option key={t}>{t}</option>)}
              </Select>
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Date"><Input type="date" value={form.date} onChange={set('date')} /></FormGroup>
            <FormGroup label="Time"><Input type="time" value={form.time} onChange={set('time')} /></FormGroup>
          </div>
          <FormGroup label="Notes">
            <Input placeholder="Optional notes" value={form.notes} onChange={set('notes')} />
          </FormGroup>
          {/* Normal range reference */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 mb-3 text-[10px] text-blue-700 leading-relaxed">
            🔵 <strong>Normal:</strong> Fasting 70–99 · Post-meal &lt;140 · Random &lt;200 mg/dL
          </div>
          <Button type="submit" loading={saving}>Add Reading</Button>
        </form>
      </div>

      {/* Readings list */}
      {loading ? (
        <div className="text-center py-6 text-gray-400">Loading...</div>
      ) : !readings.length ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">🩸</p>
          <p className="text-sm font-bold">No readings yet</p>
          <p className="text-xs mt-1">Add your first blood sugar reading above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {readings.map(r => {
            const s = bsStatus(r.value)
            return (
              <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-3 flex items-center gap-3 shadow-card">
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: bsColor(r.value) }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-primary-950">
                    {r.value} <span className="text-[10px] font-bold text-gray-400 ml-1">mg/dL</span>
                    <span className="text-[10px] font-bold text-gray-400 ml-1">{r.type}</span>
                  </p>
                  <p className="text-xs text-gray-400">{fmtDate(r.date)} · {r.time}</p>
                  {r.notes && <p className="text-[10px] text-gray-400">{r.notes}</p>}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: bsColor(r.value) + '22', color: bsColor(r.value) }}>
                  {s?.label}
                </span>
                <button onClick={() => del(r.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Blood Pressure Tab ─────────────────────────────────────────────────────────
function BloodPressure() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState({ systolic: '', diastolic: '', pulse: '', date: today(), time: nowTime(), notes: '' })
  const [saving, setSaving]     = useState(false)
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
      await patientApi.addBloodPressure({
        ...form,
        systolic:  parseInt(form.systolic),
        diastolic: parseInt(form.diastolic),
        pulse:     parseInt(form.pulse) || undefined,
      })
      toast.success('Reading added')
      setForm({ systolic: '', diastolic: '', pulse: '', date: today(), time: nowTime(), notes: '' })
      load()
    } catch { toast.error('Failed to add') } finally { setSaving(false) }
  }

  const del = async (id) => {
    try { await patientApi.deleteBloodPressure(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const last   = readings[0]
  const status = last ? bpStatus(last.systolic, last.diastolic) : null
  const bpColor = (s) => !s ? '#94a3b8' : s >= 140 ? '#ef4444' : s >= 130 ? '#f59e0b' : '#22c55e'

  const last7   = readings.slice(0, 7)
  const avgSys  = last7.length ? Math.round(last7.reduce((s, r) => s + r.systolic, 0) / last7.length) : null
  const avgDia  = last7.length ? Math.round(last7.reduce((s, r) => s + r.diastolic, 0) / last7.length) : null

  return (
    <div className="space-y-4">
      {/* Status card */}
      {last && (
        <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Latest Reading</p>
              <p className="text-4xl font-black" style={{ color: bpColor(last.systolic) }}>
                {last.systolic}/{last.diastolic}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                mmHg{last.pulse ? ` · Pulse: ${last.pulse} bpm` : ''} · {fmtDate(last.date)}
              </p>
              <span className={`inline-block mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-full ${
                status?.label === 'Normal'  ? 'bg-green-100 text-green-700' :
                status?.label === 'Crisis'  ? 'bg-red-200 text-red-800 animate-pulse' :
                status?.label?.includes('High') ? 'bg-red-100 text-red-700' :
                status?.label === 'Elevated' ? 'bg-amber-100 text-amber-700' :
                'bg-amber-100 text-amber-700'
              }`}>{status?.label}</span>
            </div>
            <div className="text-right">
              <TrendBadge readings={readings} valueKey="systolic" />
              {avgSys && avgDia && (
                <div className="mt-1">
                  <p className="text-[9px] text-gray-400">7-day avg</p>
                  <p className="text-sm font-black" style={{ color: bpColor(avgSys) }}>{avgSys}/{avgDia}</p>
                </div>
              )}
            </div>
          </div>
          {/* Systolic mini chart */}
          <MiniBarChart readings={readings} valueKey="systolic" colorFn={bpColor} />
          <p className="text-[9px] text-gray-400 mt-1">Systolic — last {Math.min(7, readings.length)} readings</p>
        </div>
      )}

      {/* Add form */}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-bold text-gray-600 mb-3">Add Reading</p>
        <form onSubmit={add}>
          <div className="grid grid-cols-3 gap-2">
            <FormGroup label="Systolic">
              <Input type="number" placeholder="120" value={form.systolic} onChange={set('systolic')} required />
            </FormGroup>
            <FormGroup label="Diastolic">
              <Input type="number" placeholder="80" value={form.diastolic} onChange={set('diastolic')} required />
            </FormGroup>
            <FormGroup label="Pulse">
              <Input type="number" placeholder="72" value={form.pulse} onChange={set('pulse')} />
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Date"><Input type="date" value={form.date} onChange={set('date')} /></FormGroup>
            <FormGroup label="Time"><Input type="time" value={form.time} onChange={set('time')} /></FormGroup>
          </div>
          <FormGroup label="Notes">
            <Input placeholder="Optional notes" value={form.notes} onChange={set('notes')} />
          </FormGroup>
          {/* Reference ranges */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 mb-3 text-[10px] text-blue-700 leading-relaxed">
            🔵 <strong>Normal:</strong> &lt;120/80 · <strong>Elevated:</strong> 120-129/&lt;80 · <strong>High:</strong> ≥130/80 mmHg
          </div>
          <Button type="submit" loading={saving}>Add Reading</Button>
        </form>
      </div>

      {/* Readings list */}
      {loading ? (
        <div className="text-center py-6 text-gray-400">Loading...</div>
      ) : !readings.length ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">💓</p>
          <p className="text-sm font-bold">No readings yet</p>
          <p className="text-xs mt-1">Add your first blood pressure reading above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {readings.map(r => {
            const s = bpStatus(r.systolic, r.diastolic)
            return (
              <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-3 flex items-center gap-3 shadow-card">
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: bpColor(r.systolic) }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-primary-950">
                    {r.systolic}/{r.diastolic} <span className="text-[10px] font-bold text-gray-400">mmHg</span>
                    {r.pulse && <span className="text-[10px] font-bold text-gray-400 ml-1">· {r.pulse} bpm</span>}
                  </p>
                  <p className="text-xs text-gray-400">{fmtDate(r.date)} · {r.time}</p>
                  {r.notes && <p className="text-[10px] text-gray-400">{r.notes}</p>}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: bpColor(r.systolic) + '22', color: bpColor(r.systolic) }}>
                  {s?.label}
                </span>
                <button onClick={() => del(r.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PatientHealth() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab]  = useState(searchParams.get('tab') === 'bp' ? 'bp' : 'bs')

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="Health Tracker" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 lg:px-0 lg:pt-0">
        <Tabs
          tabs={[{ id: 'bs', label: '🩸 Blood Sugar' }, { id: 'bp', label: '💓 Blood Pressure' }]}
          active={tab}
          onChange={setTab}
        />
        <div className="mt-4">
          {tab === 'bs' ? <BloodSugar /> : <BloodPressure />}
        </div>
      </div>
    </div>
  )
}
