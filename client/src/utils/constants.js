// LAMBO System Constants

export const APP_NAME = 'LAMBO';
export const APP_TAGLINE = 'Landscape Analytics for Monitoring Botanical Observation';

export const HEALTH_STATUS = {
  THRIVING: 'Thriving',
  FAIR: 'Stable / Fair',
  DISTRESSED: 'Distressed / At Risk',
  DEAD: 'Dead / Mortality',
  // Legacy aliases
  HEALTHY: 'Healthy',
  MONITORING: 'Monitoring',
  NEEDS_ATTENTION: 'Needs Attention',
};

export const HEALTH_STATUSES = [
  'Thriving',
  'Stable / Fair',
  'Distressed / At Risk',
  'Dead / Mortality',
];

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
  Thriving: {
    bg: 'bg-[#3A4320]',
    text: 'text-[#D2DCB4]',
    border: 'border-[#5D6A37]',
    dot: 'bg-[#A4B566]',
    badge: 'border-[#5D6A37] text-[#D2DCB4] bg-[#3A4320]',
  },
  'Stable / Fair': {
    bg: 'bg-[#3A331A]',
    text: 'text-[#F5C26B]',
    border: 'border-[#D99B26]/60',
    dot: 'bg-[#D99B26]',
    badge: 'border-[#D99B26]/60 text-[#F5C26B] bg-[#3A331A]',
  },
  'Distressed / At Risk': {
    bg: 'bg-[#431B1B]',
    text: 'text-[#FFCDD2]',
    border: 'border-[#E57373]/60',
    dot: 'bg-[#E57373]',
    badge: 'border-[#E57373]/60 text-[#FFCDD2] bg-[#431B1B]',
  },
  'Dead / Mortality': {
    bg: 'bg-[#2A2D24]',
    text: 'text-[#BDBDBD]',
    border: 'border-[#757575]/60',
    dot: 'bg-[#757575]',
    badge: 'border-[#757575]/60 text-[#BDBDBD] bg-[#2A2D24]',
  },
  // Legacy compatibility mappings
  Healthy: {
    bg: 'bg-[#3A4320]',
    text: 'text-[#D2DCB4]',
    border: 'border-[#5D6A37]',
    dot: 'bg-[#A4B566]',
    badge: 'border-[#5D6A37] text-[#D2DCB4] bg-[#3A4320]',
  },
  Monitoring: {
    bg: 'bg-[#3A331A]',
    text: 'text-[#F5C26B]',
    border: 'border-[#D99B26]/60',
    dot: 'bg-[#D99B26]',
    badge: 'border-[#D99B26]/60 text-[#F5C26B] bg-[#3A331A]',
  },
  'Needs Attention': {
    bg: 'bg-[#431B1B]',
    text: 'text-[#FFCDD2]',
    border: 'border-[#E57373]/60',
    dot: 'bg-[#E57373]',
    badge: 'border-[#E57373]/60 text-[#FFCDD2] bg-[#431B1B]',
  },
};

export const CAMPUS_COORDINATES = {
  lat: 10.130166,
  lng: 123.545044,
  name: 'Cebu Technological University - Barili Campus',
  shortName: 'CTU Barili',
  location: 'Cagay, Barili, Cebu, Philippines',
};

