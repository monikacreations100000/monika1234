const jwt = require('jsonwebtoken');
const dbAdapter = require('../data/dbAdapter');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'monikascreationsecret');

      req.user = await dbAdapter.findUserById(decoded.id);
      if (!req.user) {
        console.warn(`[AUTH FAIL] User not found for token id (IP: ${req.ip})`);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Exclude password from req.user
      if (req.user) {
        delete req.user.password;
      }

      next();
    } catch (error) {
      console.warn(`[AUTH FAIL] Token verification failed: ${error.message} (IP: ${req.ip})`);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.warn(`[AUTH FAIL] Access attempted without authorization token (IP: ${req.ip})`);
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    console.warn(`[AUTH FAIL] Non-admin user "${req.user?.email || 'unknown'}" attempted admin access (IP: ${req.ip})`);
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
