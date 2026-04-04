import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar, EmptyState } from '@/components/ui'
import { fmtMoney } from '@/lib/utils'
import { Search, Star, CheckCircle, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { publicApi, patientApi } from '@/api'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PatientBook() {
  const navigate = useNavigate()
  const [step, setStep] = useState('specialty')
  const [selectedSpec, setSelectedSpec] = useState(null)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [reason, setReason] = useState('')
  const [booking, setBooking] = useState(false)
  const [search, setSearch] = useState('')

  const [specialties, setSpecialties] = useState([])
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([publicApi.getSpecialties(), publicApi.getDoctors(), publicApi.getHospitals()])
      .then(([specRes, docRes, hospRes]) => {
        setSpecialties(specRes.data?.data || [])
        setDoctors(docRes.data?.data || [])
        setHospitals(hospRes.data?.data || [])
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  // Generate next 7 dates
  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return d
  })

  const filteredDoctors = doctors.filter(d =>
    (!selectedSpec || d.specialityId === selectedSpec?.id || d.speciality?.toLowerCase().includes(selectedSpec?.name?.toLowerCase())) &&
    (!search || d.name?.toLowerCase().includes(search.toLowerCase()))
  )

  const fetchSlots = async (doctorId, dateStr) => {
    setLoadingSlots(true)
    try {
      const res = await publicApi.getDoctorSlots(doctorId, dateStr)
      setSlots(res.data?.data?.slots || [])
    } catch { setSlots([]) } finally { setLoadingSlots(false) }
  }

  const selectDate = (date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    const dateStr = date.toISOString().split('T')[0]
    if (selectedDoctor) fetchSlots(selectedDoctor.id, dateStr)
  }

  const confirmBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select doctor, date, and time')
      return
    }
    setBooking(true)
    try {
      await patientApi.bookAppointment({
        doctorId: selectedDoctor.id,
        hospitalId: selectedDoctor.hospitalId,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedSlot,
        reason,
      })
      toast.success('Appointment booked! 🎉')
      navigate('/patient/appointments')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally { setBooking(false) }
  }

  if (loading) return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="Book Appointment" onBack={() => navigate('/patient')} />
      <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="Book Appointment" onBack={() => {
        if (step === 'doctor') setStep('specialty')
        else if (step === 'slot') setStep('doctor')
        else if (step === 'confirm') setStep('slot')
        else navigate('/patient')
      }} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">

        {/* Step 1 — Specialty */}
        {step === 'specialty' && (
          <div>
            <p className="text-sm font-black text-primary-950 mb-3">Select Speciality</p>
            <button onClick={() => { setSelectedSpec(null); setStep('doctor') }}
              className="w-full mb-3 p-3 bg-primary-50 border-2 border-primary-200 rounded-2xl text-left">
              <span className="text-base font-bold text-primary-700">🔍 Search All Doctors</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              {specialties.map(s => (
                <button key={s.id} onClick={() => { setSelectedSpec(s); setStep('doctor') }}
                  className="p-4 bg-white border-2 border-gray-100 rounded-2xl text-center hover:border-primary-300 hover:bg-primary-50 transition-all">
                  <p className="text-2xl mb-1">{s.icon || '🩺'}</p>
                  <p className="text-xs font-bold text-gray-700">{s.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Doctor */}
        {step === 'doctor' && (
          <div>
            <p className="text-sm font-black text-primary-950 mb-3">{selectedSpec ? selectedSpec.name : 'All'} Doctors</p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctor..."
                className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500" />
            </div>
            {!filteredDoctors.length ? <EmptyState icon="👨‍⚕️" title="No doctors found" /> : (
              <div className="space-y-3">
                {filteredDoctors.map(d => {
                  const hosp = hospitals.find(h => h.id === d.hospitalId)
                  return (
                    <div key={d.id} onClick={() => { setSelectedDoctor(d); setStep('slot') }}
                      className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card cursor-pointer hover:border-primary-300 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl border border-primary-200">{d.icon || '👨‍⚕️'}</div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-primary-950">{d.name}</p>
                          <p className="text-xs text-gray-500">{d.speciality}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {d.rating > 0 && <div className="flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400"/><span className="text-xs">{d.rating}</span></div>}
                            {d.fee > 0 && <span className="text-xs font-bold text-primary-700">{fmtMoney(d.fee)}</span>}
                          </div>
                          {hosp && <div className="flex items-center gap-1 mt-1"><MapPin size={10} className="text-gray-400"/><span className="text-[10px] text-gray-400">{hosp.name}</span></div>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Slot */}
        {step === 'slot' && selectedDoctor && (
          <div>
            <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">{selectedDoctor.icon || '👨‍⚕️'}</div>
                <div>
                  <p className="text-sm font-black text-primary-950">{selectedDoctor.name}</p>
                  <p className="text-xs text-gray-500">{selectedDoctor.speciality}</p>
                </div>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-600 mb-2">Select Date</p>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {next7.map((d, i) => {
                const isSelected = selectedDate?.toDateString() === d.toDateString()
                return (
                  <button key={i} onClick={() => selectDate(d)}
                    className={`flex-shrink-0 w-14 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
                    <span className="text-[10px] font-bold">{DAYS[d.getDay()]}</span>
                    <span className="text-lg font-black">{d.getDate()}</span>
                    <span className="text-[9px] opacity-70">{MONTHS[d.getMonth()]}</span>
                  </button>
                )
              })}
            </div>
            {selectedDate && (
              <>
                <p className="text-xs font-bold text-gray-600 mb-2">Available Slots</p>
                {loadingSlots ? <div className="text-center py-4 text-gray-400 text-xs">Loading slots...</div> :
                  !slots.filter(s => s.available).length ? <div className="text-center py-4 text-gray-400 text-xs">No slots available</div> : (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {slots.filter(slot => slot.available).map(slot => (
                      <button key={slot.time} onClick={() => setSelectedSlot(slot.time)}
                        className={`py-2 text-xs font-bold rounded-xl border-2 transition-all ${selectedSlot === slot.time ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {selectedSlot && (
              <button onClick={() => setStep('confirm')}
                className="w-full py-3 bg-gradient-to-r from-primary-800 to-violet-700 text-white font-bold rounded-2xl">
                Continue →
              </button>
            )}
          </div>
        )}

        {/* Step 4 — Confirm */}
        {step === 'confirm' && (
          <div>
            <p className="text-sm font-black text-primary-950 mb-4">Confirm Booking</p>
            <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card mb-4 space-y-3">
              {[
                ['Doctor', selectedDoctor?.name],
                ['Date', selectedDate?.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })],
                ['Time', selectedSlot],
                ['Hospital', hospitals.find(h => h.id === selectedDoctor?.hospitalId)?.name || '—'],
                ['Fee', selectedDoctor?.fee ? fmtMoney(selectedDoctor.fee) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <p className="text-xs text-gray-500">{k}</p>
                  <p className="text-xs font-bold text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-600 mb-1">Reason for visit (optional)</p>
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Describe your symptoms..."
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-primary-500 h-20 resize-none" />
            </div>
            <button onClick={confirmBook} disabled={booking}
              className="w-full py-3 bg-gradient-to-r from-primary-800 to-violet-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
              {booking ? 'Booking...' : <><CheckCircle size={16}/> Confirm Appointment</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
