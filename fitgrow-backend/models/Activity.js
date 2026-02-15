const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['calories', 'steps', 'water', 'sleep', 'workout'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  workoutType: String, // running, cycling, strength, etc.
  duration: Number, // in minutes
  notes: String,
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
activitySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Activity', activitySchema);
