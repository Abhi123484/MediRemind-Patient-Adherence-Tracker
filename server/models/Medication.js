const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true,
    maxlength: 200
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    enum: ['once_daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed'],
    default: 'once_daily'
  },
  scheduleTimes: [{
    type: String,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format']
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#4A90D9'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

medicationSchema.index({ patient: 1, isActive: 1 });

module.exports = mongoose.model('Medication', medicationSchema);
