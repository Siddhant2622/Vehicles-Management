-- TransitOps - Database Schema for PostgreSQL / Supabase
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Roles
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Administrator', 'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g. Heavy Duty, Medium Duty, Light Duty, Van, Reefer
    max_load NUMERIC NOT NULL, -- in kg
    current_odometer NUMERIC NOT NULL DEFAULT 0, -- in km
    purchase_date DATE NOT NULL,
    acquisition_cost NUMERIC NOT NULL,
    insurance_expiry DATE NOT NULL,
    pollution_cert DATE NOT NULL,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON public.vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);

-- 3. Drivers
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    photo TEXT,
    license_number TEXT UNIQUE NOT NULL,
    license_category TEXT NOT NULL,
    license_expiry DATE NOT NULL,
    contact_number TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    safety_score NUMERIC NOT NULL DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
    assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'Off Duty', 'Suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drivers_email ON public.drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);

-- 4. Trips
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    cargo_weight NUMERIC NOT NULL,
    planned_distance NUMERIC NOT NULL, -- in km
    estimated_duration NUMERIC NOT NULL, -- in hours
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
    progress NUMERIC NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips(driver_id);

-- 5. Maintenance Logs
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL, -- e.g. Engine Oil, Brake Inspection, Tire Rotation, Engine Repair
    description TEXT,
    mechanic TEXT NOT NULL,
    workshop TEXT NOT NULL,
    estimated_cost NUMERIC NOT NULL,
    actual_cost NUMERIC,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.maintenance_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_logs(status);

-- 6. Fuel Logs
CREATE TABLE IF NOT EXISTS public.fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    fuel_quantity NUMERIC NOT NULL, -- in liters
    fuel_cost NUMERIC NOT NULL,
    fuel_station TEXT NOT NULL,
    date DATE NOT NULL,
    odometer NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON public.fuel_logs(vehicle_id);

-- 7. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('Fuel', 'Maintenance', 'Insurance', 'Toll', 'Parking', 'Repairs', 'Taxes', 'Other')),
    description TEXT,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    department TEXT NOT NULL, -- e.g., Operations, Logistics, HR, Finance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON public.expenses(vehicle_id);

-- 8. Documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('Vehicle', 'Driver', 'General')),
    entity_id UUID NOT NULL, -- Reference to vehicle_id or driver_id
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    expiry_date DATE,
    type TEXT NOT NULL, -- e.g., Insurance, Pollution, License, Registration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- e.g., License Expiry, Insurance Expiry, Maintenance, Breakdown, Delay
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Vehicle Location Events (Telematics & GPS)
CREATE TABLE IF NOT EXISTS public.vehicle_location_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    speed NUMERIC, -- in km/h
    heading NUMERIC, -- in degrees
    ignition_status BOOLEAN,
    source TEXT NOT NULL CHECK (source IN ('telematics', 'mobile_app')),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_location_vehicle_time ON public.vehicle_location_events(vehicle_id, recorded_at DESC);

-- Row Level Security (RLS) Configuration
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_location_events ENABLE ROW LEVEL SECURITY;

-- Select/Read Policies (Access granted to authenticated users)
CREATE POLICY "Allow read for authenticated users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.maintenance_logs FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.fuel_logs FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.vehicle_location_events FOR SELECT USING (true);

-- Insert/Update/Delete Policies (Role-based rules implemented inside backend app router, 
-- but here we configure standard authenticated write rights for database connection)
CREATE POLICY "Allow write for authenticated users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.drivers FOR ALL USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.trips FOR ALL USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.maintenance_logs FOR ALL USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.fuel_logs FOR ALL USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.documents FOR ALL USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.vehicle_location_events FOR ALL USING (true);
