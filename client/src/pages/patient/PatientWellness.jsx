import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '@/components/ui'
import { today } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { patientApi } from '@/api'

export default function PatientWellness() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('reminders')

  const TABS = [
    { v: 'reminders', l: '💊 Reminders' },
    { v: 'vacc',      l: '💉 Vaccines'  },
    { v: 'sos',       l: '🆘 SOS'       },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="Wellness" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${tab===t.v?'bg-primary-600 text-white border-primary-600':'bg-white border-gray-200 text-gray-600'}`}>{t.l}</button>
          ))}
        </div>
        {tab === 'reminders' && <RemindersTab />}
        {tab === 'vacc'      && <VaccinationsTab />}
        {tab === 'sos'       && <SOSTab />}
      </div>
    </div>
  )
}

function RemindersTab() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ type:'med', icon:'💊', title:'', time:'08:00', freq:'Daily' })
  const [adding, setAdding] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = () => {
    patientApi.getReminders()
      .then(res => setReminders(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.title) { toast.error('Title required'); return }
    try {
      await patientApi.addReminder(form)
      toast.success('Reminder added')
      setAdding(false)
      setForm({ type:'med', icon:'💊', title:'', time:'08:00', freq:'Daily' })
      load()
    } catch { toast.error('Failed') }
  }

  const toggle = async (id) => {
    try { await patientApi.toggleReminder(id); load() } catch {}
  }

  const del = async (id) => {
    try { await patientApi.deleteReminder(id); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setAdding(!adding)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
        <Plus size={12} /> Add Reminder
      </button>
      {adding && (
        <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-500 font-bold mb-1">TITLE</p>
              <input className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="Reminder title" value={form.title} onChange={set('title')} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold mb-1">TIME</p>
              <input type="time" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs" value={form.time} onChange={set('time')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-[10px] text-gray-500 font-bold mb-1">TYPE</p>
              <select className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs" value={form.type} onChange={set('type')}>
                {['med','diet','exercise','water','other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold mb-1">ICON</p>
              <input className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="💊" value={form.icon} onChange={set('icon')} />
            </div>
          </div>
          <button onClick={add} className="mt-3 w-full py-2 text-xs font-bold bg-primary-600 text-white rounded-xl">Save Reminder</button>
        </div>
      )}
      {loading ? <div className="text-center py-6 text-gray-400">Loading...</div> : !reminders.length ? (
        <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">💊</p><p className="text-sm">No reminders yet</p></div>
      ) : reminders.map(r => (
        <div key={r.id} className={`bg-white border rounded-2xl p-3 flex items-center gap-3 shadow-card ${r.done ? 'opacity-60 border-gray-100' : 'border-primary-100'}`}>
          <span className="text-2xl">{r.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary-950">{r.title}</p>
            <p className="text-xs text-gray-400">{r.time} · {r.freq}</p>
          </div>
          <button onClick={() => toggle(r.id)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${r.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
            {r.done && '✓'}
          </button>
          <button onClick={() => del(r.id)} className="text-gray-300 hover:text-red-400"><Trash2 size={14}/></button>
        </div>
      ))}
    </div>
  )
}

function VaccinationsTab() {
  const [vaccinations, setVaccinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name:'', date:'', status:'done', nextDue:'' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = () => {
    patientApi.getVaccinations()
      .then(res => setVaccinations(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.name) { toast.error('Vaccine name required'); return }
    try {
      await patientApi.addVaccination(form)
      toast.success('Added')
      setAdding(false)
      setForm({ name:'', date:'', status:'done', nextDue:'' })
      load()
    } catch { toast.error('Failed') }
  }

  const STATUS_COLOR = { done:'bg-green-100 text-green-700', due:'bg-red-100 text-red-700', upcoming:'bg-amber-100 text-amber-700' }

  return (
    <div className="space-y-3">
      <button onClick={() => setAdding(!adding)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
        <Plus size={12} /> Add Vaccine
      </button>
      {adding && (
        <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
          <input className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs mb-2" placeholder="Vaccine name" value={form.name} onChange={set('name')} />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="border-2 border-gray-200 rounded-xl px-3 py-2 text-xs" value={form.date} onChange={set('date')} />
            <select className="border-2 border-gray-200 rounded-xl px-3 py-2 text-xs" value={form.status} onChange={set('status')}>
              {['done','due','upcoming'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <input type="date" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs mt-2" placeholder="Next due date" value={form.nextDue} onChange={set('nextDue')} />
          <button onClick={add} className="mt-3 w-full py-2 text-xs font-bold bg-primary-600 text-white rounded-xl">Save</button>
        </div>
      )}
      {loading ? <div className="text-center py-6 text-gray-400">Loading...</div> : !vaccinations.length ? (
        <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">💉</p><p className="text-sm">No vaccinations recorded</p></div>
      ) : vaccinations.map(v => (
        <div key={v.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card flex items-center gap-3">
          <span className="text-2xl">💉</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary-950">{v.name}</p>
            {v.date && <p className="text-xs text-gray-400">Given: {v.date}</p>}
            {v.nextDue && <p className="text-xs text-gray-400">Next: {v.nextDue}</p>}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[v.status]||'bg-gray-100 text-gray-600'}`}>{v.status}</span>
        </div>
      ))}
    </div>
  )
}

function SOSTab() {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
        <p className="text-5xl mb-3">🆘</p>
        <p className="text-base font-black text-red-700 mb-1">Emergency SOS</p>
        <p className="text-xs text-red-500 mb-4">Press in case of medical emergency</p>
        <button className="w-24 h-24 rounded-full bg-red-500 text-white text-sm font-black shadow-lg mx-auto flex items-center justify-center border-4 border-red-300 active:scale-95 transition-transform">
          SOS
        </button>
      </div>
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-bold text-gray-600 mb-3">Emergency Contacts</p>
        {[['🚑 Ambulance','102'],['🚔 Police','100'],['🔥 Fire','101'],['💊 Poison Control','1800-11-6117']].map(([l,n]) => (
          <div key={l} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <p className="text-xs font-bold text-gray-700">{l}</p>
            <a href={`tel:${n}`} className="text-xs font-black text-primary-600">{n}</a>
          </div>
        ))}
      </div>
    </div>
  )
}
