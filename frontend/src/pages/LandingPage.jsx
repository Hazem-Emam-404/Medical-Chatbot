import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TopNavBar } from "../components/TopNavBar";
import { COLORS } from "../constants";
import { useTypingEffect } from "../hooks/useTypingEffect";
import avatarImg from "../assets/avatar.webp";

export const LandingPage = () => {
  const dynamicSubtitle = useTypingEffect(
    "Hello! I'm your AI clinical assistant. Ask me evidence-based questions powered by WHO & NICE guidelines.",
    35,
    400,
  );

  return (
    <div className="bg-surface text-on-surface antialiased h-screen flex flex-col gradient-mesh overflow-hidden">
      <TopNavBar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6">
        <section className="flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="w-36 h-36 md:w-44 md:h-44 mb-6 rounded-full bg-ice-blue border border-outline-variant/30 shadow-md flex items-center justify-center overflow-hidden relative"
          >
            <img
              alt="AI Robot Assistant"
              className="w-full h-full object-cover"
              src={avatarImg}
            />
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-surface-container-high rounded-full blur-xl opacity-60" />
            <div
              className="absolute -bottom-3 -left-3 w-12 h-12 rounded-full blur-xl opacity-40"
              style={{ backgroundColor: COLORS.primaryFixedDim }}
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: COLORS.slatePrimary }}
          >
            AI Clinical Decision Support
          </motion.h1>

          {/* Typing subtitle */}
          <p
            className="text-base md:text-lg mb-8 leading-relaxed min-h-[52px] max-w-xl"
            style={{ color: COLORS.slateSecondary }}
          >
            {dynamicSubtitle}
            <span
              className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
              style={{ backgroundColor: COLORS.primary }}
            />
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/chat?new=true"
              className="px-7 py-3 rounded-full font-semibold text-sm hover:-translate-y-0.5 transition-all flex items-center gap-2"
              style={{
                backgroundColor: COLORS.primary,
                color: COLORS.onPrimary,
                boxShadow: "0 0 20px rgba(37,99,235,0.3)",
              }}
            >
              Start Chatting
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
            <Link
              to="/login"
              className="px-7 py-3 rounded-full font-semibold text-sm transition-all flex items-center gap-2"
              style={{
                color: COLORS.primary,
                border: `1.5px solid ${COLORS.primary}33`,
                backgroundColor: "rgba(249,249,255,0.5)",
              }}
            >
              Login / Sign Up
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Inline compact footer */}
      <footer className="py-3 text-center border-t border-outline-variant/30">
        <p className="text-xs" style={{ color: COLORS.slateSecondary }}>
          © 2026 ClinicianMind AI · For educational purposes only · Not a
          substitute for professional medical advice
        </p>
      </footer>
    </div>
  );
};
