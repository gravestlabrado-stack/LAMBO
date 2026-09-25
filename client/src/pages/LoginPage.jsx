import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  // TODO: Remove default admin/admin bypass before production
  const [rollNumber, setRollNumber] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ rollNumber, password });
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your roll number and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D230E] flex items-center justify-center p-4 selection:bg-[#8B9B4C] selection:text-[#1D230E]">
      <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#4F5A2D] p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle background radar ring accent */}
        <svg
          className="absolute -right-12 -top-12 w-44 h-44 text-[#8B9B4C]/10 pointer-events-none"
          fill="none"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="2" />
        </svg>

        {/* Brand & Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#30371A] border border-[#5D6A37] flex items-center justify-center shadow-md">
            <img src="/lambo-logo.svg" alt="LAMBO Logo" className="w-10 h-10 object-contain" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1D230E] border border-[#525E31] text-[#A4B566] text-[11px] font-mono font-semibold uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A4B566] animate-pulse"></span>
            Observation Console
          </div>
          <h2 className="font-display font-bold text-2xl text-[#F0F3E8]">
            LAMBO Student Portal
          </h2>
          <p className="text-xs text-[#AAB596] mt-1">
            Landscape Analytics for Monitoring Botanical Observation
          </p>
        </div>

        {/* Quick Demo Bypass Info Banner */}
        {/* TODO: Remove default admin/admin bypass before production */}
        <div className="mb-5 rounded-xl bg-[#30371A] border border-[#8B9B4C]/40 p-3 flex items-start gap-2.5 text-xs text-[#D8DFC8]">
          <span className="material-symbols-outlined text-[18px] text-[#A4B566] shrink-0">
            key
          </span>
          <div className="flex-1">
            <span className="font-mono font-bold text-[#A4B566] block">
              Default Demo Credentials:
            </span>
            <span className="font-mono text-[11px] text-[#F0F3E8]">
              Username: <strong>admin</strong> • Password: <strong>admin</strong>
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-[#431B1B] border border-[#E57373] text-[#FFCDD2] p-3 text-xs mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase tracking-wider mb-1.5 font-medium">
              Student / Roll Number
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#AAB596] text-[18px]">
                badge
              </span>
              <input
                type="text"
                placeholder="e.g. admin or 2024-BSAB-001"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl pl-10 pr-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] focus:ring-1 focus:ring-[#A4B566] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase tracking-wider mb-1.5 font-medium">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#AAB596] text-[18px]">
                lock
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl pl-10 pr-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] focus:ring-1 focus:ring-[#A4B566] transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-[0.98] transition-all text-[#1F240F] font-mono text-sm font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            {loading ? 'Authenticating...' : 'Authenticate & Enter'}
          </button>
        </form>

        <div className="mt-5 text-center relative z-10">
          <Link
            to="/register"
            className="text-xs text-[#AAB596] hover:text-[#A4B566] transition-colors inline-flex items-center gap-1 font-mono"
          >
            New cadet? Enroll student profile
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
