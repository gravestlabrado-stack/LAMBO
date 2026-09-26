import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/formatters';
import Icon from '../common/Icon';

export default function TreeCard({ tree, isOwner = false }) {
  const navigate = useNavigate();

  const photoUrl =
    tree.photos && tree.photos.length > 0 ? tree.photos[0].url : null;

  const getHealthStyles = (status) => {
    switch (status) {
      case 'Healthy':
        return 'bg-[#3A4320] border-[#5D6A37] text-[#D2DCB4]';
      case 'Monitoring':
        return 'bg-[#3A331A] border-[#D99B26]/60 text-[#F5C26B]';
      case 'Needs Attention':
        return 'bg-[#431B1B] border-[#E57373]/60 text-[#FFCDD2]';
      default:
        return 'bg-[#1D230E] border-[#525E31] text-[#D8DFC8]';
    }
  };

  const currentHeight = tree.latestHeight || tree.initialHeight || tree.height;
  const currentDBH = tree.latestStemDiameter || tree.initialStemDiameter || tree.stemDiameter;

  return (
    <div
      onClick={() => navigate(`/trees/${tree.treeId}`)}
      className="group rounded-2xl bg-[#262C14] border border-[#4F5A2D] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer card-interactive"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Specimen Photo Thumbnail */}
        <div className="relative w-16 h-16 rounded-xl bg-[#1D230E] overflow-hidden shrink-0 border border-[#525E31] shadow-inner flex items-center justify-center">
          {photoUrl ? (
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              alt={tree.species}
              src={photoUrl}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[#525E31] group-hover:text-[#8B9B4C] transition-colors">
              <Icon name="park" className="w-7 h-7" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Specimen Information */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#1D230E] text-[#A4B566] border border-[#525E31] font-mono text-[11px] font-bold shrink-0">
              #{tree.treeId}
            </span>
            <span className="font-display font-bold text-base text-[#F0F3E8] truncate group-hover:text-[#A4B566] transition-colors">
              {tree.nickname || tree.species?.split(' (')[0] || tree.species}
            </span>
          </div>

          <span className="font-body-sm text-xs text-[#CCD6B8] italic truncate mt-0.5">
            {tree.species}
          </span>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#AAB596] truncate mt-1">
            <Icon name="location_on" className="w-3.5 h-3.5 text-[#8B9B4C] shrink-0" />
            <span className="truncate">{tree.location || 'CTU Barili Campus'}</span>
            <span className="text-[#525E31]">•</span>
            <span className="shrink-0">{formatRelativeTime(tree.datePlanted || tree.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Badges & Metrics Row */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-[#38411F] pt-2.5 sm:pt-0 shrink-0">
        <div className="flex items-center gap-1.5">
          {tree.currentStage && (
            <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-[#1D230E] text-[#C2CE9F] border border-[#525E31]">
              {tree.currentStage}
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold border ${getHealthStyles(
              tree.healthStatus
            )}`}
          >
            {tree.healthStatus || 'Healthy'}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#A4B566]">
          {currentHeight && (
            <span className="font-bold">
              {currentHeight}cm <span className="text-[10px] font-normal text-[#AAB596]">ht</span>
            </span>
          )}
          {currentDBH && (
            <>
              <span className="text-[#525E31]">•</span>
              <span className="text-[#CCD6B8]">
                {currentDBH}mm <span className="text-[10px] font-normal text-[#AAB596]">DBH</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
