import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { Bet } from "@/models/bet";

export async function GET(req: Request) {
  try {
    console.log("\n[ADMIN V2 BETS AUTH TRACE] === START ===");
    await connectDB();
    const decoded = verifyToken(req);
    console.log("[ADMIN V2 BETS AUTH TRACE] TOKEN DECODED:", decoded);

    if (!decoded) {
      console.log("[ADMIN V2 BETS AUTH TRACE] REJECTION: No token");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const admin = await User.findById(decoded.id);
    console.log("[ADMIN V2 BETS AUTH TRACE] USER FOUND:", admin ? admin.mobile : "null");
    console.log("[ADMIN V2 BETS AUTH TRACE] ISADMIN VALUE:", admin ? admin.isAdmin : "N/A");

    if (!admin || !admin.isAdmin) {
      console.log("[ADMIN V2 BETS AUTH TRACE] REJECTION: Not admin");
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const bets = await Bet.find().sort({ createdAt: -1 }).populate("userId", "mobile").limit(100);
    console.log(`[ADMIN V2 BETS AUTH TRACE] RETURNING ${bets.length} BETS`);
    console.log("[ADMIN V2 BETS AUTH TRACE] === END ===\n");
    return NextResponse.json({ success: true, bets });
  } catch (error) {
    console.error("[ADMIN V2 BETS ERROR]:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
