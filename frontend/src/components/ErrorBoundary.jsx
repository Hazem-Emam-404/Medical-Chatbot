import React from "react";
import { COLORS } from "../constants";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ backgroundColor: COLORS.background }}
        >
          <div
            className="max-w-md w-full rounded-2xl border p-6 shadow-lg bg-white text-center"
            style={{ borderColor: `${COLORS.outlineVariant}66` }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: COLORS.confidenceLow }}
            >
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>

            <h2 className="text-lg font-bold mb-2" style={{ color: COLORS.slatePrimary }}>
              Rendering Issue Detected
            </h2>

            <p className="text-xs leading-relaxed mb-4" style={{ color: COLORS.slateSecondary }}>
              An unexpected display error occurred while rendering the response.
            </p>

            <div
              className="p-3 rounded-lg border text-left text-xs font-mono mb-6 overflow-x-auto"
              style={{
                backgroundColor: COLORS.surfaceContainerLow,
                borderColor: `${COLORS.outlineVariant}66`,
                color: COLORS.confidenceLow,
              }}
            >
              {this.state.error?.toString() || "Unknown error"}
            </div>

            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 rounded-full text-sm font-semibold transition-all shadow-sm"
              style={{ backgroundColor: COLORS.primary, color: COLORS.onPrimary }}
            >
              Reload Consultation
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
