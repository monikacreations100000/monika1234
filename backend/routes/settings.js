const express = require('express');
const router = express.Router();
const dbAdapter = require('../data/dbAdapter');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get UPI & QR code settings
// @route   GET /api/settings/upi
// @access  Public
router.get('/upi', async (req, res) => {
  try {
    const defaultSettings = {
      upiId: process.env.UPI_ID || "",
      qrCode: process.env.QR_CODE || ""
    };
    const upiSettings = await dbAdapter.getSettings('upi_settings', defaultSettings);
    res.json({
      upiId: (upiSettings && upiSettings.upiId) ? upiSettings.upiId : (process.env.UPI_ID || ""),
      qrCode: (upiSettings && upiSettings.qrCode) ? upiSettings.qrCode : (process.env.QR_CODE || "")
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV !== 'production'
        ? err.stack
        : undefined
    });
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV !== 'production'
        ? err.stack
        : undefined
    });
  }
});

module.exports = router;
