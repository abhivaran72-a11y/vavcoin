import mongoose from "mongoose";
import { migrateReferralCodes } from "./migration";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("=> Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log("=> MongoDB connected successfully");
      
      // Run referral code migration
      try {
        await migrateReferralCodes();
      } catch (err) {
        console.error("=> Migration error:", err);
      }

      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("=> MongoDB connection failed:", e);
    throw e;
  }

  return cached.conn;
}
