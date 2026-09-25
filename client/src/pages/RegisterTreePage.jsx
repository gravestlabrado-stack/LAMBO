import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useTrees } from '../context/TreeContext';
import { SPECIES_PRESETS } from '../utils/constants';

export default function RegisterTreePage() {
  const navigate = useNavigate();
  const { addTree } = useTrees();

  const [species, setSpecies] = useState('Narra (Pterocarpus indicus)');
  const [nickname, setNickname] = useState('');
  const [zone, setZone] = useState('Zone 4B - Forestry Quad & Coastal Reserve');
  const [height, setHeight] = useState(2.4);
  const [stemDiameter, setStemDiameter] = useState(7.5);
  const [leafCount, setLeafCount] = useState(85);
  const [registeredTree, setRegisteredTree] = useState(null);

  const fastChips = [
    'Narra (Pterocarpus indicus)',
    'Coast Redwood (Sequoia sempervirens)',
    'Molave (Vitex parviflora)',
    'Kamagong (Diospyros blancoi)',
    'Guyabano (Annona muricata)',
    'Mahogany (Swietenia macrophylla)',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const newSpecimen = addTree({
      species,
      nickname: nickname || species.split(' ')[0],
      location: zone,
      height: Number(height),
      stemDiameter: Number(stemDiameter),
      leafCount: Number(leafCount),
      healthStatus: 'Healthy',
      currentStage: 'Seedling',
      coordinates: { lat: 37.8942, lng: -122.5698 },
    });
    setRegisteredTree(newSpecimen);
  };

  const adjustMetric = (setter, val, delta, min = 0.1) => {
    setter(Math.max(min, Number((val + delta).toFixed(1))));
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Stepper Visual Track */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-[#AAB596]">
          <span>PHASE 1: REGISTRATION</span>
          <span className="text-[#A4B566] font-bold">STEP 1 OF 3</span>
        </div>
        <div className="w-full flex gap-1.5 pt-1">
          <div className="h-1.5 flex-1 rounded-full bg-[#9EAF6D] shadow-[0_0_8px_rgba(158,175,109,0.5)]"></div>
          <div className="h-1.5 flex-1 rounded-full bg-[#3F4824]"></div>
          <div className="h-1.5 flex-1 rounded-full bg-[#3F4824]"></div>
        </div>
      </div>

      {/* Offline Ready Banner */}
      <div className="p-4 rounded-xl bg-[#2B3117] border border-[#4B552A] flex items-start gap-3 shadow-md">
        <div className="w-8 h-8 rounded-full bg-[#1F2410] border border-[#4B552A] flex items-center justify-center shrink-0 text-[#9EAF6D]">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            cloud_sync
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-label-md text-label-md font-semibold text-[#F0F3E8]">
            Offline Capture Active
          </span>
          <p className="font-body-sm text-body-sm text-[#D8DFC8] leading-snug">
            Works in deep canopy zones without cell service. Records persist locally and sync once network connects.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SECTION 1: GPS & Location Matrix */}
        <section className="bg-[#2B3117] rounded-2xl p-5 flex flex-col gap-4 shadow-lg border border-[#4B552A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#9EAF6D] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                share_location
              </span>
              <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
                GPS &amp; Plot Location
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1F2410] text-[#9EAF6D] font-mono text-[11px] font-semibold border border-[#4B552A]">
              <span className="material-symbols-outlined text-[14px]">satellite_alt</span>
              ±1.4m Accuracy
            </span>
          </div>

          {/* Interactive Mini Map Preview */}
          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#4B552A] shadow-inner bg-[#1F2410]">
            <img
              src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80"
              alt="Plot map preview"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#252B14]/90 via-[#252B14]/30 to-transparent pointer-events-none"></div>

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1F2410]/95 backdrop-blur-md shadow-md border border-[#4B552A]">
                <span className="w-2 h-2 rounded-full bg-[#9EAF6D] animate-ping"></span>
                <span className="font-mono text-xs text-[#F0F3E8] font-semibold">
                  37.8942° N, 122.5698° W
                </span>
              </div>
              <button
                type="button"
                onClick={() => alert('GPS position recalibrated via browser geolocation!')}
                className="px-2.5 py-1 rounded-lg bg-[#2E3519] text-[#9EAF6D] hover:bg-[#3F4824] flex items-center gap-1 shadow-md border border-[#4B552A] font-mono text-xs font-semibold"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                Recalibrate
              </button>
            </div>
          </div>

          {/* Zone Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-[#F0F3E8] font-semibold">
              Forest Zone / Campus Sector
            </label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full h-11 bg-[#1F2410] text-[#F0F3E8] rounded-xl px-3 border border-[#4B552A] focus:outline-none focus:border-[#9EAF6D]"
            >
              <option value="Zone 4B - Forestry Quad & Coastal Reserve">Zone 4B - Forestry Quad &amp; Coastal Reserve</option>
              <option value="Zone 4A - Muir Crest Watershed">Zone 4A - Muir Crest Watershed</option>
              <option value="Zone 3C - North Ridge Arboretum">Zone 3C - North Ridge Arboretum</option>
              <option value="Zone 2E - Agroforestry Nursery">Zone 2E - Agroforestry Nursery</option>
            </select>
          </div>
        </section>

        {/* SECTION 2: Species Identification */}
        <section className="bg-[#2B3117] rounded-2xl p-5 flex flex-col gap-4 shadow-lg border border-[#4B552A]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9EAF6D] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              eco
            </span>
            <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Botanical Species
            </h3>
          </div>

          {/* Quick Preset Chips */}
          <div className="flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-[#BAC3A2] uppercase tracking-wider font-semibold">
              Fast Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {fastChips.map((chip) => {
                const isActive = species === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setSpecies(chip)}
                    className={`px-3 py-1.5 rounded-full font-label-md text-label-md flex items-center gap-1 transition-all active:scale-95 ${
                      isActive
                        ? 'bg-[#71823C] text-[#E3E8D0] font-bold shadow-md border border-[#9EAF6D]'
                        : 'bg-[#1F2410] text-[#D8DFC8] border border-[#4B552A] hover:bg-[#2E3519]'
                    }`}
                  >
                    {isActive && <span className="material-symbols-outlined text-[14px]">check</span>}
                    {chip.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-label-md text-label-md text-[#F0F3E8] font-semibold mb-1">
              Specimen Tag / Nickname (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sprout Beta, Plot 4"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full h-11 bg-[#1F2410] text-[#F0F3E8] rounded-xl px-3 border border-[#4B552A] focus:outline-none focus:border-[#9EAF6D]"
            />
          </div>
        </section>

        {/* SECTION 3: Baseline Morphometrics */}
        <section className="bg-[#2B3117] rounded-2xl p-5 flex flex-col gap-4 shadow-lg border border-[#4B552A]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9EAF6D] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              straighten
            </span>
            <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Baseline Measurements
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Height Stepper */}
            <div className="flex items-center justify-between p-3 bg-[#1F2410] border border-[#4B552A] rounded-xl">
              <div className="flex flex-col pl-1">
                <span className="font-label-sm text-label-sm text-[#BAC3A2] font-semibold">
                  Tree Height
                </span>
                <span className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold tracking-tight">
                  {height} <span className="font-label-sm text-label-sm text-[#BAC3A2] font-normal">m</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustMetric(setHeight, height, -0.1)}
                  className="w-10 h-10 rounded-lg bg-[#2E3519] flex items-center justify-center text-[#CCD6B8] border border-[#4B552A] hover:bg-[#3F4824] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustMetric(setHeight, height, 0.1)}
                  className="w-10 h-10 rounded-lg bg-[#2E3519] flex items-center justify-center text-[#CCD6B8] border border-[#4B552A] hover:bg-[#3F4824] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>

            {/* Stem Diameter Stepper */}
            <div className="flex items-center justify-between p-3 bg-[#1F2410] border border-[#4B552A] rounded-xl">
              <div className="flex flex-col pl-1">
                <span className="font-label-sm text-label-sm text-[#BAC3A2] font-semibold">
                  Trunk DBH
                </span>
                <span className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold tracking-tight">
                  {stemDiameter} <span className="font-label-sm text-label-sm text-[#BAC3A2] font-normal">cm</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustMetric(setStemDiameter, stemDiameter, -0.5)}
                  className="w-10 h-10 rounded-lg bg-[#2E3519] flex items-center justify-center text-[#CCD6B8] border border-[#4B552A] hover:bg-[#3F4824] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustMetric(setStemDiameter, stemDiameter, 0.5)}
                  className="w-10 h-10 rounded-lg bg-[#2E3519] flex items-center justify-center text-[#CCD6B8] border border-[#4B552A] hover:bg-[#3F4824] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full h-14 rounded-2xl bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-[0.98] transition-all text-[#1F240F] font-mono text-sm font-bold uppercase tracking-wider shadow-xl flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[22px]">app_registration</span>
          Enroll Specimen &amp; Generate QR Tag
        </button>
      </form>

      {/* Post Registration Success Modal */}
      {registeredTree && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#5D6A37] p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#38411F] text-[#A4B566] border border-[#5D6A37] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>

            <div>
              <span className="font-mono text-xs text-[#A4B566] font-bold uppercase">
                ENROLLMENT COMPLETE
              </span>
              <h3 className="font-display font-bold text-xl text-[#F0F3E8] mt-0.5">
                #{registeredTree.treeId}
              </h3>
              <p className="font-body-sm text-xs text-[#CCD6B8] mt-1">
                {registeredTree.species}
              </p>
            </div>

            <div className="bg-[#1D230E] p-4 rounded-xl border border-[#4B552A] flex justify-center">
              <QRCodeSVG
                value={registeredTree.treeId}
                size={140}
                bgColor="#1D230E"
                fgColor="#A4B566"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/trees/${registeredTree.treeId}`)}
                className="flex-1 h-11 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase"
              >
                Open Profile
              </button>
              <button
                onClick={() => setRegisteredTree(null)}
                className="px-4 h-11 rounded-xl bg-[#30371A] border border-[#525E31] text-[#F0F3E8] font-mono text-xs font-bold uppercase"
              >
                Register Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
