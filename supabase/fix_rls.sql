-- Fix for Firebase Auth + Supabase architecture
-- Since the frontend uses Firebase Auth, Supabase sees all requests as 'anon'.
-- We must allow anon access for the app to function properly.

ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_location_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_approval_history DISABLE ROW LEVEL SECURITY;
