const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const test = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://monikacreations100000_db_user:893508@ac-yairita-shard-00-00.ofrkida.mongodb.net:27017,ac-yairita-shard-00-01.ofrkida.mongodb.net:27017,ac-yairita-shard-00-02.ofrkida.mongodb.net:27017/monikas_creation?ssl=true&authSource=admin';
  console.log('Connecting to URI:', mongoUri);
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
