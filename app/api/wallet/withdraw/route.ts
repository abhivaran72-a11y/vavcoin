import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { Withdrawal } from "@/models/withdrawal";
import { User } from "@/models/user";
import { Transaction } from "@/models/transaction";

export async function POST(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const { amount, upiId } = await req.json();
    if (!amount || !upiId) return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    
    if (amount < 100) return NextResponse.json({ success: false, message: "Minimum withdrawal is ₹100" }, { status: 400 });

    const existingPending = await Withdrawal.findOne({ userId: decoded.id, status: "PENDING" });
    if (existingPending) return NextResponse.json({ success: false, message: "You already have a pending withdrawal request" }, { status: 400 });

    // Atomic balance deduction
    const user = await User.findOneAndUpdate(
      { _id: decoded.id, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!user) return NextResponse.json({ success: false, message: "Insufficient balance" }, { status: 400 });

    const withdrawal = await Withdrawal.create({ userId: decoded.id, amount, upiId });
    if ((global as any).io) {
      (global as any).io.emit("NEW_WITHDRAWAL", await Withdrawal.findById(withdrawal._id).populate("userId", "mobile"));
    }

    await Transaction.create({
      userId: decoded.id,
      type: "WITHDRAWAL",
      amount: -amount,
      balanceAfter: user.balance,
      description: `Withdrawal request submitted (UPI: ${upiId})`,
    });

    return NextResponse.json({ success: true, message: "Withdrawal requested", withdrawal });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const withdrawals = await Withdrawal.find({ userId: decoded.id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, withdrawals });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
