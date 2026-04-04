# HealFocus

HealFocus is a full-stack healthcare management platform designed to connect **patients**, **hospitals**, and **admins** in one system.

It helps manage:

- Patient registration and login
- Hospital registration and approval flow
- Appointment booking
- Admission requests
- Admin approval system
- Team and hospital management

---

## 🚀 Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Axios
- React Router DOM

### Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL
- JWT Authentication
- Cookie Parser
- CORS
- Helmet
- Compression
- Morgan

---

## 📁 Project Structure

```bash
HealFocus/
│
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── server/                 # Backend (Node + Express + Prisma)
│   ├── prisma/
│   ├── src/
│   ├── .env
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

## ✨ Features

### 👤 Patient
- Sign up / Login
- Browse hospitals and specialties
- Book appointments
- Request hospital admission
- View appointment/admission status

### 🏥 Hospital
- Hospital signup request
- Manage doctors / team members
- View patient requests
- Handle appointments and admissions

### 🛠 Admin
- Approve or reject hospital signup requests
- Manage hospitals
- Manage specialties
- Manage team members
- View platform data

---

## ⚙️ Installation & Setup

## 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/Healfocus.git
cd Healfocus
```

---

## 2️⃣ Setup Frontend

```bash
cd client
npm install
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

---

## 3️⃣ Setup Backend

Open another terminal:

```bash
cd server
npm install
npm run dev
```

Backend will run on:

```bash
https://healfocus-api.onrender.com
```

> Replace the port if your backend uses a different one.

---

## 4️⃣ Setup Environment Variables

Create a `.env` file inside the `server/` folder.

### `server/.env`

```env
PORT=5000
DATABASE_URL="mysql://root:password@localhost:3306/healfocus"
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

> Update the values according to your local system.

---

## 5️⃣ Prisma Setup

Inside the `server/` folder run:

```bash
npx prisma generate
npx prisma db push
```

If you want Prisma Studio:

```bash
npx prisma studio
```

---

## 🔐 Authentication

The project supports role-based access for:

- **Patient**
- **Hospital**
- **Admin**

Authentication is handled using:

- JWT
- Cookies / Token-based auth (depending on implementation)

---

## 📌 Main Modules

- Authentication Module
- Hospital Signup Approval Module
- Patient Management
- Appointment Management
- Admission Management
- Admin Panel APIs
- Specialty Management
- Team Member Management

---

## 🧪 API Testing

You can test the backend APIs using:

- Postman
- Thunder Client
- Insomnia

Example base URL:

```bash
https://healfocus-api.onrender.com/api
```

---

## 📦 Useful Commands

### Frontend
```bash
cd client
npm run dev
npm run build
```

### Backend
```bash
cd server
npm run dev
npm start
```

### Prisma
```bash
cd server
npx prisma generate
npx prisma db push
npx prisma studio
```

---

## 🛡 .gitignore Important

Make sure these files/folders are ignored:

- `node_modules`
- `.env`
- `dist`
- `build`

---

## 👨‍💻 Author

Developed by **Divanshu Attri**

---

## 📄 License

This project is for learning / development purposes.

You can customize the license section later if needed.