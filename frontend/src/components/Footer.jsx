import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant w-full py-8 mt-auto">
      <div className="flex flex-col items-center justify-center gap-4 px-margin-desktop max-w-max-width-content mx-auto">
        <div className="font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
          ClinicianMind AI
        </div>
        <nav className="flex flex-wrap justify-center gap-4 md:gap-8 mt-2">
          <a className="text-sm text-slate-secondary hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="text-sm text-slate-secondary hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="text-sm text-slate-secondary hover:text-primary transition-colors" href="#">Security Whitepaper</a>
          <a className="text-sm text-slate-secondary hover:text-primary transition-colors" href="#">Contact Support</a>
        </nav>
        <p className="text-sm text-slate-secondary mt-4 text-center">
          © 2026 ClinicianMind AI. HIPAA Compliant.
        </p>
      </div>
    </footer>
  );
};
