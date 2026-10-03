import React from 'react';
import Icon from '../../common/Icon';
import StageProgressBar from '../StageProgressBar';

/**
 * Specimen Hero Banner displaying identification, vitality status, and growth stage
 */
export default function TreeProfileHero({
  tree,
  vitalityColor = 'emerald',
  onOpenPhoto,
}) {
  if (!tree) return null;

  const primaryPhoto =
    tree.photos && tree.photos.length > 0 ? tree.photos[tree.photos.length - 1].url : null;

  return (
    <div className="rounded-2xl bg-[#262C14] border border-[#525E31] overflow-hidden shadow-lg">
      {/* Photo Header */}
      <div className="relative h-56 sm:h-72 w-full bg-[#1D230E] overflow-hidden">
        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={tree.nickname || tree.species}
            onClick={() => onOpenPhoto && onOpenPhoto(primaryPhoto)}
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#525E31] gap-2">
            <Icon name="psychiatry" className="text-6xl text-[#525E31]/60" />
            <span className="font-mono text-xs text-[#AAB596]">No observation photo attached</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#262C14] via-[#262C14]/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full bg-[#1D230E]/90 backdrop-blur-md border border-[#525E31] text-xs font-mono font-bold text-[#E4F5A6] shadow-md">
            #{tree.treeId}
          </span>

          <span
            className={`px-3 py-1 rounded-full border text-xs font-mono font-bold shadow-md uppercase tracking-wider ${
              vitalityColor === 'emerald'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
                : vitalityColor === 'amber'
                ? 'bg-amber-950/90 text-amber-300 border-amber-600'
                : vitalityColor === 'orange'
                ? 'bg-orange-950/90 text-orange-300 border-orange-600'
                : 'bg-zinc-900/90 text-zinc-300 border-zinc-600'
            }`}
          >
            {tree.healthStatus || 'Thriving'}
          </span>
        </div>

        {/* Bottom Hero Text */}
        <div className="absolute bottom-4 left-4 right-4 space-y-1">
          <h1 className="font-headline-sm text-xl sm:text-2xl font-bold text-[#F0F3E8] tracking-tight">
            {tree.nickname || tree.species}
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#C2CE9F] italic">
            {tree.species} {tree.nickname ? `• "${tree.nickname}"` : ''}
          </p>
        </div>
      </div>

      {/* Meta & Stage Progress Details */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Owner & Location Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-b border-[#4F5A2D] pb-3">
          <div className="flex items-center gap-2 text-[#D8DFC8]">
            <Icon name="person" className="text-[#8B9B4C] text-[18px]" />
            <span>
              {tree.owner?.name || 'Assigned Cadet'}{' '}
              {tree.owner?.rollNumber ? `(#${tree.owner.rollNumber})` : ''}
            </span>
          </div>

          {tree.location && (
            <div className="flex items-center gap-1.5 text-[#C2CE9F]">
              <Icon name="place" className="text-[#8B9B4C] text-[16px]" />
              <span>{tree.location}</span>
            </div>
          )}
        </div>

        {/* Growth Stage Progression Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-xs text-[#C2CE9F] uppercase font-semibold">
              Biological Stage
            </span>
            <span className="font-mono text-xs text-[#A4B566] font-bold">
              {tree.currentStage || 'Seedling'}
            </span>
          </div>
          <StageProgressBar currentStage={tree.currentStage || 'Seedling'} />
        </div>
      </div>
    </div>
  );
}
