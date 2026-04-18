import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Pages
import LoginPage from '@/pages/LoginPage'
import PatientLayout from '@/pages/patient/PatientLayout'
import PatientHome from '@/pages/patient/PatientHome'
import PatientAppointments from '@/pages/patient/PatientAppointments'
import PatientBook from '@/pages/patient/PatientBook'
import PatientRecords from '@/pages/patient/PatientRecords'
import PatientHealth from '@/pages/patient/PatientHealth'
import PatientProfile from '@/pages/patient/PatientProfile'
import PatientNotifications from '@/pages/patient/PatientNotifications'
import PatientGenZ from '@/pages/patient/PatientGenZ'
import PatientWellness from '@/pages/patient/PatientWellness'
import PatientAdmissions from '@/pages/patient/PatientAdmissions'

import DoctorLayout from '@/pages/doctor/DoctorLayout'
import DoctorAppointments from '@/pages/doctor/DoctorAppointments'
import DoctorOPD from '@/pages/doctor/DoctorOPD'
import DoctorPatients from '@/pages/doctor/DoctorPatients'
import DoctorRecords from '@/pages/doctor/DoctorRecords'
import DoctorDischarge from '@/pages/doctor/DoctorDischarge'
import DoctorBills from '@/pages/doctor/DoctorBills'
import DoctorDoctors from '@/pages/doctor/DoctorDoctors'
import DoctorPromos from '@/pages/doctor/DoctorPromos'
import DoctorServiceRequests from '@/pages/doctor/DoctorServiceRequests'
import DoctorNotifications from '@/pages/doctor/DoctorNotifications'

import AdminLayout from '@/pages/admin/AdminLayout'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminHospitals from '@/pages/admin/AdminHospitals'
import AdminPatients from '@/pages/admin/AdminPatients'
import AdminAdmissions from '@/pages/admin/AdminAdmissions'
import AdminPromos from '@/pages/admin/AdminPromos'
import AdminServiceRequests from '@/pages/admin/AdminServiceRequests'
import AdminOnboarding from '@/pages/admin/AdminOnboarding'
import AdminTeam from '@/pages/admin/AdminTeam'
import AdminBillCheck from '@/pages/admin/AdminBillCheck'
import AdminRecords from '@/pages/admin/AdminRecords'
import AdminNotifications from '@/pages/admin/AdminNotifications'

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      {/* Patient Routes */}
      <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientLayout /></ProtectedRoute>}>
        <Route index element={<PatientHome />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="book" element={<PatientBook />} />
        <Route path="records" element={<PatientRecords />} />
        <Route path="health" element={<PatientHealth />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="notifications" element={<PatientNotifications />} />
        <Route path="genz" element={<PatientGenZ />} />
        <Route path="wellness" element={<PatientWellness />} />
        <Route path="admissions" element={<PatientAdmissions />} />
      </Route>

      {/* Hospital Staff Routes */}
      <Route path="/hospital" element={<ProtectedRoute allowedRoles={['hospital','doctor']}><DoctorLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="appointments" replace />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="opd" element={<DoctorOPD />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="records" element={<DoctorRecords />} />
        <Route path="discharge" element={<DoctorDischarge />} />
        <Route path="bills" element={<DoctorBills />} />
        <Route path="doctors" element={<DoctorDoctors />} />
        <Route path="promos" element={<DoctorPromos />} />
        <Route path="requests" element={<DoctorServiceRequests />} />
        <Route path="notifications" element={<DoctorNotifications />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="hospitals" element={<AdminHospitals />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="admissions" element={<AdminAdmissions />} />
        <Route path="promos" element={<AdminPromos />} />
        <Route path="requests" element={<AdminServiceRequests />} />
        <Route path="onboarding" element={<AdminOnboarding />} />
        <Route path="team" element={<AdminTeam />} />
        <Route path="billcheck" element={<AdminBillCheck />} />
        <Route path="records" element={<AdminRecords />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
