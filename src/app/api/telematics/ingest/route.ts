import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (using service role key for ingestion if available, or anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Basic Validation
    if (!data.vehicle_id || data.latitude === undefined || data.longitude === undefined) {
      return NextResponse.json({ error: 'Missing required location fields.' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseKey) {
      // Return success if no DB is configured (mock environment)
      return NextResponse.json({ 
        message: 'Telemetry received (simulated - no DB keys configured).',
        received: data 
      }, { status: 200 });
    }

    const { error } = await supabase
      .from('vehicle_location_events')
      .insert({
        vehicle_id: data.vehicle_id,
        driver_id: data.driver_id || null,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed || 0,
        heading: data.heading || 0,
        ignition_status: data.ignition_status ?? true,
        source: data.source || 'telematics',
        recorded_at: data.timestamp || new Date().toISOString(),
      });

    if (error) {
      console.error('Telematics Insert Error:', error);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Telemetry logged successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Telematics API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
