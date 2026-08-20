import React, { useEffect } from "react";
import { COLORS } from "../constants";

export const ConfirmModal = ({
  isOpen,
  title = "Delete Consultation",
  message = "Are you sure you want to delete this consultation? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl transition-all animate-scaleIn"
        style={{ borderColor: `${COLORS.outlineVariant}66` }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: isDestructive
                ? "rgba(239, 68, 68, 0.12)"
                : COLORS.iceBlue,
              color: isDestructive ? COLORS.confidenceLow : COLORS.primary,
            }}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isDestructive ? "delete" : "help"}
            </span>
          </div>

          <div className="flex-1">
            <h3
              className="text-base font-bold md:text-lg"
              style={{ color: COLORS.slatePrimary }}
            >
              {title}
            </h3>
            <p
              className="mt-1 text-xs leading-relaxed md:text-sm"
              style={{ color: COLORS.slateSecondary }}
            >
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4" style={{ borderColor: `${COLORS.outlineVariant}44` }}>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-surface-container-low"
            style={{
              borderColor: `${COLORS.outlineVariant}88`,
              color: COLORS.secondary,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
            style={{
              backgroundColor: isDestructive ? COLORS.confidenceLow : COLORS.primary,
            }}
          >
            {isDestructive && (
              <span className="material-symbols-outlined text-[16px]">delete</span>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
