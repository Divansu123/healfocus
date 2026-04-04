# 🏥 HealFocus — React Vite Frontend

Smart Healthcare Platform — Frontend Only (Backend-ready)

## 📁 Project Structure

```
src/
├── App.jsx                          # Root router with all routes
├── main.jsx                         # Entry point + providers
├── index.css                        # Global styles + Tailwind
│
├── store/
│   ├── authStore.js                 # Auth state (Zustand + localStorage)
│   └── dataStore.js                 # 🔑 LOCAL MOCK DATA STORE — replace with API calls
│
├── lib/
│   ├── utils.js                     # Helper functions (fmtMoney, bsStatus, etc.)
│   └── api.js                       # API stubs — connect to real backend here
│
├── components/
│   └── ui/index.jsx                 # Shared UI components library
│
└── pages/
    ├── LoginPage.jsx                # Login / Signup / Hospital registration
    │
    ├── patient/
    │   ├── PatientLayout.jsx        # Bottom nav layout
    │   ├── PatientHome.jsx          # Dashboard with quick actions
    │   ├── PatientAppointments.jsx  # View & cancel appointments
    │   ├── PatientBook.jsx          # Book appointment (spec → doc → slot)
    │   ├── PatientHealth.jsx        # Blood Sugar & Blood Pressure tracker
    │   ├── PatientRecords.jsx       # Medical records, insurance, claims, family
    │   ├── PatientGenZ.jsx          # ✨ Vibe Check, Skin AI, Avatar, Streaks
    │   ├── PatientWellness.jsx      # ✨ Reminders, Vaccines, SOS, QR Card
    │   ├── PatientAdmissions.jsx    # ✨ Indoor admission requests
    │   ├── PatientProfile.jsx       # Profile + Privacy/consent management
    │   └── PatientNotifications.jsx # Notifications
    │
    ├── doctor/  (Hospital Staff)
    │   ├── DoctorLayout.jsx         # Sidebar layout (mobile + desktop)
    │   ├── DoctorAppointments.jsx   # Manage appointments
    │   ├── DoctorOPD.jsx            # OPD queue management
    │   ├── DoctorPatients.jsx       # Patient records
    │   ├── DoctorDischarge.jsx      # Discharge summaries
    │   ├── DoctorBills.jsx          # Indoor billing
    │   ├── DoctorDoctors.jsx        # Doctor management
    │   ├── DoctorPromos.jsx         # Promotions
    │   └── DoctorServiceRequests.jsx # Service requests to admin
    │
    └── admin/
        ├── AdminLayout.jsx          # Sidebar layout (mobile + desktop)
        ├── AdminOverview.jsx        # Dashboard with stats
        ├── AdminHospitals.jsx       # Hospital management
        ├── AdminPatients.jsx        # Patient management
        ├── AdminAdmissions.jsx      # Admission requests
        ├── AdminPromos.jsx          # Platform-wide promotions
        ├── AdminServiceRequests.jsx # Service request management
        ├── AdminOnboarding.jsx      # Hospital signup approvals
        └── AdminTeam.jsx            # Admin team management
```

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Visit: http://localhost:5173

## 🔑 Demo Login Credentials

Use the "Quick Demo Login" buttons on the login page, or:

| Role     | Email                    | Password  |
|----------|--------------------------|-----------|
| Patient  | amit@email.com           | any       |
| Hospital | hosp@healfocus.in        | any       |
| Admin    | admin@healfocus.in       | any       |

## 🔗 Connecting to Backend

1. Update `src/lib/api.js` with real API endpoints
2. Replace local store calls in pages with React Query hooks
3. Update `src/store/dataStore.js` or remove it when API is live
4. Update `src/store/authStore.js` to use real JWT tokens

## ✨ Features Added (vs original HTML)

- **PatientGenZ** — Mood Vibe Check, Skin AI Scanner, Health Avatar/XP, Streaks
- **PatientWellness** — Smart Reminders, Vaccination Tracker, SOS Emergency, QR Card
- **PatientAdmissions** — Indoor treatment request submissions
- **Desktop Responsive** — Hospital & Admin portals have full sidebar layout on desktop
- **Local Data Store** — Zustand store replaces backend API (all CRUD operations work)
- **Privacy/Consent** — Patient can manage who accesses their records
- **Demo Login** — Quick login buttons for testing all 3 roles
