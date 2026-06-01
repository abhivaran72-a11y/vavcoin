import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentMatkaRound } from "@/lib/matka-logic";
import { MatkaSettings } from "@/models/matka-settings";
import { verifyToken } from "@/lib/auth";
import { MatkaBet } from "@/models/matka-bet";

export async function GET(req: Request) {
  try {
    await connectDB();
    const settings = await MatkaSettings.findOne() || await MatkaSettings.create({});

    if (settings.maintenanceMode) {
      return NextResponse.json({ success: false, maintenance: true, message: "Maintenance in progress" });
    }

    const { round, secondsLeft } = await getCurrentMatkaRound();

    // Fetch user bets if authenticated
    const decoded = verifyToken(req);
    let myBets = [];
    if (decoded) {
      myBets = await MatkaBet.find({ userId: decoded.id, roundId: round._id });
    }

    return NextResponse.json({
      success: true,
      round: {
        roundNumber: round.roundNumber,
        status: round.status,
        totalAmounts: round.totalAmounts,
        totalPool: round.totalPool,
        result: round.result,
      },
      secondsLeft,
      myBets,
    });
  } catch (error: any) {
    console.error("Matka round error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
