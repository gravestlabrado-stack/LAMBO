import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrees } from '../context/TreeContext';
import { formatRelativeTime } from '../utils/formatters';

export default function TreeListPage() {
  const navigate = useNavigate();
  const { trees } = useTrees();
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState('All');

  const filteredTrees = trees.filter((tree) => {
    const matchesSearch =
      tree.treeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tree.nickname && tree.nickname.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesHealth =
      healthFilter === 'All' || tree.healthStatus === healthFilter;

    return matchesSearch && matchesHealth;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="font-label-sm text-label-sm text-[#A4B566] uppercase font-mono tracking-wider">
            FORESTRY CATALOGUE
          </span>
          <h2 className="font-headline-md text-headline-md text-[#F0F3E8] font-bold">
            Monitored Specimen Registry
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/map"
            className="h-10 px-3.5 rounded-full bg-[#30371A] hover:bg-[#3D4721] text-[#A4B566] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Switch to Campus Map"
          >
            <span className="material-symbols-outlined text-[18px]">map</span>
            <span className="hidden xs:inline">Map View</span>
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

      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3.5 text-[#AAB596] text-[20px]">
          search
        </span>
        <input
          type="text"
          placeholder="Search by ID, species, or nickname..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 bg-[#262C14] border border-[#4F5A2D] rounded-xl pl-11 pr-4 text-sm text-[#F0F3E8] placeholder:text-[#AAB596]/60 focus:outline-none focus:border-[#9EAF6D]"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 text-[#AAB596] hover:text-[#F0F3E8]"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Healthy', 'Monitoring', 'Needs Attention'].map((status) => (
          <button
            key={status}
            onClick={() => setHealthFilter(status)}
            className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all active:scale-95 whitespace-nowrap ${
              healthFilter === status
                ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                : 'bg-[#262C14] text-[#CCD6B8] border border-[#4F5A2D] hover:bg-[#30371A]'
            }`}
          >
            {status} ({status === 'All' ? trees.length : trees.filter((t) => t.healthStatus === status).length})
          </button>
        ))}
      </div>

      {/* Tree Grid / List */}
      <div className="space-y-3">
        {filteredTrees.length > 0 ? (
          filteredTrees.map((tree) => {
            const photoUrl =
              tree.photos && tree.photos.length > 0
                ? tree.photos[0].url
                : 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=400&q=80';

            return (
              <div
                key={tree._id || tree.treeId}
                onClick={() => navigate(`/trees/${tree.treeId}`)}
                className="rounded-2xl bg-[#262C14] border border-[#4F5A2D] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-[#8B9B4C] transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-14 h-14 rounded-xl bg-[#1D230E] overflow-hidden shrink-0 border border-[#525E31] shadow-inner">
                    <img className="w-full h-full object-cover" alt={tree.species} src={photoUrl} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#1D230E] text-[#A4B566] border border-[#525E31] font-mono text-[11px] font-bold">
                        #{tree.treeId}
                      </span>
                      <span className="font-display font-bold text-base text-[#F0F3E8] truncate">
                        {tree.nickname || tree.species.split(' ')[0]}
                      </span>
                    </div>
                    <span className="font-body-sm text-xs text-[#CCD6B8] italic truncate">
                      {tree.species}
                    </span>
                    <span className="text-[11px] text-[#AAB596] truncate mt-0.5">
                      {tree.location} • Planted {formatRelativeTime(tree.datePlanted)}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-[#38411F] pt-2 sm:pt-0 shrink-0">
                  <span
                    className={`px-3 py-0.5 rounded-full font-label-sm text-label-sm font-semibold border ${
                      tree.healthStatus === 'Healthy'
                        ? 'bg-[#3A4320] border-[#5D6A37] text-[#D2DCB4]'
                        : tree.healthStatus === 'Monitoring'
                        ? 'bg-[#3A331A] border-[#D99B26]/60 text-[#F5C26B]'
                        : 'bg-[#431B1B] border-[#E57373]/60 text-[#FFCDD2]'
                    }`}
                  >
                    {tree.healthStatus}
                  </span>

                  <div className="flex items-center gap-2 font-mono text-xs text-[#A4B566]">
                    <span className="font-bold">{tree.height}m ht</span>
                    {tree.stemDiameter && (
                      <span className="text-[#CCD6B8]">• {tree.stemDiameter}cm DBH</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#262C14] border border-[#4F5A2D] rounded-2xl p-10 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-[#AAB596]">search_off</span>
            <h3 className="font-display font-bold text-base text-[#F0F3E8]">
              No Specimen Found
            </h3>
            <p className="text-xs text-[#CCD6B8]">
              No trees match the query "{searchTerm}". Try another search term or filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
