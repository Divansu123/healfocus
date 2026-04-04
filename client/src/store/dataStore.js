import { create } from 'zustand'
import { today, nowTime } from '@/lib/utils'

// ─── Seed Data ───────────────────────────────────
const SEED = {
  specialties: [
    { id: 'cardio', name: 'Cardiology', icon: '❤️' },
    { id: 'neuro', name: 'Neurology', icon: '🧠' },
    { id: 'ortho', name: 'Orthopedics', icon: '🦴' },
    { id: 'derm', name: 'Dermatology', icon: '🩺' },
    { id: 'pedia', name: 'Pediatrics', icon: '👶' },
    { id: 'ophthal', name: 'Ophthalmology', icon: '👁️' },
    { id: 'dental', name: 'Dental', icon: '🦷' },
    { id: 'general', name: 'General', icon: '🩻' },
    { id: 'psych', name: 'Psychiatry', icon: '🧘' },
  ],
  hospitals: [
    { id: 1, name: 'City General Hospital', icon: '🏥', city: 'Faridabad', address: 'Sector 12, Faridabad', rating: 4.8, beds: 500, phone: '0129-2234567', email: 'info@citygen.com', status: 'active', lat: 28.4089, lng: 77.3178 },
    { id: 2, name: 'Apollo Medical Center', icon: '🏨', city: 'Gurugram', address: 'DLF Phase 2, Gurugram', rating: 4.9, beds: 300, phone: '0124-3345678', email: 'info@apollo.com', status: 'active', lat: 28.4595, lng: 77.0266 },
    { id: 3, name: 'Sunrise Clinic', icon: '🏩', city: 'Delhi', address: 'Lajpat Nagar, Delhi', rating: 4.6, beds: 100, phone: '011-26456789', email: 'info@sunrise.com', status: 'active', lat: 28.5665, lng: 77.2431 },
    { id: 4, name: 'Max Super Speciality', icon: '🏫', city: 'Noida', address: 'Sector 19, Noida', rating: 4.7, beds: 400, phone: '0120-4556677', email: 'info@maxnoida.com', status: 'active', lat: 28.5707, lng: 77.326 },
  ],
  doctors: [
    { id: 1, name: 'Dr. Priya Sharma', spec: 'Cardiologist', specId: 'cardio', hospitalId: 1, icon: '👩‍⚕️', rating: 4.9, exp: 12, fee: 800, slots: ['09:00', '09:30', '10:00', '11:30', '14:00', '15:30', '16:00'], bg: '#e8f0fe', availability: ['Mon', 'Tue', 'Wed', 'Fri'] },
    { id: 2, name: 'Dr. Rahul Mehta', spec: 'Neurologist', specId: 'neuro', hospitalId: 1, icon: '👨‍⚕️', rating: 4.7, exp: 9, fee: 1000, slots: ['09:00', '10:30', '11:00', '14:30', '15:00', '16:30'], bg: '#f3e8ff', availability: ['Mon', 'Wed', 'Thu', 'Sat'] },
    { id: 3, name: 'Dr. Anita Kapoor', spec: 'Orthopedic Surgeon', specId: 'ortho', hospitalId: 2, icon: '👩‍⚕️', rating: 4.8, exp: 15, fee: 900, slots: ['08:30', '09:00', '10:00', '13:00', '14:00', '15:00', '17:00'], bg: '#e6f4ed', availability: ['Tue', 'Wed', 'Thu', 'Fri'] },
    { id: 4, name: 'Dr. Sameer Joshi', spec: 'Dermatologist', specId: 'derm', hospitalId: 2, icon: '👨‍⚕️', rating: 4.6, exp: 7, fee: 600, slots: ['10:00', '10:30', '11:30', '13:00', '15:00', '16:00'], bg: '#fff3e0', availability: ['Mon', 'Tue', 'Fri', 'Sat'] },
    { id: 5, name: 'Dr. Meera Nair', spec: 'Pediatrician', specId: 'pedia', hospitalId: 3, icon: '👩‍⚕️', rating: 4.9, exp: 11, fee: 700, slots: ['09:00', '09:30', '10:30', '11:00', '14:00', '14:30', '15:30'], bg: '#fdecea', availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    { id: 6, name: 'Dr. Vikram Das', spec: 'General Physician', specId: 'general', hospitalId: 1, icon: '👨‍⚕️', rating: 4.5, exp: 6, fee: 400, slots: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'], bg: '#e8f0fe', availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  ],
  appointments: [
    { id: 'APT001', patientId: 'PAT001', patientName: 'Amit Kumar', patientAge: 35, doctorId: 1, hospitalId: 1, date: '2026-03-30', time: '09:00', reason: 'Chest pain checkup', status: 'confirmed', created: '2026-03-12' },
    { id: 'APT002', patientId: 'PAT001', patientName: 'Amit Kumar', patientAge: 35, doctorId: 6, hospitalId: 1, date: '2026-02-20', time: '14:00', reason: 'BP follow up', status: 'completed', created: '2026-02-18' },
    { id: 'APT003', patientId: 'PAT002', patientName: 'Rohan Singh', patientAge: 28, doctorId: 6, hospitalId: 1, date: '2026-03-28', time: '14:00', reason: 'Fever & cough', status: 'confirmed', created: '2026-03-11' },
    { id: 'APT004', patientId: 'PAT003', patientName: 'Priti Gupta', patientAge: 42, doctorId: 2, hospitalId: 1, date: '2026-03-29', time: '09:00', reason: 'Headaches', status: 'pending', created: '2026-03-12' },
    { id: 'APT005', patientId: 'PAT004', patientName: 'Kamal Mehta', patientAge: 67, doctorId: 4, hospitalId: 2, date: '2026-03-13', time: '10:00', reason: 'Skin rash', status: 'cancelled', created: '2026-03-10' },
  ],
  registeredPatients: [
    { id: 'PAT001', name: 'Amit Kumar', age: 35, phone: '+91 98765 43210', email: 'amit@email.com', bloodType: 'O+', city: 'Faridabad', joined: '2025-01-10', status: 'active', allergies: 'Penicillin', conditions: 'Pre-diabetic, Hypertension', gender: 'Male' },
    { id: 'PAT002', name: 'Rohan Singh', age: 28, phone: '+91 98765 11122', email: 'rohan@email.com', bloodType: 'A+', city: 'Delhi', joined: '2025-03-15', status: 'active', allergies: 'None', conditions: 'None', gender: 'Male' },
    { id: 'PAT003', name: 'Priti Gupta', age: 42, phone: '+91 98765 22233', email: 'priti@email.com', bloodType: 'B+', city: 'Gurugram', joined: '2025-06-20', status: 'active', allergies: 'Sulfa', conditions: 'Migraine', gender: 'Female' },
    { id: 'PAT004', name: 'Kamal Mehta', age: 67, phone: '+91 98765 33344', email: 'kamal@email.com', bloodType: 'O-', city: 'Faridabad', joined: '2025-09-05', status: 'active', allergies: 'Aspirin', conditions: 'Diabetes, Hypertension', gender: 'Male' },
    { id: 'PAT005', name: 'Neha Agarwal', age: 8, phone: '+91 98765 44455', email: 'parent@email.com', bloodType: 'A+', city: 'Delhi', joined: '2026-01-12', status: 'active', allergies: 'Dust', conditions: 'Asthma', gender: 'Female' },
  ],
  familyMembers: {
    PAT001: [
      { id: 'FAM001', name: 'Sunita Kumar', age: 32, relation: 'Spouse', icon: '👩', bloodType: 'A+', phone: '+91 98765 00001', allergies: 'None', conditions: 'None' },
      { id: 'FAM002', name: 'Rahul Kumar', age: 10, relation: 'Son', icon: '👦', bloodType: 'O+', phone: '—', allergies: 'Dust', conditions: 'Asthma' },
    ],
  },
  medicalRecords: [
    { id: 'MR001', patientId: 'PAT001', type: 'Lab Report', title: 'Complete Blood Count', date: '2026-03-01', hospital: 'City General Hospital', doctor: 'Dr. Vikram Das', summary: 'WBC: 7.2, RBC: 5.1, Hemoglobin: 14.2 g/dL — All within normal range.', tags: ['blood', 'routine'], addedBy: 'hospital', files: [] },
    { id: 'MR002', patientId: 'PAT001', type: 'Prescription', title: 'Hypertension Medication', date: '2026-02-20', hospital: 'City General Hospital', doctor: 'Dr. Priya Sharma', summary: 'Amlodipine 5mg once daily. Atenolol 50mg once daily. Review in 3 months.', tags: ['cardio', 'medicine'], addedBy: 'hospital', files: [] },
  ],
  insuranceCards: [
    { id: 'INS001', patientId: 'PAT001', provider: 'Star Health Insurance', policyNo: 'SHI-2024-98765', type: 'Family Floater', coverAmount: 500000, premium: 18500, validFrom: '2025-04-01', validTo: '2026-03-31', membersName: 'Amit, Sunita, Rahul', tpaName: 'Medi Assist', emergencyNo: '1800-425-2255', status: 'active' },
  ],
  insuranceClaims: [
    { id: 'CLM001', patientId: 'PAT001', insuranceId: 'INS001', claimNo: 'CLM-2026-0012', date: '2026-01-15', hospital: 'City General Hospital', reason: 'Laparoscopic Appendectomy', amount: 85000, approvedAmount: 78000, status: 'approved', remarks: 'Pre-auth approved. Cashless settled.', updatedBy: 'hospital', updatedAt: '2026-01-20' },
    { id: 'CLM002', patientId: 'PAT001', insuranceId: 'INS001', claimNo: 'CLM-2026-0031', date: '2026-03-01', hospital: 'City General Hospital', reason: 'CBC & BP Medications', amount: 3200, approvedAmount: null, status: 'processing', remarks: 'Documents under review.', updatedBy: 'hospital', updatedAt: '2026-03-05' },
  ],
  bsReadings: {
    PAT001: [
      { id: 1, value: 98, type: 'fasting', date: '2026-03-10', time: '08:00', notes: 'Morning' },
      { id: 2, value: 145, type: 'post-meal', date: '2026-03-10', time: '13:30', notes: 'After lunch' },
      { id: 3, value: 110, type: 'fasting', date: '2026-03-11', time: '07:45', notes: '' },
      { id: 4, value: 188, type: 'post-meal', date: '2026-03-11', time: '19:00', notes: 'After dinner' },
      { id: 5, value: 102, type: 'fasting', date: '2026-03-12', time: '08:15', notes: '' },
    ],
  },
  bpReadings: {
    PAT001: [
      { id: 1, systolic: 128, diastolic: 82, pulse: 72, date: '2026-03-10', time: '09:00', notes: 'Morning' },
      { id: 2, systolic: 135, diastolic: 88, pulse: 78, date: '2026-03-11', time: '09:15', notes: 'After walk' },
      { id: 3, systolic: 142, diastolic: 92, pulse: 80, date: '2026-03-11', time: '20:00', notes: 'Stressed' },
      { id: 4, systolic: 122, diastolic: 80, pulse: 70, date: '2026-03-12', time: '08:30', notes: 'Good' },
    ],
  },
  moods: {
    PAT001: [
      { id: 1, emoji: '😊', label: 'Good', score: 4, date: '2026-03-27', time: '09:00', notes: 'Feeling great' },
      { id: 2, emoji: '😴', label: 'Tired', score: 2, date: '2026-03-26', time: '20:00', notes: 'Didn\'t sleep well' },
    ],
  },
  skinScans: { PAT001: [] },
  vaccinations: {
    PAT001: [
      { id: 'V001', name: 'COVID-19 Booster', date: '2024-11-10', status: 'done', nextDue: null },
      { id: 'V002', name: 'Flu Vaccine (Annual)', date: '2025-10-05', status: 'done', nextDue: '2026-10-01' },
      { id: 'V003', name: 'Hepatitis B (3rd dose)', date: null, status: 'due', nextDue: '2026-04-01' },
      { id: 'V004', name: 'Typhoid Booster', date: null, status: 'upcoming', nextDue: '2026-06-15' },
    ],
  },
  reminders: {
    PAT001: [
      { id: 'R001', type: 'med', icon: '💊', title: 'Amlodipine 5mg', time: '08:00 AM', freq: 'Daily', done: false },
      { id: 'R002', type: 'med', icon: '💊', title: 'Atenolol 50mg', time: '09:00 AM', freq: 'Daily', done: false },
      { id: 'R003', type: 'diet', icon: '🥗', title: 'Low-sodium diet', time: 'All Day', freq: 'Daily', done: false },
      { id: 'R004', type: 'exercise', icon: '🚶', title: '30-min walk', time: '06:30 PM', freq: 'Daily', done: true },
      { id: 'R005', type: 'water', icon: '💧', title: 'Drink 8 glasses', time: 'Throughout', freq: 'Daily', done: false },
    ],
  },
  promotions: [
    { id: 'PRM001', title: 'Free Health Check-up', desc: 'Complete health screening at zero cost. Valid for first-time patients only.', type: 'Scheme', discount: '100% Free', validTill: '2026-04-30', hospitalId: 1, color: 'linear-gradient(135deg,#1e8a4c,#34d399)', active: true, applicableTo: 'all' },
    { id: 'PRM002', title: '20% Off Cardiology', desc: 'Get 20% discount on all cardiology consultations this month.', type: 'Discount', discount: '20% OFF', validTill: '2026-03-31', hospitalId: 2, color: 'linear-gradient(135deg,#1a73e8,#60a5fa)', active: true, applicableTo: 'all' },
    { id: 'PRM003', title: 'Senior Citizen Benefits', desc: 'Special priority appointments and 30% discount for patients above 60 years.', type: 'Benefit', discount: '30% OFF', validTill: '2026-12-31', hospitalId: null, color: 'linear-gradient(135deg,#6b21a8,#a855f7)', active: true, applicableTo: 'senior' },
  ],
  notifications: {
    PAT001: [
      { id: 'N001', type: 'appt', icon: '📅', title: 'Appointment Confirmed', msg: 'Your appointment with Dr. Priya Sharma on Mar 30 at 9:00 AM is confirmed.', time: '2 hrs ago', read: false },
      { id: 'N002', type: 'promo', icon: '🎁', title: 'New Offer Available', msg: 'Free Health Check-up at City General Hospital. Valid till Apr 30.', time: '1 day ago', read: false },
      { id: 'N003', type: 'health', icon: '⚠️', title: 'Health Alert', msg: 'Your last blood sugar reading (188 mg/dL) was high. Consider consulting your doctor.', time: '2 days ago', read: true },
    ],
    hospital_1: [
      { id: 'NH001', type: 'appt', icon: '📋', title: 'New Appointment', msg: 'Priti Gupta booked with Dr. Rahul Mehta on Mar 29.', time: '30 min ago', read: false },
      { id: 'NH002', type: 'admission', icon: '🏥', title: 'Admission Request', msg: 'Indoor treatment request from Amit Kumar for Cardiac Surgery.', time: '1 hr ago', read: false },
      { id: 'NH003', type: 'claim', icon: '🛡️', title: 'Claim Update', msg: 'Insurance claim CLM-2026-0031 requires document verification.', time: '3 hrs ago', read: true },
    ],
    hospital_2: [], hospital_3: [], hospital_4: [],
    admin: [
      { id: 'ADN001', type: 'signup', icon: '🏥', title: 'Hospital Signup Request', msg: 'Medanta Medicity, Gurugram has requested to join Heal Focus.', time: '2 hrs ago', read: false },
      { id: 'ADN002', type: 'claim', icon: '🛡️', title: 'Claim Escalated', msg: 'Insurance claim from Amit Kumar escalated for manual review.', time: '4 hrs ago', read: false },
      { id: 'ADN003', type: 'appt', icon: '📋', title: 'Appointment Spike', msg: 'City General Hospital: 47 appointments today — 3× usual volume.', time: '6 hrs ago', read: true },
    ],
  },
  hospitalSignupRequests: [
    { id: 'HSR001', name: 'Medanta Medicity', city: 'Gurugram', address: 'Sector 38, Gurugram', phone: '0124-4141414', email: 'admin@medanta.org', beds: 1250, type: 'Super Speciality', contact: 'Dr. Naresh Trehan', requestedAt: '2026-03-13 10:00', status: 'pending', note: 'Leading cardiac and multi-organ centre' },
    { id: 'HSR002', name: 'Fortis Escorts', city: 'Faridabad', address: 'Neelam Bata Rd, Faridabad', phone: '0129-2255000', email: 'contact@fortis-faridabad.com', beds: 300, type: 'Multi Speciality', contact: 'Mr. Ramesh Kumar', requestedAt: '2026-03-12 14:30', status: 'pending', note: 'Cardiac and orthopaedic focus' },
  ],
  admissions: [
    { id: 'ADM001', patientId: 'PAT001', patientName: 'Amit Kumar', type: 'Surgery', treatmentName: 'Cardiac Bypass Surgery', hospital: 'City General Hospital', preferredDate: '2026-04-10', urgency: 'planned', notes: 'Requested by cardiologist.', status: 'pending', createdAt: '2026-03-10' },
  ],
  dischargeSummaries: [
    { id: 'DS001', patientName: 'Amit Kumar', patientAge: 35, patientId: 'PAT001', hospitalId: 1, diagnosisCode: 'I25.1', primaryDiagnosis: 'Stable Angina', admissionDate: '2026-01-10', dischargeDate: '2026-01-15', insuranceProvider: 'Star Health Insurance', policyNo: 'SHI-2024-98765', policyAge: '2', preExistingCovered: 'Yes', roomType: 'General Ward', treatmentSummary: 'Patient admitted for cardiac evaluation. ECG, stress test, and echocardiography performed. Managed with medications.', status: 'final', createdAt: '2026-01-15' },
  ],
  indoorBills: [
    {
      id: 'BILL001', patientId: 'PAT001', patientName: 'Amit Kumar', hospitalId: 1, admissionDate: '2026-01-10', dischargeDate: '2026-01-15', insuranceId: 'INS001',
      items: [
        { desc: 'Room Charges (General Ward x 5 days)', category: 'room', amount: 15000, claimable: true },
        { desc: 'Surgeon Fees', category: 'doctor', amount: 25000, claimable: true },
        { desc: 'Operation Theatre Charges', category: 'procedure', amount: 20000, claimable: true },
        { desc: 'Medicines & Consumables', category: 'pharmacy', amount: 8500, claimable: true },
        { desc: 'Diagnostic Tests (ECG, Echo)', category: 'diagnostic', amount: 4500, claimable: true },
        { desc: 'Nursing Charges', category: 'nursing', amount: 5000, claimable: true },
        { desc: 'Attendant Charges', category: 'non-medical', amount: 2000, claimable: false },
        { desc: 'Food (Canteen)', category: 'non-medical', amount: 1500, claimable: false },
      ],
      status: 'draft', createdAt: '2026-01-15',
    },
  ],
  serviceRequests: [
    { id: 'REQ001', hospitalId: 1, hospitalName: 'City General Hospital', category: 'equipment', title: 'ICU Ventilator', description: 'Need 2 ICU-grade ventilators for expanding critical care unit.', status: 'pending', priority: 'high', createdAt: '2026-03-08', adminNotes: '' },
    { id: 'REQ002', hospitalId: 2, hospitalName: 'Apollo Medical Center', category: 'marketing', title: 'Google Ads Campaign', description: 'Looking for digital marketing support for cardiology department.', status: 'reviewing', priority: 'medium', createdAt: '2026-03-10', adminNotes: 'Shortlisted 3 agencies.' },
    { id: 'REQ003', hospitalId: 1, hospitalName: 'City General Hospital', category: 'claim', title: 'Claim Assistance for March', description: 'Need help with 12 pending cashless claims.', status: 'resolved', priority: 'high', createdAt: '2026-03-05', adminNotes: 'Resolved with TPA Medi Assist.' },
  ],
  opdPatients: [
    { id: 'OPD001', hospitalId: 1, name: 'Sunita Verma', age: 45, gender: 'Female', phone: '9876543210', visitDate: '2026-03-28', time: '09:30', doctorId: 6, complaint: 'Fever, body ache', diagnosis: 'Viral fever', prescription: 'Paracetamol 500mg, rest', followUp: '2026-04-04', status: 'completed', tokenNo: 1 },
    { id: 'OPD002', hospitalId: 1, name: 'Rakesh Yadav', age: 38, gender: 'Male', phone: '9876543211', visitDate: '2026-03-28', time: '10:00', doctorId: 1, complaint: 'Chest pain on exertion', diagnosis: '', prescription: '', followUp: '', status: 'waiting', tokenNo: 2 },
    { id: 'OPD003', hospitalId: 1, name: 'Anita Sharma', age: 62, gender: 'Female', phone: '9876543212', visitDate: '2026-03-28', time: '10:30', doctorId: 6, complaint: 'Knee pain, difficulty walking', diagnosis: 'Osteoarthritis', prescription: 'Diclofenac gel, Calcium supplement', followUp: '2026-04-28', status: 'in-progress', tokenNo: 3 },
  ],
  teamMembers: [
    { id: 'TM001', name: 'Ravi Gupta', email: 'ravi@medibook.in', role: 'Billing Analyst', permissions: ['billcheck', 'records'], status: 'active', addedAt: '2025-12-01', avatar: '👨‍💼' },
    { id: 'TM002', name: 'Sneha Patel', email: 'sneha@medibook.in', role: 'Claims Manager', permissions: ['hospitals', 'patients', 'admissions'], status: 'active', addedAt: '2026-01-10', avatar: '👩‍💼' },
  ],
  recordConsents: { PAT001: { hospital_1: false, admin: false } },
  consentRequests: {
    PAT001: [
      { id: 'CR001', requestedBy: 'hospital', hospId: 1, hospName: 'City Care Hospital', role: 'hospital', requestedAt: '2026-03-12 10:30', status: 'pending', purpose: 'View medical records for treatment' },
      { id: 'CR002', requestedBy: 'admin', hospId: null, hospName: 'Heal Focus Admin', role: 'admin', requestedAt: '2026-03-11 14:00', status: 'pending', purpose: 'Insurance claim verification' },
    ],
  },
}

// ─── Store ────────────────────────────────────────
export const useDataStore = create((set, get) => ({
  ...JSON.parse(JSON.stringify(SEED)), // deep clone

  // ── Appointments ──
  addAppointment: (appt) => set((s) => ({ appointments: [appt, ...s.appointments] })),
  updateAppointment: (id, data) => set((s) => ({
    appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...data } : a)),
  })),

  // ── BS/BP ──
  addBsReading: (pid, r) => set((s) => ({
    bsReadings: { ...s.bsReadings, [pid]: [r, ...(s.bsReadings[pid] || [])] },
  })),
  deleteBsReading: (pid, id) => set((s) => ({
    bsReadings: { ...s.bsReadings, [pid]: (s.bsReadings[pid] || []).filter((r) => r.id !== id) },
  })),
  addBpReading: (pid, r) => set((s) => ({
    bpReadings: { ...s.bpReadings, [pid]: [r, ...(s.bpReadings[pid] || [])] },
  })),
  deleteBpReading: (pid, id) => set((s) => ({
    bpReadings: { ...s.bpReadings, [pid]: (s.bpReadings[pid] || []).filter((r) => r.id !== id) },
  })),

  // ── Mood ──
  addMood: (pid, mood) => set((s) => ({
    moods: { ...s.moods, [pid]: [mood, ...(s.moods[pid] || [])] },
  })),

  // ── Skin Scans ──
  addSkinScan: (pid, scan) => set((s) => ({
    skinScans: { ...s.skinScans, [pid]: [scan, ...(s.skinScans[pid] || [])] },
  })),

  // ── Reminders ──
  toggleReminder: (pid, id) => set((s) => ({
    reminders: {
      ...s.reminders,
      [pid]: (s.reminders[pid] || []).map((r) => (r.id === id ? { ...r, done: !r.done } : r)),
    },
  })),
  addReminder: (pid, r) => set((s) => ({
    reminders: { ...s.reminders, [pid]: [...(s.reminders[pid] || []), r] },
  })),
  deleteReminder: (pid, id) => set((s) => ({
    reminders: { ...s.reminders, [pid]: (s.reminders[pid] || []).filter((r) => r.id !== id) },
  })),

  // ── Records ──
  addMedicalRecord: (rec) => set((s) => ({ medicalRecords: [rec, ...s.medicalRecords] })),
  updateMedicalRecord: (id, data) => set((s) => ({
    medicalRecords: s.medicalRecords.map((r) => (r.id === id ? { ...r, ...data } : r)),
  })),
  deleteMedicalRecord: (id) => set((s) => ({
    medicalRecords: s.medicalRecords.filter((r) => r.id !== id),
  })),

  // ── Insurance ──
  addInsurance: (ins) => set((s) => ({ insuranceCards: [...s.insuranceCards, ins] })),
  updateInsurance: (id, data) => set((s) => ({
    insuranceCards: s.insuranceCards.map((i) => (i.id === id ? { ...i, ...data } : i)),
  })),
  deleteInsurance: (id) => set((s) => ({
    insuranceCards: s.insuranceCards.filter((i) => i.id !== id),
  })),

  // ── Claims ──
  addClaim: (claim) => set((s) => ({ insuranceClaims: [claim, ...s.insuranceClaims] })),
  updateClaim: (id, data) => set((s) => ({
    insuranceClaims: s.insuranceClaims.map((c) => (c.id === id ? { ...c, ...data } : c)),
  })),

  // ── Family ──
  addFamilyMember: (pid, member) => set((s) => ({
    familyMembers: { ...s.familyMembers, [pid]: [...(s.familyMembers[pid] || []), member] },
  })),
  updateFamilyMember: (pid, id, data) => set((s) => ({
    familyMembers: {
      ...s.familyMembers,
      [pid]: (s.familyMembers[pid] || []).map((m) => (m.id === id ? { ...m, ...data } : m)),
    },
  })),
  deleteFamilyMember: (pid, id) => set((s) => ({
    familyMembers: { ...s.familyMembers, [pid]: (s.familyMembers[pid] || []).filter((m) => m.id !== id) },
  })),

  // ── Notifications ──
  markNotifRead: (key, id) => set((s) => ({
    notifications: {
      ...s.notifications,
      [key]: (s.notifications[key] || []).map((n) => (n.id === id ? { ...n, read: true } : n)),
    },
  })),
  markAllRead: (key) => set((s) => ({
    notifications: {
      ...s.notifications,
      [key]: (s.notifications[key] || []).map((n) => ({ ...n, read: true })),
    },
  })),
  addNotification: (key, notif) => set((s) => ({
    notifications: {
      ...s.notifications,
      [key]: [notif, ...(s.notifications[key] || [])],
    },
  })),

  // ── Admissions ──
  addAdmission: (adm) => set((s) => ({ admissions: [adm, ...s.admissions] })),
  updateAdmission: (id, data) => set((s) => ({
    admissions: s.admissions.map((a) => (a.id === id ? { ...a, ...data } : a)),
  })),

  // ── Discharge Summaries ──
  addDischargeSummary: (ds) => set((s) => ({ dischargeSummaries: [ds, ...s.dischargeSummaries] })),
  updateDischargeSummary: (id, data) => set((s) => ({
    dischargeSummaries: s.dischargeSummaries.map((d) => (d.id === id ? { ...d, ...data } : d)),
  })),
  deleteDischargeSummary: (id) => set((s) => ({
    dischargeSummaries: s.dischargeSummaries.filter((d) => d.id !== id),
  })),

  // ── Indoor Bills ──
  addIndoorBill: (bill) => set((s) => ({ indoorBills: [bill, ...s.indoorBills] })),
  updateIndoorBill: (id, data) => set((s) => ({
    indoorBills: s.indoorBills.map((b) => (b.id === id ? { ...b, ...data } : b)),
  })),
  deleteIndoorBill: (id) => set((s) => ({ indoorBills: s.indoorBills.filter((b) => b.id !== id) })),

  // ── OPD ──
  addOpdPatient: (opd) => set((s) => ({ opdPatients: [opd, ...s.opdPatients] })),
  updateOpdPatient: (id, data) => set((s) => ({
    opdPatients: s.opdPatients.map((o) => (o.id === id ? { ...o, ...data } : o)),
  })),
  deleteOpdPatient: (id) => set((s) => ({ opdPatients: s.opdPatients.filter((o) => o.id !== id) })),

  // ── Service Requests ──
  addServiceRequest: (req) => set((s) => ({ serviceRequests: [req, ...s.serviceRequests] })),
  updateServiceRequest: (id, data) => set((s) => ({
    serviceRequests: s.serviceRequests.map((r) => (r.id === id ? { ...r, ...data } : r)),
  })),

  // ── Promotions ──
  addPromotion: (promo) => set((s) => ({ promotions: [promo, ...s.promotions] })),
  updatePromotion: (id, data) => set((s) => ({
    promotions: s.promotions.map((p) => (p.id === id ? { ...p, ...data } : p)),
  })),
  deletePromotion: (id) => set((s) => ({ promotions: s.promotions.filter((p) => p.id !== id) })),

  // ── Hospitals ──
  addHospital: (hosp) => set((s) => ({ hospitals: [...s.hospitals, hosp] })),
  updateHospital: (id, data) => set((s) => ({
    hospitals: s.hospitals.map((h) => (h.id === id ? { ...h, ...data } : h)),
  })),

  // ── Patients ──
  addPatient: (pat) => set((s) => ({ registeredPatients: [...s.registeredPatients, pat] })),
  updatePatient: (id, data) => set((s) => ({
    registeredPatients: s.registeredPatients.map((p) => (p.id === id ? { ...p, ...data } : p)),
  })),

  // ── Doctors ──
  addDoctor: (doc) => set((s) => ({ doctors: [...s.doctors, doc] })),
  updateDoctor: (id, data) => set((s) => ({
    doctors: s.doctors.map((d) => (d.id === id ? { ...d, ...data } : d)),
  })),
  deleteDoctor: (id) => set((s) => ({ doctors: s.doctors.filter((d) => d.id !== id) })),

  // ── Hospital Signup Requests ──
  addHospitalSignupRequest: (req) => set((s) => ({ hospitalSignupRequests: [req, ...s.hospitalSignupRequests] })),
  updateHospitalSignupRequest: (id, data) => set((s) => ({
    hospitalSignupRequests: s.hospitalSignupRequests.map((r) => (r.id === id ? { ...r, ...data } : r)),
  })),

  // ── Team Members ──
  addTeamMember: (m) => set((s) => ({ teamMembers: [...s.teamMembers, m] })),
  updateTeamMember: (id, data) => set((s) => ({
    teamMembers: s.teamMembers.map((m) => (m.id === id ? { ...m, ...data } : m)),
  })),
  deleteTeamMember: (id) => set((s) => ({ teamMembers: s.teamMembers.filter((m) => m.id !== id) })),

  // ── Consent ──
  updateConsent: (pid, key, val) => set((s) => ({
    recordConsents: { ...s.recordConsents, [pid]: { ...(s.recordConsents[pid] || {}), [key]: val } },
  })),
  updateConsentRequest: (pid, id, data) => set((s) => ({
    consentRequests: {
      ...s.consentRequests,
      [pid]: (s.consentRequests[pid] || []).map((r) => (r.id === id ? { ...r, ...data } : r)),
    },
  })),

  // ── Vaccinations ──
  addVaccination: (pid, v) => set((s) => ({
    vaccinations: { ...s.vaccinations, [pid]: [v, ...(s.vaccinations[pid] || [])] },
  })),
  updateVaccination: (pid, id, data) => set((s) => ({
    vaccinations: {
      ...s.vaccinations,
      [pid]: (s.vaccinations[pid] || []).map((v) => (v.id === id ? { ...v, ...data } : v)),
    },
  })),
}))
