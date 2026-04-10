import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '@/components/ui'
import { today } from '@/lib/utils'
import { Plus, Trash2, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { patientApi } from '@/api'
import { useAuthStore } from '@/store/authStore'

const TABS = [
  { v: 'reminders', l: '⏰ Reminders'  },
  { v: 'vacc',      l: '💉 Vaccines'   },
  { v: 'sos',       l: '🆘 SOS'        },
  { v: 'qr',        l: '🪪 Emergency Card' },
  { v: 'cost',      l: '💰 Cost AI'    },
  { v: 'bill',      l: '🧾 Bill AI'    },
  { v: 'wellness',  l: '🧘 Yoga'       },
]

export default function PatientWellness() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('reminders')

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="Wellness & Tools" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${tab===t.v?'bg-primary-600 text-white border-primary-600':'bg-white border-gray-200 text-gray-600'}`}>
              {t.l}
            </button>
          ))}
        </div>
        {tab === 'reminders' && <RemindersTab />}
        {tab === 'vacc'      && <VaccinationsTab />}
        {tab === 'sos'       && <SOSTab />}
        {tab === 'qr'        && <QRCardTab />}
        {tab === 'cost'      && <CostEstimatorTab />}
        {tab === 'bill'      && <BillAnalyzerTab />}
        {tab === 'wellness'  && <YogaTab />}
      </div>
    </div>
  )
}

// ── REMINDERS TAB ──────────────────────────────────────────────────────────────
function RemindersTab() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [adding, setAdding]       = useState(false)
  const [form, setForm]           = useState({ type:'med', icon:'💊', title:'', time:'08:00', freq:'Daily' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const todayDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]

  const TYPE_ICONS = { med:'💊', diet:'🥗', exercise:'🏃', water:'💧', other:'⏰' }
  const TYPE_COLORS = {
    med:      'border-blue-200 bg-blue-50',
    diet:     'border-green-200 bg-green-50',
    exercise: 'border-orange-200 bg-orange-50',
    water:    'border-cyan-200 bg-cyan-50',
    other:    'border-gray-200 bg-gray-50',
  }

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
      await patientApi.addReminder({ ...form, icon: TYPE_ICONS[form.type] || '⏰' })
      toast.success('Reminder added')
      setAdding(false)
      setForm({ type:'med', icon:'💊', title:'', time:'08:00', freq:'Daily' })
      load()
    } catch { toast.error('Failed') }
  }

  const del = async (id) => {
    try { await patientApi.deleteReminder(id); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }

  const todayRems = reminders.filter(r => !r.freq || r.freq === 'Daily' || r.freq.includes(todayDay))
  const done = todayRems.filter(r => r.done).length
  const pct  = todayRems.length ? Math.round(done / todayRems.length * 100) : 0

  return (
    <div className="space-y-3">
      {/* Progress banner */}
      {todayRems.length > 0 && (
        <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#1a73e8,#0d47a1)' }}>
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-xs opacity-80">Today's Progress</p>
              <p className="text-lg font-black">{done} / {todayRems.length} done</p>
            </div>
            <p className="text-3xl font-black">{pct}%</p>
          </div>
          <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <button onClick={() => setAdding(!adding)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
        <Plus size={12} /> Add Reminder
      </button>

      {adding && (
        <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-[10px] text-gray-500 font-bold mb-1">TITLE</p>
              <input className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="Reminder title" value={form.title} onChange={set('title')} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold mb-1">TIME</p>
              <input type="time" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs" value={form.time} onChange={set('time')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-500 font-bold mb-1">TYPE</p>
              <select className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs" value={form.type} onChange={set('type')}>
                {Object.keys(TYPE_ICONS).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold mb-1">FREQUENCY</p>
              <select className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs" value={form.freq} onChange={set('freq')}>
                {['Daily','Weekly','Mon-Fri'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <button onClick={add} className="mt-3 w-full py-2 text-xs font-bold bg-primary-600 text-white rounded-xl">Save Reminder</button>
        </div>
      )}

      {loading ? <div className="text-center py-6 text-gray-400">Loading...</div>
        : !reminders.length ? (
          <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">⏰</p><p className="text-sm">No reminders yet</p></div>
        ) : reminders.map(r => (
          <div key={r.id} className={`bg-white border-2 rounded-2xl p-3 flex items-center gap-3 shadow-card ${TYPE_COLORS[r.type] || 'border-gray-200 bg-gray-50'} ${r.done ? 'opacity-60' : ''}`}>
            <span className="text-2xl">{r.icon || TYPE_ICONS[r.type] || '⏰'}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{r.title}</p>
              <p className="text-xs text-gray-400">⏰ {r.time} · {r.freq || 'Daily'}</p>
            </div>
            <button onClick={() => del(r.id)} className="text-gray-300 hover:text-red-400 p-1"><Trash2 size={14}/></button>
          </div>
        ))
      }
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-xs text-primary-700 font-medium">
        💡 Reminders help you stay consistent with medications & wellness routines.
      </div>
    </div>
  )
}

// ── VACCINATIONS TAB ────────────────────────────────────────────────────────────
function VaccinationsTab() {
  const [vaccinations, setVaccinations] = useState([])
  const [loading, setLoading]           = useState(true)
  const [adding, setAdding]             = useState(false)
  const [form, setForm]                 = useState({ name:'', date:'', status:'done', nextDue:'' })
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
    try { await patientApi.addVaccination(form); toast.success('Added'); setAdding(false); setForm({ name:'', date:'', status:'done', nextDue:'' }); load() }
    catch { toast.error('Failed') }
  }

  const doneCount     = vaccinations.filter(v => v.status === 'done').length
  const dueCount      = vaccinations.filter(v => v.status === 'due').length
  const upcomingCount = vaccinations.filter(v => v.status === 'upcoming').length

  const STATUS_STYLE = {
    done:     { badge: 'bg-green-100 text-green-700', icon: '✅', dotBg: 'bg-green-500' },
    due:      { badge: 'bg-red-100 text-red-700',     icon: '⚠️', dotBg: 'bg-red-500'   },
    upcoming: { badge: 'bg-amber-100 text-amber-700', icon: '📅', dotBg: 'bg-amber-400' },
  }

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#1a73e8,#0d47a1)' }}>
        <p className="text-base font-black mb-3">💉 Vaccination Tracker</p>
        <div className="grid grid-cols-3 gap-2">
          {[['Done', doneCount, '#22c55e'], ['Due', dueCount, '#fbbf24'], ['Upcoming', upcomingCount, '#94a3b8']].map(([l, n, c]) => (
            <div key={l} className="bg-white/15 rounded-xl p-2 text-center">
              <p className="text-lg font-black" style={{ color: c }}>{n}</p>
              <p className="text-[9px] opacity-80">{l}</p>
            </div>
          ))}
        </div>
      </div>

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

      {loading ? <div className="text-center py-6 text-gray-400">Loading...</div>
        : !vaccinations.length ? (
          <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">💉</p><p className="text-sm">No vaccinations recorded</p></div>
        ) : vaccinations.map(v => {
          const st = STATUS_STYLE[v.status] || STATUS_STYLE.done
          return (
            <div key={v.id} className="bg-white border border-primary-100 rounded-2xl p-3.5 flex items-center gap-3 shadow-card">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${st.dotBg}`} />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{v.name}</p>
                {v.date && <p className="text-xs text-gray-400">Given: {v.date}</p>}
                {v.nextDue && <p className="text-xs text-gray-400">Next: {v.nextDue}</p>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badge}`}>{st.icon} {v.status}</span>
            </div>
          )
        })
      }
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-xs text-primary-700 font-medium">
        📋 Based on India National Immunization Schedule. Consult your doctor for exact dates.
      </div>
    </div>
  )
}

// ── SOS TAB ─────────────────────────────────────────────────────────────────────
function SOSTab() {
  const { user } = useAuthStore()
  const [triggered, setTriggered] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [contacts, setContacts] = useState([])
  const [loadingC, setLoadingC] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', relation: 'Family', phone: '', icon: '👤' })
  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const ICONS = ['👤','👩','👨','👦','👧','👴','👵','🧑','👩‍⚕️','👨‍⚕️']
  const RELATIONS = ['Family','Spouse','Parent','Child','Sibling','Friend','Doctor','Neighbour','Other']

  const GOV_CONTACTS = [
    { icon:'🚑', name:'Ambulance',     relation:'Emergency', phone:'108' },
    { icon:'🚔', name:'Police',         relation:'Emergency', phone:'100' },
    { icon:'🔥', name:'Fire Brigade',   relation:'Emergency', phone:'101' },
    { icon:'💊', name:'Poison Control', relation:'Medical',   phone:'1800-11-6117' },
  ]

  const loadContacts = () => {
    patientApi.getSosContacts()
      .then(res => setContacts(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingC(false))
  }
  useEffect(() => { loadContacts() }, [])

  const saveContact = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return }
    setSaving(true)
    try {
      await patientApi.addSosContact(form)
      toast.success('Contact added')
      setAddModal(false)
      setForm({ name: '', relation: 'Family', phone: '', icon: '👤' })
      loadContacts()
    } catch { toast.error('Failed to add') } finally { setSaving(false) }
  }

  const deleteContact = async (id) => {
    if (!window.confirm('Remove this contact?')) return
    try {
      await patientApi.deleteSosContact(id)
      toast.success('Removed')
      loadContacts()
    } catch { toast.error('Failed') }
  }

  return (
    <div className={`space-y-4 ${largeText ? 'text-lg' : ''}`}>
      {/* SOS Button */}
      <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-card">
        <p className="text-sm font-black text-gray-900 mb-1">🆘 Emergency SOS</p>
        <p className="text-xs text-gray-500 mb-4">Press to instantly alert emergency services.</p>
        {triggered ? (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-center">
            <div className="text-4xl mb-2">🆘</div>
            <p className="text-base font-black text-red-700">SOS Alert Sent!</p>
            <p className="text-xs text-gray-500 mt-1">Emergency services have been notified.</p>
            <button onClick={() => setTriggered(false)} className="mt-3 text-xs text-red-500 font-bold underline">Cancel Alert</button>
          </div>
        ) : (
          <button
            onClick={() => { if (window.confirm('Send SOS to emergency services?')) setTriggered(true) }}
            className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-base shadow-lg active:scale-95 transition-transform border-4 border-red-300">
            🆘 SOS — Get Emergency Help
          </button>
        )}
      </div>

      {/* Personal Emergency Contacts */}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-600">👥 My Emergency Contacts</p>
          <button onClick={() => setAddModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
            <Plus size={11} /> Add
          </button>
        </div>
        {loadingC ? (
          <div className="text-xs text-gray-400 text-center py-3">Loading...</div>
        ) : contacts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">No personal contacts added yet</p>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                <span className="text-2xl">{c.icon || '👤'}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">{c.name}</p>
                  <p className="text-[10px] text-gray-500">{c.relation}</p>
                </div>
                <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs font-black text-primary-600 mr-1">
                  <Phone size={11} /> {c.phone}
                </a>
                <button onClick={() => deleteContact(c.id)} className="text-gray-300 hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Government Emergency Numbers */}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-bold text-gray-600 mb-3">📞 Government Emergency Numbers</p>
        <div className="space-y-2">
          {GOV_CONTACTS.map(c => (
            <a key={c.name} href={`tel:${c.phone}`}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors">
              <span className="text-2xl">{c.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-800">{c.name}</p>
                <p className="text-[10px] text-gray-500">{c.relation}</p>
              </div>
              <div className="flex items-center gap-1">
                <Phone size={11} className="text-primary-500" />
                <span className="text-xs font-black text-primary-600">{c.phone}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-bold text-gray-600 mb-3">♿ Accessibility</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800">Large Text Mode</p>
            <p className="text-xs text-gray-500">Bigger text for easier reading</p>
          </div>
          <button onClick={() => setLargeText(!largeText)}
            className={`relative w-12 h-6 rounded-full transition-colors ${largeText ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${largeText ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Emergency Health Card */}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-bold text-gray-600 mb-3">🏥 Emergency Health Info</p>
        <div className="space-y-2">
          {[['Name', user?.name], ['Blood Type', user?.bloodType], ['Allergies', user?.allergies || 'None'], ['Conditions', user?.conditions || 'None']].map(([l,v]) => (
            <div key={l} className="flex justify-between">
              <span className="text-xs text-gray-500">{l}</span>
              <span className={`text-xs font-bold ${l==='Blood Type'?'text-red-600':'text-gray-800'}`}>{v || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-t-3xl lg:rounded-3xl p-5 space-y-3">
            <p className="text-sm font-black text-gray-900">👥 Add Emergency Contact</p>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Name *</label>
              <input value={form.name} onChange={setF('name')} placeholder="Full name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Relation</label>
                <select value={form.relation} onChange={setF('relation')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400">
                  {RELATIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Phone *</label>
                <input value={form.phone} onChange={setF('phone')} placeholder="+91 98765..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                    className={`text-xl p-1 rounded-lg border-2 ${form.icon === ic ? 'border-primary-500' : 'border-transparent'}`}>{ic}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setAddModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-500">Cancel</button>
              <button onClick={saveContact} disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white rounded-2xl text-sm font-bold disabled:opacity-60">
                {saving ? 'Saving...' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── QR CARD TAB ─────────────────────────────────────────────────────────────────
function QRCardTab() {
  const { user } = useAuthStore()

  const EMERGENCY_CONTACTS = [
    { name:'Ambulance', phone:'108', relation:'Emergency' },
    { name:'Poison Control', phone:'1800-11-6117', relation:'Medical' },
  ]

  return (
    <div className="space-y-4">
      {/* Digital card */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#1e1b4b,#3730a3)' }}>
        <p className="text-[10px] text-slate-400 mb-3 tracking-widest">DIGITAL EMERGENCY CARD</p>
        <div className="flex gap-4 items-start">
          {/* QR placeholder */}
          <div className="bg-white rounded-xl p-2 flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <rect x="2" y="2" width="24" height="24" rx="3" fill="#1a1a1a"/>
              <rect x="6" y="6" width="16" height="16" fill="white"/>
              <rect x="10" y="10" width="8" height="8" fill="#1a1a1a"/>
              <rect x="54" y="2" width="24" height="24" rx="3" fill="#1a1a1a"/>
              <rect x="58" y="6" width="16" height="16" fill="white"/>
              <rect x="62" y="10" width="8" height="8" fill="#1a1a1a"/>
              <rect x="2" y="54" width="24" height="24" rx="3" fill="#1a1a1a"/>
              <rect x="6" y="58" width="16" height="16" fill="white"/>
              <rect x="10" y="62" width="8" height="8" fill="#1a1a1a"/>
              {[32,38,44,50,56,62].map((x,i) => [32,38,44,50,56,62].filter((_,j) => (i*6+j)%3!==0).map(y => (
                <rect key={`${x}${y}`} x={x} y={y} width={4} height={4} fill="#1a1a1a" rx="0.5"/>
              )))}
            </svg>
            <p className="text-[8px] text-gray-500 text-center mt-1 font-medium">Scan for info</p>
          </div>
          {/* Info */}
          <div className="text-white flex-1">
            <div className="inline-block bg-red-500 text-white font-black text-sm px-2.5 py-0.5 rounded-lg mb-2">
              {user?.bloodType || 'A+'}
            </div>
            <p className="text-base font-black">{user?.name || 'Patient Name'}</p>
            <p className="text-xs text-slate-300">Age {user?.age || '—'} · {user?.gender || '—'}</p>
            {user?.allergies && user.allergies !== 'None' && (
              <div className="mt-2 bg-red-500/20 rounded-lg px-2 py-1 text-[10px] text-red-300 font-bold">⚠️ {user.allergies}</div>
            )}
            {user?.conditions && user.conditions !== 'None' && (
              <p className="mt-1 text-[10px] text-slate-400">{user.conditions}</p>
            )}
          </div>
        </div>
        {/* Emergency contacts */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {EMERGENCY_CONTACTS.map(c => (
            <div key={c.name} className="bg-white/10 rounded-xl p-2.5">
              <p className="text-[9px] text-slate-400">{c.relation}</p>
              <p className="text-xs font-bold text-slate-200">{c.name}</p>
              <p className="text-xs text-blue-300 font-black">{c.phone}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How to use */}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-black text-gray-700 mb-3">📱 How to use</p>
        <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
          <p>1. Screenshot this card and set it as your lock screen wallpaper</p>
          <p>2. First responders can scan the QR code or read your blood type, allergies, and emergency contacts</p>
          <p>3. Keep this updated whenever your medical info changes</p>
        </div>
        <button onClick={() => toast.success('Use your device screenshot (Power + Volume Down) to save')}
          className="mt-3 w-full py-2 text-xs font-bold text-white rounded-xl"
          style={{ background: 'linear-gradient(135deg,#3730a3,#6d28d9)' }}>
          📸 Save as Screenshot
        </button>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium">
        ⚠️ Keep this card updated. An outdated card can cause wrong treatment in emergencies.
      </div>
    </div>
  )
}

// ── COST ESTIMATOR TAB ──────────────────────────────────────────────────────────
const TREATMENTS = ['Bypass Surgery','Knee Replacement','Appendectomy','Cataract Surgery','MRI Scan','CT Scan','Chemotherapy','Normal Delivery','C-Section','Angioplasty','Hip Replacement','Spine Surgery','Dental Implant','General Consultation']
const CITIES = ['Faridabad','Gurugram','Delhi','Noida','Mumbai','Bangalore','Chennai']
const HOSP_TYPES = ['Government','Trust/NGO','Private','Super Speciality']

const COST_DATA = {
  'MRI Scan':              { gov: [2000,3500],   priv: [5000,12000],  ss: [8000,15000] },
  'CT Scan':               { gov: [1500,3000],   priv: [4000,10000],  ss: [6000,14000] },
  'General Consultation':  { gov: [100,500],     priv: [500,2000],    ss: [1000,5000]  },
  'Normal Delivery':       { gov: [2000,8000],   priv: [20000,50000], ss: [40000,80000]},
  'Appendectomy':          { gov: [10000,25000], priv: [40000,80000], ss: [70000,120000]},
  'Cataract Surgery':      { gov: [5000,15000],  priv: [25000,60000], ss: [50000,100000]},
  'Bypass Surgery':        { gov: [80000,150000],priv: [200000,400000],ss: [300000,600000]},
  'Knee Replacement':      { gov: [60000,120000],priv: [150000,300000],ss: [250000,500000]},
  'Angioplasty':           { gov: [70000,130000],priv: [150000,350000],ss: [250000,500000]},
  'C-Section':             { gov: [8000,20000],  priv: [40000,100000],ss: [80000,180000]},
  'Chemotherapy':          { gov: [15000,40000], priv: [50000,150000],ss: [100000,250000]},
  'Hip Replacement':       { gov: [70000,130000],priv: [160000,320000],ss: [280000,520000]},
  'Spine Surgery':         { gov: [80000,150000],priv: [200000,450000],ss: [350000,700000]},
  'Dental Implant':        { gov: [10000,20000], priv: [30000,70000], ss: [50000,120000]},
}

function CostEstimatorTab() {
  const [form, setForm]     = useState({ treatment:'', location:'Delhi', hospitalType:'Private', insurance:'No' })
  const [result, setResult] = useState(null)
  const [loading, setLoading]= useState(false)
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }))

  const estimate = () => {
    if (!form.treatment) { toast.error('Select a treatment'); return }
    setLoading(true)
    setTimeout(() => {
      const data = COST_DATA[form.treatment] || { gov:[5000,20000], priv:[20000,60000], ss:[40000,120000] }
      const typeKey = form.hospitalType === 'Government' || form.hospitalType === 'Trust/NGO' ? 'gov' : form.hospitalType === 'Super Speciality' ? 'ss' : 'priv'
      const [minBase, maxBase] = data[typeKey]
      const cityMulti = ['Mumbai','Bangalore'].includes(form.location) ? 1.3 : form.location === 'Delhi' ? 1.15 : 1
      const min = Math.round(minBase * cityMulti)
      const max = Math.round(maxBase * cityMulti)
      const avg = Math.round((min + max) / 2)
      const insDiscount = form.insurance === 'Yes' ? Math.round(avg * 0.7) : null
      const breakdown = [
        { l:'Procedure/Surgery', p:45, c:'#3b82f6' },
        { l:'Room & Boarding',   p:20, c:'#10b981' },
        { l:'Medicines',         p:18, c:'#f59e0b' },
        { l:'Diagnostics',       p:12, c:'#6366f1' },
        { l:'Miscellaneous',     p:5,  c:'#94a3b8' },
      ]
      const tip = form.insurance === 'Yes'
        ? 'Insurance may cover 60-80% of eligible charges. Keep original bills & prescriptions.'
        : 'Consider buying health insurance for this procedure. It can save you ₹' + Math.round(avg * 0.6).toLocaleString('en-IN') + '.'
      setResult({ min, max, avg, insDiscount, breakdown, tip })
      setLoading(false)
    }, 1500)
  }

  const fmt = (n) => '₹' + n.toLocaleString('en-IN')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)' }}>
        <p className="text-[10px] opacity-60 tracking-wider">✨ AI POWERED</p>
        <p className="text-base font-black">Treatment Cost Estimator</p>
        <p className="text-xs opacity-75 mt-1">Smart estimates based on location, hospital type & insurance</p>
      </div>

      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card space-y-3">
        <div>
          <p className="text-[10px] text-gray-500 font-bold mb-1">TREATMENT / PROCEDURE</p>
          <select className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xs" value={form.treatment} onChange={e => set('treatment')(e.target.value)}>
            <option value="">-- Select Treatment --</option>
            {TREATMENTS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-gray-500 font-bold mb-1">CITY</p>
            <select className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xs" value={form.location} onChange={e => set('location')(e.target.value)}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold mb-1">HOSPITAL TYPE</p>
            <select className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xs" value={form.hospitalType} onChange={e => set('hospitalType')(e.target.value)}>
              {HOSP_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-bold mb-1">INSURANCE?</p>
          <div className="flex gap-2">
            {['Yes','No'].map(v => (
              <button key={v} onClick={() => set('insurance')(v)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${form.insurance===v ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
                {v === 'Yes' ? '✅ Yes' : '❌ No'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={estimate} disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)' }}>
          {loading ? '⏳ Estimating…' : '✨ Estimate Cost'}
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl p-4 text-white space-y-2" style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)' }}>
          {[70,90,60].map((w,i) => <div key={i} className="h-3 rounded-full animate-pulse bg-white/20" style={{ width:`${w}%` }} />)}
          <p className="text-xs opacity-60">Analysing market data…</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-3">
          <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)' }}>
            <p className="text-[10px] opacity-60 tracking-wider mb-3">📊 ESTIMATE READY</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[['Min',result.min,'#90cdf4'],['Expected',result.avg,'#fbbf24'],['Max',result.max,'#fc8181']].map(([l,v,c]) => (
                <div key={l} className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-[9px] opacity-70">{l}</p>
                  <p className="text-sm font-black" style={{ color: c }}>{fmt(v)}</p>
                </div>
              ))}
            </div>
            {result.insDiscount && (
              <div className="bg-green-400/20 rounded-xl p-2.5 mb-3 text-center">
                <p className="text-xs text-green-300 font-bold">💰 With Insurance (Est. Payout)</p>
                <p className="text-lg font-black text-green-300">{fmt(result.insDiscount)}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-300 mb-2">Cost Breakdown</p>
              {result.breakdown.map(b => (
                <div key={b.l} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.c }} />
                  <span className="text-xs text-slate-300 flex-1">{b.l}</span>
                  <span className="text-xs font-bold text-blue-300">{b.p}%</span>
                </div>
              ))}
            </div>
            {result.tip && (
              <div className="mt-3 bg-green-400/15 rounded-xl p-2.5 text-xs text-green-300 leading-relaxed">💡 {result.tip}</div>
            )}
            <p className="text-[9px] opacity-40 mt-2">*Estimates are indicative. Actual costs may vary.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── BILL ANALYZER TAB ─────────────────────────────────────────────────────────
const BILL_CATS = {
  medicine:    { label:'💊 Medicines',     color:'#0284c7', bg:'#f0f9ff', border:'#bae6fd', claimable:true,  kw:['tablet','capsule','syrup','injection','inj.','iv fluid','infusion','drip','saline','mg ','ml ','pharmacy','medicine','antibiotic','paracetamol','amoxicillin','strips','vial','ampoule'] },
  room:        { label:'🛏️ Room & Boarding', color:'#3730a3', bg:'#f5f0ff', border:'#ddd6fe', claimable:true,  kw:['room charge','room rent','bed charge','ward','icu','nicu','cabin','accommodation','room tariff'] },
  ot:          { label:'🔬 Surgical & OT', color:'#1e8a4c', bg:'#f0fdf4', border:'#bbf7d0', claimable:true,  kw:['ot charge','operation theatre','theatre','anaesthesia','anesthesia','surgeon fee','surgery charge','procedure charge'] },
  diagnostic:  { label:'🧪 Diagnostics',   color:'#c45f00', bg:'#fff7ed', border:'#fed7aa', claimable:true,  kw:['lab ','laboratory','pathology','blood test','x-ray','mri','ct scan','ultrasound','usg','ecg','echo','biopsy','haemogram','cbc','lft','kft','radiology'] },
  non_medical: { label:'🚫 Non-Medical',   color:'#c62828', bg:'#fdecea', border:'#ef9a9a', claimable:false, kw:['food','meal','lunch','dinner','breakfast','canteen','laundry','telephone','tv charge','television','newspaper','toiletry','parking','registration charge','file charge','miscellaneous','attendant charge','diaper','stationery'] },
  other:       { label:'📋 Other',         color:'#5f6368', bg:'#f5f5f5', border:'#e0e0e0', claimable:null,  kw:[] },
}

function detectCat(line) {
  const l = line.toLowerCase()
  for (const [key, cat] of Object.entries(BILL_CATS)) {
    if (key === 'other') continue
    if (cat.kw.some(k => l.includes(k))) return key
  }
  return 'other'
}

function extractAmt(line) {
  const patterns = [/[=:]\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)\s*$/i, /(?:rs\.?|₹|inr)\s*([\d,]+(?:\.\d{1,2})?)/i, /([\d,]+(?:\.\d{1,2})?)\s*$/]
  for (const re of patterns) { const m = line.match(re); if (m) { const v = parseFloat(m[1].replace(/,/g,'')); if (v > 0) return v } }
  return 0
}

const SAMPLE_BILL = `ICU Room charges - 3 days @ Rs.8000/day = Rs.24000
General Ward - 2 days @ Rs.2500/day = Rs.5000
Surgeon fee = Rs.35000
OT charges = Rs.18000
Anaesthesia charges = Rs.12000
Ceftriaxone 1g Injection x10 = Rs.4500
Paracetamol Tab 500mg x30 strips = Rs.180
NS IV Fluid 500ml x8 = Rs.1200
Haemogram CBC = Rs.800
Liver Function Test LFT = Rs.900
X-Ray Chest PA view = Rs.600
2D Echo = Rs.2800
Food and meal charges = Rs.2500
Attendant charges = Rs.3000
TV charges = Rs.500
Laundry = Rs.300
Registration charge = Rs.200
File charge = Rs.150
Miscellaneous = Rs.750`

function BillAnalyzerTab() {
  const [billText, setBillText] = useState('')
  const [items, setItems]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const analyze = async (text) => {
    if (!text.trim()) { toast.error('Please paste bill content'); return }
    setLoading(true)
    try {
      // Try Anthropic API
      const apiKey = import.meta.env.VITE_ANTHROPIC_KEY || ''
      if (!apiKey) throw new Error('No API key - using local analysis')
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: 'You are an Indian hospital bill auditor. Analyze this bill and return ONLY a JSON array. Each element: {"line":"item text","category":"medicine|room|ot|diagnostic|non_medical|other","amount":number,"claimable":true/false/null,"flagged":true/false}. Return ONLY valid JSON array, no markdown.\n\nBill:\n' + text }]
        })
      })
      const data = await resp.json()
      const textBlock = data.content?.find(b => b.type === 'text')
      if (textBlock) {
        const raw = textBlock.text.trim().replace(/^```json[\r\n]*/,'').replace(/[\r\n]*```$/,'')
        const parsed = JSON.parse(raw)
        const enriched = parsed.map((it, idx) => {
          const meta = BILL_CATS[it.category] || BILL_CATS.other
          return { ...it, lineNo: idx+1, catLabel: meta.label, color: meta.color, bg: meta.bg, border: meta.border }
        })
        setItems(enriched)
      } else throw new Error('No text')
    } catch {
      // Fallback to local keyword analysis
      const results = text.split('\n').map((rawLine, idx) => {
        const line = rawLine.trim()
        if (!line || line.length < 3) return null
        const cat = detectCat(line)
        const meta = BILL_CATS[cat]
        return { lineNo: idx+1, line, category: cat, catLabel: meta.label, amount: extractAmt(line), claimable: meta.claimable, color: meta.color, bg: meta.bg, border: meta.border, flagged: cat === 'non_medical' }
      }).filter(Boolean)
      setItems(results)
    }
    setLoading(false)
  }

  const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
  const totalAmt = items?.reduce((s, r) => s + r.amount, 0) || 0
  const claimableAmt = items?.filter(r => r.claimable === true).reduce((s, r) => s + r.amount, 0) || 0
  const nonClaimableAmt = items?.filter(r => r.claimable === false).reduce((s, r) => s + r.amount, 0) || 0
  const nonClaimableCount = items?.filter(r => r.claimable === false).length || 0

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#1e1b4b,#3730a3)' }}>
        <p className="text-[10px] opacity-60 tracking-wider">🧾 AI BILL ANALYZER</p>
        <p className="text-base font-black">Understand Your Hospital Bill</p>
        <p className="text-xs opacity-75 mt-1">Paste bill text to get plain-language summary, expense breakdown & accuracy check</p>
      </div>

      {!items && !loading && (
        <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card space-y-3">
          <div>
            <p className="text-[10px] text-gray-500 font-bold mb-1">BILL CONTENT (one item per line)</p>
            <textarea
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-mono leading-relaxed resize-none h-36 outline-none focus:border-primary-400"
              placeholder="Paste bill items here, e.g.&#10;ICU Room - 3 days = Rs.24000&#10;Surgeon fee = Rs.35000"
              value={billText} onChange={e => setBillText(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setBillText(SAMPLE_BILL)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-600">
              📋 Load Sample
            </button>
            <button onClick={() => analyze(billText)}
              className="flex-2 flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#1e1b4b,#3730a3)' }}>
              🤖 Analyze Bill
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-primary-100 rounded-2xl p-6 text-center shadow-card">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-sm font-black text-primary-900 mb-1">Analyzing your bill...</p>
          <p className="text-xs text-gray-500 mb-4">AI is reading each line and categorising charges</p>
          <div className="flex gap-2 justify-center">
            {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}
          </div>
        </div>
      )}

      {items && !loading && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-3.5 text-center text-white" style={{ background: 'linear-gradient(135deg,#1e8a4c,#34d399)' }}>
              <p className="text-lg font-black">{items.filter(r => r.claimable === true).length}</p>
              <p className="text-[10px] opacity-90">✅ Claimable Items</p>
              <p className="text-sm font-black mt-1">{fmt(claimableAmt)}</p>
            </div>
            <div className="rounded-2xl p-3.5 text-center text-white" style={{ background: 'linear-gradient(135deg,#c62828,#f87171)' }}>
              <p className="text-lg font-black">{nonClaimableCount}</p>
              <p className="text-[10px] opacity-90">🚫 Non-Claimable</p>
              <p className="text-sm font-black mt-1">{fmt(nonClaimableAmt)}</p>
            </div>
          </div>

          {/* Alert */}
          {nonClaimableCount > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
              ⚠️ {nonClaimableCount} non-claimable item(s) worth {fmt(nonClaimableAmt)} detected. Remove before submitting to insurance.
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-medium">
              ✅ No non-medical items detected. Bill looks clean for insurance submission.
            </div>
          )}

          {/* Items grouped by category */}
          <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
            <p className="text-xs font-black text-gray-700 mb-3">📋 Item-by-Item Breakdown</p>
            {Object.entries(BILL_CATS).map(([key, meta]) => {
              const catItems = items.filter(it => it.category === key)
              if (!catItems.length) return null
              const catAmt = catItems.reduce((s, r) => s + r.amount, 0)
              return (
                <div key={key} className="mb-4">
                  <div className="flex justify-between items-center rounded-xl px-3 py-2 mb-2" style={{ background: meta.bg, border: `1.5px solid ${meta.border}` }}>
                    <span className="text-xs font-black" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="text-xs font-black" style={{ color: meta.color }}>{fmt(catAmt)}</span>
                  </div>
                  {catItems.map(item => (
                    <div key={item.lineNo} className="flex items-start gap-2 rounded-xl p-2.5 mb-1.5 border" style={{ background: '#fff', borderColor: meta.border }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: meta.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 leading-relaxed break-words">{item.line}</p>
                        {item.flagged && <p className="text-[10px] font-bold mt-0.5" style={{ color: meta.color }}>⚠️ Non-payable per IRDAI</p>}
                      </div>
                      {item.amount > 0 && <span className="text-xs font-black flex-shrink-0" style={{ color: meta.color }}>{fmt(item.amount)}</span>}
                    </div>
                  ))}
                </div>
              )
            })}
            <div className="flex justify-between border-t border-gray-200 pt-3 mt-2">
              <span className="text-sm font-black text-gray-800">Total Bill</span>
              <span className="text-sm font-black text-primary-700">{fmt(totalAmt)}</span>
            </div>
          </div>

          <button onClick={() => { setItems(null); setBillText('') }}
            className="w-full py-2.5 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-600">
            🔄 Analyze New Bill
          </button>
        </div>
      )}
    </div>
  )
}

// ── YOGA / WELLNESS TAB ─────────────────────────────────────────────────────────
const SESSIONS = [
  { id:'bp',       icon:'🧘', title:'BP Relief Pranayama',     duration:'5 min', desc:'Anulom Vilom breathing to reduce hypertension',         color:'#e0f2f1', for:'Hypertension',  condition:'hypertension',
    steps:[{ name:'Anulom Vilom', rounds:6, instr:'Close right nostril with thumb. Inhale through left. Close left, exhale through right. Alternate.',icon:'👃',phases:[4,4,6] },
           { name:'Bhramari (Humming Bee)', rounds:5, instr:'Inhale deeply. On exhale, make a humming sound like a bee. Feel vibrations in the skull.',icon:'🐝',phases:[4,2,6] }] },
  { id:'stress',   icon:'🌿', title:'Stress Relief Yoga',       duration:'5 min', desc:'Gentle stretches and breathing for anxiety & stress',   color:'#f0fdf4', for:'Stress / Anxiety', condition:'stress',
    steps:[{ name:"Child's Pose (Balasana)", rounds:5, instr:'Kneel and sit back on heels. Extend arms forward and rest forehead on floor. Breathe deeply.',icon:'🙇',phases:[4,0,4] },
           { name:'Alternate Nostril', rounds:6, instr:'Close right nostril, inhale left. Close both, hold. Open right, exhale. Repeat reversing.',icon:'👃',phases:[4,4,4] }] },
  { id:'diabetes', icon:'🏃', title:'Diabetes Wellness Flow',   duration:'5 min', desc:'Movement and breathing to help manage blood sugar',     color:'#fff7ed', for:'Diabetes',       condition:'diabet',
    steps:[{ name:'Kapalbhati', rounds:20, instr:'Sit straight. Take a deep breath. Do short, forceful exhalations through the nose contracting abs.',icon:'💨',phases:[2,0,1] },
           { name:'Mandukasana (Frog Pose)', rounds:5, instr:'Sit in Vajrasana. Make fists and place below navel. Bend forward pressing fists. Hold. Return.',icon:'🐸',phases:[4,4,4] }] },
  { id:'sleep',    icon:'😴', title:'Better Sleep Routine',     duration:'5 min', desc:'Calming breathwork before bedtime',                     color:'#f5f3ff', for:'Sleep Issues',   condition:'sleep',
    steps:[{ name:'4-7-8 Breathing', rounds:4, instr:'Inhale through nose for 4. Hold for 7. Exhale completely through mouth for 8. Activates parasympathetic response.',icon:'🌙',phases:[4,7,8] },
           { name:'Body Scan Relaxation', rounds:5, instr:'Breathe slowly and mentally scan from toes to head, consciously relaxing each body part.',icon:'✨',phases:[4,0,4] }] },
]

function YogaTab() {
  const { user } = useAuthStore()
  const [activeSession, setActiveSession] = useState(null)
  const [stepIdx, setStepIdx]             = useState(0)
  const [phase, setPhase]                 = useState('ready') // ready | inhale | hold | exhale
  const [phaseIdx, setPhaseIdx]           = useState(0)
  const [count, setCount]                 = useState(0)
  const [roundsDone, setRoundsDone]       = useState(0)
  const timer = useRef(null)

  const cond = (user?.conditions || '').toLowerCase()
  const recommended = SESSIONS.filter(s => cond.includes(s.condition))

  const startSession = (s) => {
    setActiveSession(s)
    setStepIdx(0)
    setPhase('ready')
    setPhaseIdx(0)
    setCount(0)
    setRoundsDone(0)
  }

  const endSession = () => {
    clearInterval(timer.current)
    setActiveSession(null)
    setPhase('ready')
    toast.success('Session complete! 🌿')
  }

  const PHASE_LABELS = ['inhale','hold','exhale']
  const PHASE_ICONS  = { inhale:'Breathe In 🌬️', hold:'Hold 🤐', exhale:'Breathe Out 😮‍💨', ready:'Ready' }

  const nextPhase = () => {
    if (phase === 'ready') { setPhase('inhale'); setPhaseIdx(0); setCount(0); return }
    const step = activeSession.steps[stepIdx]
    if (!step) return
    const nextPhaseIdx = phaseIdx + 1
    if (nextPhaseIdx >= PHASE_LABELS.length) {
      // completed one round
      const newRounds = roundsDone + 1
      setRoundsDone(newRounds)
      if (newRounds >= step.rounds) {
        // move to next step
        if (stepIdx + 1 >= activeSession.steps.length) {
          endSession(); return
        }
        setStepIdx(i => i + 1)
        setRoundsDone(0)
      }
      setPhase('inhale'); setPhaseIdx(0); setCount(0)
    } else {
      setPhase(PHASE_LABELS[nextPhaseIdx])
      setPhaseIdx(nextPhaseIdx)
      setCount(0)
    }
  }

  if (activeSession) {
    const step = activeSession.steps[stepIdx] || activeSession.steps[0]
    const phaseDuration = step.phases[phaseIdx] || 4
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl p-4 text-white" style={{ background:'linear-gradient(135deg,#064e3b,#065f46)' }}>
          <div>
            <p className="text-[10px] opacity-70">NOW PLAYING</p>
            <p className="text-sm font-black">{activeSession.title}</p>
          </div>
          <button onClick={endSession} className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl">✕ End</button>
        </div>

        <div className="bg-white border border-primary-100 rounded-2xl p-5 shadow-card text-center">
          <p className="text-3xl mb-2">{step.icon}</p>
          <p className="text-base font-black text-gray-900 mb-1">{step.name}</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-5 px-2">{step.instr}</p>

          {/* Breathing circle */}
          <div className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center text-white font-bold text-sm shadow-lg mb-4 transition-all duration-1000 ${phase==='inhale'?'scale-125':'phase'==='hold'?'scale-125':'scale-100'}`}
            style={{ background: phase==='ready'?'#6366f1': phase==='inhale'?'#10b981': phase==='hold'?'#f59e0b':'#6366f1' }}>
            <div>
              <div className="text-2xl mb-1">{phase==='inhale'?'🌬️':phase==='hold'?'🤐':phase==='exhale'?'😮‍💨':'🧘'}</div>
              <div className="text-xs">{PHASE_ICONS[phase]}</div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Step {stepIdx+1}/{activeSession.steps.length} · Round {roundsDone+1}/{step.rounds}
          </p>
          <button onClick={nextPhase}
            className="w-full py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
            {phase === 'ready' ? `${activeSession.icon} Start Session` : 'Next Phase →'}
          </button>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 leading-relaxed">
          💡 {step.instr}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 text-white" style={{ background:'linear-gradient(135deg,#064e3b,#065f46)' }}>
        <p className="text-[10px] opacity-70 mb-1">GUIDED WELLNESS</p>
        <p className="text-base font-black">5-Minute Yoga & Pranayama</p>
        <p className="text-xs opacity-80 mt-1">Tailored for your health conditions</p>
      </div>
      {recommended.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-medium">
          ⭐ Recommended for your conditions: {recommended.map(s => s.title).join(', ')}
        </div>
      )}
      <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Choose a Session</p>
      {SESSIONS.map(s => (
        <button key={s.id} onClick={() => startSession(s)}
          className="w-full bg-white border border-primary-100 rounded-2xl p-4 shadow-card text-left hover:border-primary-300 transition-colors">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: s.color }}>{s.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-black text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </div>
            {recommended.find(r => r.id === s.id) && (
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">⭐ Rec</span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-gray-400">
            <span>⏱ {s.duration}</span>
            <span>🎯 {s.for}</span>
            <span>📋 {s.steps.length} exercises</span>
          </div>
        </button>
      ))}
    </div>
  )
}
