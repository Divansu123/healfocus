import { useState, useEffect } from 'react'
import { Modal, FormGroup, Input, Button, PageTitle, EmptyState } from '@/components/ui'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/api'

const ICONS = ['👨‍💼', '👩‍💼', '🧑‍💼', '👨‍💻', '👩‍💻']
const PERMS = ['billcheck', 'records', 'hospitals', 'patients', 'admissions', 'claims']

export default function AdminTeam() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: '', avatar: '👨‍💼', permissions: [] })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const togglePerm = (p) => setForm(f => ({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p] }))

  const load = () => {
    setLoading(true)
    adminApi.getTeamMembers()
      .then(res => {
        const formatted = (res.data?.data || []).map(member => ({
          ...member,
          permissions: Array.isArray(member.permissions)
            ? member.permissions
            : member.permissions
              ? member.permissions.split(',').map(p => p.trim())
              : []
        }))
        setMembers(formatted)
      }).catch(() => toast.error('Failed to load team'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name || !form.email || !form.role) { toast.error('Name, email, and role required'); return }
    setSaving(true)
    try {
      if (editing) {
        await adminApi.updateTeamMember(editing.id, form)
        toast.success('Member updated')
      } else {
        await adminApi.addTeamMember(form)
        toast.success('Member added')
      }
      setModal(false); setEditing(null)
      setForm({ name: '', email: '', role: '', avatar: '👨‍💼', permissions: [] })
      load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Remove this team member?')) return
    try {
      await adminApi.removeTeamMember(id)
      toast.success('Member removed')
      load()
    } catch { toast.error('Failed to remove') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageTitle icon="👨‍💼">Team ({members.length})</PageTitle>
        <button onClick={() => { setEditing(null); setForm({ name: '', email: '', role: '', avatar: '👨‍💼', permissions: [] }); setModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full">
          <Plus size={12} /> Add Member
        </button>
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !members.length ? <EmptyState icon="👨‍💼" title="No team members yet" /> : (
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl border border-primary-200">{m.avatar || '👨‍💼'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-950">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.role}</p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(m); setForm({ name: m.name, email: m.email, role: m.role, avatar: m.avatar || '👨‍💼', permissions: m.permissions || [] }); setModal(true) }}
                      className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center border border-primary-200"><Edit2 size={11} /></button>
                    <button onClick={() => remove(m.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center border border-red-200"><Trash2 size={11} className="text-red-500" /></button>
                  </div>
                </div>
                {(m.permissions || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.permissions.map(p => <span key={p} className="text-[10px] font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{p}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      <Modal open={modal} onClose={() => setModal(false)} title={(editing ? '✏️ Edit' : '👨‍💼 Add') + ' Team Member'}>
        <FormGroup label="Full Name"><Input placeholder="Name" value={form.name} onChange={set('name')} /></FormGroup>
        <FormGroup label="Email"><Input type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} /></FormGroup>
        <FormGroup label="Role"><Input placeholder="e.g. Billing Analyst" value={form.role} onChange={set('role')} /></FormGroup>
        <FormGroup label="Avatar">
          <div className="flex gap-2">{ICONS.map(ic => <button key={ic} onClick={() => setForm(f => ({ ...f, avatar: ic }))} className={`text-2xl p-1 rounded-lg border-2 ${form.avatar === ic ? 'border-primary-500' : 'border-transparent'}`}>{ic}</button>)}</div>
        </FormGroup>
        <FormGroup label="Permissions">
          <div className="flex flex-wrap gap-2">
            {PERMS.map(p => (
              <button key={p} onClick={() => togglePerm(p)}
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${form.permissions.includes(p) ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{p}</button>
            ))}
          </div>
        </FormGroup>
        <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Add Member'}</Button>
      </Modal>
    </div>
  )
}
