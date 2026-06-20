const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, admin } = require('../middleware/authMiddleware');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Upload a single file
// @route   POST /api/upload/single
// @access  Private/Admin
router.post('/single', protect, admin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'monikas_creation'
    });

    // Remove local temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(200).json({
      message: 'File uploaded successfully',
      url: result.secure_url,
      filename: result.public_id,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private/Admin
router.post('/multiple', protect, admin, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const urls = [];
    const filesData = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'monikas_creation'
      });
      
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      urls.push(result.secure_url);
      filesData.push({
        url: result.secure_url,
        filename: result.public_id,
        mimetype: file.mimetype,
        size: file.size
      });
    }
    
    res.status(200).json({
      message: 'Files uploaded successfully',
      urls: urls,
      files: filesData
    });
  } catch (error) {
    if (req.files) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
