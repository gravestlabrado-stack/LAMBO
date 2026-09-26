import React, { forwardRef } from 'react';
import Icon from '../common/Icon';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon,
    iconRight,
    className = '',
    type = 'text',
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return (
        <span className="absolute left-3 text-[#8B9B4C] pointer-events-none flex items-center justify-center">
          <Icon name={icon} className="w-4.5 h-4.5" />
        </span>
      );
    }
    return <span className="absolute left-3 text-[#8B9B4C] pointer-events-none">{icon}</span>;
  };

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
          {label} {required && <span className="text-[#E57373]">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {renderIcon()}

        <input
          ref={ref}
          type={type}
          disabled={disabled}
          required={required}
          className={`w-full h-11 bg-[#1D230E] border rounded-xl text-sm font-sans text-[#F0F3E8] placeholder:text-[#65734A] focus:outline-none transition-colors ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${iconRight ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-[#E57373] focus:border-[#E57373] focus:ring-1 focus:ring-[#E57373]'
              : 'border-[#525E31] focus:border-[#A4B566] focus:ring-1 focus:ring-[#A4B566]'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-[#171B0B]' : ''} ${className}`}
          {...props}
        />

        {iconRight && (
          <div className="absolute right-3 flex items-center">{iconRight}</div>
        )}
      </div>

      {error && (
        <p className="text-[11px] font-mono text-[#E57373] flex items-center gap-1">
          <Icon name="error" className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      )}

      {helperText && !error && (
        <p className="text-[11px] font-mono text-[#AAB596]">{helperText}</p>
      )}
    </div>
  );
});

export default Input;
