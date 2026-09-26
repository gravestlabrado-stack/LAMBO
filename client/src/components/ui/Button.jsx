import React from 'react';
import Icon from '../common/Icon';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider rounded-xl transition-all select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

  const variants = {
    primary:
      'bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] shadow-md border border-[#A4B566]/40',
    secondary:
      'bg-[#30371A] hover:bg-[#3D4721] text-[#F0F3E8] border border-[#525E31] shadow-sm',
    outline:
      'bg-transparent hover:bg-[#30371A] text-[#A4B566] border border-[#8B9B4C]',
    danger:
      'bg-[#431B1B] hover:bg-[#5A2424] text-[#FFCDD2] border border-[#E57373]/50',
    ghost:
      'bg-transparent hover:bg-[#30371A] text-[#D8DFC8] border border-transparent',
  };

  const sizes = {
    sm: 'h-8 px-3 text-[11px] gap-1.5',
    md: 'h-10 px-4 text-xs gap-2',
    lg: 'h-12 px-6 text-sm gap-2.5',
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <Icon name={icon} className="w-4 h-4" />;
    }
    return icon;
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && renderIcon()}
          <span>{children}</span>
          {icon && iconPosition === 'right' && renderIcon()}
        </>
      )}
    </button>
  );
}
