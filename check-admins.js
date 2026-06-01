const mongoose = require("mongoose");

const MONGODB_URI = "mongodb://vavcoin:vavcoin123@ac-y7ucrxm-shard-00-00.g2ap6w5.mongodb.net:27017,ac-y7ucrxm-shard-00-01.g2ap6w5.mongodb.net:27017,ac-y7ucrxm-shard-00-02.g2ap6w5.mongodb.net:27017/?ssl=true&replicaSet=atlas-110u1j-shard-0&authSource=admin&appName=Cluster0";

async function checkAdmins() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("=> Connected to MongoDB");

    const users = await mongoose.connection.db.collection("users").find({ isAdmin: true }).toArray();
    console.log(`Found ${users.length} admins:`);
    users.forEach(u => {
      console.log(`Mobile: ${u.mobile}, isAdmin: ${u.isAdmin}, _id: ${u._id}`);
    });

  } catch (err) {
    console.error("Check failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmins();
