const mongoose = require("mongoose");

const MONGODB_URI = "mongodb://vavcoin:vavcoin123@ac-y7ucrxm-shard-00-00.g2ap6w5.mongodb.net:27017,ac-y7ucrxm-shard-00-01.g2ap6w5.mongodb.net:27017,ac-y7ucrxm-shard-00-02.g2ap6w5.mongodb.net:27017/?ssl=true&replicaSet=atlas-110u1j-shard-0&authSource=admin&appName=Cluster0";

async function checkCounts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("=> Connected to MongoDB");

    const collections = ["users", "deposits", "withdrawals", "bets", "rounds", "settings"];
    
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll).countDocuments();
      console.log(`${coll}: ${count}`);
    }
  } catch (err) {
    console.error("DB check failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

checkCounts();
