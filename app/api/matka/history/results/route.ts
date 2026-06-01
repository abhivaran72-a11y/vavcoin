import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { MatkaRound } from "@/models/matka-round";

export async function GET() {
  try {
    await connectDB();
    const results = await MatkaRound.find({ status: "COMPLETED" })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("roundNumber result totalPool createdAt");

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
