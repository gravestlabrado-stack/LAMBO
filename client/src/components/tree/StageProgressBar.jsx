import React from 'react';
import { GROWTH_STAGES } from '../../utils/constants';

export default function StageProgressBar({
  currentStage = 'Seedling',
  onStageChange = null,
}) {
  const currentIndex = GROWTH_STAGES.indexOf(currentStage) !== -1
    ? GROWTH_STAGES.indexOf(currentStage)
    : 0;

  const stageIcons = {
    Seedling: 'potted_plant',
    Vegetative: 'energy_savings_leaf',
    Flowering: 'local_florist',
    'Fruit Set': 'nutrition',
    Ripening: 'eco',
    Harvest: 'agriculture',
  };

  return (
    <div className="rounded-2xl bg-[#262C14] border border-[#4F5A2D] p-4 sm:p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#4F5A2D]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#A4B566]">
            timeline
          </span>
          <h4 className="font-mono text-xs font-bold text-[#F0F3E8] uppercase tracking-wider">
            Phenological Growth Stage
          </h4>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1D230E] border border-[#525E31] text-[11px] font-mono text-[#A4B566]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A4B566] animate-pulse" />
          <span className="font-bold">{currentStage}</span>
          <span className="text-[#8B9B70]">({currentIndex + 1}/{GROWTH_STAGES.length})</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative pt-2 pb-1 overflow-x-auto no-scrollbar">
        {/* Connection Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-[#38411F] z-0" />
        <div
          className="absolute top-6 left-6 h-0.5 bg-[#8B9B4C] transition-all duration-500 z-0"
          style={{
            width: `${(currentIndex / (GROWTH_STAGES.length - 1)) * 100}%`,
          }}
        />

        {/* Stage Nodes */}
        <div className="relative flex items-center justify-between min-w-[340px] z-10 px-1">
          {GROWTH_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;

            return (
              <div
                key={stage}
                onClick={() => onStageChange?.(stage)}
                className={`flex flex-col items-center gap-1.5 group select-none ${
                  onStageChange ? 'cursor-pointer' : ''
                }`}
              >
                {/* Node Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#8B9B4C] text-[#1F240F] ring-4 ring-[#8B9B4C]/30 shadow-lg scale-110 font-bold'
                      : isCompleted
                      ? 'bg-[#3A4320] text-[#A4B566] border border-[#5D6A37]'
                      : 'bg-[#1D230E] text-[#636F45] border border-[#3E4724]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isCompleted ? 'check' : stageIcons[stage] || 'circle'}
                  </span>
                </div>

                {/* Stage Label */}
                <span
                  className={`font-mono text-[10px] tracking-tight transition-colors whitespace-nowrap ${
                    isCurrent
                      ? 'text-[#F0F3E8] font-bold'
                      : isCompleted
                      ? 'text-[#C2CE9F]'
                      : 'text-[#636F45]'
                  }`}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
