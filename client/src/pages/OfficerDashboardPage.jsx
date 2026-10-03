import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../hooks/useAuth';
import officerService from '../services/officerService';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import Icon from '../components/common/Icon';
import {
  getStoredOfficerRoster,
  saveOfficerRoster,
  getStoredOfficerStats,
  saveOfficerStats,
  getStoredCadetDetails,
  saveCadetDetails,
} from '../utils/offlineStorage';

export default function OfficerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roster, setRoster] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'cadet' | 'officer'

  // Inspection Drawer / Modal State
  const [selectedCadetId, setSelectedCadetId] = useState(null);
  const [cadetDetails, setCadetDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  // Authorization check: Must be officer or supervisor
  const isOfficerAuthorized =
    user?.role === 'officer' ||
    (user?.rollNumber && String(user.rollNumber).trim() === '9260572');

  // Load cached roster immediately on mount
  useEffect(() => {
    if (!isOfficerAuthorized) return;
    Promise.all([getStoredOfficerRoster(), getStoredOfficerStats()]).then(
      ([cachedRoster, cachedStats]) => {
        if (cachedRoster && cachedRoster.length > 0) {
          setRoster(cachedRoster);
          setStats(cachedStats);
          setLoading(false);
        }
      }
    ).catch(() => {});
  }, [isOfficerAuthorized]);

  useEffect(() => {
    if (!isOfficerAuthorized) {
      navigate('/', { replace: true });
      return;
    }

    const fetchOfficerData = async () => {
      setError('');
      try {
        const [rosterRes, statsRes] = await Promise.all([
          officerService.getRoster(),
          officerService.getStats(),
        ]);
        const rosterData = rosterRes.data || [];
        const statsData = statsRes.data || null;
        setRoster(rosterData);
        setStats(statsData);
        setIsOffline(false);
        saveOfficerRoster(rosterData);
        saveOfficerStats(statsData);
      } catch (err) {
        console.warn('[OfficerDashboard] Network error, reading from IndexedDB:', err);
        try {
          const [cachedRoster, cachedStats] = await Promise.all([
            getStoredOfficerRoster(),
            getStoredOfficerStats(),
          ]);
          if (cachedRoster && cachedRoster.length > 0) {
            setRoster(cachedRoster);
            setStats(cachedStats);
            setIsOffline(true);
            setError('');
          } else {
            setError(
              err.response?.data?.message || 'Unable to connect to server and no offline cache available.'
            );
          }
        } catch {
          setError('Failed to load officer telemetry data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOfficerData();
  }, [isOfficerAuthorized, navigate]);

  // Open cadet inspection modal with offline fallback
  const handleInspectCadet = async (cadetId) => {
    setSelectedCadetId(cadetId);
    setLoadingDetails(true);
    setCadetDetails(null);

    // 1. Check local cache first
    try {
      const cached = await getStoredCadetDetails(cadetId);
      if (cached) {
        setCadetDetails(cached);
        setLoadingDetails(false);
      }
    } catch {}

    // 2. Fetch live if online
    try {
      const res = await officerService.getCadetDetails(cadetId);
      if (res.data) {
        setCadetDetails(res.data);
        saveCadetDetails(cadetId, res.data);
      }
    } catch (err) {
      console.warn('[OfficerDashboard] Offline cadet inspect, synthesizing from roster:', err);
      // If no cached details exist, synthesize from cadet's roster row so inspect always opens offline
      setCadetDetails((prev) => {
        if (prev) return prev;
        const rosterCadet = roster.find((c) => c.id === cadetId);
        if (!rosterCadet) return null;
        return {
          cadet: rosterCadet,
          metrics: {
            totalTrees: rosterCadet.totalTrees,
            aliveTrees: rosterCadet.aliveTrees,
            deadTrees: rosterCadet.deadTrees,
            totalLogs: rosterCadet.totalLogs,
            survivalRate:
              rosterCadet.totalTrees > 0
                ? Math.round((rosterCadet.aliveTrees / rosterCadet.totalTrees) * 100)
                : 100,
          },
          trees: rosterCadet.specimens || [],
          logs: [],
        };
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Close inspection modal
  const handleCloseInspection = () => {
    setSelectedCadetId(null);
    setCadetDetails(null);
    setSelectedPhotoModal(null);
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter((cadet) => {
      // 1. Role filter (all / cadet / officer)
      if (roleFilter === 'cadet' && cadet.role === 'officer') return false;
      if (roleFilter === 'officer' && cadet.role !== 'officer') return false;

      // 2. Search query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cadet.name?.toLowerCase().includes(q) ||
        cadet.rollNumber?.toLowerCase().includes(q) ||
        cadet.course?.toLowerCase().includes(q);

      // 3. Compliance filter
      const matchesFilter =
        complianceFilter === 'All' ||
        cadet.complianceStatus === complianceFilter;

      return matchesSearch && matchesFilter;
    });
  }, [roster, searchQuery, complianceFilter, roleFilter]);

  // Export Cohort Roster to Excel
  const handleExportExcel = () => {
    if (roster.length === 0 || isExporting) return;
    setIsExporting(true);

    try {
      const rows = roster.map((cadet) => {
        let standing = 'Satisfactory';
        if (cadet.complianceStatus === 'Overdue') standing = 'Pending Observation';
        if (cadet.complianceStatus === 'Delinquent') standing = 'Action Required';
        if (cadet.complianceStatus === 'Unassigned') standing = 'No Specimen Assigned';

        return {
          'Cadet Name': cadet.name,
          'Student / Roll Number': cadet.rollNumber,
          'Academic Course / Program': cadet.course || 'N/A',
          'Contact Phone': cadet.phone || 'N/A',
          'Assigned Specimens': cadet.totalTrees,
          'Surviving Specimens': cadet.aliveTrees,
          'Mortality Specimens': cadet.deadTrees,
          'Observations Recorded': cadet.totalLogs,
          'Last Observation Date': cadet.lastLogDate
            ? formatDate(cadet.lastLogDate, true)
            : 'None',
          'Days Since Observation':
            cadet.daysSinceLastLog !== null ? cadet.daysSinceLastLog : 'N/A',
          'Compliance Status': cadet.complianceStatus,
          'NSTP Standing': standing,
          'Enrolled At': formatDate(cadet.enrolledAt, true),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 24 }, // Name
        { wch: 20 }, // Roll Number
        { wch: 28 }, // Course
        { wch: 18 }, // Phone
        { wch: 18 }, // Assigned
        { wch: 18 }, // Alive
        { wch: 18 }, // Dead
        { wch: 20 }, // Total Logs
        { wch: 22 }, // Last Date
        { wch: 22 }, // Days
        { wch: 18 }, // Compliance
        { wch: 22 }, // Standing
        { wch: 20 }, // Enrolled
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Cadet Compliance');

      const fileName = `LAMBO_NSTP_Roster_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error('[OfficerDashboard] Excel export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getComplianceBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#3A4320] border border-[#5D6A37] text-[#D2DCB4] font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A4B566]"></span>
            Active
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#3A331A] border border-[#D99B26]/60 text-[#F5C26B] font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D99B26] animate-pulse"></span>
            Overdue
          </span>
        );
      case 'Delinquent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#431B1B] border border-[#E57373]/60 text-[#FFCDD2] font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E57373] animate-ping"></span>
            Delinquent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1D230E] border border-[#525E31] text-[#AAB596] font-mono text-[11px] font-semibold">
            Unassigned
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#262C14] border border-[#4F5A2D] p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D230E] border border-[#525E31] text-[#F5C26B] font-mono text-xs font-bold uppercase tracking-wider mb-2">
              <Icon name="military_tech" className="w-4 h-4 text-[#F5C26B]" />
              NSTP Officer Command
            </div>
            <h1 className="font-display font-bold text-2xl text-[#F0F3E8] tracking-tight">
              Cadet Compliance & Inspection Portal
            </h1>
            <p className="text-xs font-mono text-[#AAB596] mt-1">
              Field observation monitoring, survival audit, and academic grade roster
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting || roster.length === 0}
              className="h-11 px-4 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-95 transition-all text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Icon name="download_for_offline" className="w-4.5 h-4.5" />
              {isExporting ? 'Exporting...' : 'Export Excel (.xlsx)'}
            </button>
          </div>
        </div>

        {/* Tactical decorative grid */}
        <div className="absolute right-0 top-0 bottom-0 w-48 opacity-10 pointer-events-none bg-[radial-gradient(#8B9B4C_1px,transparent_1px)] [background-size:12px_12px]" />
      </div>

      {error && (
        <div className="rounded-xl bg-[#431B1B] border border-[#E57373] text-[#FFCDD2] p-4 text-xs font-mono flex items-center gap-2.5">
          <Icon name="error" className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Offline Mode Banner */}
      {isOffline && roster.length > 0 && (
        <div className="rounded-xl bg-[#2D2712] border border-[#F5C26B]/50 px-4 py-2.5 flex items-center justify-between text-xs text-[#F5C26B] font-mono animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon name="cloud_off" className="w-4 h-4 text-[#F5C26B]" />
            <span>Offline Mode — viewing cached personnel roster ({roster.length} members)</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-2 py-0.5 rounded bg-[#F5C26B]/20 hover:bg-[#F5C26B]/30 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Telemetry Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Personnel */}
        <div className="rounded-2xl bg-[#30371A] border border-[#525E31] p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#C2CE9F] font-mono text-xs">
            <span>Personnel Enrolled</span>
            <Icon name="groups" className="w-4.5 h-4.5 text-[#A4B566]" />
          </div>
          <div className="font-display font-bold text-2xl text-[#F0F3E8]">
            {loading ? '—' : stats?.totalMembers ?? stats?.totalCadets ?? roster.length}
          </div>
          <span className="font-mono text-[11px] text-[#AAB596] block truncate">
            {stats?.totalOfficers ? `${stats.totalOfficers} officers • ${stats.cadetsOnly || stats.totalCadets} cadets` : 'Enrolled personnel'}
          </span>
        </div>

        {/* Active Compliance Rate */}
        <div className="rounded-2xl bg-[#30371A] border border-[#525E31] p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#C2CE9F] font-mono text-xs">
            <span>Weekly Compliance</span>
            <Icon name="fact_check" className="w-4.5 h-4.5 text-[#A4B566]" />
          </div>
          <div className="font-display font-bold text-2xl text-[#F0F3E8]">
            {loading ? '—' : `${stats?.activeRate ?? 0}%`}
          </div>
          <span className="font-mono text-[11px] text-[#AAB596] block truncate">
            Logged photo in past 7d
          </span>
        </div>

        {/* Total Campus Wildlings */}
        <div className="rounded-2xl bg-[#30371A] border border-[#525E31] p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#C2CE9F] font-mono text-xs">
            <span>Monitored Trees</span>
            <Icon name="forest" className="w-4.5 h-4.5 text-[#A4B566]" />
          </div>
          <div className="font-display font-bold text-2xl text-[#F0F3E8]">
            {loading ? '—' : stats?.totalTrees ?? 0}
          </div>
          <span className="font-mono text-[11px] text-[#AAB596] block truncate">
            {stats ? `${stats.livingTrees} alive / ${stats.deadTrees} mortalities` : 'Total planted'}
          </span>
        </div>

        {/* Campus Survival Rate */}
        <div className="rounded-2xl bg-[#30371A] border border-[#525E31] p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#C2CE9F] font-mono text-xs">
            <span>Survival Rate</span>
            <Icon name="vital_signs" className="w-4.5 h-4.5 text-[#A4B566]" />
          </div>
          <div className="font-display font-bold text-2xl text-[#F0F3E8]">
            {loading ? '—' : `${stats?.campusSurvivalRate ?? 100}%`}
          </div>
          <span className="font-mono text-[11px] text-[#AAB596] block truncate">
            Forestry health benchmark
          </span>
        </div>
      </div>

      {/* Search, Filter Pills & Actions */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-3 text-[#AAB596] w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search by name, roll number, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl pl-9 pr-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] placeholder-[#6E7B54]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-[#AAB596] hover:text-[#F0F3E8]"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-[#AAB596] self-end sm:self-center">
            Showing <span className="text-[#F0F3E8] font-bold">{filteredRoster.length}</span> of {roster.length} personnel
          </div>
        </div>

        {/* Role & Compliance Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Role Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#1D230E] rounded-xl border border-[#4F5A2D] w-fit shrink-0">
            {[
              { id: 'all', label: 'All Personnel', count: roster.length },
              { id: 'cadet', label: 'Cadets', count: roster.filter((c) => c.role !== 'officer').length },
              { id: 'officer', label: 'Officers', count: roster.filter((c) => c.role === 'officer').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                    : 'text-[#AAB596] hover:text-[#F0F3E8] hover:bg-[#283015]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  roleFilter === tab.id ? 'bg-[#1F240F] text-[#8B9B4C]' : 'bg-[#262C14] text-[#AAB596]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Compliance Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Active', 'Overdue', 'Delinquent', 'Unassigned'].map((f) => {
              const count =
                f === 'All'
                  ? roster.length
                  : roster.filter((c) => c.complianceStatus === f).length;

              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setComplianceFilter(f)}
                  className={`h-8 px-3 rounded-full font-mono text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    complianceFilter === f
                      ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                      : 'bg-[#262C14] text-[#CCD6B8] border border-[#4F5A2D] hover:bg-[#30371A]'
                  }`}
                >
                  <span>{f}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      complianceFilter === f
                        ? 'bg-[#1F240F] text-[#8B9B4C]'
                        : 'bg-[#1D230E] text-[#AAB596]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-2xl bg-[#262C14] border border-[#4F5A2D] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[#1D230E] border-b border-[#4F5A2D] text-[#C2CE9F] uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 whitespace-nowrap min-w-[170px]">Cadet Profile</th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">Roll / ID Number</th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[160px]">Academic Program</th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">Contact</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Specimens</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Logs</th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">Last Observation</th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[120px]">Compliance</th>
                <th className="py-3 px-4 text-right whitespace-nowrap min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#38411F]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#AAB596]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Icon name="progress_activity" className="animate-spin text-2xl text-[#A4B566]" />
                      <span>Loading cadet compliance roster...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#AAB596]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Icon name="person_search" className="w-8 h-8 text-[#525E31]" />
                      <span>No cadets match the current search or compliance filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoster.map((cadet) => (
                  <tr
                    key={cadet.id}
                    className="hover:bg-[#30371A]/70 transition-colors group cursor-pointer"
                    onClick={() => handleInspectCadet(cadet.id)}
                  >
                    {/* Cadet Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 min-w-[160px]">
                        <div className="w-8 h-8 rounded-full bg-[#1D230E] border border-[#525E31] overflow-hidden shrink-0 flex items-center justify-center text-[#A4B566]">
                          {cadet.avatar ? (
                            <img
                              src={cadet.avatar}
                              alt={cadet.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon name="person" className="w-4.5 h-4.5" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-display font-bold text-sm text-[#F0F3E8] group-hover:text-[#A4B566] transition-colors truncate">
                              {cadet.name}
                            </span>
                            {cadet.role === 'officer' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-bold bg-[#F5C26B]/20 text-[#F5C26B] border border-[#F5C26B]/50 shrink-0">
                                🎖️ Officer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Roll / ID Number */}
                    <td className="py-3 px-3 text-[#D2DCB4] font-bold whitespace-nowrap">
                      {cadet.rollNumber}
                    </td>

                    {/* Course */}
                    <td className="py-3 px-3 text-[#AAB596] whitespace-nowrap">
                      {cadet.course || '—'}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-3 text-[#CCD6B8] whitespace-nowrap">
                      {cadet.phone ? (
                        <a
                          href={`tel:${cadet.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-[#A4B566] underline decoration-dotted"
                        >
                          {cadet.phone}
                        </a>
                      ) : (
                        <span className="text-[#6E7B54]">None</span>
                      )}
                    </td>

                    {/* Assigned Specimens */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 font-bold text-[#F0F3E8]">
                        <span>{cadet.aliveTrees}</span>
                        {cadet.deadTrees > 0 && (
                          <span className="text-[10px] text-[#E57373]">
                            ({cadet.deadTrees} dead)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Logs Count */}
                    <td className="py-3 px-3 text-center text-[#D8DFC8] whitespace-nowrap">
                      {cadet.totalLogs}
                    </td>

                    {/* Last Observation */}
                    <td className="py-3 px-3 text-[#AAB596] whitespace-nowrap">
                      {cadet.lastLogDate ? (
                        <div className="flex flex-col">
                          <span className="text-[#F0F3E8]">
                            {formatRelativeTime(cadet.lastLogDate)}
                          </span>
                          <span className="text-[10px] text-[#6E7B54]">
                            {formatDate(cadet.lastLogDate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#6E7B54]">No observations</span>
                      )}
                    </td>

                    {/* Compliance */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getComplianceBadge(cadet.complianceStatus)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectCadet(cadet.id);
                        }}
                        className="h-8 px-2.5 rounded-lg bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[#A4B566] text-xs font-bold inline-flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <Icon name="visibility" className="w-4 h-4" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CADET INSPECTION MODAL */}
      {selectedCadetId && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-2xl bg-[#262C14] border border-[#5D6A37] shadow-2xl p-4 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#4F5A2D] pb-4 gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-[#1D230E] border border-[#525E31] flex items-center justify-center text-[#A4B566] overflow-hidden shrink-0 mt-0.5 shadow-md">
                  {cadetDetails?.cadet?.avatar ? (
                    <img
                      src={cadetDetails.cadet.avatar}
                      alt={cadetDetails.cadet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon name="person" className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-lg sm:text-xl text-[#F0F3E8] leading-tight">
                      {cadetDetails?.cadet?.name || 'Personnel Inspection'}
                    </h3>
                    {cadetDetails?.cadet?.role === 'officer' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-bold bg-[#F5C26B]/20 text-[#F5C26B] border border-[#F5C26B]/50 shrink-0">
                        🎖️ Officer
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-mono">
                    <span className="text-[#A4B566] font-bold bg-[#1D230E] px-2.5 py-0.5 rounded-md border border-[#525E31] whitespace-nowrap shadow-inner">
                      {cadetDetails?.cadet?.rollNumber}
                    </span>
                    <span className="text-[#D8DFC8] font-medium">
                      {cadetDetails?.cadet?.course || 'No Degree Program'}
                    </span>
                    {cadetDetails?.cadet?.phone && (
                      <a
                        href={`tel:${cadetDetails.cadet.phone}`}
                        className="text-[#AAB596] hover:text-[#A4B566] bg-[#1D230E]/60 px-2 py-0.5 rounded border border-[#3E4724] whitespace-nowrap inline-flex items-center gap-1 transition-colors"
                      >
                        <span>📞</span>
                        <span>{cadetDetails.cadet.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseInspection}
                className="w-9 h-9 rounded-full bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[#AAB596] hover:text-[#F0F3E8] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-16 text-center text-[#AAB596] flex flex-col items-center justify-center gap-3">
                <Icon name="progress_activity" className="animate-spin w-8 h-8 text-[#A4B566]" />
                <span className="font-mono text-xs">
                  Loading field telemetry & observation photographs...
                </span>
              </div>
            ) : cadetDetails ? (
              <div className="space-y-6">
                {/* Summary Metrics Bar */}
                <div className="grid grid-cols-4 gap-2.5 bg-[#1D230E] p-3.5 rounded-xl border border-[#4F5A2D] text-center font-mono">
                  <div>
                    <span className="text-[10px] text-[#AAB596] uppercase block">Assigned</span>
                    <span className="text-base font-bold text-[#F0F3E8]">
                      {cadetDetails.metrics.totalTrees}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#AAB596] uppercase block">Surviving</span>
                    <span className="text-base font-bold text-[#A4B566]">
                      {cadetDetails.metrics.aliveTrees}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#AAB596] uppercase block">Mortalities</span>
                    <span className="text-base font-bold text-[#E57373]">
                      {cadetDetails.metrics.deadTrees}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#AAB596] uppercase block">Logs Submitted</span>
                    <span className="text-base font-bold text-[#F5C26B]">
                      {cadetDetails.metrics.totalLogs}
                    </span>
                  </div>
                </div>

                {/* Section 1: Assigned Wildlings */}
                <div className="space-y-2.5">
                  <h4 className="font-mono text-xs text-[#C2CE9F] uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Icon name="park" className="w-4 h-4 text-[#A4B566]" />
                    Registered Wildlings ({cadetDetails.trees.length})
                  </h4>

                  {cadetDetails.trees.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#1D230E] border border-[#525E31] text-xs font-mono text-[#AAB596] text-center">
                      No seedlings or wildlings registered by this cadet yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {cadetDetails.trees.map((t) => (
                        <div
                          key={t._id}
                          onClick={() => {
                            handleCloseInspection();
                            navigate(`/trees/${t.treeId}`);
                          }}
                          className="p-3 rounded-xl bg-[#30371A] border border-[#525E31] hover:border-[#8B9B4C] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-[#1D230E] border border-[#525E31] overflow-hidden shrink-0">
                              {t.photos && t.photos.length > 0 ? (
                                <img
                                  src={t.photos[0].url}
                                  alt={t.species}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#525E31]">
                                  <Icon name="park" className="w-4.5 h-4.5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-mono text-xs font-bold text-[#A4B566] block">
                                #{t.treeId}
                              </span>
                              <span className="font-display font-medium text-xs text-[#F0F3E8] truncate block">
                                {t.species}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border shrink-0 ${
                              t.healthStatus === 'Thriving' || t.healthStatus === 'Healthy'
                                ? 'bg-[#3A4320] border-[#5D6A37] text-[#D2DCB4]'
                                : t.healthStatus === 'Dead / Mortality' || t.status === 'dead'
                                ? 'bg-[#2A2D24] border-[#757575] text-[#BDBDBD]'
                                : 'bg-[#3A331A] border-[#D99B26]/60 text-[#F5C26B]'
                            }`}
                          >
                            {t.healthStatus || 'Thriving'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Photo Audit Feed */}
                <div className="space-y-2.5">
                  <h4 className="font-mono text-xs text-[#C2CE9F] uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Icon name="photo_library" className="w-4 h-4 text-[#A4B566]" />
                    Photographic Observation Audit ({cadetDetails.logs.length})
                  </h4>

                  {cadetDetails.logs.length === 0 ? (
                    <div className="p-6 rounded-xl bg-[#1D230E] border border-[#525E31] text-xs font-mono text-[#AAB596] text-center">
                      No observation photographs recorded by this cadet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {cadetDetails.logs.map((log) => (
                        <div
                          key={log._id}
                          onClick={() => setSelectedPhotoModal(log)}
                          className="rounded-xl bg-[#1D230E] border border-[#525E31] overflow-hidden group cursor-pointer hover:border-[#8B9B4C] transition-all"
                        >
                          <div className="relative h-28 bg-black">
                            {log.photo ? (
                              <img
                                src={log.photo}
                                alt="Cadet observation"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#525E31] font-mono text-[10px]">
                                No Photo
                              </div>
                            )}
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[#A4B566] font-mono text-[10px] font-bold">
                              #{log.tree?.treeId || 'Specimen'}
                            </div>
                          </div>

                          <div className="p-2 space-y-1 font-mono text-[11px]">
                            <div className="flex items-center justify-between text-[#F0F3E8]">
                              <span className="font-bold">{log.height} cm</span>
                              <span className="text-[10px] text-[#AAB596]">
                                {formatDate(log.loggedAt)}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#AAB596] truncate">
                              {log.notes || 'Routine observation'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>,
        document.body
      )}

      {/* FULL PHOTO PREVIEW MODAL */}
      {selectedPhotoModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200">
          <div className="max-w-2xl w-full rounded-2xl bg-[#262C14] border border-[#5D6A37] overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-2 text-xs font-mono">
              <span className="text-[#A4B566] font-bold">
                Specimen #{selectedPhotoModal.tree?.treeId} Observation Audit
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="w-7 h-7 rounded-full bg-[#1D230E] text-[#AAB596] flex items-center justify-center hover:text-[#F0F3E8]"
              >
                <Icon name="close" className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="relative max-h-[60vh] bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={selectedPhotoModal.photo}
                alt="Full resolution observation proof"
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-[#1D230E] p-3 rounded-xl border border-[#4F5A2D]">
              <div>
                <span className="text-[10px] text-[#AAB596] uppercase block">Height</span>
                <span className="text-[#F0F3E8] font-bold">{selectedPhotoModal.height} cm</span>
              </div>
              <div>
                <span className="text-[10px] text-[#AAB596] uppercase block">Trunk DBH</span>
                <span className="text-[#F0F3E8] font-bold">
                  {selectedPhotoModal.stemDiameter ? `${selectedPhotoModal.stemDiameter} mm` : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#AAB596] uppercase block">Vitality</span>
                <span className="text-[#A4B566] font-bold">
                  {selectedPhotoModal.healthStatus || 'Thriving'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#AAB596] uppercase block">Date Recorded</span>
                <span className="text-[#F0F3E8] font-bold">
                  {formatDate(selectedPhotoModal.loggedAt, true)}
                </span>
              </div>
            </div>

            {selectedPhotoModal.notes && (
              <div className="bg-[#1D230E] p-3 rounded-xl border border-[#4F5A2D] text-xs font-mono">
                <span className="text-[10px] text-[#AAB596] uppercase block mb-1">Field Notes</span>
                <p className="text-[#F0F3E8]">{selectedPhotoModal.notes}</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
