import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: 'https://healfocus-api.onrender.com/api',
  withCredentials: true,
})

// Har request me token bhejna
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Agar access token expire ho jaye to refresh karna
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshRes = await axios.post(
          'https://healfocus-api.onrender.com/api/auth/refresh',
          {},
          { withCredentials: true }
        )
        const newToken = refreshRes.data?.data?.accessToken
        const currentUser = useAuthStore.getState().user
        useAuthStore.getState().setAuth(currentUser, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        useAuthStore.getState().logout()
        window.location.href = '/'
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ─────────────────────────────────────────
// AUTH APIs
// ─────────────────────────────────────────
export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  signup: (payload) => api.post('/auth/register', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  createAdmin: (payload) => api.post('/admin/createAdmin', payload),
  createHospital: (payload) => api.post('/admin/createHospital', payload),
}

// ─────────────────────────────────────────
// PUBLIC APIs
// ─────────────────────────────────────────
export const publicApi = {
  getSpecialties: () => api.get('/public/specialties'),
  getDoctors: () => api.get('/public/doctors'),
  getDoctorSlots: (doctorId, date) => api.get(`/public/doctors/${doctorId}/slots?date=${date}`),
  getHospitals: () => api.get('/public/hospitals'),
  getPromotions: () => api.get('/public/promotions'),
  registerHospital: (payload) => api.post('/public/hospital-signup-req', payload),
}

// ─────────────────────────────────────────
// PATIENT APIs
// ─────────────────────────────────────────
export const patientApi = {
  // Profile
  getProfile: () => api.get('/patient/profile'),
  updateProfile: (payload) => api.put('/patient/profile', payload),

  // Appointments
  getAppointments: () => api.get('/patient/appointments'),
  bookAppointment: (payload) => api.post('/patient/appointments', payload),
  cancelAppointment: (id) => api.patch(`/patient/appointments/${id}/cancel`),

  // Medical Records
  getMedicalRecords: () => api.get('/patient/records'),
  addMedicalRecord: (payload) => api.post('/patient/records', payload),
  deleteMedicalRecord: (id) => api.delete(`/patient/records/${id}`),

  // Blood Sugar
  getBloodSugar: () => api.get('/patient/health/blood-sugar'),
  addBloodSugar: (payload) => api.post('/patient/health/blood-sugar', payload),
  deleteBloodSugar: (id) => api.delete(`/patient/health/blood-sugar/${id}`),

  // Blood Pressure
  getBloodPressure: () => api.get('/patient/health/blood-pressure'),
  addBloodPressure: (payload) => api.post('/patient/health/blood-pressure', payload),
  deleteBloodPressure: (id) => api.delete(`/patient/health/blood-pressure/${id}`),

  // Wellness - Moods
  getMoods: () => api.get('/patient/wellness/moods'),
  addMood: (payload) => api.post('/patient/wellness/moods', payload),

  // Wellness - Vaccinations
  getVaccinations: () => api.get('/patient/wellness/vaccinations'),
  addVaccination: (payload) => api.post('/patient/wellness/vaccinations', payload),

  // Wellness - Reminders
  getReminders: () => api.get('/patient/wellness/reminders'),
  addReminder: (payload) => api.post('/patient/wellness/reminders', payload),
  toggleReminder: (id) => api.patch(`/patient/wellness/reminders/${id}/toggle`),
  deleteReminder: (id) => api.delete(`/patient/wellness/reminders/${id}`),

  // Family
  getFamilyMembers: () => api.get('/patient/family'),
  addFamilyMember: (payload) => api.post('/patient/family', payload),
  deleteFamilyMember: (id) => api.delete(`/patient/family/${id}`),

  // Insurance
  getInsurance: () => api.get('/patient/insurance'),
  addInsurance: (payload) => api.post('/patient/insurance', payload),

  // Admissions
  getAdmissions: () => api.get('/patient/admissions'),
  requestAdmission: (payload) => api.post('/patient/admissions', payload),

  // Notifications
  getNotifications: () => api.get('/patient/notifications'),
  markNotificationRead: (id) => api.patch(`/patient/notifications/${id}/read`),

  // Consent
  getConsentRequests: () => api.get('/patient/consent'),
  respondToConsent: (id, payload) => api.patch(`/patient/consent/${id}`, payload),
}

// ─────────────────────────────────────────
// HOSPITAL APIs
// ─────────────────────────────────────────
export const hospitalApi = {
  // Appointments
  getAppointments: () => api.get('/hospital/appointments'),
  updateAppointment: (id, payload) => api.patch(`/hospital/appointments/${id}`, payload),

  // Doctors
  getDoctors: () => api.get('/hospital/doctors'),
  addDoctor: (payload) => api.post('/hospital/doctors', payload),
  updateDoctor: (id, payload) => api.put(`/hospital/doctors/${id}`, payload),
  deleteDoctor: (id) => api.delete(`/hospital/doctors/${id}`),

  // OPD
  getOpdPatients: () => api.get('/hospital/opd'),
  addOpdPatient: (payload) => api.post('/hospital/opd', payload),
  updateOpdPatient: (id, payload) => api.put(`/hospital/opd/${id}`, payload),

  // Patients
  getPatients: () => api.get('/hospital/patients'),

  // Promotions
  getPromotions: () => api.get('/hospital/promotions'),
  addPromotion: (payload) => api.post('/hospital/promotions', payload),
  updatePromotion: (id, payload) => api.put(`/hospital/promotions/${id}`, payload),
  deletePromotion: (id) => api.delete(`/hospital/promotions/${id}`),

  // Service Requests
  getServiceRequests: () => api.get('/hospital/service-requests'),
  addServiceRequest: (payload) => api.post('/hospital/service-requests', payload),

  // Bills
  getBills: () => api.get('/hospital/bills'),
  createBill: (payload) => api.post('/hospital/bills', payload),
  updateBillStatus: (id, payload) => api.patch(`/hospital/bills/${id}/status`, payload),

  // Discharge
  getDischargeSummaries: () => api.get('/hospital/discharge'),
  createDischargeSummary: (payload) => api.post('/hospital/discharge', payload),
  updateDischargeSummary: (id, payload) => api.put(`/hospital/discharge/${id}`, payload),

  // Notifications
  getNotifications: () => api.get('/hospital/notifications'),
  markNotificationRead: (id) => api.patch(`/hospital/notifications/${id}/read`),
}

// ─────────────────────────────────────────
// ADMIN APIs
// ─────────────────────────────────────────
export const adminApi = {
  // Overview
  getOverview: () => api.get('/admin/overview'),

  // Hospitals
  getHospitals: () => api.get('/admin/hospitals'),
  updateHospitalStatus: (id, payload) => api.patch(`/admin/hospitals/${id}/status`, payload),

  // Onboarding
  getSignupRequests: () => api.get('/admin/onboarding'),
  approveSignupRequest: (id) => api.post(`/admin/onboarding/${id}/approve`),
  rejectSignupRequest: (id) => api.post(`/admin/onboarding/${id}/reject`),

  // Patients
  getPatients: () => api.get('/admin/patients'),

  // Admissions
  getAdmissions: () => api.get('/admin/admissions'),
  updateAdmissionStatus: (id, payload) => api.patch(`/admin/admissions/${id}/status`, payload),

  // Promotions
  getAllPromotions: () => api.get('/admin/promotions'),
  createPromotion: (payload) => api.post('/admin/promotions', payload),
  updatePromotion: (id, payload) => api.put(`/admin/promotions/${id}`, payload),
  deletePromotion: (id) => api.delete(`/admin/promotions/${id}`),

  // Service Requests
  getAllServiceRequests: () => api.get('/admin/service-requests'),
  updateServiceRequest: (id, payload) => api.patch(`/admin/service-requests/${id}`, payload),

  // Team
  getTeamMembers: () => api.get('/admin/team'),
  addTeamMember: (payload) => api.post('/admin/team', payload),
  updateTeamMember: (id, payload) => api.put(`/admin/team/${id}`, payload),
  removeTeamMember: (id) => api.delete(`/admin/team/${id}`),

  // Notifications
  getNotifications: () => api.get('/admin/notifications'),
  markNotificationRead: (id) => api.patch(`/admin/notifications/${id}/read`),
}
