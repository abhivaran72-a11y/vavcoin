import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { Bet } from "@/models/bet";
import { Deposit } from "@/models/deposit";
import { Withdrawal } from "@/models/withdrawal";

export async function GET(req: Request) {
  try {
    console.log("\n[ADMIN V2 USERS AUTH TRACE] === START ===");
    await connectDB();
    const decoded = verifyToken(req);
    console.log("[ADMIN V2 USERS AUTH TRACE] TOKEN DECODED:", decoded);

    if (!decoded) {
      console.log("[ADMIN V2 USERS AUTH TRACE] REJECTION: No token");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const admin = await User.findById(decoded.id);
    console.log("[ADMIN V2 USERS AUTH TRACE] USER FOUND:", admin ? admin.mobile : "null");
    console.log("[ADMIN V2 USERS AUTH TRACE] ISADMIN VALUE:", admin ? admin.isAdmin : "N/A");

    if (!admin || !admin.isAdmin) {
      console.log("[ADMIN V2 USERS AUTH TRACE] REJECTION: Not admin");
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const users = await User.find().sort({ createdAt: -1 });
    console.log(`[ADMIN V2 USERS AUTH TRACE] RETURNING ${users.length} USERS`);
    console.log("[ADMIN V2 USERS AUTH TRACE] === END ===\n");
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("[ADMIN V2 USERS ERROR]:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const admin = await User.findById(decoded.id);
    if (!admin?.isAdmin) return NextResponse.json({ success: false }, { status: 403 });

    const { userId, isBlocked, isAdmin, balance } = await req.json();
    const update: any = {};
    if (isBlocked !== undefined) update.isBlocked = isBlocked;
    if (isAdmin !== undefined) update.isAdmin = isAdmin;
    if (balance !== undefined) update.balance = balance;

    await User.findByIdAndUpdate(userId, { $set: update });
    return NextResponse.json({ success: true, message: "User updated" });
  } catch (error) {
    console.error("[ADMIN USERS API] POST ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
