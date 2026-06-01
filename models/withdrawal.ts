import mongoose, { Schema, models } from "mongoose";

const WithdrawalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    upiId: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "PAID"], default: "PENDING" },
    adminNote: { type: String },
  },
  { timestamps: true }
);

export const Withdrawal = models.Withdrawal || mongoose.model("Withdrawal", WithdrawalSchema);
