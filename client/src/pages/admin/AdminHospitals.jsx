import { useState, useEffect } from 'react'
import { Modal, FormGroup, Input, Button, PageTitle, EmptyState } from '@/components/ui'
import { Star, Plus, Download, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/api'

// ─── Excel Export ─────────────────────────────────────────────────────────────
function exportToExcel(hospitals) {
  const headers = ['#', 'Name', 'City', 'Address', 'Beds', 'Phone', 'Email', 'Rating', 'Status']
  const rows = hospitals.map((h, i) => [
    i + 1, h.name || '', h.city || '', h.address || '',
    h.beds || '', h.phone || '', h.email || '',
    h.rating || '', h.status || '',
  ])
  const bom = '\uFEFF'
  const csv = bom + [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `healfocus_hospitals_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Excel downloaded!')
}

const EMPTY_FORM = {
  name: '', city: '', address: '', beds: '',
  phone: '', email: '', type: 'Multi Speciality',
  contact: '', lat: '', lng: '', note: '',
}

export default function AdminHospitals() {
  const [hospitals, setHospitals]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [modal, setModal]           = useState(false)
  const [saving, setSaving]         = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [createdCreds, setCreatedCreds] = useState(null)   // show after success
  const [copied, setCopied]         = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = () => {
    setLoading(true)
    adminApi.getHospitals()
      .then(res => setHospitals(res.data?.data || []))
      .catch(() => toast.error('Failed to load hospitals'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = hospitals.filter(h =>
    !search ||
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.city?.toLowerCase().includes(search.toLowerCase())
  )

  // ── Add Hospital ────────────────────────────────────────────────────────────
  const addHospital = async () => {
    if (!form.name.trim()) { toast.error('Hospital name is required'); return }
    if (!form.city.trim()) { toast.error('City is required'); return }
    if (!form.email.trim()) { toast.error('Email is required'); return }
    if (!form.phone.trim()) { toast.error('Phone is required'); return }

    setSaving(true)
    try {
      const res = await adminApi.addHospital({
        name:    form.name.trim(),
        city:    form.city.trim(),
        address: form.address.trim(),
        beds:    form.beds ? parseInt(form.beds) : undefined,
        phone:   form.phone.trim(),
        email:   form.email.trim().toLowerCase(),
        type:    form.type,
        contact: form.contact.trim(),
        lat:     form.lat ? parseFloat(form.lat) : undefined,
        lng:     form.lng ? parseFloat(form.lng) : undefined,
        note:    form.note.trim(),
      })

      const data = res.data?.data
      toast.success(`🏥 ${form.name} added!`)
      setModal(false)
      setForm(EMPTY_FORM)
      load()

      // Show login credentials popup
      if (data?.loginCredentials) {
        setCreatedCreds(data.loginCredentials)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add hospital')
    } finally {
      setSaving(false)
    }
  }

  const copyCredentials = () => {
    if (!createdCreds) return
    navigator.clipboard.writeText(
      `Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied!')
  }

  // ── Toggle Status ───────────────────────────────────────────────────────────
  const toggleStatus = async (h) => {
    try {
      await adminApi.updateHospitalStatus(h.id, {
        status: h.status === 'active' ? 'suspended' : 'active',
      })
      toast.success('Status updated')
      load()
    } catch { toast.error('Failed to update status') }
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <PageTitle icon="🏥">Hospitals ({hospitals.length})</PageTitle>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportToExcel(hospitals)}
            disabled={!hospitals.length}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-full transition-all"
          >
            <Download size={12} /> Download Excel
          </button>
          <button
            onClick={() => { setForm(EMPTY_FORM); setModal(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full"
          >
            <Plus size={12} /> Add Hospital
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search hospitals..."
          className="w-full pl-4 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
        />
      </div>

      {/* ── List ── */}
      {loading
        ? <div className="text-center py-10 text-gray-400">Loading...</div>
        : !filtered.length
          ? <EmptyState icon="🏥" title="No hospitals found" />
          : (
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${h.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {h.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {h.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            <span className="text-xs">{h.rating}</span>
                          </div>
                        )}
                        {h.phone && <span className="text-xs text-gray-400">{h.phone}</span>}
                        {h.email && <span className="text-xs text-gray-400 truncate max-w-[140px]">{h.email}</span>}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => toggleStatus(h)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${h.status === 'active' ? 'border-red-200 text-red-600 bg-red-50' : 'border-green-200 text-green-600 bg-green-50'}`}
                        >
                          {h.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {/* ── Add Hospital Modal ── */}
      <Modal open={modal} onClose={() => setModal(false)} title="🏥 Add New Hospital">
        <div className="space-y-0.5">
          <FormGroup label="Hospital Name *">
            <Input placeholder="e.g. Apollo Medical Centre" value={form.name} onChange={set('name')} />
          </FormGroup>

          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="City *">
              <Input placeholder="e.g. Delhi" value={form.city} onChange={set('city')} />
            </FormGroup>
            <FormGroup label="Type">
              <select value={form.type} onChange={set('type')}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 bg-white">
                {['Multi Speciality','Super Speciality','General','Clinic','Nursing Home'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </FormGroup>
          </div>

          <FormGroup label="Address">
            <Input placeholder="Street, Area" value={form.address} onChange={set('address')} />
          </FormGroup>

          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Phone *">
              <Input placeholder="0129-2234567" value={form.phone} onChange={set('phone')} />
            </FormGroup>
            <FormGroup label="Total Beds">
              <Input type="number" placeholder="300" value={form.beds} onChange={set('beds')} />
            </FormGroup>
          </div>

          <FormGroup label="Email * (used as login ID)">
            <Input type="email" placeholder="info@hospital.com" value={form.email} onChange={set('email')} />
          </FormGroup>

          <FormGroup label="Contact Person">
            <Input placeholder="Dr. Name / Admin Name" value={form.contact} onChange={set('contact')} />
          </FormGroup>

          <div className="grid grid-cols-2 gap-2">
            <FormGroup label="Latitude">
              <Input type="number" placeholder="28.4089" value={form.lat} onChange={set('lat')} />
            </FormGroup>
            <FormGroup label="Longitude">
              <Input type="number" placeholder="77.3178" value={form.lng} onChange={set('lng')} />
            </FormGroup>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 mb-3">
            💡 A hospital staff login will be auto-created with email above and default password <strong>HealFocus@123</strong>. The credentials will be shown after creation.
          </div>

          <Button onClick={addHospital} loading={saving}>🏥 Create Hospital</Button>
        </div>
      </Modal>

      {/* ── Credentials Modal (shown after creation) ── */}
      {createdCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCreatedCreds(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-base font-black text-primary-950">Hospital Created!</p>
              <p className="text-xs text-gray-500 mt-1">Share these login credentials with the hospital staff</p>
            </div>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase">Email</span>
                <span className="text-sm font-bold text-primary-950">{createdCreds.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase">Password</span>
                <span className="text-sm font-bold text-primary-950">{createdCreds.password}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyCredentials}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${copied ? 'border-green-500 text-green-600 bg-green-50' : 'border-primary-200 text-primary-700 bg-primary-50'}`}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
              <button onClick={() => setCreatedCreds(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-800 to-violet-700 text-white">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
