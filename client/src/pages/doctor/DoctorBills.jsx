import { useState, useEffect } from 'react'
import { Modal, FormGroup, Input, Select, Button, Badge, PageTitle, EmptyState } from '@/components/ui'
import { fmtDate, fmtMoney } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { hospitalApi } from '@/api'

const CATEGORIES = ['room','doctor','procedure','pharmacy','diagnostic','nursing','non-medical']

export default function DoctorBills() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ patientName:'',patientAge:'',admissionDate:'',dischargeDate:'',paymentMode:'Cashless' })
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState({ desc:'',category:'room',amount:'',claimable:true })
  const set = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}))

  const load = () => {
    setLoading(true)
    hospitalApi.getBills()
      .then(res => setBills(res.data?.data || []))
      .catch(() => toast.error('Failed to load bills'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const addItem = () => {
    if (!newItem.desc || !newItem.amount) { toast.error('Item desc and amount required'); return }
    setItems(prev => [...prev, { ...newItem, amount: parseFloat(newItem.amount) }])
    setNewItem({ desc:'',category:'room',amount:'',claimable:true })
  }

  const saveBill = async () => {
    if (!form.patientName) { toast.error('Patient name required'); return }
    if (!items.length) { toast.error('Add at least one item'); return }
    setSaving(true)
    try {
      await hospitalApi.createBill({ ...form, items, status:'draft' })
      toast.success('Bill created')
      setModal(false); setForm({ patientName:'',patientAge:'',admissionDate:'',dischargeDate:'',paymentMode:'Cashless' }); setItems([])
      load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    try { await hospitalApi.updateBillStatus(id, { status }); toast.success('Updated'); load() }
    catch { toast.error('Failed to update') }
  }

  const STATUS_COLOR = { draft:'bg-gray-100 text-gray-600', final:'bg-blue-100 text-blue-700', paid:'bg-green-100 text-green-700', submitted:'bg-amber-100 text-amber-700' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageTitle icon="💰">Indoor Bills ({bills.length})</PageTitle>
        <button onClick={() => { setEditing(null); setForm({ patientName:'',patientAge:'',admissionDate:'',dischargeDate:'',paymentMode:'Cashless' }); setItems([]); setModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> New Bill
        </button>
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !bills.length ? <EmptyState icon="💰" title="No bills yet" /> : (
        <div className="space-y-3">
          {bills.map(b => {
            const total = (b.billItems||[]).reduce((s,i)=>s+(i.amount||0),0)
            return (
              <div key={b.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-black text-primary-950">{b.patientName || b.patient?.user?.name || '—'}</p>
                    <p className="text-xs text-gray-500">{fmtDate(b.admissionDate)} → {fmtDate(b.dischargeDate)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status]||'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                </div>
                <p className="text-lg font-black text-primary-700">{fmtMoney(total)}</p>
                <p className="text-xs text-gray-400">{(b.billItems||[]).length} items</p>
                <div className="flex gap-2 mt-2">
                  {b.status === 'draft' && <button onClick={() => updateStatus(b.id, 'final')} className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg">Finalize</button>}
                  {b.status === 'final' && <button onClick={() => updateStatus(b.id, 'submitted')} className="px-3 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg">Submit to Insurance</button>}
                  {b.status !== 'paid' && b.status !== 'draft' && <button onClick={() => updateStatus(b.id, 'paid')} className="px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-lg">Mark Paid</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="💰 New Indoor Bill">
        <FormGroup label="Patient Name *"><Input placeholder="Patient name" value={form.patientName} onChange={set('patientName')} /></FormGroup>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Admission Date"><Input type="date" value={form.admissionDate} onChange={set('admissionDate')} /></FormGroup>
          <FormGroup label="Discharge Date"><Input type="date" value={form.dischargeDate} onChange={set('dischargeDate')} /></FormGroup>
        </div>
        <FormGroup label="Payment Mode">
          <Select value={form.paymentMode} onChange={set('paymentMode')}>{['Cashless','Cash','Online','Card'].map(p=><option key={p}>{p}</option>)}</Select>
        </FormGroup>
        <div className="mt-3 border-t pt-3">
          <p className="text-xs font-bold text-gray-600 mb-2">Bill Items</p>
          {items.map((it,i) => (
            <div key={i} className="flex items-center gap-2 mb-1 bg-gray-50 rounded-lg p-2">
              <span className="text-xs flex-1">{it.desc}</span>
              <span className="text-xs font-bold">{fmtMoney(it.amount)}</span>
              <button onClick={() => setItems(prev=>prev.filter((_,j)=>j!==i))} className="text-red-400"><Trash2 size={12}/></button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Input placeholder="Description" value={newItem.desc} onChange={e=>setNewItem(p=>({...p,desc:e.target.value}))} />
            <Input type="number" placeholder="Amount" value={newItem.amount} onChange={e=>setNewItem(p=>({...p,amount:e.target.value}))} className="w-24" />
            <button onClick={addItem} className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg whitespace-nowrap">+ Add</button>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm font-black text-right">Total: {fmtMoney(items.reduce((s,i)=>s+i.amount,0))}</p>
        </div>
        <Button onClick={saveBill} loading={saving}>Create Bill</Button>
      </Modal>
    </div>
  )
}
