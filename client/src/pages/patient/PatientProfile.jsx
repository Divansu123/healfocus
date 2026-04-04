import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { TopBar, FormGroup, Input, Select, Button } from '@/components/ui'
import toast from 'react-hot-toast'
import { patientApi, authApi } from '@/api'

export default function PatientProfile() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [consentRequests, setConsentRequests] = useState([])
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', email: user?.email || '',
    age: user?.age || '', gender: user?.gender || 'Male', bloodType: user?.bloodType || 'O+',
    city: user?.city || '', allergies: user?.allergies || '', conditions: user?.conditions || '',
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    patientApi.getConsentRequests()
      .then(res => setConsentRequests(res.data?.data || []))
      .catch(() => { })
  }, [])

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
      toast.success(status === 'approved' ? 'Access granted' : 'Access denied')
      setConsentRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch { toast.error('Failed') }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch { }
    logout()
    navigate('/')
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="My Profile" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          {[['profile', '👤 Profile'], ['consent', '🔐 Consent']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${tab === v ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-200 text-gray-600'}`}>{l}</button>
          ))}
        </div>

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
                  <FormGroup label="Gender"><Select value={form.gender} onChange={set('gender')}>{['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}</Select></FormGroup>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormGroup label="Blood Type"><Select value={form.bloodType} onChange={set('bloodType')}>{['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => <option key={b}>{b}</option>)}</Select></FormGroup>
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
                  {[
                    ['Age', user?.age || '—'],
                    ['Gender', user?.gender || '—'],
                    ['Blood Type', user?.bloodType || '—'],
                    ['City', user?.city || '—'],
                    ['Phone', user?.phone || '—'],
                    ['Allergies', user?.allergies || 'None'],
                  ].map(([k, v]) => (
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

        {tab === 'consent' && (
          <div className="space-y-3">
            {!consentRequests.length ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">🔐</p>
                <p className="text-sm">No consent requests</p>
              </div>
            ) : consentRequests.map(r => (
              <div key={r.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
                <p className="text-sm font-black text-primary-950">{r.requestedByName || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{r.purpose}</p>
                <p className="text-[10px] text-gray-400 mt-1">{r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('en-IN') : ''}</p>
                {r.status === 'pending' ? (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => respondConsent(r.id, 'approved')} className="flex-1 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg">Allow Access</button>
                    <button onClick={() => respondConsent(r.id, 'rejected')} className="flex-1 py-1.5 text-xs font-bold bg-red-100 text-red-600 rounded-lg">Deny</button>
                  </div>
                ) : (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
