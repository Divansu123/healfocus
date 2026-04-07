import { useState, useEffect } from 'react'
import { Tabs, Modal, FormGroup, Input, Select, Textarea, Button, Badge, PageTitle, EmptyState } from '@/components/ui'
import { fmtDate, today } from '@/lib/utils'
import { Plus, Edit2, Cpu, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { hospitalApi } from '@/api'

function exportDischargeExcel(summaries) {
  const headers = ['#', 'Patient', 'Age', 'Diagnosis', 'Admission', 'Discharge', 'Insurance', 'Policy No', 'Room Type', 'Doctor', 'Status']
  const rows = summaries.map((d, i) => [
    i + 1,
    d.patientName || '', d.patientAge || '',
    d.primaryDiagnosis || '', fmtDate(d.admissionDate) || '',
    fmtDate(d.dischargeDate) || '', d.insuranceProvider || '',
    d.policyNo || '', d.roomType || '',
    d.attendingDoctor || '', d.status || '',
  ])
  const bom = '\uFEFF'
  const csv = bom + [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `discharge_summaries_${today()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Downloaded!')
}

const BLANK = { patientName:'',patientAge:'',patientId:'',diagnosisCode:'',primaryDiagnosis:'',admissionDate:'',dischargeDate:'',insuranceProvider:'',policyNo:'',policyAge:'',preExistingCovered:'Yes',roomType:'General Ward',treatmentSummary:'',followUpDate:'',attendingDoctor:'',proceduresDone:'',medicinesAtDischarge:'' }

// ── AI Coverage Analyzer ───────────────────────────────────────────────────────
function analyzeLocalCoverage(ds) {
  const issues = []
  const suggestions = []
  let score = 85

  const diag = (ds.primaryDiagnosis || '').toLowerCase()
  const ins  = (ds.insuranceProvider || '').toLowerCase()
  const room = (ds.roomType || '').toLowerCase()
  const tx   = (ds.treatmentSummary || '').toLowerCase()

  if (!ds.insuranceProvider) { issues.push('No insurance provider specified — claim may be rejected'); score -= 25 }
  if (!ds.policyNo) { issues.push('Policy number missing — required for all insurance claims'); score -= 15 }
  if (!ds.diagnosisCode) { suggestions.push('Add ICD-10 diagnosis code for faster claim processing'); score -= 5 }
  if (room === 'icu') { suggestions.push('ICU stay may require pre-authorization. Verify with TPA.'); score -= 5 }
  if (tx.includes('cosmetic') || tx.includes('aesthetic')) { issues.push('Cosmetic procedures are typically excluded from insurance coverage'); score -= 20 }
  if (!ds.attendingDoctor) { suggestions.push('Attending doctor name missing — add for complete documentation'); score -= 5 }
  if (!ds.followUpDate) { suggestions.push('Add follow-up date for better continuity of care records') }
  if (diag.includes('self-inflict') || diag.includes('injury under influence')) { issues.push('Self-inflicted injuries or those under influence may be excluded'); score -= 30 }
  if (ins.includes('star') || ins.includes('hdfc') || ins.includes('icici') || ins.includes('new india')) {
    suggestions.push(`${ds.insuranceProvider} typically processes cashless claims within 4 hours. Submit pre-auth before discharge.`)
  }

  return { score: Math.max(0, score), issues, suggestions }
}

export default function DoctorDischarge() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [aiModal, setAiModal]     = useState(null) // discharge summary for AI analysis
  const [aiResult, setAiResult]   = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState(BLANK)
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

  const openAI = async (ds) => {
    setAiModal(ds)
    setAiResult(null)
    setAiLoading(true)
    try {
      // Try Anthropic API
      const apiKey = import.meta.env.VITE_ANTHROPIC_KEY || ''
      if (!apiKey) throw new Error('No API key - using local analysis')
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: `You are an Indian health insurance expert. Analyze this discharge summary for insurance coverage issues. Return ONLY JSON: {"score":number,"issues":["string"],"suggestions":["string"]}. score is 0-100 (100=perfect coverage). issues are things that will get the claim rejected/reduced. suggestions are tips to improve claim. Max 3 issues, 3 suggestions.\n\nDischarge Summary:\nPatient: ${ds.patientName}, Age ${ds.patientAge}\nDiagnosis: ${ds.primaryDiagnosis} (${ds.diagnosisCode})\nRoom: ${ds.roomType}\nAdmission: ${ds.admissionDate} - ${ds.dischargeDate}\nInsurance: ${ds.insuranceProvider} (Policy: ${ds.policyNo})\nTreatment: ${ds.treatmentSummary}` }]
        })
      })
      const data = await resp.json()
      const textBlock = data.content?.find(b => b.type === 'text')
      if (textBlock) {
        const raw = textBlock.text.trim().replace(/^```json[\r\n]*/,'').replace(/[\r\n]*```$/,'')
        setAiResult(JSON.parse(raw))
      } else throw new Error('No text')
    } catch {
      setAiResult(analyzeLocalCoverage(ds))
    }
    setAiLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <PageTitle icon="📋">Discharge Summaries</PageTitle>
        <div className="flex gap-2">
          <button
            onClick={() => exportDischargeExcel(summaries)}
            disabled={!summaries.length}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-full transition-all"
          >
            <Download size={12} /> Export
          </button>
          <button onClick={() => { setEditing(null); setForm(BLANK); setModal(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
            <Plus size={12} /> New Summary
          </button>
        </div>
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div>
        : !summaries.length ? <EmptyState icon="📋" title="No discharge summaries" /> : (
        <div className="space-y-3">
          {summaries.map(d => (
            <div key={d.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-black text-primary-950">{d.patientName}</p>
                  <p className="text-xs text-gray-600 font-medium">{d.primaryDiagnosis}</p>
                  <p className="text-xs text-gray-400">{fmtDate(d.admissionDate)} → {fmtDate(d.dischargeDate)}</p>
                  {d.insuranceProvider && <p className="text-xs text-primary-600 font-medium mt-0.5">🛡️ {d.insuranceProvider}</p>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openAI(d)}
                    className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center border border-violet-200 text-violet-600 hover:bg-violet-100 transition-colors"
                    title="AI Coverage Check">
                    <Cpu size={11}/>
                  </button>
                  <button onClick={() => { setEditing(d); setForm({patientName:d.patientName||'',patientAge:String(d.patientAge||''),diagnosisCode:d.diagnosisCode||'',primaryDiagnosis:d.primaryDiagnosis||'',admissionDate:d.admissionDate||'',dischargeDate:d.dischargeDate||'',insuranceProvider:d.insuranceProvider||'',policyNo:d.policyNo||'',roomType:d.roomType||'General Ward',treatmentSummary:d.treatmentSummary||'',followUpDate:d.followUpDate||'',attendingDoctor:d.attendingDoctor||''}); setModal(true) }}
                    className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center border border-primary-200">
                    <Edit2 size={11}/>
                  </button>
                </div>
              </div>
              {d.treatmentSummary && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2 line-clamp-2">{d.treatmentSummary}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
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

      {/* AI Coverage Modal */}
      {aiModal && (
        <Modal open={!!aiModal} onClose={() => { setAiModal(null); setAiResult(null) }} title="🤖 AI Coverage Analysis">
          {aiLoading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-sm font-black text-primary-900 mb-1">Analyzing coverage...</p>
              <p className="text-xs text-gray-500 mb-4">AI is checking insurance eligibility</p>
              <div className="flex gap-2 justify-center">
                {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay:`${i*0.2}s` }} />)}
              </div>
            </div>
          ) : aiResult && (
            <div className="space-y-4">
              {/* Score */}
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl mb-2 ${aiResult.score>=80?'bg-green-100':aiResult.score>=50?'bg-amber-100':'bg-red-100'}`}>
                  {aiResult.score>=80?'✅':aiResult.score>=50?'⚠️':'❌'}
                </div>
                <p className={`text-2xl font-black ${aiResult.score>=80?'text-green-600':aiResult.score>=50?'text-amber-600':'text-red-600'}`}>
                  Coverage Score: {aiResult.score}%
                </p>
                <p className="text-xs text-gray-500">{aiModal.patientName} · {aiModal.primaryDiagnosis}</p>
              </div>

              {/* Issues */}
              {aiResult.issues?.length > 0 ? (
                <div>
                  <p className="text-sm font-black text-red-700 mb-2">⛔ Coverage Issues ({aiResult.issues.length})</p>
                  {aiResult.issues.map((issue, i) => (
                    <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2 text-xs text-red-700">{issue}</div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-medium">✅ No major coverage exclusions detected</div>
              )}

              {/* Suggestions */}
              {aiResult.suggestions?.length > 0 && (
                <div>
                  <p className="text-sm font-black text-amber-700 mb-2">💡 Suggestions ({aiResult.suggestions.length})</p>
                  {aiResult.suggestions.map((s, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2 text-xs text-amber-700">{s}</div>
                  ))}
                </div>
              )}

              {/* Assessment */}
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-3">
                <p className="text-xs font-bold text-primary-700 mb-1">📊 Assessment Summary</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {aiResult.score>=80 ? '✅ This discharge summary has good insurance coverage. Proceed with claim submission.'
                    : aiResult.score>=50 ? '⚠️ Some potential coverage concerns. Review flagged items before claim submission.'
                    : '❌ Significant coverage issues detected. Consult with TPA before submitting the claim.'}
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
