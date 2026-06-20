const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');
const seedData = require('./data/seed');

const app = express();

// CORS: allow Vite dev (port 3000/3001/5173) and production origin
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // In development mode, allow any origin to access the server
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, allow requests with no origin, allowed domains, or local network IPs (for testing)
    const isLocalNetwork = origin && (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.startsWith('http://172.')
    );

    if (!origin || allowedOrigins.includes(origin) || isLocalNetwork) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// State flag for mock database fallback
global.useMockDb = false;

// Connect to Database (MongoDB or fallback to Mock Database)
const dbAdapter = require('./data/dbAdapter');

const initializeDatabase = async () => {
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://monikacreations100000_db_user:893508@ac-yairita-shard-00-00.ofrkida.mongodb.net:27017,ac-yairita-shard-00-01.ofrkida.mongodb.net:27017,ac-yairita-shard-00-02.ofrkida.mongodb.net:27017/monikas_creation?ssl=true&authSource=admin';
  console.log('Connecting to MongoDB database...');
  console.log('Loaded URI:', mongoUri.replace(/:([^@]+)@/, ':****@'));
  
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000, // Timeout after 3 seconds
      family: 4 // Force IPv4 to resolve Atlas DNS issues
    });
    console.log('Successfully connected to MongoDB!');
    global.useMockDb = false;
    
    // Seed initial data if database is empty
    await seedData();

    // Ensure owner account always exists with admin rights in MongoDB
    try {
      const bcrypt = require('bcryptjs');
      const ownerEmail = 'sethswayam21@gmail.com';
      
      const ownerExists = await dbAdapter.findUserByEmail(ownerEmail);
      if (!ownerExists) {
        console.log('Owner account not found in MongoDB. Seeding owner account...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Monik@6306', salt);
        await dbAdapter.createUser({
          name: "Monika's Creation Owner",
          email: ownerEmail,
          password: hashedPassword,
          phone: '0000000000',
          isAdmin: true
        });
        console.log('Owner account seeded in MongoDB successfully.');
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Monik@6306', salt);
        await dbAdapter.updateUser(ownerExists._id, {
          isAdmin: true,
          password: hashedPassword
        });
        console.log('Owner account verified in MongoDB.');
      }
    } catch (err) {
      console.error('Error ensuring owner admin account in MongoDB:', err.message);
    }
  } catch (err) {
    console.error('===============================================================');
    console.error('FATAL ERROR: Could not connect to MongoDB database.');
    console.error('Reason:', err.message);
    console.error('FALLING BACK: Mock In-Memory Database is DISABLED.');
    console.error('===============================================================');
    process.exit(1); // Exit process to fail loudly
  }
};

initializeDatabase();

// Routes
app.use('/api/users', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

// Serve static assets
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));
const uploadStaticDir = process.env.VERCEL 
  ? '/tmp/uploads' 
  : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadStaticDir));

// Health check / API status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'Online',
    brand: "Monika's Creation API",
    database: global.useMockDb ? 'Mock In-Memory' : 'MongoDB Atlas/Local',
    timestamp: new Date()
  });
});

// Serve frontend index.html for any other non-API route
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      if (req.path === '/') {
        return res.json({
          status: 'Online',
          brand: "Monika's Creation API (Frontend not built yet)",
          database: global.useMockDb ? 'Mock In-Memory' : 'MongoDB Atlas/Local',
          timestamp: new Date()
        });
      }
      res.status(404).send('Frontend static assets are not built yet. Run "npm run build-frontend" to build the React application.');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
let server = null;

const startServer = (retries = 5) => {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} in ${global.useMockDb ? 'MOCK' : 'MONGO'} database mode.`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (retries > 0) {
        console.log(`Port ${PORT} is busy, retrying in 1 second... (${retries} retries left)`);
        setTimeout(() => {
          startServer(retries - 1);
        }, 1000);
      } else {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error(`   Stop the existing process and restart: kill the process using port ${PORT}\n`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', err.message);
      process.exit(1);
    }
  });
};

if (!process.env.VERCEL) {
  startServer();
}

// Graceful shutdown on SIGTERM/SIGINT (used by nodemon on restart)
const shutdown = () => {
  console.log('\nShutting down server gracefully...');
  if (server) {
    server.close(() => {
      if (mongoose.connection.readyState !== 0) {
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  }
  // Force exit after 5 seconds if still hanging
  setTimeout(() => process.exit(0), 5000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
