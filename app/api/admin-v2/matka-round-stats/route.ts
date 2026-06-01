import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { MatkaRound } from "@/models/matka-round";
import { MatkaBet } from "@/models/matka-bet";
import { getCurrentMatkaRound } from "@/lib/matka-logic";

export async function GET(req: Request) {
  try {
    console.log("\n[ADMIN V2 MATKA AUTH TRACE] === START ===");
    await connectDB();
    
    const decoded = verifyToken(req);
    console.log("[ADMIN V2 MATKA AUTH TRACE] TOKEN DECODED:", decoded);

    if (!decoded) {
      console.log("[ADMIN V2 MATKA AUTH TRACE] REJECTION: No token");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const admin = await User.findById(decoded.id);
    console.log("[ADMIN V2 MATKA AUTH TRACE] USER FOUND:", admin ? admin.mobile : "null");
    console.log("[ADMIN V2 MATKA AUTH TRACE] ISADMIN VALUE:", admin ? admin.isAdmin : "N/A");

    if (!admin || !admin.isAdmin) {
      console.log("[ADMIN V2 MATKA AUTH TRACE] REJECTION: Not admin");
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { round, secondsLeft } = await getCurrentMatkaRound();

    const bets = await MatkaBet.find({ roundId: round._id });
    const commissionEarned = bets.reduce((acc, bet) => acc + (bet.commission || 0), 0);

    return NextResponse.json({
      success: true,
      round: {
        roundNumber: round.roundNumber,
        status: round.status,
        totalAmounts: round.totalAmounts,
        totalPool: round.totalPool,
        endTime: round.endTime,
        commissionEarned
      },
      secondsLeft,
    });
  } catch (error) {
    console.error("[ADMIN V2 MATKA STATS ERROR]:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
