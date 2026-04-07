import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { TopBar, FormGroup, Input, Select, Button } from '@/components/ui'
import toast from 'react-hot-toast'
import { patientApi, authApi } from '@/api'

export default function PatientProfile() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuthStore()
  const [tab, setTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [consentRequests, setConsentRequests] = useState([])
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', email: user?.email || '',
    age: user?.age || '', gender: user?.gender || 'Male', bloodType: user?.bloodType || 'O+',
    city: user?.city || '', allergies: user?.allergies || '', conditions: user?.conditions || '',
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const loadConsents = () => {
    patientApi.getConsentRequests()
      .then(res => setConsentRequests(res.data?.data || []))
      .catch(() => {})
  }

  useEffect(() => { loadConsents() }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      await patientApi.updateProfile(form)
      updateUser(form)
      toast.success('Profile updated')
      setEditing(false)
    } catch { toast.error('Failed to update') } finally { setSaving(false) }
  }

  const respondConsent = async (id, status) => {
    try {
      await patientApi.respondToConsent(id, { status })
      toast.success(status === 'approved' ? '✅ Access granted' : '🚫 Access denied')
      setConsentRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch { toast.error('Failed') }
  }

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/')
  }

  const pending  = consentRequests.filter(r => r.status === 'pending')
  const approved = consentRequests.filter(r => r.status === 'approved')
  const denied   = consentRequests.filter(r => r.status === 'denied' || r.status === 'rejected')

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="My Profile" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          {[['profile','👤 Profile'],['consent','🔐 Privacy']].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${tab===v?'bg-primary-600 text-white border-primary-600':'bg-white border-gray-200 text-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="bg-white border border-primary-100 rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-3xl">👤</div>
              <div>
                <p className="text-base font-black text-primary-950">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            {editing ? (
              <>
                <FormGroup label="Name"><Input value={form.name} onChange={set('name')} /></FormGroup>
                <FormGroup label="Phone"><Input value={form.phone} onChange={set('phone')} /></FormGroup>
                <div className="grid grid-cols-2 gap-2">
                  <FormGroup label="Age"><Input type="number" value={form.age} onChange={set('age')} /></FormGroup>
                  <FormGroup label="Gender"><Select value={form.gender} onChange={set('gender')}>{['Male','Female','Other'].map(g => <option key={g}>{g}</option>)}</Select></FormGroup>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormGroup label="Blood Type"><Select value={form.bloodType} onChange={set('bloodType')}>{['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}</Select></FormGroup>
                  <FormGroup label="City"><Input value={form.city} onChange={set('city')} /></FormGroup>
                </div>
                <FormGroup label="Allergies"><Input value={form.allergies} onChange={set('allergies')} /></FormGroup>
                <FormGroup label="Medical Conditions"><Input value={form.conditions} onChange={set('conditions')} /></FormGroup>
                <div className="flex gap-2">
                  <Button onClick={saveProfile} loading={saving}>Save</Button>
                  <button onClick={() => setEditing(false)} className="flex-1 py-2 text-xs font-bold border border-gray-200 rounded-xl">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[['Age',user?.age||'—'],['Gender',user?.gender||'—'],['Blood Type',user?.bloodType||'—'],['City',user?.city||'—'],['Phone',user?.phone||'—'],['Allergies',user?.allergies||'None']].map(([k,v]) => (
                    <div key={k} className="bg-gray-50 rounded-xl p-2">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{k}</p>
                      <p className="text-xs font-bold text-gray-700 mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
                {user?.conditions && user.conditions !== 'None' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                    <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Medical Conditions</p>
                    <p className="text-xs text-amber-900">{user.conditions}</p>
                  </div>
                )}
                <button onClick={() => setEditing(true)} className="w-full py-2 text-xs font-bold bg-primary-50 border border-primary-200 text-primary-700 rounded-xl">✏️ Edit Profile</button>
                <button onClick={handleLogout} className="w-full mt-2 py-2 text-xs font-bold bg-red-50 border border-red-200 text-red-600 rounded-xl">🚪 Logout</button>
              </>
            )}
          </div>
        )}

        {/* ── PRIVACY / CONSENT TAB ── */}
        {tab === 'consent' && (
          <div className="space-y-4">
            {/* Hero */}
            <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#1e1b4b,#3730a3)' }}>
              <div className="text-4xl mb-2">🔐</div>
              <p className="text-base font-black mb-1">Your Privacy & Consent</p>
              <p className="text-xs opacity-80 leading-relaxed">Under the DPDP Act 2023, only you control who can view your medical records. Grant or revoke access anytime.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[['⏳ PENDING', pending.length, 'bg-amber-50 border-amber-200 text-amber-700'],
                ['✅ GRANTED', approved.length, 'bg-green-50 border-green-200 text-green-700'],
                ['🚫 DENIED',  denied.length,  'bg-red-50 border-red-200 text-red-700']].map(([l,n,cls]) => (
                <div key={l} className={`border rounded-xl p-3 text-center ${cls}`}>
                  <p className="text-xl font-black">{n}</p>
                  <p className="text-[10px] font-bold mt-0.5">{l}</p>
                </div>
              ))}
            </div>

            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <p className="text-sm font-black text-gray-800 mb-2">⏳ Pending Requests</p>
                {pending.map(req => (
                  <div key={req.id} className="bg-white border-2 border-amber-200 rounded-2xl p-4 mb-3 shadow-card">
                    <div className="flex gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-2xl flex-shrink-0">
                        {req.role === 'admin' ? '🏛️' : '🏥'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-gray-900">{req.requestedByName || req.hospName || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-500">{req.role === 'admin' ? 'Admin' : 'Hospital'} · Requested {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-IN') : ''}</p>
                        {req.purpose && (
                          <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                            <span className="font-bold">Purpose: </span>{req.purpose}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 text-xs text-amber-700">
                      ⚠️ Granting access lets {req.requestedByName || 'this party'} view your diagnoses, prescriptions and test results. You can revoke anytime.
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => respondConsent(req.id, 'rejected')}
                        className="flex-1 py-2.5 text-xs font-bold bg-red-50 border-2 border-red-200 text-red-600 rounded-xl">
                        🚫 Deny
                      </button>
                      <button onClick={() => respondConsent(req.id, 'approved')}
                        className="flex-2 flex-1 py-2.5 text-xs font-bold text-white rounded-xl"
                        style={{ background: 'linear-gradient(135deg,#1e8a4c,#34d399)' }}>
                        ✅ Grant Access
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approved */}
            {approved.length > 0 && (
              <div>
                <p className="text-sm font-black text-gray-800 mb-2">✅ Active Consents</p>
                {approved.map(req => (
                  <div key={req.id} className="bg-green-50 border border-green-200 rounded-2xl p-3.5 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-200 flex items-center justify-center text-xl flex-shrink-0">
                      {req.role === 'admin' ? '🏛️' : '🏥'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-green-800">{req.requestedByName || req.hospName || 'Unknown'}</p>
                      <p className="text-[10px] text-green-600">{req.role === 'admin' ? 'Admin' : 'Hospital'} access · Granted</p>
                    </div>
                    <button onClick={() => respondConsent(req.id, 'rejected')}
                      className="text-[10px] font-bold bg-red-50 border border-red-200 text-red-600 px-2.5 py-1.5 rounded-lg">
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Denied */}
            {denied.length > 0 && (
              <div>
                <p className="text-sm font-black text-gray-800 mb-2">🚫 Denied Requests</p>
                {denied.map(req => (
                  <div key={req.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 mb-2 flex items-center gap-3 opacity-70">
                    <div className="text-xl">{req.role === 'admin' ? '🏛️' : '🏥'}</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500 line-through">{req.requestedByName || req.hospName || 'Unknown'}</p>
                      <p className="text-[10px] text-gray-400">{req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-IN') : ''}</p>
                    </div>
                    <button onClick={() => respondConsent(req.id, 'pending')}
                      className="text-[10px] font-bold bg-primary-50 border border-primary-200 text-primary-600 px-2.5 py-1.5 rounded-lg">
                      Re-review
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {consentRequests.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-2">🔐</p>
                <p className="text-sm font-medium">No consent requests yet</p>
                <p className="text-xs mt-1">When a hospital or admin requests your records, it will appear here</p>
              </div>
            )}

            {/* DPDP notice */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-xs text-primary-700 leading-relaxed">
              🔒 Protected under DPDP Act 2023. No hospital or admin can access your records without explicit consent shown here.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
