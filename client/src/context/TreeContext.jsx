import React, { createContext, useContext, useState, useEffect } from 'react';

const TreeContext = createContext(null);

// Realistic mock wildling trees from Philippine & campus forestry context
const INITIAL_TREES = [
  {
    _id: 't1',
    treeId: 'LMB-0001',
    species: 'Coast Redwood (Sequoia sempervirens)',
    nickname: 'Old Sentinel',
    location: 'Zone 4B • Sector 12 • Coastal Sanctuary',
    coordinates: { lat: 37.8921, lng: -122.5714 },
    datePlanted: '2023-03-14T08:00:00.000Z',
    status: 'alive',
    healthStatus: 'Healthy',
    currentStage: 'Vegetative',
    height: 18.4,
    stemDiameter: 46.2,
    leafCount: 450,
    fruitCount: 0,
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
        caption: 'Trunk bark inspection in sunlight',
        uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
        caption: 'Canopy foliage view',
        uploadedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      },
    ],
  },
  {
    _id: 't2',
    treeId: 'LMB-0002',
    species: 'Narra (Pterocarpus indicus)',
    nickname: 'Alpha Sprout',
    location: 'Zone 4B • Forestry Quad Plot 3',
    coordinates: { lat: 37.8942, lng: -122.5698 },
    datePlanted: '2023-09-10T09:30:00.000Z',
    status: 'alive',
    healthStatus: 'Healthy',
    currentStage: 'Flowering',
    height: 4.2,
    stemDiameter: 12.0,
    leafCount: 180,
    fruitCount: 14,
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
        caption: 'Flowering yellow petals observed',
        uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
  },
  {
    _id: 't3',
    treeId: 'LMB-0003',
    species: 'Molave (Vitex parviflora)',
    nickname: 'Hardwood Bravo',
    location: 'Zone 3C • North Ridge Plot 1',
    coordinates: { lat: 37.891, lng: -122.573 },
    datePlanted: '2024-01-18T10:00:00.000Z',
    status: 'alive',
    healthStatus: 'Monitoring',
    currentStage: 'Seedling',
    height: 2.8,
    stemDiameter: 8.5,
    leafCount: 95,
    fruitCount: 0,
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
        caption: 'Mild yellowing on lower leaf tier',
        uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ],
  },
  {
    _id: 't4',
    treeId: 'LMB-0004',
    species: 'Kamagong (Diospyros blancoi)',
    nickname: 'Ironwood Charlie',
    location: 'Zone 4A • Muir Crest Watershed',
    coordinates: { lat: 37.8935, lng: -122.5705 },
    datePlanted: '2022-11-05T11:00:00.000Z',
    status: 'alive',
    healthStatus: 'Healthy',
    currentStage: 'Fruit Set',
    height: 5.1,
    stemDiameter: 15.2,
    leafCount: 320,
    fruitCount: 22,
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
        caption: 'Developing fruit clusters photographed',
        uploadedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
    ],
  },
  {
    _id: 't5',
    treeId: 'LMB-0005',
    species: 'Guyabano (Annona muricata)',
    nickname: 'Delta Soursop',
    location: 'Zone 2E • Riparian Basin Nursery',
    coordinates: { lat: 37.895, lng: -122.568 },
    datePlanted: '2024-04-12T14:15:00.000Z',
    status: 'alive',
    healthStatus: 'Needs Attention',
    currentStage: 'Ripening',
    height: 1.9,
    stemDiameter: 6.0,
    leafCount: 65,
    fruitCount: 4,
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
        caption: 'Pest marks inspected on leaves',
        uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ],
  },
];

const INITIAL_LOGS = [
  {
    _id: 'l1',
    treeId: 'LMB-0001',
    height: 18.4,
    stemDiameter: 46.2,
    growthStage: 'Vegetative',
    healthStatus: 'Healthy',
    loggedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: 'Seasonal height growth accelerated. Bark thickness healthy with no fungal infection.',
    photo: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    _id: 'l2',
    treeId: 'LMB-0001',
    height: 17.6,
    stemDiameter: 44.1,
    growthStage: 'Vegetative',
    healthStatus: 'Healthy',
    loggedAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    notes: 'Late spring checkup. Added pine mulch base around root collar.',
  },
  {
    _id: 'l3',
    treeId: 'LMB-0001',
    height: 16.2,
    stemDiameter: 41.5,
    growthStage: 'Vegetative',
    healthStatus: 'Healthy',
    loggedAt: new Date(Date.now() - 86400000 * 180).toISOString(),
    notes: 'Winter baseline audit. Strong stem retention and good canopy vigor.',
  },
  {
    _id: 'l4',
    treeId: 'LMB-0002',
    height: 4.2,
    stemDiameter: 12.0,
    growthStage: 'Flowering',
    healthStatus: 'Healthy',
    loggedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    notes: 'Abundant golden blooms observed. Pollinators active around crown.',
    photo: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
  {
    _id: 'l5',
    treeId: 'LMB-0003',
    height: 2.8,
    stemDiameter: 8.5,
    growthStage: 'Seedling',
    healthStatus: 'Monitoring',
    loggedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    notes: 'Soil moisture slightly low. Scheduled organic compost and increased watering frequency.',
  },
  {
    _id: 'l6',
    treeId: 'LMB-0005',
    height: 1.9,
    stemDiameter: 6.0,
    growthStage: 'Ripening',
    healthStatus: 'Needs Attention',
    loggedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    notes: 'Aphid activity spotted under upper foliage. Applied neem extract spray.',
  },
];

const INITIAL_REMINDERS = [
  {
    id: 'r1',
    title: 'Watering & Hydration Check',
    treeId: 'LMB-0003',
    species: 'Molave (Vitex parviflora)',
    dueDate: 'Today, 4:00 PM',
    type: 'watering',
    completed: false,
  },
  {
    id: 'r2',
    title: 'Organic Fertilizer Application',
    treeId: 'LMB-0005',
    species: 'Guyabano (Annona muricata)',
    dueDate: 'Tomorrow, 9:00 AM',
    type: 'fertilizer',
    completed: false,
  },
  {
    id: 'r3',
    title: 'Bi-Weekly Growth Telemetry Audit',
    treeId: 'LMB-0002',
    species: 'Narra (Pterocarpus indicus)',
    dueDate: 'Sep 28, 10:00 AM',
    type: 'inspection',
    completed: false,
  },
];

export function TreeProvider({ children }) {
  const [trees, setTrees] = useState(() => {
    const saved = localStorage.getItem('lambo_trees');
    return saved ? JSON.parse(saved) : INITIAL_TREES;
  });

  const [growthLogs, setGrowthLogs] = useState(() => {
    const saved = localStorage.getItem('lambo_growth_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem('lambo_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('lambo_trees', JSON.stringify(trees));
  }, [trees]);

  useEffect(() => {
    localStorage.setItem('lambo_growth_logs', JSON.stringify(growthLogs));
  }, [growthLogs]);

  useEffect(() => {
    localStorage.setItem('lambo_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const addTree = (treeData) => {
    const nextNum = trees.length + 1;
    const treeId = `LMB-${String(nextNum).padStart(4, '0')}`;
    const newTree = {
      _id: `t_${Date.now()}`,
      treeId,
      datePlanted: new Date().toISOString(),
      status: 'alive',
      healthStatus: treeData.healthStatus || 'Healthy',
      currentStage: treeData.currentStage || 'Seedling',
      height: Number(treeData.height) || 1.0,
      stemDiameter: Number(treeData.stemDiameter) || 2.0,
      leafCount: Number(treeData.leafCount) || 10,
      fruitCount: 0,
      photos: treeData.photo
        ? [{ url: treeData.photo, caption: 'Initial planting photo', uploadedAt: new Date().toISOString() }]
        : [{ url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80', caption: 'Registration photo', uploadedAt: new Date().toISOString() }],
      ...treeData,
    };

    setTrees((prev) => [newTree, ...prev]);

    // Automatically create initial growth log
    const initialLog = {
      _id: `l_${Date.now()}`,
      treeId,
      height: newTree.height,
      stemDiameter: newTree.stemDiameter,
      growthStage: newTree.currentStage,
      healthStatus: newTree.healthStatus,
      loggedAt: new Date().toISOString(),
      notes: 'Initial registration baseline measurements recorded.',
      photo: newTree.photos[0]?.url,
    };
    setGrowthLogs((prev) => [initialLog, ...prev]);

    return newTree;
  };

  const addGrowthLog = (logData) => {
    const newLog = {
      _id: `l_${Date.now()}`,
      loggedAt: new Date().toISOString(),
      ...logData,
      height: Number(logData.height),
      stemDiameter: logData.stemDiameter ? Number(logData.stemDiameter) : undefined,
    };

    setGrowthLogs((prev) => [newLog, ...prev]);

    // Update parent tree metrics & stage
    setTrees((prev) =>
      prev.map((t) => {
        if (t.treeId === logData.treeId) {
          const updatedPhotos = logData.photo
            ? [{ url: logData.photo, caption: logData.notes || 'Observation photo', uploadedAt: new Date().toISOString() }, ...(t.photos || [])]
            : t.photos;
          return {
            ...t,
            height: newLog.height,
            stemDiameter: newLog.stemDiameter || t.stemDiameter,
            healthStatus: logData.healthStatus || t.healthStatus,
            currentStage: logData.growthStage || t.currentStage,
            photos: updatedPhotos,
          };
        }
        return t;
      })
    );

    return newLog;
  };

  const getTreeById = (treeId) => {
    return trees.find((t) => t.treeId.toLowerCase() === treeId.toLowerCase()) || trees[0];
  };

  const getTreeLogs = (treeId) => {
    return growthLogs.filter((l) => l.treeId.toLowerCase() === treeId.toLowerCase());
  };

  const toggleReminder = (id) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const addReminder = (remData) => {
    const newRem = {
      id: `r_${Date.now()}`,
      completed: false,
      ...remData,
    };
    setReminders((prev) => [newRem, ...prev]);
    return newRem;
  };

  return (
    <TreeContext.Provider
      value={{
        trees,
        growthLogs,
        reminders,
        addTree,
        addGrowthLog,
        getTreeById,
        getTreeLogs,
        toggleReminder,
        addReminder,
      }}
    >
      {children}
    </TreeContext.Provider>
  );
}

export function useTrees() {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTrees must be used within a TreeProvider');
  }
  return context;
}
