const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema(
  {
    treeId: {
      type: String,
      required: [true, 'Tree ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    species: {
      type: String,
      required: [true, 'Species is required'],
      trim: true,
    },
    nickname: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    datePlanted: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['alive', 'dead', 'unknown'],
      default: 'alive',
    },
    healthStatus: {
      type: String,
      enum: ['Healthy', 'Monitoring', 'Needs Attention'],
      default: 'Healthy',
    },
    currentStage: {
      type: String,
      enum: ['Seedling', 'Vegetative', 'Flowering', 'Fruit Set', 'Ripening', 'Harvest'],
      default: 'Seedling',
    },
    photos: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tree', treeSchema);
