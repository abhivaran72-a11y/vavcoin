import mongoose, { Schema, models } from "mongoose";

const BetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roundId: { type: Schema.Types.ObjectId, ref: "Round", required: true },
    amount: { type: Number, required: true },
    choice: { type: String, enum: ["HEAD", "TAIL"], required: true },
    result: { type: String, enum: ["HEAD", "TAIL", "PENDING"], default: "PENDING" },
    status: { type: String, enum: ["WIN", "LOSS", "PENDING"], default: "PENDING" },
    winAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Bet = models.Bet || mongoose.model("Bet", BetSchema);
