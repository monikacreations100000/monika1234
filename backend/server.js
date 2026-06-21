process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION:', err);
});

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Failed to set Google DNS servers:', e.message);
}
dns.setDefaultResultOrder('ipv4first');

// Nodemon trigger change to reload new env

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const userRoutes = authRoutes;
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

    // Allow any Vercel deployments (including preview links)
    const isVercelSubdomain = origin && origin.endsWith('.vercel.app');

    if (!origin || allowedOrigins.includes(origin) || isLocalNetwork || isVercelSubdomain) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.path} (IP: ${req.ip})`);
  next();
});

// Restore original request URL from Vercel routing headers if rewritten to root
app.use((req, res, next) => {
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-forwarded-url'];
  if (matchedPath) {
    req.url = matchedPath;
  }
  next();
});

// State flag for mock database fallback
global.useMockDb = false;

// Connect to Database (MongoDB or fallback to Mock Database)
const dbAdapter = require('./data/dbAdapter');

let cachedConnectionPromise = null;

const cleanMongoUri = (uri) => {
  if (!uri) return uri;
  try {
    let cleaned = uri.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    const match = cleaned.match(/^(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)$/);
    if (match) {
      let password = match[2];
      password = password.replace(/\s+/g, '');
      if (password.startsWith('<') && password.endsWith('>')) {
        password = password.slice(1, -1);
      }
      return `${match[1]}${password}${match[3]}`;
    }
    return cleaned;
  } catch (e) {
    console.error('Error cleaning MongoDB URI:', e.message);
  }
  return uri;
};

const initializeDatabase = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cachedConnectionPromise) {
    const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://monikacreations100000_db_user:893508@ac-yairita-shard-00-00.ofrkida.mongodb.net:27017,ac-yairita-shard-00-01.ofrkida.mongodb.net:27017,ac-yairita-shard-00-02.ofrkida.mongodb.net:27017/monikas_creation?ssl=true&authSource=admin';
    const mongoUri = cleanMongoUri(rawUri);
    console.log('Connecting to MongoDB database...');
    console.log('Loaded URI:', mongoUri.replace(/:([^@]+)@/, ':****@'));

    cachedConnectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for serverless/Vercel functions
      family: 4, // Force IPv4 to resolve Atlas DNS issues
      socketTimeoutMS: 45000
    }).then(async (conn) => {
      console.log('✅ MongoDB Connected');
      try {
        const Product = require('./models/Product');
        const User = require('./models/User');
        const Order = require('./models/Order');
        const Coupon = require('./models/Coupon');
        const productCount = await Product.countDocuments();
        const userCount = await User.countDocuments();
        const orderCount = await Order.countDocuments();
        const couponCount = await Coupon.countDocuments();
        console.log(`📊 Collection Counts -> Products: ${productCount}, Users: ${userCount}, Orders: ${orderCount}, Coupons: ${couponCount}`);
      } catch (countErr) {
        console.warn('Could not read collection counts:', countErr.message);
      }
      global.useMockDb = false;

      // Seed initial data if database is empty
      await seedData();

      // Ensure owner account always exists with admin rights in MongoDB
      try {
        const bcrypt = require('bcryptjs');
        const ownerEmail = 'monikacreations100000@gmail.com';
        
        const ownerExists = await dbAdapter.findUserByEmail(ownerEmail);
        if (!ownerExists) {
          console.log('Owner account not found in MongoDB. Seeding owner account...');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('8935086', salt);
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
          const hashedPassword = await bcrypt.hash('8935086', salt);
          await dbAdapter.updateUser(ownerExists._id, {
            isAdmin: true,
            password: hashedPassword
          });
          console.log('Owner account verified in MongoDB.');
        }
      } catch (err) {
        console.error('Error ensuring owner admin account in MongoDB:', err.message);
      }
      return conn;
    }).catch((err) => {
      cachedConnectionPromise = null; // Reset connection promise on failure to retry next time
      console.error("❌ MongoDB Connection Error:");
      console.error(err);
      if (!process.env.VERCEL) {
        process.exit(1); // Exit process locally, but not on Vercel
      }
      throw err;
    });
  }

  return cachedConnectionPromise;
};

// Start connecting to database
initializeDatabase().catch((err) => {
  console.error('Initial database connection attempt failed:', err.message);
});

// Middleware to ensure DB connection is ready on API requests
const ensureDbConnection = async (req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return next();
  }
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const currentState = mongoose.connection.readyState;
  console.log(`🔌 [DATABASE STATE] Connection state is "${states[currentState] || currentState}" (code: ${currentState})`);

  try {
    await initializeDatabase();
    next();
  } catch (err) {
    console.error('❌ Database connection failed during request processing:', err);
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Please try again later.',
      error: err.message,
      stack: err.stack
    });
  }
};

// Routes
app.use(ensureDbConnection);

console.log('Registering API routes:');
app.use('/api/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', authRoutes);
app.use('/api/coupons', couponRoutes);
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

// Diagnostic test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API Working'
  });
});

// Registered routes list route
app.get('/api/routes', (req, res) => {
  res.json({
    registeredRoutes: [
      '/api/users',
      '/api/auth',
      '/api/admin',
      '/api/products',
      '/api/orders',
      '/api/coupons',
      '/api/settings',
      '/api/upload',
      '/api/status',
      '/api/test',
      '/api/routes'
    ]
  });
});

// Root path handler
app.get('/', (req, res) => {
  res.json({
    status: 'Online',
    brand: "Monika's Creation API",
    database: global.useMockDb ? 'Mock In-Memory' : 'MongoDB Atlas/Local',
    timestamp: new Date()
  });
});

// Serve frontend index.html for any other non-API route (fallback for local full-stack dev)
if (!process.env.VERCEL) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).send('Frontend static assets are not built yet. Run "npm run build-frontend" to build the React application.');
      }
    });
  });
} else {
  // On Vercel, return 404 for unmatched non-API routes to avoid serving HTML
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.status(404).json({
      success: false,
      message: `Path ${req.url} not found on this API server.`
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error('🔥 [GLOBAL SERVER ERROR] Stack trace:', err);
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: err.stack,
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
