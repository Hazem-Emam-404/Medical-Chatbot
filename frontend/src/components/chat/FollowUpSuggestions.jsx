import React from "react";
import { COLORS } from "../../constants";

export const FollowUpSuggestions = ({ items = [], onSelect }) => {
  const safeItems = Array.isArray(items)
    ? items.filter((it) => typeof it === "string" && it.trim())
    : [];

  if (!safeItems.length) {
    return null;
  }

  return (
    <div
      className="mt-3 space-y-2 border-t pt-3"
      style={{ borderColor: `${COLORS.outlineVariant}44` }}
    >
      <p
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: COLORS.secondary }}
      >
        <span
          className="material-symbols-outlined text-[15px]"
          style={{ color: COLORS.primary }}
        >
          tips_and_updates
        </span>
        Suggested Follow-up Inquiries:
      </p>

      <div className="flex flex-wrap gap-2">
        {safeItems.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect && onSelect(item)}
            className="group flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all hover:bg-primary/5 hover:border-primary hover:-translate-y-0.5 shadow-2xs"
            style={{
              borderColor: `${COLORS.primary}44`,
              color: COLORS.primary,
              backgroundColor: COLORS.surfaceContainerLow,
            }}
            title="Click to ask this follow-up inquiry"
          >
            <span>{item}</span>
            <span className="material-symbols-outlined text-[13px] text-primary/60 group-hover:text-primary transition-colors">
              arrow_forward
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
