import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import treeService from '../services/treeService';
import { useAuth } from '../hooks/useAuth';
import { CAMPUS_COORDINATES } from '../utils/constants';
import { getCurrentCoordinates } from '../utils/geolocation';

// Custom Tactical Leaflet Pin Icons with health status colors & owner indicator
const createPinIcon = (color, isOwner = false) => {
  return L.divIcon({
    className: 'custom-tree-pin',
    html: `
      <div style="
        background-color: ${color};
        width: ${isOwner ? '30px' : '26px'};
        height: ${isOwner ? '30px' : '26px'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid ${isOwner ? '#FFFFFF' : '#F0F3E8'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.6)${isOwner ? ', 0 0 10px ' + color : ''};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <span style="
          transform: rotate(45deg);
          color: #1D230E;
          font-size: ${isOwner ? '16px' : '14px'};
          font-weight: bold;
          line-height: 1;
        ">🌱</span>
      </div>
    `,
    iconSize: isOwner ? [30, 30] : [26, 26],
    iconAnchor: isOwner ? [15, 30] : [13, 26],
    popupAnchor: [0, -28],
  });
};

// User GPS Beacon Pin Icon
const createUserGpsIcon = () =>
  L.divIcon({
    className: 'user-gps-beacon',
    html: `
      <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #4285F4;
          opacity: 0.4;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4285F4;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 10px #4285F4;
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });

// Map controller to fly smoothly when a target location is triggered
function MapFlyToHandler({ target, zoom = 17 }) {
  const map = useMap();
  useEffect(() => {
    if (target && target[0] && target[1]) {
      map.flyTo(target, zoom, { duration: 1.4 });
    }
  }, [target, zoom, map]);
  return null;
}

// Initial bounds fitter (only runs once on initial tree data load if no manual target requested)
function MapBoundsController({ trees, hasManualTarget }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (hasManualTarget || hasFittedRef.current) return;

    const validCoords = trees
      .map((t) => {
        const lat = t.coordinates?.lat;
        const lng = t.coordinates?.lng;
        return lat && lng && lat !== 0 && lng !== 0 ? [lat, lng] : null;
      })
      .filter(Boolean);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, duration: 1 });
      hasFittedRef.current = true;
    }
  }, [trees, hasManualTarget, map]);

  return null;
}

export default function CampusMapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allTrees, setAllTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all'); // 'all' (Global Campus) | 'my' (My Plants/Trees)
  const [selectedHealth, setSelectedHealth] = useState('All');

  // Location states
  const [flyTarget, setFlyTarget] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userAccuracy, setUserAccuracy] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [hasManualTarget, setHasManualTarget] = useState(false);

  // Default campus center coordinates: CTU Barili Campus (Cagay, Barili, Cebu)
  const defaultCenter = [CAMPUS_COORDINATES.lat, CAMPUS_COORDINATES.lng];

  // Fetch all campus trees from backend API
  const fetchMapTrees = async () => {
    try {
      setLoading(true);
      const res = await treeService.getTrees({ all: 'true' });
      setAllTrees(res.data || []);
    } catch (err) {
      console.error('[CampusMap] Error loading campus trees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapTrees();
  }, []);

  // Filter trees based on Scope (All vs My Trees)
  const scopedTrees = useMemo(() => {
    if (scope === 'my') {
      const currentUserId = user?._id || user?.id;
      return allTrees.filter((t) => {
        const ownerId = t.owner?._id || t.owner;
        return ownerId && currentUserId && String(ownerId) === String(currentUserId);
      });
    }
    return allTrees;
  }, [allTrees, scope, user]);

  // Filter trees based on Health Status
  const displayedTrees = useMemo(() => {
    return scopedTrees.filter((tree) => {
      if (selectedHealth === 'Healthy') return tree.healthStatus === 'Healthy';
      if (selectedHealth === 'Monitoring') return tree.healthStatus === 'Monitoring';
      if (selectedHealth === 'Needs Attention') return tree.healthStatus === 'Needs Attention';
      return true;
    });
  }, [scopedTrees, selectedHealth]);

  // Robust User GPS locator with auto-fallback
  const handleLocateUser = async () => {
    setIsLocating(true);
    setLocationError('');
    setHasManualTarget(true);

    try {
      const coords = await getCurrentCoordinates({ timeout: 9000 });
      const pos = [coords.lat, coords.lng];
      setUserLocation(pos);
      setUserAccuracy(coords.accuracy);
      setFlyTarget(pos);
    } catch (err) {
      console.warn('[CampusMap] Location error:', err.message);
      setLocationError(err.message || 'Could not retrieve your location.');
    } finally {
      setIsLocating(false);
    }
  };

  // Reset to CTU Barili Campus Center
  const handleResetToCampus = () => {
    setHasManualTarget(true);
    setLocationError('');
    setFlyTarget([CAMPUS_COORDINATES.lat, CAMPUS_COORDINATES.lng]);
  };

  // Health color mapping
  const getHealthColor = (status) => {
    switch (status) {
      case 'Healthy':
        return '#A4B566';
      case 'Monitoring':
        return '#D99B26';
      case 'Needs Attention':
        return '#E57373';
      default:
        return '#A4B566';
    }
  };

  const myTreesCount = allTrees.filter((t) => {
    const ownerId = t.owner?._id || t.owner;
    const currentUserId = user?._id || user?.id;
    return ownerId && currentUserId && String(ownerId) === String(currentUserId);
  }).length;

  return (
    <div className="space-y-4 pb-8">
      {/* Page Title & Scope Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-[#A4B566] uppercase font-mono tracking-wider">
              GEOSPATIAL TELEMETRY
            </span>
            <span className="text-[11px] font-mono text-[#D8DFC8] bg-[#1D230E] px-2 py-0.5 rounded-full border border-[#525E31]">
              CTU Barili Campus
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-[#F0F3E8] font-bold">
            Campus Specimen Map
          </h2>
          <p className="font-body-sm text-body-sm text-[#CCD6B8]">
            Interactive GPS locations &amp; real-time health telemetry across Cebu Technological University – Barili Campus
          </p>
        </div>

        {/* Global vs Personal Scope Toggle */}
        <div className="inline-flex p-1 rounded-2xl bg-[#1D230E] border border-[#525E31] self-start sm:self-auto shadow-sm">
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
              scope === 'all'
                ? 'bg-[#8B9B4C] text-[#1F240F] shadow-md'
                : 'text-[#D8DFC8] hover:text-[#F0F3E8] hover:bg-[#30371A]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">public</span>
            <span>All Campus ({allTrees.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setScope('my')}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
              scope === 'my'
                ? 'bg-[#8B9B4C] text-[#1F240F] shadow-md'
                : 'text-[#D8DFC8] hover:text-[#F0F3E8] hover:bg-[#30371A]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">person</span>
            <span>My Plants &amp; Trees ({myTreesCount})</span>
          </button>
        </div>
      </div>

      {/* Location Error Banner */}
      {locationError && (
        <div className="p-3 rounded-xl bg-[#431B1B]/85 border border-[#E57373]/60 text-xs font-mono text-[#FFCDD2] flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#E57373]">warning</span>
            <span>{locationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocationError('')}
            className="text-[#FFCDD2] hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Health Status Filter Pills & Quick Location Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', 'Healthy', 'Monitoring', 'Needs Attention'].map((f) => {
            const count =
              f === 'All'
                ? scopedTrees.length
                : scopedTrees.filter((t) => t.healthStatus === f).length;

            return (
              <button
                key={f}
                onClick={() => setSelectedHealth(f)}
                className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                  selectedHealth === f
                    ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                    : 'bg-[#262C14] text-[#CCD6B8] border border-[#4F5A2D] hover:bg-[#30371A]'
                }`}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Center to CTU Barili Campus */}
          <button
            type="button"
            onClick={handleResetToCampus}
            className="h-9 px-3 rounded-xl bg-[#262C14] hover:bg-[#30371A] border border-[#525E31] text-[#C2CE9F] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Center map on CTU Barili Campus"
          >
            <span className="material-symbols-outlined text-[16px] text-[#A4B566]">school</span>
            <span>CTU Barili</span>
          </button>

          {/* Find My Location (GPS) */}
          <button
            type="button"
            onClick={handleLocateUser}
            disabled={isLocating}
            className="h-9 px-3.5 rounded-xl bg-[#30371A] hover:bg-[#3D4721] active:scale-95 border border-[#525E31] text-[#A4B566] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            title="Find and center on your live GPS location"
          >
            {isLocating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#A4B566] border-t-transparent rounded-full animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">my_location</span>
                <span>Find My Location</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Leaflet Interactive Map Container */}
      <div className="relative w-full h-[560px] rounded-2xl overflow-hidden border border-[#5D6A37] shadow-2xl bg-[#1D230E] z-0">
        <MapContainer
          center={defaultCenter}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
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

          <MapBoundsController trees={displayedTrees} hasManualTarget={hasManualTarget} />
          <MapFlyToHandler target={flyTarget} />

          {/* User's Current GPS Location Marker with Accuracy Circle */}
          {userLocation && (
            <>
              {userAccuracy && (
                <Circle
                  center={userLocation}
                  radius={userAccuracy}
                  pathOptions={{
                    fillColor: '#4285F4',
                    fillOpacity: 0.15,
                    color: '#4285F4',
                    weight: 1.5,
                  }}
                />
              )}
              <Marker position={userLocation} icon={createUserGpsIcon()}>
                <Popup>
                  <div className="p-1 font-mono text-xs text-[#1D230E]">
                    <strong className="text-[#4285F4] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">my_location</span>
                      You are here
                    </strong>
                    <span className="text-[11px] block mt-0.5">
                      Current GPS field position
                    </span>
                    {userAccuracy && (
                      <span className="text-[10px] text-[#555] block">
                        Accuracy: ±{userAccuracy}m
                      </span>
                    )}
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Specimen Markers */}
          {displayedTrees.map((tree) => {
            const lat = tree.coordinates?.lat;
            const lng = tree.coordinates?.lng;

            if (!lat || !lng || lat === 0 || lng === 0) return null;

            const isOwner =
              (tree.owner?._id && user?._id && String(tree.owner._id) === String(user._id)) ||
              (tree.owner && user?.id && String(tree.owner) === String(user.id));

            const iconColor = getHealthColor(tree.healthStatus);
            const icon = createPinIcon(iconColor, isOwner);

            return (
              <Marker key={tree._id || tree.treeId} position={[lat, lng]} icon={icon}>
                <Popup className="tactical-leaflet-popup">
                  <div className="p-1 text-[#1D230E] font-body space-y-2 min-w-[210px]">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#CCD6B8] pb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-[#4B552A]">
                          #{tree.treeId}
                        </span>
                        {isOwner && (
                          <span className="px-1.5 py-0.2 rounded bg-[#8B9B4C] text-[#1F240F] font-mono text-[9px] font-bold uppercase">
                            Yours
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: iconColor }}
                      >
                        {tree.healthStatus}
                      </span>
                    </div>

                    {/* Specimen Info */}
                    <div>
                      <h4 className="font-bold text-sm text-[#1D230E] leading-tight">
                        {tree.nickname ? `"${tree.nickname}" • ` : ''}
                        {tree.species?.split(' (')[0] || tree.species}
                      </h4>
                      <p className="text-[11px] text-[#4F5A2D] italic truncate">
                        {tree.species}
                      </p>
                      {tree.location && (
                        <p className="text-[11px] font-mono text-[#556038] mt-0.5 truncate">
                          📍 {tree.location}
                        </p>
                      )}
                      {!isOwner && tree.owner?.name && (
                        <p className="text-[10px] font-mono text-[#778060] mt-0.5 truncate">
                          Planted by: <strong>{tree.owner.name}</strong>
                        </p>
                      )}
                    </div>

                    {/* Metrics preview */}
                    <div className="text-[11px] font-mono text-[#30371A] bg-[#E3E8D0] p-1.5 rounded border border-[#CCD6B8] flex items-center justify-between">
                      <span>Height: <strong>{tree.latestHeight || tree.initialHeight || '—'}cm</strong></span>
                      <span>DBH: <strong>{tree.latestStemDiameter || tree.initialStemDiameter || '—'}mm</strong></span>
                    </div>

                    {/* CTA button */}
                    <button
                      onClick={() => navigate(`/trees/${tree.treeId}`)}
                      className="w-full py-1.5 rounded-lg bg-[#6B7D3B] hover:bg-[#54651E] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      <span>View Profile</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-[#1D230E]/70 backdrop-blur-xs flex items-center justify-center z-[1000]">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#262C14] border border-[#525E31] text-[#F0F3E8] font-mono text-xs shadow-xl">
              <div className="w-4 h-4 border-2 border-[#A4B566] border-t-transparent rounded-full animate-spin" />
              <span>Loading campus telemetry...</span>
            </div>
          </div>
        )}

        {/* HUD Map Overlay Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] p-3 rounded-xl bg-[#1D230E]/90 border border-[#525E31] backdrop-blur-md text-xs font-mono space-y-1.5 shadow-xl pointer-events-auto">
          <span className="text-[#A4B566] font-bold block text-[10px] uppercase tracking-wider">
            Specimen Health Matrix
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A4B566] shadow-[0_0_6px_#A4B566]" />
            <span className="text-[#F0F3E8] text-[11px]">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D99B26] shadow-[0_0_6px_#D99B26]" />
            <span className="text-[#F0F3E8] text-[11px]">Monitoring</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E57373] shadow-[0_0_6px_#E57373]" />
            <span className="text-[#F0F3E8] text-[11px]">Needs Attention</span>
          </div>
          <div className="pt-1 border-t border-[#525E31]/60 flex items-center gap-1.5 text-[10px] text-[#C2CE9F]">
            <span className="w-2 h-2 rounded-full border border-white bg-[#8B9B4C]" />
            <span>White ring = Your plant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
