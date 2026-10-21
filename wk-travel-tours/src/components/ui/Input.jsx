import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  { label, error, helperText, id, className = '', ...props },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-brand-navy-800 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`w-full text-sm bg-brand-sand-50 border ${
          error ? 'border-red-600 focus:border-red-700' : 'border-brand-sand-300 focus:border-brand-navy-700'
        } rounded px-3.5 py-2.5 text-brand-navy-900 placeholder:text-brand-navy-400 focus:outline-none focus:ring-1 focus:ring-brand-navy-700 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-brand-navy-600">{helperText}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, helperText, id, rows = 4, className = '', ...props },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-brand-navy-800 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        className={`w-full text-sm bg-brand-sand-50 border ${
          error ? 'border-red-600 focus:border-red-700' : 'border-brand-sand-300 focus:border-brand-navy-700'
        } rounded px-3.5 py-2.5 text-brand-navy-900 placeholder:text-brand-navy-400 focus:outline-none focus:ring-1 focus:ring-brand-navy-700 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-brand-navy-600">{helperText}</p>}
    </div>
  );
});

