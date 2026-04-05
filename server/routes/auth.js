const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const allowedRole = ['patient', 'doctor'].includes(role) ? role : 'patient';

    const user = await User.create({
      name,
      email,
      password,
      role: allowedRole,
      phone
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('assignedDoctor', 'name email');
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      assignedDoctor: user.assignedDoctor || null
    }
  });
});

// GET /api/auth/doctors - List all doctors (for patient to choose)
router.get('/doctors', protect, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name email phone');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// PUT /api/auth/assign-doctor - Patient assigns themselves to a doctor
router.put('/assign-doctor', protect, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can assign a doctor' });
    }

    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: 'doctorId is required' });
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    req.user.assignedDoctor = doctor._id;
    await req.user.save();

    res.json({
      message: 'Doctor assigned successfully',
      assignedDoctor: { id: doctor._id, name: doctor.name, email: doctor.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning doctor' });
  }
});

module.exports = router;
