import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { Deposit } from "@/models/deposit";

export async function POST(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const { amount, utr, screenshot } = await req.json();
    if (!amount || !utr || !screenshot) return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });

    if (amount < 100) return NextResponse.json({ success: false, message: "Minimum deposit is ₹100" }, { status: 400 });

    const cleanUtr = String(utr).trim();
    const existing = await Deposit.findOne({ utr: cleanUtr });
    if (existing) return NextResponse.json({ success: false, message: "This UTR is already used." }, { status: 400 });

    const newDeposit = await Deposit.create({ userId: decoded.id, amount, utr: cleanUtr, screenshot });
    if ((global as any).io) {
      (global as any).io.emit("NEW_DEPOSIT", await Deposit.findById(newDeposit._id).populate("userId", "mobile"));
    }
    return NextResponse.json({ success: true, message: "Deposit submitted for approval" });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const deposits = await Deposit.find({ userId: decoded.id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, deposits });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
