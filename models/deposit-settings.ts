import mongoose, { Schema, models } from "mongoose";

const DepositSettingsSchema = new Schema(
  {
    upiId: { type: String, required: true },
    qrImage: { type: String, required: true }, // Base64 or URL
  },
  { timestamps: true }
);

export const DepositSettings = models.DepositSettings || mongoose.model("DepositSettings", DepositSettingsSchema);
