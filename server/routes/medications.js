const express = require('express');
const Medication = require('../models/Medication');
const AdherenceLog = require('../models/AdherenceLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/medications - Get patient's medications
router.get('/', async (req, res) => {
  try {
    const patientId = req.user.role === 'doctor' && req.query.patientId
      ? req.query.patientId
      : req.user._id;

    const medications = await Medication.find({ patient: patientId, isActive: true })
      .sort({ createdAt: -1 });

    res.json(medications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching medications' });
  }
});

// POST /api/medications - Add new medication
router.post('/', async (req, res) => {
  try {
    const { name, dosage, frequency, scheduleTimes, startDate, endDate, instructions, color } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({ message: 'Name and dosage are required' });
    }

    const medication = await Medication.create({
      patient: req.user._id,
      name,
      dosage,
      frequency,
      scheduleTimes,
      startDate,
      endDate,
      instructions,
      color
    });

    res.status(201).json(medication);
  } catch (error) {
    res.status(500).json({ message: 'Error creating medication' });
  }
});

// PUT /api/medications/:id - Update medication
router.put('/:id', async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      patient: req.user._id
    });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    const allowedFields = ['name', 'dosage', 'frequency', 'scheduleTimes', 'endDate', 'instructions', 'isActive', 'color'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        medication[field] = req.body[field];
      }
    });

    await medication.save();
    res.json(medication);
  } catch (error) {
    res.status(500).json({ message: 'Error updating medication' });
  }
});

// DELETE /api/medications/:id - Deactivate medication
router.delete('/:id', async (req, res) => {
  try {
    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, patient: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    res.json({ message: 'Medication deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting medication' });
  }
});

module.exports = router;
