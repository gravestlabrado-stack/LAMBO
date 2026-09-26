import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

export default function MarkerClusterGroup({
  trees = [],
  currentUserId = null,
  getHealthColor,
  createPinIcon,
  onSelectTree,
}) {
  const map = useMap();
  const clusterGroupRef = useRef(null);

  useEffect(() => {
    // Create Leaflet MarkerClusterGroup with tactical military styling
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 45,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="tactical-cluster-icon">${count}</div>`,
          className: 'tactical-cluster-container',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });
      },
    });

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    // Add each tree as a marker in the cluster group
    trees.forEach((tree) => {
      const lat = tree.coordinates?.lat;
      const lng = tree.coordinates?.lng;
      if (!lat || !lng || lat === 0 || lng === 0) return;

      const ownerId = typeof tree.owner === 'object' ? tree.owner?._id : tree.owner;
      const isOwner =
        ownerId && currentUserId && String(ownerId) === String(currentUserId);

      const color = getHealthColor(tree.healthStatus);
      const icon = createPinIcon(color, isOwner);

      const marker = L.marker([lat, lng], { icon });

      // Create rich tactical HTML popup
      const popupHtml = `
        <div class="p-1 text-[#1D230E] font-body space-y-2 min-w-[210px]">
          <div class="flex items-center justify-between gap-2 border-b border-[#CCD6B8] pb-1.5" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #CCD6B8; padding-bottom:6px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-family:monospace; font-size:12px; font-weight:bold; color:#4B552A;">
                #${tree.treeId}
              </span>
              ${
                isOwner
                  ? '<span style="padding:2px 6px; border-radius:4px; background:#8B9B4C; color:#1F240F; font-family:monospace; font-size:9px; font-weight:bold; text-transform:uppercase;">Yours</span>'
                  : ''
              }
            </div>
            <span style="font-size:10px; font-weight:bold; padding:2px 8px; border-radius:10px; color:#FFFFFF; background-color:${color};">
              ${tree.healthStatus || 'Healthy'}
            </span>
          </div>

          <div>
            <h4 style="font-weight:bold; font-size:14px; color:#1D230E; margin:4px 0 2px 0;">
              ${tree.nickname ? `"${tree.nickname}" • ` : ''}${tree.species?.split(' (')[0] || tree.species}
            </h4>
            <p style="font-size:11px; color:#4F5A2D; font-style:italic; margin:0;">
              ${tree.species}
            </p>
          </div>

          <div style="font-size:11px; font-family:monospace; color:#333; background:#F0F3E8; padding:6px; border-radius:6px; display:flex; justify-content:space-between;">
            <span>Sector: <strong>${tree.location || 'Campus Plot'}</strong></span>
            <span>Stage: <strong style="color:#4B552A;">${tree.currentStage || 'Seedling'}</strong></span>
          </div>

          <div style="display:flex; gap:6px; padding-top:4px;">
            <a href="/trees/${tree.treeId}" style="flex:1; text-align:center; padding:6px; border-radius:6px; background:#8B9B4C; color:#1F240F; font-family:monospace; font-size:11px; font-weight:bold; text-decoration:none; text-transform:uppercase;">
              View Profile
            </a>
            <a href="/trees/${tree.treeId}/logs" style="padding:6px 10px; border-radius:6px; background:#30371A; color:#F0F3E8; font-family:monospace; font-size:11px; font-weight:bold; text-decoration:none;">
              Logs
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'tactical-leaflet-popup' });
      clusterGroup.addLayer(marker);
    });

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [trees, currentUserId, getHealthColor, createPinIcon, map, onSelectTree]);

  return null;
}
