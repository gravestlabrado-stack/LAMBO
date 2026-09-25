import React from 'react';

export default function Card({
  children,
  className = '',
  variant = 'default',
  hoverable = false,
  onClick,
  ...props
}) {
  const variants = {
    default: 'bg-[#30371A] border-[#525E31]',
    dark: 'bg-[#1D230E] border-[#525E31]',
    surface: 'bg-[#262C14] border-[#5D6A37]',
    highlight: 'bg-[#3A4320] border-[#8B9B4C]',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border shadow-sm p-4 transition-all ${
        variants[variant] || variants.default
      } ${
        hoverable
          ? 'cursor-pointer hover:border-[#8B9B4C] hover:shadow-md active:bg-[#38411F]'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
