import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { getNextReferralCode } from "@/lib/referral";

export async function GET(req: Request) {
  try {
    console.log("\n[REFERRAL API] === START ===");
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      console.log("[REFERRAL API] Unauthorized access attempt");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    console.log(`[REFERRAL API] CALLED BY USER ID: ${decoded.id}`);

    let user = await User.findById(decoded.id);
    if (!user) {
      console.log("[REFERRAL API] User not found in database");
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    console.log(`[REFERRAL API] USER FOUND: ${user.mobile}`);

    // Last resort check to ensure no PENDING or invalid codes reach the frontend
    const isValidFormat = /^VAVCODE\d+$/.test(user.referralCode || "");
    const isPlaceholder = ["PENDING", "LOADING", "GENERATING", "TEMP", "DEFAULT", "undefined", "null"].includes(user.referralCode || "");

    if (!user.referralCode || isPlaceholder || !isValidFormat) {
      console.log(`[REFERRAL API] INVALID CODE DETECTED (${user.referralCode || "NONE"}). GENERATING...`);
      const newCode = await getNextReferralCode();
      await User.updateOne({ _id: user._id }, { $set: { referralCode: newCode } });
      console.log(`[REFERRAL API] NEW CODE SAVED: ${newCode}`);
      user = await User.findById(user._id);
    } else {
      console.log(`[REFERRAL API] VALID CODE FOUND: ${user.referralCode}`);
    }

    if (!user) {
      console.log("[REFERRAL API] Server error: user lost after update");
      return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }

    const totalReferrals = await User.countDocuments({ referredBy: user._id });
    const successfulReferrals = await User.countDocuments({ referredBy: user._id, referralRewardClaimed: true });
    const pendingReferrals = totalReferrals - successfulReferrals;

    const responseData = {
      referralCode: user.referralCode,
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      referralEarnings: user.referralEarnings || 0,
    };

    console.log("[REFERRAL API] SENDING SUCCESS RESPONSE:", responseData);
    console.log("[REFERRAL API] === END ===\n");

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error("[REFERRAL API] CRITICAL ERROR:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
