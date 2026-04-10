import { useState, useEffect } from 'react'
import { PageTitle, EmptyState } from '@/components/ui'
import { Search, FileText, Lock, Unlock, ChevronLeft, RefreshCw } from 'lucide-react'
import { adminApi } from '@/api'
import toast from 'react-hot-toast'

const REC_TYPE_ICON = {
  'Lab Report': '🧪', 'Prescription': '💊', 'Radiology': '🩻',
  'Discharge Summary': '📋', 'Vaccination': '💉', 'Dental': '🦷',
  'Eye Report': '👁️', 'Other': '📄',
}
const REC_TYPE_BG = {
  'Lab Report': 'bg-blue-50', 'Prescription': 'bg-violet-50', 'Radiology': 'bg-slate-50',
  'Discharge Summary': 'bg-amber-50', 'Vaccination': 'bg-green-50', 'Dental': 'bg-cyan-50',
  'Eye Report': 'bg-indigo-50', 'Other': 'bg-gray-50',
}
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

export default function AdminRecords() {
  const [patients, setPatients]     = useState([])
  const [consents, setConsents]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selectedPat, setSelectedPat] = useState(null)
  const [records, setRecords]       = useState([])
  const [recLoading, setRecLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [tab, setTab]               = useState('patients') // 'patients' | 'consent'

  const load = () => {
    setLoading(true)
    Promise.all([adminApi.getPatients(), adminApi.getAllConsentRequests()])
      .then(([pRes, cRes]) => {
        setPatients(pRes.data?.data || [])
        setConsents(cRes.data?.data || [])
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Check if admin has approved consent for a patient
  const hasConsent = (patientId) =>
    consents.some(c => c.patientId === patientId && c.role === 'admin' && c.status === 'approved')

  const hasPending = (patientId) =>
    consents.some(c => c.patientId === patientId && c.role === 'admin' && c.status === 'pending')

  const openRecords = async (pat) => {
    setSelectedPat(pat)
    setRecords([])
    setRecLoading(true)
    try {
      const res = await adminApi.getPatientRecords(pat.id)
      setRecords(res.data?.data || [])
    } catch (e) {
      if (e?.response?.status === 403) {
        toast.error('Patient has not granted consent')
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
      await adminApi.requestPatientConsent({ patientId, purpose: 'Medical record review for administrative purposes' })
      toast.success('Consent request sent to patient')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to send request')
    } finally {
      setRequesting(false) }
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
        <button onClick={() => setSelectedPat(null)}
          className="flex items-center gap-1 text-primary-600 text-sm font-bold mb-4">
          <ChevronLeft size={16} /> Back to Patients
        </button>

        {/* Patient header */}
        <div className="bg-white border border-primary-100 rounded-2xl p-5 shadow-card mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-3xl border border-primary-200">👤</div>
            <div className="flex-1">
              <p className="text-base font-black text-primary-950">{selectedPat.user?.name}</p>
              <p className="text-xs text-gray-500">{selectedPat.user?.email}</p>
              <p className="text-xs text-gray-400">{selectedPat.user?.phone}</p>
            </div>
            {granted ? (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
                <Unlock size={10} /> Access Granted
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-600">
                <Lock size={10} /> No Consent
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              ['Age', selectedPat.age || selectedPat.patient?.age || '—'],
              ['Blood Type', selectedPat.bloodType || selectedPat.patient?.bloodType || '—'],
              ['City', selectedPat.city || selectedPat.patient?.city || '—'],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">{k}</p>
                <p className="font-bold text-gray-700 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Consent gate */}
        {!granted ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🔐</div>
            <p className="text-sm font-black text-gray-800 mb-1">Medical Records Locked</p>
            <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto leading-relaxed">
              You need the patient's consent to view their medical records. Send a consent request and the patient will approve it from their app.
            </p>
            {pending ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
                ⏳ Consent request pending — awaiting patient approval
              </div>
            ) : (
              <button
                onClick={() => requestConsent(selectedPat.id)}
                disabled={requesting}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white rounded-full text-sm font-bold disabled:opacity-60">
                {requesting ? 'Sending...' : '📨 Request Consent'}
              </button>
            )}
          </div>
        ) : recLoading ? (
          <div className="text-center py-10 text-gray-400">Loading records...</div>
        ) : !records.length ? (
          <EmptyState icon="📄" title="No medical records found for this patient" />
        ) : (
          <div>
            <p className="text-xs font-bold text-gray-500 mb-3">📄 Medical Records ({records.length})</p>
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${REC_TYPE_BG[r.type] || 'bg-gray-50'}`}>
                      {REC_TYPE_ICON[r.type] || '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-primary-950">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.type} · {fmtDate(r.date)}</p>
                      {r.doctor && <p className="text-xs text-gray-400">{r.doctor}</p>}
                      {r.summary && <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-3">{r.summary}</p>}
                      {r.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(typeof r.tags === 'string' ? r.tags.split(',') : r.tags).filter(Boolean).map(t => (
                            <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full">{t.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── List view ──────────────────────────────────────────────────────────────
  const pendingConsents = consents.filter(c => c.status === 'pending')
  const approvedConsents = consents.filter(c => c.status === 'approved')

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <PageTitle icon="📁">Patient Records</PageTitle>
        <button onClick={load} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary-600">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { id: 'patients', label: `👥 Patients (${patients.length})` },
          { id: 'consent',  label: `🔐 Consent Requests (${pendingConsents.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === t.id ? 'bg-primary-800 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'patients' && (
        <>
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500" />
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
                    className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card flex items-center gap-3 cursor-pointer hover:border-primary-300 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl border border-primary-200">👤</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary-950">{p.user?.name}</p>
                      <p className="text-xs text-gray-500">{p.user?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {granted ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          <Unlock size={9} /> Access
                        </span>
                      ) : pending ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⏳ Pending</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          <Lock size={9} /> Locked
                        </span>
                      )}
                      <FileText size={14} className="text-gray-300" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'consent' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : !consents.length ? (
            <EmptyState icon="🔐" title="No consent requests yet" />
          ) : (
            <>
              {pendingConsents.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-amber-700 mb-2">⏳ Pending ({pendingConsents.length})</p>
                  <div className="space-y-2">
                    {pendingConsents.map(c => (
                      <div key={c.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{c.patient?.user?.name || 'Patient'}</p>
                            <p className="text-xs text-gray-500">{c.patient?.user?.email}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{c.purpose}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">Pending</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                          Requested {c.requestedAt ? new Date(c.requestedAt).toLocaleDateString('en-IN') : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {approvedConsents.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-green-700 mb-2">✅ Approved ({approvedConsents.length})</p>
                  <div className="space-y-2">
                    {approvedConsents.map(c => (
                      <div key={c.id}
                        onClick={() => {
                          const pat = patients.find(p => p.id === c.patientId)
                          if (pat) { setTab('patients'); openRecords(pat) }
                        }}
                        className="bg-green-50 border border-green-200 rounded-2xl p-4 cursor-pointer hover:border-green-300 transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{c.patient?.user?.name || 'Patient'}</p>
                            <p className="text-xs text-gray-500">{c.patient?.user?.email}</p>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-green-700">
                            <Unlock size={10} /> View Records →
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {consents.filter(c => c.status === 'rejected' || c.status === 'denied').length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 mb-2">❌ Denied</p>
                  <div className="space-y-2">
                    {consents.filter(c => c.status === 'rejected' || c.status === 'denied').map(c => (
                      <div key={c.id} className="bg-red-50 border border-red-100 rounded-2xl p-4">
                        <p className="text-sm font-bold text-gray-800">{c.patient?.user?.name || 'Patient'}</p>
                        <p className="text-xs text-gray-500">{c.patient?.user?.email}</p>
                        <p className="text-[10px] text-red-500 mt-1">Patient denied access</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
