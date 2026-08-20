import React from 'react';
import { COLORS } from '../constants';
import avatarImg from '../assets/avatar.webp';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col antialiased relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F0F7FF 0%, #ffffff 100%)' }}>
      {/* Decorative blurred circles */}
      <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full blur-3xl opacity-50 z-0" style={{ backgroundColor: COLORS.surfaceContainerHigh }} />
      <div className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] rounded-full blur-3xl opacity-40 z-0" style={{ backgroundColor: COLORS.surfaceContainerHigh }} />

      <main className="flex-1 flex items-center justify-center p-4 md:p-6 relative z-10">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 md:p-10 relative mt-14">
          {/* Avatar */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center p-1" style={{ border: `1px solid ${COLORS.outlineVariant}` }}>
            <img className="w-full h-full object-cover rounded-full" src={avatarImg} alt="ClinicianMind AI" />
          </div>

          {/* Header */}
          <div className="text-center mt-12 mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.primary }}>{title}</h1>
            <p className="text-base" style={{ color: COLORS.secondary }}>{subtitle}</p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};
