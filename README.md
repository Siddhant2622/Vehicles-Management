# 🚛 TransitOps – Smart Transport Operations Platform

> A modern enterprise-grade fleet and transport management system that helps logistics companies manage vehicles, drivers, trips, maintenance, fuel, expenses, and operational analytics from a centralized dashboard.

---

## 📖 Overview

TransitOps is an intelligent transport operations platform designed to replace manual spreadsheets and logbooks with a secure, scalable, and data-driven solution.

The platform enables organizations to efficiently manage the complete lifecycle of fleet operations while ensuring compliance, reducing operational costs, and improving fleet utilization.

---

## ✨ Features

### 🔐 Authentication & Security

- Secure Email Authentication
- JWT Session Management
- Role-Based Access Control (RBAC)
- Protected Routes
- Password Reset
- User Profile Management

---

### 📊 Dashboard

Real-time operational insights including:

- Active Vehicles
- Available Vehicles
- Vehicles in Maintenance
- Retired Vehicles
- Active Trips
- Pending Trips
- Completed Trips
- Drivers On Duty
- Fleet Utilization
- Fuel Consumption
- Maintenance Costs
- Revenue
- Profit
- Vehicle ROI

Interactive charts include:

- Line Charts
- Pie Charts
- Bar Charts
- Area Charts
- Monthly Reports
- Fleet Analytics
- Expense Analytics

---

## 🚚 Vehicle Management

Manage the complete vehicle lifecycle.

### Features

- Add Vehicle
- Edit Vehicle
- Delete Vehicle
- Vehicle Details
- Vehicle Documents
- Maintenance History
- Fuel History
- Trip History

### Vehicle Information

- Registration Number
- Vehicle Name
- Model
- Vehicle Type
- Maximum Load Capacity
- Odometer
- Acquisition Cost
- Insurance
- Status

### Vehicle Status

- Available
- On Trip
- In Shop
- Retired

---

## 👨‍✈️ Driver Management

Complete driver management system.

### Features

- Driver Registration
- Driver Profile
- License Management
- Safety Score
- Driver Assignment

### Driver Information

- Name
- License Number
- License Category
- License Expiry
- Contact Number
- Email
- Safety Score
- Assigned Vehicle
- Status

### Driver Status

- Available
- On Trip
- Off Duty
- Suspended

---

## 🛣 Trip Management

Plan and monitor transport operations.

### Features

- Create Trip
- Dispatch Trip
- Cancel Trip
- Complete Trip
- Route Tracking
- Live Status

### Trip Information

- Source
- Destination
- Driver
- Vehicle
- Cargo Weight
- Planned Distance
- Estimated Duration

### Trip Status

- Draft
- Dispatched
- Completed
- Cancelled

---

## 🔧 Maintenance Management

Manage vehicle servicing and maintenance.

### Features

- Schedule Maintenance
- Service Records
- Workshop Details
- Cost Tracking
- Maintenance History

### Status

- Scheduled
- In Progress
- Completed

---

## ⛽ Fuel Management

Track fuel usage and vehicle efficiency.

### Features

- Fuel Logs
- Mileage Tracking
- Fuel Cost
- Fuel Station Records
- Fuel Efficiency Reports

Automatic calculations:

- Average Mileage
- Cost per Kilometer
- Fuel Efficiency

---

## 💰 Expense Management

Track operational expenses.

Supported Expense Types

- Fuel
- Maintenance
- Insurance
- Repairs
- Parking
- Toll
- Taxes

Generate:

- Monthly Reports
- Annual Reports
- Department Reports

---

## 📈 Reports & Analytics

Generate professional reports.

Reports

- Vehicle Report
- Driver Report
- Trip Report
- Maintenance Report
- Fuel Report
- Expense Report
- Profit Report

Export formats

- PDF
- CSV
- Excel

---

## 🔔 Notification System

Receive alerts for:

- License Expiry
- Insurance Expiry
- Maintenance Due
- Trip Delays
- Vehicle Breakdown
- Fuel Alerts

Supports:

- Email Notifications
- Push Notifications

---

## 🔍 Search & Filters

Powerful global search with filters.

Search by

- Vehicle
- Driver
- Trip
- Region
- Status
- Date

Includes

- Pagination
- Sorting
- Advanced Filters

---

# 👥 User Roles

## Administrator

- Full System Access
- Manage Users
- Configure Roles
- View Reports

## Fleet Manager

- Manage Fleet
- Vehicles
- Trips
- Maintenance

## Dispatcher

- Assign Drivers
- Assign Vehicles
- Monitor Trips

## Safety Officer

- Monitor Driver Compliance
- License Expiry
- Safety Scores

## Financial Analyst

- Expense Reports
- Revenue
- Profitability
- Operational Costs

---

# 📌 Business Rules

The application enforces the following rules:

- Vehicle Registration Number must be unique.
- Retired vehicles cannot be dispatched.
- Vehicles under maintenance cannot be assigned.
- Drivers with expired licenses cannot be assigned.
- Suspended drivers cannot be assigned.
- A vehicle already on a trip cannot be assigned again.
- A driver already on a trip cannot be assigned again.
- Cargo weight must not exceed vehicle capacity.
- Dispatch automatically changes vehicle and driver status to **On Trip**.
- Completing a trip automatically restores both to **Available**.
- Cancelling a trip restores resources to **Available**.
- Maintenance automatically changes vehicle status to **In Shop**.
- Closing maintenance restores vehicle availability unless retired.
- Fuel efficiency, operational costs, fleet utilization, and ROI are automatically calculated.

---

# 🗄 Database Schema

Core Tables

- Users
- Roles
- Vehicles
- Drivers
- Trips
- MaintenanceLogs
- FuelLogs
- Expenses
- Documents
- Notifications
- AuditLogs

---

# 🛠 Technology Stack

### Frontend

- React
- Next.js
- TypeScript
- Tailwind CSS
- Shadcn UI
- Framer Motion

### Backend

- Next.js API Routes
- Supabase
- PostgreSQL

### Authentication

- JWT
- RBAC
- Row Level Security

### Charts

- Recharts

### Maps

- Google Maps
- Leaflet

### State Management

- Zustand
- React Query

---

# 📱 Responsive Design

Supports

- Desktop
- Laptop
- Tablet
- Mobile

---

# 🌙 Additional Features

- Dark Mode
- Glassmorphism UI
- Smooth Animations
- Toast Notifications
- Skeleton Loading
- Activity Logs
- Vehicle Document Management
- AI Route Optimization (Future)
- Predictive Maintenance (Future)
- GPS Tracking (Future)
- PWA Support

---

# 📂 Project Structure

```
TransitOps/
│
├── app/
├── components/
├── hooks/
├── lib/
├── services/
├── store/
├── types/
├── utils/
├── public/
├── database/
├── middleware/
├── styles/
├── docs/
├── README.md
└── package.json
```

---

# 🚀 Getting Started

## Install Dependencies

```bash
npm install
```

## Configure Environment

Create a `.env.local` file.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
```

## Start Development Server

```bash
npm run dev
```

---

# 📊 Future Enhancements

- AI Route Optimization
- Predictive Maintenance
- Live GPS Tracking
- Driver Behavior Analysis
- Geofencing
- QR Code Vehicle Check-In
- Mobile App
- Offline Mode
- Multi-language Support
- SMS Notifications

---

# 📄 License

This project is developed for educational purposes and hackathon participation. You may modify and extend it for personal or commercial use in accordance with your chosen license.

---

# 👨‍💻 Developed By

**TransitOps Team**

Enterprise Smart Transport Operations Platform
