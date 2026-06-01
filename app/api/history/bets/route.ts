import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { Bet } from "@/models/bet";

export async function GET(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const user = await User.findById(decoded.id);
    if (!user) return NextResponse.json({ success: false }, { status: 404 });

    const bets = await Bet.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("roundId", "roundNumber result");
    
    return NextResponse.json({
      success: true,
      bets
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
