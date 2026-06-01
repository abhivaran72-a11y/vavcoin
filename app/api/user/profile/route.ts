import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";

export async function GET(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return NextResponse.json({ success: false }, { status: 404 });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        mobile: user.mobile,
        balance: user.balance,
        isAdmin: user.isAdmin,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
