import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import avatarImg from '../assets/avatar.webp';

export const TopNavBar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-surface/70 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center h-14 px-6 max-w-[1440px] mx-auto">
        <Link to="/" className="text-xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: COLORS.primary }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
          ClinicianMind AI
        </Link>

        <nav className="flex items-center gap-5">
          <Link to="/library" className="text-sm text-slate-secondary hover:text-primary transition-colors">
            Library
          </Link>
          
          <Link to="/chat?new=true" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:opacity-90 transition-all shadow-sm" style={{ backgroundColor: COLORS.primary, color: COLORS.onPrimary }}>
            <span className="material-symbols-outlined text-[16px]">chat</span>
            Consultation
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Profile Settings">
                <img
                  alt="Profile"
                  src={avatarImg}
                  className="h-8 w-8 rounded-full border object-cover"
                  style={{ borderColor: `${COLORS.outlineVariant}66` }}
                />
                <span className="hidden md:inline text-xs font-semibold" style={{ color: COLORS.slatePrimary }}>
                  {user?.full_name?.split(' ')[0] || 'Clinician'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1 text-slate-secondary hover:text-error transition-colors"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="text-xs font-semibold px-3 py-1.5 rounded-full border hover:bg-surface-container-low transition-colors"
              style={{ borderColor: `${COLORS.outlineVariant}88`, color: COLORS.primary }}
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
