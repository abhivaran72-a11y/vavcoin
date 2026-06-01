import mongoose, { Schema, models } from "mongoose";

const DepositSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    utr: { type: String, required: true, unique: true, index: true },
    screenshot: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    adminNote: { type: String },
  },
  { timestamps: true }
);

export const Deposit = models.Deposit || mongoose.model("Deposit", DepositSchema);
