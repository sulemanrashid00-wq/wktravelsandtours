import React from 'react';

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E83] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded select-none';

  const variants = {
    primary:
      'bg-[#087E83] text-white hover:bg-[#06676B] active:bg-[#055154] border border-[#087E83] shadow-sm',
    dark:
      'bg-[#10263D] text-white hover:bg-[#0C1C2E] active:bg-[#07121F] border border-[#10263D] shadow-sm',
    gold:
      'bg-[#D97706] text-white font-semibold hover:bg-[#B45309] border border-[#D97706] shadow-sm',
    outline:
      'bg-white text-[#10263D] hover:bg-[#F3F6F8] border border-[#E1E7EB] active:bg-[#E1E7EB]',
    ghost:
      'bg-transparent text-[#10263D] hover:bg-[#F3F6F8] active:bg-[#E1E7EB]',
    whatsapp:
      'bg-[#128C7E] text-white hover:bg-[#075E54] border border-[#128C7E] shadow-sm',
    destructive:
      'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] border border-[#DC2626] shadow-sm',
  };

  const sizes = {
    sm: 'text-xs min-h-[36px] px-3 py-1.5 gap-1.5',
    md: 'text-sm min-h-[44px] px-4 py-2.5 gap-2',
    lg: 'text-base min-h-[48px] px-6 py-3 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
