import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import treeService from '../services/treeService';
import { useAuth } from '../hooks/useAuth';
import { useTrees } from '../context/TreeContext';
import { CAMPUS_COORDINATES } from '../utils/constants';
import { getCurrentCoordinates } from '../utils/geolocation';
import { getStoredTrees } from '../utils/offlineStorage';
import MarkerClusterGroup from '../components/map/MarkerClusterGroup';
import MapFilterToolbar from '../components/map/MapFilterToolbar';
import MapLegendOverlay from '../components/map/MapLegendOverlay';
import { createPinIcon, createUserGpsIcon, getHealthColor } from '../components/map/mapIcons';
import Icon from '../components/common/Icon';

function MapFlyToHandler({ target, zoom = 17 }) {
  const map = useMap();
  useEffect(() => {
    if (target && target[0] && target[1]) {
      map.flyTo(target, zoom, { duration: 1.4 });
    }
  }, [target, zoom, map]);
  return null;
}

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
  const [scope, setScope] = useState('all');
  const [selectedHealth, setSelectedHealth] = useState('All');

  const [flyTarget, setFlyTarget] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userAccuracy, setUserAccuracy] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [hasManualTarget, setHasManualTarget] = useState(false);

  const defaultCenter = useMemo(() => [CAMPUS_COORDINATES.lat, CAMPUS_COORDINATES.lng], []);

  const fetchMapTrees = useCallback(async () => {
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
        const stored = await getStoredTrees();
        if (stored && stored.length > 0) {
          setAllTrees(stored);
        } else {
          const cached = localStorage.getItem('lambo_cached_all_trees') || localStorage.getItem('lambo_cached_campus_catalog');
          if (cached) {
            setAllTrees(JSON.parse(cached));
          } else if (campusCatalog && campusCatalog.length > 0) {
            setAllTrees(campusCatalog);
          } else if (userTrees && userTrees.length > 0) {
            setAllTrees(userTrees);
          }
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [allTrees.length, campusCatalog, userTrees]);

  useEffect(() => {
    fetchMapTrees();
  }, [fetchMapTrees]);

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

  const healthCounts = useMemo(() => {
    const counts = {
      All: scopedTrees.length,
      Thriving: 0,
      'Stable / Fair': 0,
      'Distressed / At Risk': 0,
      'Dead / Mortality': 0,
    };
    for (const t of scopedTrees) {
      if (t.healthStatus === 'Thriving' || t.healthStatus === 'Healthy') counts.Thriving++;
      else if (t.healthStatus === 'Stable / Fair' || t.healthStatus === 'Monitoring') counts['Stable / Fair']++;
      else if (t.healthStatus === 'Distressed / At Risk' || t.healthStatus === 'Needs Attention') counts['Distressed / At Risk']++;
      else if (t.healthStatus === 'Dead / Mortality' || t.status === 'dead') counts['Dead / Mortality']++;
    }
    return counts;
  }, [scopedTrees]);

  const myTreesCount = useMemo(() => {
    const currentUserId = user?._id || user?.id;
    return allTrees.filter((t) => {
      const ownerId = t.owner?._id || t.owner;
      return ownerId && currentUserId && String(ownerId) === String(currentUserId);
    }).length;
  }, [allTrees, user]);

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

  const handleResetToCampus = () => {
    setHasManualTarget(true);
    setLocationError('');
    setFlyTarget([CAMPUS_COORDINATES.lat, CAMPUS_COORDINATES.lng]);
  };

  return (
    <div className="space-y-4 pb-8">
      <MapFilterToolbar
        scope={scope}
        onScopeChange={setScope}
        totalTrees={allTrees.length}
        myTreesCount={myTreesCount}
        selectedHealth={selectedHealth}
        onHealthChange={setSelectedHealth}
        healthCounts={healthCounts}
        onResetCampus={handleResetToCampus}
        onLocateUser={handleLocateUser}
        isLocating={isLocating}
      />

      {locationError && (
        <div className="p-3 rounded-xl bg-[#431B1B]/85 border border-[#E57373]/60 text-xs font-mono text-[#FFCDD2] flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon name="warning" className="text-[18px] text-[#E57373]" />
            <span>{locationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocationError('')}
            className="text-[#FFCDD2] hover:text-white cursor-pointer"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>
      )}

      {/* Leaflet Interactive Map Container */}
      <div className="relative w-full h-[560px] rounded-2xl overflow-hidden border border-[#5D6A37] shadow-2xl bg-[#1D230E] z-0">
        <MapContainer
          center={defaultCenter}
          zoom={16}
          maxZoom={22}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
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

          {/* User's Live GPS Pin & Accuracy Radar */}
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

          <MarkerClusterGroup
            trees={displayedTrees}
            currentUserId={user?._id || user?.id}
            getHealthColor={getHealthColor}
            createPinIcon={createPinIcon}
          />
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 bg-[#1D230E]/70 backdrop-blur-xs flex items-center justify-center z-[1000]">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#262C14] border border-[#525E31] text-[#F0F3E8] font-mono text-xs shadow-xl">
              <div className="w-4 h-4 border-2 border-[#A4B566] border-t-transparent rounded-full animate-spin" />
              <span>Loading campus telemetry...</span>
            </div>
          </div>
        )}

        <MapLegendOverlay />
      </div>
    </div>
  );
}
