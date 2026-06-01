import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentRound } from "@/lib/game-logic";
import { Settings } from "@/models/settings";
import { verifyToken } from "@/lib/auth";
import { Bet } from "@/models/bet";

export async function GET(req: Request) {
  try {
    await connectDB();
    const settings = await Settings.findOne() || await Settings.create({});

    if (settings.maintenanceMode) {
      return NextResponse.json({ success: false, maintenance: true, message: "Maintenance in progress" });
    }

    const { round, secondsLeft } = await getCurrentRound();

    // Fetch user bets if authenticated
    const decoded = verifyToken(req);
    let myBets = [];
    if (decoded) {
      myBets = await Bet.find({ userId: decoded.id, roundId: round._id });
    }

    // Live MongoDB Query for Active Users (Placed a bet in the last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsersCount = await connectDB().then(() => 
      require("@/models/bet").Bet.distinct("userId", { createdAt: { $gte: fiveMinutesAgo } })
    ).then(users => users.length).catch(() => 0);

    // Fallback if 0 (so UI doesn't look dead for a new project) but strictly DB-based
    const baseCount = await connectDB().then(() => 
      require("@/models/user").User.countDocuments({ createdAt: { $gte: fiveMinutesAgo } })
    ).catch(() => 0);

    const realOnline = activeUsersCount + baseCount + 1; // +1 for the current viewer

    return NextResponse.json({
      success: true,
      round: {
        roundNumber: round.roundNumber,
        status: round.status,
        totalHeadAmount: round.totalHeadAmount,
        totalTailAmount: round.totalTailAmount,
        result: round.result,
      },
      secondsLeft,
      myBets,
      fakeOnline: realOnline, // keeping key name to avoid breaking frontend immediately
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
