// LAMBO System Constants

export const APP_NAME = 'LAMBO';
export const APP_TAGLINE = 'Landscape Analytics for Monitoring Botanical Observation';

export const HEALTH_STATUS = {
  HEALTHY: 'Healthy',
  MONITORING: 'Monitoring',
  NEEDS_ATTENTION: 'Needs Attention',
};

export const GROWTH_STAGES = [
  'Seedling',
  'Vegetative',
  'Flowering',
  'Fruit Set',
  'Ripening',
  'Harvest',
];

export const TREE_STATUS = {
  ALIVE: 'alive',
  DEAD: 'dead',
  UNKNOWN: 'unknown',
};

export const SPECIES_PRESETS = [
  'Narra (Pterocarpus indicus)',
  'Molave (Vitex parviflora)',
  'Kamagong (Diospyros blancoi)',
  'Mahogany (Swietenia macrophylla)',
  'Apitong (Dipterocarpus grandiflorus)',
  'Yakal (Shorea astylosa)',
  'Banaba (Lagerstroemia speciosa)',
  'Tindalo (Afzelia rhomboidea)',
  'Guyabano (Annona muricata)',
  'Mango (Mangifera indica)',
  'Calamansi (Citrofortunella microcarpa)',
  'Jackfruit (Artocarpus heterophyllus)',
  'Coconut (Cocos nucifera)',
  'Cacao (Theobroma cacao)',
  'Coffee (Coffea arabica)',
];

export const HEALTH_COLOR_MAP = {
  Healthy: {
    bg: 'bg-surface-raised',
    text: 'text-status-healthy',
    border: 'border-status-healthy/40',
    dot: 'bg-status-healthy',
    badge: 'border-[#A4B566] text-[#A4B566]',
  },
  Monitoring: {
    bg: 'bg-surface-raised',
    text: 'text-status-monitor',
    border: 'border-status-monitor/40',
    dot: 'bg-status-monitor',
    badge: 'border-[#D99B26] text-[#D99B26]',
  },
  'Needs Attention': {
    bg: 'bg-surface-raised',
    text: 'text-status-danger',
    border: 'border-status-danger/40',
    dot: 'bg-status-danger',
    badge: 'border-[#E57373] text-[#E57373]',
  },
};

export const CAMPUS_COORDINATES = {
  lat: 10.130166,
  lng: 123.545044,
  name: 'Cebu Technological University - Barili Campus',
  shortName: 'CTU Barili',
  location: 'Cagay, Barili, Cebu, Philippines',
};

