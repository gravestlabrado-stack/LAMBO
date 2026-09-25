const mongoose = require('mongoose');

const growthLogSchema = new mongoose.Schema(
  {
    tree: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tree',
      required: [true, 'Tree reference is required'],
      index: true,
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    height: {
      type: Number,
      required: [true, 'Height is required (cm)'],
      min: [0, 'Height cannot be negative'],
    },
    stemDiameter: {
      type: Number,
      default: null,
      min: [0, 'Stem diameter cannot be negative'],
    },
    leafCount: {
      type: Number,
      default: null,
      min: [0, 'Leaf count cannot be negative'],
    },
    fruitCount: {
      type: Number,
      default: null,
      min: [0, 'Fruit count cannot be negative'],
    },
    growthStage: {
      type: String,
      enum: ['Seedling', 'Vegetative', 'Flowering', 'Fruit Set', 'Ripening', 'Harvest'],
      default: 'Seedling',
    },
    healthStatus: {
      type: String,
      enum: ['Healthy', 'Monitoring', 'Needs Attention'],
      default: 'Healthy',
    },
    photo: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    loggedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GrowthLog', growthLogSchema);
