import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";

export async function POST(req: Request) {
  try {
    console.log("\n[LOGIN API HIT]");

    await connectDB();

    const body = await req.json();
    console.log("[LOGIN API] REQUEST BODY:", body);

    const { mobile, password } = body;

    if (!mobile || !password) {
      console.log("[LOGIN API] FAILED: Missing mobile or password");
      return NextResponse.json(
        {
          success: false,
          message: "Mobile and password are required",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ mobile });

    if (!user) {
      console.log("[LOGIN API] FAILED: User not found");
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      console.log("[LOGIN API] FAILED: Invalid password");
      return NextResponse.json(
        {
          success: false,
          message: "Invalid password",
        },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.log("[LOGIN API] FAILED: JWT_SECRET missing");
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(
      {
        id: user._id,
        mobile: user.mobile,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log("[LOGIN API] SUCCESS: User logged in:", mobile);

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        balance: user.balance,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    console.log("[LOGIN API] RESPONSE SENT\n");
    return response;
  } catch (error: any) {
    console.error("[LOGIN API] CRITICAL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "An error occurred during login",
      },
      { status: 500 }
    );
  }
}