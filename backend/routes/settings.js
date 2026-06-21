const express = require('express');
const router = express.Router();
const dbAdapter = require('../data/dbAdapter');
const { protect, admin } = require('../middleware/authMiddleware');

// Helper to log and respond with error
const handleError = (res, message, status = 500) => (error) => {
  console.error(`❌ [SETTINGS ROUTE ERROR] ${message}:`, error);
  res.status(status).json({
    success: false,
    message: error.message || message,
    stack: error.stack
  });
};

// @desc    Get UPI & QR code settings
// @route   GET /api/settings/upi
// @access  Public
router.get('/upi', async (req, res) => {
  try {
    const upiSettings = await dbAdapter.getSettings('upi_settings', {
      upiId: process.env.UPI_ID || 'sethswayam21@okaxis',
      qrCode: process.env.QR_CODE || ''
    });
    res.json(upiSettings);
  } catch (error) {
    handleError(res, 'Get UPI settings failed')(error);
  }
});

// @desc    Update UPI & QR code settings
// @route   PUT /api/settings/upi
// @access  Private/Admin
router.put('/upi', protect, admin, async (req, res) => {
  try {
    const { upiId, qrCode } = req.body;
    
    if (!upiId) {
      return res.status(400).json({ success: false, message: 'UPI ID is required' });
    }

    const updated = await dbAdapter.updateSettings('upi_settings', {
      upiId,
      qrCode: qrCode || ''
    });
    
    res.json(updated);
  } catch (error) {
    handleError(res, 'Update UPI settings failed')(error);
  }
});

module.exports = router;
