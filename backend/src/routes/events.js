const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticateToken } = require('../middleware/auth');

// List events for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.userId || req.user._id }).sort({ start: 1 });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create event for current user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, start, end, location, description, color } = req.body;
    if (!title || !start) {
      return res.status(400).json({ success: false, message: 'Title and start are required' });
    }
    const event = await Event.create({
      userId: req.user.userId || req.user._id,
      title,
      start,
      end,
      location,
      description,
      color
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;


