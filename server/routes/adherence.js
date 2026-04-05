const express = require('express');
const AdherenceLog = require('../models/AdherenceLog');
const Medication = require('../models/Medication');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// POST /api/adherence/log - Log a dose (taken/missed/skipped)
router.post('/log', async (req, res) => {
  try {
    const { medicationId, scheduledDate, scheduledTime, status, notes } = req.body;

    if (!medicationId || !scheduledDate || !scheduledTime || !status) {
      return res.status(400).json({ message: 'medicationId, scheduledDate, scheduledTime, and status are required' });
    }

    const medication = await Medication.findOne({
      _id: medicationId,
      patient: req.user._id
    });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Parse date as UTC midnight to avoid timezone drift
    // Accepts both YYYY-MM-DD and ISO strings
    const dateStr = typeof scheduledDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)
      ? scheduledDate + 'T00:00:00.000Z'
      : scheduledDate;
    const parsedDate = new Date(dateStr);
    // Normalize to UTC midnight
    parsedDate.setUTCHours(0, 0, 0, 0);

    // Upsert: update existing log or create new one
    const log = await AdherenceLog.findOneAndUpdate(
      {
        patient: req.user._id,
        medication: medicationId,
        scheduledDate: parsedDate,
        scheduledTime
      },
      {
        status,
        takenAt: status === 'taken' ? new Date() : undefined,
        notes
      },
      { upsert: true, new: true }
    );

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Error logging dose' });
  }
});

// Helper: get today as UTC midnight from client's local date
function getUTCDateRange(localDateStr) {
  let start;
  if (localDateStr && /^\d{4}-\d{2}-\d{2}$/.test(localDateStr)) {
    start = new Date(localDateStr + 'T00:00:00.000Z');
  } else {
    // Fallback: use server date
    const now = new Date();
    start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

// GET /api/adherence/today - Get today's doses for patient
router.get('/today', async (req, res) => {
  try {
    const { start: today, end: tomorrow } = getUTCDateRange(req.query.localDate);

    const medications = await Medication.find({
      patient: req.user._id,
      isActive: true,
      startDate: { $lte: tomorrow }
    });

    const logs = await AdherenceLog.find({
      patient: req.user._id,
      scheduledDate: { $gte: today, $lt: tomorrow }
    }).populate('medication', 'name dosage color');

    // Build today's schedule from active medications
    const schedule = [];
    for (const med of medications) {
      for (const time of med.scheduleTimes) {
        const existingLog = logs.find(
          l => l.medication._id.toString() === med._id.toString() && l.scheduledTime === time
        );

        schedule.push({
          medicationId: med._id,
          medicationName: med.name,
          dosage: med.dosage,
          color: med.color,
          scheduledTime: time,
          instructions: med.instructions,
          status: existingLog ? existingLog.status : 'pending',
          logId: existingLog ? existingLog._id : null
        });
      }
    }

    schedule.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today\'s schedule' });
  }
});

// GET /api/adherence/weekly - Weekly adherence summary
router.get('/weekly', async (req, res) => {
  try {
    const patientId = req.user.role === 'doctor' && req.query.patientId
      ? req.query.patientId
      : req.user._id;

    // Use client's local date if provided, otherwise server date
    const localDate = req.query.localDate;
    let endUTC;
    if (localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      endUTC = new Date(localDate + 'T00:00:00.000Z');
    } else {
      const now = new Date();
      endUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }
    const startUTC = new Date(endUTC);
    startUTC.setUTCDate(startUTC.getUTCDate() - 6);

    const endRange = new Date(endUTC);
    endRange.setUTCDate(endRange.getUTCDate() + 1);

    const logs = await AdherenceLog.find({
      patient: patientId,
      scheduledDate: { $gte: startUTC, $lt: endRange }
    }).populate('medication', 'name color');

    const totalDoses = logs.length;
    const taken = logs.filter(l => l.status === 'taken').length;
    const missed = logs.filter(l => l.status === 'missed').length;
    const pending = logs.filter(l => l.status === 'pending').length;

    // Daily breakdown using UTC date keys
    const dailyStats = {};
    for (let d = new Date(startUTC); d <= endUTC; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l =>
        l.scheduledDate.toISOString().split('T')[0] === dateKey
      );
      dailyStats[dateKey] = {
        total: dayLogs.length,
        taken: dayLogs.filter(l => l.status === 'taken').length,
        missed: dayLogs.filter(l => l.status === 'missed').length,
        pending: dayLogs.filter(l => l.status === 'pending').length
      };
    }

    res.json({
      summary: {
        totalDoses,
        taken,
        missed,
        pending,
        adherenceRate: totalDoses > 0 ? Math.round((taken / totalDoses) * 100) : 0
      },
      dailyStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching weekly summary' });
  }
});

// GET /api/adherence/streak - Get current streak
router.get('/streak', async (req, res) => {
  try {
    // Use client's local date if provided
    const localDate = req.query.localDate;
    let todayUTC;
    if (localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      todayUTC = new Date(localDate + 'T00:00:00.000Z');
    } else {
      const now = new Date();
      todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    let streak = 0;
    let checkDate = new Date(todayUTC);

    while (true) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const dayLogs = await AdherenceLog.find({
        patient: req.user._id,
        scheduledDate: { $gte: dayStart, $lt: dayEnd }
      });

      if (dayLogs.length === 0 && checkDate < todayUTC) break;

      if (dayLogs.length > 0) {
        const allTaken = dayLogs.every(l => l.status === 'taken');
        if (allTaken) {
          streak++;
        } else if (checkDate < todayUTC) {
          break;
        }
      }

      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      if (streak > 365) break; // safety limit
    }

    res.json({ streak });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating streak' });
  }
});

// GET /api/adherence/calendar - Get month calendar data
router.get('/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth();
    const y = parseInt(year) || new Date().getFullYear();

    // Use UTC dates to match how we store scheduledDate
    const startDate = new Date(Date.UTC(y, m, 1));
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const endDate = new Date(Date.UTC(y, m, lastDay));
    const queryEnd = new Date(Date.UTC(y, m + 1, 1)); // exclusive upper bound

    const logs = await AdherenceLog.find({
      patient: req.user._id,
      scheduledDate: { $gte: startDate, $lt: queryEnd }
    }).populate('medication', 'name dosage color');

    const calendarData = {};
    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l =>
        l.scheduledDate.toISOString().split('T')[0] === dateKey
      );
      if (dayLogs.length > 0) {
        calendarData[dateKey] = {
          total: dayLogs.length,
          taken: dayLogs.filter(l => l.status === 'taken').length,
          missed: dayLogs.filter(l => l.status === 'missed').length,
          pending: dayLogs.filter(l => l.status === 'pending').length,
          doses: dayLogs.map(l => ({
            medication: l.medication,
            scheduledTime: l.scheduledTime,
            status: l.status
          }))
        };
      }
    }

    res.json(calendarData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching calendar data' });
  }
});

// DOCTOR ROUTES

// GET /api/adherence/doctor/patients - Get all patients for a doctor
router.get('/doctor/patients', authorize('doctor'), async (req, res) => {
  try {
    const patients = await User.find({
      role: 'patient',
      assignedDoctor: req.user._id
    }).select('name email phone createdAt');

    // Get adherence summary for each patient
    const patientsWithStats = await Promise.all(
      patients.map(async (patient) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);

        const logs = await AdherenceLog.find({
          patient: patient._id,
          scheduledDate: { $gte: startDate, $lte: endDate }
        });

        const total = logs.length;
        const taken = logs.filter(l => l.status === 'taken').length;

        return {
          ...patient.toObject(),
          weeklyAdherence: total > 0 ? Math.round((taken / total) * 100) : 0,
          totalDoses: total,
          takenDoses: taken
        };
      })
    );

    res.json(patientsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients' });
  }
});

// GET /api/adherence/doctor/report/:patientId - Detailed patient report
router.get('/doctor/report/:patientId', authorize('doctor'), async (req, res) => {
  try {
    const patient = await User.findOne({
      _id: req.params.patientId,
      role: 'patient',
      assignedDoctor: req.user._id
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found or not assigned to you' });
    }

    const medications = await Medication.find({ patient: patient._id, isActive: true });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29);

    const logs = await AdherenceLog.find({
      patient: patient._id,
      scheduledDate: { $gte: startDate, $lte: endDate }
    }).populate('medication', 'name dosage');

    const total = logs.length;
    const taken = logs.filter(l => l.status === 'taken').length;
    const missed = logs.filter(l => l.status === 'missed').length;

    // Per-medication breakdown
    const medStats = medications.map(med => {
      const medLogs = logs.filter(l => l.medication._id.toString() === med._id.toString());
      const medTotal = medLogs.length;
      const medTaken = medLogs.filter(l => l.status === 'taken').length;
      return {
        medication: { id: med._id, name: med.name, dosage: med.dosage },
        total: medTotal,
        taken: medTaken,
        adherenceRate: medTotal > 0 ? Math.round((medTaken / medTotal) * 100) : 0
      };
    });

    res.json({
      patient: { id: patient._id, name: patient.name, email: patient.email },
      period: { start: startDate, end: endDate },
      summary: {
        totalDoses: total,
        taken,
        missed,
        adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 0
      },
      medicationBreakdown: medStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating report' });
  }
});

module.exports = router;
