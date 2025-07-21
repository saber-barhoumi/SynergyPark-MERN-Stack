const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const auth = require('../middleware/auth');

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

// ✅ Get User Profile
router.get('/profile', auth, async (req, res) => {
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
        isActive: user.isActive,
        profilePhoto: user.profilePhoto,
        phone: user.phone,
        address: user.address,
        country: user.country,
        state: user.state,
        city: user.city,
        postalCode: user.postalCode,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: err.message
    });
  }
});

// ✅ Update User Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, country, state, city, postalCode } = req.body;

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.userId } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (postalCode !== undefined) updateData.postalCode = postalCode;

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
      data: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        profilePhoto: updatedUser.profilePhoto,
        phone: updatedUser.phone,
        address: updatedUser.address,
        country: updatedUser.country,
        state: updatedUser.state,
        city: updatedUser.city,
        postalCode: updatedUser.postalCode,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt
      }
    });

  } catch (err) {
    console.error('Update profile error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: err.message
    });
  }
});

// ✅ Change Password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.findByIdAndUpdate(req.user.userId, {
      password: hashedNewPassword
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: err.message
    });
  }
});

// ✅ Upload Profile Photo
router.post('/profile-photo', auth, async (req, res) => {
  try {
    // This is a placeholder for file upload functionality
    // In production, implement file upload with multer or similar
    const { profilePhotoUrl } = req.body;

    if (!profilePhotoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Profile photo URL is required'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { profilePhoto: profilePhotoUrl },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: {
        profilePhoto: updatedUser.profilePhoto
      }
    });

  } catch (err) {
    console.error('Upload profile photo error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile photo',
      error: err.message
    });
  }
});

module.exports = router;
