import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi, publicApi } from '@/api'
import { Button, FormGroup, Input, Select } from '@/components/ui'
import { today } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('patient')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '',
    age: '', gender: 'Male', bloodType: 'O+', city: '', allergies: '', conditions: '',
    hospitalName: '', hospitalCity: '', hospitalPhone: '', hospitalEmail: '',
    hospitalBeds: '', hospitalAddress: '', hospitalType: 'Multi Speciality', hospitalContact: '',
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await authApi.login({
        email: form.email,
        password: form.password,
      })

      const user = res.data?.data?.user
      const token = res.data?.data?.accessToken

      setAuth(user, token)

      navigate(
        user.role === 'patient'
          ? '/patient'
          : user.role === 'hospital'
            ? '/hospital'
            : '/admin'
      )

      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()

    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)

    try {
      await authApi.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        age: form.age,
        gender: form.gender,
        bloodType: form.bloodType,
        city: form.city,
        allergies: form.allergies,
        conditions: form.conditions,
      })

      toast.success('Account created! Please login.')
      setMode('login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleHospSignup = async (e) => {
    e.preventDefault()

    if (!form.hospitalName || !form.hospitalPhone || !form.hospitalCity) {
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)

    try {
      await publicApi.registerHospital({
        name: form.hospitalName,
        email: form.hospitalEmail || form.email,
        city: form.hospitalCity,
        address: form.hospitalAddress,
        phone: form.hospitalPhone,
        beds: form.hospitalBeds ? parseInt(form.hospitalBeds) : undefined,
        type: form.hospitalType,
        contact: form.hospitalContact,
      })

      toast.success('Application submitted! Admin will review within 24–48 hrs.')
      setMode('login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hospital registration failed')
    } finally {
      setLoading(false)
    }
  }

  const ROLES = [
    { id: 'patient', icon: '🧑‍🤝‍🧑', label: 'Patient', desc: 'Appointments, records & health' },
    { id: 'hospital', icon: '🏥', label: 'Hospital Staff', desc: 'Manage appointments & patients' },
    { id: 'admin', icon: '🛡️', label: 'Admin', desc: 'Full oversight & analytics' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-800 to-violet-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-card-md">⚕️</div>
          <h1 className="text-2xl font-black text-primary-950 tracking-tight">Heal<span className="text-primary-500">Focus</span></h1>
          <p className="text-sm text-gray-500 mt-1">Smart Healthcare Platform</p>
        </div>

        {/* Login */}
        {mode === 'login' && (
          <div className="bg-white rounded-3xl p-6 shadow-card-lg fade-in">
            <h2 className="text-lg font-bold text-primary-950 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-5">Sign in to your account</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${role === r.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="text-xl mb-1">{r.icon}</div>
                  <div className="text-[10px] font-bold text-gray-700 leading-tight">{r.label}</div>
                </button>
              ))}
            </div>
            <form onSubmit={handleLogin}>
              <FormGroup label="Email"><Input type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required /></FormGroup>
              <FormGroup label="Password"><Input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required /></FormGroup>
              <Button type="submit" loading={loading} className="mt-2">Sign In →</Button>
            </form>
            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-gray-500">New patient? <button onClick={() => setMode('signup')} className="text-primary-600 font-bold hover:underline">Create account</button></p>
              <p className="text-sm text-gray-500">New hospital? <button onClick={() => setMode('hospSignup')} className="text-green-600 font-bold hover:underline">Apply to join</button></p>
            </div>

          </div>
        )}

        {/* Patient Signup */}
        {mode === 'signup' && (
          <div className="bg-white rounded-3xl p-6 shadow-card-lg fade-in">
            <button onClick={() => setMode('login')} className="text-primary-600 text-sm font-bold mb-4 flex items-center gap-1">← Back</button>
            <h2 className="text-lg font-bold text-primary-950 mb-4">Create Patient Account</h2>
            <form onSubmit={handleSignup}>
              <FormGroup label="Full Name *"><Input placeholder="Your full name" value={form.name} onChange={set('name')} required /></FormGroup>
              <FormGroup label="Email *"><Input type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required /></FormGroup>
              <FormGroup label="Phone *"><Input placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} required /></FormGroup>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Age"><Input type="number" placeholder="25" value={form.age} onChange={set('age')} /></FormGroup>
                <FormGroup label="Gender"><Select value={form.gender} onChange={set('gender')}>{['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}</Select></FormGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Blood Type"><Select value={form.bloodType} onChange={set('bloodType')}>{['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => <option key={b}>{b}</option>)}</Select></FormGroup>
                <FormGroup label="City"><Input placeholder="City" value={form.city} onChange={set('city')} /></FormGroup>
              </div>
              <FormGroup label="Password *"><Input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required /></FormGroup>
              <Button type="submit" loading={loading}>Create Account</Button>
            </form>
          </div>
        )}

        {/* Hospital Signup */}
        {mode === 'hospSignup' && (
          <div className="bg-white rounded-3xl p-6 shadow-card-lg fade-in">
            <button onClick={() => setMode('login')} className="text-primary-600 text-sm font-bold mb-4 flex items-center gap-1">← Back</button>
            <h2 className="text-lg font-bold text-primary-950 mb-1">Register Your Hospital</h2>
            <p className="text-xs text-gray-500 mb-4">Admin will review within 24–48 hours</p>
            <form onSubmit={handleHospSignup}>
              <FormGroup label="Hospital Name *"><Input placeholder="e.g. Apollo Hospital" value={form.hospitalName} onChange={set('hospitalName')} required /></FormGroup>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="City *"><Input placeholder="Faridabad" value={form.hospitalCity} onChange={set('hospitalCity')} required /></FormGroup>
                <FormGroup label="Beds"><Input type="number" placeholder="100" value={form.hospitalBeds} onChange={set('hospitalBeds')} /></FormGroup>
              </div>
              <FormGroup label="Hospital Type">
                <Select value={form.hospitalType} onChange={set('hospitalType')}>
                  {['Multi Speciality', 'Super Speciality', 'General', 'Clinic', 'Nursing Home'].map(t => <option key={t}>{t}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Address"><Input placeholder="Full address" value={form.hospitalAddress} onChange={set('hospitalAddress')} /></FormGroup>
              <FormGroup label="Phone *"><Input placeholder="+91 98765 43210" value={form.hospitalPhone} onChange={set('hospitalPhone')} required /></FormGroup>
              <FormGroup label="Email"><Input type="email" placeholder="hospital@email.com" value={form.hospitalEmail} onChange={set('hospitalEmail')} /></FormGroup>
              <FormGroup label="Contact Person"><Input placeholder="Dr. / Mr. / Ms." value={form.hospitalContact} onChange={set('hospitalContact')} /></FormGroup>
              <Button type="submit" loading={loading}>Submit Registration</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
