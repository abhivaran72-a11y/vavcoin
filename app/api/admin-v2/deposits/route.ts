import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { Deposit } from "@/models/deposit";
import { Transaction } from "@/models/transaction";

export async function GET(req: Request) {
  try {
    console.log("\n[ADMIN V2 DEPOSITS AUTH TRACE] === START ===");
    await connectDB();
    const decoded = verifyToken(req);
    console.log("[ADMIN V2 DEPOSITS AUTH TRACE] TOKEN DECODED:", decoded);

    if (!decoded) {
      console.log("[ADMIN V2 DEPOSITS AUTH TRACE] REJECTION: No token");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const admin = await User.findById(decoded.id);
    console.log("[ADMIN V2 DEPOSITS AUTH TRACE] USER FOUND:", admin ? admin.mobile : "null");
    console.log("[ADMIN V2 DEPOSITS AUTH TRACE] ISADMIN VALUE:", admin ? admin.isAdmin : "N/A");

    if (!admin || !admin.isAdmin) {
      console.log("[ADMIN V2 DEPOSITS AUTH TRACE] REJECTION: Not admin");
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    // Explicitly reference User model to ensure registration for populate
    const deposits = await Deposit.find().sort({ createdAt: -1 }).populate("userId", "mobile");
    console.log(`[ADMIN V2 DEPOSITS AUTH TRACE] RETURNING ${deposits.length} DEPOSITS`);
    console.log("[ADMIN V2 DEPOSITS AUTH TRACE] === END ===\n");
    return NextResponse.json({ success: true, deposits });
  } catch (error) {
    console.error("[ADMIN V2 DEPOSITS ERROR]:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log("[ADMIN DEPOSITS API] POST CALLED");
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const admin = await User.findById(decoded.id);
    if (!admin?.isAdmin) return NextResponse.json({ success: false }, { status: 403 });

    const { depositId, status, adminNote } = await req.json();
    if (!["APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ success: false }, { status: 400 });

    const deposit = await Deposit.findOneAndUpdate(
      { _id: depositId, status: "PENDING" },
      { status, adminNote },
      { new: true }
    );
    
    if (!deposit) return NextResponse.json({ success: false, message: "Deposit not found or already processed" }, { status: 400 });

    if (status === "APPROVED") {
      const user = await User.findById(deposit.userId);
      if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

      await User.updateOne({ _id: user._id }, { $inc: { balance: deposit.amount } });

      await Transaction.create({
        userId: deposit.userId,
        type: "DEPOSIT",
        amount: deposit.amount,
        balanceAfter: user.balance + deposit.amount,
        description: `Deposit of ₹${deposit.amount} approved (UTR: ${deposit.utr})`,
      });

      // Bonus Logic
      if (deposit.amount >= 100 && !user.referralRewardClaimed && !user.welcomeBonusClaimed) {
        if (user.referredBy) {
          const referrer = await User.findById(user.referredBy);
          if (referrer) {
            const updatedReferrer = await User.findOneAndUpdate(
              { _id: referrer._id },
              { $inc: { balance: 50, referralEarnings: 50 } },
              { new: true }
            );
            await Transaction.create({ userId: referrer._id, type: "BONUS", amount: 50, balanceAfter: updatedReferrer.balance, description: `Referral Reward for ${user.mobile}` });

            const updatedUser = await User.findOneAndUpdate(
              { _id: user._id },
              { $inc: { balance: 30 }, $set: { referralRewardClaimed: true } },
              { new: true }
            );
            await Transaction.create({ userId: user._id, type: "BONUS", amount: 30, balanceAfter: updatedUser.balance, description: `Welcome Bonus (Referred)` });

            if ((global as any).io) {
              (global as any).io.emit("REFERRAL_QUALIFIED", { referrer: referrer.mobile, user: user.mobile });
              (global as any).io.emit("REFERRAL_REWARD_RELEASED", { amount: 80 });
            }
          }
        } else {
          const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $inc: { balance: 10 }, $set: { welcomeBonusClaimed: true } },
            { new: true }
          );
          await Transaction.create({ userId: user._id, type: "BONUS", amount: 10, balanceAfter: updatedUser.balance, description: `Welcome Bonus (Direct)` });

          if ((global as any).io) {
            (global as any).io.emit("REFERRAL_REWARD_RELEASED", { amount: 10 });
          }
        }
      }
    }

    if ((global as any).io) {
      (global as any).io.emit("DEPOSIT_STATUS_UPDATED", { depositId, status });
    }

    return NextResponse.json({ success: true, message: "Deposit " + status });
  } catch (error) {
    console.error("[ADMIN DEPOSITS API] POST ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
