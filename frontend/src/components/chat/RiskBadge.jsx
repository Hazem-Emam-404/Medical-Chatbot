import React from "react";
import { COLORS } from "../../constants";

const RISK_CONFIG = {
  allowed: {
    icon: "check_circle",
    label: "Allowed",
    color: COLORS.confidenceHigh,
    bg: "rgba(16, 185, 129, 0.12)",
  },
  caution: {
    icon: "warning",
    label: "Needs Caution",
    color: COLORS.confidenceMedium,
    bg: "rgba(245, 158, 11, 0.12)",
  },
  refused: {
    icon: "block",
    label: "Refused",
    color: COLORS.confidenceLow,
    bg: "rgba(239, 68, 68, 0.12)",
  },
  safety_refusal: {
    icon: "block",
    label: "Safety Refusal",
    color: COLORS.confidenceLow,
    bg: "rgba(239, 68, 68, 0.12)",
  },
};

export const RiskBadge = ({ classification = "allowed", helperLabel }) => {
  const key = String(classification || "allowed").toLowerCase().trim();
  const config = RISK_CONFIG[key] || RISK_CONFIG.allowed;

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1"
      style={{ borderColor: `${config.color}55`, backgroundColor: config.bg }}
    >
      <span
        className="material-symbols-outlined text-[16px]"
        style={{ color: config.color }}
      >
        {config.icon}
      </span>
      <span className="text-xs font-semibold" style={{ color: config.color }}>
        {config.label}
      </span>
      {helperLabel ? (
        <span
          className="hidden md:inline text-xs"
          style={{ color: COLORS.slateSecondary }}
        >
          • {helperLabel}
        </span>
      ) : null}
    </div>
  );
};
