import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../components/common/Icon';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import treeService from '../services/treeService';
import { useAuth } from '../hooks/useAuth';
import { useTrees } from '../context/TreeContext';
import { CAMPUS_COORDINATES } from '../utils/constants';
import { getCurrentCoordinates } from '../utils/geolocation';
import MarkerClusterGroup from '../components/map/MarkerClusterGroup';

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
  const [searchParams] = useSearchParams();
  const focusTreeId = searchParams.get('focus');
  const { user } = useAuth();
  const { trees: userTrees, campusCatalog } = useTrees();

  const [allTrees, setAllTrees] = useState(() => {
    try {
      const cached = localStorage.getItem('lambo_cached_all_trees') || localStorage.getItem('lambo_cached_campus_catalog');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(allTrees.length === 0);
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

  // Fetch all campus trees from backend API with offline cache fallback
  const fetchMapTrees = async () => {
    try {
      if (allTrees.length === 0) setLoading(true);
      const res = await treeService.getTrees({ all: 'true' });
      const treeList = res.data || [];
      setAllTrees(treeList);
      try {
        localStorage.setItem('lambo_cached_all_trees', JSON.stringify(treeList));
      } catch {}
    } catch (err) {
      console.warn('[CampusMap] Offline or error loading campus trees, falling back to cache:', err.message);
      try {
        const cached = localStorage.getItem('lambo_cached_all_trees') || localStorage.getItem('lambo_cached_campus_catalog');
        if (cached) {
          setAllTrees(JSON.parse(cached));
        } else if (campusCatalog && campusCatalog.length > 0) {
          setAllTrees(campusCatalog);
        } else if (userTrees && userTrees.length > 0) {
          setAllTrees(userTrees);
        }
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapTrees();
  }, []);

  // Handle URL focus parameter (?focus=LMB-0002)
  useEffect(() => {
    if (focusTreeId && allTrees.length > 0) {
      const target = allTrees.find(
        (t) =>
          t.treeId?.toLowerCase() === focusTreeId.toLowerCase() ||
          t._id === focusTreeId
      );
      if (target?.coordinates?.lat && target?.coordinates?.lng) {
        setHasManualTarget(true);
        setFlyTarget([target.coordinates.lat, target.coordinates.lng]);
      }
    }
  }, [focusTreeId, allTrees]);

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
      if (selectedHealth === 'All') return true;
      if (selectedHealth === 'Thriving' || selectedHealth === 'Healthy') {
        return tree.healthStatus === 'Thriving' || tree.healthStatus === 'Healthy';
      }
      if (selectedHealth === 'Stable / Fair' || selectedHealth === 'Monitoring') {
        return tree.healthStatus === 'Stable / Fair' || tree.healthStatus === 'Monitoring';
      }
      if (selectedHealth === 'Distressed / At Risk' || selectedHealth === 'Needs Attention') {
        return tree.healthStatus === 'Distressed / At Risk' || tree.healthStatus === 'Needs Attention';
      }
      if (selectedHealth === 'Dead / Mortality' || selectedHealth === 'Dead') {
        return tree.healthStatus === 'Dead / Mortality' || tree.status === 'dead';
      }
      return tree.healthStatus === selectedHealth;
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
      case 'Thriving':
      case 'Healthy':
        return '#A4B566';
      case 'Stable / Fair':
      case 'Monitoring':
        return '#D99B26';
      case 'Distressed / At Risk':
      case 'Needs Attention':
        return '#E57373';
      case 'Dead / Mortality':
        return '#757575';
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
            <Icon name="public" className="text-[17px]" />
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
            <Icon name="person" className="text-[17px]" />
            <span>My Plants &amp; Trees ({myTreesCount})</span>
          </button>
        </div>
      </div>

      {/* Location Error Banner */}
      {locationError && (
        <div className="p-3 rounded-xl bg-[#431B1B]/85 border border-[#E57373]/60 text-xs font-mono text-[#FFCDD2] flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon name="warning" className="text-[18px] text-[#E57373]" />
            <span>{locationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocationError('')}
            className="text-[#FFCDD2] hover:text-white"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>
      )}

      {/* Health Status Filter Pills & Quick Location Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Thriving', 'Stable / Fair', 'Distressed / At Risk', 'Dead / Mortality'].map((f) => {
            const count =
              f === 'All'
                ? scopedTrees.length
                : scopedTrees.filter((t) => {
                    if (f === 'Thriving') return t.healthStatus === 'Thriving' || t.healthStatus === 'Healthy';
                    if (f === 'Stable / Fair') return t.healthStatus === 'Stable / Fair' || t.healthStatus === 'Monitoring';
                    if (f === 'Distressed / At Risk') return t.healthStatus === 'Distressed / At Risk' || t.healthStatus === 'Needs Attention';
                    if (f === 'Dead / Mortality') return t.healthStatus === 'Dead / Mortality' || t.status === 'dead';
                    return t.healthStatus === f;
                  }).length;

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
            <Icon name="school" className="text-[16px] text-[#A4B566]" />
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
                <Icon name="my_location" className="text-[16px]" />
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
          maxZoom={22}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Map Tile Layer: OpenStreetMap with maxZoom 22 (scaled beyond zoom 19) */}
          <TileLayer
            maxZoom={22}
            maxNativeZoom={19}
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
                      <Icon name="my_location" className="text-[14px]" />
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

          {/* Tactical Marker Cluster Group */}
          <MarkerClusterGroup
            trees={displayedTrees}
            currentUserId={user?._id || user?.id}
            getHealthColor={getHealthColor}
            createPinIcon={createPinIcon}
          />
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
            <span className="text-[#F0F3E8] text-[11px]">Thriving</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D99B26] shadow-[0_0_6px_#D99B26]" />
            <span className="text-[#F0F3E8] text-[11px]">Stable / Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E57373] shadow-[0_0_6px_#E57373]" />
            <span className="text-[#F0F3E8] text-[11px]">Distressed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#757575] shadow-[0_0_6px_#757575]" />
            <span className="text-[#F0F3E8] text-[11px]">Dead / Mortality</span>
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
