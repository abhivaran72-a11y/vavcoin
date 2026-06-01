import mongoose, { Schema, models } from "mongoose";

const MatkaBetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roundId: { type: Schema.Types.ObjectId, ref: "MatkaRound", required: true },
    amount: { type: Number, required: true },
    choice: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
    result: { type: Number, enum: [1, 2, 3, 4, 5, null], default: null },
    status: { type: String, enum: ["WIN", "LOSS", "PENDING"], default: "PENDING" },
    winAmount: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const MatkaBet = models.MatkaBet || mongoose.model("MatkaBet", MatkaBetSchema);
