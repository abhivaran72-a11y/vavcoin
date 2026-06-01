import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";
import { getNextReferralCode } from "@/lib/referral";

export async function POST(req: Request) {
  try {
    console.log("=> Registration attempt received");

    await connectDB();

    const body = await req.json();

    const { mobile, password } = body;

    if (!mobile || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile and password are required",
        },
        {
          status: 400,
        }
      );
    }

    const existingUser = await User.findOne({
      mobile,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists with this mobile number",
        },
        {
          status: 400,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Generate sequential referral code
    const referralCode = await getNextReferralCode();

    let referredById = null;
    if (body.referralCode) {
      const referrer = await User.findOne({ referralCode: body.referralCode.toUpperCase() });
      if (referrer) {
        referredById = referrer._id;
      }
    }

    const newUser = await User.create({
      mobile,
      password: hashedPassword,
      referralCode,
      referredBy: referredById
    });

    if ((global as any).io) {
      (global as any).io.emit("NEW_USER", { id: newUser._id, mobile: newUser.mobile, balance: 0, isBlocked: false });
    }

    console.log(
      "=> User registered successfully:",
      mobile
    );

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: newUser._id,
          mobile: newUser.mobile,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "=> Registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "An error occurred during registration",
      },
      {
        status: 500,
      }
    );
  }
}
