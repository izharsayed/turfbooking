import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Compass, Sliders } from 'lucide-react';

// Haversine formula to compute distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Custom Leaflet Icons using SVGs and Tailwind classes
const userIcon = L.divIcon({
  html: `<div class="relative w-8 h-8 flex items-center justify-center">
    <div class="absolute w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500 animate-ping"></div>
    <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg"></div>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const turfIcon = L.divIcon({
  html: `<div class="relative w-10 h-10 flex items-center justify-center">
    <div class="absolute w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-pulse"></div>
    <div class="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg animate-bounce">
      <span class="text-xs">⚽</span>
    </div>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Helper component to center/re-center map dynamically
function MapRecenter({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
}

interface Turf {
  id: string;
  name: string;
  description: string;
  city: string;
  area: string;
  price: number;
  sport: string;
  rating: number;
  image: string;
  amenities: string[];
  lat: number;
  lng: number;
}

interface NearbyMapProps {
  turfs: Turf[];
  isDarkMode: boolean;
  onSelectTurf: (turf: Turf) => void;
}

export default function NearbyMap({ turfs, isDarkMode, onSelectTurf }: NearbyMapProps) {
  // Default coordinates (Ahmednagar, Maharashtra)
  const defaultCenter: [number, number] = [19.0948, 74.7480];

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [permissionState, setPermissionState] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [radius, setRadius] = useState<number>(15); // Radius in km

  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionState('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords([position.coords.latitude, position.coords.longitude]);
        setPermissionState('granted');
      },
      (error) => {
        console.warn('Geolocation permission error:', error);
        setPermissionState('denied');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Check if user is too far from any active turf (e.g., closest turf > 120km away)
  const isTooFar = userCoords
    ? turfs.every(t => getDistance(userCoords[0], userCoords[1], t.lat, t.lng) > 120)
    : false;

  // If too far or no location, default to Mumbai center coordinates to show pins
  const effectiveUserCoords = (userCoords && !isTooFar) ? userCoords : null;
  const centerCoords = effectiveUserCoords || defaultCenter;

  // Filter & calculate distance for each turf
  const turfsWithDistance = turfs
    .map((turf) => {
      const distance = effectiveUserCoords
        ? getDistance(effectiveUserCoords[0], effectiveUserCoords[1], turf.lat, turf.lng)
        : getDistance(defaultCenter[0], defaultCenter[1], turf.lat, turf.lng);
      return { ...turf, distance };
    })
    .filter((t) => t.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  const requestLocationAgain = () => {
    setPermissionState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords([position.coords.latitude, position.coords.longitude]);
        setPermissionState('granted');
      },
      () => {
        setPermissionState('denied');
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Geofence Controls Banner */}
      <div className={`p-6 border rounded-3xl backdrop-blur-xl flex flex-col md:flex-row gap-6 justify-between items-center shadow-xl transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0f172a]/40 border-slate-800' : 'bg-white/80 border-slate-200/50'
      }`}>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-emerald-450 animate-spin-slow" />
            <h2 className="text-xl font-bold">Smart Geofencing Finder</h2>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isTooFar
              ? '📍 You are too far from our active locations (Mumbai/Delhi). Showing Mumbai venues in Demo Mode.'
              : permissionState === 'granted'
              ? 'Detecting turfs near your current location within your set perimeter.'
              : 'Permission denied. Showing nearby turfs using city center defaults.'}
          </p>
        </div>

        {/* Radius Filter Slider */}
        <div className="flex flex-col gap-2 w-full md:w-64">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1"><Sliders className="h-3.5 w-3.5 text-emerald-400" /> Range Radius</span>
            <span className="text-emerald-400">{radius} km</span>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      {permissionState === 'denied' && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center text-rose-400 text-sm">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 shrink-0" />
            <span>Location services disabled. Allow location permission for accurate distance geofencing.</span>
          </div>
          <button
            onClick={requestLocationAgain}
            className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-colors shrink-0"
          >
            Allow Permission
          </button>
        </div>
      )}

      {/* Main Map & List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar list */}
        <div className={`lg:col-span-1 rounded-3xl p-6 border flex flex-col justify-between max-h-[600px] overflow-y-auto backdrop-blur-md ${
          isDarkMode ? 'bg-[#0f172a]/20 border-slate-800' : 'bg-white/80 border-slate-200/50'
        }`}>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              Found {turfsWithDistance.length} Match(es)
            </h3>

            <div className="space-y-4">
              {turfsWithDistance.map((turf) => (
                <div
                  key={turf.id}
                  className={`p-4 border rounded-2xl transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-slate-900/40 border-slate-850 hover:border-emerald-500/30'
                      : 'bg-slate-50/70 border-slate-200/40 hover:border-emerald-500/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-base">{turf.name}</h4>
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">
                      ★ {turf.rating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{turf.area}, {turf.city}</p>
                  
                  <div className={`flex items-center justify-between text-xs pt-3 border-t ${isDarkMode ? 'border-slate-800/40' : 'border-slate-200'}`}>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-650'}`}>
                      {turf.distance.toFixed(1)} km away
                    </span>
                    <button
                      onClick={() => onSelectTurf(turf)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-[10px] uppercase tracking-wider transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}

              {turfsWithDistance.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-sm text-slate-500">No arenas found within {radius}km range.</p>
                  <p className="text-xs text-slate-500 mt-2">Adjust radius range slider above.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leaflet Map Card */}
        <div className={`lg:col-span-2 h-[600px] rounded-3xl overflow-hidden border shadow-xl z-0 backdrop-blur-md ${
          isDarkMode ? 'border-slate-800 bg-[#0f172a]/20' : 'border-slate-200 bg-white/80'
        }`}>
          {permissionState === 'loading' ? (
            <div className="w-full h-full flex items-center justify-center flex-col gap-3">
              <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
              <span className="text-xs text-slate-400 font-bold">Acquiring user coordinate location...</span>
            </div>
          ) : (
            <MapContainer
              center={centerCoords}
              zoom={12}
              scrollWheelZoom={true}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Map Layer theme toggle config */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={
                  isDarkMode
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                }
              />

              <MapRecenter coords={centerCoords} />

              {/* Draw radius circular geofence */}
              <Circle
                center={centerCoords}
                radius={radius * 1000}
                pathOptions={{
                  color: '#10b981',
                  fillColor: '#10b981',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '5, 8'
                }}
              />

              {/* User location pin marker */}
              {effectiveUserCoords && (
                <Marker position={effectiveUserCoords} icon={userIcon}>
                  <Popup>
                    <div className="text-slate-900 text-xs font-bold text-center">
                      📍 You are here
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Turf markers pin points */}
              {turfsWithDistance.map((turf) => (
                <Marker
                  key={turf.id}
                  position={[turf.lat, turf.lng]}
                  icon={turfIcon}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 w-52 text-slate-900">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">
                          {turf.sport}
                        </span>
                        <span className="text-[10px] font-bold flex items-center gap-0.5 text-amber-500">
                          ★ {turf.rating}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{turf.name}</h4>
                      <p className="text-[11px] text-slate-500 mb-2">{turf.area}</p>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-800">
                          {turf.distance.toFixed(1)} km
                        </span>
                        <button
                          onClick={() => onSelectTurf(turf)}
                          className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-450 text-white font-extrabold text-[9px] uppercase tracking-wider"
                        >
                          Book Slot
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}
