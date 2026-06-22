const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Failed to set Google DNS servers:', e.message);
}
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const cleanMongoUri = (uri) => {
  if (!uri) return uri;
  try {
    let cleaned = uri.trim();
    if (cleaned.startsWith('MONGODB_URI=')) {
      cleaned = cleaned.substring('MONGODB_URI='.length).trim();
    }
    if (cleaned.startsWith('MONGO_URI=')) {
      cleaned = cleaned.substring('MONGO_URI='.length).trim();
    }
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

const test = async () => {
  const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://monikacreations100000_db_user:893508@ac-yairita-shard-00-00.ofrkida.mongodb.net:27017,ac-yairita-shard-00-01.ofrkida.mongodb.net:27017,ac-yairita-shard-00-02.ofrkida.mongodb.net:27017/monikas_creation?ssl=true&authSource=admin';
  const mongoUri = cleanMongoUri(rawUri);
  console.log('Raw URI from env:', rawUri.replace(/:([^@]+)@/, ':****@'));
  console.log('Cleaned URI to connect:', mongoUri.replace(/:([^@]+)@/, ':****@'));
  console.log('Cleaned URI password (unmasked for validation):', mongoUri.match(/^(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)$/)?.[2]);
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    console.log('Connected successfully!');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`Document count in ${coll.name}:`, count);
      if (coll.name === 'products') {
        const sample = await db.collection(coll.name).find().limit(2).toArray();
        console.log('Sample products:', JSON.stringify(sample, null, 2));
      }
    }
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await mongoose.connection.close();
  }
};

test();
