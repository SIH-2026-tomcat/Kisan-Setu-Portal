# Kisan Setu — Smart Procurement. Less Waiting. Better Farming.

**Smart India Hackathon (Problem Statement ID: 26032)**  
*A Full-Stack Agricultural Procurement & Real-Time Queue Management Platform*

---

## 1. Problem Statement & Context
Agricultural procurement centers and APMC market yards across India often experience heavy bottlenecks, unpredictability, and chaotic physical queues. Farmers travel long distances without knowing queue lengths, wait in harsh conditions for hours, face uncertain weighing schedules, and lack transparency regarding produce approval and bank payment status.

### Current Problem Workflow:
`Farmer travels to centre` ➔ `Waits in long unmanaged physical queue` ➔ `Manual paper check-in` ➔ `Uncertain quality grading` ➔ `Delayed / Untracked payment`

### Kisan Setu Solution Workflow:
`Farmer registers (Masked Aadhaar + Mobile)` ➔ `Books optimal time slot (Smart congestion recommendation)` ➔ `Receives Digital Token with QR` ➔ `Tracks Live Queue from home (auto-polls every 4s)` ➔ `Arrives near scheduled window` ➔ `Fast counter verification & digital weighing` ➔ `Direct bank deposit tracking (PFMS/DBT)`

---

## 2. Key Features

- **Multilingual Public-Service Interface**: Native support for **English**, **हिन्दी (Hindi)**, and **తెలుగు (Telugu)** with first-visit language modal and instant header switching.
- **Smart Slot Recommendation**: Algorithmic lowest-congestion slot discovery based on real booking load (`bookedCount / capacity`), estimating minimum waiting delay.
- **Digital Procurement Token & QR Code**: Instant token generation (`A-042`) with non-sensitive verifiable QR payload and print/download capabilities.
- **Real-Time Live Queue Polling**: Synchronization every 4 seconds displaying currently serving token, farmers ahead, wait time estimate, and dynamic travel advisories.
- **Procurement & Inspection Desk**: 7-stage visual tracker (`Registered` ➔ `Slot Booked` ➔ `Arrived` ➔ `Inspected` ➔ `Procured` ➔ `Payment Processing` ➔ `Payment Completed`).
- **Direct Payout Stage-Gate Tracking**: Payment state machine (`PENDING` ➔ `PROCESSING` ➔ `PAID`), generating unique transaction reference (`KS-PAY-2026-XXXXX`).
- **Officer Operations Portal**: Officer authentication (`bcrypt`), interactive queue advancement ("CALL NEXT FARMER"), quality grade assessment, and payout authorization.
- **Accessibility & Compliance**: Text resizing (`A-`, `A`, `A+`), High Contrast mode, screen-reader focus outlines, skip-to-content links.
- **Immutable Audit Logging**: Every administrative action (call next, inspect, approve, pay) is timestamped and recorded.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, TypeScript, Tailwind CSS, React Router v7, react-i18next, Lucide React, qrcode.react |
| **Backend API** | Node.js, Express, TypeScript, Helmet, CORS, express-rate-limit, jsonwebtoken, bcryptjs |
| **Database & ORM** | MySQL 8.0, Prisma ORM |
| **Security Architecture** | AES-256-GCM Aadhaar encryption + last-4 masking, bcrypt password hashing, Role-Based Access Control (RBAC), Prisma parameterized queries |

---

## 4. Security Architecture

- **Aadhaar Privacy**: Aadhaar is strictly validated for 12 numeric digits, encrypted at rest using **AES-256-GCM** (`AADHAAR_ENCRYPTION_KEY`), and masked everywhere as `XXXX XXXX 9012`. Full Aadhaar is never exposed in plain text, logs, or frontend storage.
- **Authentication**:
  - **Farmers**: Mobile + Server-side verified OTP (`123456` in demo mode).
  - **Officers**: Bcrypt password hashing (`10` salt rounds).
- **Role-Based Access Control (RBAC)**: Backend authorization middleware verifies JWT role (`FARMER` vs `OFFICER`). Farmers requesting `/api/officer/*` are strictly rejected with `403 Forbidden`. Unauthenticated requests receive `401 Unauthorized`.
- **Database Safety**: All slot bookings, quality approvals, and payment completions execute within **concurrency-safe Prisma database transactions** (`prisma.$transaction`) with capacity re-checking to prevent race conditions.
- **Rate Limiting**: `express-rate-limit` guards OTP requests, OTP verification, registration, and officer logins against brute-force attacks.
- **Safe Error Handling**: Server never leaks stack traces, raw SQL queries, or internal credentials to the client.

---

## 5. Database Schema

The relational database (`kisan_setu`) contains 10 core tables:

1. `Farmer`: id, fullName, mobileNumber (unique), aadhaarEncrypted, aadhaarLast4, preferredLanguage, village, district, state, centreId.
2. `Officer`: id, username (unique), passwordHash, fullName, centreId, role, active, lastLogin.
3. `ProcurementCentre`: id, name, district, state, address, openingTime, closingTime, active.
4. `Slot`: id, centreId, date, startTime, endTime, capacity, bookedCount. Composite unique: `(centreId, date, startTime)`.
5. `Booking`: id, farmerId, centreId, slotId, bookingReference (unique), tokenNumber, cropType, expectedQuantity, status.
6. `Queue`: id, centreId, date, currentlyServing. Composite unique: `(centreId, date)`.
7. `Procurement`: id, bookingId (unique), farmerId, cropType, expectedQuantity, acceptedQuantity, qualityGrade, ratePerQuintal, totalAmount, status.
8. `Payment`: id, procurementId (unique), farmerId, amount, status, transactionReference (unique), bankAccountLast4, paidAt.
9. `Notification`: id, farmerId, type, title, message, read, createdAt.
10. `AuditLog`: id, officerId, action, entityType, entityId, details, ipAddress, createdAt.

---

## 6. Simulated vs Real Components

| Feature | Implementation Mode | Technical Note |
|---|---|---|
| **Database & Persistence** | **REAL** | Real MySQL database connected via Prisma ORM |
| **Authentication & RBAC** | **REAL** | JWT verification, bcrypt hashing, role enforcement on backend |
| **Slot Booking & Capacity** | **REAL** | Concurrency-safe Prisma database transactions |
| **Queue Calculation** | **REAL** | Live dynamic queue math & distance advisories |
| **Procurement Calculation** | **REAL** | Backend calculation of `acceptedQuantity × rate` |
| **Payment State Machine** | **REAL** | Stage-gate transitions (`Pending` ➔ `Processing` ➔ `Paid`) with unique reference generation |
| **OTP Delivery** | **SIMULATED** | Server-side simulated OTP verification with fixed demo OTP `123456` |
| **SMS Notifications** | **SIMULATED** | Toast popups and backend `[SIMULATED SMS]` logging (ready for CDAC SMS Gateway in production) |
| **Bank Fund Transfer** | **SIMULATED** | State tracking & transaction ID simulation (ready for PFMS / NPCI DBT integration) |
| **Aadhaar Format Validation**| **REAL** | 12-digit numeric validation & AES-256-GCM encryption |
| **UIDAI Verification** | **SIMULATED** | In-app verification disclaimer (ready for UIDAI e-KYC API in production) |

---

## 7. Quick Start & Setup

### Prerequisites
- Node.js (v18+)
- MySQL Server (v8.0+)
- Git

### 1. MySQL Database Setup
Run the database creation script as MySQL admin/root:
```powershell
Get-Content MYSQL_SETUP.sql | mysql -u root -p
```
*(Creates database `kisan_setu` and application user `kisan_setu_user`)*

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Database Push & Seed
```bash
cd server
npx prisma db push
npm run seed
cd ..
```

### 4. Start Full-Stack Application
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 8. Demo Credentials

### 👨‍🌾 Demo Farmer
- **Mobile**: `9876543210`
- **OTP**: `123456`
- **Profile**: Ramesh Kumar (Token `A-042`, Paddy 25 Q, Guntur Agricultural Procurement Centre)

### 👮 Demo Officer
- **Username**: `guntur_officer`
- **Password**: `Kisan@123`
- **Assigned Centre**: Guntur Agricultural Procurement Centre
- **Portal URL**: [http://localhost:5173/officer/login](http://localhost:5173/officer/login)

---

## 9. 3-Minute SIH Presentation Flow

1. **First Impression (0:00 – 0:30)**:
   - Open homepage; show the **First-Screen Language Selection Modal** (English, हिन्दी, తెలుగు).
   - Show clean public-service interface, accessibility toolbar (text scaling, high-contrast mode), and service catalog.
2. **Farmer Booking & Smart Recommendation (0:30 – 1:15)**:
   - Login as Demo Farmer Ramesh Kumar (`9876543210` / `123456`).
   - Go to "Book Slot"; show dynamic **RECOMMENDED** low-congestion slot badge calculated by backend load.
   - Show instant **Digital Token with QR code** (`A-042`) and simulated SMS alert.
3. **Live Queue Synchronization (1:15 – 2:00)**:
   - Open "Live Queue" in one window showing Currently Serving: `A-036`, Farmers Ahead: `6`, Est. Wait: `24 mins`.
   - In a second window / tab, open Officer Portal (`guntur_officer` / `Kisan@123`).
   - Click **CALL NEXT FARMER**; show the farmer screen updating in real time via polling to `A-037` with updated arrival advisory.
4. **Procurement Inspection & Direct Payment (2:00 – 3:00)**:
   - On the officer portal, open Quality Inspection Desk: enter accepted quantity, assign Grade A, calculate total payout on server (`24.6 Q × ₹2300 = ₹56,580`), and approve.
   - Go to Payments desk: advance status from `Processing` to `Paid` (generates `KS-PAY-2026-XXXXX`).
   - Switch to Farmer view to show updated 7-stage progress stepper, transaction reference, and audit trail.
