import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { Settings } from "@/models/settings";

export async function POST(req: Request) {
  try {
    console.log("\n[ADMIN V2 SETTINGS SAVE] === START ===");
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const user = await User.findById(decoded.id);
    if (!user || !user.isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    console.log("[SETTINGS API] RECEIVED PAYLOAD:", body);

    // Filter out _id and other mongo fields to prevent update issues
    const { _id, __v, createdAt, updatedAt, ...updateData } = body;

    const settings = await Settings.findOneAndUpdate(
      {}, // Empty filter matches the first document
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    console.log("[SETTINGS API] SAVED SUCCESSFULLY:", settings);
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("[SETTINGS API] CRITICAL SAVE ERROR:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ success: false }, { status: 401 });

    const user = await User.findById(decoded.id);
    if (!user || !user.isAdmin) return NextResponse.json({ success: false }, { status: 403 });

    const settings = await Settings.findOne() || await Settings.create({});
    console.log("[SETTINGS API] LOADED:", settings);
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("[SETTINGS API] LOAD ERROR:", error.message);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
