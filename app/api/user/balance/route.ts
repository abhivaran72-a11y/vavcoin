import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";

export async function GET(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ success: false, blocked: true, message: "Account blocked" }, { status: 403 });
    }

    return NextResponse.json({ success: true, balance: user.balance });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
