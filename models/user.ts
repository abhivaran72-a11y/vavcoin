import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    mobile: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0, index: true },
    totalWin: { type: Number, default: 0 },
    totalLoss: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    
    // Referral System
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    referralRewardClaimed: { type: Boolean, default: false }, // Status of this user being a 'successful' referral
    welcomeBonusClaimed: { type: Boolean, default: false }, // Status of direct welcome bonus
    referralEarnings: { type: Number, default: 0 },

    // Daily Reward System
    dailyRewardDay: { type: Number, default: 1 }, // 1 to 7
    lastDailyRewardAt: { type: Date },
    dailyRewardCompleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const User = models.User || mongoose.model("User", UserSchema);
