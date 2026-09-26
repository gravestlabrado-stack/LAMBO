import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import treeService from '../services/treeService';
import TreeCard from '../components/tree/TreeCard';
import { GROWTH_STAGES, HEALTH_STATUSES } from '../utils/constants';

export default function TreeListPage() {
  const { user } = useAuth();
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & State
  const [scope, setScope] = useState('all'); // 'all' | 'my'
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');

  const fetchTrees = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all campus trees so the user can seamlessly switch between All and My trees
      const res = await treeService.getTrees({ all: 'true', limit: 100 });
      setTrees(res.data || []);
    } catch (err) {
      console.error('[TreeListPage] Error fetching trees:', err);
      setError('Unable to load forestry specimens. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrees();
  }, []);

  const userId = user?._id || user?.id;

  // Filtered specimen catalogue
  const filteredTrees = useMemo(() => {
    return trees.filter((tree) => {
      // Scope filter: All Campus vs My Trees
      if (scope === 'my') {
        const ownerId = typeof tree.owner === 'object' ? tree.owner?._id : tree.owner;
        if (ownerId && userId && String(ownerId) !== String(userId)) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = tree.treeId?.toLowerCase().includes(term);
        const matchesSpecies = tree.species?.toLowerCase().includes(term);
        const matchesNickname = tree.nickname?.toLowerCase().includes(term);
        const matchesLoc = tree.location?.toLowerCase().includes(term);
        if (!matchesId && !matchesSpecies && !matchesNickname && !matchesLoc) {
          return false;
        }
      }

      // Health status filter
      if (healthFilter !== 'All' && tree.healthStatus !== healthFilter) {
        return false;
      }

      // Growth stage filter
      if (stageFilter !== 'All' && tree.currentStage !== stageFilter) {
        return false;
      }

      return true;
    });
  }, [trees, scope, searchTerm, healthFilter, stageFilter, userId]);

  const myTreesCount = useMemo(() => {
    return trees.filter((tree) => {
      const ownerId = typeof tree.owner === 'object' ? tree.owner?._id : tree.owner;
      return ownerId && userId && String(ownerId) === String(userId);
    }).length;
  }, [trees, userId]);

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Page Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B9B4C] animate-pulse" />
            <span className="font-label-sm text-label-sm text-[#A4B566] uppercase font-mono tracking-wider font-semibold">
              FORESTRY CATALOGUE • MIL-SPEC REGISTRY
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-[#F0F3E8] font-bold mt-0.5">
            Monitored Specimen Registry
          </h2>
          <p className="font-body-sm text-body-sm text-[#CCD6B8]">
            CTU Barili Campus Field Database • Trees, Seedlings &amp; Cultivars
          </p>
        </div>

        {/* Global Action CTA Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/map"
            className="h-10 px-3.5 rounded-full bg-[#30371A] hover:bg-[#3D4721] text-[#A4B566] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Switch to Campus GPS Map"
          >
            <span className="material-symbols-outlined text-[18px]">map</span>
            <span>Map View</span>
          </Link>
          <Link
            to="/register-tree"
            className="h-10 px-4 rounded-full bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Register</span>
          </Link>
        </div>
      </div>

      {/* Scope Selector: All Campus vs My Trees */}
      <div className="flex items-center justify-between bg-[#1D230E] p-1 rounded-2xl border border-[#4F5A2D] shadow-inner">
        <button
          type="button"
          onClick={() => setScope('all')}
          className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            scope === 'all'
              ? 'bg-[#8B9B4C] text-[#1F240F] shadow-md'
              : 'text-[#CCD6B8] hover:text-[#F0F3E8]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">public</span>
          <span>All Campus Plants ({trees.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setScope('my')}
          className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            scope === 'my'
              ? 'bg-[#8B9B4C] text-[#1F240F] shadow-md'
              : 'text-[#CCD6B8] hover:text-[#F0F3E8]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">person</span>
          <span>My Specimens ({myTreesCount})</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3.5 text-[#AAB596] text-[20px]">
          search
        </span>
        <input
          type="text"
          placeholder="Search by ID (#LMB-...), species, nickname, or campus sector..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 bg-[#262C14] border border-[#4F5A2D] rounded-xl pl-11 pr-10 text-sm text-[#F0F3E8] placeholder:text-[#AAB596]/60 focus:outline-none focus:border-[#9EAF6D] focus:ring-1 focus:ring-[#9EAF6D]/50 transition-all font-mono"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 text-[#AAB596] hover:text-[#F0F3E8] p-1"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
          </button>
        )}
      </div>

      {/* Health Status Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="font-mono text-[11px] text-[#AAB596] uppercase shrink-0 font-semibold mr-1">
            Health:
          </span>
          <button
            onClick={() => setHealthFilter('All')}
            className={`px-3 py-1 rounded-full font-mono text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              healthFilter === 'All'
                ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                : 'bg-[#262C14] text-[#CCD6B8] border border-[#4F5A2D] hover:bg-[#30371A]'
            }`}
          >
            All Health
          </button>
          {HEALTH_STATUSES.map((status) => {
            const count = trees.filter((t) => t.healthStatus === status).length;
            return (
              <button
                key={status}
                onClick={() => setHealthFilter(status)}
                className={`px-3 py-1 rounded-full font-mono text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  healthFilter === status
                    ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                    : 'bg-[#262C14] text-[#CCD6B8] border border-[#4F5A2D] hover:bg-[#30371A]'
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>

        {/* Growth Stage Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="font-mono text-[11px] text-[#AAB596] uppercase shrink-0 font-semibold mr-1">
            Stage:
          </span>
          <button
            onClick={() => setStageFilter('All')}
            className={`px-3 py-1 rounded-full font-mono text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              stageFilter === 'All'
                ? 'bg-[#525E31] text-[#F0F3E8] border border-[#8B9B4C]'
                : 'bg-[#1D230E] text-[#CCD6B8] border border-[#3E4724] hover:bg-[#262C14]'
            }`}
          >
            All Stages
          </button>
          {GROWTH_STAGES.map((stg) => {
            const count = trees.filter((t) => t.currentStage === stg).length;
            if (count === 0 && stageFilter !== stg) return null; // Only show active stages
            return (
              <button
                key={stg}
                onClick={() => setStageFilter(stg)}
                className={`px-3 py-1 rounded-full font-mono text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  stageFilter === stg
                    ? 'bg-[#525E31] text-[#F0F3E8] border border-[#8B9B4C]'
                    : 'bg-[#1D230E] text-[#CCD6B8] border border-[#3E4724] hover:bg-[#262C14]'
                }`}
              >
                {stg} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="rounded-xl bg-[#431B1B] border border-[#E57373]/60 p-4 flex items-center justify-between text-xs text-[#FFCDD2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTrees}
            className="px-2.5 py-1 rounded bg-[#E57373]/20 hover:bg-[#E57373]/30 font-bold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-2xl bg-[#262C14] border border-[#4F5A2D] p-4 flex items-center gap-3.5 animate-pulse"
            >
              <div className="w-16 h-16 rounded-xl bg-[#1D230E] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#38411F] rounded w-1/3" />
                <div className="h-3 bg-[#38411F] rounded w-1/2" />
                <div className="h-3 bg-[#38411F] rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTrees.length > 0 ? (
        /* Specimen List Cards */
        <div className="space-y-3">
          {filteredTrees.map((tree) => {
            const isOwner =
              userId &&
              String(typeof tree.owner === 'object' ? tree.owner?._id : tree.owner) ===
                String(userId);

            return (
              <TreeCard
                key={tree._id || tree.treeId}
                tree={tree}
                isOwner={isOwner}
              />
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#262C14] border border-[#4F5A2D] rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#1D230E] border border-[#525E31] flex items-center justify-center text-[#8B9B4C]">
            <span className="material-symbols-outlined text-3xl">park</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[#F0F3E8]">
              {trees.length === 0
                ? 'No Monitored Specimens Registered'
                : 'No Matching Specimens Found'}
            </h3>
            <p className="text-xs text-[#CCD6B8] mt-1 max-w-sm mx-auto">
              {trees.length === 0
                ? 'Register the first tree or plant seedling on campus to start live botanical telemetry tracking.'
                : `No specimens match your current filter criteria. Try clearing search or switching between All Campus / My Specimens.`}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            {trees.length > 0 ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setHealthFilter('All');
                  setStageFilter('All');
                  setScope('all');
                }}
                className="h-10 px-4 rounded-xl bg-[#30371A] hover:bg-[#3D4721] text-[#A4B566] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider"
              >
                Clear All Filters
              </button>
            ) : (
              <Link
                to="/register-tree"
                className="h-10 px-5 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Register First Specimen</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
