import { useState, useEffect } from 'react'
import { Tabs, Modal, FormGroup, Input, Select, Textarea, Button, Badge, PageTitle, EmptyState } from '@/components/ui'
import { fmtDate, today } from '@/lib/utils'
import { Plus, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { hospitalApi } from '@/api'

const BLANK = { patientName:'',patientAge:'',diagnosisCode:'',primaryDiagnosis:'',admissionDate:'',dischargeDate:'',insuranceProvider:'',policyNo:'',roomType:'General Ward',treatmentSummary:'',followUpDate:'',attendingDoctor:'' }

export default function DoctorDischarge() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('list')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(BLANK)
  const set = (k) => (e) => setForm(f => ({...f,[k]:e.target.value}))

  const load = () => {
    setLoading(true)
    hospitalApi.getDischargeSummaries()
      .then(res => setSummaries(res.data?.data || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.patientName || !form.primaryDiagnosis) { toast.error('Patient name and diagnosis required'); return }
    setSaving(true)
    try {
      if (editing) { await hospitalApi.updateDischargeSummary(editing.id, form); toast.success('Updated') }
      else { await hospitalApi.createDischargeSummary(form); toast.success('Summary created') }
      setModal(false); setEditing(null); setForm(BLANK); load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageTitle icon="📋">Discharge Summaries</PageTitle>
        <button onClick={() => { setEditing(null); setForm(BLANK); setModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> New Summary
        </button>
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !summaries.length ? <EmptyState icon="📋" title="No discharge summaries" /> : (
        <div className="space-y-3">
          {summaries.map(d => (
            <div key={d.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-black text-primary-950">{d.patientName}</p>
                  <p className="text-xs text-gray-600 font-medium">{d.primaryDiagnosis}</p>
                  <p className="text-xs text-gray-400">{fmtDate(d.admissionDate)} → {fmtDate(d.dischargeDate)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(d); setForm({patientName:d.patientName||'',patientAge:String(d.patientAge||''),diagnosisCode:d.diagnosisCode||'',primaryDiagnosis:d.primaryDiagnosis||'',admissionDate:d.admissionDate||'',dischargeDate:d.dischargeDate||'',insuranceProvider:d.insuranceProvider||'',policyNo:d.policyNo||'',roomType:d.roomType||'General Ward',treatmentSummary:d.treatmentSummary||'',followUpDate:d.followUpDate||'',attendingDoctor:d.attendingDoctor||''}); setModal(true) }}
                    className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center border border-primary-200"><Edit2 size={11}/></button>
                </div>
              </div>
              {d.treatmentSummary && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2 line-clamp-2">{d.treatmentSummary}</p>}
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={(editing?'✏️ Edit':'📋 New') + ' Discharge Summary'}>
        <FormGroup label="Patient Name *"><Input placeholder="Patient name" value={form.patientName} onChange={set('patientName')} /></FormGroup>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Age"><Input type="number" placeholder="30" value={form.patientAge} onChange={set('patientAge')} /></FormGroup>
          <FormGroup label="Room Type"><Select value={form.roomType} onChange={set('roomType')}>{['General Ward','Private','ICU','Semi-Private'].map(r=><option key={r}>{r}</option>)}</Select></FormGroup>
        </div>
        <FormGroup label="Primary Diagnosis *"><Input placeholder="e.g. Stable Angina" value={form.primaryDiagnosis} onChange={set('primaryDiagnosis')} /></FormGroup>
        <FormGroup label="Diagnosis Code (ICD)"><Input placeholder="e.g. I25.1" value={form.diagnosisCode} onChange={set('diagnosisCode')} /></FormGroup>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Admission Date"><Input type="date" value={form.admissionDate} onChange={set('admissionDate')} /></FormGroup>
          <FormGroup label="Discharge Date"><Input type="date" value={form.dischargeDate} onChange={set('dischargeDate')} /></FormGroup>
        </div>
        <FormGroup label="Attending Doctor"><Input placeholder="Dr. Name" value={form.attendingDoctor} onChange={set('attendingDoctor')} /></FormGroup>
        <FormGroup label="Insurance Provider"><Input placeholder="Star Health etc." value={form.insuranceProvider} onChange={set('insuranceProvider')} /></FormGroup>
        <FormGroup label="Policy No."><Input placeholder="Policy number" value={form.policyNo} onChange={set('policyNo')} /></FormGroup>
        <FormGroup label="Treatment Summary"><Textarea placeholder="Treatment details..." value={form.treatmentSummary} onChange={set('treatmentSummary')} /></FormGroup>
        <FormGroup label="Follow-up Date"><Input type="date" value={form.followUpDate} onChange={set('followUpDate')} /></FormGroup>
        <Button onClick={save} loading={saving}>{editing?'Save Changes':'Create Summary'}</Button>
      </Modal>
    </div>
  )
}
