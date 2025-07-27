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
  try {
    // No authentication or role check
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