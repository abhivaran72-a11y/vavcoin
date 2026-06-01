import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { Withdrawal } from "@/models/withdrawal";
import { Transaction } from "@/models/transaction";

export async function GET(req: Request) {
  try {
    console.log("\n[ADMIN V2 WITHDRAWALS AUTH TRACE] === START ===");
    await connectDB();
    const decoded = verifyToken(req);
    console.log("[ADMIN V2 WITHDRAWALS AUTH TRACE] TOKEN DECODED:", decoded);

    if (!decoded) {
      console.log("[ADMIN V2 WITHDRAWALS AUTH TRACE] REJECTION: No token");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const admin = await User.findById(decoded.id);
    console.log("[ADMIN V2 WITHDRAWALS AUTH TRACE] USER FOUND:", admin ? admin.mobile : "null");
    console.log("[ADMIN V2 WITHDRAWALS AUTH TRACE] ISADMIN VALUE:", admin ? admin.isAdmin : "N/A");

    if (!admin || !admin.isAdmin) {
      console.log("[ADMIN V2 WITHDRAWALS AUTH TRACE] REJECTION: Not admin");
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 }).populate("userId", "mobile");
    console.log(`[ADMIN V2 WITHDRAWALS AUTH TRACE] RETURNING ${withdrawals.length} WITHDRAWALS`);
    console.log("[ADMIN V2 WITHDRAWALS AUTH TRACE] === END ===\n");
    return NextResponse.json({ success: true, withdrawals });
  } catch (error) {
    console.error("[ADMIN V2 WITHDRAWALS ERROR]:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log("[ADMIN WITHDRAWALS API] POST CALLED");
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const admin = await User.findById(decoded.id);
    if (!admin?.isAdmin) return NextResponse.json({ success: false }, { status: 403 });

    const { withdrawalId, status, adminNote } = await req.json();
    if (!["APPROVED", "REJECTED", "PAID"].includes(status)) return NextResponse.json({ success: false }, { status: 400 });

    const withdrawal = await Withdrawal.findOneAndUpdate(
      { _id: withdrawalId, status: "PENDING" },
      { status, adminNote },
      { new: true }
    );
    
    if (!withdrawal) return NextResponse.json({ success: false, message: "Withdrawal not found or already processed" }, { status: 400 });

    if (status === "REJECTED") {
      const user = await User.findOneAndUpdate(
        { _id: withdrawal.userId },
        { $inc: { balance: withdrawal.amount } },
        { new: true }
      );

      await Transaction.create({
        userId: withdrawal.userId,
        type: "REFUND",
        amount: withdrawal.amount,
        balanceAfter: user.balance,
        description: `Withdrawal of ₹${withdrawal.amount} rejected and refunded by admin`,
      });
    }

    if ((global as any).io) {
      (global as any).io.emit("WITHDRAWAL_STATUS_UPDATED", { withdrawalId, status });
    }

    return NextResponse.json({ success: true, message: "Withdrawal " + status });
  } catch (error) {
    console.error("[ADMIN WITHDRAWALS API] POST ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
