const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://localhost:27017/vavcoin"; // Assuming default local mongo if not in .env

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || MONGODB_URI);
    console.log("Connected to MongoDB");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections in DB:", collections.map(c => c.name));

    // Try to find deposit settings in common collection names
    const collectionNames = ['depositsettings', 'deposits_settings', 'settings'];
    for (const name of collectionNames) {
      const docs = await mongoose.connection.db.collection(name).find({}).toArray();
      console.log(`Documents in ${name}:`, docs.length);
      if (docs.length > 0) {
        console.log(`Sample from ${name}:`, JSON.stringify(docs[0], null, 2));
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkDb();
