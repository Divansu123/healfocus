import { clsx } from 'clsx'

export const cn = (...inputs) => clsx(inputs)
export const fmtMoney = (n) => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '—'
export const today = () => new Date().toISOString().split('T')[0]
export const nowTime = () => new Date().toTimeString().slice(0, 5)
export const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const bsStatus = (v) => {
  if (v < 70)   return { label: 'Low',         color: 'text-amber-600', bg: 'bg-amber-50',  dot: '#f59e0b' }
  if (v <= 99)  return { label: 'Normal',       color: 'text-green-600', bg: 'bg-green-50',  dot: '#22c55e' }
  if (v <= 125) return { label: 'Pre-diabetic', color: 'text-amber-600', bg: 'bg-amber-50',  dot: '#f59e0b' }
  if (v <= 199) return { label: 'High',         color: 'text-red-600',   bg: 'bg-red-50',    dot: '#ef4444' }
  return              { label: 'Critical',      color: 'text-red-700',   bg: 'bg-red-100',   dot: '#dc2626' }
}

export const bpStatus = (sys, dia) => {
  if (sys < 90 || dia < 60)    return { label: 'Low BP',     color: 'text-amber-600', bg: 'bg-amber-50' }
  if (sys <= 120 && dia <= 80) return { label: 'Normal',     color: 'text-green-600', bg: 'bg-green-50' }
  if (sys <= 129 && dia <= 80) return { label: 'Elevated',   color: 'text-amber-600', bg: 'bg-amber-50' }
  if (sys >= 180 || dia >= 120)return { label: 'Crisis',     color: 'text-red-700',   bg: 'bg-red-100' }
  if (sys <= 139 || dia <= 89) return { label: 'High Stg 1', color: 'text-red-600',   bg: 'bg-red-50' }
  return                              { label: 'High Stg 2', color: 'text-red-600',   bg: 'bg-red-50' }
}

export const recTypeIcon = (t) => ({
  'Lab Report': '🧪', 'Prescription': '💊', 'Radiology': '🩻',
  'Discharge Summary': '📋', 'Vaccination': '💉', 'Dental': '🦷',
  'Eye Report': '👁️', 'Other': '📄',
}[t] || '📄')

export const recTypeBg = (t) => ({
  'Lab Report': '#e8f0fe', 'Prescription': '#e6f4ed', 'Radiology': '#f3e8ff',
  'Discharge Summary': '#fff3e0', 'Vaccination': '#fdecea', 'Dental': '#e0f2f1',
  'Eye Report': '#f3e8ff', 'Other': '#eef2ff',
}[t] || '#eef2ff')

export const statusBadge = (status) => ({
  pending:       'bg-amber-100 text-amber-700',
  confirmed:     'bg-green-100 text-green-700',
  completed:     'bg-primary-100 text-primary-700',
  cancelled:     'bg-red-100 text-red-700',
  approved:      'bg-green-100 text-green-700',
  rejected:      'bg-red-100 text-red-700',
  reviewing:     'bg-blue-100 text-blue-700',
  resolved:      'bg-green-100 text-green-700',
  waiting:       'bg-amber-100 text-amber-700',
  'in-progress': 'bg-primary-100 text-primary-700',
  active:        'bg-green-100 text-green-700',
  suspended:     'bg-red-100 text-red-700',
  draft:         'bg-gray-100 text-gray-600',
  final:         'bg-primary-100 text-primary-700',
  processing:    'bg-blue-100 text-blue-700',
  due:           'bg-amber-100 text-amber-700',
  done:          'bg-green-100 text-green-700',
  overdue:       'bg-red-100 text-red-700',
  upcoming:      'bg-primary-100 text-primary-700',
}[status] || 'bg-gray-100 text-gray-600')

export const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const capitalize = (s) => s ? s[0].toUpperCase() + s.slice(1) : ''
export const initials = (name) => name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
