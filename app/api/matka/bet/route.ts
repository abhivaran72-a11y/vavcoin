import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { MatkaRound } from "@/models/matka-round";
import { MatkaBet } from "@/models/matka-bet";
import { Transaction } from "@/models/transaction";
import { MatkaSettings } from "@/models/matka-settings";
import { getCurrentMatkaRound } from "@/lib/matka-logic";

export async function POST(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { amount, choice } = await req.json();
    const settings = (await MatkaSettings.findOne()) || (await MatkaSettings.create({}));

    if (settings.maintenanceMode) {
      return NextResponse.json({ success: false, message: "Maintenance in progress" }, { status: 503 });
    }

    if (!amount || amount < settings.minBet) {
      return NextResponse.json({ success: false, message: `Min bet is ₹${settings.minBet}` }, { status: 400 });
    }

    if (![1, 2, 3, 4, 5].includes(choice)) {
      return NextResponse.json({ success: false, message: "Invalid choice" }, { status: 400 });
    }

    const { round, secondsLeft } = await getCurrentMatkaRound();

    if (secondsLeft <= 5 || round.status !== "ACTIVE") {
      return NextResponse.json({ success: false, message: "Betting locked" }, { status: 400 });
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

    const commission = amount * (settings.commissionPercentage / 100);

    const bet = await MatkaBet.create({
      userId: user._id,
      roundId: round._id,
      amount,
      choice,
      commission
    });

    const updateField = `totalAmounts.${choice}`;
    await MatkaRound.updateOne(
      { _id: round._id },
      { 
        $inc: { 
          [updateField]: amount,
          totalPool: amount
        } 
      }
    );

    await Transaction.create({
      userId: user._id,
      type: "BET",
      amount: -amount,
      balanceAfter: user.balance,
      description: `Matka Bet on ${choice} Round ${round.roundNumber}`,
      roundId: round._id,
    });

    if ((global as any).io) {
      (global as any).io.emit("MATKA_NEW_BET", {
        bet,
        totalAmounts: {
          ...round.totalAmounts,
          [choice]: round.totalAmounts[choice] + amount
        },
        totalPool: round.totalPool + amount
      });
    }

    return NextResponse.json({
      success: true,
      message: "Bet placed!",
      balance: user.balance,
      bet,
    });
  } catch (error: any) {
    console.error("Matka bet error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
