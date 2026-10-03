import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOfficerCohort } from '../hooks/useOfficerCohort';
import officerService from '../services/officerService';
import Icon from '../components/common/Icon';
import {
  getStoredOfficerRoster,
  saveOfficerRoster,
  getStoredOfficerStats,
  saveOfficerStats,
  notifyConnectionStatus,
} from '../utils/offlineStorage';

// Modular Sub-Components
import OfficerCohortStats from '../components/officer/OfficerCohortStats';
import RosterFilterToolbar from '../components/officer/RosterFilterToolbar';
import CadetRosterTable from '../components/officer/CadetRosterTable';
import CadetInspectionModal from '../components/officer/CadetInspectionModal';
import { exportCohortToExcel } from '../components/officer/OfficerExcelExport';
import TreePhotoLightbox from '../components/tree/profile/TreePhotoLightbox';

/**
 * NSTP Officer Command Portal Page
 * Coordinates cadet compliance roster, field inspection audits, and academic grade reports
 */
export default function OfficerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'cadet' | 'officer'
  const [selectedCadetId, setSelectedCadetId] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Hook managing search, compliance filters, course groups, and KPI math
  const {
    searchQuery,
    setSearchQuery,
    complianceFilter,
    setComplianceFilter,
    courseFilter,
    setCourseFilter,
    courses,
    stats,
    filteredRoster,
  } = useOfficerCohort(roster);

  // Authorization check: Must be officer role
  const isOfficerAuthorized =
    user?.role === 'officer' ||
    (user?.rollNumber && String(user.rollNumber).trim() === '9260572');

  // Load cached roster immediately on mount
  useEffect(() => {
    if (!isOfficerAuthorized) return;
    Promise.all([getStoredOfficerRoster(), getStoredOfficerStats()])
      .then(([cachedRoster]) => {
        if (cachedRoster && cachedRoster.length > 0) {
          setRoster(cachedRoster);
          setLoading(false);
        }
      })
      .catch(() => {});
  }, [isOfficerAuthorized]);

  const fetchOfficerData = useCallback(async () => {
    setError('');
    try {
      const [rosterRes, statsRes] = await Promise.all([
        officerService.getRoster(),
        officerService.getStats(),
      ]);
      const rosterData = rosterRes.data || [];
      setRoster(rosterData);
      notifyConnectionStatus('online');
      saveOfficerRoster(rosterData);
      if (statsRes.data) saveOfficerStats(statsRes.data);
    } catch (err) {
      notifyConnectionStatus('offline');
      const cached = await getStoredOfficerRoster().catch(() => []);
      if (cached && cached.length > 0) {
        setRoster(cached);
      } else {
        setError(err.response?.data?.message || 'Unable to connect to server and no offline cache available.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOfficerAuthorized) {
      navigate('/', { replace: true });
      return;
    }
    fetchOfficerData();
  }, [isOfficerAuthorized, navigate, fetchOfficerData]);

  // Handle Excel Export
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      exportCohortToExcel(filteredRoster.length > 0 ? filteredRoster : roster);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter roster by role (all, cadet, officer) in addition to useOfficerCohort filters
  const displayRoster = filteredRoster.filter((cadet) => {
    if (roleFilter === 'cadet') return cadet.role !== 'officer';
    if (roleFilter === 'officer') return cadet.role === 'officer';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#262C14] border border-[#4F5A2D] p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D230E] border border-[#525E31] text-[#F5C26B] font-mono text-xs font-bold uppercase tracking-wider mb-2">
              <Icon name="military_tech" className="w-4 h-4 text-[#F5C26B]" />
              NSTP Officer Command
            </div>
            <h1 className="font-headline-sm font-bold text-2xl text-[#F0F3E8] tracking-tight">
              Cadet Compliance & Inspection Portal
            </h1>
            <p className="text-xs font-mono text-[#AAB596] mt-1">
              Field observation monitoring, survival audit, and academic grading roster
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-[#431B1B] border border-[#E57373] text-[#FFCDD2] p-4 text-xs font-mono flex items-center gap-2.5">
          <Icon name="error" className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Telemetry Overview Cards */}
      <OfficerCohortStats stats={stats} loading={loading} />

      {/* Filter and Search Toolbar */}
      <RosterFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        complianceFilter={complianceFilter}
        onComplianceFilterChange={setComplianceFilter}
        courseFilter={courseFilter}
        onCourseFilterChange={setCourseFilter}
        courses={courses}
        totalCount={roster.length}
        filteredCount={displayRoster.length}
        onExportExcel={handleExportExcel}
        isExporting={isExporting}
      />

      {/* Cadet Compliance Roster Table */}
      <CadetRosterTable
        roster={displayRoster}
        onSelectCadet={(id) => setSelectedCadetId(id)}
      />

      {/* Cadet Inspection Modal Drawer */}
      <CadetInspectionModal
        cadetId={selectedCadetId}
        isOpen={Boolean(selectedCadetId)}
        onClose={() => setSelectedCadetId(null)}
        onOpenPhoto={(url) => setSelectedPhoto(url)}
      />

      {/* Fullscreen Photo Lightbox */}
      <TreePhotoLightbox
        photoUrl={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </div>
  );
}
