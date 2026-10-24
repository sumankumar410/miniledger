# MiniLedger 2.0 – Personal Lending Tracker (Backend)

MiniLedger 2.0 Backend is a modular RESTful API built for managing mutual lending and borrowing between friends. Built with Node.js, Express.js, Prisma ORM, PostgreSQL, Decimal-safe arithmetic, and JWT authentication.

---

## 🛠️ Endpoints Directory

### 1. Authentication
- `POST /api/auth/send-otp`: Generates 6-digit OTP (terminal-logged in dev mode).
- `POST /api/auth/verify-otp`: Verifies OTP, registers user, returns JWT token.

### 2. Friends Management
- `GET /api/friends`: Lists friends with aggregated financial metrics (`totalLent`, `totalBorrowed`, `outstandingReceivable`, `outstandingPayable`, `netBalance`, `activeLoansCount`).
- `POST /api/friends`: Adds a new friend contact.
- `GET /api/friends/:id`: Returns friend details with loan history.
- `PATCH /api/friends/:id`: Updates friend profile.
- `DELETE /api/friends/:id`: Safe deletion (rejects if active unsettled loans exist).

### 3. Loans Management
- `GET /api/loans`: Filter by `type` (`LENT` | `BORROWED`), `status` (`OUTSTANDING` | `REPAID` | `OVERDUE`), `search`, and pagination.
- `POST /api/loans`: Creates loan with `friendName`, `type`, `amount`, `loanDate`, `dueDate`, `paymentSchedule`, `interestRate`, and `notes`.
- `GET /api/loans/:id`: Returns loan details with payment installment history.
- `PATCH /api/loans/:id`: Updates loan notes or due date.
- `PATCH /api/loans/:id/repay`: Quick full settlement.
- `GET /api/loans/summary`: Returns 8 metrics + monthly activity chart data:
  - `totalLent`
  - `totalBorrowed`
  - `totalRepaymentsReceived`
  - `totalRepaymentsMade`
  - `outstandingReceivables`
  - `outstandingPayables`
  - `overdueAmount`
  - `upcomingPayments`
  - `monthlyActivity` (last 6 months)

### 4. Payments & Installments
- `POST /api/payments`: Records payment against a loan (supports full, partial, and installments; updates remaining balance and marks settled when balance reaches 0).
- `GET /api/payments`: Lists payment ledger across loans.

### 5. Due Dates & Reminders
- `GET /api/reminders`: Categorized due date buckets (`overdue`, `dueToday`, `dueTomorrow`, `dueWithin7Days`, `upcomingThisMonth`, `noDueDate`).

---

## 🧪 Testing

```powershell
cd D:\codastu\backend
npm test
```
All **22 automated unit and integration tests** pass with 100%!
