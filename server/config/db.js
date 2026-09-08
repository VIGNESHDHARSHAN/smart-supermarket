const mongoose = require('mongoose');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch (e) {}
try { require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); } catch (e) {}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartmart';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`==================================================`);
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
    console.log(`==================================================`);

    mongoose.connection.on('error', (err) => {
      console.error('⚠️ MongoDB runtime error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
      isConnected = false;
    });

    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.error('👉 Make sure your MongoDB service is running locally, e.g.:');
    console.error('   mongod (or start MongoDB service in Windows Services)');
    console.error('👉 Or configure a MongoDB Atlas connection string in server/.env:');
    console.error('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartmart');
    // Don't throw fatal error so API server can still respond with meaningful error messages
    return null;
  }
};

module.exports = { connectDB, mongoose };
