import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { mobile, password } = await req.json();

    const user = await User.findOne({ mobile });
    if (!user) {
      return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });
    }

    if (!user.isAdmin) {
      return NextResponse.json({ success: false, message: "Access denied. Not an admin." }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user._id.toString(), mobile: user.mobile, isAdmin: true },
      process.env.JWT_SECRET || "vavcoin_secret",
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      token,
      user: { id: user._id, mobile: user.mobile }
    });

    response.cookies.set("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
