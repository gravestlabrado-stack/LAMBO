import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Tactical Pin Icon using Material Symbols & SVG
const createPinIcon = () =>
  L.divIcon({
    className: 'tactical-specimen-pin',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        background: #8B9B4C;
        border: 2.5px solid #F0F3E8;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,0.6);
        cursor: grab;
      ">
        <span style="
          transform: rotate(45deg);
          color: #1D230E;
          font-weight: bold;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">🌱</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });

// Map event listener for clicks
function MapClickHandler({ onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Controller to smoothly pan/zoom when coordinates update from GPS button
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, Math.max(map.getZoom(), 16), { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

export default function LocationPickerMap({
  lat = 14.1675,
  lng = 121.2434,
  onLocationChange,
}) {
  const [position, setPosition] = useState([lat, lng]);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [accuracy, setAccuracy] = useState(null);

  const pinIcon = useMemo(() => createPinIcon(), []);

  useEffect(() => {
    if (lat && lng && (lat !== position[0] || lng !== position[1])) {
      setPosition([lat, lng]);
    }
  }, [lat, lng]);

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    if (marker) {
      const { lat: newLat, lng: newLng } = marker.getLatLng();
      setPosition([newLat, newLng]);
      onLocationChange?.({ lat: Number(newLat.toFixed(6)), lng: Number(newLng.toFixed(6)) });
    }
  };

  const handleMapClick = (newLat, newLng) => {
    setPosition([newLat, newLng]);
    onLocationChange?.({ lat: Number(newLat.toFixed(6)), lng: Number(newLng.toFixed(6)) });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        const formattedLat = Number(latitude.toFixed(6));
        const formattedLng = Number(longitude.toFixed(6));
        setPosition([formattedLat, formattedLng]);
        setAccuracy(Math.round(acc));
        setIsLocating(false);
        onLocationChange?.({ lat: formattedLat, lng: formattedLng });
      },
      (err) => {
        setIsLocating(false);
        setGpsError('Could not fetch GPS. Please tap on map to place pin.');
        console.warn('[GPS] Geolocation error:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-2">
      {/* Map Header & GPS Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-[16px] text-[#A4B566]">pin_drop</span>
          <span className="font-mono text-xs text-[#D8DFC8] truncate">
            {position[0].toFixed(5)}° N, {position[1].toFixed(5)}° E
          </span>
          {accuracy && (
            <span className="font-mono text-[10px] text-[#8B9B4C] bg-[#1D230E] px-1.5 py-0.5 rounded border border-[#525E31]">
              ±{accuracy}m
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="h-8 px-3 rounded-lg bg-[#30371A] hover:bg-[#3D4721] active:scale-95 border border-[#525E31] text-[#A4B566] text-xs font-mono font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
          title="Use Device GPS"
        >
          {isLocating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[#A4B566] border-t-transparent rounded-full animate-spin" />
              <span>Locating...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[15px]">my_location</span>
              <span>Use My GPS</span>
            </>
          )}
        </button>
      </div>

      {gpsError && (
        <p className="text-[11px] font-mono text-[#E57373] flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">warning</span>
          <span>{gpsError}</span>
        </p>
      )}

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-52 sm:h-64 rounded-xl overflow-hidden border border-[#525E31] bg-[#1D230E] shadow-inner z-0">
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={false}
          className="w-full h-full"
          style={{ background: '#1D230E' }}
        >
          {/* Map Tile Layer: OpenStreetMap by default (no watermark), or CARTO if API key is provided */}
          <TileLayer
            attribution={
              import.meta.env.VITE_CARTO_API_KEY
                ? '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
            url={
              import.meta.env.VITE_CARTO_API_KEY
                ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_CARTO_API_KEY}`
                : (import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
            }
          />

          <ChangeView center={position} />
          <MapClickHandler onPositionChange={handleMapClick} />

          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
            icon={pinIcon}
          />
        </MapContainer>

        {/* Map Overlay Instruction Banner */}
        <div className="absolute bottom-2 left-2 right-2 pointer-events-none z-[1000]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1D230E]/90 backdrop-blur-md border border-[#525E31] text-[11px] font-mono text-[#D8DFC8] shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A4B566] animate-pulse" />
            <span>Tap map or drag pin to adjust plant coordinates</span>
          </div>
        </div>
      </div>
    </div>
  );
}
