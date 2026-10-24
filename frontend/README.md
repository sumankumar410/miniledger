# MINI LEDGER 2.0 — PREMIUM FRIENDS LOAN TRACKER (Frontend)

MiniLedger 2.0 is an advanced, modern, fully responsive web application built for managing mutual personal lending and borrowing between friends and colleagues.

---

## 🌟 What's New in MiniLedger 2.0

1. **Two-Way Personal Transactions**:
   - **Money Lent (Receivables)**: Money you gave to friends that they owe back.
   - **Money Borrowed (Payables)**: Money you borrowed from friends that you need to return.
2. **Friends Directory (`/friends`)**:
   - Manage contacts with Phone, Email, and Notes.
   - Live aggregated balances per friend: Net Balance (who owes whom), total lent, total borrowed, and active loan count.
   - Safe deletion prevention if unsettled loans exist.
3. **Advanced Payment & Installment Management (`/payments`)**:
   - Support for **Full payments, Partial payments, and Multiple installments**.
   - Dynamic real-time calculation breakdown:
     - Original Principal (e.g. ₹10,000)
     - Previously Paid (₹3,000)
     - Outstanding (₹7,000)
     - Current Payment (₹2,000)
     - Remaining After Payment (₹5,000)
   - Method selection: UPI, Cash in Hand, Bank Transfer, Other.
   - Validation prevents payments exceeding remaining balance.
4. **Due Dates & In-App Reminders (`/reminders`)**:
   - Categorized tabs: **Overdue**, **Due Today**, **Due Tomorrow**, **Within 7 Days**, **This Month**, **No Due Date**.
   - One-click **Copy WhatsApp Reminder** to send friendly polite nudges.
   - Direct inline "Record Payment" actions.
5. **Reports & Exports (`/reports`)**:
   - Summary balance breakdown (Net Receivables vs Net Payables vs Overdue).
   - Filter by transaction direction.
   - **One-click Export to CSV** spreadsheet.
   - **Printable Ledger Statement** formatting.
6. **Dashboard 2.0 (`/dashboard`)**:
   - **8 Real-time Summary Cards**:
     1. Total Money Lent
     2. Total Money Borrowed
     3. Total Repayments Received
     4. Total Repayments Made
     5. Outstanding Receivables
     6. Outstanding Payables
     7. Overdue Amount
     8. Upcoming Payments (30-day window)
   - Recharts visual bar chart of monthly lending vs borrowing vs repayments.
   - Quick action buttons: **Add Loan** and **Record Payment**.

---

## 🛠️ Technology Stack

- **Framework**: React 18
- **Tooling & Bundler**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router (v6)
- **API Client**: Axios (with Bearer token interceptor and 401 redirect)
- **Forms & Validation**: React Hook Form with Zod schemas
- **Icons**: Lucide React
- **Data Visualizations**: Recharts
- **Date Utilities**: Native `Intl` + custom date helper library

---

## 🚀 Running on Windows (PowerShell)

### Step 1: Ensure Backend is Running
Open Terminal 1:
```powershell
cd D:\codastu\backend
npm run dev
```
> Runs at `http://localhost:5000`

### Step 2: Run Frontend
Open Terminal 2:
```powershell
cd D:\codastu\frontend
npm run dev
```
> Open browser at: **`http://localhost:3000`**

### Step 3: Production Build
```powershell
cd D:\codastu\frontend
npm run build
```
Builds cleanly with zero errors to `dist/`.

---

## 📁 File Structure

```text
src/
├── components/
│   ├── dashboard/       # SummaryCard, Charts
│   ├── forms/           # AddLoanModal, RecordPaymentModal, AddFriendModal
│   ├── layout/          # Persistent Sidebar, Navbar, Responsive Layout
│   ├── loans/           # FilterBar, LoanCard, LoanTable
│   └── ui/              # Badges, Buttons, Accessible Modals
├── context/             # AuthContext, ToastContext
├── pages/               # Dashboard, Friends, Loans, LoanDetails, Payments, Reminders, Reports, Settings, Login, NotFound
├── services/            # api.js, auth.service.js, friends.service.js, loan.service.js, payments.service.js, reminders.service.js
└── utils/               # date.js, formatters.js
```
