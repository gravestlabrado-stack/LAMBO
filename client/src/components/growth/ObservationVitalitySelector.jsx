import React from 'react';
import Icon from '../common/Icon';

const VITALITY_TIERS = [
  {
    id: 'Thriving',
    label: 'Thriving',
    desc: 'Vibrant foliage, vigorous growth, healthy foliage',
    color: 'emerald',
    icon: 'sentiment_very_satisfied',
  },
  {
    id: 'Stable / Fair',
    label: 'Stable / Fair',
    desc: 'Maintained growth, minor shedding or light stress',
    color: 'amber',
    icon: 'sentiment_neutral',
  },
  {
    id: 'Distressed / At Risk',
    label: 'Distressed',
    desc: 'Severe wilting, pest damage, or chlorosis',
    color: 'orange',
    icon: 'sentiment_dissatisfied',
  },
  {
    id: 'Dead / Mortality',
    label: 'Mortality',
    desc: 'Specimen unviable; recorded for cohort survival audit',
    color: 'zinc',
    icon: 'sentiment_very_dissatisfied',
  },
];

/**
 * Forestry Standard Vitality Rating Radio Group
 */
export default function ObservationVitalitySelector({
  value = 'Thriving',
  onChange,
  disabled = false,
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-mono font-bold text-[#E4F5A6] uppercase tracking-wider">
        Plant Vitality Status *
      </label>

      <div className="grid grid-cols-2 gap-2">
        {VITALITY_TIERS.map((tier) => {
          const isSelected = value === tier.id;

          return (
            <button
              key={tier.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(tier.id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? tier.color === 'emerald'
                    ? 'bg-emerald-950/70 border-emerald-500 shadow-sm'
                    : tier.color === 'amber'
                    ? 'bg-amber-950/70 border-amber-500 shadow-sm'
                    : tier.color === 'orange'
                    ? 'bg-orange-950/70 border-orange-500 shadow-sm'
                    : 'bg-zinc-900 border-zinc-500 shadow-sm'
                  : 'bg-[#1D230E] border-[#525E31] hover:border-[#8B9B4C]/60'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon
                  name={tier.icon}
                  className={`text-[16px] ${
                    isSelected
                      ? tier.color === 'emerald'
                        ? 'text-emerald-400'
                        : tier.color === 'amber'
                        ? 'text-amber-400'
                        : tier.color === 'orange'
                        ? 'text-orange-400'
                        : 'text-zinc-400'
                      : 'text-[#AAB596]'
                  }`}
                />
                <span
                  className={`font-mono text-xs font-bold ${
                    isSelected ? 'text-[#F0F3E8]' : 'text-[#C2CE9F]'
                  }`}
                >
                  {tier.label}
                </span>
              </div>
              <p className="font-mono text-[10px] text-[#AAB596] leading-tight line-clamp-1">
                {tier.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
