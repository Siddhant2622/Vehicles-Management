import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/db';
import { 
  auth, 
  googleProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  isFirebaseConfigured
} from '@/lib/firebase';

// --- TYPE DEFINITIONS ---

export type UserRole = 'Administrator' | 'Fleet Manager' | 'Dispatcher' | 'Safety Officer' | 'Financial Analyst' | 'Driver' | 'Maintenance Manager' | 'Viewer' | 'Security';
export type UserStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Suspended' | 'Inactive' | 'Information Required';
export type CompanyStatus = 'pending_approval' | 'active' | 'suspended';

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  industry?: string;
  companySize?: string;
  createdAt?: string;
  activatedAt?: string;
  createdByAdminUserId?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  approvalStatus: UserStatus;
  companyId?: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  phoneNumber?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  approvalNotes?: string;
  lastStatusChange?: string;
  registrationIp?: string;
  deviceInformation?: string;
  browserInformation?: string;
  requestedFieldsToEdit?: string[];
}

export interface UserApprovalHistory {
  id: string;
  userId: string;
  administratorId?: string;
  action: 'Approve' | 'Reject' | 'Suspend' | 'Reactivate' | 'Request Info';
  previousStatus: string;
  newStatus: string;
  reason?: string;
  timestamp: string;
  ipAddress?: string;
  companyId?: string;
}

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';

export interface TelemetryPoint {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  fuelLevel?: number;
  batteryLevel?: number;
  ignition?: boolean;
  accuracy?: number;
  timestamp: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  maxLoad: number; // in kg
  currentOdometer: number; // in km
  purchaseDate: string;
  acquisitionCost: number;
  insuranceExpiry: string;
  pollutionCert: string;
  imageUrl: string;
  status: VehicleStatus;
  companyId?: string;
  // Advanced Enterprise Fields
  gpsLocation?: { lat: number; lng: number };
  truckTelemetry?: TelemetryPoint;
  mobileTelemetry?: TelemetryPoint;
  activeTelemetrySource?: 'telematics' | 'mobile_app' | 'offline';
  healthScore?: number; // 0 - 100
  lifecycleStatus?: 'Active' | 'Approaching Retirement' | 'Retired';
}

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export interface Driver {
  id: string;
  name: string;
  photo: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  email: string;
  safetyScore: number; // 0 - 100
  assignedVehicleId: string | null;
  status: DriverStatus;
  // Advanced Enterprise Fields
  experienceYears?: number;
  medicalCertExpiry?: string;
  emergencyContact?: string;
  driverRating?: number; // 0 - 5
  fatigueLevel?: number; // 0 - 100
  workingHoursWeekly?: number;
}

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string | null;
  driverId: string | null;
  cargoWeight: number; // in kg
  plannedDistance: number; // in km
  estimatedDuration: number; // in hours
  status: TripStatus;
  progress: number; // 0 - 100
  startTime?: string;
  endTime?: string;
  revenue?: number; // Calculated automatically
}

export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  description: string;
  mechanic: string;
  workshop: string;
  estimatedCost: number;
  actualCost: number | null;
  startDate: string;
  endDate: string | null;
  status: MaintenanceStatus;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  driverId: string | null;
  fuelQuantity: number; // in liters
  fuelCost: number; // in USD
  fuelStation: string;
  date: string;
  odometer: number; // in km
}

export type ExpenseCategory = 'Fuel' | 'Maintenance' | 'Insurance' | 'Toll' | 'Parking' | 'Repairs' | 'Taxes' | 'Other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  vehicleId: string | null;
  department: string;
}

export interface Document {
  id: string;
  entityType: 'Vehicle' | 'Driver' | 'General';
  entityId: string;
  name: string;
  fileUrl: string;
  expiryDate: string | null;
  type: string; // e.g., "Insurance", "Registration", "CDL License"
}

export interface Notification {
  id: string;
  type: 'License Expiry' | 'Insurance Expiry' | 'Maintenance' | 'Fuel Refill' | 'Trip Delay' | 'Vehicle Breakdown' | 'Registration' | 'Clearance';
  message: string;
  read: boolean;
  date: string;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  entity: string;
  timestamp: string;
}

// --- INITIAL SEED DATA ---

const seedUsers: User[] = [
  { id: 'usr-1', email: 'admin@transitops.com', fullName: 'Sarah Jenkins', role: 'Administrator', approvalStatus: 'Approved' },
  { id: 'usr-2', email: 'manager@transitops.com', fullName: 'Dave Kovic', role: 'Fleet Manager', approvalStatus: 'Approved' },
  { id: 'usr-3', email: 'dispatcher@transitops.com', fullName: 'Jimmy McNulty', role: 'Dispatcher', approvalStatus: 'Approved' },
  { id: 'usr-4', email: 'safety@transitops.com', fullName: 'Kima Greggs', role: 'Safety Officer', approvalStatus: 'Approved' },
  { id: 'usr-5', email: 'finance@transitops.com', fullName: 'Lester Freamon', role: 'Financial Analyst', approvalStatus: 'Approved' },
];

const seedVehicles: Vehicle[] = [
  {
    id: 'veh-1',
    registrationNumber: 'TX-882-AB',
    name: 'Volvo FH16 Globetrotter',
    model: 'Volvo FH16 (2023)',
    type: 'Heavy Duty Truck',
    maxLoad: 25000,
    currentOdometer: 124500,
    purchaseDate: '2023-04-12',
    acquisitionCost: 145000,
    insuranceExpiry: '2026-11-20',
    pollutionCert: '2026-09-15',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400',
    status: 'Available',
    gpsLocation: { lat: 40.7128, lng: -74.0060 }, // NYC
  },
  {
    id: 'veh-2',
    registrationNumber: 'CA-993-XY',
    name: 'Scania R500 V8',
    model: 'Scania R500 (2022)',
    type: 'Heavy Duty Truck',
    maxLoad: 26000,
    currentOdometer: 88200,
    purchaseDate: '2022-08-10',
    acquisitionCost: 152000,
    insuranceExpiry: '2026-12-10',
    pollutionCert: '2026-10-01',
    imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400',
    status: 'On Trip',
    gpsLocation: { lat: 34.0522, lng: -118.2437 }, // LA
  },
  {
    id: 'veh-3',
    registrationNumber: 'NY-441-ZZ',
    name: 'Mercedes-Benz Actros',
    model: 'Actros 2646 (2021)',
    type: 'Heavy Duty Truck',
    maxLoad: 24000,
    currentOdometer: 198000,
    purchaseDate: '2021-06-15',
    acquisitionCost: 138000,
    insuranceExpiry: '2026-06-15', // Expired
    pollutionCert: '2026-05-10', // Expired
    imageUrl: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a44?auto=format&fit=crop&q=80&w=400',
    status: 'In Shop',
    gpsLocation: { lat: 41.8781, lng: -87.6298 }, // Chicago
  },
  {
    id: 'veh-4',
    registrationNumber: 'IL-552-CD',
    name: 'Isuzu NPR Diesel',
    model: 'NPR HD (2024)',
    type: 'Medium Duty Truck',
    maxLoad: 7500,
    currentOdometer: 45000,
    purchaseDate: '2024-02-14',
    acquisitionCost: 65000,
    insuranceExpiry: '2027-02-14',
    pollutionCert: '2026-12-30',
    imageUrl: 'https://images.unsplash.com/photo-1516576880881-148f90b8e737?auto=format&fit=crop&q=80&w=400',
    status: 'Available',
    gpsLocation: { lat: 29.7604, lng: -95.3698 }, // Houston
  },
  {
    id: 'veh-5',
    registrationNumber: 'FL-334-EF',
    name: 'Ford Transit Cargo Van',
    model: 'Transit 350 (2023)',
    type: 'Cargo Van',
    maxLoad: 3500,
    currentOdometer: 32000,
    purchaseDate: '2023-12-01',
    acquisitionCost: 42000,
    insuranceExpiry: '2026-12-01',
    pollutionCert: '2026-11-15',
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400',
    status: 'Available',
    gpsLocation: { lat: 39.9526, lng: -75.1652 }, // Philly
  },
  {
    id: 'veh-6',
    registrationNumber: 'WA-771-GH',
    name: 'Kenworth T680',
    model: 'Kenworth T680 (2018)',
    type: 'Heavy Duty Truck',
    maxLoad: 28000,
    currentOdometer: 310000,
    purchaseDate: '2018-05-20',
    acquisitionCost: 165000,
    insuranceExpiry: '2026-01-20', // Expired
    pollutionCert: '2025-12-15', // Expired
    imageUrl: 'https://images.unsplash.com/photo-1501700490588-4337a4e65488?auto=format&fit=crop&q=80&w=400',
    status: 'Retired',
    gpsLocation: { lat: 33.4484, lng: -112.0740 }, // Phoenix
  },
];

const seedDrivers: Driver[] = [
  {
    id: 'drv-1',
    name: 'Alex Johnson',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    licenseNumber: 'CDL-99281-A',
    licenseCategory: 'Class A CDL',
    licenseExpiryDate: '2027-05-15',
    contactNumber: '+1 555-0192',
    email: 'alex.j@transitops.com',
    safetyScore: 95,
    assignedVehicleId: 'veh-1',
    status: 'Available',
  },
  {
    id: 'drv-2',
    name: 'Marcus Vance',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    licenseNumber: 'CDL-88372-A',
    licenseCategory: 'Class A CDL',
    licenseExpiryDate: '2026-12-10',
    contactNumber: '+1 555-0283',
    email: 'marcus.v@transitops.com',
    safetyScore: 88,
    assignedVehicleId: 'veh-2',
    status: 'On Trip',
  },
  {
    id: 'drv-3',
    name: 'Sarah Connor',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    licenseNumber: 'CDL-77382-B',
    licenseCategory: 'Class B CDL',
    licenseExpiryDate: '2026-05-01', // Expired CDL!
    contactNumber: '+1 555-0982',
    email: 'sarah.c@transitops.com',
    safetyScore: 92,
    assignedVehicleId: null,
    status: 'Off Duty',
  },
  {
    id: 'drv-4',
    name: 'David Miller',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    licenseNumber: 'CDL-66291-A',
    licenseCategory: 'Class A CDL',
    licenseExpiryDate: '2026-09-30',
    contactNumber: '+1 555-0371',
    email: 'david.m@transitops.com',
    safetyScore: 55, // Low safety score
    assignedVehicleId: null,
    status: 'Suspended', // Suspended
  },
  {
    id: 'drv-5',
    name: 'Elena Rostova',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    licenseNumber: 'CDL-55482-A',
    licenseCategory: 'Class A CDL',
    licenseExpiryDate: '2027-08-22',
    contactNumber: '+1 555-0419',
    email: 'elena.r@transitops.com',
    safetyScore: 98,
    assignedVehicleId: 'veh-5',
    status: 'Available',
  },
];

const seedTrips: Trip[] = [
  {
    id: 'trip-101',
    source: 'Chicago Dispatch Center, IL',
    destination: 'Detroit Logistics Hub, MI',
    vehicleId: 'veh-2',
    driverId: 'drv-2',
    cargoWeight: 18000,
    plannedDistance: 450,
    estimatedDuration: 5.5,
    status: 'Dispatched',
    progress: 65,
    startTime: '2026-07-12T05:30:00Z',
    revenue: 1620, // (18 * 450 * 0.2)
  },
  {
    id: 'trip-102',
    source: 'Houston Freight yard, TX',
    destination: 'Dallas North Terminal, TX',
    vehicleId: 'veh-1',
    driverId: 'drv-1',
    cargoWeight: 12000,
    plannedDistance: 380,
    estimatedDuration: 4.5,
    status: 'Draft',
    progress: 0,
    revenue: 912,
  },
  {
    id: 'trip-103',
    source: 'Los Angeles Depot, CA',
    destination: 'Las Vegas Strip Delivery, NV',
    vehicleId: 'veh-5',
    driverId: 'drv-5',
    cargoWeight: 2200,
    plannedDistance: 430,
    estimatedDuration: 5.0,
    status: 'Completed',
    progress: 100,
    startTime: '2026-07-10T08:00:00Z',
    endTime: '2026-07-10T13:15:00Z',
    revenue: 189.2,
  },
  {
    id: 'trip-104',
    source: 'New York Port Authority, NY',
    destination: 'Boston Freight Center, MA',
    vehicleId: null,
    driverId: null,
    cargoWeight: 5000,
    plannedDistance: 350,
    estimatedDuration: 4.2,
    status: 'Draft',
    progress: 0,
    revenue: 350,
  },
];

const seedMaintenanceLogs: MaintenanceLog[] = [
  {
    id: 'maint-201',
    vehicleId: 'veh-3',
    serviceType: 'Brake Overhaul & Calibration',
    description: 'Squealing noise reported by driver. Replacing pads, rotors, and bleeding lines.',
    mechanic: 'Robert Shaw',
    workshop: 'Apex Fleet Services',
    estimatedCost: 1200,
    actualCost: null,
    startDate: '2026-07-10',
    endDate: null,
    status: 'In Progress',
  },
  {
    id: 'maint-202',
    vehicleId: 'veh-1',
    serviceType: 'Routine Oil & Filters PM',
    description: '120,000 km standard service PM check.',
    mechanic: 'Robert Shaw',
    workshop: 'Apex Fleet Services',
    estimatedCost: 350,
    actualCost: 380,
    startDate: '2026-06-25',
    endDate: '2026-06-25',
    status: 'Completed',
  },
];

const seedFuelLogs: FuelLog[] = [
  {
    id: 'fuel-301',
    vehicleId: 'veh-1',
    driverId: 'drv-1',
    fuelQuantity: 220,
    fuelCost: 385,
    fuelStation: 'Shell Ultra Charge Chicago',
    date: '2026-07-08',
    odometer: 124100,
  },
  {
    id: 'fuel-302',
    vehicleId: 'veh-2',
    driverId: 'drv-2',
    fuelQuantity: 180,
    fuelCost: 324,
    fuelStation: "Love's Travel Stop #482",
    date: '2026-07-11',
    odometer: 88150,
  },
];

const seedExpenses: Expense[] = [
  {
    id: 'exp-401',
    category: 'Maintenance',
    description: 'Brake service parts Actros',
    amount: 650,
    date: '2026-07-11',
    vehicleId: 'veh-3',
    department: 'Operations',
  },
  {
    id: 'exp-402',
    category: 'Fuel',
    description: 'Refill Shell - Fuel-301',
    amount: 385,
    date: '2026-07-08',
    vehicleId: 'veh-1',
    department: 'Operations',
  },
  {
    id: 'exp-403',
    category: 'Insurance',
    description: 'Fleet insurance monthly policy installment',
    amount: 4800,
    date: '2026-07-01',
    vehicleId: null,
    department: 'Logistics',
  },
  {
    id: 'exp-404',
    category: 'Toll',
    description: 'I-90 Toll Transponder refill',
    amount: 120,
    date: '2026-07-09',
    vehicleId: 'veh-2',
    department: 'Operations',
  },
];

const seedDocuments: Document[] = [
  {
    id: 'doc-501',
    entityType: 'Vehicle',
    entityId: 'veh-1',
    name: 'Volvo FH16 Commercial Insurance Policy',
    fileUrl: '/docs/ins_volvo_fh16.pdf',
    expiryDate: '2026-11-20',
    type: 'Insurance',
  },
  {
    id: 'doc-502',
    entityType: 'Vehicle',
    entityId: 'veh-3',
    name: 'Actros Pollution Compliance Certificate',
    fileUrl: '/docs/pollution_actros.pdf',
    expiryDate: '2026-05-10', // Expired
    type: 'Pollution',
  },
  {
    id: 'doc-503',
    entityType: 'Driver',
    entityId: 'drv-3',
    name: 'CDL License - Sarah Connor',
    fileUrl: '/docs/lic_sarah_connor.pdf',
    expiryDate: '2026-05-01', // Expired
    type: 'License',
  },
];

const seedNotifications: Notification[] = [
  {
    id: 'not-601',
    type: 'Insurance Expiry',
    message: 'Vehicle NY-441-ZZ (Mercedes-Benz Actros) insurance expired on 2026-06-15.',
    read: false,
    date: '2026-07-12T08:00:00Z',
  },
  {
    id: 'not-602',
    type: 'License Expiry',
    message: 'Driver Sarah Connor CDL License expired on 2026-05-01.',
    read: false,
    date: '2026-07-12T08:15:00Z',
  },
  {
    id: 'not-603',
    type: 'Vehicle Breakdown',
    message: 'Vehicle NY-441-ZZ is In Shop for Brake Overhaul. Trip Dispatch locked.',
    read: false,
    date: '2026-07-12T08:30:00Z',
  },
];

const seedAuditLogs: AuditLog[] = [
  {
    id: 'aud-701',
    userEmail: 'system@transitops.com',
    action: 'System Bootstrapping',
    entity: 'Database',
    timestamp: '2026-07-12T04:00:00Z',
  },
];

// --- DATABASE FIELD MAPPINGS ---
function mapVehicleToDB(v: any) {
  return {
    id: v.id,
    registration_number: v.registrationNumber,
    name: v.name,
    model: v.model,
    type: v.type,
    max_load: v.maxLoad,
    current_odometer: v.currentOdometer,
    purchase_date: v.purchaseDate,
    acquisition_cost: v.acquisitionCost,
    insurance_expiry: v.insuranceExpiry,
    pollution_cert: v.pollutionCert,
    image_url: v.imageUrl,
    status: v.status,
  };
}

function mapVehicleFromDB(v: any): Vehicle {
  return {
    id: v.id,
    registrationNumber: v.registration_number,
    name: v.name,
    model: v.model,
    type: v.type,
    maxLoad: Number(v.max_load),
    currentOdometer: Number(v.current_odometer),
    purchaseDate: v.purchase_date,
    acquisitionCost: Number(v.acquisition_cost),
    insuranceExpiry: v.insurance_expiry,
    pollutionCert: v.pollution_cert,
    imageUrl: v.image_url,
    status: v.status,
  };
}

function mapDriverToDB(d: any) {
  return {
    id: d.id,
    name: d.name,
    photo: d.photo,
    license_number: d.licenseNumber,
    license_category: d.licenseCategory,
    license_expiry: d.license_expiry || d.licenseExpiryDate,
    contact_number: d.contact_number || d.contactNumber,
    email: d.email,
    safety_score: d.safetyScore,
    assigned_vehicle_id: d.assignedVehicleId,
    status: d.status,
  };
}

function mapDriverFromDB(d: any): Driver {
  return {
    id: d.id,
    name: d.name,
    photo: d.photo,
    licenseNumber: d.license_number,
    licenseCategory: d.license_category,
    licenseExpiryDate: d.license_expiry,
    contactNumber: d.contact_number,
    email: d.email,
    safetyScore: Number(d.safety_score),
    assignedVehicleId: d.assigned_vehicle_id,
    status: d.status,
  };
}

function mapTripToDB(t: any) {
  return {
    id: t.id,
    source: t.source,
    destination: t.destination,
    vehicle_id: t.vehicleId,
    driver_id: t.driverId,
    cargo_weight: t.cargoWeight,
    planned_distance: t.plannedDistance,
    estimated_duration: t.estimatedDuration,
    status: t.status,
    progress: t.progress,
    start_time: t.startTime,
    end_time: t.endTime,
  };
}

function mapTripFromDB(t: any): Trip {
  return {
    id: t.id,
    source: t.source,
    destination: t.destination,
    vehicleId: t.vehicle_id,
    driverId: t.driver_id,
    cargoWeight: Number(t.cargo_weight),
    plannedDistance: Number(t.planned_distance),
    estimatedDuration: Number(t.estimated_duration),
    status: t.status,
    progress: Number(t.progress),
    startTime: t.start_time,
    endTime: t.end_time,
  };
}

function mapMaintenanceToDB(m: any) {
  return {
    id: m.id,
    vehicle_id: m.vehicleId,
    service_type: m.serviceType,
    description: m.description,
    mechanic: m.mechanic,
    workshop: m.workshop,
    estimated_cost: m.estimatedCost,
    actual_cost: m.actualCost,
    start_date: m.startDate,
    end_date: m.endDate,
    status: m.status,
  };
}

function mapMaintenanceFromDB(m: any): MaintenanceLog {
  return {
    id: m.id,
    vehicleId: m.vehicle_id,
    serviceType: m.service_type,
    description: m.description,
    mechanic: m.mechanic,
    workshop: m.workshop,
    estimatedCost: Number(m.estimated_cost),
    actualCost: m.actual_cost ? Number(m.actual_cost) : null,
    startDate: m.start_date,
    endDate: m.end_date,
    status: m.status,
  };
}

function mapFuelToDB(f: any) {
  return {
    id: f.id,
    vehicle_id: f.vehicleId,
    driver_id: f.driverId,
    fuel_quantity: f.fuelQuantity,
    fuel_cost: f.fuelCost,
    fuel_station: f.fuelStation,
    date: f.date,
    odometer: f.odometer,
  };
}

function mapFuelFromDB(f: any): FuelLog {
  return {
    id: f.id,
    vehicleId: f.vehicle_id,
    driverId: f.driver_id,
    fuelQuantity: Number(f.fuel_quantity),
    fuelCost: Number(f.fuel_cost),
    fuelStation: f.fuel_station,
    date: f.date,
    odometer: Number(f.odometer),
  };
}

function mapExpenseToDB(e: any) {
  return {
    id: e.id,
    category: e.category,
    description: e.description,
    amount: e.amount,
    date: e.date,
    vehicle_id: e.vehicleId,
    department: e.department,
  };
}

function mapExpenseFromDB(e: any): Expense {
  return {
    id: e.id,
    category: e.category,
    description: e.description,
    amount: Number(e.amount),
    date: e.date,
    vehicleId: e.vehicle_id,
    department: e.department,
  };
}

function mapDocumentToDB(d: any) {
  return {
    id: d.id,
    entity_type: d.entityType,
    entity_id: d.entityId,
    name: d.name,
    file_url: d.fileUrl,
    expiry_date: d.expiryDate,
    type: d.type,
  };
}

function mapDocumentFromDB(d: any): Document {
  return {
    id: d.id,
    entityType: d.entity_type,
    entityId: d.entity_id,
    name: d.name,
    fileUrl: d.file_url,
    expiryDate: d.expiry_date,
    type: d.type,
  };
}

function mapNotificationToDB(n: any) {
  return {
    id: n.id,
    type: n.type,
    message: n.message,
    read: n.read,
    created_at: n.date,
  };
}

function mapNotificationFromDB(n: any): Notification {
  return {
    id: n.id,
    type: n.type,
    message: n.message,
    read: n.read,
    date: n.created_at,
  };
}

function mapAuditToDB(a: any) {
  return {
    id: a.id,
    user_email: a.userEmail,
    action: a.action,
    entity: a.entity,
    timestamp: a.timestamp,
  };
}

function mapAuditFromDB(a: any): AuditLog {
  return {
    id: a.id,
    userEmail: a.user_email,
    action: a.action,
    entity: a.entity,
    timestamp: a.timestamp,
  };
}

function mapUserToDB(u: User) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.fullName,
    role: u.role,
    approval_status: u.approvalStatus,
    company_id: u.companyId || null,
    first_name: u.firstName,
    last_name: u.lastName,
    profile_photo: u.profilePhoto,
    phone_number: u.phoneNumber,
    employee_id: u.employeeId,
    department: u.department,
    designation: u.designation,
    approved_by: u.approvedBy,
    approved_at: u.approvedAt,
    rejected_by: u.rejectedBy,
    rejected_at: u.rejectedAt,
    rejection_reason: u.rejectionReason,
    approval_notes: u.approvalNotes,
    last_status_change: u.lastStatusChange,
    registration_ip: u.registrationIp,
    device_information: u.deviceInformation,
    browser_information: u.browserInformation,
    requested_fields_to_edit: u.requestedFieldsToEdit
  };
}

function mapUserFromDB(u: any): User {
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
    approvalStatus: u.approval_status || 'Approved',
    companyId: u.company_id || undefined,
    firstName: u.first_name || '',
    lastName: u.last_name || '',
    profilePhoto: u.profile_photo || '',
    phoneNumber: u.phone_number || '',
    employeeId: u.employee_id || '',
    department: u.department || '',
    designation: u.designation || '',
    approvedBy: u.approved_by || undefined,
    approvedAt: u.approved_at || undefined,
    rejectedBy: u.rejected_by || undefined,
    rejectedAt: u.rejected_at || undefined,
    rejectionReason: u.rejection_reason || '',
    approvalNotes: u.approval_notes || '',
    lastStatusChange: u.last_status_change || undefined,
    registrationIp: u.registration_ip || '',
    deviceInformation: u.device_information || '',
    browserInformation: u.browser_information || '',
    requestedFieldsToEdit: u.requested_fields_to_edit || []
  };
}

function mapHistoryFromDB(h: any): UserApprovalHistory {
  return {
    id: h.id,
    userId: h.user_id,
    administratorId: h.administrator_id || undefined,
    action: h.action,
    previousStatus: h.previous_status,
    newStatus: h.new_status,
    reason: h.reason || '',
    timestamp: h.timestamp,
    ipAddress: h.ip_address || '',
    companyId: h.company_id || undefined
  };
}

function mapCompanyFromDB(c: any): Company {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    industry: c.industry || '',
    companySize: c.company_size || '',
    createdAt: c.created_at,
    activatedAt: c.activated_at || undefined,
    createdByAdminUserId: c.created_by_admin_user_id || undefined
  };
}


async function supabaseSync(table: string, action: 'insert' | 'update' | 'delete', data: any, id?: string, companyId?: string) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const payload = (action === 'insert' && companyId) ? { ...data, company_id: companyId } : data;
    if (action === 'insert') {
      const { error } = await supabase.from(table).insert(payload);
      if (error) console.error(`Supabase Insert error on ${table}:`, error);
    } else if (action === 'update') {
      const { error } = await supabase.from(table).update(data).eq('id', id);
      if (error) console.error(`Supabase Update error on ${table}:`, error);
    } else if (action === 'delete') {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) console.error(`Supabase Delete error on ${table}:`, error);
    }
  } catch (err) {
    console.error(`Supabase Sync Exception [${table} - ${action}]:`, err);
  }
}

function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch (_) {}
  }
  // RFC4122 version 4 compliant fallback UUID generator for non-secure contexts (HTTP on LAN IP)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- INTERACTION STORE INTERFACE ---

interface TransitState {
  currentUser: User | null;
  users: User[];
  companies: Company[];
  currentCompany: Company | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  documents: Document[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  userApprovalHistory: UserApprovalHistory[];
  rememberMe: boolean;
  authLoading: boolean;

  // Company Actions
  registerCompany: (companyName: string, industry: string, companySize: string, adminPayload: Omit<User, 'id' | 'approvalStatus' | 'companyId'>, password?: string) => Promise<{ success: boolean; message: string }>;
  fetchCompanies: () => Promise<Company[]>;

  // Authentication Actions
  login: (email: string, role?: UserRole) => boolean; // Keep for fallback compatibility
  loginWithEmail: (email: string, role: UserRole, password?: string) => Promise<boolean>;
  loginWithGoogle: (role: UserRole) => Promise<boolean>;
  registerRequest: (user: Omit<User, 'id' | 'approvalStatus'>, password?: string) => Promise<{ success: boolean; message: string }>;
  addEmployee: (employeeDetails: Omit<User, 'id' | 'approvalStatus' | 'companyId' | 'lastStatusChange'>) => Promise<{ success: boolean; message: string }>;
  approveUserRequest: (userId: string, adminId: string, notes?: string) => Promise<{ success: boolean; message: string }>;
  rejectUserRequest: (userId: string, adminId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  requestMoreInfo: (userId: string, adminId: string, fields: string[], notes: string) => Promise<{ success: boolean; message: string }>;
  suspendUser: (userId: string, adminId: string) => Promise<{ success: boolean; message: string }>;
  reactivateUser: (userId: string, adminId: string) => Promise<{ success: boolean; message: string }>;
  updateUserRequestFields: (userId: string, updates: Partial<User>) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  setRememberMe: (val: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setAuthLoading: (val: boolean) => void;

  // Vehicles Actions
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => { success: boolean; message: string };
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => { success: boolean; message: string };
  deleteVehicle: (id: string) => { success: boolean; message: string };
  processTelemetryEvent: (payload: any) => void;

  // Drivers Actions
  addDriver: (driver: Omit<Driver, 'id'>) => { success: boolean; message: string };
  updateDriver: (id: string, driver: Partial<Driver>) => { success: boolean; message: string };
  deleteDriver: (id: string) => { success: boolean; message: string };

  // Trips Actions
  addTrip: (trip: Omit<Trip, 'id' | 'progress' | 'revenue'>) => { success: boolean; message: string };
  updateTrip: (id: string, trip: Partial<Trip>) => { success: boolean; message: string };
  dispatchTrip: (id: string) => { success: boolean; message: string };
  completeTrip: (id: string) => { success: boolean; message: string };
  cancelTrip: (id: string) => { success: boolean; message: string };
  deleteTrip: (id: string) => { success: boolean; message: string };

  // Maintenance Actions
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => { success: boolean; message: string };
  updateMaintenanceLog: (id: string, log: Partial<MaintenanceLog>) => { success: boolean; message: string };

  // Fuel Actions
  addFuelLog: (log: Omit<FuelLog, 'id'>) => { success: boolean; message: string };

  // Expenses Actions
  addExpense: (expense: Omit<Expense, 'id'>) => { success: boolean; message: string };

  // Documents Actions
  addDocument: (doc: Omit<Document, 'id'>) => { success: boolean; message: string };
  deleteDocument: (id: string) => { success: boolean; message: string };

  // Notifications Actions
  addNotification: (type: Notification['type'], message: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Audit Action
  logAction: (action: string, entity: string) => void;

  // Sync Action
  syncWithSupabase: () => Promise<void>;

  // Reset db
  resetStore: () => void;
}

export const useTransitStore = create<TransitState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: seedUsers,
      companies: [],
      currentCompany: null,
      vehicles: seedVehicles,
      drivers: seedDrivers,
      trips: seedTrips,
      maintenanceLogs: seedMaintenanceLogs,
      fuelLogs: seedFuelLogs,
      expenses: seedExpenses,
      documents: seedDocuments,
      notifications: seedNotifications,
      auditLogs: seedAuditLogs,
      userApprovalHistory: [],
      rememberMe: false,
      authLoading: false,

      setRememberMe: (val) => set({ rememberMe: val }),
      setCurrentUser: (user) => set({ currentUser: user }),
      setAuthLoading: (val) => set({ authLoading: val }),

      // --- Company Actions ---
      registerCompany: async (companyName, industry, companySize, adminPayload, password = 'password123') => {
        set({ authLoading: true });
        try {
          const companyId = generateUUID();
          const adminUserId = generateUUID();

          // 1. Register in Firebase (if not already logged in with this email via Google)
          if (isFirebaseConfigured && auth) {
            const currentFirebaseUser = auth.currentUser;
            if (!currentFirebaseUser || currentFirebaseUser.email !== adminPayload.email) {
              try {
                await createUserWithEmailAndPassword(auth, adminPayload.email, password);
              } catch (err: any) {
                // If the email is already in use (e.g. they created it before but didn't finish DB setup), we can proceed if we can sign them in.
                if (err.code === 'auth/email-already-in-use') {
                   // We assume they are already authenticated or will authenticate later. 
                   // Ideally, we'd sign them in, but if they came from Google Auth, currentFirebaseUser should be set.
                } else {
                  throw err;
                }
              }
            }
          }

          // 2. Insert company into Supabase
          if (isSupabaseConfigured && supabase) {
            const { error: companyError } = await supabase.from('companies').insert({
              id: companyId,
              name: companyName,
              status: 'active',
              industry: industry,
              company_size: companySize,
              activated_at: new Date().toISOString(),
              created_by_admin_user_id: adminUserId
            });
            if (companyError) throw new Error(`Failed to create company: ${companyError.message}`);
          }

          // 3. Create Admin User linked to this company
          const adminUser: User = {
            ...adminPayload,
            id: adminUserId,
            role: 'Administrator',
            approvalStatus: 'Approved',
            companyId: companyId,
            lastStatusChange: new Date().toISOString()
          };

          set((state) => ({
            users: [...state.users, adminUser],
            companies: [...state.companies, {
              id: companyId,
              name: companyName,
              status: 'active' as CompanyStatus,
              industry,
              companySize,
              createdAt: new Date().toISOString(),
              activatedAt: new Date().toISOString(),
              createdByAdminUserId: adminUserId
            }]
          }));

          if (isSupabaseConfigured && supabase) {
            const { error: userError } = await supabase.from('users').insert(mapUserToDB(adminUser));
            if (userError) throw new Error(`Failed to create admin user in database: ${userError.message}`);
          }

          get().logAction('Company Registration', `New company "${companyName}" registered by admin ${adminPayload.email}`);

          set({ authLoading: false });
          return { success: true, message: `Company "${companyName}" has been created successfully. You are now the Company Administrator.` };
        } catch (err: any) {
          console.error('Company registration error:', err);
          set({ authLoading: false });
          return { success: false, message: err?.message || 'Failed to register company.' };
        }
      },

      fetchCompanies: async () => {
        if (!isSupabaseConfigured || !supabase) return get().companies;
        try {
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('status', 'active');
          if (error) throw error;
          const companies = data ? data.map(mapCompanyFromDB) : [];
          set({ companies });
          return companies;
        } catch (err) {
          console.error('Failed to fetch companies:', err);
          return [];
        }
      },

      login: (email, selectedRole) => {
        const emailLower = email.toLowerCase().trim();
        const user = get().users.find((u) => u.email.toLowerCase() === emailLower);
        if (user) {
          const authenticatedUser = selectedRole ? { ...user, role: selectedRole } : user;
          set({ currentUser: authenticatedUser });
          get().logAction('User Login', `User ${authenticatedUser.email} logged in with role ${authenticatedUser.role}`);
          return true;
        }
        // If not found in seed, create a default user dynamically for convenience
        const newUser: User = {
          id: generateUUID(),
          email: emailLower,
          fullName: emailLower.split('@')[0].toUpperCase(),
          role: selectedRole || 'Fleet Manager',
          approvalStatus: 'Approved',
          firstName: emailLower.split('@')[0],
          lastName: '',
        };
        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
        }));
        get().logAction('Dynamic User Registration', `Registered user ${newUser.email} as ${newUser.role}`);
        return true;
      },

      loginWithEmail: async (email, role, password = 'password123') => {
        set({ authLoading: true });
        try {
          if (isFirebaseConfigured && auth) {
            try {
              await signInWithEmailAndPassword(auth, email, password);
            } catch (err: any) {
              if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/cannot-find-user') {
                try {
                  await createUserWithEmailAndPassword(auth, email, password);
                } catch (createErr: any) {
                  if (createErr.code === 'auth/email-already-in-use') {
                    throw new Error('Invalid credentials. This email is already registered, please verify your password.');
                  }
                  throw createErr;
                }
              } else {
                throw err;
              }
            }
          }

          let user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
          if (!user) {
            // Check Supabase in case the user exists in the DB but not yet synced locally
            if (isSupabaseConfigured && supabase) {
              const { data: dbUser, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).single();
              if (error && error.code !== 'PGRST116') {
                console.error('Supabase fetch user error:', error);
              }
              if (dbUser) {
                user = mapUserFromDB(dbUser);
                set((state) => ({ users: [...state.users, user!] }));
              }
            }
          }

          if (!user) {
            user = {
              id: generateUUID(),
              email: email.toLowerCase().trim(),
              fullName: email.split('@')[0].toUpperCase(),
              role: role,
              approvalStatus: 'Pending Approval',
              firstName: email.split('@')[0],
              lastName: '',
            };
            set((state) => ({ users: [...state.users, user!] }));
            if (isSupabaseConfigured && supabase) {
              await supabase.from('users').insert(mapUserToDB(user));
            }
          }

          if (user.approvalStatus === 'Pending Approval') {
            throw new Error('Your registration request is still pending administrator approval. Please wait until your organization administrator approves your account.');
          }
          if (user.approvalStatus === 'Rejected') {
            throw new Error(`Your registration request has been rejected. Reason: ${user.rejectionReason || 'No reason provided.'}`);
          }
          if (user.approvalStatus === 'Suspended') {
            throw new Error('Your account has been suspended. Please contact your administrator.');
          }
          if (user.approvalStatus === 'Inactive') {
            throw new Error('Your account is inactive. Please contact your administrator.');
          }

          // Resolve company for the logged-in user
          const userCompany = user.companyId ? get().companies.find(c => c.id === user.companyId) || null : null;
          set({ currentUser: user, currentCompany: userCompany, authLoading: false });
          get().logAction('User Login', `User ${user.email} logged in with role ${user.role} (Firebase/Email)`);
          return true;
        } catch (err) {
          console.error('Login error:', err);
          set({ authLoading: false });
          throw err;
        }
      },

      loginWithGoogle: async (role) => {
        set({ authLoading: true });
        try {
          let email = '';
          if (isFirebaseConfigured && auth) {
            const result = await signInWithPopup(auth, googleProvider);
            email = result.user.email || '';
          } else {
            email = window.prompt("Firebase is not configured. Enter your email to simulate Google Login:", "google-user@transitops.com") || '';
          }

          if (!email) {
            set({ authLoading: false });
            return false;
          }

          let user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
          if (!user) {
            // Also check Supabase in case the user exists in the DB but not yet synced locally
            if (isSupabaseConfigured && supabase) {
              const { data: dbUser, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).single();
              if (error && error.code !== 'PGRST116') {
                console.error('Supabase fetch user error:', error);
              }
              if (dbUser) {
                user = mapUserFromDB(dbUser);
                set((state) => ({ users: [...state.users, user!] }));
              }
            }
          }

          if (!user) {
            set({ authLoading: false });
            // Throw a special error so the login page can redirect to signup
            const err = new Error('ACCOUNT_NOT_FOUND');
            (err as any).googleEmail = email;
            throw err;
          }

          if (user.approvalStatus === 'Pending Approval') {
            throw new Error('Your registration request is still pending administrator approval. Please wait until your organization administrator approves your account.');
          }
          if (user.approvalStatus === 'Rejected') {
            throw new Error(`Your registration request has been rejected. Reason: ${user.rejectionReason || 'No reason provided.'}`);
          }
          if (user.approvalStatus === 'Suspended') {
            throw new Error('Your account has been suspended. Please contact your administrator.');
          }
          if (user.approvalStatus === 'Inactive') {
            throw new Error('Your account is inactive. Please contact your administrator.');
          }

          // Resolve company for the logged-in user
          const userCompany = user.companyId ? get().companies.find(c => c.id === user.companyId) || null : null;
          set({ currentUser: user, currentCompany: userCompany, authLoading: false });
          get().logAction('User Login', `User ${user.email} logged in with role ${user.role} (Firebase/Google)`);
          return true;
        } catch (err) {
          console.error('Google Login error:', err);
          set({ authLoading: false });
          throw err;
        }
      },

      registerRequest: async (userDetails, password = 'password123') => {
        set({ authLoading: true });
        try {
          const newUserId = generateUUID();
          
          if (isFirebaseConfigured && auth) {
            await createUserWithEmailAndPassword(auth, userDetails.email, password);
          }

          const newUser: User = {
            ...userDetails,
            id: newUserId,
            approvalStatus: 'Pending Approval',
            lastStatusChange: new Date().toISOString()
          };

          set((state) => ({ users: [...state.users, newUser] }));
          if (isSupabaseConfigured && supabase) {
            const { error: userError } = await supabase.from('users').insert(mapUserToDB(newUser));
            if (userError) throw new Error(`Failed to submit registration to database: ${userError.message}`);
          }

          // Trigger local in-app notification for Admins
          get().addNotification('Registration', `🔔 New Registration Request: ${newUser.fullName} has requested access as ${newUser.role} in ${newUser.department || 'Operations'}.`);
          get().logAction('Registration Request Submitted', `User ${newUser.email} submitted registration request for role ${newUser.role}`);
          
          set({ authLoading: false });
          return { success: true, message: 'Your registration request has been submitted successfully.' };
        } catch (err: any) {
          console.error('Registration request error:', err);
          set({ authLoading: false });
          return { success: false, message: err?.message || 'Failed to submit registration request.' };
        }
      },

      addEmployee: async (employeeDetails) => {
        set({ authLoading: true });
        try {
          const newUserId = generateUUID();
          const currentCompanyId = get().currentUser?.companyId;

          if (!currentCompanyId) {
            throw new Error("You must be logged in as an Administrator associated with a company to add employees.");
          }

          const newEmployee: User = {
            ...employeeDetails,
            id: newUserId,
            companyId: currentCompanyId,
            approvalStatus: 'Approved',
            lastStatusChange: new Date().toISOString()
          };

          // Save locally in Zustand
          set((state) => ({ users: [...state.users, newEmployee] }));

          // Save to Supabase (RLS is disabled by fix_rls.sql, so it bypasses RLS)
          if (isSupabaseConfigured && supabase) {
            const { error: userError } = await supabase.from('users').insert(mapUserToDB(newEmployee));
            if (userError) throw new Error(`Failed to create user record in database: ${userError.message}`);
          }

          get().logAction('Add Employee Directly', `Administrator added employee ${newEmployee.email} as ${newEmployee.role}`);

          set({ authLoading: false });
          return { success: true, message: 'Employee added successfully.' };
        } catch (err: any) {
          console.error('Add employee error:', err);
          set({ authLoading: false });
          return { success: false, message: err?.message || 'Failed to add employee.' };
        }
      },

      approveUserRequest: async (userId, adminId, notes) => {
        const adminUser = get().users.find(u => u.id === adminId);
        const adminName = adminUser?.fullName || 'Administrator';
        const targetUser = get().users.find(u => u.id === userId);
        if (!targetUser) return { success: false, message: 'User not found' };

        const previousStatus = targetUser.approvalStatus;
        const newStatus = 'Approved';
        const timestamp = new Date().toISOString();

        const updatedUser: User = {
          ...targetUser,
          approvalStatus: newStatus,
          approvedBy: adminId,
          approvedAt: timestamp,
          approvalNotes: notes || '',
          lastStatusChange: timestamp
        };

        set((state) => ({
          users: state.users.map(u => u.id === userId ? updatedUser : u)
        }));

        if (isSupabaseConfigured && supabase) {
          await supabase.from('users').update(mapUserToDB(updatedUser)).eq('id', userId);
          // Log to approval history table
          await supabase.from('user_approval_history').insert({
            user_id: userId,
            administrator_id: adminId,
            action: 'Approve',
            previous_status: previousStatus,
            new_status: newStatus,
            reason: notes || '',
            timestamp: timestamp,
            ip_address: targetUser.registrationIp || ''
          });
        }

        get().logAction('Approve User', `Administrator ${adminName} approved user ${targetUser.email}.`);
        get().addNotification('Clearance', `User account ${targetUser.email} has been approved and activated.`);
        return { success: true, message: 'User approved successfully.' };
      },

      rejectUserRequest: async (userId, adminId, reason) => {
        const adminUser = get().users.find(u => u.id === adminId);
        const adminName = adminUser?.fullName || 'Administrator';
        const targetUser = get().users.find(u => u.id === userId);
        if (!targetUser) return { success: false, message: 'User not found' };

        const previousStatus = targetUser.approvalStatus;
        const newStatus = 'Rejected';
        const timestamp = new Date().toISOString();

        const updatedUser: User = {
          ...targetUser,
          approvalStatus: newStatus,
          rejectedBy: adminId,
          rejectedAt: timestamp,
          rejectionReason: reason,
          lastStatusChange: timestamp
        };

        set((state) => ({
          users: state.users.map(u => u.id === userId ? updatedUser : u)
        }));

        if (isSupabaseConfigured && supabase) {
          await supabase.from('users').update(mapUserToDB(updatedUser)).eq('id', userId);
          await supabase.from('user_approval_history').insert({
            user_id: userId,
            administrator_id: adminId,
            action: 'Reject',
            previous_status: previousStatus,
            new_status: newStatus,
            reason: reason,
            timestamp: timestamp,
            ip_address: targetUser.registrationIp || ''
          });
        }

        get().logAction('Reject User', `Administrator ${adminName} rejected user ${targetUser.email}. Reason: ${reason}`);
        get().addNotification('Clearance', `User account ${targetUser.email} has been rejected.`);
        return { success: true, message: 'User request rejected successfully.' };
      },

      requestMoreInfo: async (userId, adminId, fields, notes) => {
        const adminUser = get().users.find(u => u.id === adminId);
        const adminName = adminUser?.fullName || 'Administrator';
        const targetUser = get().users.find(u => u.id === userId);
        if (!targetUser) return { success: false, message: 'User not found' };

        const previousStatus = targetUser.approvalStatus;
        const newStatus = 'Information Required';
        const timestamp = new Date().toISOString();

        const updatedUser: User = {
          ...targetUser,
          approvalStatus: newStatus,
          requestedFieldsToEdit: fields,
          approvalNotes: notes,
          lastStatusChange: timestamp
        };

        set((state) => ({
          users: state.users.map(u => u.id === userId ? updatedUser : u)
        }));

        if (isSupabaseConfigured && supabase) {
          await supabase.from('users').update(mapUserToDB(updatedUser)).eq('id', userId);
          await supabase.from('user_approval_history').insert({
            user_id: userId,
            administrator_id: adminId,
            action: 'Request Info',
            previous_status: previousStatus,
            new_status: newStatus,
            reason: notes,
            timestamp: timestamp,
            ip_address: targetUser.registrationIp || ''
          });
        }

        get().logAction('Request User Info', `Administrator ${adminName} requested more info from ${targetUser.email}. Fields: ${fields.join(', ')}`);
        return { success: true, message: 'Information request submitted successfully.' };
      },

      suspendUser: async (userId, adminId) => {
        const adminUser = get().users.find(u => u.id === adminId);
        const adminName = adminUser?.fullName || 'Administrator';
        const targetUser = get().users.find(u => u.id === userId);
        if (!targetUser) return { success: false, message: 'User not found' };

        const previousStatus = targetUser.approvalStatus;
        const newStatus = 'Suspended';
        const timestamp = new Date().toISOString();

        const updatedUser: User = {
          ...targetUser,
          approvalStatus: newStatus,
          lastStatusChange: timestamp
        };

        set((state) => ({
          users: state.users.map(u => u.id === userId ? updatedUser : u)
        }));

        if (isSupabaseConfigured && supabase) {
          await supabase.from('users').update(mapUserToDB(updatedUser)).eq('id', userId);
          await supabase.from('user_approval_history').insert({
            user_id: userId,
            administrator_id: adminId,
            action: 'Suspend',
            previous_status: previousStatus,
            new_status: newStatus,
            timestamp: timestamp,
            ip_address: targetUser.registrationIp || ''
          });
        }

        get().logAction('Suspend User', `Administrator ${adminName} suspended user ${targetUser.email}.`);
        return { success: true, message: 'User suspended successfully.' };
      },

      reactivateUser: async (userId, adminId) => {
        const adminUser = get().users.find(u => u.id === adminId);
        const adminName = adminUser?.fullName || 'Administrator';
        const targetUser = get().users.find(u => u.id === userId);
        if (!targetUser) return { success: false, message: 'User not found' };

        const previousStatus = targetUser.approvalStatus;
        const newStatus = 'Approved';
        const timestamp = new Date().toISOString();

        const updatedUser: User = {
          ...targetUser,
          approvalStatus: newStatus,
          lastStatusChange: timestamp
        };

        set((state) => ({
          users: state.users.map(u => u.id === userId ? updatedUser : u)
        }));

        if (isSupabaseConfigured && supabase) {
          await supabase.from('users').update(mapUserToDB(updatedUser)).eq('id', userId);
          await supabase.from('user_approval_history').insert({
            user_id: userId,
            administrator_id: adminId,
            action: 'Reactivate',
            previous_status: previousStatus,
            new_status: newStatus,
            timestamp: timestamp,
            ip_address: targetUser.registrationIp || ''
          });
        }

        get().logAction('Reactivate User', `Administrator ${adminName} reactivated user ${targetUser.email}.`);
        return { success: true, message: 'User reactivated successfully.' };
      },

      updateUserRequestFields: async (userId, updates) => {
        const targetUser = get().users.find(u => u.id === userId);
        if (!targetUser) return { success: false, message: 'User not found' };

        const updatedUser: User = {
          ...targetUser,
          ...updates,
          approvalStatus: 'Pending Approval', // Resubmitted, goes back to pending
          requestedFieldsToEdit: [], // Clear requested edits list
          lastStatusChange: new Date().toISOString()
        };

        set((state) => ({
          users: state.users.map(u => u.id === userId ? updatedUser : u)
        }));

        if (isSupabaseConfigured && supabase) {
          await supabase.from('users').update(mapUserToDB(updatedUser)).eq('id', userId);
        }

        get().addNotification('Registration', `🔔 Resubmitted: ${updatedUser.fullName} updated and resubmitted their registration details.`);
        get().logAction('Resubmit Registration Info', `User ${targetUser.email} updated and resubmitted details.`);
        return { success: true, message: 'Information resubmitted successfully.' };
      },

      logout: async () => {
        const user = get().currentUser;
        if (isFirebaseConfigured && auth) {
          await signOut(auth);
        }
        if (user) {
          get().logAction('User Logout', `User ${user.email} logged out`);
        }
        set({ currentUser: null });
      },

      // Vehicles CRUD
      addVehicle: (vehicle) => {
        const exists = get().vehicles.some(
          (v) => v.registrationNumber.toUpperCase() === vehicle.registrationNumber.toUpperCase()
        );
        if (exists) {
          return { success: false, message: `Vehicle Registration Number ${vehicle.registrationNumber} must be unique.` };
        }

        const newId = generateUUID();
        const newVeh: Vehicle = {
          ...vehicle,
          id: newId,
          status: vehicle.status || 'Available',
        };

        set((state) => ({ vehicles: [...state.vehicles, newVeh] }));
        get().logAction('Create Vehicle', `Added vehicle ${newVeh.registrationNumber} (${newVeh.name})`);
        
        // Async Supabase Sync
        supabaseSync('vehicles', 'insert', mapVehicleToDB(newVeh), undefined, get().currentUser?.companyId);
        
        return { success: true, message: 'Vehicle added successfully.' };
      },

      updateVehicle: (id, update) => {
        if (update.registrationNumber) {
          const exists = get().vehicles.some(
            (v) => v.id !== id && v.registrationNumber.toUpperCase() === update.registrationNumber?.toUpperCase()
          );
          if (exists) {
            return { success: false, message: `Registration number ${update.registrationNumber} is already in use by another vehicle.` };
          }
        }

        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...update } : v)),
        }));
        const veh = get().vehicles.find((v) => v.id === id);
        get().logAction('Update Vehicle', `Updated vehicle ${veh?.registrationNumber}`);

        // Async Supabase Sync
        if (veh) {
          supabaseSync('vehicles', 'update', mapVehicleToDB(veh), id);
        }

        return { success: true, message: 'Vehicle updated successfully.' };
      },

      processTelemetryEvent: (payload) => {
        set((state) => {
          const vehIndex = state.vehicles.findIndex(v => v.id === payload.vehicle_id);
          if (vehIndex === -1) return state; // Vehicle not found

          const veh = state.vehicles[vehIndex];
          const newTelemetry: TelemetryPoint = {
            latitude: payload.latitude,
            longitude: payload.longitude,
            speed: payload.speed,
            heading: payload.heading,
            fuelLevel: payload.fuel_level,
            batteryLevel: payload.battery_level,
            ignition: payload.ignition_status,
            accuracy: payload.gps_accuracy,
            timestamp: payload.recorded_at
          };

          const isTruck = payload.source === 'telematics';
          const truckTelemetry = isTruck ? newTelemetry : veh.truckTelemetry;
          const mobileTelemetry = !isTruck ? newTelemetry : veh.mobileTelemetry;

          // Source Selection Logic
          const now = Date.now();
          const oneMinute = 60000;
          
          let activeTelemetrySource: 'telematics' | 'mobile_app' | 'offline' = 'offline';
          let gpsLocation = veh.gpsLocation;

          const truckIsOnline = truckTelemetry && (now - new Date(truckTelemetry.timestamp).getTime() < oneMinute);
          const mobileIsOnline = mobileTelemetry && (now - new Date(mobileTelemetry.timestamp).getTime() < oneMinute);

          if (truckIsOnline) {
             activeTelemetrySource = 'telematics';
             gpsLocation = { lat: truckTelemetry.latitude, lng: truckTelemetry.longitude };
          } else if (mobileIsOnline) {
             activeTelemetrySource = 'mobile_app';
             gpsLocation = { lat: mobileTelemetry.latitude, lng: mobileTelemetry.longitude };
          }

          const updatedVehicles = [...state.vehicles];
          updatedVehicles[vehIndex] = {
            ...veh,
            truckTelemetry,
            mobileTelemetry,
            activeTelemetrySource,
            gpsLocation
          };

          return { vehicles: updatedVehicles };
        });
      },

      deleteVehicle: (id) => {
        const veh = get().vehicles.find((v) => v.id === id);
        if (!veh) return { success: false, message: 'Vehicle not found.' };

        // Check if assigned to any active trip
        const activeTrip = get().trips.some((t) => t.vehicleId === id && (t.status === 'Dispatched' || t.status === 'Draft'));
        if (activeTrip) {
          return { success: false, message: 'Cannot delete vehicle. It is currently assigned to a draft or dispatched trip.' };
        }

        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
          drivers: state.drivers.map((d) => (d.assignedVehicleId === id ? { ...d, assignedVehicleId: null } : d)),
        }));
        get().logAction('Delete Vehicle', `Deleted vehicle ${veh.registrationNumber}`);

        // Async Supabase Sync
        supabaseSync('vehicles', 'delete', null, id);

        return { success: true, message: 'Vehicle deleted successfully.' };
      },

      // Drivers CRUD
      addDriver: (driver) => {
        const exists = get().drivers.some((d) => d.email.toLowerCase() === driver.email.toLowerCase());
        if (exists) {
          return { success: false, message: `Driver with email ${driver.email} already exists.` };
        }

        const newId = generateUUID();
        const newDrv: Driver = {
          ...driver,
          id: newId,
          status: driver.status || 'Available',
        };

        set((state) => ({ drivers: [...state.drivers, newDrv] }));
        get().logAction('Create Driver', `Added driver ${newDrv.name}`);

        // Async Supabase Sync
        supabaseSync('drivers', 'insert', mapDriverToDB(newDrv), undefined, get().currentUser?.companyId);

        return { success: true, message: 'Driver added successfully.' };
      },

      updateDriver: (id, update) => {
        if (update.email) {
          const exists = get().drivers.some((d) => d.id !== id && d.email.toLowerCase() === update.email?.toLowerCase());
          if (exists) {
            return { success: false, message: `Email ${update.email} is already in use by another driver.` };
          }
        }

        set((state) => ({
          drivers: state.drivers.map((d) => (d.id === id ? { ...d, ...update } : d)),
        }));
        const drv = get().drivers.find((d) => d.id === id);
        get().logAction('Update Driver', `Updated driver ${drv?.name}`);

        // Async Supabase Sync
        if (drv) {
          supabaseSync('drivers', 'update', mapDriverToDB(drv), id);
        }

        return { success: true, message: 'Driver updated successfully.' };
      },

      deleteDriver: (id) => {
        const drv = get().drivers.find((d) => d.id === id);
        if (!drv) return { success: false, message: 'Driver not found.' };

        // Check active trips
        const activeTrip = get().trips.some((t) => t.driverId === id && (t.status === 'Dispatched' || t.status === 'Draft'));
        if (activeTrip) {
          return { success: false, message: 'Cannot delete driver. They are currently assigned to a draft or dispatched trip.' };
        }

        set((state) => ({
          drivers: state.drivers.filter((d) => d.id !== id),
        }));
        get().logAction('Delete Driver', `Deleted driver ${drv.name}`);

        // Async Supabase Sync
        supabaseSync('drivers', 'delete', null, id);

        return { success: true, message: 'Driver deleted successfully.' };
      },

      // Trips Core Business Rules
      addTrip: (trip) => {
        // Validate cargo weight
        if (trip.vehicleId) {
          const vehicle = get().vehicles.find((v) => v.id === trip.vehicleId);
          if (vehicle && trip.cargoWeight > vehicle.maxLoad) {
            return { success: false, message: `Cargo weight (${trip.cargoWeight} kg) exceeds vehicle maximum load capacity (${vehicle.maxLoad} kg).` };
          }
        }

        const newId = generateUUID();
        const newTrip: Trip = {
          ...trip,
          id: newId,
          progress: 0,
          revenue: (trip.cargoWeight / 1000) * trip.plannedDistance * 0.20, // $0.20 per ton-km
        };

        set((state) => ({ trips: [...state.trips, newTrip] }));
        get().logAction('Create Trip', `Created draft trip from ${trip.source} to ${trip.destination}`);
        
        // Async Supabase Sync
        supabaseSync('trips', 'insert', mapTripToDB(newTrip), undefined, get().currentUser?.companyId);

        return { success: true, message: 'Trip created in draft status.' };
      },

      updateTrip: (id, update) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return { success: false, message: 'Trip not found.' };

        // Capacity validation on vehicle change
        const vehicleId = update.vehicleId !== undefined ? update.vehicleId : trip.vehicleId;
        const cargoWeight = update.cargoWeight !== undefined ? update.cargoWeight : trip.cargoWeight;
        if (vehicleId) {
          const vehicle = get().vehicles.find((v) => v.id === vehicleId);
          if (vehicle && cargoWeight > vehicle.maxLoad) {
            return { success: false, message: `Cargo weight (${cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoad} kg).` };
          }
        }

        // Recalculate revenue if cargo or distance changes
        let revenue = trip.revenue;
        const plannedDistance = update.plannedDistance !== undefined ? update.plannedDistance : trip.plannedDistance;
        if (cargoWeight !== undefined || plannedDistance !== undefined) {
          revenue = (cargoWeight / 1000) * plannedDistance * 0.20;
        }

        set((state) => ({
          trips: state.trips.map((t) => (t.id === id ? { ...t, ...update, revenue } : t)),
        }));
        const updatedTrip = get().trips.find((t) => t.id === id);
        get().logAction('Update Trip', `Updated trip details for trip-${id.split('-')[1]}`);
        
        // Async Supabase Sync
        if (updatedTrip) {
          supabaseSync('trips', 'update', mapTripToDB(updatedTrip), id);
        }

        return { success: true, message: 'Trip updated successfully.' };
      },

      dispatchTrip: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return { success: false, message: 'Trip not found.' };
        if (!trip.vehicleId || !trip.driverId) {
          return { success: false, message: 'Cannot dispatch. Vehicle and Driver must be assigned first.' };
        }

        const vehicle = get().vehicles.find((v) => v.id === trip.vehicleId);
        const driver = get().drivers.find((d) => d.id === trip.driverId);

        if (!vehicle || !driver) {
          return { success: false, message: 'Vehicle or Driver no longer exists.' };
        }

        // Enforce Business Rules
        // Rule: Vehicles marked Retired or In Shop cannot be assigned to trips.
        if (vehicle.status === 'Retired') {
          return { success: false, message: `Vehicle ${vehicle.registrationNumber} is Retired and cannot be dispatched.` };
        }
        if (vehicle.status === 'In Shop') {
          return { success: false, message: `Vehicle ${vehicle.registrationNumber} is In Shop for maintenance and cannot be dispatched.` };
        }
        // Rule: A vehicle already On Trip cannot be assigned to another trip.
        if (vehicle.status === 'On Trip') {
          return { success: false, message: `Vehicle ${vehicle.registrationNumber} is already active on another trip.` };
        }

        // Rule: Drivers with expired licenses cannot be assigned.
        const todayStr = new Date().toISOString().split('T')[0];
        if (driver.licenseExpiryDate < todayStr) {
          return { success: false, message: `Driver ${driver.name} has an EXPIRED Commercial License and cannot be dispatched.` };
        }
        // Rule: Suspended drivers cannot be assigned.
        if (driver.status === 'Suspended') {
          return { success: false, message: `Driver ${driver.name} is Suspended and cannot be assigned to a trip.` };
        }
        // Rule: A driver already On Trip cannot be assigned to another trip.
        if (driver.status === 'On Trip') {
          return { success: false, message: `Driver ${driver.name} is already active on another trip.` };
        }

        // Enforce Capacity Rule just in case
        if (trip.cargoWeight > vehicle.maxLoad) {
          return { success: false, message: `Cargo weight (${trip.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoad} kg).` };
        }

        const dispatchTime = new Date().toISOString();

        // Dispatch status update
        // Rule: Dispatching a trip automatically changes: Vehicle -> On Trip, Driver -> On Trip
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === id ? { ...t, status: 'Dispatched', progress: 5, startTime: dispatchTime } : t
          ),
          vehicles: state.vehicles.map((v) => (v.id === trip.vehicleId ? { ...v, status: 'On Trip' } : v)),
          drivers: state.drivers.map((d) => (d.id === trip.driverId ? { ...d, status: 'On Trip' } : d)),
        }));

        get().logAction('Dispatch Trip', `Dispatched trip-${id.split('-')[1]} with vehicle ${vehicle.registrationNumber} & driver ${driver.name}`);

        // Async Supabase Sync for Trip, Vehicle, and Driver statuses
        const updatedTrip = get().trips.find((t) => t.id === id);
        const updatedVehicle = get().vehicles.find((v) => v.id === trip.vehicleId);
        const updatedDriver = get().drivers.find((d) => d.id === trip.driverId);

        if (updatedTrip) supabaseSync('trips', 'update', mapTripToDB(updatedTrip), id);
        if (updatedVehicle) supabaseSync('vehicles', 'update', mapVehicleToDB(updatedVehicle), trip.vehicleId || undefined);
        if (updatedDriver) supabaseSync('drivers', 'update', mapDriverToDB(updatedDriver), trip.driverId || undefined);

        return { success: true, message: 'Trip successfully dispatched!' };
      },

      completeTrip: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return { success: false, message: 'Trip not found.' };

        const endTime = new Date().toISOString();

        // Rule: Completing a trip automatically changes: Vehicle -> Available, Driver -> Available
        // And we add trip distance to vehicle odometer
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === id ? { ...t, status: 'Completed', progress: 100, endTime: endTime } : t
          ),
          vehicles: state.vehicles.map((v) => {
            if (v.id === trip.vehicleId) {
              return {
                ...v,
                status: 'Available',
                currentOdometer: Number(v.currentOdometer) + Number(trip.plannedDistance),
              };
            }
            return v;
          }),
          drivers: state.drivers.map((d) => (d.id === trip.driverId ? { ...d, status: 'Available' } : d)),
        }));

        // Log completion action
        const vehicle = get().vehicles.find((v) => v.id === trip.vehicleId);
        const driver = get().drivers.find((d) => d.id === trip.driverId);
        get().logAction('Complete Trip', `Completed trip-${id.split('-')[1]}. Vehicle odometer updated to ${vehicle ? Number(vehicle.currentOdometer) + Number(trip.plannedDistance) : ''} km.`);

        // Async Supabase Sync
        const updatedTrip = get().trips.find((t) => t.id === id);
        if (updatedTrip) supabaseSync('trips', 'update', mapTripToDB(updatedTrip), id);
        if (vehicle) supabaseSync('vehicles', 'update', mapVehicleToDB(vehicle), trip.vehicleId || undefined);
        if (driver) supabaseSync('drivers', 'update', mapDriverToDB(driver), trip.driverId || undefined);

        return { success: true, message: 'Trip completed successfully.' };
      },

      cancelTrip: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return { success: false, message: 'Trip not found.' };

        // Rule: Cancelling a dispatched trip restores vehicle and driver to Available
        const wasDispatched = trip.status === 'Dispatched';

        set((state) => ({
          trips: state.trips.map((t) => (t.id === id ? { ...t, status: 'Cancelled', progress: 0 } : t)),
          vehicles: state.vehicles.map((v) =>
            v.id === trip.vehicleId && wasDispatched ? { ...v, status: 'Available' } : v
          ),
          drivers: state.drivers.map((d) =>
            d.id === trip.driverId && wasDispatched ? { ...d, status: 'Available' } : d
          ),
        }));

        get().logAction('Cancel Trip', `Cancelled trip-${id.split('-')[1]} (was dispatched: ${wasDispatched})`);

        // Async Supabase Sync
        const updatedTrip = get().trips.find((t) => t.id === id);
        const vehicle = get().vehicles.find((v) => v.id === trip.vehicleId);
        const driver = get().drivers.find((d) => d.id === trip.driverId);

        if (updatedTrip) supabaseSync('trips', 'update', mapTripToDB(updatedTrip), id);
        if (vehicle && wasDispatched) supabaseSync('vehicles', 'update', mapVehicleToDB(vehicle), trip.vehicleId || undefined);
        if (driver && wasDispatched) supabaseSync('drivers', 'update', mapDriverToDB(driver), trip.driverId || undefined);

        return { success: true, message: 'Trip cancelled successfully.' };
      },

      deleteTrip: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return { success: false, message: 'Trip not found.' };
        if (trip.status === 'Dispatched') {
          return { success: false, message: 'Cannot delete an active dispatched trip. Cancel it first.' };
        }

        set((state) => ({
          trips: state.trips.filter((t) => t.id !== id),
        }));
        get().logAction('Delete Trip', `Deleted trip-${id.split('-')[1]}`);
        
        // Async Supabase Sync
        supabaseSync('trips', 'delete', null, id);

        return { success: true, message: 'Trip deleted.' };
      },

      // Maintenance Logs
      addMaintenanceLog: (log) => {
        const newId = generateUUID();
        const newLog: MaintenanceLog = {
          ...log,
          id: newId,
          actualCost: log.actualCost || null,
        };

        // Rule: Creating a maintenance record automatically changes vehicle status to In Shop
        set((state) => ({
          maintenanceLogs: [...state.maintenanceLogs, newLog],
          vehicles: state.vehicles.map((v) =>
            v.id === log.vehicleId ? { ...v, status: 'In Shop' } : v
          ),
        }));

        const vehicle = get().vehicles.find((v) => v.id === log.vehicleId);
        get().logAction('Create Maintenance', `Scheduled maintenance for vehicle ${vehicle?.registrationNumber}. Vehicle status changed to In Shop.`);

        // Add auto notification for maintenance scheduling
        get().addNotification(
          'Maintenance',
          `Vehicle ${vehicle?.registrationNumber || 'Unknown'} has been sent to shop for: ${log.serviceType}.`
        );

        // Add to expenses log as operational maintenance expense
        get().addExpense({
          category: 'Maintenance',
          description: `Est. maintenance: ${log.serviceType} at ${log.workshop}`,
          amount: log.estimatedCost,
          date: log.startDate,
          vehicleId: log.vehicleId,
          department: 'Operations',
        });

        // Async Supabase Sync
        supabaseSync('maintenance_logs', 'insert', mapMaintenanceToDB(newLog), undefined, get().currentUser?.companyId);
        if (vehicle) supabaseSync('vehicles', 'update', mapVehicleToDB({ ...vehicle, status: 'In Shop' }), log.vehicleId);

        return { success: true, message: 'Maintenance record created.' };
      },

      updateMaintenanceLog: (id, update) => {
        const log = get().maintenanceLogs.find((m) => m.id === id);
        if (!log) return { success: false, message: 'Maintenance record not found.' };

        set((state) => ({
          maintenanceLogs: state.maintenanceLogs.map((m) => (m.id === id ? { ...m, ...update } : m)),
        }));

        const updatedLog = get().maintenanceLogs.find((m) => m.id === id);

        // Rule: Closing maintenance restores vehicle status to Available unless retired
        if (update.status === 'Completed' && log.status !== 'Completed') {
          const vehicle = get().vehicles.find((v) => v.id === log.vehicleId);
          if (vehicle) {
            const nextStatus = vehicle.status === 'Retired' ? 'Retired' : 'Available';
            set((state) => ({
              vehicles: state.vehicles.map((v) => (v.id === log.vehicleId ? { ...v, status: nextStatus } : v)),
            }));
            get().logAction('Complete Maintenance', `Completed maintenance for ${vehicle.registrationNumber}. Status set to ${nextStatus}.`);
            
            // Sync vehicle status update
            supabaseSync('vehicles', 'update', mapVehicleToDB({ ...vehicle, status: nextStatus }), log.vehicleId);
          }

          // If actual cost is logged, update or create expenses discrepancy
          if (updatedLog?.actualCost) {
            get().addExpense({
              category: 'Maintenance',
              description: `Actual maintenance bill: ${updatedLog.serviceType} (Final Cost)`,
              amount: updatedLog.actualCost - updatedLog.estimatedCost, // adjustment amount
              date: updatedLog.endDate || new Date().toISOString().split('T')[0],
              vehicleId: updatedLog.vehicleId,
              department: 'Operations',
            });
          }
        }

        // Async Supabase Sync
        if (updatedLog) {
          supabaseSync('maintenance_logs', 'update', mapMaintenanceToDB(updatedLog), id);
        }

        return { success: true, message: 'Maintenance record updated successfully.' };
      },

      // Fuel Logs
      addFuelLog: (log) => {
        const newId = generateUUID();
        const newLog: FuelLog = {
          ...log,
          id: newId,
        };

        // Automate odometer update: if logged fuel odometer is greater than vehicle's current odometer, update it.
        const vehicle = get().vehicles.find((v) => v.id === log.vehicleId);
        if (vehicle && log.odometer > vehicle.currentOdometer) {
          set((state) => ({
            vehicles: state.vehicles.map((v) =>
              v.id === log.vehicleId ? { ...v, currentOdometer: log.odometer } : v
            ),
          }));
          get().logAction('Odometer Autoupdate', `Updated odometer for ${vehicle.registrationNumber} to ${log.odometer} km via Fuel Log.`);
          
          // Sync vehicle odometer update
          supabaseSync('vehicles', 'update', mapVehicleToDB({ ...vehicle, currentOdometer: log.odometer }), log.vehicleId);
        }

        set((state) => ({
          fuelLogs: [...state.fuelLogs, newLog],
        }));

        // Log fuel refilling as expense automatically
        get().addExpense({
          category: 'Fuel',
          description: `Fuel refill: ${log.fuelQuantity}L at ${log.fuelStation}`,
          amount: log.fuelCost,
          date: log.date,
          vehicleId: log.vehicleId,
          department: 'Operations',
        });

        get().logAction('Log Fuel Refill', `Added fuel log of $${log.fuelCost} for vehicle ${vehicle?.registrationNumber || ''}`);

        // Async Supabase Sync
        supabaseSync('fuel_logs', 'insert', mapFuelToDB(newLog), undefined, get().currentUser?.companyId);

        return { success: true, message: 'Fuel log and associated expense recorded successfully.' };
      },

      // Expenses
      addExpense: (expense) => {
        const newId = generateUUID();
        const newExpense: Expense = {
          ...expense,
          id: newId,
        };
        set((state) => ({
          expenses: [...state.expenses, newExpense],
        }));

        // Async Supabase Sync
        supabaseSync('expenses', 'insert', mapExpenseToDB(newExpense), undefined, get().currentUser?.companyId);

        return { success: true, message: 'Expense recorded.' };
      },

      // Documents
      addDocument: (doc) => {
        const newId = generateUUID();
        const newDoc: Document = {
          ...doc,
          id: newId,
        };
        set((state) => ({
          documents: [...state.documents, newDoc],
        }));

        // Check if expiry date requires adding a notification alert
        if (doc.expiryDate) {
          const today = new Date();
          const expiry = new Date(doc.expiryDate);
          const diffTime = expiry.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            get().addNotification(
              doc.type === 'License' ? 'License Expiry' : 'Insurance Expiry',
              `EXPIRED: Document "${doc.name}" has expired on ${doc.expiryDate}.`
            );
          } else if (diffDays <= 30) {
            get().addNotification(
              doc.type === 'License' ? 'License Expiry' : 'Insurance Expiry',
              `EXPIRING SOON: Document "${doc.name}" will expire in ${diffDays} days on ${doc.expiryDate}.`
            );
          }
        }

        get().logAction('Add Document', `Uploaded document "${doc.name}"`);

        // Async Supabase Sync
        supabaseSync('documents', 'insert', mapDocumentToDB(newDoc), undefined, get().currentUser?.companyId);

        return { success: true, message: 'Document added.' };
      },

      deleteDocument: (id) => {
        const doc = get().documents.find((d) => d.id === id);
        if (!doc) return { success: false, message: 'Document not found.' };

        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));
        get().logAction('Delete Document', `Deleted document "${doc.name}"`);

        // Async Supabase Sync
        supabaseSync('documents', 'delete', null, id);

        return { success: true, message: 'Document deleted successfully.' };
      },

      // Notifications
      addNotification: (type, message) => {
        const newId = generateUUID();
        const newNotif: Notification = {
          id: newId,
          type,
          message,
          read: false,
          date: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));

        // Async Supabase Sync
        supabaseSync('notifications', 'insert', mapNotificationToDB(newNotif), undefined, get().currentUser?.companyId);
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));

        // Async Supabase Sync
        const notif = get().notifications.find((n) => n.id === id);
        if (notif) {
          supabaseSync('notifications', 'update', mapNotificationToDB(notif), id);
        }
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));

        // Async Supabase Sync
        get().notifications.forEach((n) => {
          supabaseSync('notifications', 'update', mapNotificationToDB(n), n.id);
        });
      },

      logAction: (action, entity) => {
        const newId = generateUUID();
        const newLog: AuditLog = {
          id: newId,
          userEmail: get().currentUser?.email || 'system@transitops.com',
          action,
          entity,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          auditLogs: [newLog, ...state.auditLogs],
        }));

        // Async Supabase Sync
        supabaseSync('audit_logs', 'insert', mapAuditToDB(newLog), undefined, get().currentUser?.companyId);
      },

      resetStore: () => {
        set({
          vehicles: seedVehicles,
          drivers: seedDrivers,
          trips: seedTrips,
          maintenanceLogs: seedMaintenanceLogs,
          fuelLogs: seedFuelLogs,
          expenses: seedExpenses,
          documents: seedDocuments,
          notifications: seedNotifications,
          auditLogs: [
            {
              id: `aud-${Date.now()}`,
              userEmail: 'system@transitops.com',
              action: 'Database Restore',
              entity: 'System Reset',
              timestamp: new Date().toISOString(),
            },
          ],
        });
      },

      syncWithSupabase: async () => {
        if (!isSupabaseConfigured || !supabase) return;
        try {
          const [
            { data: dbUsers },
            { data: dbVehicles },
            { data: dbDrivers },
            { data: dbTrips },
            { data: dbMaint },
            { data: dbFuel },
            { data: dbExpenses },
            { data: dbDocs },
            { data: dbNotifs },
            { data: dbAudits },
            { data: dbHistory },
            { data: dbCompanies }
          ] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('vehicles').select('*'),
            supabase.from('drivers').select('*'),
            supabase.from('trips').select('*'),
            supabase.from('maintenance_logs').select('*'),
            supabase.from('fuel_logs').select('*'),
            supabase.from('expenses').select('*'),
            supabase.from('documents').select('*'),
            supabase.from('notifications').select('*'),
            supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }),
            supabase.from('user_approval_history').select('*').order('timestamp', { ascending: false }),
            supabase.from('companies').select('*')
          ]);

          const fetchedUsers = dbUsers ? dbUsers.map(mapUserFromDB) : [];
          const fetchedCompanies = dbCompanies ? dbCompanies.map(mapCompanyFromDB) : [];
          const currentLoggedUser = get().currentUser;
          let updatedCurrentUser = currentLoggedUser;
          let updatedCurrentCompany: Company | null = get().currentCompany;
          
          if (currentLoggedUser) {
            const matched = fetchedUsers.find(
              (u) => u.email.toLowerCase() === currentLoggedUser.email.toLowerCase()
            );
            if (matched) {
              updatedCurrentUser = matched;
              // Set currentCompany based on the user's company_id
              if (matched.companyId) {
                updatedCurrentCompany = fetchedCompanies.find(c => c.id === matched.companyId) || null;
              }
            }
          }

          set({
            users: fetchedUsers,
            currentUser: updatedCurrentUser,
            companies: fetchedCompanies,
            currentCompany: updatedCurrentCompany,
            vehicles: dbVehicles ? dbVehicles.map(mapVehicleFromDB) : [],
            drivers: dbDrivers ? dbDrivers.map(mapDriverFromDB) : [],
            trips: dbTrips ? dbTrips.map(mapTripFromDB) : [],
            maintenanceLogs: dbMaint ? dbMaint.map(mapMaintenanceFromDB) : [],
            fuelLogs: dbFuel ? dbFuel.map(mapFuelFromDB) : [],
            expenses: dbExpenses ? dbExpenses.map(mapExpenseFromDB) : [],
            documents: dbDocs ? dbDocs.map(mapDocumentFromDB) : [],
            notifications: dbNotifs ? dbNotifs.map(mapNotificationFromDB) : [],
            auditLogs: dbAudits ? dbAudits.map(mapAuditFromDB) : [],
            userApprovalHistory: dbHistory ? dbHistory.map(mapHistoryFromDB) : [],
          });

          // Setup Realtime subscription for Telemetry
          // We attach it to the window object to avoid multiple subscriptions across hot reloads
          if (typeof window !== 'undefined' && !(window as any)._telemetryChannel) {
            (window as any)._telemetryChannel = supabase.channel('public:vehicle_location_events')
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_location_events' }, payload => {
                get().processTelemetryEvent(payload.new);
              })
              .subscribe();
          }

        } catch (err) {
          console.error('Failed to sync with Supabase:', err);
        }
      },
    }),
    {
      name: 'transitops-storage-v1',
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        companies: state.companies,
        currentCompany: state.currentCompany,
        vehicles: state.vehicles,
        drivers: state.drivers,
        trips: state.trips,
        maintenanceLogs: state.maintenanceLogs,
        fuelLogs: state.fuelLogs,
        expenses: state.expenses,
        documents: state.documents,
        notifications: state.notifications,
        auditLogs: state.auditLogs,
        userApprovalHistory: state.userApprovalHistory,
        rememberMe: state.rememberMe,
      }),
    }
  )
);
