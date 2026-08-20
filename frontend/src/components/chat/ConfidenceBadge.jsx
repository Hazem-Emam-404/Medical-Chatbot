import React from "react";
import { COLORS } from "../../constants";

export const ConfidenceBadge = ({ status = "answered", confidence = "High" }) => {
  const normStatus = String(status || "answered").toLowerCase().trim();
  const normConf = String(confidence || "High").toLowerCase().trim();

  let config = {
    icon: "check_circle",
    isDot: true,
    label: "High Confidence",
    color: COLORS.confidenceHigh,
    bg: "rgba(16, 185, 129, 0.12)",
    note: "Official Guideline Grounding",
  };

  if (normStatus === "safety_refusal" || normConf === "safety_refusal") {
    config = {
      icon: "block",
      isDot: false,
      label: "Refused",
      color: COLORS.confidenceLow,
      bg: "rgba(239, 68, 68, 0.12)",
      note: "Safety Policy Triggered",
    };
  } else if (
    normStatus === "insufficient_evidence" ||
    normConf.includes("insufficient")
  ) {
    config = {
      icon: "warning",
      isDot: false,
      label: "Insufficient Evidence",
      color: COLORS.confidenceMedium,
      bg: "rgba(245, 158, 11, 0.12)",
      note: "Guideline Evidence Missing",
    };
  } else if (normConf.includes("low")) {
    config = {
      icon: "info",
      isDot: true,
      label: "Low Confidence",
      color: COLORS.confidenceLow,
      bg: "rgba(239, 68, 68, 0.12)",
      note: "Official Guideline Grounding",
    };
  } else if (normConf.includes("medium")) {
    config = {
      icon: "info",
      isDot: true,
      label: "Medium Confidence",
      color: COLORS.confidenceMedium,
      bg: "rgba(245, 158, 11, 0.12)",
      note: "Official Guideline Grounding",
    };
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1"
        style={{ borderColor: `${config.color}55`, backgroundColor: config.bg }}
      >
        {config.isDot ? (
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: config.color }}
          />
        ) : (
          <span
            className="material-symbols-outlined text-[15px]"
            style={{ color: config.color }}
          >
            {config.icon}
          </span>
        )}
        <span className="text-xs font-semibold" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>
      {config.note && (
        <span className="text-xs" style={{ color: COLORS.slateSecondary }}>
          {config.note}
        </span>
      )}
    </div>
  );
};
