import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Round } from "@/models/round";

export async function GET() {
  try {
    await connectDB();
    const results = await Round.find({ status: "COMPLETED" })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("roundNumber result");

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
