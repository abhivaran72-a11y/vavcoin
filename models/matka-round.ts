import mongoose, { Schema, models } from "mongoose";

const MatkaRoundSchema = new Schema(
  {
    roundNumber: { type: String, required: true, unique: true },
    result: { type: Number, enum: [1, 2, 3, 4, 5, null], default: null },
    totalAmounts: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    totalPool: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "LOCKED", "COMPLETED"], default: "ACTIVE" },
    endTime: { type: Date, required: true },
  },
  { timestamps: true }
);

export const MatkaRound = models.MatkaRound || mongoose.model("MatkaRound", MatkaRoundSchema);
