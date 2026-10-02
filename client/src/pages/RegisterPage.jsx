import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Icon from '../components/common/Icon';

// Preliminary degree programs (can be expanded once final departmental list is provided)
const COURSE_PRESETS = [
  'BS Forestry',
  'BS Agriculture',
  'BS Information Technology',
  'BS Agricultural and Biosystems Engineering',
  'BS Fisheries',
  'Bachelor of Secondary Education',
  'Other / Custom Degree',
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(COURSE_PRESETS[0]);
  const [customCourse, setCustomCourse] = useState('');
  const [password, setPassword] = useState('');
  const [showStaffSection, setShowStaffSection] = useState(false);
  const [officerPasscode, setOfficerPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const finalCourse =
      selectedCourse === 'Other / Custom Degree'
        ? customCourse.trim()
        : selectedCourse;

    try {
      await register({
        name,
        rollNumber,
        phone: phone.trim(),
        course: finalCourse,
        password,
        officerPasscode: showStaffSection ? officerPasscode.trim() : '',
      });
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Registration failed. Please check your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D230E] flex items-center justify-center p-4 selection:bg-[#8B9B4C] selection:text-[#1D230E]">
      <div className="w-full max-w-md rounded-2xl bg-[#262C14] border border-[#4F5A2D] p-6 shadow-2xl relative overflow-hidden">
        {/* Brand & Header */}
        <div className="text-center mb-5 relative z-10">
          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-[#30371A] border border-[#5D6A37] flex items-center justify-center shadow-md">
            <img
              src="/lambo-logo.svg"
              alt="LAMBO Logo"
              className="w-9 h-9 object-contain"
            />
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
          <div className="rounded-xl bg-[#431B1B] border border-[#E57373] text-[#FFCDD2] p-3 text-xs mb-4 flex items-center gap-2 font-mono">
            <Icon name="error" className="text-[#FFCDD2] w-4.5 h-4.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
          {/* Full Name */}
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

          {/* Roll / Student ID */}
          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase tracking-wider mb-1 font-medium">
              Roll / Student Number *
            </label>
            <input
              type="text"
              placeholder="e.g. 2024-BSAB-001"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] focus:ring-1 focus:ring-[#A4B566] transition-colors uppercase"
              required
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase tracking-wider mb-1 font-medium">
              Contact Phone Number <span className="text-[#8B9B70] lowercase">(optional)</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. +63 912 345 6789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] focus:ring-1 focus:ring-[#A4B566] transition-colors"
            />
          </div>

          {/* Academic Course Dropdown */}
          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase tracking-wider mb-1 font-medium">
              Academic Course / Degree *
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] transition-colors"
            >
              {COURSE_PRESETS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Custom Course Write-in if "Other" is selected */}
            {selectedCourse === 'Other / Custom Degree' && (
              <input
                type="text"
                placeholder="Enter your exact degree program..."
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] mt-2 animate-in fade-in"
                required
              />
            )}
          </div>

          {/* Password */}
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

          {/* Staff / Officer Passcode Accordion Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowStaffSection(!showStaffSection)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-semibold transition-all flex items-center justify-between cursor-pointer ${
                showStaffSection
                  ? 'bg-[#332A14] border-[#F5C26B] text-[#F5C26B] shadow-md'
                  : 'bg-[#242A13] hover:bg-[#2F3719] border-[#D99B26]/40 hover:border-[#D99B26] text-[#E8C274]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon
                  name="military_tech"
                  className={`w-4 h-4 shrink-0 ${showStaffSection ? 'text-[#F5C26B]' : 'text-[#E8C274]'}`}
                />
                <span className="font-bold">NSTP Officer / Staff?</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border transition-colors shrink-0 ml-2 ${
                showStaffSection
                  ? 'bg-[#F5C26B]/20 border-[#F5C26B] text-[#F5C26B]'
                  : 'bg-[#1D230E] border-[#525E31] text-[#AAB596]'
              }`}>
                {showStaffSection ? 'Hide' : 'Enter Key'}
              </span>
            </button>

            {showStaffSection && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#1D230E] border border-[#D99B26]/50 space-y-1.5 animate-in fade-in">
                <label className="block text-[11px] font-mono text-[#F5C26B] uppercase tracking-wider font-semibold">
                  Officer Security Passcode
                </label>
                <input
                  type="password"
                  placeholder="Enter staff authorization key..."
                  value={officerPasscode}
                  onChange={(e) => setOfficerPasscode(e.target.value)}
                  className="w-full h-10 bg-[#262C14] border border-[#525E31] rounded-lg px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#F5C26B]"
                />
                <p className="text-[10px] font-mono text-[#AAB596]">
                  Leave empty if you are a student cadet. Officers gain access to the Command Portal.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-[0.98] transition-all text-[#1F240F] font-mono text-sm font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <Icon name="person_add" className="w-5 h-5" />
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-4 text-center relative z-10">
          <Link
            to="/login"
            className="text-xs text-[#AAB596] hover:text-[#A4B566] transition-colors inline-flex items-center gap-1 font-mono"
          >
            <Icon name="arrow_back" className="w-3.5 h-3.5" />
            Already enrolled? Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}
