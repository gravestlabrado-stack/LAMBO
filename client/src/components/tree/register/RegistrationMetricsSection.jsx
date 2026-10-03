import React from 'react';
import Icon from '../../common/Icon';

export default function RegistrationMetricsSection({
  height,
  onHeightChange,
  stemDiameter,
  onStemDiameterChange,
  leafCount,
  onLeafCountChange,
  notes,
  onNotesChange,
}) {
  const adjustMetric = (setter, val, delta, min = 0) => {
    const current = parseFloat(val) || 0;
    setter(Math.max(min, Number((current + delta).toFixed(1))));
  };

  return (
    <section className="bg-[#30371A] rounded-2xl p-5 shadow-sm border border-[#525E31] space-y-4">
      <div className="flex items-center gap-2 border-b border-[#4F5A2D] pb-3">
        <Icon name="straighten" className="text-[#A4B566] w-5 h-5" />
        <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
          Baseline Measurements
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Height Stepper / Direct Input */}
        <div className="p-3 bg-[#1D230E] border border-[#525E31] rounded-xl flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label className="font-mono text-[11px] text-[#AAB596] block mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={height}
              onChange={(e) => onHeightChange(e.target.value)}
              onBlur={() => {
                const num = parseFloat(height);
                onHeightChange(isNaN(num) || num < 0 ? 0 : Number(num.toFixed(1)));
              }}
              className="w-full bg-[#262C14] text-[#F0F3E8] font-mono text-base font-bold px-2.5 py-1 rounded-lg border border-[#525E31] focus:outline-none focus:border-[#A4B566]"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0 self-end mb-0.5">
            <button
              type="button"
              onClick={() => adjustMetric(onHeightChange, height, -5, 0)}
              className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721] active:scale-95 transition-all cursor-pointer"
              title="Decrease height (-5)"
            >
              <Icon name="remove" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => adjustMetric(onHeightChange, height, 5, 0)}
              className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721] active:scale-95 transition-all cursor-pointer"
              title="Increase height (+5)"
            >
              <Icon name="add" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stem Diameter Stepper / Direct Input */}
        <div className="p-3 bg-[#1D230E] border border-[#525E31] rounded-xl flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label className="font-mono text-[11px] text-[#AAB596] block mb-1">
              Stem DBH (mm)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={stemDiameter}
              onChange={(e) => onStemDiameterChange(e.target.value)}
              onBlur={() => {
                const num = parseFloat(stemDiameter);
                onStemDiameterChange(isNaN(num) || num < 0 ? 0 : Number(num.toFixed(1)));
              }}
              className="w-full bg-[#262C14] text-[#F0F3E8] font-mono text-base font-bold px-2.5 py-1 rounded-lg border border-[#525E31] focus:outline-none focus:border-[#A4B566]"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0 self-end mb-0.5">
            <button
              type="button"
              onClick={() => adjustMetric(onStemDiameterChange, stemDiameter, -1, 0)}
              className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721] active:scale-95 transition-all cursor-pointer"
              title="Decrease stem DBH (-1)"
            >
              <Icon name="remove" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => adjustMetric(onStemDiameterChange, stemDiameter, 1, 0)}
              className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721] active:scale-95 transition-all cursor-pointer"
              title="Increase stem DBH (+1)"
            >
              <Icon name="add" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Leaf Count Stepper / Direct Input */}
        <div className="p-3 bg-[#1D230E] border border-[#525E31] rounded-xl flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label className="font-mono text-[11px] text-[#AAB596] block mb-1">
              Leaf Count
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={leafCount}
              onChange={(e) => onLeafCountChange(e.target.value)}
              onBlur={() => {
                const num = parseInt(leafCount, 10);
                onLeafCountChange(isNaN(num) || num < 0 ? 0 : num);
              }}
              className="w-full bg-[#262C14] text-[#F0F3E8] font-mono text-base font-bold px-2.5 py-1 rounded-lg border border-[#525E31] focus:outline-none focus:border-[#A4B566]"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0 self-end mb-0.5">
            <button
              type="button"
              onClick={() => adjustMetric(onLeafCountChange, leafCount, -1, 0)}
              className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721] active:scale-95 transition-all cursor-pointer"
              title="Decrease leaf count (-1)"
            >
              <Icon name="remove" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => adjustMetric(onLeafCountChange, leafCount, 1, 0)}
              className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721] active:scale-95 transition-all cursor-pointer"
              title="Increase leaf count (+1)"
            >
              <Icon name="add" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Initial Field Notes */}
      <div className="space-y-1">
        <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
          Initial Field Notes &amp; Observations
        </label>
        <textarea
          rows={2}
          placeholder="e.g. Planted near east irrigation canal, healthy root ball, staked with bamboo..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full bg-[#1D230E] text-[#F0F3E8] rounded-xl p-3 border border-[#525E31] focus:outline-none focus:border-[#A4B566] text-xs font-mono resize-none"
        />
      </div>
    </section>
  );
}
