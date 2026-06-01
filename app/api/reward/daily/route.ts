import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { Transaction } from "@/models/transaction";

const DAILY_REWARDS = [4, 6, 8, 10, 15, 20, 40];

export async function POST(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const user = await User.findById(decoded.id);
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    if (user.dailyRewardCompleted) {
      return NextResponse.json({ success: false, message: "Program completed" }, { status: 400 });
    }

    const now = new Date();
    if (user.lastDailyRewardAt) {
      const lastClaim = new Date(user.lastDailyRewardAt);
      const diffMs = now.getTime() - lastClaim.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24) {
        const remainingHours = Math.ceil(24 - diffHours);
        return NextResponse.json({ success: false, message: `Next claim in ${remainingHours} hours` }, { status: 400 });
      }
    }

    const dayIndex = user.dailyRewardDay - 1;
    const rewardAmount = DAILY_REWARDS[dayIndex];

    if (!rewardAmount) {
        return NextResponse.json({ success: false, message: "Invalid reward day" }, { status: 400 });
    }

    // Update User
    const nextDay = user.dailyRewardDay + 1;
    const isCompleted = nextDay > 7;

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { 
        $inc: { balance: rewardAmount },
        $set: { 
          lastDailyRewardAt: now,
          dailyRewardDay: isCompleted ? 7 : nextDay,
          dailyRewardCompleted: isCompleted
        }
      },
      { new: true }
    );

    await Transaction.create({
      userId: user._id,
      type: "BONUS",
      amount: rewardAmount,
      balanceAfter: updatedUser.balance,
      description: `Daily Reward Day ${user.dailyRewardDay}`,
    });

    if ((global as any).io) {
      (global as any).io.emit("DAILY_REWARD_CLAIMED", { mobile: user.mobile, amount: rewardAmount });
    }

    return NextResponse.json({ 
      success: true, 
      message: `₹${rewardAmount} claimed!`,
      balance: updatedUser.balance,
      nextDay: updatedUser.dailyRewardDay,
      isCompleted: updatedUser.dailyRewardCompleted
    });

  } catch (error) {
    console.error("Daily reward error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
    try {
      await connectDB();
      const decoded = verifyToken(req);
      if (!decoded) return NextResponse.json({ success: false }, { status: 401 });
  
      const user = await User.findById(decoded.id).select("dailyRewardDay lastDailyRewardAt dailyRewardCompleted");
      if (!user) return NextResponse.json({ success: false }, { status: 404 });
  
      return NextResponse.json({ 
        success: true, 
        status: {
            currentDay: user.dailyRewardDay,
            lastClaim: user.lastDailyRewardAt,
            isCompleted: user.dailyRewardCompleted,
            rewards: DAILY_REWARDS
        }
      });
    } catch (error) {
      return NextResponse.json({ success: false }, { status: 500 });
    }
  }
