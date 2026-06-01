import mongoose, { Schema, models } from "mongoose";

const SettingsSchema = new Schema(
  {
    maintenanceMode: { type: Boolean, default: false },
    fakeOnlineCount: { type: Number, default: 500 },
    minBet: { type: Number, default: 5 },
    maxBet: { type: Number, default: 10000 },
    commissionPercentage: { type: Number, default: 1 },
    forcedResult: { type: String, enum: ["HEAD", "TAIL", null], default: null },
  },
  { timestamps: true }
);

export const Settings = models.Settings || mongoose.model("Settings", SettingsSchema);
