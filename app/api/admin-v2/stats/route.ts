import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/user";
import { Bet } from "@/models/bet";
import { Deposit } from "@/models/deposit";
import { Withdrawal } from "@/models/withdrawal";
import { Round } from "@/models/round";
import { MatkaBet } from "@/models/matka-bet";
import { MatkaRound } from "@/models/matka-round";
import { Transaction } from "@/models/transaction";

export async function GET(req: Request) {
  try {
    console.log("\n[ADMIN V2 AUTH TRACE] === START ===");
    await connectDB();
    
    const decoded = verifyToken(req);
    console.log("[ADMIN V2 AUTH TRACE] TOKEN DECODED:", decoded);

    if (!decoded) {
      console.log("[ADMIN V2 AUTH TRACE] REJECTION: No token or invalid token");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const admin = await User.findById(decoded.id);
    console.log("[ADMIN V2 AUTH TRACE] USER FOUND:", admin ? admin.mobile : "null");
    console.log("[ADMIN V2 AUTH TRACE] ISADMIN VALUE:", admin ? admin.isAdmin : "N/A");

    if (!admin || !admin.isAdmin) {
      console.log("[ADMIN V2 AUTH TRACE] REJECTION: User is not admin or not found");
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    console.log("[ADMIN V2 AUTH TRACE] AUTH SUCCESSFUL");
    console.log("[ADMIN V2 AUTH TRACE] === END ===\n");

    console.log("[ADMIN STATS API] STARTING AGGREGATIONS");
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Basic Counts
    const totalUsers = await User.countDocuments();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const activeUsersHT = await Bet.distinct("userId", { createdAt: { $gte: fiveMinAgo } }).then(u => u.length);
    const activeUsersMatka = await MatkaBet.distinct("userId", { createdAt: { $gte: fiveMinAgo } }).then(u => u.length);
    const activeUsers = Math.max(activeUsersHT, activeUsersMatka);

    // Financials
    const depositStats = await Deposit.aggregate([
      { $match: { status: "APPROVED" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalDeposits = depositStats[0]?.total || 0;

    const withdrawalStats = await Withdrawal.aggregate([
      { $match: { status: "PAID" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalWithdrawals = withdrawalStats[0]?.total || 0;

    const pendingDeposits = await Deposit.countDocuments({ status: "PENDING" });
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: "PENDING" });

    // H&T Bets & Profit
    const betStats = await Bet.aggregate([
      { $group: { 
          _id: null, 
          totalBetsCount: { $sum: 1 },
          totalPool: { $sum: "$amount" },
          totalPayout: { $sum: { $cond: [{ $eq: ["$status", "WIN"] }, "$winAmount", 0] } }
      }}
    ]);

    // Matka Bets & Profit
    const matkaBetStats = await MatkaBet.aggregate([
      { $group: { 
          _id: null, 
          totalBetsCount: { $sum: 1 },
          totalPool: { $sum: "$amount" },
          totalPayout: { $sum: { $cond: [{ $eq: ["$status", "WIN"] }, "$winAmount", 0] } },
          totalCommission: { $sum: "$commission" }
      }}
    ]);

    const totalBets = (betStats[0]?.totalBetsCount || 0) + (matkaBetStats[0]?.totalBetsCount || 0);
    const totalPool = (betStats[0]?.totalPool || 0) + (matkaBetStats[0]?.totalPool || 0);
    const totalPayout = (betStats[0]?.totalPayout || 0) + (matkaBetStats[0]?.totalPayout || 0);
    const lifetimeProfit = totalPool - totalPayout;

    // Commission Tracker
    const commissionStatsHT = await Bet.aggregate([
      { $match: { status: "WIN" } },
      { $group: {
          _id: null,
          lifetime: { $sum: { $multiply: ["$amount", 2, 0.01] } },
          today: { $sum: { $cond: [{ $gte: ["$createdAt", today] }, { $multiply: ["$amount", 2, 0.01] }, 0] } },
          weekly: { $sum: { $cond: [{ $gte: ["$createdAt", weekAgo] }, { $multiply: ["$amount", 2, 0.01] }, 0] } },
          monthly: { $sum: { $cond: [{ $gte: ["$createdAt", monthAgo] }, { $multiply: ["$amount", 2, 0.01] }, 0] } }
      }}
    ]);

    const commissionStatsMatka = await MatkaBet.aggregate([
      { $group: {
          _id: null,
          lifetime: { $sum: "$commission" },
          today: { $sum: { $cond: [{ $gte: ["$createdAt", today] }, "$commission", 0] } },
          weekly: { $sum: { $cond: [{ $gte: ["$createdAt", weekAgo] }, "$commission", 0] } },
          monthly: { $sum: { $cond: [{ $gte: ["$createdAt", monthAgo] }, "$commission", 0] } }
      }}
    ]);

    const commissions = {
      today: (commissionStatsHT[0]?.today || 0) + (commissionStatsMatka[0]?.today || 0),
      weekly: (commissionStatsHT[0]?.weekly || 0) + (commissionStatsMatka[0]?.weekly || 0),
      monthly: (commissionStatsHT[0]?.monthly || 0) + (commissionStatsMatka[0]?.monthly || 0),
      lifetime: (commissionStatsHT[0]?.lifetime || 0) + (commissionStatsMatka[0]?.lifetime || 0)
    };

    // Periodic Profit
    const todayStatsHT = await Bet.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: {
          _id: null,
          pool: { $sum: "$amount" },
          payout: { $sum: { $cond: [{ $eq: ["$status", "WIN"] }, "$winAmount", 0] } }
      }}
    ]);
    const todayStatsMatka = await MatkaBet.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: {
          _id: null,
          pool: { $sum: "$amount" },
          payout: { $sum: { $cond: [{ $eq: ["$status", "WIN"] }, "$winAmount", 0] } }
      }}
    ]);
    const todayProfit = ((todayStatsHT[0]?.pool || 0) - (todayStatsHT[0]?.payout || 0)) + ((todayStatsMatka[0]?.pool || 0) - (todayStatsMatka[0]?.payout || 0));

    const weeklyStatsHT = await Bet.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: {
          _id: null,
          pool: { $sum: "$amount" },
          payout: { $sum: { $cond: [{ $eq: ["$status", "WIN"] }, "$winAmount", 0] } }
      }}
    ]);
    const weeklyStatsMatka = await MatkaBet.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: {
          _id: null,
          pool: { $sum: "$amount" },
          payout: { $sum: { $cond: [{ $eq: ["$status", "WIN"] }, "$winAmount", 0] } }
      }}
    ]);
    const weeklyProfit = ((weeklyStatsHT[0]?.pool || 0) - (weeklyStatsHT[0]?.payout || 0)) + ((weeklyStatsMatka[0]?.pool || 0) - (weeklyStatsMatka[0]?.payout || 0));

    const monthlyStatsHT = await Bet.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      { $group: {
          _id: null,
          pool: { $sum: "$amount" },
          payout: { $sum: { $cond: [{ $eq: ["$status", "WIN"] }, "$winAmount", 0] } }
      }}
    ]);
    const monthlyStatsMatka = await MatkaBet.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      { $group: {
          _id: null,
          pool: { $sum: "$amount" },
          payout: { $sum: { $cond: [{ $eq: ["$status", "WIN"] }, "$winAmount", 0] } }
      }}
    ]);
    const monthlyProfit = ((monthlyStatsHT[0]?.pool || 0) - (monthlyStatsHT[0]?.payout || 0)) + ((monthlyStatsMatka[0]?.pool || 0) - (monthlyStatsMatka[0]?.payout || 0));

    // Referral Stats
    const referralStats = await User.aggregate([
      { $group: {
          _id: null,
          totalPaid: { $sum: "$referralEarnings" },
          successful: { $sum: { $cond: ["$referralRewardClaimed", 1, 0] } },
          totalReferrals: { $sum: { $cond: [{ $ne: ["$referredBy", null] }, 1, 0] } }
      }}
    ]);
    const pendingReferrals = (referralStats[0]?.totalReferrals || 0) - (referralStats[0]?.successful || 0);

    // Daily Reward Stats
    const dailyRewardStats = await Transaction.aggregate([
      { $match: { description: { $regex: /Daily Reward/ } } },
      { $group: { _id: null, totalPaid: { $sum: "$amount" } } }
    ]);
    const activeDailyUsers = await User.countDocuments({ dailyRewardDay: { $gt: 1 }, dailyRewardCompleted: false });
    const completedDailyUsers = await User.countDocuments({ dailyRewardCompleted: true });

    // DB Audit counts
    const audit = {
      users: totalUsers,
      deposits: await Deposit.countDocuments(),
      withdrawals: await Withdrawal.countDocuments(),
      bets: await Bet.countDocuments(),
      matkaBets: await MatkaBet.countDocuments(),
      rounds: await Round.countDocuments(),
      matkaRounds: await MatkaRound.countDocuments(),
      transactions: await Transaction.countDocuments()
    };

    console.log("[ADMIN STATS API] AGGREGATIONS COMPLETED");

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalDeposits,
        totalWithdrawals,
        pendingDeposits,
        pendingWithdrawals,
        totalBets,
        totalPool,
        lifetimeProfit,
        todayProfit,
        weeklyProfit,
        monthlyProfit,
        commissions,
        referral: {
          totalPaid: referralStats[0]?.totalPaid || 0,
          successful: referralStats[0]?.successful || 0,
          pending: pendingReferrals
        },
        dailyReward: {
          totalPaid: dailyRewardStats[0]?.totalPaid || 0,
          activeUsers: activeDailyUsers,
          completedUsers: completedDailyUsers
        },
        audit
      }
    });
  } catch (error) {
    console.error("[ADMIN STATS API] CRITICAL ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
