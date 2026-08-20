import React from 'react';
import { COLORS } from '../constants';

export const AuthInput = ({ id, label, type = 'text', placeholder, icon, required = true, value, onChange, error }) => {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.onSurface }} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: error ? COLORS.error : COLORS.outline }}>
          {icon}
        </span>
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-3 rounded-lg border bg-white transition-all text-base auth-input"
          style={{ borderColor: error ? COLORS.error : COLORS.outlineVariant, color: COLORS.onSurface }}
        />
      </div>
      {error && (
        <p className="text-xs mt-1 font-medium" style={{ color: COLORS.error }}>
          {error}
        </p>
      )}
    </div>
  );
};
