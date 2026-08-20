import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import avatarImg from "../assets/avatar.webp";
import { COLORS } from "../constants";
import { useAuth } from "../context/AuthContext";
import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
} from "../utils/validators";

const initialErrors = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, updateProfile, logout } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [initialProfile, setInitialProfile] = useState({
    fullName: "",
    email: "",
  });
  const [errors, setErrors] = useState(initialErrors);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/");
      return;
    }

    if (user) {
      const current = {
        fullName: user.full_name || "",
        email: user.email || "",
      };
      setForm((prev) => ({
        ...prev,
        fullName: current.fullName,
        email: current.email,
      }));
      setInitialProfile(current);
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  const isPasswordEdit =
    form.password.length > 0 || form.confirmPassword.length > 0;

  const isDirty = useMemo(() => {
    return (
      form.fullName !== initialProfile.fullName ||
      form.email !== initialProfile.email ||
      form.password.length > 0 ||
      form.confirmPassword.length > 0
    );
  }, [form, initialProfile]);

  const validateForm = () => {
    const nextErrors = { ...initialErrors };

    nextErrors.fullName = validateFullName(form.fullName);
    nextErrors.email = validateEmail(form.email);

    if (isPasswordEdit) {
      nextErrors.password = validatePassword(form.password);
      nextErrors.confirmPassword = validateConfirmPassword(
        form.password,
        form.confirmPassword,
      );
    }

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setStatus({ type: "", message: "" });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setStatus({
        type: "error",
        message: "Please fix the highlighted fields.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
      };

      if (form.password) {
        payload.newPassword = form.password;
      }

      const updated = await updateProfile(payload);

      setInitialProfile({
        fullName: updated.full_name,
        email: updated.email,
      });
      setForm((prev) => ({
        ...prev,
        fullName: updated.full_name,
        email: updated.email,
        password: "",
        confirmPassword: "",
      }));
      setErrors(initialErrors);
      setStatus({ type: "success", message: "Profile updated successfully." });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Unable to save profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const statusStyles = {
    success: {
      color: COLORS.confidenceHigh,
      borderColor: `${COLORS.confidenceHigh}55`,
      backgroundColor: "rgba(16, 185, 129, 0.1)",
    },
    error: {
      color: COLORS.confidenceLow,
      borderColor: `${COLORS.confidenceLow}55`,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
    },
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <p className="text-sm font-medium" style={{ color: COLORS.secondary }}>Loading clinician profile...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: COLORS.background }}
    >
      <header
        className="border-b px-4 py-3 md:px-6"
        style={{
          borderColor: `${COLORS.outlineVariant}66`,
          backgroundColor: COLORS.surface,
        }}
      >
        <div className="mx-auto flex w-full max-w-[980px] items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link
              to="/chat"
              className="text-xl font-bold"
              style={{ color: COLORS.primary }}
            >
              ClinicianMind AI
            </Link>
            <Link
              to="/library"
              className="hidden text-sm md:block"
              style={{ color: COLORS.secondary }}
            >
              Library
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:bg-error-container hover:text-error"
              style={{ borderColor: `${COLORS.outlineVariant}66`, color: COLORS.secondary }}
            >
              Sign Out
            </button>
            <img
              alt="Profile"
              src={avatarImg}
              className="h-9 w-9 rounded-full border object-cover"
              style={{ borderColor: `${COLORS.outlineVariant}66` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[980px] px-4 py-8 md:px-6 md:py-10">
        <section
          className="rounded-2xl border p-5 md:p-8"
          style={{
            borderColor: `${COLORS.outlineVariant}66`,
            backgroundColor: COLORS.surfaceContainerLowest,
          }}
        >
          <div className="mb-6 flex items-center gap-4">
            <img
              alt="Clinician avatar"
              src={avatarImg}
              className="h-16 w-16 rounded-full border object-cover"
              style={{ borderColor: `${COLORS.outlineVariant}66` }}
            />
            <div>
              <h1
                className="text-xl font-semibold md:text-2xl"
                style={{ color: COLORS.slatePrimary }}
              >
                Profile Settings
              </h1>
              <p className="text-sm" style={{ color: COLORS.slateSecondary }}>
                Manage your account credentials and personal details.
              </p>
            </div>
          </div>

          {status.message ? (
            <div
              className="mb-5 rounded-lg border px-3 py-2 text-sm flex items-center gap-2"
              style={status.type ? statusStyles[status.type] : undefined}
            >
              <span className="material-symbols-outlined text-[18px]">
                {status.type === "success" ? "check_circle" : "error"}
              </span>
              <span>{status.message}</span>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                className="mb-1 block text-sm font-semibold"
                htmlFor="fullName"
                style={{ color: COLORS.onSurface }}
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full rounded-lg border px-3 py-2.5 text-sm md:text-base bg-white"
                style={{
                  borderColor: errors.fullName
                    ? COLORS.error
                    : COLORS.outlineVariant,
                  color: COLORS.onSurface,
                }}
                placeholder="Dr. Jane Smith"
              />
              {errors.fullName ? (
                <p className="mt-1 text-xs" style={{ color: COLORS.error }}>
                  {errors.fullName}
                </p>
              ) : null}
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-semibold"
                htmlFor="email"
                style={{ color: COLORS.onSurface }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border px-3 py-2.5 text-sm md:text-base bg-white"
                style={{
                  borderColor: errors.email
                    ? COLORS.error
                    : COLORS.outlineVariant,
                  color: COLORS.onSurface,
                }}
                placeholder="dr.smith@hospital.org"
              />
              {errors.email ? (
                <p className="mt-1 text-xs" style={{ color: COLORS.error }}>
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: `${COLORS.outlineVariant}66`,
                backgroundColor: COLORS.surfaceContainerLow,
              }}
            >
              <p
                className="mb-3 text-sm font-semibold"
                style={{ color: COLORS.slatePrimary }}
              >
                Change Password (Optional)
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    className="mb-1 block text-sm font-semibold"
                    htmlFor="password"
                    style={{ color: COLORS.onSurface }}
                  >
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm md:text-base bg-white"
                    style={{
                      borderColor: errors.password
                        ? COLORS.error
                        : COLORS.outlineVariant,
                      color: COLORS.onSurface,
                    }}
                    placeholder="Minimum 6 characters"
                  />
                  {errors.password ? (
                    <p className="mt-1 text-xs" style={{ color: COLORS.error }}>
                      {errors.password}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm font-semibold"
                    htmlFor="confirmPassword"
                    style={{ color: COLORS.onSurface }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm md:text-base bg-white"
                    style={{
                      borderColor: errors.confirmPassword
                        ? COLORS.error
                        : COLORS.outlineVariant,
                      color: COLORS.onSurface,
                    }}
                    placeholder="Repeat your new password"
                  />
                  {errors.confirmPassword ? (
                    <p className="mt-1 text-xs" style={{ color: COLORS.error }}>
                      {errors.confirmPassword}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Link
                to="/chat"
                className="text-sm font-medium"
                style={{ color: COLORS.secondary }}
              >
                Back to chat
              </Link>
              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: COLORS.primary,
                  color: COLORS.onPrimary,
                }}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};
