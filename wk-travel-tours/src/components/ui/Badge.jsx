import React from 'react';

export function Badge({
  children,
  variant = 'gold',
  size = 'md',
  className = '',
}) {
  const baseStyles = 'inline-flex items-center uppercase tracking-wider font-semibold rounded';

  const variants = {
    gold: 'bg-amber-50 text-amber-900 border border-amber-200',
    teal: 'bg-teal-50 text-[#087E83] border border-teal-200',
    navy: 'bg-[#F3F6F8] text-[#10263D] border border-[#E1E7EB]',
    neutral: 'bg-[#F3F6F8] text-[#10263D] border border-[#E1E7EB]',
    accent: 'bg-teal-50 text-[#087E83] border border-teal-200',
    dark: 'bg-[#10263D] text-white border border-[#10263D]',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`${baseStyles} ${variants[variant] || variants.gold} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
}
