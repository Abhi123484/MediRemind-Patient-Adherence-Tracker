const mongoose = require('mongoose');

const adherenceLogSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  medication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format']
  },
  status: {
    type: String,
    enum: ['taken', 'missed', 'skipped', 'pending'],
    default: 'pending'
  },
  takenAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 300
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

adherenceLogSchema.index({ patient: 1, scheduledDate: 1 });
adherenceLogSchema.index({ patient: 1, medication: 1, scheduledDate: 1 });

module.exports = mongoose.model('AdherenceLog', adherenceLogSchema);
