-- TransitOps - Database Schema Alterations for Admin Approval Workflow

-- 1. Modify Role check constraint to allow new roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN (
    'Administrator', 
    'Fleet Manager', 
    'Dispatcher', 
    'Safety Officer', 
    'Financial Analyst',
    'Driver',
    'Maintenance Manager',
    'Viewer',
    'Security'
));

-- 2. Add approval fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'Pending Approval' CHECK (approval_status IN (
    'Pending Approval',
    'Approved',
    'Rejected',
    'Suspended',
    'Inactive',
    'Information Required'
));

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS designation TEXT;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS registration_ip TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS device_information TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS browser_information TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS requested_fields_to_edit TEXT[];

-- Set existing pre-seeded users to 'Approved'
UPDATE public.users SET approval_status = 'Approved' WHERE approval_status IS NULL;

-- 3. Create UserApprovalHistory Table
CREATE TABLE IF NOT EXISTS public.user_approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    administrator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('Approve', 'Reject', 'Suspend', 'Reactivate', 'Request Info')),
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address TEXT
);

-- Enable RLS on new table
ALTER TABLE public.user_approval_history ENABLE ROW LEVEL SECURITY;

-- Select/Read Policies for history
CREATE POLICY "Allow read user approval history for authenticated users" ON public.user_approval_history FOR SELECT USING (true);
CREATE POLICY "Allow write user approval history for authenticated users" ON public.user_approval_history FOR ALL USING (true);
-- TransitOps - Multi-Tenancy Schema Migration (RLS-based Company Isolation)
-- Run this AFTER schema.sql and approval_schema.sql

-- ============================================================================
-- 1. COMPANIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending_approval', 'active', 'suspended')),
    industry TEXT,
    company_size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE,
    created_by_admin_user_id UUID
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

-- ============================================================================
-- 2. ADD company_id TO ALL TENANT-SCOPED TABLES
-- ============================================================================

-- 2a. Users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_company ON public.users(company_id);

-- 2b. Vehicles
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_vehicles_company ON public.vehicles(company_id);

-- 2c. Drivers
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_drivers_company ON public.drivers(company_id);

-- 2d. Trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_trips_company ON public.trips(company_id);

-- 2e. Maintenance Logs
ALTER TABLE public.maintenance_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_maintenance_company ON public.maintenance_logs(company_id);

-- 2f. Fuel Logs
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fuel_company ON public.fuel_logs(company_id);

-- 2g. Expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_expenses_company ON public.expenses(company_id);

-- 2h. Documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_documents_company ON public.documents(company_id);

-- 2i. Notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_company ON public.notifications(company_id);

-- 2j. Audit Logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_audit_company ON public.audit_logs(company_id);

-- 2k. Vehicle Location Events
ALTER TABLE public.vehicle_location_events ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_location_company ON public.vehicle_location_events(company_id);

-- 2l. User Approval History
ALTER TABLE public.user_approval_history ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_approval_history_company ON public.user_approval_history(company_id);

-- ============================================================================
-- 3. SEED A DEFAULT COMPANY FOR EXISTING DATA
-- ============================================================================
INSERT INTO public.companies (id, name, status, industry, company_size, activated_at)
VALUES (
    '00000000-0000-4000-a000-000000000001',
    'Default Operations',
    'active',
    'Logistics & Transport',
    '10-50',
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Assign existing records to the default company
UPDATE public.users SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.vehicles SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.drivers SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.trips SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.maintenance_logs SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.fuel_logs SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.expenses SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.documents SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.notifications SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.audit_logs SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.vehicle_location_events SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;
UPDATE public.user_approval_history SET company_id = '00000000-0000-4000-a000-000000000001' WHERE company_id IS NULL;

-- ============================================================================
-- 4. HELPER FUNCTION: current_company_id()
-- Returns the company_id of the currently authenticated user.
-- Used by all RLS policies to enforce tenant isolation.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

-- ============================================================================
-- 5. DROP EXISTING PERMISSIVE RLS POLICIES
-- The old "Allow read/write for authenticated users" policies are too broad
-- for multi-tenancy. We replace them with company-scoped policies.
-- ============================================================================

-- Users
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.users;

-- Vehicles
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.vehicles;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.vehicles;

-- Drivers
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.drivers;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.drivers;

-- Trips
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.trips;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.trips;

-- Maintenance Logs
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.maintenance_logs;

-- Fuel Logs
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.fuel_logs;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.fuel_logs;

-- Expenses
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.expenses;

-- Documents
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.documents;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.documents;

-- Notifications
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.notifications;

-- Audit Logs
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.audit_logs;

-- Vehicle Location Events
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.vehicle_location_events;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.vehicle_location_events;

-- User Approval History
DROP POLICY IF EXISTS "Allow read user approval history for authenticated users" ON public.user_approval_history;
DROP POLICY IF EXISTS "Allow write user approval history for authenticated users" ON public.user_approval_history;

-- ============================================================================
-- 6. NEW RLS POLICIES — COMPANY-SCOPED ISOLATION
-- ============================================================================

-- Enable RLS on companies table itself
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Companies: users can see their own company only
CREATE POLICY "company_isolation_select" ON public.companies
    FOR SELECT USING (id = public.current_company_id());
CREATE POLICY "company_isolation_insert" ON public.companies
    FOR INSERT WITH CHECK (true); -- signup needs to insert before user exists
CREATE POLICY "company_isolation_update" ON public.companies
    FOR UPDATE USING (id = public.current_company_id());

-- ---- Users ----
CREATE POLICY "tenant_users_select" ON public.users
    FOR SELECT USING (company_id = public.current_company_id() OR company_id IS NULL);
CREATE POLICY "tenant_users_insert" ON public.users
    FOR INSERT WITH CHECK (true); -- signup flow needs this
CREATE POLICY "tenant_users_update" ON public.users
    FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY "tenant_users_delete" ON public.users
    FOR DELETE USING (company_id = public.current_company_id());

-- ---- Vehicles ----
CREATE POLICY "tenant_vehicles_select" ON public.vehicles
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_vehicles_insert" ON public.vehicles
    FOR INSERT WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "tenant_vehicles_update" ON public.vehicles
    FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY "tenant_vehicles_delete" ON public.vehicles
    FOR DELETE USING (company_id = public.current_company_id());

-- ---- Drivers ----
CREATE POLICY "tenant_drivers_select" ON public.drivers
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_drivers_insert" ON public.drivers
    FOR INSERT WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "tenant_drivers_update" ON public.drivers
    FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY "tenant_drivers_delete" ON public.drivers
    FOR DELETE USING (company_id = public.current_company_id());

-- ---- Trips ----
CREATE POLICY "tenant_trips_select" ON public.trips
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_trips_insert" ON public.trips
    FOR INSERT WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "tenant_trips_update" ON public.trips
    FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY "tenant_trips_delete" ON public.trips
    FOR DELETE USING (company_id = public.current_company_id());

-- ---- Maintenance Logs ----
CREATE POLICY "tenant_maintenance_select" ON public.maintenance_logs
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_maintenance_insert" ON public.maintenance_logs
    FOR INSERT WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "tenant_maintenance_update" ON public.maintenance_logs
    FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY "tenant_maintenance_delete" ON public.maintenance_logs
    FOR DELETE USING (company_id = public.current_company_id());

-- ---- Fuel Logs ----
CREATE POLICY "tenant_fuel_select" ON public.fuel_logs
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_fuel_insert" ON public.fuel_logs
    FOR INSERT WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "tenant_fuel_update" ON public.fuel_logs
    FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY "tenant_fuel_delete" ON public.fuel_logs
    FOR DELETE USING (company_id = public.current_company_id());

-- ---- Expenses ----
CREATE POLICY "tenant_expenses_select" ON public.expenses
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_expenses_insert" ON public.expenses
    FOR INSERT WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "tenant_expenses_update" ON public.expenses
    FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY "tenant_expenses_delete" ON public.expenses
    FOR DELETE USING (company_id = public.current_company_id());

-- ---- Documents ----
CREATE POLICY "tenant_documents_select" ON public.documents
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_documents_insert" ON public.documents
    FOR INSERT WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "tenant_documents_update" ON public.documents
    FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY "tenant_documents_delete" ON public.documents
    FOR DELETE USING (company_id = public.current_company_id());

-- ---- Notifications ----
CREATE POLICY "tenant_notifications_select" ON public.notifications
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_notifications_insert" ON public.notifications
    FOR INSERT WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "tenant_notifications_update" ON public.notifications
    FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY "tenant_notifications_delete" ON public.notifications
    FOR DELETE USING (company_id = public.current_company_id());

-- ---- Audit Logs ----
CREATE POLICY "tenant_audit_select" ON public.audit_logs
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_audit_insert" ON public.audit_logs
    FOR INSERT WITH CHECK (company_id = public.current_company_id());

-- ---- Vehicle Location Events ----
CREATE POLICY "tenant_location_select" ON public.vehicle_location_events
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_location_insert" ON public.vehicle_location_events
    FOR INSERT WITH CHECK (company_id = public.current_company_id());

-- ---- User Approval History ----
CREATE POLICY "tenant_approval_history_select" ON public.user_approval_history
    FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "tenant_approval_history_insert" ON public.user_approval_history
    FOR INSERT WITH CHECK (company_id = public.current_company_id());
-- TransitOps - Telemetry Schema Migration (Battery, Fuel, Accuracy)
-- Run this AFTER multitenancy_schema.sql

-- ============================================================================
-- 1. ADD NEW COLUMNS TO vehicle_location_events
-- ============================================================================

ALTER TABLE public.vehicle_location_events 
    ADD COLUMN IF NOT EXISTS fuel_level NUMERIC,
    ADD COLUMN IF NOT EXISTS battery_level NUMERIC,
    ADD COLUMN IF NOT EXISTS gps_accuracy NUMERIC;
