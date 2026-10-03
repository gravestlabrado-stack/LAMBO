import React, { useState, useEffect } from 'react';
import { useTrees } from '../context/TreeContext';
import { CAMPUS_COORDINATES } from '../utils/constants';
import QRCodeDisplay from '../components/tree/QRCodeDisplay';
import zoneService from '../services/zoneService';
import { compressImage } from '../utils/imageCompressor';
import Icon from '../components/common/Icon';

import RegistrationLocationSection from '../components/tree/register/RegistrationLocationSection';
import RegistrationTaxonomySection from '../components/tree/register/RegistrationTaxonomySection';
import RegistrationPhotoSection from '../components/tree/register/RegistrationPhotoSection';
import RegistrationMetricsSection from '../components/tree/register/RegistrationMetricsSection';

export default function RegisterTreePage() {
  const { addTree } = useTrees();

  // Basic & Taxonomy Details
  const [species, setSpecies] = useState('Narra (Pterocarpus indicus)');
  const [customSpecies, setCustomSpecies] = useState('');
  const [nickname, setNickname] = useState('');
  const [healthStatus, setHealthStatus] = useState('Thriving');
  const [currentStage, setCurrentStage] = useState('Seedling');

  // Forest Zone / Campus Sector from MongoDB
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [loadingZones, setLoadingZones] = useState(true);

  // Map & GPS Coordinates (Defaults to CTU Barili Campus)
  const [coordinates, setCoordinates] = useState({
    lat: CAMPUS_COORDINATES.lat,
    lng: CAMPUS_COORDINATES.lng,
  });

  // Baseline Morphometrics
  const [height, setHeight] = useState(25); // in cm
  const [stemDiameter, setStemDiameter] = useState(8); // in mm
  const [leafCount, setLeafCount] = useState(12);
  const [notes, setNotes] = useState('');

  // Photo Upload & Compression State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // Submission & Post-Registration State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [registeredTree, setRegisteredTree] = useState(null);

  // Fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoadingZones(true);
        const res = await zoneService.getZones();
        const zoneList = res.data || [];
        setZones(zoneList);
        if (zoneList.length > 0) {
          setSelectedZone(zoneList[0].name);
        }
      } catch (err) {
        console.error('[RegisterTree] Failed to load zones:', err);
      } finally {
        setLoadingZones(false);
      }
    };

    fetchZones();
  }, []);

  const handleAddNewZone = async (name) => {
    try {
      const res = await zoneService.createZone({ name });
      const created = res.data;
      if (created) {
        setZones((prev) => {
          const exists = prev.some(
            (z) => z.name.toLowerCase() === created.name.toLowerCase()
          );
          return exists ? prev : [...prev, created];
        });
        setSelectedZone(created.name);
      }
    } catch (err) {
      console.error('[RegisterTree] Failed to add zone:', err);
      alert(err.response?.data?.message || 'Could not save new sector to database.');
      throw err;
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setSubmitError('Photo size must be less than 20MB.');
      return;
    }

    setIsCompressingPhoto(true);
    setSubmitError('');

    try {
      const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.warn('[RegisterTree] Image compression fallback:', err);
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const finalSpecies = customSpecies.trim() || species;
    if (!finalSpecies) {
      setSubmitError('Please select or specify a botanical species.');
      return;
    }

    if (!selectedZone) {
      setSubmitError('Please select a Forest Zone / Campus Sector.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('species', finalSpecies);
      if (nickname.trim()) formData.append('nickname', nickname.trim());
      formData.append('location', selectedZone);
      formData.append('lat', coordinates.lat);
      formData.append('lng', coordinates.lng);
      formData.append('healthStatus', healthStatus);
      formData.append('status', healthStatus === 'Dead / Mortality' ? 'dead' : 'alive');
      formData.append('currentStage', currentStage);
      formData.append('initialHeight', height === '' || isNaN(height) ? 0 : height);
      formData.append('initialStemDiameter', stemDiameter === '' || isNaN(stemDiameter) ? 0 : stemDiameter);
      formData.append('initialLeafCount', leafCount === '' || isNaN(leafCount) ? 0 : leafCount);
      if (notes.trim()) formData.append('notes', notes.trim());
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const createdTree = await addTree(formData);
      setRegisteredTree(createdTree);
    } catch (err) {
      console.error('[RegisterTree] Registration error:', err);
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to register specimen. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setRegisteredTree(null);
    setNickname('');
    setCustomSpecies('');
    setNotes('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setHeight(25);
    setStemDiameter(8);
    setLeafCount(12);
  };

  return (
    <div className="space-y-6 pb-8 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-[#A4B566] uppercase tracking-wider font-semibold">
            FIELD REGISTRATION
          </span>
          <h2 className="font-headline-md text-headline-md text-[#F0F3E8] font-bold">
            Register Plant / Tree
          </h2>
          <p className="font-body-sm text-body-sm text-[#AAB596]">
            Catalog a new wildling or seedling with GPS pin, baseline metrics, and auto-generated QR tag.
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[#30371A] border border-[#525E31] flex items-center justify-center text-[#A4B566] shrink-0 shadow-sm">
          <Icon name="add_task" className="w-6 h-6" />
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-[#431B1B]/80 border border-[#E57373]/60 text-[#FFCDD2] text-xs font-mono flex items-center gap-2.5 animate-in fade-in">
          <Icon name="error" className="w-5 h-5 text-[#E57373]" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <RegistrationLocationSection
          coordinates={coordinates}
          onLocationChange={setCoordinates}
          selectedZone={selectedZone}
          onZoneChange={setSelectedZone}
          zones={zones}
          loadingZones={loadingZones}
          onAddNewZone={handleAddNewZone}
        />

        <RegistrationTaxonomySection
          species={species}
          onSpeciesChange={setSpecies}
          customSpecies={customSpecies}
          onCustomSpeciesChange={setCustomSpecies}
          nickname={nickname}
          onNicknameChange={setNickname}
        />

        <RegistrationPhotoSection
          photoPreview={photoPreview}
          onPhotoSelect={handlePhotoSelect}
          onRemovePhoto={handleRemovePhoto}
          isCompressingPhoto={isCompressingPhoto}
          healthStatus={healthStatus}
          onHealthStatusChange={setHealthStatus}
          currentStage={currentStage}
          onStageChange={setCurrentStage}
        />

        <RegistrationMetricsSection
          height={height}
          onHeightChange={setHeight}
          stemDiameter={stemDiameter}
          onStemDiameterChange={setStemDiameter}
          leafCount={leafCount}
          onLeafCountChange={setLeafCount}
          notes={notes}
          onNotesChange={setNotes}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-[#8B9B4C] via-[#9AB056] to-[#A4B566] hover:from-[#9BB057] hover:to-[#B4C674] active:scale-[0.98] active:brightness-95 transition-all text-[#161C0B] font-mono text-sm font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(139,155,76,0.3)] hover:shadow-[0_6px_28px_rgba(164,181,102,0.45)] border border-[#D2E29A]/50 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-[#161C0B] border-t-transparent rounded-full animate-spin" />
              <span>Enrolling Specimen &amp; Uploading...</span>
            </>
          ) : (
            <>
              <Icon name="qr_code_2" className="w-5 h-5 text-[#161C0B]" />
              <span>Enroll Specimen &amp; Generate QR</span>
            </>
          )}
        </button>
      </form>

      {/* Post-Registration Success Modal with Downloadable QR Code */}
      {registeredTree && (
        <QRCodeDisplay
          tree={registeredTree}
          onClose={() => setRegisteredTree(null)}
          onRegisterAnother={handleResetForm}
        />
      )}
    </div>
  );
}
