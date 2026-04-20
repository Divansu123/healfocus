import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar, EmptyState } from '@/components/ui'
import { fmtMoney } from '@/lib/utils'
import { Search, Star, CheckCircle, MapPin, Phone, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { publicApi, patientApi } from '@/api'

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PatientBook() {
  const navigate = useNavigate()

  // Steps: 'hospitals' | 'hospital_detail' | 'doctor_all' | 'slot' | 'confirm'
  const [step, setStep]                         = useState('hospitals')
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [selectedDoctor, setSelectedDoctor]     = useState(null)
  const [selectedDate, setSelectedDate]         = useState(null)
  const [selectedSlot, setSelectedSlot]         = useState(null)
  const [reason, setReason]                     = useState('')
  const [booking, setBooking]                   = useState(false)
  const [hospSearch, setHospSearch]             = useState('')
  const [docSearch, setDocSearch]               = useState('')
  const [doctors,      setDoctors]      = useState([])
  const [hospitals,    setHospitals]    = useState([])
  const [slots,        setSlots]        = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([publicApi.getDoctors(), publicApi.getHospitals()])
      .then(([docRes, hospRes]) => {
        setDoctors(docRes.data?.data || [])
        setHospitals(hospRes.data?.data || [])
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d
  })

  const filteredHospitals = hospitals.filter(h =>
    !hospSearch || h.name?.toLowerCase().includes(hospSearch.toLowerCase()) ||
    h.city?.toLowerCase().includes(hospSearch.toLowerCase())
  )

  const hospitalDoctors = selectedHospital
    ? doctors.filter(d => d.hospitalId === selectedHospital.id)
    : []

  const filteredHospDocs = hospitalDoctors.filter(d =>
    !docSearch ||
    d.name?.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.speciality?.toLowerCase().includes(docSearch.toLowerCase())
  )

  const filteredAllDocs = doctors.filter(d =>
    !docSearch ||
    d.name?.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.speciality?.toLowerCase().includes(docSearch.toLowerCase())
  )

  const fetchSlots = async (doctorId, dateStr) => {
    setLoadingSlots(true)
    try {
      const res = await publicApi.getDoctorSlots(doctorId, dateStr)
      setSlots(res.data?.data?.slots || [])
    } catch { setSlots([]) } finally { setLoadingSlots(false) }
  }

  const selectDate = (date) => {
    setSelectedDate(date); setSelectedSlot(null)
    if (selectedDoctor) fetchSlots(selectedDoctor.id, date.toISOString().split('T')[0])
  }

  const handleBack = () => {
    if (step === 'hospital_detail') { setStep('hospitals'); setSelectedHospital(null); setDocSearch('') }
    else if (step === 'doctor_all')  { setStep('hospitals'); setDocSearch('') }
    else if (step === 'slot')        { selectedHospital ? setStep('hospital_detail') : setStep('doctor_all') }
    else if (step === 'confirm')     { setStep('slot') }
    else navigate('/patient')
  }

  const pickDoctor = (d) => { setSelectedDoctor(d); setStep('slot') }

  const confirmBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select doctor, date, and time'); return
    }
    setBooking(true)
    try {
      await patientApi.bookAppointment({
        doctorId:   selectedDoctor.id,
        hospitalId: selectedDoctor.hospitalId,
        date:       selectedDate.toISOString().split('T')[0],
        time:       selectedSlot,
        reason,
      })
      toast.success('Appointment booked!')
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
      <TopBar hideOnDesktop title="Book Appointment" onBack={handleBack} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">

        {/* ── STEP 1 : Hospitals List ── */}
        {step === 'hospitals' && (
          <div>
            <p className="text-sm font-black text-primary-950 mb-3">Select Hospital</p>

            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={hospSearch} onChange={e => setHospSearch(e.target.value)}
                placeholder="Search hospital or city..."
                className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500" />
            </div>

            {/* Search All Doctors shortcut */}
            <button
              onClick={() => { setSelectedHospital(null); setDocSearch(''); setStep('doctor_all') }}
              className="w-full mb-4 p-3 bg-primary-50 border-2 border-primary-200 rounded-2xl text-left flex items-center gap-2 hover:border-primary-400 transition-all">
              <span className="text-xl">🔍</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-primary-700">Search All Doctors</p>
                <p className="text-[11px] text-primary-400">Browse doctors across all hospitals</p>
              </div>
              <ChevronRight size={16} className="text-primary-400" />
            </button>

            {!filteredHospitals.length
              ? <EmptyState icon="🏥" title="No hospitals found" />
              : (
              <div className="space-y-3">
                {filteredHospitals.map((h, idx) => {
                  const docCount = doctors.filter(d => d.hospitalId === h.id).length
                  return (
                    <div key={h.id}
                      onClick={() => { setSelectedHospital(h); setDocSearch(''); setStep('hospital_detail') }}
                      className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card cursor-pointer hover:border-primary-300 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl flex-shrink-0 border border-primary-200">
                          {h.icon || '🏥'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {idx === 0 && <span className="text-[9px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Nearest</span>}
                            <p className="text-sm font-black text-primary-950 truncate">{h.name}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {h.city && <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><MapPin size={9}/>{h.city}</span>}
                            {h.rating && <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold"><Star size={9}/>{h.rating}</span>}
                            {h.beds && <span className="text-[10px] text-gray-400">{h.beds} beds</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {h.phone && (
                            <button onClick={e => { e.stopPropagation(); window.open(`tel:${h.phone}`) }}
                              className="flex items-center gap-0.5 text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                              <Phone size={9}/> Call
                            </button>
                          )}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${h.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {h.status || 'active'}
                          </span>
                        </div>
                      </div>
                      {docCount > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">👨‍⚕️ {docCount} doctor{docCount !== 1 ? 's' : ''} available</span>
                          <span className="text-[10px] text-primary-600 font-bold flex items-center gap-0.5">View <ChevronRight size={10}/></span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2 : Hospital Detail + Its Doctors ── */}
        {step === 'hospital_detail' && selectedHospital && (
          <div>
            {/* Hospital card */}
            <div className="bg-gradient-to-br from-primary-700 to-violet-600 rounded-2xl p-4 text-white mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-3xl">
                  {selectedHospital.icon || '🏥'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-base truncate">{selectedHospital.name}</p>
                  {selectedHospital.city && (
                    <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5"><MapPin size={10}/>{selectedHospital.city}</p>
                  )}
                  {selectedHospital.address && (
                    <p className="text-[10px] opacity-70 mt-0.5 truncate">{selectedHospital.address}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {selectedHospital.rating && (
                  <div className="flex-1 bg-white/15 rounded-xl p-2 text-center">
                    <p className="text-sm font-black flex items-center justify-center gap-0.5"><Star size={11} className="fill-amber-300 text-amber-300"/>{selectedHospital.rating}</p>
                    <p className="text-[9px] opacity-70">Rating</p>
                  </div>
                )}
                {selectedHospital.beds && (
                  <div className="flex-1 bg-white/15 rounded-xl p-2 text-center">
                    <p className="text-sm font-black">{selectedHospital.beds}</p>
                    <p className="text-[9px] opacity-70">Beds</p>
                  </div>
                )}
                <div className="flex-1 bg-white/15 rounded-xl p-2 text-center">
                  <p className="text-sm font-black">{hospitalDoctors.length}</p>
                  <p className="text-[9px] opacity-70">Doctors</p>
                </div>
              </div>
              {selectedHospital.phone && (
                <button onClick={() => window.open(`tel:${selectedHospital.phone}`)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 transition-all rounded-xl py-2 text-xs font-bold">
                  <Phone size={12}/> {selectedHospital.phone}
                </button>
              )}
            </div>

            <p className="text-sm font-black text-primary-950 mb-2">Available Doctors</p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={docSearch} onChange={e => setDocSearch(e.target.value)}
                placeholder="Search doctor or speciality..."
                className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"/>
            </div>

            {!filteredHospDocs.length
              ? <EmptyState icon="👨‍⚕️" title="No doctors found in this hospital"/>
              : (
              <div className="space-y-3">
                {filteredHospDocs.map(d => (
                  <div key={d.id} onClick={() => pickDoctor(d)}
                    className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card cursor-pointer hover:border-primary-300 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl border border-primary-200">{d.icon || '👨‍⚕️'}</div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-primary-950">{d.name}</p>
                        <p className="text-xs text-gray-500">{d.speciality}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {d.rating > 0 && <div className="flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400"/><span className="text-xs">{d.rating}</span></div>}
                          {d.fee > 0 && <span className="text-xs font-bold text-primary-700">{fmtMoney(d.fee)}</span>}
                          {d.experience && <span className="text-[10px] text-gray-400">{d.experience} yrs exp</span>}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 flex-shrink-0"/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2b : All Doctors Search ── */}
        {step === 'doctor_all' && (
          <div>
            <p className="text-sm font-black text-primary-950 mb-3">All Doctors</p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={docSearch} onChange={e => setDocSearch(e.target.value)}
                placeholder="Search doctor or speciality..."
                className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"/>
            </div>
            {!filteredAllDocs.length
              ? <EmptyState icon="👨‍⚕️" title="No doctors found"/>
              : (
              <div className="space-y-3">
                {filteredAllDocs.map(d => {
                  const hosp = hospitals.find(h => h.id === d.hospitalId)
                  return (
                    <div key={d.id} onClick={() => pickDoctor(d)}
                      className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card cursor-pointer hover:border-primary-300 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl border border-primary-200">{d.icon || '👨‍⚕️'}</div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-primary-950">{d.name}</p>
                          <p className="text-xs text-gray-500">{d.speciality}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
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

        {/* ── STEP 3 : Slot Selection ── */}
        {step === 'slot' && selectedDoctor && (
          <div>
            <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">{selectedDoctor.icon || '👨‍⚕️'}</div>
                <div>
                  <p className="text-sm font-black text-primary-950">{selectedDoctor.name}</p>
                  <p className="text-xs text-gray-500">{selectedDoctor.speciality}</p>
                  {(() => {
                    const hosp = hospitals.find(h => h.id === selectedDoctor.hospitalId)
                    return hosp ? <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5"><MapPin size={9}/>{hosp.name}</p> : null
                  })()}
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-600 mb-2">Select Date</p>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {next7.map((d, i) => {
                const sel = selectedDate?.toDateString() === d.toDateString()
                return (
                  <button key={i} onClick={() => selectDate(d)}
                    className={`flex-shrink-0 w-14 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${sel ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
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
                {loadingSlots
                  ? <div className="text-center py-4 text-gray-400 text-xs">Loading slots...</div>
                  : !slots.filter(s => s.available).length
                    ? <div className="text-center py-4 text-gray-400 text-xs">No slots available</div>
                    : (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {slots.filter(s => s.available).map(slot => (
                        <button key={slot.time} onClick={() => setSelectedSlot(slot.time)}
                          className={`py-2 text-xs font-bold rounded-xl border-2 transition-all ${selectedSlot === slot.time ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )
                }
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

        {/* ── STEP 4 : Confirm ── */}
        {step === 'confirm' && (
          <div>
            <p className="text-sm font-black text-primary-950 mb-4">Confirm Booking</p>
            <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card mb-4 space-y-3">
              {[
                ['Doctor',     selectedDoctor?.name],
                ['Speciality', selectedDoctor?.speciality],
                ['Date',       selectedDate?.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })],
                ['Time',       selectedSlot],
                ['Hospital',   hospitals.find(h => h.id === selectedDoctor?.hospitalId)?.name || '—'],
                ['Fee',        selectedDoctor?.fee ? fmtMoney(selectedDoctor.fee) : '—'],
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
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-primary-500 h-20 resize-none"/>
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
