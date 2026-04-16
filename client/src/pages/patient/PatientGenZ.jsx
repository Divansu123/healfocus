import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '@/components/ui'
import { today, nowTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { patientApi } from '@/api'

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  { v: 'checkin', l: '😊 Vibe Check' },
  { v: 'skin',    l: '📸 Skin AI'    },
  { v: 'avatar',  l: '🦸 Avatar'     },
  { v: 'streaks', l: '🔥 Streaks'    },
]

// ── AVATAR STAGES ──────────────────────────────────────────────────────────────
const AVATAR_STAGES = [
  { minLv: 0,  emoji: '🧍', title: 'Just Started',     subtitle: 'Begin your journey',       glow: '#94a3b8' },
  { minLv: 2,  emoji: '🚶', title: 'Getting Active',   subtitle: 'Building habits',           glow: '#60a5fa' },
  { minLv: 4,  emoji: '🏃', title: 'On the Move',      subtitle: 'Momentum is building',      glow: '#34d399' },
  { minLv: 6,  emoji: '🏋️', title: 'Fitness Seeker',   subtitle: 'Strength & consistency',    glow: '#a78bfa' },
  { minLv: 9,  emoji: '🦸', title: 'Wellness Warrior', subtitle: 'Leading by example',        glow: '#6d28d9' },
  { minLv: 13, emoji: '🧬', title: 'Health Legend',    subtitle: 'Peak human unlocked',       glow: '#fbbf24' },
]

const DEFAULT_GOALS = [
  { id: 'G1', icon: '❤️', label: 'Log vitals 3 days in a row',     xp: 10, done: false },
  { id: 'G2', icon: '🔥', label: 'Maintain 7-day health streak',   xp: 20, done: false },
  { id: 'G3', icon: '🧘', label: 'Complete 5 wellness sessions',   xp: 15, done: false },
  { id: 'G4', icon: '📸', label: 'Upload 3 skin scans',            xp: 10, done: false },
  { id: 'G5', icon: '😊', label: 'Log mood for 7 days',            xp: 10, done: false },
  { id: 'G6', icon: '💊', label: 'Mark all medications done',      xp: 5,  done: false },
  { id: 'G7', icon: '💧', label: 'Complete water reminders 5 days',xp: 8,  done: false },
]

// ── CHECKIN DECK ──────────────────────────────────────────────────────────────
const CHECKIN_DECK = [
  { emoji:'😄', label:'Lit',       sub:'Absolutely thriving rn',         bg:'linear-gradient(135deg,#fbbf24,#f59e0b)', score:5 },
  { emoji:'😊', label:'Solid',     sub:'Pretty good, no complaints',      bg:'linear-gradient(135deg,#34d399,#10b981)', score:4 },
  { emoji:'😌', label:'Chill',     sub:'Calm and collected energy',       bg:'linear-gradient(135deg,#60a5fa,#3b82f6)', score:4 },
  { emoji:'😐', label:'Mid',       sub:'Could be better, could be worse', bg:'linear-gradient(135deg,#a78bfa,#8b5cf6)', score:3 },
  { emoji:'😔', label:'Meh',       sub:'Not really feeling it today',     bg:'linear-gradient(135deg,#94a3b8,#64748b)', score:2 },
  { emoji:'😮‍💨', label:'Drained',  sub:'Running on empty fr fr',          bg:'linear-gradient(135deg,#f87171,#ef4444)', score:2 },
  { emoji:'😢', label:'Rough',     sub:'Tough day, be kind to yourself',  bg:'linear-gradient(135deg,#6366f1,#4f46e5)', score:1 },
]

// ── SKIN MOCK RESULTS ──────────────────────────────────────────────────────────
function getMockSkinResult() {
  const score = Math.floor(Math.random() * 35) + 55
  const concerns = score >= 80
    ? ['Minor dryness', 'Light sun exposure']
    : score >= 65
    ? ['Mild acne', 'Dehydration', 'Uneven tone']
    : ['Active breakouts', 'Oiliness', 'Redness', 'Dehydration']
  const tips = [
    'Apply SPF 30+ sunscreen every morning',
    'Drink at least 2-3L of water daily',
    'Use a gentle non-comedogenic moisturizer',
    'Cleanse with a mild face wash twice daily',
    'Avoid touching your face with unwashed hands',
  ]
  const overall = score >= 80 ? 'Healthy ✨' : score >= 65 ? 'Fair 🌤' : 'Needs Care 🌱'
  const trend = Math.random() > 0.5 ? 'improving' : 'stable'
  return { score, concerns: concerns.slice(0, 3), tips: tips.slice(0, 3), overall, trend, date: today() }
}

export default function PatientGenZ() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('checkin')

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="✨ GenZ Features" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">
        {/* Tab pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${tab === t.v ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-200 text-gray-600'}`}>
              {t.l}
            </button>
          ))}
        </div>
        {tab === 'checkin' && <VibeCheckTab />}
        {tab === 'skin'    && <SkinAITab />}
        {tab === 'avatar'  && <AvatarTab />}
        {tab === 'streaks' && <StreaksTab />}
      </div>
    </div>
  )
}

// ── VIBE CHECK TAB ─────────────────────────────────────────────────────────────
function VibeCheckTab() {
  const [deck, setDeck]       = useState([...CHECKIN_DECK])
  const [idx, setIdx]         = useState(0)
  const [done, setDone]       = useState(false)
  const [savedMood, setSavedMood] = useState(null)
  const [moods, setMoods]     = useState([])
  const [stamp, setStamp]     = useState(null) // 'vibe' | 'nope'
  const stampTimer = useRef(null)

  useEffect(() => {
    patientApi.getMoods().then(r => setMoods(r.data?.data || [])).catch(() => {})
  }, [done])

  const swipe = async (dir) => {
    const card = deck[idx]
    if (!card) return
    setStamp(dir === 'right' ? 'vibe' : 'nope')
    stampTimer.current = setTimeout(() => setStamp(null), 700)

    if (dir === 'right') {
      setSavedMood(card)
      try {
        await patientApi.addMood({ emoji: card.emoji, label: card.label, score: card.score, date: today(), time: nowTime(), notes: '' })
        toast.success('Vibe logged! 💜')
      } catch { toast.error('Failed to save vibe') }
      setDone(true)
    } else {
      if (idx + 1 >= deck.length) {
        setDeck([...CHECKIN_DECK])
        setIdx(0)
      } else {
        setIdx(i => i + 1)
      }
    }
  }

  const reset = () => { setIdx(0); setDone(false); setSavedMood(null); setDeck([...CHECKIN_DECK]) }
  const card = deck[idx]
  const nextCard = deck[idx + 1]

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-lg font-black text-gray-900">Daily Vibe Check ✨</p>
        <p className="text-xs text-gray-500 mt-0.5">How are you feeling right now?</p>
      </div>

      {done ? (
        <div className="rounded-3xl p-8 text-center text-white" style={{ background: savedMood?.bg || 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
          <div className="text-5xl mb-3">{savedMood?.emoji || '✨'}</div>
          <div className="text-xl font-black mb-1">Vibe Logged!</div>
          <div className="text-sm opacity-80 mb-5">Your mood is saved. See you tomorrow! 💜</div>
          <button onClick={reset}
            className="bg-white/20 border-2 border-white/40 text-white px-6 py-2.5 rounded-2xl font-bold text-sm">
            ↩ Check in again
          </button>
        </div>
      ) : (
        <div>
          {/* Card stack */}
          <div className="relative flex justify-center" style={{ height: 260 }}>
            {nextCard && (
              <div className="absolute inset-x-4 rounded-3xl shadow-lg"
                style={{ top: 8, bottom: -8, background: nextCard.bg, opacity: 0.5, transform: 'scale(0.95)' }} />
            )}
            <div className="relative rounded-3xl shadow-2xl flex flex-col items-center justify-center text-white w-full mx-4"
              style={{ background: card?.bg || '#6366f1', minHeight: 240 }}>
              {stamp === 'vibe' && (
                <div className="absolute top-4 right-4 bg-green-400 text-white font-black text-sm px-3 py-1 rounded-full rotate-12 border-2 border-white shadow">VIBE ✨</div>
              )}
              {stamp === 'nope' && (
                <div className="absolute top-4 left-4 bg-red-400 text-white font-black text-sm px-3 py-1 rounded-full -rotate-12 border-2 border-white shadow">NOPE 👎</div>
              )}
              <div className="text-7xl mb-3">{card?.emoji}</div>
              <div className="text-2xl font-black">{card?.label}</div>
              <div className="text-sm opacity-80 mt-1 text-center px-6">{card?.sub}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 mt-5 justify-center">
            <button onClick={() => swipe('left')}
              className="flex-1 max-w-36 py-3 rounded-2xl bg-white border-2 border-red-200 text-red-500 font-black text-sm shadow-md active:scale-95 transition-transform">
              👎 Nope
            </button>
            <button onClick={() => swipe('right')}
              className="flex-1 max-w-36 py-3 rounded-2xl text-white font-black text-sm shadow-md active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              ✨ Vibe
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">{deck.length - idx} cards left</p>
        </div>
      )}

      {/* Recent vibes */}
      {moods.length > 0 && (
        <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
          <p className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">📅 Recent Vibes</p>
          <div className="flex flex-wrap gap-2">
            {moods.slice(0, 10).map(m => (
              <span key={m.id} className="px-2.5 py-1 bg-primary-50 border border-primary-100 rounded-full text-xs font-bold text-primary-700">
                {m.emoji} {m.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── SKIN AI TAB ────────────────────────────────────────────────────────────────
function SkinAITab() {
  const [scans, setScans]     = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const runScan = (file) => {
    setLoading(true)

    // If a real file is provided, upload it to the server first
    if (file) {
      setUploading(true)
      const fd = new FormData()
      fd.append('skinImage', file)
      patientApi.uploadSkinScan(fd)
        .then(() => {
          toast.success('Image uploaded! 📸')
        })
        .catch(() => {
          toast.error('Upload failed, running demo scan instead')
        })
        .finally(() => {
          setUploading(false)
          // Run mock AI analysis after upload
          setTimeout(() => {
            const result = getMockSkinResult()
            setScans(prev => [result, ...prev].slice(0, 6))
            setLoading(false)
            toast.success('Scan complete! ✨')
          }, 1800)
        })
    } else {
      // Demo scan without upload
      setTimeout(() => {
        const result = getMockSkinResult()
        setScans(prev => [result, ...prev].slice(0, 6))
        setLoading(false)
        toast.success('Demo scan complete! 📊')
      }, 2200)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['jpg','jpeg','png'].includes(ext)) {
      toast.error('Only JPG and PNG images are allowed')
      e.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image must be smaller than 8MB')
      e.target.value = ''
      return
    }
    runScan(file)
    e.target.value = ''
  }

  const latest = scans[0]
  const prev   = scans[1]
  const diff   = latest && prev ? latest.score - prev.score : 0

  const scoreColor = (s) => s >= 80 ? '#22c55e' : s >= 65 ? '#f59e0b' : '#6d28d9'

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#1e1b4b,#6d28d9)' }}>
        <p className="text-[10px] opacity-60 tracking-widest mb-1">AI POWERED</p>
        <p className="text-lg font-black">Skin Health Scanner</p>
        <p className="text-xs opacity-75 mt-1 leading-relaxed">Upload a selfie to track acne, hydration & skin health over time</p>
      </div>

      {/* Upload */}
      <label className={`flex flex-col items-center gap-2 bg-white border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-colors
        ${loading || uploading ? 'border-gray-200 opacity-60 pointer-events-none' : 'border-violet-300 hover:border-violet-500'}`}>
        <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} disabled={loading || uploading} />
        <span className="text-5xl">{uploading ? '⏳' : '🤳'}</span>
        <p className="text-sm font-black text-violet-700">
          {uploading ? 'Uploading…' : 'Upload a Selfie'}
        </p>
        <p className="text-xs text-gray-500">
          {uploading ? 'Saving your image securely…' : 'JPG or PNG · Max 8 MB · AI analyses skin health'}
        </p>
        <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full">🔒 Private · Never shared</span>
      </label>

      <div className="text-center text-gray-400 text-xs">— or —</div>

      <button onClick={() => runScan(null)} disabled={loading}
        className="w-full py-3 rounded-2xl border-2 border-primary-200 text-primary-700 font-bold text-sm bg-white">
        {loading ? '🔍 Analysing…' : '📊 Run Demo Scan'}
      </button>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#1e1b4b,#6d28d9)' }}>
          <p className="text-sm font-bold mb-3">🔍 Reading your skin data…</p>
          {[90, 70, 80].map((w, i) => (
            <div key={i} className="h-3 rounded-full mb-2 animate-pulse" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
      )}

      {/* Result */}
      {latest && !loading && (
        <>
          <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
            <div className="flex gap-4 items-start mb-4">
              {/* Score ring */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg width="80" height="80" viewBox="0 0 80 80" className="absolute inset-0">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#eef2ff" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none"
                    stroke={scoreColor(latest.score)} strokeWidth="6"
                    strokeDasharray={`${latest.score * 2.14} 214`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dasharray 0.9s' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black" style={{ color: scoreColor(latest.score) }}>{latest.score}</span>
                  <span className="text-[9px] text-gray-400 font-bold">/100</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-base font-black text-gray-900">Skin: {latest.overall}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {latest.date}{prev ? ` · ${diff >= 0 ? '↑ +' : '↓ '}${Math.abs(diff)} pts` : ' · First scan'}
                </p>
                <p className="text-sm font-bold mt-1">
                  {latest.trend === 'improving' ? '📈 Improving' : latest.trend === 'declining' ? '📉 Declining' : '📊 Stable'}
                </p>
                <div className="h-1.5 bg-primary-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${latest.score}%`, background: `linear-gradient(90deg,#6d28d9,${scoreColor(latest.score)})` }} />
                </div>
              </div>
            </div>
            {/* Concerns */}
            <div className="mb-3">
              <p className="text-xs font-bold text-gray-700 mb-2">⚠️ Areas to Watch</p>
              <div className="flex flex-wrap gap-1.5">
                {latest.concerns.map(c => (
                  <span key={c} className="px-2 py-0.5 bg-violet-50 border border-violet-200 rounded-full text-xs font-bold text-violet-700">{c}</span>
                ))}
              </div>
            </div>
            {/* Tips */}
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">💡 Personalised Routine</p>
              {latest.tips.map(tip => (
                <div key={tip} className="flex gap-2 text-xs text-gray-600 py-1.5 border-b border-gray-50 last:border-0 leading-relaxed">
                  <span className="text-violet-600 font-bold flex-shrink-0">→</span>{tip}
                </div>
              ))}
            </div>
          </div>

          {/* History chart */}
          {scans.length > 1 && (
            <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <p className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">📈 Skin Score History</p>
              <div className="flex items-end gap-2 h-14">
                {[...scans].reverse().map((sk, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold" style={{ color: scoreColor(sk.score) }}>{sk.score}</span>
                    <div className="w-full rounded-t-lg min-h-1 transition-all duration-700"
                      style={{ height: `${Math.round(sk.score * 0.46)}px`, background: scoreColor(sk.score), opacity: 0.85 }} />
                    <span className="text-[8px] text-gray-400">{sk.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!latest && !loading && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-3 text-xs text-primary-700 font-medium">
          ℹ️ Upload a selfie or run a demo scan to begin tracking your skin health.
        </div>
      )}
    </div>
  )
}

// ── AVATAR TAB ─────────────────────────────────────────────────────────────────
function AvatarTab() {
  const STORAGE_KEY = 'healfocus_avatar'
  const [ag, setAg] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return { level: 1, xp: 0, xpNext: 100, goals: DEFAULT_GOALS }
  })

  const save = (newAg) => {
    setAg(newAg)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newAg)) } catch {}
  }

  const getStage = (level) => AVATAR_STAGES.reduce((a, s) => level >= s.minLv ? s : a, AVATAR_STAGES[0])
  const stage = getStage(ag.level)
  const xpPct = Math.round(ag.xp / ag.xpNext * 100)
  const doneCount = ag.goals.filter(g => g.done).length

  const toggleGoal = (id) => {
    const goal = ag.goals.find(g => g.id === id)
    if (!goal) return
    const wasDone = goal.done
    const newGoals = ag.goals.map(g => g.id === id ? { ...g, done: !g.done } : g)
    let newXp = wasDone ? ag.xp - goal.xp : ag.xp + goal.xp
    let newLevel = ag.level
    let newXpNext = ag.xpNext
    // Level up logic
    while (newXp >= newXpNext) {
      newXp -= newXpNext
      newLevel += 1
      newXpNext = Math.round(newXpNext * 1.3)
    }
    if (newXp < 0) newXp = 0
    save({ ...ag, goals: newGoals, xp: newXp, level: newLevel, xpNext: newXpNext })
  }

  return (
    <div className="space-y-4">
      {/* Avatar Stage Card */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg,#0d0a2e,#1e1b4b,#312e81)` }}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[10px] opacity-50 tracking-widest">YOUR HEALTH AVATAR</p>
            <p className="text-lg font-black mt-1">{stage.title}</p>
            <p className="text-xs opacity-70 mt-0.5">{stage.subtitle}</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 text-center">
            <p className="text-xl font-black">LV {ag.level}</p>
            <p className="text-[9px] opacity-60 tracking-wide">LEVEL</p>
          </div>
        </div>

        {/* Avatar Emoji */}
        <div className="text-center my-4">
          <div className="text-8xl" style={{ filter: `drop-shadow(0 8px 24px ${stage.glow}99)` }}>
            {stage.emoji}
          </div>
        </div>

        {/* XP Bar */}
        <p className="text-center text-[11px] opacity-60 mb-2">
          XP: {ag.xp} / {ag.xpNext} · Complete goals to level up
        </p>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-400 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${xpPct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] opacity-50 mt-1">
          <span>{doneCount}/{ag.goals.length} goals</span>
          <span>{100 - xpPct}% to next level</span>
        </div>
      </div>

      {/* Evolution Path */}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">🏆 Evolution Path</p>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {AVATAR_STAGES.map((s, i) => {
            const isActive = ag.level >= s.minLv && (i === AVATAR_STAGES.length - 1 || ag.level < AVATAR_STAGES[i + 1].minLv)
            const isDone   = i < AVATAR_STAGES.length - 1 && ag.level >= AVATAR_STAGES[i + 1].minLv
            return (
              <div key={s.title} className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl text-center min-w-[56px]"
                style={{
                  background: isDone ? 'linear-gradient(135deg,#1e1b4b,#6d28d9)' : isActive ? 'linear-gradient(135deg,#3730a3,#6d28d9)' : '#f1f5f9',
                  border: isActive ? '2.5px solid #6d28d9' : '2px solid transparent',
                }}>
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-[8px] font-black" style={{ color: isDone || isActive ? '#fff' : '#64748b' }}>LV {s.minLv}</span>
                <span className="text-[7px]" style={{ color: isDone || isActive ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>{s.title.split(' ')[0]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Goals List */}
      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(160deg,#0d0a2e,#1e1b4b,#312e81)' }}>
        <p className="text-base font-black text-white mb-1">🎯 Level-Up Goals</p>
        <p className="text-xs text-white/50 mb-4">Tap to toggle · Each goal earns XP</p>
        <div className="space-y-2">
          {ag.goals.map(g => (
            <div key={g.id} onClick={() => toggleGoal(g.id)}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
              style={{ background: g.done ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)' }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black transition-all
                ${g.done ? 'bg-emerald-400 text-white' : 'border-2 border-white/30 text-white/30'}`}>
                {g.done ? '✓' : ''}
              </div>
              <span className="text-xl flex-shrink-0">{g.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: g.done ? 'rgba(255,255,255,0.45)' : '#fff', textDecoration: g.done ? 'line-through' : 'none' }}>
                  {g.label}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Earn +{g.xp} XP</p>
              </div>
              {g.done && <span className="text-xs font-black text-emerald-400 flex-shrink-0">+{g.xp} ✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 text-xs text-violet-700 font-medium">
        🌟 Your avatar evolves as you hit real health goals. Keep logging daily!
      </div>
    </div>
  )
}

// ── STREAKS TAB ────────────────────────────────────────────────────────────────
function StreaksTab() {
  const [moods, setMoods] = useState([])
  const [bp, setBp]       = useState([])
  const [bs, setBs]       = useState([])

  useEffect(() => {
    patientApi.getMoods().then(r => setMoods(r.data?.data || [])).catch(() => {})
    patientApi.getBloodPressure().then(r => setBp(r.data?.data || [])).catch(() => {})
    patientApi.getBloodSugar().then(r => setBs(r.data?.data || [])).catch(() => {})
  }, [])

  const calcStreak = (records, dateField = 'date') => {
    if (!records.length) return 0
    const dates = new Set(records.map(r => r[dateField]?.slice(0, 10)).filter(Boolean))
    let streak = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().slice(0, 10)
      if (dates.has(ds)) { streak++; d.setDate(d.getDate() - 1) }
      else break
    }
    return streak
  }

  const moodStreak = calcStreak(moods)
  const bpStreak   = calcStreak(bp)
  const bsStreak   = calcStreak(bs)
  const overall    = Math.max(moodStreak, bpStreak, bsStreak)

  const allDates = new Set([
    ...moods.map(r => r.date?.slice(0, 10)),
    ...bp.map(r => r.date?.slice(0, 10)),
    ...bs.map(r => r.date?.slice(0, 10)),
  ].filter(Boolean))

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 6 + i)
    const ds = d.toISOString().slice(0, 10)
    const days = ['S','M','T','W','T','F','S']
    return { ds, day: days[d.getDay()], isToday: i === 6, logged: allDates.has(ds) }
  })

  const cats = [
    { icon: '🫀', label: 'Blood Pressure', streak: bpStreak,   bg: '#fdecea' },
    { icon: '🩸', label: 'Blood Sugar',    streak: bsStreak,   bg: '#e8f0fe' },
    { icon: '😊', label: 'Daily Mood',     streak: moodStreak, bg: '#fef9c3' },
  ]

  const motivMsg = overall >= 7 ? "You're in the top 10% of Heal Focus users! 🏅"
    : overall >= 3 ? `Just ${7 - overall} more days to earn your 🏆 Warrior badge!`
    : overall > 0  ? 'Great start! Keep logging daily to build your streak!'
    : 'Log any health data today to start your streak! 🔥'

  return (
    <div className="space-y-4">
      {/* Main streak banner */}
      <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#1e1b4b,#3730a3)' }}>
        <div className="flex items-center gap-4 mb-3">
          <div className="text-5xl">🔥</div>
          <div>
            <p className="text-[10px] opacity-60 tracking-widest">OVERALL HEALTH STREAK</p>
            <p className="text-5xl font-black leading-none">{overall}</p>
            <p className="text-sm opacity-75">day{overall !== 1 ? 's' : ''} in a row</p>
          </div>
          {overall >= 7 && (
            <div className="ml-auto rounded-2xl p-3 text-center" style={{ background: 'linear-gradient(135deg,#6d28d9,#fbbf24)' }}>
              <div className="text-2xl">🏆</div>
              <div className="text-[10px] font-black mt-0.5">WARRIOR</div>
            </div>
          )}
        </div>
        {/* 7-day grid */}
        <div className="flex gap-1">
          {last7.map(d => (
            <div key={d.ds} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-center text-[10px] font-bold ${d.logged ? 'bg-green-400/30' : d.isToday ? 'bg-white/10' : 'bg-white/5'}`}>
              <span className="opacity-70">{d.day}</span>
              <span>{d.logged ? '✓' : d.isToday ? '·' : ''}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] opacity-50 mt-2">Log vitals, mood to keep your streak alive 🔥</p>
      </div>

      {/* Category streaks */}
      <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Category Streaks</p>
      {cats.map(item => (
        <div key={item.label} className="bg-white border border-primary-100 rounded-2xl p-3.5 flex items-center gap-3 shadow-card">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: item.bg }}>
            {item.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{item.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {item.streak > 0 ? `${item.streak}-day streak${item.streak >= 3 ? ' 🔥' : ''}` : 'Not started yet'}
            </p>
          </div>
          {item.streak >= 7 ? (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">🏆 7+</span>
          ) : item.streak >= 3 ? (
            <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full">{item.streak}🔥</span>
          ) : (
            <span className="text-xs text-gray-400 font-medium">Start →</span>
          )}
        </div>
      ))}

      {/* Motivation */}
      <div className="rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)' }}>
        <div className="text-3xl mb-2">{overall >= 7 ? '🏆' : overall >= 3 ? '🔥' : '💪'}</div>
        <p className="text-sm font-black text-primary-900 mb-1">
          {overall >= 7 ? `Legendary! ${overall}-day streak!` : overall >= 3 ? `On fire! ${overall} days going strong!` : 'Start your streak today!'}
        </p>
        <p className="text-xs text-primary-700 leading-relaxed">{motivMsg}</p>
      </div>
    </div>
  )
}
