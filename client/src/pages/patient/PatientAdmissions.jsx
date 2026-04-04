import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar, Modal, FormGroup, Input, Select, Textarea, Button, Badge, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { patientApi, publicApi } from '@/api'

export default function PatientAdmissions() {
  const navigate = useNavigate()
  const [admissions, setAdmissions] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type:'Surgery', treatmentName:'', hospitalId:'', preferredDate:'', urgency:'planned', notes:'' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const BLANK_FORM = { type:'Surgery', treatmentName:'', hospitalId:'', preferredDate:'', urgency:'planned', notes:'' }

  const load = () => {
    setLoading(true)
    Promise.all([patientApi.getAdmissions(), publicApi.getHospitals()])
      .then(([admRes, hospRes]) => {
        setAdmissions(admRes.data?.data || [])
        setHospitals(hospRes.data?.data || [])
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!form.treatmentName || !form.preferredDate) {
      toast.error('Treatment name and date required')
      return
    }
    setSaving(true)
    try {
      // Backend expects 'hospital' as a string name, not hospitalId
      const selectedHospital = hospitals.find(h => String(h.id) === String(form.hospitalId))
      const payload = {
        type: form.type,
        treatmentName: form.treatmentName,
        hospital: selectedHospital ? selectedHospital.name : (form.hospitalId || ''),
        preferredDate: form.preferredDate,
        urgency: form.urgency,
        notes: form.notes,
      }
      await patientApi.requestAdmission(payload)
      toast.success('Admission request submitted!')
      setModal(false)
      setForm(BLANK_FORM)
      load()
    } catch { toast.error('Failed to submit') } finally { setSaving(false) }
  }

  const STATUS_COLOR = {
    pending:   'bg-amber-100 text-amber-700',
    reviewing: 'bg-blue-100 text-blue-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-700',
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="Admissions" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">
        <div className="flex justify-end mb-4">
          <button onClick={() => setModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
            <Plus size={12} /> Request Admission
          </button>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : !admissions.length ? (
          <EmptyState icon="🏥" title="No admission requests" desc="Request an admission to get started" />
        ) : (
          <div className="space-y-3">
            {admissions.map(a => (
              <div key={a.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-black text-primary-950">{a.treatmentName}</p>
                    <p className="text-xs text-gray-500">{a.type} · {a.hospital || '—'}</p>
                    <p className="text-xs text-gray-400">Preferred: {fmtDate(a.preferredDate)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                </div>
                {a.urgency && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.urgency === 'urgent' ? 'bg-red-100 text-red-700' : a.urgency === 'semi-urgent' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{a.urgency}</span>
                )}
                {a.notes && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{a.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="🏥 Request Admission">
        <FormGroup label="Treatment Type">
          <Select value={form.type} onChange={set('type')}>
            {['Surgery','Chemotherapy','Physiotherapy','Maternity','ICU Care','General Ward','Other'].map(t => <option key={t}>{t}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Treatment Name *"><Input placeholder="e.g. Cardiac Bypass Surgery" value={form.treatmentName} onChange={set('treatmentName')} /></FormGroup>
        <FormGroup label="Preferred Hospital">
          <Select value={form.hospitalId} onChange={set('hospitalId')}>
            <option value="">Select Hospital</option>
            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Preferred Date *"><Input type="date" value={form.preferredDate} onChange={set('preferredDate')} /></FormGroup>
        <FormGroup label="Urgency">
          <Select value={form.urgency} onChange={set('urgency')}>
            {['planned','semi-urgent','urgent'].map(u => <option key={u}>{u}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Additional Notes"><Textarea placeholder="Any additional info..." value={form.notes} onChange={set('notes')} /></FormGroup>
        <Button onClick={submit} loading={saving}>Submit Request</Button>
      </Modal>
    </div>
  )
}
