import React from 'react';

export default function Chip({
  children,
  variant = 'default',
  size = 'sm',
  icon = null,
  active = false,
  clickable = false,
  onRemove = null,
  onClick,
  className = '',
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'healthy':
      case 'Healthy':
        return 'bg-[#3A4320] border-[#5D6A37] text-[#D2DCB4]';
      case 'monitoring':
      case 'Monitoring':
        return 'bg-[#3A331A] border-[#D99B26]/60 text-[#F5C26B]';
      case 'attention':
      case 'Needs Attention':
      case 'danger':
        return 'bg-[#431B1B] border-[#E57373]/60 text-[#FFCDD2]';
      case 'filter':
        return active
          ? 'bg-[#8B9B4C] text-[#1F240F] border-[#A4B566] font-bold shadow-sm'
          : 'bg-[#30371A] text-[#D8DFC8] border-[#525E31] hover:bg-[#38411F]';
      case 'primary':
        return 'bg-[#8B9B4C]/20 border-[#8B9B4C] text-[#A4B566]';
      case 'dark':
        return 'bg-[#1D230E] border-[#525E31] text-[#D8DFC8]';
      default:
        return 'bg-[#30371A] border-[#525E31] text-[#D8DFC8]';
    }
  };

  const sizes = {
    xs: 'h-6 px-2 text-[10px] gap-1',
    sm: 'h-7 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-xs gap-2',
  };

  const Component = clickable || onClick ? 'button' : 'span';

  return (
    <Component
      type={Component === 'button' ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border font-mono font-medium transition-all select-none ${
        clickable || onClick ? 'cursor-pointer' : ''
      } ${sizes[size] || sizes.sm} ${getVariantStyles()} ${className}`}
      {...props}
    >
      {icon && (
        <span className="material-symbols-outlined text-[14px] leading-none shrink-0">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-white"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      )}
    </Component>
  );
}
