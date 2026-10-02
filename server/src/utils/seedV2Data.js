require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tree = require('../models/Tree');
const GrowthLog = require('../models/GrowthLog');

const SAMPLE_PHOTOS = {
  narra: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
  molave: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80',
  kamagong: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
  mahogany: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&auto=format&fit=crop&q=80',
  seedling: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80',
  dead: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=800&auto=format&fit=crop&q=80',
};

async function seedV2() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lambo';
  console.log(`[Seed v2] Connecting to MongoDB at ${uri.replace(/:[^:@]+@/, ':****@')}...`);
  await mongoose.connect(uri);

  console.log('[Seed v2] Wiping previous test records (Trees, GrowthLogs, Sample Cadets)...');
  await GrowthLog.deleteMany({});
  await Tree.deleteMany({});
  await User.deleteMany({
    rollNumber: {
      $in: [
        'NSTP-OFFICER-01',
        '2024-BSF-001',
        '2024-BSA-042',
        '2024-BSIT-105',
        '2024-BSF-019',
        '2024-BSED-008',
      ],
    },
  });

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  console.log('[Seed v2] Creating NSTP Officer account...');
  const officer = await User.create({
    name: 'Captain Marco Alvarez',
    rollNumber: 'NSTP-OFFICER-01',
    password: 'password123',
    role: 'officer',
    course: 'NSTP Field Commander',
    phone: '+63 917 888 9999',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  });

  console.log('[Seed v2] Creating sample student cadets...');
  // Cadet 1: Active & Compliant
  const cadet1 = await User.create({
    name: 'Elena Rostova',
    rollNumber: '2024-BSF-001',
    password: 'password123',
    role: 'student',
    course: 'BS Forestry',
    phone: '+63 917 123 4567',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  });

  // Cadet 2: Overdue (last log 10 days ago)
  const cadet2 = await User.create({
    name: 'Marcus Vance',
    rollNumber: '2024-BSA-042',
    password: 'password123',
    role: 'student',
    course: 'BS Agriculture',
    phone: '+63 928 345 6789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  });

  // Cadet 3: Delinquent (last log 21 days ago)
  const cadet3 = await User.create({
    name: 'Sofia Benitez',
    rollNumber: '2024-BSIT-105',
    password: 'password123',
    role: 'student',
    course: 'BS Information Technology',
    phone: '+63 939 567 8901',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
  });

  // Cadet 4: Specimen Mortality
  const cadet4 = await User.create({
    name: 'Daniel Cruz',
    rollNumber: '2024-BSF-019',
    password: 'password123',
    role: 'student',
    course: 'BS Forestry',
    phone: '+63 945 789 0123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  });

  // Cadet 5: Unassigned (no trees yet)
  const cadet5 = await User.create({
    name: 'Chloe Alcantara',
    rollNumber: '2024-BSED-008',
    password: 'password123',
    role: 'student',
    course: 'Bachelor of Secondary Education',
    phone: '+63 915 901 2345',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  });

  console.log('[Seed v2] Registering campus wildlings...');
  const tree1 = await Tree.create({
    treeId: 'LMB-0001',
    owner: cadet1._id,
    species: 'Narra (Pterocarpus indicus)',
    nickname: 'Timber Alpha',
    location: 'North Canopy Quad - Plot A1',
    coordinates: { lat: 10.1303, lng: 123.5452 },
    datePlanted: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    healthStatus: 'Thriving',
    currentStage: 'Vegetative',
    status: 'alive',
    photos: [{ url: SAMPLE_PHOTOS.narra, caption: 'Planting day' }],
  });

  const tree2 = await Tree.create({
    treeId: 'LMB-0002',
    owner: cadet1._id,
    species: 'Molave (Vitex parviflora)',
    nickname: 'Ironwood',
    location: 'Forestry Nursery Section B',
    coordinates: { lat: 10.1307, lng: 123.5448 },
    datePlanted: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    healthStatus: 'Thriving',
    currentStage: 'Seedling',
    status: 'alive',
    photos: [{ url: SAMPLE_PHOTOS.molave, caption: 'Nursery bed' }],
  });

  const tree3 = await Tree.create({
    treeId: 'LMB-0003',
    owner: cadet2._id,
    species: 'Kamagong (Diospyros blancoi)',
    nickname: 'Ebony Scout',
    location: 'Agri Quad Zone 2',
    coordinates: { lat: 10.1298, lng: 123.5455 },
    datePlanted: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    healthStatus: 'Stable / Fair',
    currentStage: 'Vegetative',
    status: 'alive',
    photos: [{ url: SAMPLE_PHOTOS.kamagong, caption: 'Initial baseline' }],
  });

  const tree4 = await Tree.create({
    treeId: 'LMB-0004',
    owner: cadet3._id,
    species: 'Mahogany (Swietenia macrophylla)',
    nickname: 'Rusty Spear',
    location: 'IT Building Perimeter Slope',
    coordinates: { lat: 10.1309, lng: 123.5458 },
    datePlanted: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    healthStatus: 'Distressed / At Risk',
    currentStage: 'Vegetative',
    status: 'alive',
    photos: [{ url: SAMPLE_PHOTOS.mahogany, caption: 'Slope planting' }],
  });

  const tree5 = await Tree.create({
    treeId: 'LMB-0005',
    owner: cadet4._id,
    species: 'Apitong (Dipterocarpus grandiflorus)',
    nickname: 'Fallen Hero',
    location: 'East Agro-Forestry Ridge',
    coordinates: { lat: 10.1312, lng: 123.5442 },
    datePlanted: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    healthStatus: 'Dead / Mortality',
    currentStage: 'Seedling',
    status: 'dead',
    photos: [{ url: SAMPLE_PHOTOS.dead, caption: 'Desiccation observed' }],
  });

  console.log('[Seed v2] Adding observation logs with photo verification...');
  // Logs for Cadet 1 (Recent - 2 days ago)
  await GrowthLog.create({
    tree: tree1._id,
    loggedBy: cadet1._id,
    height: 38.5,
    stemDiameter: 9.2,
    leafCount: 22,
    growthStage: 'Vegetative',
    healthStatus: 'Thriving',
    photo: SAMPLE_PHOTOS.narra,
    notes: 'Vigorous new flush of leaflets. Excellent root establishment.',
    loggedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });

  await GrowthLog.create({
    tree: tree2._id,
    loggedBy: cadet1._id,
    height: 29.0,
    stemDiameter: 7.5,
    leafCount: 16,
    growthStage: 'Seedling',
    healthStatus: 'Thriving',
    photo: SAMPLE_PHOTOS.molave,
    notes: 'Applied organic mulch and watered.',
    loggedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });

  // Log for Cadet 2 (Overdue - 10 days ago)
  await GrowthLog.create({
    tree: tree3._id,
    loggedBy: cadet2._id,
    height: 44.0,
    stemDiameter: 11.0,
    leafCount: 18,
    growthStage: 'Vegetative',
    healthStatus: 'Stable / Fair',
    photo: SAMPLE_PHOTOS.kamagong,
    notes: 'Slight yellowing on lower leaves. Checking soil moisture.',
    loggedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  });

  // Log for Cadet 3 (Delinquent - 21 days ago)
  await GrowthLog.create({
    tree: tree4._id,
    loggedBy: cadet3._id,
    height: 32.0,
    stemDiameter: 8.0,
    leafCount: 9,
    growthStage: 'Vegetative',
    healthStatus: 'Distressed / At Risk',
    photo: SAMPLE_PHOTOS.mahogany,
    notes: 'Signs of caterpillar infestation. Needs insecticide treatment.',
    loggedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
  });

  // Log for Cadet 4 (Mortality - 15 days ago)
  await GrowthLog.create({
    tree: tree5._id,
    loggedBy: cadet4._id,
    height: 22.0,
    stemDiameter: 6.0,
    leafCount: 0,
    growthStage: 'Seedling',
    healthStatus: 'Dead / Mortality',
    photo: SAMPLE_PHOTOS.dead,
    notes: 'Stem dried and brittle due to prolonged drought on ridge.',
    loggedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  });

  console.log('[Seed v2] ✅ Successfully seeded LAMBO v2 demonstration cohort!');
  console.log('--------------------------------------------------');
  console.log('🎖️ NSTP OFFICER LOGIN:');
  console.log('   Roll Number: NSTP-OFFICER-01');
  console.log('   Password:    password123');
  console.log('');
  console.log('🌱 STUDENT CADET LOGIN:');
  console.log('   Roll Number: 2024-BSF-001 (Elena Rostova)');
  console.log('   Password:    password123');
  console.log('--------------------------------------------------');

  await mongoose.disconnect();
}

if (require.main === module) {
  seedV2()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed v2] Failed:', err);
      process.exit(1);
    });
}

module.exports = seedV2;
