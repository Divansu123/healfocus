/**
 * soundUtils.js — Healfocus ke liye sound system
 *
 * 1. playNotificationSound() — chime (3 melodic notes) — notification pe
 * 2. playAlarmPattern()      — chime loop (repeating) — reminder alarm pe
 *
 * Web Audio API — koi external file nahi, website + app dono mein kaam karta hai
 */

// ─── Shared AudioContext ────────────────────────────────────────────────────────
let _ctx = null

function getCtx() {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

// ─── 1. NOTIFICATION SOUND (chime — melodic 🎵) ────────────────────────────────
/**
 * Teen melodic notes — C5, E5, G5 (major chord)
 * Pleasant chime — notification aayi tab ek baar bajta hai
 */
export function playNotificationSound() {
  try {
    const ctx   = getCtx()
    const notes = [523, 659, 784]   // C5, E5, G5

    notes.forEach((freq, i) => {
      const t    = ctx.currentTime + i * 0.18
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)

      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)

      osc.start(t)
      osc.stop(t + 0.55)
    })
  } catch (e) {
    console.warn('[Sound] Notification sound failed:', e)
  }
}

// ─── 2. ALARM SOUND (chime loop — repeating 🔔) ────────────────────────────────
/**
 * Same chime pattern but repeating — reminder alarm ke liye
 * Ascending 5 notes, pause, repeat — jab tak dismiss na ho
 */
function playAlarmPattern(ctx, startTime) {
  const notes   = [523, 587, 659, 784, 880]  // C5, D5, E5, G5, A5 — ascending
  const NOTE_DUR = 0.22
  const NOTE_GAP = 0.04
  const PAUSE    = 0.7

  notes.forEach((freq, i) => {
    const t    = startTime + i * (NOTE_DUR + NOTE_GAP)
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.45, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + NOTE_DUR)

    osc.start(t)
    osc.stop(t + NOTE_DUR)
  })

  const totalDur = notes.length * (NOTE_DUR + NOTE_GAP)
  return startTime + totalDur + PAUSE
}

// ─── 3. REMINDER ALARM SCHEDULER ───────────────────────────────────────────────

const _alarmTimers  = new Map()
const _activeAlarms = new Map()

/**
 * Saare reminders schedule karo.
 * @param {Array} reminders — { id, title, time, freq, done }
 *   time format: "HH:MM" (24hr)
 */
export function scheduleReminderAlarms(reminders) {
  clearAllAlarms()

  reminders.forEach((r) => {
    if (!r.time) return

    const msUntil = msUntilNextFiring(r)
    if (msUntil === null) return

    const tid = setTimeout(() => {
      fireAlarm(r)
    }, msUntil)

    _alarmTimers.set(r.id, tid)
  })
}

/** Sab pending alarms cancel karo */
export function clearAllAlarms() {
  _alarmTimers.forEach((tid) => clearTimeout(tid))
  _alarmTimers.clear()

  _activeAlarms.forEach((iid) => clearInterval(iid))
  _activeAlarms.clear()
}

/** Ek alarm dismiss karo */
export function dismissAlarm(reminderId) {
  const iid = _activeAlarms.get(reminderId)
  if (iid) { clearInterval(iid); _activeAlarms.delete(reminderId) }
  if (window.__healfocus_dismissAlarm) window.__healfocus_dismissAlarm(reminderId)
}

// ─── Internal helpers ───────────────────────────────────────────────────────────

function msUntilNextFiring(reminder) {
  const now   = new Date()
  const [hh, mm] = reminder.time.split(':').map(Number)
  const target = new Date(now)
  target.setHours(hh, mm, 0, 0)

  if (target <= now) return null

  const todayKey = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()]
  if (reminder.freq === 'Daily') {
    // har roz
  } else if (reminder.freq === 'Mon-Fri') {
    const dayNum = now.getDay()
    if (dayNum === 0 || dayNum === 6) return null
  } else if (reminder.freq === 'Weekly') {
    return null
  } else if (reminder.freq && reminder.freq !== 'Daily') {
    if (!reminder.freq.includes(todayKey)) return null
  }

  return target - now
}

function fireAlarm(reminder) {
  const origTitle = document.title
  let patternCount = 0
  const MAX_PATTERNS = 30

  function ringOnce() {
    if (patternCount >= MAX_PATTERNS) { stopRinging(); return }
    try {
      const ctx = getCtx()
      playAlarmPattern(ctx, ctx.currentTime)
      patternCount++
      document.title = patternCount % 2 === 0 ? `🔔 ${reminder.title}` : origTitle
    } catch (e) {
      console.warn('[Sound] Alarm error:', e)
    }
  }

  ringOnce()
  const iid = setInterval(ringOnce, 2000)
  _activeAlarms.set(reminder.id, iid)

  function stopRinging() {
    clearInterval(iid)
    _activeAlarms.delete(reminder.id)
    document.title = origTitle
  }

  window.dispatchEvent(new CustomEvent('healfocus:alarm', {
    detail: { reminder, dismiss: () => { stopRinging(); dismissAlarm(reminder.id) } }
  }))
}
