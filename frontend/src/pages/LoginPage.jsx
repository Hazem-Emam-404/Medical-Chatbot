import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { AuthInput } from '../components/AuthInput';
import { COLORS } from '../constants';
import { validateEmail, validatePassword } from '../utils/validators';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
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
    
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      await login({
        email: form.email,
        password: form.password,
      });
      navigate('/chat');
    } catch (err) {
      setServerError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="ClinicianMind AI" subtitle="Secure access for clinical professionals">
      {serverError && (
        <div 
          className="mb-5 p-3 rounded-lg text-sm border font-medium flex items-center gap-2"
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

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold" style={{ color: COLORS.onSurface }} htmlFor="password">Password</label>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: errors.password ? COLORS.error : COLORS.outline }}>lock</span>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-white transition-all text-base auth-input"
              style={{ borderColor: errors.password ? COLORS.error : COLORS.outlineVariant, color: COLORS.onSurface }}
            />
          </div>
          {errors.password && (
            <p className="text-xs mt-1 font-medium" style={{ color: COLORS.error }}>
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 rounded-full text-white text-sm font-semibold hover:-translate-y-[2px] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.surfaceTint})`, boxShadow: `0 4px 14px ${COLORS.primary}33` }}
        >
          {isSubmitting ? 'Signing In...' : 'Login'}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </form>

      <div className="mt-8 text-center border-t pt-6" style={{ borderColor: `${COLORS.outlineVariant}4D` }}>
        <p className="text-sm" style={{ color: COLORS.secondary }}>
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold hover:underline" style={{ color: COLORS.primary }}>Sign up</Link>
        </p>
      </div>
    </AuthLayout>
  );
};
