import mongoose, { Schema, models } from "mongoose";

const RoundSchema = new Schema(
  {
    roundNumber: { type: String, required: true, unique: true },
    result: { type: String, enum: ["HEAD", "TAIL", null], default: null },
    totalHeadAmount: { type: Number, default: 0 },
    totalTailAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "LOCKED", "COMPLETED"], default: "ACTIVE" },
    endTime: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Round = models.Round || mongoose.model("Round", RoundSchema);
