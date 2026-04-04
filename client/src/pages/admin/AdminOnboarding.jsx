import { useState, useEffect } from 'react'
import { Tabs, Badge, PageTitle, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { adminApi } from '@/api'

export default function AdminOnboarding() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const TABS = [{id:'pending',label:'Pending'},{id:'approved',label:'Approved'},{id:'rejected',label:'Rejected'}]

  const load = () => {
    setLoading(true)
    adminApi.getSignupRequests()
      .then(res => setRequests(res.data?.data || []))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = requests.filter(r => r.status === tab)

  const approve = async (req) => {
    try {
      await adminApi.approveSignupRequest(req.id)
      toast.success(`${req.name} approved!`)
      load()
    } catch { toast.error('Failed to approve') }
  }

  const reject = async (req) => {
    try {
      await adminApi.rejectSignupRequest(req.id)
      toast.success('Request rejected')
      load()
    } catch { toast.error('Failed to reject') }
  }

  return (
    <div>
      <PageTitle icon="✅">Hospital Onboarding</PageTitle>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> :
        !filtered.length ? <EmptyState icon="🏥" title={`No ${tab} requests`} /> : (
        <div className="space-y-3 mt-3">
          {filtered.map(req => (
            <div key={req.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-black text-primary-950">{req.name}</p>
                  <p className="text-xs text-gray-500">{req.city} · {req.type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{req.email} · {req.phone}</p>
                </div>
                <Badge status={tab==='pending'?'pending':tab==='approved'?'confirmed':'cancelled'} />
              </div>
              {req.note && <p className="text-xs text-gray-600 mb-2 bg-gray-50 rounded-lg p-2">{req.note}</p>}
              <p className="text-[10px] text-gray-400 mb-2">Submitted: {fmtDate(req.createdAt)}</p>
              {tab === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => approve(req)} className="flex-1 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg">✅ Approve</button>
                  <button onClick={() => reject(req)} className="flex-1 py-1.5 text-xs font-bold bg-red-100 text-red-600 rounded-lg">❌ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
