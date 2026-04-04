import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '@/components/ui'
import { today, nowTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { patientApi } from '@/api'

const MOODS = [
  { emoji: '😄', label: 'Great',  score: 5, color: '#22c55e', tip: 'Awesome! Keep up those good vibes 🌟' },
  { emoji: '😊', label: 'Good',   score: 4, color: '#86efac', tip: 'Nice! A solid day going forward 💪' },
  { emoji: '😐', label: 'Okay',   score: 3, color: '#fbbf24', tip: 'Neutral days are okay. Breathe in 🌿' },
  { emoji: '😔', label: 'Low',    score: 2, color: '#f87171', tip: "It's okay to have off days. Be kind to yourself 💙" },
  { emoji: '😢', label: 'Rough',  score: 1, color: '#ef4444', tip: 'Tough day? Try journaling or a short walk 🌈' },
]

const GOALS = [
  { id:'g1', icon:'🚶', label:'30-min walk',      xp:50 },
  { id:'g2', icon:'💧', label:'8 glasses water',   xp:30 },
  { id:'g3', icon:'🥗', label:'Healthy meal',       xp:40 },
  { id:'g4', icon:'😴', label:'8 hrs sleep',        xp:60 },
  { id:'g5', icon:'🧘', label:'5-min meditation',   xp:35 },
]

export default function PatientGenZ() {
  const navigate = useNavigate()
  const [selectedMood, setSelectedMood] = useState(null)
  const [moodTip, setMoodTip] = useState('')
  const [moodSaved, setMoodSaved] = useState(false)
  const [completedGoals, setCompletedGoals] = useState([])
  const [xp, setXp] = useState(0)
  const [moods, setMoods] = useState([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    patientApi.getMoods()
      .then(res => setMoods(res.data?.data || []))
      .catch(() => {})
  }, [])

  const logMood = async (mood) => {
    setSelectedMood(mood)
    setMoodTip(mood.tip)
    try {
      await patientApi.addMood({ emoji: mood.emoji, label: mood.label, score: mood.score, date: today(), time: nowTime(), notes })
      setMoodSaved(true)
      toast.success('Mood logged! 🎉')
      patientApi.getMoods().then(res => setMoods(res.data?.data || [])).catch(() => {})
    } catch { toast.error('Failed to log mood') }
  }

  const toggleGoal = (goal) => {
    if (completedGoals.includes(goal.id)) {
      setCompletedGoals(prev => prev.filter(g => g !== goal.id))
      setXp(prev => prev - goal.xp)
    } else {
      setCompletedGoals(prev => [...prev, goal.id])
      setXp(prev => prev + goal.xp)
      toast.success(`+${goal.xp} XP! 🌟`)
    }
  }

  const level = Math.floor(xp / 100) + 1
  const levelXp = xp % 100

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="✨ GenZ Features" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0 space-y-5">

        {/* XP Bar */}
        <div className="bg-gradient-to-br from-violet-600 to-primary-700 rounded-3xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs opacity-70">Level {level}</p>
              <p className="text-xl font-black">⚡ {xp} XP</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70">Next level</p>
              <p className="text-sm font-bold">{100 - levelXp} XP away</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-2">
            <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${levelXp}%` }} />
          </div>
        </div>

        {/* Daily Goals */}
        <div>
          <p className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Daily Goals</p>
          <div className="space-y-2">
            {GOALS.map(g => {
              const done = completedGoals.includes(g.id)
              return (
                <button key={g.id} onClick={() => toggleGoal(g)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${done ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                  <span className="text-2xl">{g.icon}</span>
                  <span className="text-sm font-bold flex-1 text-gray-800">{g.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>+{g.xp} XP</span>
                  {done && <span className="text-green-500 font-black">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mood Tracker */}
        <div>
          <p className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2">How are you feeling?</p>
          <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
            {!moodSaved ? (
              <>
                <div className="flex justify-around mb-3">
                  {MOODS.map(m => (
                    <button key={m.label} onClick={() => logMood(m)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${selectedMood?.label === m.label ? 'bg-primary-50 scale-110' : 'hover:bg-gray-50'}`}>
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="text-[10px] font-bold text-gray-500">{m.label}</span>
                    </button>
                  ))}
                </div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional note..."
                  className="w-full border-2 border-gray-200 rounded-xl p-2 text-xs resize-none h-16 outline-none focus:border-primary-400" />
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-3xl mb-1">{selectedMood?.emoji}</p>
                <p className="text-sm font-bold text-gray-700">{selectedMood?.tip}</p>
                <button onClick={() => { setMoodSaved(false); setSelectedMood(null); setNotes('') }}
                  className="mt-3 text-xs font-bold text-primary-600">Log again</button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Moods */}
        {moods.length > 0 && (
          <div>
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Recent Moods</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {moods.slice(0, 7).map(m => (
                <div key={m.id} className="flex-shrink-0 bg-white border border-primary-100 rounded-2xl p-3 text-center w-16 shadow-card">
                  <p className="text-2xl">{m.emoji}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{m.date?.slice(5)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
