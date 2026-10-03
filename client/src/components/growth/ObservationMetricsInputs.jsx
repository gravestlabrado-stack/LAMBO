import React from 'react';
import { GROWTH_STAGES } from '../../utils/constants';

/**
 * Botanical Growth Measurement Telemetry Inputs
 */
export default function ObservationMetricsInputs({
  height,
  onHeightChange,
  stemDiameter,
  onStemDiameterChange,
  leafCount,
  onLeafCountChange,
  fruitCount,
  onFruitCountChange,
  growthStage,
  onGrowthStageChange,
  disabled = false,
}) {
  return (
    <div className="space-y-3">
      {/* Height and Stem Caliper */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-mono font-bold text-[#E4F5A6] uppercase tracking-wider">
            Height (cm) *
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="1000"
            value={height}
            disabled={disabled}
            onChange={(e) => onHeightChange(e.target.value)}
            placeholder="e.g. 45.2"
            required
            className="w-full h-10 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-mono font-medium text-[#C2CE9F] uppercase tracking-wider">
            Stem Caliper (mm)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="500"
            value={stemDiameter}
            disabled={disabled}
            onChange={(e) => onStemDiameterChange(e.target.value)}
            placeholder="e.g. 8.5"
            className="w-full h-10 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
          />
        </div>
      </div>

      {/* Leaf and Fruit Count */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-mono font-medium text-[#C2CE9F] uppercase tracking-wider">
            Leaf Count
          </label>
          <input
            type="number"
            step="1"
            min="0"
            max="10000"
            value={leafCount}
            disabled={disabled}
            onChange={(e) => onLeafCountChange(e.target.value)}
            placeholder="e.g. 14"
            className="w-full h-10 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-mono font-medium text-[#C2CE9F] uppercase tracking-wider">
            Fruit Count
          </label>
          <input
            type="number"
            step="1"
            min="0"
            max="1000"
            value={fruitCount}
            disabled={disabled}
            onChange={(e) => onFruitCountChange(e.target.value)}
            placeholder="e.g. 0"
            className="w-full h-10 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
          />
        </div>
      </div>

      {/* Growth Stage Selector */}
      <div className="space-y-1">
        <label className="block text-xs font-mono font-medium text-[#C2CE9F] uppercase tracking-wider">
          Biological Growth Stage
        </label>
        <select
          value={growthStage}
          disabled={disabled}
          onChange={(e) => onGrowthStageChange(e.target.value)}
          className="w-full h-10 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
        >
          {GROWTH_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
