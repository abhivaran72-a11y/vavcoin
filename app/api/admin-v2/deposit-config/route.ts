import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { DepositSettings } from "@/models/deposit-settings";

export async function POST(req: Request) {
  try {
    console.log("\n[ADMIN V2 DEPOSIT CONFIG SAVE] === START ===");
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const admin = await User.findById(decoded.id);
    if (!admin || !admin.isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    console.log("[DEPOSIT CONFIG API] RECEIVED PAYLOAD:", body);

    const { _id, __v, createdAt, updatedAt, ...updateData } = body;

    const settings = await DepositSettings.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    console.log("[DEPOSIT CONFIG API] SAVED SUCCESSFULLY:", settings);
    return NextResponse.json({ success: true, message: "Deposit configuration updated", settings });
  } catch (error: any) {
    console.error("[DEPOSIT CONFIG API] CRITICAL SAVE ERROR:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // We only require the user to be authenticated to see deposit settings
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const settings = await DepositSettings.findOne() || { upiId: "vavcoin@upi", qrImage: "" };
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("[DEPOSIT CONFIG API] LOAD ERROR:", error.message);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
