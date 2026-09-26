import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import treeService from '../services/treeService';
import growthLogService from '../services/growthLogService';
import StageProgressBar from '../components/tree/StageProgressBar';
import GrowthEntryForm from '../components/growth/GrowthEntryForm';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { useTrees } from '../context/TreeContext';
import { canUserLogTree } from '../utils/permissions';

export default function TreeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addReminder } = useTrees();

  const [tree, setTree] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remType, setRemType] = useState('watering');
  const [remDate, setRemDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remInterval, setRemInterval] = useState('weekly');
  const [remSuccess, setRemSuccess] = useState('');
  const [remSaving, setRemSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const fetchTreeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await treeService.getTreeById(id);
      const treeData = res.data;
      setTree(treeData);

      // Fetch logs for this tree
      const logsRes = await growthLogService.getLogs({
        tree: treeData._id || treeData.treeId,
        limit: 100,
      });
      setLogs(logsRes.data || []);
    } catch (err) {
      console.error('[TreeProfilePage] Failed to load tree:', err);
      setError('Specimen record not found or server is unreachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTreeData();
    }
  }, [id]);

  // Telemetry Calculations
  const latestLog = useMemo(() => {
    if (!logs || logs.length === 0) return null;
    return [...logs].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0];
  }, [logs]);

  const currentHeight = latestLog?.height || tree?.initialHeight || tree?.height || 0;
  const initialHeight = tree?.initialHeight || tree?.height || currentHeight;
  const heightGain = (currentHeight - initialHeight).toFixed(1);

  const currentDBH = latestLog?.stemDiameter || tree?.initialStemDiameter || tree?.stemDiameter || null;
  const currentLeaves = latestLog?.leafCount || tree?.initialLeafCount || tree?.leafCount || null;
  const currentFruit = latestLog?.fruitCount || 0;

  // Compile photo archive from tree.photos + growthLog photos
  const photoArchive = useMemo(() => {
    const list = [];
    if (tree?.photos && tree.photos.length > 0) {
      tree.photos.forEach((p, idx) => {
        list.push({
          url: p.url,
          label: idx === 0 ? 'Intake Baseline' : p.caption || 'Field Photo',
          date: p.uploadedAt || tree.createdAt,
        });
      });
    }
    logs.forEach((l) => {
      if (l.photo) {
        list.push({
          url: l.photo,
          label: `${l.growthStage} Audit`,
          date: l.loggedAt,
        });
      }
    });
    return list;
  }, [tree, logs]);

  const handleDownloadQR = () => {
    const svg = document.getElementById('specimen-profile-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 80;
      ctx.fillStyle = '#1D230E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      ctx.fillStyle = '#F0F3E8';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tree.treeId, canvas.width / 2, canvas.height - 30);
      ctx.fillStyle = '#A4B566';
      ctx.font = '12px sans-serif';
      ctx.fillText(tree.species?.split(' (')[0] || tree.species, canvas.width / 2, canvas.height - 12);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${tree.treeId}-QR-TAG.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleOpenReminderModal = () => {
    setRemTitle(`Routine Watering for #${tree?.treeId || ''}`);
    setRemType('watering');
    setRemDate(new Date().toISOString().split('T')[0]);
    setRemInterval('weekly');
    setRemSuccess('');
    setShowReminderModal(true);
  };

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    if (!remTitle.trim()) return;
    setRemSaving(true);
    try {
      await addReminder({
        tree: tree._id,
        treeId: tree.treeId,
        title: remTitle.trim(),
        type: remType,
        scheduledDate: new Date(remDate).toISOString(),
        repeatInterval: remInterval,
      });
      setRemSuccess('Care reminder set successfully!');
      setTimeout(() => {
        setShowReminderModal(false);
        setRemSuccess('');
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setRemSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-12 animate-pulse">
        <div className="h-10 bg-[#262C14] rounded-full w-32 border border-[#4F5A2D]" />
        <div className="h-64 rounded-2xl bg-[#262C14] border border-[#4F5A2D]" />
        <div className="h-32 rounded-2xl bg-[#262C14] border border-[#4F5A2D]" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 rounded-xl bg-[#262C14] border border-[#4F5A2D]" />
          <div className="h-28 rounded-xl bg-[#262C14] border border-[#4F5A2D]" />
        </div>
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div className="bg-[#262C14] border border-[#4F5A2D] rounded-2xl p-10 text-center space-y-3 my-8">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#431B1B] border border-[#E57373]/50 flex items-center justify-center text-[#FFCDD2]">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h3 className="font-display font-bold text-base text-[#F0F3E8]">
          Specimen Record Not Found
        </h3>
        <p className="text-xs text-[#CCD6B8] max-w-sm mx-auto">
          {error || `Unable to locate botanical telemetry data for identifier "${id}".`}
        </p>
        <div className="pt-2">
          <Link
            to="/trees"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B9B4C] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Return to Registry
          </Link>
        </div>
      </div>
    );
  }

  const primaryPhoto = photoArchive.length > 0 ? photoArchive[0].url : null;
  const owner = tree.owner;

  return (
    <div className="space-y-5 pb-16">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/trees"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#262C14] border border-[#4F5A2D] text-[#CCD6B8] hover:text-[#F0F3E8] font-mono text-xs font-semibold active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Registry</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQRModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#30371A] border border-[#525E31] text-[#A4B566] hover:bg-[#3D4721] font-mono text-xs font-bold active:scale-95 transition-all"
            title="Generate weatherproof QR tag"
          >
            <span className="material-symbols-outlined text-[16px]">qr_code</span>
            <span className="hidden xs:inline">QR Tag</span>
          </button>
          <Link
            to={`/map?focus=${tree.treeId}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#30371A] border border-[#525E31] text-[#CCD6B8] hover:text-[#F0F3E8] font-mono text-xs font-semibold active:scale-95 transition-all"
            title="View on Campus Map"
          >
            <span className="material-symbols-outlined text-[16px]">pin_drop</span>
            <span className="hidden xs:inline">Campus Map</span>
          </Link>
          <Link
            to={`/trees/${tree.treeId}/logs`}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#8B9B4C] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all"
            title="View Growth Logs & Progression Curves"
          >
            <span className="material-symbols-outlined text-[16px]">query_stats</span>
            <span>Logs</span>
          </Link>
        </div>
      </div>

      {/* Hero Photo Banner */}
      <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden shadow-lg border border-[#4F5A2D] bg-[#1D230E]">
        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={tree.species}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#525E31] bg-gradient-to-b from-[#262C14] to-[#1D230E] p-6 text-center">
            <span className="material-symbols-outlined text-6xl text-[#8B9B4C]/40">park</span>
            <span className="font-mono text-xs text-[#CCD6B8] mt-2">
              No field photograph attached yet
            </span>
            <button
              onClick={() => setShowLogModal(true)}
              className="mt-3 px-3 py-1 rounded-full bg-[#30371A] border border-[#525E31] text-[#A4B566] font-mono text-xs hover:bg-[#3D4721]"
            >
              + Upload Field Photo
            </button>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1D230E] via-transparent to-black/40 pointer-events-none" />

        {/* Overlaid Tag and Status Chips */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1D230E]/90 backdrop-blur-md text-[#A4B566] font-mono text-xs font-bold border border-[#4F5A2D] shadow-sm uppercase tracking-wider">
            #{tree.treeId}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full backdrop-blur-md font-mono text-xs font-bold border shadow-sm ${
              tree.healthStatus === 'Healthy'
                ? 'bg-[#3A4320]/90 border-[#5D6A37] text-[#D2DCB4]'
                : tree.healthStatus === 'Monitoring'
                ? 'bg-[#3A331A]/90 border-[#D99B26]/60 text-[#F5C26B]'
                : 'bg-[#431B1B]/90 border-[#E57373]/60 text-[#FFCDD2]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {tree.healthStatus === 'Healthy' ? 'check_circle' : 'warning'}
            </span>
            {tree.healthStatus}
          </span>
        </div>

        {/* Quick Action Overlay (Favorite toggle) */}
        <div className="absolute bottom-3.5 right-3.5">
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            aria-label="Bookmark Specimen"
            className={`flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md border shadow-md active:scale-95 transition-all ${
              isBookmarked
                ? 'bg-[#8B9B4C] text-[#1F240F] border-[#A4B566]'
                : 'bg-[#1D230E]/80 text-[#A4B566] hover:text-[#F0F3E8] border-[#4F5A2D]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>
        </div>
      </div>

      {/* Specimen Metadata Section */}
      <div className="flex flex-col p-5 rounded-2xl bg-[#262C14] shadow-md border border-[#4F5A2D] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="font-headline-md text-headline-md text-[#F0F3E8] font-bold tracking-tight truncate uppercase">
              {tree.nickname || tree.species.split(' (')[0]}
            </span>
            <span className="font-body-sm text-body-sm text-[#A6B768] italic">
              {tree.species}
            </span>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#1D230E] border border-[#525E31] text-[#A4B566] font-mono text-[11px] font-bold uppercase tracking-wider">
            {tree.currentStage || 'Seedling'}
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1 text-[#CCD6B8] font-body-sm text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#A4B566]">location_on</span>
            <span className="truncate font-mono">
              {tree.location || 'CTU Barili Campus'}
              {tree.coordinates?.lat && tree.coordinates?.lng && (
                <span className="text-[#8B9B70] ml-1">
                  ({tree.coordinates.lat.toFixed(4)}° N, {tree.coordinates.lng.toFixed(4)}° E)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#A4B566]">calendar_month</span>
            <span>
              Registered {formatDate(tree.datePlanted || tree.createdAt)}{' '}
              <span className="text-[#A4B566] font-medium font-mono">
                ({formatRelativeTime(tree.datePlanted || tree.createdAt)})
              </span>
            </span>
          </div>

          {owner && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#A4B566]">shield_person</span>
              <span>
                Caretaker / Student:{' '}
                <span className="text-[#F0F3E8] font-semibold">
                  {typeof owner === 'object' ? owner.name : 'Registered Student'}
                </span>
                {typeof owner === 'object' && owner.rollNumber && (
                  <span className="text-[#A4B566] font-mono ml-1 font-bold">
                    ({owner.rollNumber})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Growth Stage Progress Bar */}
      <StageProgressBar currentStage={tree.currentStage || 'Seedling'} />

      {/* Vital Telemetry Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-[#A4B566]">monitoring</span>
          <h3 className="font-label-lg text-label-lg text-[#F0F3DE] font-bold uppercase tracking-wider">
            Vital Telemetry
          </h3>
        </div>
        <span className="font-label-sm text-label-sm text-[#A4B566] font-medium font-mono uppercase">
          Live Sensor Audit
        </span>
      </div>

      {/* 2x2 Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Height Metric */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-[#262C14] shadow-md border border-[#4F5A2D] gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-[#C5C8BC] uppercase tracking-wider">
              Total Height
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A6B768]">height</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-[#F0F3DE] tracking-tight">
                {currentHeight}
              </span>
              <span className="font-mono text-xs text-[#A6B768] font-semibold">cm</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-[#BDCE8A] font-semibold">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span>
                {parseFloat(heightGain) >= 0 ? `+${heightGain}cm gain` : `${heightGain}cm`}
              </span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="w-full pt-1">
            <svg className="w-full h-5 overflow-visible" fill="none" viewBox="0 0 100 24">
              <path
                d="M 0 20 Q 25 18, 50 12 T 100 4"
                stroke="#A6B768"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <circle cx="100" cy="4" fill="#BDCE8A" r="3.5" />
            </svg>
          </div>
        </div>

        {/* DBH Trunk Diameter */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-[#262C14] shadow-md border border-[#4F5A2D] gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-[#C5C8BC] uppercase tracking-wider">
              Trunk DBH
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A6B768]">
              radio_button_checked
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-[#F0F3DE] tracking-tight">
                {currentDBH || '—'}
              </span>
              <span className="font-mono text-xs text-[#A6B768] font-semibold">mm</span>
            </div>
            <span className="font-mono text-[11px] text-[#BDCE8A] font-semibold">
              Basal stem diameter
            </span>
          </div>
          <div className="w-full bg-[#1D220D] rounded h-2 mt-1 overflow-hidden border border-[#4F5A2D]">
            <div
              className="bg-[#8B9B4C] h-full rounded transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, (currentDBH || 20) * 1.5))}%` }}
            />
          </div>
        </div>

        {/* Foliage & Fruit Metric */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-[#262C14] shadow-md border border-[#4F5A2D] gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-[#C5C8BC] uppercase tracking-wider">
              Foliage &amp; Yield
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A6B768]">energy_savings_leaf</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-[#F0F3DE] tracking-tight">
                {currentLeaves || '—'}
              </span>
              <span className="font-mono text-xs text-[#A6B768] font-semibold">leaves</span>
            </div>
            <span className="font-mono text-[11px] text-[#BDCE8A]">
              {currentFruit > 0 ? `${currentFruit} pods/fruits developing` : 'Vegetative crown'}
            </span>
          </div>
          <div className="w-full bg-[#1D220D] rounded h-2 mt-1 overflow-hidden border border-[#4F5A2D]">
            <div className="bg-[#A4B566] h-full rounded" style={{ width: '80%' }} />
          </div>
        </div>

        {/* Health / Vigor Index */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-[#262C14] shadow-md border border-[#4F5A2D] gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-[#C5C8BC] uppercase tracking-wider">
              Health Vigor
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A6B768]">favorite</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-[#A4B566] tracking-tight">
                {tree.healthStatus === 'Healthy'
                  ? '95%'
                  : tree.healthStatus === 'Monitoring'
                  ? '75%'
                  : '40%'}
              </span>
              <span className="font-mono text-xs text-[#BDCE8A]">Index</span>
            </div>
            <span className="font-mono text-[11px] text-[#CCD6B8]">
              {tree.healthStatus === 'Healthy'
                ? 'Optimal chlorophyll vigor'
                : tree.healthStatus === 'Monitoring'
                ? 'Field check recommended'
                : 'Pest/hydration distress'}
            </span>
          </div>
          <div className="w-full bg-[#1D220D] rounded h-2 mt-1 overflow-hidden border border-[#4F5A2D]">
            <div
              className={`h-full rounded ${
                tree.healthStatus === 'Healthy'
                  ? 'bg-[#A4B566]'
                  : tree.healthStatus === 'Monitoring'
                  ? 'bg-[#F5C26B]'
                  : 'bg-[#FFCDD2]'
              }`}
              style={{
                width:
                  tree.healthStatus === 'Healthy'
                    ? '95%'
                    : tree.healthStatus === 'Monitoring'
                    ? '75%'
                    : '40%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Latest Field Inspection Snippet Card */}
      <div className="flex flex-col p-5 rounded-2xl bg-[#262C14] shadow-md border border-[#4F5A2D] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#A4B566]">
              assignment_turned_in
            </span>
            <h3 className="font-label-lg text-label-lg text-[#F0F3DE] font-bold uppercase tracking-wider">
              Latest Field Inspection
            </h3>
          </div>
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#1D230E] text-[#A4B566] border border-[#525E31] font-semibold">
            {latestLog ? formatDate(latestLog.loggedAt) : 'Baseline Intake'}
          </span>
        </div>

        {latestLog ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#5D6C32] text-[#F0F3DE] flex items-center justify-center font-bold font-mono text-xs shrink-0 shadow-sm border border-[#75863F]">
                {typeof latestLog.loggedBy === 'object' && latestLog.loggedBy?.name
                  ? latestLog.loggedBy.name.slice(0, 2).toUpperCase()
                  : 'ST'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-body-sm text-sm text-[#F0F3DE] font-semibold truncate">
                  {typeof latestLog.loggedBy === 'object' && latestLog.loggedBy?.name
                    ? `${latestLog.loggedBy.name} (${latestLog.loggedBy.rollNumber || 'Student'})`
                    : 'Campus Ranger'}
                </span>
                <span className="font-mono text-[11px] text-[#CCD6B8]">
                  {formatDate(latestLog.loggedAt, true)} • Field Audit Entry
                </span>
              </div>
            </div>
            <p className="font-body-sm text-xs text-[#CCD6B8] bg-[#1D230E] p-3 rounded-xl border border-[#4F5A2D] leading-relaxed">
              "{latestLog.notes || 'Recorded physical measurements. Healthy vigor observed with no significant disease symptoms.'}"
            </p>
          </>
        ) : (
          <p className="font-body-sm text-xs text-[#CCD6B8] bg-[#1D230E] p-3 rounded-xl border border-[#4F5A2D] leading-relaxed">
            Initial baseline recorded at registration. No subsequent field audits logged yet.
          </p>
        )}
      </div>

      {/* Specimen Photo Archive Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#A4B566]">
              photo_library
            </span>
            <h3 className="font-label-lg text-label-lg text-[#F0F3DE] font-bold uppercase tracking-wider">
              Photo Archive ({photoArchive.length})
            </h3>
          </div>
          {photoArchive.length > 0 && (
            <button
              onClick={() => setSelectedPhoto(photoArchive[0].url)}
              className="font-mono text-xs text-[#A4B566] font-semibold flex items-center gap-0.5 hover:text-[#E1E6BC]"
            >
              <span>View Fullscreen</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          )}
        </div>

        {photoArchive.length > 0 ? (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {photoArchive.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhoto(item.url)}
                className="flex flex-col shrink-0 w-36 rounded-xl overflow-hidden bg-[#262C14] shadow-md border border-[#4F5A2D] cursor-pointer hover:border-[#8B9B4C] transition-all group"
              >
                <div className="w-full h-24 bg-[#1D230E] relative overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[#1D230E]/90 border border-[#4F5A2D] text-[9px] font-mono text-[#BDCE8A] font-bold uppercase">
                    {item.label}
                  </span>
                </div>
                <div className="p-2 flex flex-col bg-[#262C14]">
                  <span className="font-mono text-[10px] text-[#F0F3DE] font-semibold truncate">
                    {formatDate(item.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-[#262C14] border border-[#4F5A2D] text-center font-mono text-xs text-[#AAB596]">
            No photographs archived for this specimen.
          </div>
        )}
      </div>

      {/* Field Action Buttons */}
      <div className="space-y-2.5 pt-2">
        {canUserLogTree(user, tree) ? (
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="w-full h-12 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add New Growth Entry</span>
          </button>
        ) : (
          <div className="w-full py-3 px-4 rounded-xl bg-[#1D230E] border border-[#525E31]/50 text-center font-mono text-xs text-[#AAB596] flex items-center justify-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-[16px] text-[#8B9B4C]">lock</span>
            <span>Growth audit logs restricted to specimen caretaker</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            to={`/trees/${tree.treeId}/logs`}
            className="h-11 rounded-xl bg-[#30371A] hover:bg-[#3D4721] text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#A4B566]">query_stats</span>
            <span>Growth Curves</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowQRModal(true)}
            className="h-11 rounded-xl bg-[#30371A] hover:bg-[#3D4721] text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#A4B566]">qr_code</span>
            <span>Print QR Tag</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenReminderModal}
          className="w-full h-11 rounded-xl bg-[#30371A] hover:bg-[#3D4721] text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px] text-[#A4B566]">alarm_add</span>
          <span>Schedule Care Reminder</span>
        </button>
      </div>

      {/* Modal: Add Growth Observation Log */}
      {showLogModal && (
        <GrowthEntryForm
          tree={tree}
          onClose={() => setShowLogModal(false)}
          onSuccess={() => {
            fetchTreeData();
          }}
        />
      )}

      {/* Modal: Schedule Care Reminder */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#5D6A37] p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#A4B566]">alarm_add</span>
                <h3 className="font-display font-bold text-sm text-[#F0F3E8]">
                  Schedule Care Task
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="w-7 h-7 rounded-full bg-[#1D230E] border border-[#525E31] text-[#AAB596] flex items-center justify-center hover:text-[#F0F3E8]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {remSuccess && (
              <div className="p-2.5 rounded-xl bg-[#1D331A] border border-[#A4B566]/60 text-[#C5E1A5] text-xs font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{remSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveReminder} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-[#C2CE9F]">Task Description</label>
                <input
                  type="text"
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="e.g. Deep Root Watering"
                  required
                  className="w-full h-9 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-[#C2CE9F]">Task Type</label>
                  <select
                    value={remType}
                    onChange={(e) => setRemType(e.target.value)}
                    className="w-full h-9 bg-[#1D230E] border border-[#525E31] rounded-xl px-2 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                  >
                    <option value="watering">Watering</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="inspection">Inspection</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-[#C2CE9F]">Recurrence</label>
                  <select
                    value={remInterval}
                    onChange={(e) => setRemInterval(e.target.value)}
                    className="w-full h-9 bg-[#1D230E] border border-[#525E31] rounded-xl px-2 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                  >
                    <option value="none">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-[#C2CE9F]">Target Due Date</label>
                <input
                  type="date"
                  value={remDate}
                  onChange={(e) => setRemDate(e.target.value)}
                  required
                  className="w-full h-9 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={remSaving}
                  className="flex-1 h-10 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{remSaving ? 'Scheduling...' : 'Save Task'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="h-10 px-3 rounded-xl bg-[#30371A] border border-[#525E31] text-xs font-mono text-[#AAB596]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Physical QR Tag Generator */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#5D6A37] p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[#4F5A2D] pb-3">
              <span className="font-mono text-xs text-[#A4B566] font-bold uppercase tracking-wider">
                PHYSICAL QR TAG GENERATOR
              </span>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="w-7 h-7 rounded-full bg-[#1D230E] text-[#AAB596] hover:text-[#F0F3E8] flex items-center justify-center border border-[#4F5A2D]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="bg-[#1D230E] p-6 rounded-2xl border-2 border-dashed border-[#8B9B4C] flex flex-col items-center justify-center shadow-inner">
              <QRCodeSVG
                id="specimen-profile-qr"
                value={tree.treeId}
                size={180}
                bgColor="#1D230E"
                fgColor="#A4B566"
                level="H"
                includeMargin={false}
              />
              <span className="font-mono font-bold text-lg text-[#F0F3E8] mt-4 tracking-wider">
                #{tree.treeId}
              </span>
              <span className="font-body-sm text-xs text-[#C2CE9F] italic">
                {tree.species}
              </span>
            </div>

            <p className="text-xs text-[#CCD6B8]">
              Weatherproof physical QR identification tag. Affix to field nursery stakes for instant camera identification on campus.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex-1 h-11 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 h-11 rounded-xl bg-[#30371A] border border-[#525E31] text-[#F0F3E8] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden border border-[#525E31] bg-[#1D230E]"
          >
            <img
              src={selectedPhoto}
              alt="Specimen inspection photo"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center border border-white/30"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
