import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { Round } from "@/models/round";
import { Bet } from "@/models/bet";
import { Transaction } from "@/models/transaction";
import { Settings } from "@/models/settings";
import { getCurrentRound } from "@/lib/game-logic";

export async function POST(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { amount, choice } = await req.json();
    const settings = (await Settings.findOne()) || (await Settings.create({}));

    if (settings.maintenanceMode) {
      return NextResponse.json({ success: false, message: "Maintenance in progress" }, { status: 503 });
    }

    if (!amount || amount < settings.minBet) {
      return NextResponse.json({ success: false, message: `Min bet is ₹${settings.minBet}` }, { status: 400 });
    }

    if (!["HEAD", "TAIL"].includes(choice)) {
      return NextResponse.json({ success: false, message: "Invalid choice" }, { status: 400 });
    }

    const { round, secondsLeft } = await getCurrentRound();

    if (secondsLeft <= 5 || round.status !== "ACTIVE") {
      return NextResponse.json({ success: false, message: "Betting locked" }, { status: 400 });
    }

    // Prevent duplicate bets on the same side in the same round
    const existingBet = await Bet.findOne({ userId: decoded.id, roundId: round._id, choice });
    if (existingBet) {
      return NextResponse.json({ success: false, message: `You already placed a bet on ${choice} this round` }, { status: 400 });
    }

    // Atomic Deduct & Validation
    const user = await User.findOneAndUpdate(
      { _id: decoded.id, balance: { $gte: amount }, isBlocked: false },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: "Insufficient balance or account blocked" }, { status: 400 });
    }

    const bet = await Bet.create({
      userId: user._id,
      roundId: round._id,
      amount,
      choice,
    });

    await Round.updateOne(
      { _id: round._id },
      { $inc: choice === "HEAD" ? { totalHeadAmount: amount } : { totalTailAmount: amount } }
    );

    await Transaction.create({
      userId: user._id,
      type: "BET",
      amount: -amount,
      balanceAfter: user.balance,
      description: `Bet on ${choice} Round ${round.roundNumber}`,
      roundId: round._id,
    });

    if ((global as any).io) {
      (global as any).io.emit("NEW_BET", {
        bet,
        totalHeadAmount: round.totalHeadAmount + (choice === "HEAD" ? amount : 0),
        totalTailAmount: round.totalTailAmount + (choice === "TAIL" ? amount : 0)
      });
    }

    return NextResponse.json({
      success: true,
      message: "Bet placed!",
      balance: user.balance,
      bet,
    });
  } catch (error: any) {
    console.error("Bet error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
