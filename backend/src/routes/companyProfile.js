const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCompanyProfile,
  createOrUpdateCompanyProfile,
  checkProfileCompletion,
  getAllCompanyProfiles,
  updateRequestStatus,
  getEnums
} = require('../controllers/companyProfileController');
const CompanyProfile = require('../models/CompanyProfile'); // Added missing import

// Public routes
router.get('/enums', getEnums);

// Protected routes
router.get('/check/:userId', authenticateToken, checkProfileCompletion);
router.get('/:userId', authenticateToken, getCompanyProfile);
router.post('/:userId', authenticateToken, createOrUpdateCompanyProfile);

// Analytics endpoint: returns all company profiles with only analytics fields
router.get('/analytics', authenticateToken, async (req, res) => {
  console.log('ANALYTICS DEBUG req.user:', req.user);
  console.log('ANALYTICS DEBUG req.headers.authorization:', req.headers.authorization);
  try {
    // Only allow S2T users
    if (!req.user || req.user.role !== 'S2T') {
      return res.status(403).json({ success: false, message: 'Access denied: S2T only' });
    }
    // Select only the fields needed for analytics
    const profiles = await CompanyProfile.find({}, {
      activityDomain: 1,
      activitySubDomain: 1,
      projectProgress: 1,
      staffRange: 1,
      supportNeeded: 1,
      requestStatus: 1,
      companyCreationDate: 1,
      address: 1,
      approval: 1
    });
    res.json({ success: true, data: profiles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin routes
router.get('/admin/all', authenticateToken, getAllCompanyProfiles);
router.put('/admin/:profileId/status', authenticateToken, updateRequestStatus);

module.exports = router; 