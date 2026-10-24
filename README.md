# MiniLedger – Personal Lending Tracker

Full-stack personal lending tracker web application built for seamless tracking and settlement of loans with friends and family.

## 📁 Monorepo Structure

```text
D:\codastu\
├── backend/       # Express.js, Prisma ORM, PostgreSQL, Zod, JWT, Jest (Pure JS)
└── frontend/      # React, Vite, Tailwind CSS, React Router, Recharts (Pure JSX)
```

---

## ⚡ Quick Start Guide (Windows PowerShell)

### Step 1: Start the Backend (Port 5000)
Open a PowerShell terminal:
```powershell
cd D:\codastu\backend
npm install
npm run prisma:generate
npm run dev
```

### Step 2: Start the Frontend (Port 3000)
Open a **second** PowerShell terminal:
```powershell
cd D:\codastu\frontend
npm install
npm run dev
```

Open your browser at: **`http://localhost:3000`**

---

## 📱 How to Log In (Mock OTP)
1. On the web page, enter your 10-digit mobile number and click **Send OTP**.
2. Open your **Backend terminal window** to find the 6-digit mock OTP code printed.
3. Enter the 6-digit code in the browser and click **Verify & Log In**.

---

## 🧪 Testing Backend
To run all 22 automated tests:
```powershell
cd D:\codastu\backend
npm test
```
All 22 unit and integration tests will run and pass!
