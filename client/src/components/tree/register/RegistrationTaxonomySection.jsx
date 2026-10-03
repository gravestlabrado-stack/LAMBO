import React from 'react';
import Icon from '../../common/Icon';
import { SPECIES_PRESETS } from '../../../utils/constants';

export default function RegistrationTaxonomySection({
  species,
  onSpeciesChange,
  customSpecies,
  onCustomSpeciesChange,
  nickname,
  onNicknameChange,
  presets = SPECIES_PRESETS,
}) {
  return (
    <section className="bg-[#30371A] rounded-2xl p-5 shadow-sm border border-[#525E31] space-y-4">
      <div className="flex items-center gap-2 border-b border-[#4F5A2D] pb-3">
        <Icon name="eco" className="text-[#A4B566] w-5 h-5" />
        <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
          Botanical Species &amp; Identification
        </h3>
      </div>

      {/* Quick Species Preset Chips */}
      <div className="space-y-2">
        <span className="text-xs font-mono font-medium text-[#C2CE9F] block">
          Fast Presets (Philippine &amp; Campus Flora)
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const isSelected = species === preset && !customSpecies;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onSpeciesChange(preset);
                  onCustomSpeciesChange('');
                }}
                className={`px-3 py-1.5 rounded-full font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-[#8B9B4C] text-[#1F240F] font-bold shadow-md border border-[#A4B566]'
                    : 'bg-[#1D230E] text-[#D8DFC8] border border-[#525E31] hover:bg-[#38411F]'
                }`}
              >
                {isSelected && <Icon name="check" className="w-3.5 h-3.5" />}
                {preset.split(' (')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Species Input */}
      <div className="space-y-1">
        <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
          Or Custom Botanical Species Name (Scientific / Common)
        </label>
        <input
          type="text"
          placeholder="e.g. Swietenia macrophylla (Mahogany) or Ficus nota"
          value={customSpecies}
          onChange={(e) => onCustomSpeciesChange(e.target.value)}
          className="w-full h-11 bg-[#1D230E] text-[#F0F3E8] rounded-xl px-3.5 border border-[#525E31] focus:outline-none focus:border-[#A4B566] text-sm"
        />
      </div>

      {/* Specimen Nickname / Tag */}
      <div className="space-y-1">
        <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
          Specimen Tag / Nickname (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Quad Sprout Alpha, Plot 4 Sapling"
          value={nickname}
          onChange={(e) => onNicknameChange(e.target.value)}
          className="w-full h-11 bg-[#1D230E] text-[#F0F3E8] rounded-xl px-3.5 border border-[#525E31] focus:outline-none focus:border-[#A4B566] text-sm"
        />
      </div>
    </section>
  );
}
