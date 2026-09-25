import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [course, setCourse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, rollNumber, password, course });
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D230E] flex items-center justify-center p-4 selection:bg-[#8B9B4C] selection:text-[#1D230E]">
      <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#4F5A2D] p-6 shadow-2xl relative overflow-hidden">
        {/* Brand & Header */}
        <div className="text-center mb-5 relative z-10">
          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-[#30371A] border border-[#5D6A37] flex items-center justify-center shadow-md">
            <img src="/lambo-logo.svg" alt="LAMBO Logo" className="w-9 h-9 object-contain" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1D230E] border border-[#525E31] text-[#A4B566] text-[11px] font-mono font-semibold uppercase tracking-wider mb-1">
            Cadet Enrollment
          </div>
          <h2 className="font-display font-bold text-xl text-[#F0F3E8]">
            Create Student Profile
          </h2>
          <p className="text-xs text-[#AAB596] mt-0.5">
            Join the campus botanical observation initiative
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[#431B1B] border border-[#E57373] text-[#FFCDD2] p-3 text-xs mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase tracking-wider mb-1 font-medium">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Elena Rostova"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] focus:ring-1 focus:ring-[#A4B566] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase tracking-wider mb-1 font-medium">
              Roll / Student Number *
            </label>
            <input
              type="text"
              placeholder="e.g. 2024-BSAB-001"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] focus:ring-1 focus:ring-[#A4B566] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase tracking-wider mb-1 font-medium">
              Academic Course / Degree
            </label>
            <input
              type="text"
              placeholder="e.g. BS Forestry / BS Biology"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] focus:ring-1 focus:ring-[#A4B566] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase tracking-wider mb-1 font-medium">
              Password (min. 6 chars) *
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] focus:ring-1 focus:ring-[#A4B566] transition-colors"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-[0.98] transition-all text-[#1F240F] font-mono text-sm font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-4 text-center relative z-10">
          <Link
            to="/login"
            className="text-xs text-[#AAB596] hover:text-[#A4B566] transition-colors inline-flex items-center gap-1 font-mono"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Already enrolled? Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}
