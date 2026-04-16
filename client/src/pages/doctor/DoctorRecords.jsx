import { useState, useEffect } from 'react'
import { PageTitle, EmptyState } from '@/components/ui'
import { Search, ChevronLeft, Lock, Unlock, FileText, RefreshCw } from 'lucide-react'
import { hospitalApi } from '@/api'
import toast from 'react-hot-toast'

const REC_TYPE_ICON = {
  'Lab Report': '🧪', 'Prescription': '💊', 'Radiology': '🩻',
  'Discharge Summary': '📋', 'Vaccination': '💉', 'Dental': '🦷',
  'Eye Report': '👁️', 'Other': '📄',
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

export default function DoctorRecords() {
  const [patients, setPatients]       = useState([])
  const [consents, setConsents]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [selectedPat, setSelectedPat] = useState(null)
  const [records, setRecords]         = useState([])
  const [recLoading, setRecLoading]   = useState(false)
  const [requesting, setRequesting]   = useState(false)
  const [tab, setTab]                 = useState('patients') // 'patients' | 'consent'

  const load = () => {
    setLoading(true)
    Promise.all([hospitalApi.getPatients(), hospitalApi.getConsentRequests()])
      .then(([pRes, cRes]) => {
        setPatients(pRes.data?.data || [])
        setConsents(cRes.data?.data || [])
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const hasConsent = (patientId) =>
    consents.some(c => c.patientId === patientId && c.status === 'approved')

  const hasPending = (patientId) =>
    consents.some(c => c.patientId === patientId && c.status === 'pending')

  const openRecords = async (pat) => {
    setSelectedPat(pat)
    setRecords([])
    setRecLoading(true)
    try {
      const res = await hospitalApi.getPatientRecords(pat.id)
      setRecords(res.data?.data || [])
    } catch (e) {
      if (e?.response?.status === 403) {
        toast.error('Patient has not granted consent yet')
      } else {
        toast.error('Failed to load records')
      }
    } finally {
      setRecLoading(false)
    }
  }

  const requestConsent = async (patientId) => {
    setRequesting(true)
    try {
      await hospitalApi.requestPatientConsent({
        patientId,
        purpose: 'Medical record access for treatment and care',
      })
      toast.success('✅ Consent request sent to patient')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to send request')
    } finally {
      setRequesting(false)
    }
  }

  const filtered = patients.filter(p =>
    !search ||
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.phone?.includes(search)
  )

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedPat) {
    const granted = hasConsent(selectedPat.id)
    const pending = hasPending(selectedPat.id)

    return (
      <div>
        <button
          onClick={() => setSelectedPat(null)}
          className="flex items-center gap-1 text-primary-600 text-sm font-bold mb-4"
        >
          <ChevronLeft size={16} /> Back to Patients
        </button>

        {/* Patient header */}
        <div className="bg-white border border-primary-100 rounded-2xl p-5 shadow-card mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center text-2xl">👤</div>
            <div>
              <p className="text-base font-black text-primary-950">{selectedPat.user?.name || '—'}</p>
              <p className="text-xs text-gray-500">{selectedPat.user?.email}</p>
            </div>
            <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${granted ? 'bg-green-100 text-green-700' : pending ? 'bg-amber-100 text-amber-700' : 'bg-red-50 text-red-600'}`}>
              {granted ? <><Unlock size={11} /> Access Granted</> : pending ? <>⏳ Pending</> : <><Lock size={11} /> No Access</>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ['Blood Type', selectedPat.bloodType || selectedPat.patient?.bloodType || '—'],
              ['Age', (selectedPat.age || selectedPat.patient?.age || '—') + (selectedPat.age ? 'y' : '')],
              ['City', selectedPat.city || selectedPat.patient?.city || '—'],
            ].map(([l, v]) => (
              <div key={l} className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">{l}</p>
                <p className="text-xs font-bold text-gray-700 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Consent gating */}
        {!granted ? (
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-card text-center">
            <div className="text-5xl mb-3">🔐</div>
            <p className="text-base font-black text-gray-900 mb-1">Consent Required</p>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed max-w-xs mx-auto">
              Under the DPDP Act 2023, you need the patient's explicit consent to view their medical records.
            </p>
            {pending ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                <p className="text-xs font-bold text-amber-700">⏳ Consent request already sent — waiting for patient approval</p>
              </div>
            ) : (
              <button
                onClick={() => requestConsent(selectedPat.id)}
                disabled={requesting}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-sm font-bold rounded-2xl disabled:opacity-50"
              >
                {requesting ? 'Sending...' : '📨 Request Access'}
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-black text-gray-800">📋 Medical Records</p>
              <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
                {records.length} record{records.length !== 1 ? 's' : ''}
              </span>
            </div>

            {recLoading ? (
              <div className="text-center py-10 text-gray-400 text-sm">Loading records...</div>
            ) : records.length === 0 ? (
              <EmptyState icon="📋" title="No records found" subtitle="This patient has no medical records yet" />
            ) : (
              <div className="space-y-3">
                {records.map(r => {
                  const attachList = r.attachments ? r.attachments.split(',').filter(Boolean) : []
                  const SERVER_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
                  return (
                  <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-lg flex-shrink-0">
                        {REC_TYPE_ICON[r.type] || '📄'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-bold text-primary-950">{r.title}</p>
                          <span className="text-[10px] bg-primary-50 text-primary-600 border border-primary-100 px-2 py-0.5 rounded-full font-bold">
                            {r.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">📅 {fmtDate(r.date)} • {r.hospital || '—'}</p>
                        {r.doctor && <p className="text-xs text-gray-400 mt-0.5">👨‍⚕️ {r.doctor}</p>}
                        {r.summary && (
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed bg-gray-50 rounded-xl p-2">
                            {r.summary}
                          </p>
                        )}
                        {r.tags?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {(Array.isArray(r.tags) ? r.tags : r.tags.split(',')).map(tag => (
                              <span key={tag} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-bold">
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* ── Attachments ── */}
                        {attachList.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">📎 Attachments ({attachList.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {attachList.map((filename, i) => {
                                const ext = filename.split('.').pop().toLowerCase()
                                const isPdf = ext === 'pdf'
                                const fileUrl = `${SERVER_BASE}/uploads/${filename}`
                                return (
                                  <div key={i} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-xl px-2.5 py-1.5">
                                    <span className="text-sm">{isPdf ? '📄' : '🖼️'}</span>
                                    <span className="text-[10px] font-bold text-indigo-700 max-w-[80px] truncate">
                                      {isPdf ? `PDF ${i + 1}` : `Image ${i + 1}`}
                                    </span>
                                    <div className="flex gap-1 ml-1">
                                      {/* View */}
                                      <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 rounded-lg px-1.5 py-0.5 transition-colors"
                                        title="View">
                                        👁️
                                      </a>
                                      {/* Download */}
                                      <a href={fileUrl} download={filename}
                                        className="text-[10px] font-bold text-green-600 hover:text-green-800 bg-white border border-green-200 rounded-lg px-1.5 py-0.5 transition-colors"
                                        title="Download">
                                        ⬇️
                                      </a>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <PageTitle icon="📁">Patient Records</PageTitle>
        <button onClick={load} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all">
          <RefreshCw size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[['patients', '👥 Patients'], ['consent', '🔐 Consent Log']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${tab === v ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-200 text-gray-600'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'patients' && (
        <>
          {/* DPDP notice */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-indigo-700 mb-1">🔐 DPDP Act 2023 — Consent Required</p>
            <p className="text-[11px] text-indigo-600 leading-relaxed">
              You can only view patient records after the patient grants explicit consent. Click a patient to request or view access.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : !filtered.length ? (
            <EmptyState icon="👥" title="No patients found" />
          ) : (
            <div className="space-y-2">
              {filtered.map(p => {
                const granted = hasConsent(p.id)
                const pending = hasPending(p.id)
                return (
                  <div key={p.id}
                    onClick={() => openRecords(p)}
                    className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card cursor-pointer hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl border border-primary-200 flex-shrink-0">👤</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-primary-950">{p.user?.name || p.name || '—'}</p>
                        <p className="text-xs text-gray-400">{p.user?.email || p.email}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {(p.bloodType || p.patient?.bloodType) && (
                            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                              {p.bloodType || p.patient?.bloodType}
                            </span>
                          )}
                          {(p.age || p.patient?.age) && (
                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                              {p.age || p.patient?.age}y
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${
                        granted ? 'bg-green-100 text-green-700' :
                        pending ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {granted ? <><Unlock size={9} /> Access</> :
                         pending ? <>⏳ Pending</> :
                         <><Lock size={9} /> No Access</>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'consent' && (
        <>
          <p className="text-xs text-gray-500 mb-4">Consent requests sent by your hospital to patients.</p>
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : consents.length === 0 ? (
            <EmptyState icon="🔐" title="No consent requests yet" subtitle="Request access to a patient's records to get started" />
          ) : (
            <div className="space-y-2">
              {consents.map(c => (
                <div key={c.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{c.patient?.user?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{c.patient?.user?.email}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{c.purpose}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Requested: {fmtDate(c.requestedAt)}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${
                      c.status === 'approved' ? 'bg-green-100 text-green-700' :
                      c.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {c.status === 'approved' ? '✅ Approved' :
                       c.status === 'pending'  ? '⏳ Pending' :
                       '🚫 Denied'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
