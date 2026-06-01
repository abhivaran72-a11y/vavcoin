import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { MatkaBet } from "@/models/matka-bet";

export async function GET(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const bets = await MatkaBet.find({ userId: decoded.id })
      .sort({ createdAt: -1 })
      .populate("roundId", "roundNumber");

    return NextResponse.json({ success: true, bets });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
