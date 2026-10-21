import React from 'react';

export function Container({
  children,
  className = '',
  size = 'default',
  as: Component = 'div',
  ...props
}) {
  const sizes = {
    narrow: 'max-w-4xl',
    default: 'max-w-6xl',
    wide: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <Component
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${sizes[size] || sizes.default} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

