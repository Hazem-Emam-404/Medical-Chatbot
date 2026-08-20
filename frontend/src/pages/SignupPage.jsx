import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { AuthInput } from '../components/AuthInput';
import { COLORS } from '../constants';
import { validateEmail, validatePassword, validateFullName, validateConfirmPassword } from '../utils/validators';
import { useAuth } from '../context/AuthContext';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setServerError('');
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullNameError = validateFullName(form.fullName);
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);
    const confirmPasswordError = validateConfirmPassword(form.password, form.confirmPassword);

    if (fullNameError || emailError || passwordError || confirmPasswordError) {
      setErrors({ 
        fullName: fullNameError, 
        email: emailError, 
        password: passwordError, 
        confirmPassword: confirmPasswordError 
      });
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      await signup({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      navigate('/chat');
    } catch (err) {
      setServerError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join ClinicianMind AI for evidence-based decision support">
      {serverError && (
        <div 
          className="mb-4 p-3 rounded-lg text-sm border font-medium flex items-center gap-2"
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.08)', 
            borderColor: `${COLORS.confidenceLow}55`, 
            color: COLORS.confidenceLow 
          }}
        >
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{serverError}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <AuthInput
          id="fullName"
          label="Full Name"
          type="text"
          placeholder="Dr. Jane Smith"
          icon="person"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
        />
        <AuthInput
          id="email"
          label="Email Address"
          type="email"
          placeholder="dr.smith@hospital.org"
          icon="mail"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <AuthInput
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          icon="lock"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <AuthInput
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon="lock"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 rounded-full text-white text-sm font-semibold hover:-translate-y-[2px] transition-all shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.surfaceTint})`, boxShadow: `0 4px 14px ${COLORS.primary}33` }}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </form>

      <div className="mt-6 text-center border-t pt-5" style={{ borderColor: `${COLORS.outlineVariant}4D` }}>
        <p className="text-sm" style={{ color: COLORS.secondary }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: COLORS.primary }}>Login</Link>
        </p>
      </div>
    </AuthLayout>
  );
};
