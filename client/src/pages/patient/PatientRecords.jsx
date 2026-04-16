import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { TopBar, Tabs, Modal, FormGroup, Input, Select, Textarea, Button, EmptyState } from '@/components/ui'
import { recTypeIcon, recTypeBg, fmtDate, fmtMoney, today } from '@/lib/utils'
import { Trash2, Plus, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'
import { patientApi } from '@/api'

const RECORD_TYPES = ['Lab Report','Prescription','Radiology','Discharge Summary','Vaccination','Dental','Eye Report','Other']

export default function PatientRecords() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [tab, setTab] = useState('records')
  const TABS = [
    { id: 'records',   label: '📄 Records'  },
    { id: 'family',    label: '👨‍👩‍👧 Family'   },
    { id: 'insurance', label: '🛡️ Insurance' },
    { id: 'claims',    label: '📋 Claims'   },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="My Records" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <div className="mt-4">
          {tab === 'records'   && <MedicalRecords />}
          {tab === 'family'    && <FamilyMembers />}
          {tab === 'insurance' && <InsuranceTab />}
          {tab === 'claims'    && <InsuranceClaimsTab />}
        </div>
      </div>
    </div>
  )
}

function MedicalRecords() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type:'Lab Report', title:'', date: today(), summary:'' })
  const [files, setFiles] = useState([])
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = () => {
    patientApi.getMedicalRecords()
      .then(res => setRecords(res.data?.data || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title) { toast.error('Title required'); return }
    setSaving(true)
    try {
      const res = await patientApi.addMedicalRecord(form)
      const recordId = res.data?.data?.id

      // Upload attachments if any files selected
      if (files.length > 0 && recordId) {
        const fd = new FormData()
        files.forEach(f => fd.append('attachments', f))
        await patientApi.uploadRecordFiles(recordId, fd)
      }

      toast.success('Record added')
      setModal(false)
      setForm({ type:'Lab Report', title:'', date: today(), summary:'' })
      setFiles([])
      load()
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this record?')) return
    try { await patientApi.deleteMedicalRecord(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed') }
  }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    const valid = selected.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      return ['jpg','jpeg','png','pdf'].includes(ext)
    })
    if (valid.length !== selected.length) toast.error('Only JPG, PNG, PDF files allowed')
    setFiles(valid)
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> Add Record
        </button>
      </div>
      {loading ? <div className="text-center py-6 text-gray-400">Loading...</div> : !records.length ? (
        <EmptyState icon="📄" title="No medical records" />
      ) : records.map(r => (
        <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${recTypeBg(r.type)}`}>{recTypeIcon(r.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-primary-950">{r.title}</p>
              <p className="text-xs text-gray-500">{r.type} · {fmtDate(r.date)}</p>
              {r.summary && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.summary}</p>}
              {/* Attachments */}
              {r.attachments && r.attachments.split(',').filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.attachments.split(',').filter(Boolean).map((filename, i) => {
                    const ext = filename.split('.').pop().toLowerCase()
                    const isPdf = ext === 'pdf'
                    const url = `${import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'}/uploads/${filename}`
                    return (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors">
                        {isPdf ? '📄' : '🖼️'} {isPdf ? `File ${i+1}` : `Image ${i+1}`}
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
            <button onClick={() => del(r.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><Trash2 size={14}/></button>
          </div>
        </div>
      ))}
      <Modal open={modal} onClose={() => { setModal(false); setFiles([]) }} title="📄 Add Medical Record">
        <FormGroup label="Type"><Select value={form.type} onChange={set('type')}>{RECORD_TYPES.map(t=><option key={t}>{t}</option>)}</Select></FormGroup>
        <FormGroup label="Title *"><Input placeholder="e.g. CBC Report" value={form.title} onChange={set('title')} /></FormGroup>
        <FormGroup label="Date"><Input type="date" value={form.date} onChange={set('date')} /></FormGroup>
        <FormGroup label="Summary / Notes"><Textarea placeholder="Key findings..." value={form.summary} onChange={set('summary')} /></FormGroup>

        {/* ── Attachment Upload ── */}
        <FormGroup label="Upload Records">
          <label className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all
            ${files.length > 0 ? 'border-green-300 bg-green-50' : 'border-indigo-200 bg-indigo-50 hover:border-indigo-400'}`}>
            <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} />
            <span className="text-2xl">{files.length > 0 ? '✅' : '📎'}</span>
            <p className="text-xs font-bold text-indigo-600">
              {files.length > 0 ? `${files.length} file(s) selected` : 'Click to attach files'}
            </p>
            {files.length > 0 && (
              <div className="w-full space-y-1">
                {files.map((f, i) => (
                  <p key={i} className="text-[10px] text-green-700 text-center font-medium truncate">
                    {f.name.split('.').pop().toUpperCase() === 'PDF' ? '📄' : '🖼️'} {f.name}
                  </p>
                ))}
              </div>
            )}
            {files.length === 0 && <p className="text-[10px] text-gray-400">Supports: JPG, JPEG, PNG, PDF</p>}
          </label>
          {files.length > 0 && (
            <button onClick={() => setFiles([])} className="mt-1 text-[10px] text-red-400 hover:text-red-600 font-bold">
              ✕ Remove all files
            </button>
          )}
        </FormGroup>

        <Button onClick={save} loading={saving}>Add Record</Button>
      </Modal>
    </div>
  )
}

function FamilyMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'', relation:'Spouse', age:'', bloodType:'O+', phone:'', allergies:'', icon:'👩' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const ICONS = ['👩','👨','👦','👧','👴','👵','🧑']
  const RELATIONS = ['Spouse','Son','Daughter','Father','Mother','Sibling','Other']

  const load = () => {
    patientApi.getFamilyMembers()
      .then(res => setMembers(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name) { toast.error('Name required'); return }
    setSaving(true)
    try {
      await patientApi.addFamilyMember(form)
      toast.success('Member added')
      setModal(false)
      setForm({ name:'', relation:'Spouse', age:'', bloodType:'O+', phone:'', allergies:'', icon:'👩' })
      load()
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const del = async (id) => {
    try { await patientApi.deleteFamilyMember(id); toast.success('Removed'); load() } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> Add Member
        </button>
      </div>
      {loading ? <div className="text-center py-6 text-gray-400">Loading...</div> : !members.length ? (
        <EmptyState icon="👨‍👩‍👧" title="No family members added" />
      ) : members.map(m => (
        <div key={m.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card flex items-center gap-3">
          <span className="text-3xl">{m.icon || '👤'}</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary-950">{m.name}</p>
            <p className="text-xs text-gray-500">{m.relation} · {m.age}y · {m.bloodType}</p>
            {m.phone && <p className="text-xs text-gray-400">{m.phone}</p>}
          </div>
          <button onClick={() => del(m.id)} className="text-gray-300 hover:text-red-400"><Trash2 size={14}/></button>
        </div>
      ))}
      <Modal open={modal} onClose={() => setModal(false)} title="👨‍👩‍👧 Add Family Member">
        <FormGroup label="Name *"><Input placeholder="Full name" value={form.name} onChange={set('name')} /></FormGroup>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Relation"><Select value={form.relation} onChange={set('relation')}>{RELATIONS.map(r=><option key={r}>{r}</option>)}</Select></FormGroup>
          <FormGroup label="Age"><Input type="number" placeholder="30" value={form.age} onChange={set('age')} /></FormGroup>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Blood Type"><Select value={form.bloodType} onChange={set('bloodType')}>{['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(b=><option key={b}>{b}</option>)}</Select></FormGroup>
          <FormGroup label="Phone"><Input placeholder="+91..." value={form.phone} onChange={set('phone')} /></FormGroup>
        </div>
        <FormGroup label="Allergies"><Input placeholder="None" value={form.allergies} onChange={set('allergies')} /></FormGroup>
        <FormGroup label="Icon">
          <div className="flex gap-2">{ICONS.map(ic=><button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} className={`text-2xl p-1 rounded-lg border-2 ${form.icon===ic?'border-primary-500':'border-transparent'}`}>{ic}</button>)}</div>
        </FormGroup>
        <Button onClick={save} loading={saving}>Add Member</Button>
      </Modal>
    </div>
  )
}

function InsuranceTab() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [form, setForm] = useState({ provider:'', policyNo:'', type:'Family Floater', coverAmount:'', premium:'', validFrom:'', validTo:'', membersName:'', emergencyNo:'' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'

  const load = () => {
    patientApi.getInsurance()
      .then(res => setCards(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.provider || !form.policyNo) { toast.error('Provider and policy no required'); return }
    setSaving(true)
    try {
      await patientApi.addInsurance({ ...form, coverAmount: parseFloat(form.coverAmount)||0, premium: parseFloat(form.premium)||0 })
      toast.success('Insurance added')
      setModal(false)
      setForm({ provider:'', policyNo:'', type:'Family Floater', coverAmount:'', premium:'', validFrom:'', validTo:'', membersName:'', emergencyNo:'' })
      load()
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const handleUpload = async (cardId, files) => {
    if (!files || files.length === 0) return
    setUploadingId(cardId)
    try {
      const fd = new FormData()
      Array.from(files).forEach(f => fd.append('attachments', f))
      await patientApi.uploadInsuranceFiles(cardId, fd)
      toast.success('Attachment uploaded')
      load()
    } catch { toast.error('Upload failed') } finally { setUploadingId(null) }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> Add Insurance
        </button>
      </div>
      {loading ? <div className="text-center py-6 text-gray-400">Loading...</div> : !cards.length ? (
        <EmptyState icon="🛡️" title="No insurance cards" />
      ) : cards.map(c => (
        <div key={c.id} className="bg-white border border-primary-100 rounded-2xl shadow-card overflow-hidden">
          {/* Card header — gradient */}
          <div className="bg-gradient-to-br from-primary-800 to-violet-700 text-white p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs opacity-70 font-bold uppercase">Insurance</p>
                <p className="text-sm font-black">{c.provider}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status==='active'?'bg-green-400/30 text-green-200':'bg-red-400/30 text-red-200'}`}>{c.status}</span>
            </div>
            <p className="text-lg font-black">{c.policyNo}</p>
            <div className="flex justify-between mt-2 text-xs opacity-80">
              <span>{c.type}</span>
              <span>{c.validFrom && `${c.validFrom} → ${c.validTo}`}</span>
            </div>
            {c.coverAmount > 0 && <p className="text-xs opacity-70 mt-1">Cover: ₹{Number(c.coverAmount).toLocaleString('en-IN')}</p>}
          </div>
          {/* Attachments section */}
          <div className="px-4 py-3 bg-gray-50 border-t border-primary-50">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Paperclip size={10}/> Attachments</p>
            {c.attachments && c.attachments.split(',').filter(Boolean).length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {c.attachments.split(',').filter(Boolean).map((filename, i) => {
                  const url = `${BASE_URL}/uploads/${filename}`
                  const isPdf = filename.toLowerCase().endsWith('.pdf')
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] bg-white border border-primary-200 text-primary-700 font-semibold px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors">
                      {isPdf ? '📄' : '🖼️'} {filename.replace(/^healfocus_\d+_[a-f0-9]+/, 'File')}
                    </a>
                  )
                })}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 mb-2">No attachments yet</p>
            )}
            <label className={`flex items-center gap-1.5 w-fit cursor-pointer px-2.5 py-1 text-xs font-bold border border-dashed border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors ${uploadingId === c.id ? 'opacity-50 pointer-events-none' : ''}`}>
              <Paperclip size={11}/>
              {uploadingId === c.id ? 'Uploading...' : 'Upload Insurance'}
              <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" multiple
                onChange={e => handleUpload(c.id, e.target.files)} />
            </label>
          </div>
        </div>
      ))}
      <Modal open={modal} onClose={() => setModal(false)} title="🛡️ Add Insurance">
        <FormGroup label="Provider *"><Input placeholder="Star Health, Apollo etc." value={form.provider} onChange={set('provider')} /></FormGroup>
        <FormGroup label="Policy No *"><Input placeholder="Policy number" value={form.policyNo} onChange={set('policyNo')} /></FormGroup>
        <FormGroup label="Type"><Select value={form.type} onChange={set('type')}>{['Family Floater','Individual','Senior Citizen','Group'].map(t=><option key={t}>{t}</option>)}</Select></FormGroup>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Cover Amount (₹)"><Input type="number" placeholder="500000" value={form.coverAmount} onChange={set('coverAmount')} /></FormGroup>
          <FormGroup label="Annual Premium (₹)"><Input type="number" placeholder="18000" value={form.premium} onChange={set('premium')} /></FormGroup>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Valid From"><Input type="date" value={form.validFrom} onChange={set('validFrom')} /></FormGroup>
          <FormGroup label="Valid To"><Input type="date" value={form.validTo} onChange={set('validTo')} /></FormGroup>
        </div>
        <FormGroup label="Members Covered"><Input placeholder="Names of covered members" value={form.membersName} onChange={set('membersName')} /></FormGroup>
        <FormGroup label="Emergency No"><Input placeholder="1800-xxx-xxxx" value={form.emergencyNo} onChange={set('emergencyNo')} /></FormGroup>
        <Button onClick={save} loading={saving}>Add Insurance</Button>
      </Modal>
    </div>
  )
}

// ─── Insurance Claims Tab ──────────────────────────────────────────────────────
const BASE_URL_CLAIMS = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

function InsuranceClaimsTab() {
  const [claims, setClaims] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const BLANK = { insuranceId: '', claimNo: '', date: today(), hospital: '', reason: '', amount: '' }
  const [form, setForm] = useState(BLANK)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleUpload = async (claimId, files) => {
    if (!files || files.length === 0) return
    const fd = new FormData()
    Array.from(files).forEach(f => fd.append('attachments', f))
    setUploadingId(claimId)
    try {
      await patientApi.uploadClaimFiles(claimId, fd)
      toast.success('Attachment uploaded')
      load()
    } catch { toast.error('Upload failed') } finally { setUploadingId(null) }
  }

  const STATUS_COLOR = {
    processing: 'bg-amber-100 text-amber-700',
    approved:   'bg-green-100 text-green-700',
    rejected:   'bg-red-100 text-red-700',
  }
  const STATUS_ICON = { processing: '⏳', approved: '✅', rejected: '❌' }

  const load = () => {
    setLoading(true)
    Promise.all([patientApi.getInsuranceClaims(), patientApi.getInsurance()])
      .then(([clRes, cardRes]) => {
        setClaims(clRes.data?.data || [])
        setCards(cardRes.data?.data || [])
      })
      .catch(() => toast.error('Failed to load claims'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.claimNo || !form.date || !form.hospital) {
      toast.error('Claim no, date and hospital required')
      return
    }
    setSaving(true)
    try {
      await patientApi.addInsuranceClaim({
        ...form,
        amount: form.amount ? parseFloat(form.amount) : undefined,
      })
      toast.success('Claim submitted')
      setModal(false)
      setForm(BLANK)
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to submit')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> File Claim
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-400">Loading...</div>
      ) : !claims.length ? (
        <EmptyState icon="📋" title="No insurance claims filed" />
      ) : claims.map(c => (
        <div key={c.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-black text-primary-950">{c.claimNo}</p>
              <p className="text-[11px] text-gray-500">{c.hospital} · {fmtDate(c.date)}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_ICON[c.status]} {c.status}
            </span>
          </div>
          {c.reason && <p className="text-xs text-gray-600 mb-2">{c.reason}</p>}
          <div className="flex gap-4 text-xs">
            {c.amount && (
              <div>
                <span className="text-gray-400">Claimed: </span>
                <span className="font-bold text-gray-800">₹{Number(c.amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            {c.approvedAmount != null && (
              <div>
                <span className="text-gray-400">Approved: </span>
                <span className="font-bold text-green-700">₹{Number(c.approvedAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
          {c.remarks && <p className="text-[11px] text-gray-400 mt-2 italic">{c.remarks}</p>}

          {/* ── Claim Attachment Upload ── */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Paperclip size={10}/> Attachments</p>
            {c.attachments && c.attachments.split(',').filter(Boolean).length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {c.attachments.split(',').filter(Boolean).map((filename, i) => {
                  const url = `${BASE_URL_CLAIMS}/uploads/${filename}`
                  const isPdf = filename.toLowerCase().endsWith('.pdf')
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] bg-gray-50 border border-gray-200 text-gray-700 font-semibold px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                      {isPdf ? '📄' : '🖼️'} {filename.replace(/^healfocus_\d+_[a-f0-9]+/, 'File')}
                    </a>
                  )
                })}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 mb-2">No attachments yet</p>
            )}
            <label className={`flex items-center gap-1.5 w-fit cursor-pointer px-2.5 py-1 text-xs font-bold border border-dashed border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors ${uploadingId === c.id ? 'opacity-50 pointer-events-none' : ''}`}>
              <Paperclip size={11}/>
              {uploadingId === c.id ? 'Uploading...' : 'Upload Claim'}
              <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" multiple
                onChange={e => handleUpload(c.id, e.target.files)} />
            </label>
          </div>
        </div>
      ))}

      <Modal open={modal} onClose={() => setModal(false)} title="📋 File Insurance Claim">
        {cards.length > 0 && (
          <FormGroup label="Insurance Policy">
            <Select value={form.insuranceId} onChange={set('insuranceId')}>
              <option value="">-- Select policy --</option>
              {cards.map(c => <option key={c.id} value={c.id}>{c.provider} · {c.policyNo}</option>)}
            </Select>
          </FormGroup>
        )}
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Claim No *"><Input placeholder="CLM-2026-XXXX" value={form.claimNo} onChange={set('claimNo')} /></FormGroup>
          <FormGroup label="Date *"><Input type="date" value={form.date} onChange={set('date')} /></FormGroup>
        </div>
        <FormGroup label="Hospital *"><Input placeholder="Hospital name" value={form.hospital} onChange={set('hospital')} /></FormGroup>
        <FormGroup label="Reason / Diagnosis"><Textarea placeholder="Reason for claim..." value={form.reason} onChange={set('reason')} /></FormGroup>
        <FormGroup label="Claim Amount (₹)"><Input type="number" placeholder="85000" value={form.amount} onChange={set('amount')} /></FormGroup>
        <Button onClick={save} loading={saving}>Submit Claim</Button>
      </Modal>
    </div>
  )
}
