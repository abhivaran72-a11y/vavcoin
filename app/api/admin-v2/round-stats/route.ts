import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { Round } from "@/models/round";
import { Bet } from "@/models/bet";
import { getCurrentRound } from "@/lib/game-logic";

export async function GET(req: Request) {
  try {
    console.log("\n[ADMIN V2 ROUND STATS AUTH TRACE] === START ===");
    await connectDB();
    
    const decoded = verifyToken(req);
    console.log("[ADMIN V2 ROUND STATS AUTH TRACE] TOKEN DECODED:", decoded);

    if (!decoded) {
      console.log("[ADMIN V2 ROUND STATS AUTH TRACE] REJECTION: No token");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const admin = await User.findById(decoded.id);
    console.log("[ADMIN V2 ROUND STATS AUTH TRACE] USER FOUND:", admin ? admin.mobile : "null");
    console.log("[ADMIN V2 ROUND STATS AUTH TRACE] ISADMIN VALUE:", admin ? admin.isAdmin : "N/A");

    if (!admin || !admin.isAdmin) {
      console.log("[ADMIN V2 ROUND STATS AUTH TRACE] REJECTION: Not admin");
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { round, secondsLeft } = await getCurrentRound();

    // Active Users (Last 5 mins)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await Bet.distinct("userId", { createdAt: { $gte: fiveMinutesAgo } }).then((users: any[]) => users.length).catch(() => 0);

    return NextResponse.json({
      success: true,
      round: {
        roundNumber: round.roundNumber,
        status: round.status,
        totalHeadAmount: round.totalHeadAmount,
        totalTailAmount: round.totalTailAmount,
        endTime: round.endTime,
      },
      secondsLeft,
      activeUsers,
    });
  } catch (error) {
    console.error("[ADMIN V2 ROUND STATS ERROR]:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
