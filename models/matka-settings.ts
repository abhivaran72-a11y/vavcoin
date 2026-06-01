import mongoose, { Schema, models } from "mongoose";

const MatkaSettingsSchema = new Schema(
  {
    minBet: { type: Number, default: 10 },
    maxBet: { type: Number, default: 10000 },
    timerSeconds: { type: Number, default: 45 },
    commissionPercentage: { type: Number, default: 2 },
    payoutMultiplier: { type: Number, default: 4 },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MatkaSettings = models.MatkaSettings || mongoose.model("MatkaSettings", MatkaSettingsSchema);
