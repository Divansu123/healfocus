# HealFocus Backend API

Express.js + MySQL + Prisma ORM backend for the HealFocus healthcare platform.

---

## Tech Stack

| Layer       | Tech                          |
|-------------|-------------------------------|
| Framework   | Express.js                    |
| Database    | MySQL                         |
| ORM         | Prisma                        |
| Auth        | JWT (access + refresh tokens) |
| Security    | Helmet, CORS, Rate Limiting   |
| Validation  | express-validator             |
| Logging     | Winston + Morgan              |

---

## Folder Structure

```
healfocus-backend/
├── prisma/
│   └── schema.prisma          # All DB models
├── src/
│   ├── config/
│   │   ├── prisma.js          # Prisma client singleton
│   │   └── logger.js          # Winston logger
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── patient.controller.js
│   │   ├── hospital.controller.js
│   │   ├── admin.controller.js
│   │   └── public.controller.js
│   ├── middleware/
│   │   ├── auth.js            # JWT verify + role guards
│   │   ├── validate.js        # express-validator runner
│   │   └── errorHandler.js    # 404 + global error handler
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── patient.routes.js
│   │   ├── hospital.routes.js
│   │   ├── admin.routes.js
│   │   └── public.routes.js
│   ├── utils/
│   │   ├── jwt.js             # Token generation & verification
│   │   └── response.js        # Standardized API responses
│   └── index.js               # App entry point
├── .env.example
├── .gitignore
└── package.json
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and fill in your values:
```
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/healfocus"
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<generate another>
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Create the database
```sql
CREATE DATABASE healfocus;
```

### 4. Run Prisma migration
```bash
npm run db:push       # quick push for dev
# OR
npm run db:migrate    # proper migration (recommended for prod)
```

### 5. Generate Prisma client
```bash
npm run db:generate
```

### 6. Start dev server
```bash
npm run dev
```
Server runs at `https://healfocus-api.onrender.com`

---

## API Reference

### Auth (Public)
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | /api/auth/register    | Patient registration |
| POST   | /api/auth/login       | Login (all roles)    |
| POST   | /api/auth/refresh     | Refresh access token |
| POST   | /api/auth/logout      | Logout               |
| GET    | /api/auth/me          | Get current user     |

### Public (No auth)
| Method | Endpoint                          | Description             |
|--------|-----------------------------------|-------------------------|
| GET    | /api/public/specialties           | All specialties         |
| GET    | /api/public/hospitals             | Active hospitals        |
| GET    | /api/public/doctors               | Doctors (filterable)    |
| GET    | /api/public/doctors/:id/slots     | Doctor slots + bookings |
| GET    | /api/public/promotions            | Active promotions       |
| POST   | /api/public/hospital-signup       | Hospital signup request |

### Patient (Role: patient)
| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| GET    | /api/patient/profile                  | Get profile              |
| PUT    | /api/patient/profile                  | Update profile           |
| GET    | /api/patient/appointments             | My appointments          |
| POST   | /api/patient/appointments             | Book appointment         |
| PATCH  | /api/patient/appointments/:id/cancel  | Cancel appointment       |
| GET    | /api/patient/records                  | Medical records          |
| POST   | /api/patient/records                  | Add record               |
| DELETE | /api/patient/records/:id              | Delete record            |
| GET    | /api/patient/health/blood-sugar       | BS readings              |
| POST   | /api/patient/health/blood-sugar       | Add BS reading           |
| DELETE | /api/patient/health/blood-sugar/:id   | Delete BS reading        |
| GET    | /api/patient/health/blood-pressure    | BP readings              |
| POST   | /api/patient/health/blood-pressure    | Add BP reading           |
| DELETE | /api/patient/health/blood-pressure/:id| Delete BP reading        |
| GET    | /api/patient/wellness/moods           | Mood log                 |
| POST   | /api/patient/wellness/moods           | Add mood                 |
| GET    | /api/patient/wellness/vaccinations    | Vaccinations             |
| POST   | /api/patient/wellness/vaccinations    | Add vaccination          |
| GET    | /api/patient/wellness/reminders       | Reminders                |
| POST   | /api/patient/wellness/reminders       | Add reminder             |
| PATCH  | /api/patient/wellness/reminders/:id/toggle | Toggle done        |
| DELETE | /api/patient/wellness/reminders/:id   | Delete reminder          |
| GET    | /api/patient/family                   | Family members           |
| POST   | /api/patient/family                   | Add family member        |
| DELETE | /api/patient/family/:id               | Remove family member     |
| GET    | /api/patient/insurance                | Insurance cards + claims |
| POST   | /api/patient/insurance                | Add insurance card       |
| GET    | /api/patient/admissions               | My admission requests    |
| POST   | /api/patient/admissions               | Request admission        |
| GET    | /api/patient/notifications            | Notifications            |
| PATCH  | /api/patient/notifications/:id/read   | Mark as read             |
| GET    | /api/patient/consent                  | Consent requests         |
| PATCH  | /api/patient/consent/:id              | Approve/reject consent   |

### Hospital (Role: hospital)
| Method | Endpoint                           | Description              |
|--------|------------------------------------|--------------------------|
| GET    | /api/hospital/appointments         | Hospital appointments    |
| PATCH  | /api/hospital/appointments/:id     | Update appointment       |
| GET    | /api/hospital/doctors              | Hospital doctors         |
| POST   | /api/hospital/doctors              | Add doctor               |
| PUT    | /api/hospital/doctors/:id          | Update doctor            |
| DELETE | /api/hospital/doctors/:id          | Remove doctor            |
| GET    | /api/hospital/opd                  | OPD patients             |
| POST   | /api/hospital/opd                  | Add OPD patient          |
| PUT    | /api/hospital/opd/:id              | Update OPD patient       |
| GET    | /api/hospital/patients             | Registered patients      |
| GET    | /api/hospital/promotions           | My promotions            |
| POST   | /api/hospital/promotions           | Create promotion         |
| PUT    | /api/hospital/promotions/:id       | Update promotion         |
| DELETE | /api/hospital/promotions/:id       | Delete promotion         |
| GET    | /api/hospital/service-requests     | My service requests      |
| POST   | /api/hospital/service-requests     | Submit service request   |
| GET    | /api/hospital/bills                | Indoor bills             |
| POST   | /api/hospital/bills                | Create bill              |
| PATCH  | /api/hospital/bills/:id/status     | Update bill status       |
| GET    | /api/hospital/discharge            | Discharge summaries      |
| POST   | /api/hospital/discharge            | Create discharge summary |
| PUT    | /api/hospital/discharge/:id        | Update discharge summary |
| GET    | /api/hospital/notifications        | Hospital notifications   |
| PATCH  | /api/hospital/notifications/:id/read | Mark as read           |

### Admin (Role: admin)
| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| GET    | /api/admin/overview                   | Dashboard stats          |
| GET    | /api/admin/hospitals                  | All hospitals            |
| PATCH  | /api/admin/hospitals/:id/status       | Update hospital status   |
| GET    | /api/admin/onboarding                 | Signup requests          |
| POST   | /api/admin/onboarding/:id/approve     | Approve hospital         |
| POST   | /api/admin/onboarding/:id/reject      | Reject hospital          |
| GET    | /api/admin/patients                   | All patients             |
| GET    | /api/admin/admissions                 | All admissions           |
| PATCH  | /api/admin/admissions/:id/status      | Update admission         |
| GET    | /api/admin/promotions                 | All promotions           |
| POST   | /api/admin/promotions                 | Create promotion         |
| PUT    | /api/admin/promotions/:id             | Update promotion         |
| DELETE | /api/admin/promotions/:id             | Delete promotion         |
| GET    | /api/admin/service-requests           | All service requests     |
| PATCH  | /api/admin/service-requests/:id       | Update service request   |
| GET    | /api/admin/team                       | Team members             |
| POST   | /api/admin/team                       | Add team member          |
| PUT    | /api/admin/team/:id                   | Update team member       |
| DELETE | /api/admin/team/:id                   | Remove team member       |
| GET    | /api/admin/notifications              | Admin notifications      |
| PATCH  | /api/admin/notifications/:id/read     | Mark as read             |

---

## Security Features

- **JWT Auth** — Short-lived access tokens (15 min) + httpOnly cookie refresh tokens (7 days)
- **Role-based guards** — `authenticate` + `authorize(...roles)` middleware on every protected route
- **Helmet** — Secure HTTP headers (XSS, clickjacking, MIME sniffing protection)
- **CORS** — Whitelist-only origins via `ALLOWED_ORIGINS` env var
- **Rate Limiting** — Global 100 req/15min, auth endpoints 10 req/15min
- **Input Validation** — express-validator on all write endpoints
- **Prisma** — Parameterized queries, no raw SQL injection risk
- **bcrypt** — Password hashing with cost factor 12
- **Body size limit** — 1MB max to prevent payload attacks
- **Error handler** — No stack traces leaked in production

---

## Frontend Integration

Replace the stub functions in `src/lib/api.js` with real `fetch` calls:

```js
const BASE = 'https://healfocus-api.onrender.com/api'

const getToken = () => localStorage.getItem('hf_token')

const apiFetch = (url, options = {}) =>
  fetch(`${BASE}${url}`, {
    ...options,
    credentials: 'include',            // send refresh token cookie
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
      ...options.headers,
    },
  }).then(r => r.json())

export const authApi = {
  login:  (data) => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(data) }),
  signup: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: ()     => apiFetch('/auth/logout',   { method: 'POST' }),
  refresh: ()    => apiFetch('/auth/refresh',  { method: 'POST' }),
  me: ()         => apiFetch('/auth/me'),
}

export const patientApi = {
  getAppointments: () => apiFetch('/patient/appointments'),
  bookAppointment: (data) => apiFetch('/patient/appointments', { method: 'POST', body: JSON.stringify(data) }),
  // ... etc
}
```
