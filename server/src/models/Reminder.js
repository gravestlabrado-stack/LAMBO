const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tree: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tree',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['watering', 'fertilizer', 'inspection', 'custom'],
      default: 'watering',
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    repeatInterval: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'biweekly'],
      default: 'none',
    },
    subscription: {
      endpoint: { type: String, default: null },
      keys: {
        p256dh: { type: String, default: null },
        auth: { type: String, default: null },
      },
    },
    isSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reminder', reminderSchema);
