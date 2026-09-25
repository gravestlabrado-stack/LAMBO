import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTrees } from '../context/TreeContext';

// Custom Tactical SVG Pins for Leaflet
const createPinIcon = (color) => {
  return L.divIcon({
    className: 'custom-tree-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid #F0F3E8;
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="background-color: #1D230E; width: 8px; height: 8px; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

const pinIcons = {
  Healthy: createPinIcon('#A4B566'),
  Monitoring: createPinIcon('#D99B26'),
  'Needs Attention': createPinIcon('#E57373'),
};

export default function CampusMapPage() {
  const navigate = useNavigate();
  const { trees } = useTrees();
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Campus Arboretum Center Coordinates
  const defaultCenter = [37.893, -122.571];

  const filteredTrees = trees.filter((tree) => {
    if (selectedFilter === 'Healthy') return tree.healthStatus === 'Healthy';
    if (selectedFilter === 'Monitoring') return tree.healthStatus === 'Monitoring';
    if (selectedFilter === 'Needs Attention') return tree.healthStatus === 'Needs Attention';
    return true;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-label-sm text-label-sm text-[#A4B566] uppercase font-mono tracking-wider">
            GEOSPATIAL TELEMETRY
          </span>
          <h2 className="font-headline-md text-headline-md text-[#F0F3E8] font-bold">
            Campus Wildling Location Matrix
          </h2>
          <p className="font-body-sm text-body-sm text-[#CCD6B8]">
            Plot coordinates &amp; real-time specimen health telemetry overlay
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', 'Healthy', 'Monitoring', 'Needs Attention'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                selectedFilter === f
                  ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                  : 'bg-[#262C14] text-[#CCD6B8] border border-[#4F5A2D] hover:bg-[#30371A]'
              }`}
            >
              {f} ({f === 'All' ? trees.length : trees.filter((t) => t.healthStatus === f).length})
            </button>
          ))}
        </div>
      </div>

      {/* Leaflet Interactive Map Container */}
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-[#5D6A37] shadow-2xl bg-[#1D230E]">
        <MapContainer
          center={defaultCenter}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* CartoDB Dark Matter tiles matching tactical army-green theme */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {filteredTrees.map((tree) => {
            const lat = tree.coordinates?.lat || defaultCenter[0];
            const lng = tree.coordinates?.lng || defaultCenter[1];
            const icon = pinIcons[tree.healthStatus] || pinIcons.Healthy;

            return (
              <Marker key={tree.treeId} position={[lat, lng]} icon={icon}>
                <Popup className="tactical-leaflet-popup">
                  <div className="p-1 text-[#1D230E] font-body space-y-2 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#6B7D3B]">
                        #{tree.treeId}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#30371A] text-[#A4B566]">
                        {tree.healthStatus}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#1D230E] leading-tight">
                        {tree.nickname || tree.species.split(' ')[0]}
                      </h4>
                      <p className="text-[11px] text-[#4F5A2D] italic truncate">
                        {tree.species}
                      </p>
                    </div>

                    <div className="text-[11px] font-mono text-[#30371A] bg-[#E3E8D0] p-1.5 rounded border border-[#CCD6B8]">
                      Height: <strong>{tree.height}m</strong> • DBH: <strong>{tree.stemDiameter}cm</strong>
                    </div>

                    <button
                      onClick={() => navigate(`/trees/${tree.treeId}`)}
                      className="w-full py-1.5 rounded-lg bg-[#6B7D3B] hover:bg-[#54651E] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                      Open Specimen Profile
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* HUD Map Overlay Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] p-3.5 rounded-xl bg-[#1D230E]/90 border border-[#525E31] backdrop-blur-md text-xs font-mono space-y-2 shadow-xl pointer-events-auto">
          <span className="text-[#A4B566] font-bold block text-[10px] uppercase tracking-wider">
            Specimen Health Matrix
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A4B566] shadow-[0_0_6px_#A4B566]"></span>
            <span className="text-[#F0F3E8]">Healthy Specimen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D99B26] shadow-[0_0_6px_#D99B26]"></span>
            <span className="text-[#F0F3E8]">Under Monitoring</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E57373] shadow-[0_0_6px_#E57373]"></span>
            <span className="text-[#F0F3E8]">Needs Attention</span>
          </div>
        </div>
      </div>
    </div>
  );
}
