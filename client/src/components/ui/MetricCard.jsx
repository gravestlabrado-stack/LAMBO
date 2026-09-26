import React from 'react';
import Icon from '../common/Icon';

export default function MetricCard({
  title,
  value,
  subtext,
  icon,
  badge,
  badgeVariant = 'default',
  trend,
  className = '',
  loading = false,
}) {
  const getBadgeStyles = () => {
    switch (badgeVariant) {
      case 'success':
        return 'bg-[#3A4320] border-[#5D6A37] text-[#D2DCB4]';
      case 'warning':
        return 'bg-[#3A331A] border-[#D99B26]/60 text-[#F5C26B]';
      case 'danger':
        return 'bg-[#431B1B] border-[#E57373]/60 text-[#FFCDD2]';
      default:
        return 'bg-[#1D230E] border-[#525E31] text-[#D8DFC8]';
    }
  };

  return (
    <div
      className={`rounded-xl bg-[#30371A] p-4 shadow-sm border border-[#525E31] space-y-1.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-[#C2CE9F] truncate">
          {title}
        </span>
        {icon && (
          typeof icon === 'string' ? (
            <Icon name={icon} className="w-4.5 h-4.5 text-[#A4B566]" />
          ) : icon
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="font-headline-md text-headline-md text-[#F0F3E8] font-bold">
          {loading ? '—' : value}
        </div>
        {trend && (
          <span className="font-mono text-xs text-[#A4B566] flex items-center">
            {trend}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        {subtext && (
          <span className="font-body-sm text-body-sm text-[#AAB596] truncate">
            {subtext}
          </span>
        )}
        {badge && (
          <span
            className={`inline-flex px-2 py-0.5 rounded border font-label-sm text-label-sm font-semibold truncate ${getBadgeStyles()}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
