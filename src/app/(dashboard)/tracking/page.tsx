"use client";

import { useEffect, useState, useCallback } from 'react';
import { useTransitStore } from '@/lib/store/transitStore';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Navigation, Truck, User, Search, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '16px',
};

// Default center: Central US
const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795
};

export default function TrackingPage() {
  const { vehicles, drivers, updateVehicleLocation } = useTransitStore();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // MOCK: Require a Google Maps API Key from env, otherwise fail gracefully with a message
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Simulated GPS Movement Effect (To demonstrate real-time capabilities)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      vehicles.forEach(vehicle => {
        if (vehicle.status === 'On Trip' && vehicle.gpsLocation) {
          // Nudge coordinate slightly
          const latNudge = (Math.random() - 0.5) * 0.005;
          const lngNudge = (Math.random() - 0.5) * 0.005;
          
          updateVehicleLocation(
            vehicle.id, 
            vehicle.gpsLocation.lat + latNudge,
            vehicle.gpsLocation.lng + lngNudge,
            Math.floor(Math.random() * 360), // heading
            Math.floor(Math.random() * 40) + 40 // speed 40-80 kmh
          );
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulating, vehicles, updateVehicleLocation]);

  const activeVehiclesCount = vehicles.filter(v => v.status === 'On Trip').length;

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold">Map Initialization Failed</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Unable to load Google Maps. Please ensure <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> is correctly set in your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#eaebf0] pb-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800 font-sans">Fleet Tracking Center</h2>
          <p className="text-xs text-slate-400">Real-time GPS telemetry and asset monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isSimulating 
                ? 'bg-blue-50 text-blue-600 border-blue-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RefreshCw size={13} className={isSimulating ? 'animate-spin' : ''} />
            {isSimulating ? 'Simulating Movement...' : 'Start Simulation'}
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-green-100">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live Telematics
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Sidebar: Vehicle List */}
        <div className="w-80 flex flex-col bg-white border border-[#eaebf0] rounded-2xl shadow-sm shrink-0 overflow-hidden">
          <div className="p-4 border-b border-[#eaebf0] bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search fleet (e.g. TX-882)..." 
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active on Route ({activeVehiclesCount})
            </div>
            
            {vehicles.filter(v => v.gpsLocation).map(vehicle => {
              const driver = drivers.find(d => d.assignedVehicleId === vehicle.id);
              const isActive = vehicle.status === 'On Trip';
              
              return (
                <div 
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedVehicle === vehicle.id 
                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                      : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800">{vehicle.registrationNumber}</span>
                    {isActive ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded text-green-700 bg-green-100 font-bold uppercase tracking-wider">Moving</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded text-slate-500 bg-slate-100 font-bold uppercase tracking-wider">Stationary</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Truck size={10} /> {vehicle.name}</span>
                  </div>
                  {driver && (
                    <div className="mt-2 pt-2 border-t border-slate-100/50 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-slate-600"><User size={10} /> {driver.name}</span>
                      <span className="text-blue-600 font-medium">Score: {driver.safetyScore}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Map */}
        <div className="flex-1 bg-slate-100 rounded-2xl border border-[#eaebf0] overflow-hidden relative shadow-sm">
          {!GOOGLE_MAPS_API_KEY && (
            <div className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm text-center space-y-4">
                <MapPin size={32} className="mx-auto text-blue-500" />
                <h3 className="text-sm font-bold text-slate-800">API Key Required</h3>
                <p className="text-xs text-slate-500">To render the live tracking map, please set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment variables.</p>
              </div>
            </div>
          )}

          {isLoaded && GOOGLE_MAPS_API_KEY ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={
                selectedVehicle 
                  ? vehicles.find(v => v.id === selectedVehicle)?.gpsLocation || defaultCenter
                  : defaultCenter
              }
              zoom={selectedVehicle ? 12 : 4}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: true,
                streetViewControl: false,
                styles: [
                  {
                    "featureType": "all",
                    "elementType": "labels.text.fill",
                    "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
                  },
                  {
                    "featureType": "administrative.country",
                    "elementType": "geometry",
                    "stylers": [{ "visibility": "on" }]
                  },
                  {
                    "featureType": "administrative.country",
                    "elementType": "geometry.stroke",
                    "stylers": [{ "color": "#a0aab4" }]
                  },
                  {
                    "featureType": "administrative.province",
                    "elementType": "geometry.stroke",
                    "stylers": [{ "color": "#a0aab4" }]
                  },
                  {
                    "featureType": "water",
                    "elementType": "geometry.fill",
                    "stylers": [{ "color": "#e0e6ed" }]
                  }
                ]
              }}
            >
              {/* Render Vehicle Markers */}
              {vehicles.filter(v => v.gpsLocation).map((vehicle) => {
                const isSelected = selectedVehicle === vehicle.id;
                
                return (
                  <Marker
                    key={vehicle.id}
                    position={vehicle.gpsLocation!}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="20" cy="20" r="16" fill="${vehicle.status === 'On Trip' ? '#2563EB' : '#94A3B8'}" opacity="0.2"/>
                          <circle cx="20" cy="20" r="8" fill="${vehicle.status === 'On Trip' ? '#2563EB' : '#94A3B8'}" stroke="white" stroke-width="2"/>
                        </svg>
                      `),
                      anchor: new window.google.maps.Point(20, 20),
                    }}
                  >
                    {isSelected && (
                      <InfoWindow
                        position={vehicle.gpsLocation!}
                        onCloseClick={() => setSelectedVehicle(null)}
                      >
                        <div className="p-1 min-w-[150px]">
                          <h4 className="text-xs font-bold text-slate-800 mb-1">{vehicle.registrationNumber}</h4>
                          <p className="text-[10px] text-slate-500 mb-2">{vehicle.name}</p>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="bg-slate-50 p-1.5 rounded">
                              <span className="block text-slate-400">Speed</span>
                              <span className="font-semibold text-slate-700">{vehicle.status === 'On Trip' ? '65 km/h' : '0 km/h'}</span>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded">
                              <span className="block text-slate-400">Status</span>
                              <span className={`font-semibold ${vehicle.status === 'On Trip' ? 'text-green-600' : 'text-slate-600'}`}>{vehicle.status}</span>
                            </div>
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                );
              })}
            </GoogleMap>
          ) : null}
        </div>
      </div>
    </div>
  );
}
