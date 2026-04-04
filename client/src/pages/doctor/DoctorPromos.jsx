import { useState, useEffect } from 'react'
import { Modal, FormGroup, Input, Select, Textarea, Button, PageTitle, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { hospitalApi } from '@/api'

const GRADIENTS = [
  'linear-gradient(135deg,#1e8a4c,#34d399)',
  'linear-gradient(135deg,#1a73e8,#60a5fa)',
  'linear-gradient(135deg,#6b21a8,#a855f7)',
  'linear-gradient(135deg,#b45309,#f59e0b)',
  'linear-gradient(135deg,#be123c,#f43f5e)',
]

export default function DoctorPromos() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title:'',desc:'',type:'Discount',discount:'',validTill:'',color:GRADIENTS[0],active:true })
  const set = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}))

  const load = () => {
    setLoading(true)
    hospitalApi.getPromotions()
      .then(res => setPromotions(res.data?.data || []))
      .catch(() => toast.error('Failed to load promotions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title) { toast.error('Title required'); return }
    setSaving(true)
    try {
      if (editing) { await hospitalApi.updatePromotion(editing.id, form); toast.success('Updated') }
      else { await hospitalApi.addPromotion(form); toast.success('Created') }
      setModal(false); setEditing(null)
      setForm({ title:'',desc:'',type:'Discount',discount:'',validTill:'',color:GRADIENTS[0],active:true })
      load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this promotion?')) return
    try { await hospitalApi.deletePromotion(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageTitle icon="🎁">Promotions</PageTitle>
        <button onClick={() => { setEditing(null); setForm({ title:'',desc:'',type:'Discount',discount:'',validTill:'',color:GRADIENTS[0],active:true }); setModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> Add Promo
        </button>
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !promotions.length ? <EmptyState icon="🎁" title="No promotions yet" /> : (
        <div className="space-y-3">
          {promotions.map(p => (
            <div key={p.id} className="rounded-2xl p-4 text-white shadow-card" style={{ background: p.color || GRADIENTS[0] }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-black">{p.title}</p>
                  <p className="text-xs opacity-80 mt-0.5">{p.description || p.desc}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {p.discount && <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{p.discount}</span>}
                    {p.validTill && <span className="text-[10px] opacity-70">Till {fmtDate(p.validTill)}</span>}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => { setEditing(p); setForm({title:p.title,desc:p.description||p.desc||'',type:p.type||'Discount',discount:p.discount||'',validTill:p.validTill||'',color:p.color||GRADIENTS[0],active:p.active}); setModal(true) }}
                    className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center"><Edit2 size={12}/></button>
                  <button onClick={() => del(p.id)} className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center"><Trash2 size={12}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={(editing?'✏️ Edit':'🎁 New') + ' Promotion'}>
        <FormGroup label="Title *"><Input placeholder="Promotion title" value={form.title} onChange={set('title')} /></FormGroup>
        <FormGroup label="Description"><Textarea placeholder="Details..." value={form.desc} onChange={set('desc')} /></FormGroup>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Type"><Select value={form.type} onChange={set('type')}>{['Discount','Scheme','Benefit','Offer'].map(t=><option key={t}>{t}</option>)}</Select></FormGroup>
          <FormGroup label="Discount"><Input placeholder="e.g. 20% OFF" value={form.discount} onChange={set('discount')} /></FormGroup>
        </div>
        <FormGroup label="Valid Till"><Input type="date" value={form.validTill} onChange={set('validTill')} /></FormGroup>
        <FormGroup label="Color">
          <div className="flex gap-2 flex-wrap">
            {GRADIENTS.map(g => <button key={g} onClick={() => setForm(f=>({...f,color:g}))} className={`w-8 h-8 rounded-lg border-2 ${form.color===g?'border-primary-600':'border-transparent'}`} style={{background:g}} />)}
          </div>
        </FormGroup>
        <Button onClick={save} loading={saving}>{editing?'Save Changes':'Create'}</Button>
      </Modal>
    </div>
  )
}
