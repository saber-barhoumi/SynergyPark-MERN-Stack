const express = require('express');
// Use Express's Router explicitly
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { User } = require('../models/User');
// Fix the auth import to use the correct property
const { authenticateToken } = require('../middleware/auth');
const fileUpload = require('express-fileupload');

// ✅ CREATE
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ READ ALL
router.get('/', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ✅ Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePhoto: user.profilePhoto,
        phone: user.phone,
        address: user.address,
        country: user.country,
        state: user.state,
        city: user.city,
        postalCode: user.postalCode
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ✅ Update User Profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // Validate email format
    if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if email already exists (if email is being changed)
    if (req.body.email) {
      const existingUser = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: req.user.userId } // Exclude current user
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Handle profile photo upload
    let updateData = { ...req.body };
    
    if (req.files && req.files.profilePhoto) {
      const profilePhoto = req.files.profilePhoto;
      const fileName = `${Date.now()}-${profilePhoto.name}`;
      const uploadPath = path.join(__dirname, '../../uploads/profiles', fileName);
      
      // Ensure directory exists
      if (!fs.existsSync(path.dirname(uploadPath))) {
        fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
      }
      
      // Move the uploaded file
      await profilePhoto.mv(uploadPath);
      
      // Set the profilePhoto URL in updateData
      updateData.profilePhoto = `/uploads/profiles/${fileName}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ✅ READ ONE
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ DELETE
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;