# 🚛 TransitOps – Smart Transport Operations Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

> A modern enterprise-grade fleet and transport management system designed to streamline logistics operations. Manage vehicles, drivers, trips, maintenance logs, fuel logs, and expenses, and view interactive operational analytics from a centralized dashboard.

---

## 📖 Overview

TransitOps is an intelligent transport operations platform designed to replace manual spreadsheets and siloed systems with a secure, highly scalable, and data-driven solution.

The platform enables organizations to efficiently manage the complete lifecycle of fleet operations, ensuring safety compliance, reducing operational costs, and optimizing resource utilization through live analytics and tracking.

---

## ⚡ Key Highlights

### 🔄 Dual-Mode Database Architecture (Offline-First Fallback)
TransitOps features a custom, transparent data-routing layer. 
* **Online Mode:** When connected to **Supabase**, the application performs live queries on PostgreSQL with Row-Level Security (RLS) policies.
* **Offline-First Demo Mode:** If Supabase credentials are not supplied in `.env.local`, the application seamlessly falls back to a mock local database powered by `localStorage`. It comes pre-seeded with rich, realistic enterprise mock data (vehicles, drivers, logs, trips), allowing you to run, explore, and demo the entire application instantly without database setup.

### 🔐 Multi-Provider Authentication & RBAC
Supports secure Email Authentication and Google Sign-in integrated through **Firebase Authentication**. Access is restricted dynamically across different parts of the application using a robust **Role-Based Access Control (RBAC)** system.

### 🗺️ Fleet Tracking & Analytics
Features interactive maps powered by **Google Maps API** for asset tracking and spatial management, and visualizations powered by **Recharts** representing key metrics like vehicle ROI, maintenance costs, and fuel efficiency.

---

## ✨ Features

### 📊 Dashboard & Operational KPIs
Real-time operational insights showing:
* **Fleet Health:** Active, Available, In-Shop (Maintenance), and Retired vehicles.
* **Trip Funnel:** Pending (Draft), Dispatched (On Trip), Completed, and Cancelled.
* **Utilization & Financials:** Drivers on duty, fleet utilization percentages, total fuel costs, maintenance expenditure, revenue, profit, and overall vehicle ROI.
* **Rich Analytics:** Monthly charts tracking profit margins, operational expense category breakdowns (tolls, taxes, parking, etc.), and fuel efficiency trends.

### 🚚 Vehicle Management
Complete lifecycle control over the transport assets:
* Add, edit, retire, and search vehicles.
* Detailed metadata: registration number, model, type, acquisition cost, maximum capacity, odometer tracking, and insurance validity status.
* Embedded sub-modules showing a vehicle's specific maintenance logs, fuel logs, and historical trips.

### 👨‍✈️ Driver Management
Comprehensive driver tracking and safety auditing:
* Manage driver profiles, contact details, and license verification.
* Track driver status: *Available*, *On Trip*, *Off Duty*, or *Suspended*.
* Dynamic **Safety Score** to encourage driver compliance.
* Seamless vehicle assignment.

### 🛣️ Trip Management
Plan and monitor logistics dispatch operations:
* Create trips with custom source, destination, cargo weight, planned distance, and estimated duration.
* Validated dispatcher workflow: ensures vehicles and drivers are available (not already on trip, not suspended/under maintenance).
* Dispatches automatically update resource statuses, and completing/cancelling trips returns assets back to the available pool.

### 🔧 Maintenance & Service Logs
Keep your fleet healthy and operational:
* Schedule maintenance tasks and record details of repairs, workshops, and actual vs. estimated costs.
* Tracks vehicle status dynamically—scheduling maintenance automatically marks a vehicle as **In Shop**.

### ⛽ Fuel Tracking
Monitor efficiency and prevent fuel waste:
* Track every refuel event with odometer reading, fuel quantity, station info, and cost.
* Auto-calculation of average mileage (km/l) and cost per kilometer.

### 💰 Expense Tracking
Manage corporate overheads with custom category filters:
* Tracks costs across categories like Fuel, Maintenance, Insurance, Repairs, Tolls, Taxes, and Parking.

---

## 👥 User Roles (RBAC)

* **Administrator:** Full system access, manage employees, configure roles, and view comprehensive audit logs.
* **Fleet Manager:** Add/edit vehicles, plan and schedule maintenance logs, and manage general fleet operations.
* **Dispatcher:** Create trips, assign available drivers and vehicles, and manage dispatch/completion states.
* **Safety Officer:** Inspect compliance records, monitor license validity, and maintain driver safety scores.
* **Financial Analyst:** View financial dashboards, export reports, and analyze expense categories to maximize ROI.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, Next.js 16 (App Router), TypeScript, Framer Motion (for smooth micro-animations), Lucide Icons
* **Styling:** Tailwind CSS v4, Shadcn UI
* **State Management:** Zustand
* **Database & Auth:** Supabase (PostgreSQL), Firebase Authentication (Email/Google Providers)
* **Visualizations & Maps:** Recharts, Google Maps API (`@react-google-maps/api`)

---

## 📂 Project Structure

```
TransitOps/
│
├── src/
│   ├── app/                      # Next.js App Router Pages
│   │   ├── (dashboard)/          # Dashboard Shell & Sub-views (trips, drivers, vehicles, etc.)
│   │   ├── api/                  # API endpoints
│   │   ├── login/                # Authentication Sign-In
│   │   ├── signup/               # Registration Page
│   │   ├── globals.css           # Tailwind v4 Global Imports
│   │   └── layout.tsx            # App-wide context wrappers
│   │
│   ├── components/               # Shared & Layout UI Components
│   │   ├── auth/                 # Protected route checks and authentication prompts
│   │   ├── layout/               # Header, Sidebar, and App Shell
│   │   └── reports/              # Exportable reports modal
│   │
│   └── lib/                      # Business Logic & Infrastructure
│       ├── db/                   # Supabase connection & Dual-Mode helper (index.ts)
│       ├── firebase/             # Firebase Authentication client (index.ts)
│       └── store/                # Zustand State Store (transitStore.ts)
│
├── supabase/                     # PostgreSQL Schemas & Migration Files
│   ├── schema.sql                # Core table schemas (users, vehicles, drivers, trips, logs)
│   ├── multitenancy_schema.sql   # Organization tenancy structures
│   ├── approval_schema.sql       # User registration approval workflow rules
│   ├── telemetry_schema.sql      # Fleet telemetry and GPS status tables
│   ├── fix_rls.sql               # Row-Level Security policy corrections
│   └── final_setup.sql           # Aggregated build and seed scripts
│
├── public/                       # Static Assets & Icons
├── .env.example                  # Environment Configuration template
└── package.json                  # Dependencies & Development Scripts
```

---

## 🚀 Getting Started

### 1. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/Dhruvgupta1015/Transient-ops-.git
cd Transient-ops-
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and specify the following keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Firebase Authentication Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id

# Google Maps (Required for live location maps)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

*Note: If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are left blank or omitted, the project will automatically fall back to **localStorage Demo Mode** containing pre-seeded enterprise fleet datasets.*

### 3. Setup Database (Optional - For Supabase Mode)
To configure your Supabase Postgres database:
1. Log in to the [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** on your project.
3. Copy and run the SQL migration scripts located in the `supabase/` directory in the following order:
   1. [schema.sql](file:///c:/Users/bipin/Downloads/TransitOps/supabase/schema.sql) (Initial structures)
   2. [multitenancy_schema.sql](file:///c:/Users/bipin/Downloads/TransitOps/supabase/multitenancy_schema.sql) (Organizations schema)
   3. [approval_schema.sql](file:///c:/Users/bipin/Downloads/TransitOps/supabase/approval_schema.sql) (Approval constraints)
   4. [telemetry_schema.sql](file:///c:/Users/bipin/Downloads/TransitOps/supabase/telemetry_schema.sql) (Location data)
   5. [fix_rls.sql](file:///c:/Users/bipin/Downloads/TransitOps/supabase/fix_rls.sql) (Security policies)
   6. Alternatively, execute [final_setup.sql](file:///c:/Users/bipin/Downloads/TransitOps/supabase/final_setup.sql) which aggregates the core schemas.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📈 Roadmap & Future Scope
* **AI Route Optimization:** Implementing AI-based route suggestion algorithms to minimize fuel expenditure.
* **Predictive Maintenance:** Analyzing maintenance history and odometer metrics to trigger proactive workshop schedules.
* **Geofencing & Alerts:** Automate trip notifications when vehicles deviate from predefined routes.
* **Offline Synchronization:** Sync locally-saved changes back to Supabase automatically when internet connection is restored.
* **Mobile Companion App:** Tailored React Native app for drivers to upload checklists and update trip progress in real-time.

---

## 📄 License

Developed for enterprise fleet operations demoing and hackathon participation. Feel free to extend and modify the codebase.
