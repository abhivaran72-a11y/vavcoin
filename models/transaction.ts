import mongoose, { Schema, models } from "mongoose";

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["BET", "WIN", "REFUND", "DEPOSIT", "WITHDRAWAL", "BONUS"], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String },
    roundId: { type: Schema.Types.ObjectId, ref: "Round" },
  },
  { timestamps: true }
);

export const Transaction = models.Transaction || mongoose.model("Transaction", TransactionSchema);
