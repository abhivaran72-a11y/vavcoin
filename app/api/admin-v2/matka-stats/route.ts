import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { MatkaBet } from "@/models/matka-bet";

export async function GET(req: Request) {
  try {
    console.log("\n[ADMIN V2 MATKA-STATS AUTH TRACE] === START ===");
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const admin = await User.findById(decoded.id);
    if (!admin || !admin.isAdmin) return NextResponse.json({ success: false }, { status: 403 });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const commissionStats = await MatkaBet.aggregate([
      { $group: {
          _id: null,
          lifetime: { $sum: "$commission" },
          today: { $sum: { $cond: [{ $gte: ["$createdAt", today] }, "$commission", 0] } },
          weekly: { $sum: { $cond: [{ $gte: ["$createdAt", weekAgo] }, "$commission", 0] } },
          totalBets: { $sum: 1 },
          totalPlayers: { $addToSet: "$userId" },
          totalPool: { $sum: "$amount" }
      }}
    ]);

    const stats = {
      commissions: {
        today: commissionStats[0]?.today || 0,
        weekly: commissionStats[0]?.weekly || 0,
        lifetime: commissionStats[0]?.lifetime || 0
      },
      totalBets: commissionStats[0]?.totalBets || 0,
      totalPlayers: commissionStats[0]?.totalPlayers?.length || 0,
      totalPool: commissionStats[0]?.totalPool || 0
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
