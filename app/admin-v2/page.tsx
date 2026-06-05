"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Activity, MousePointer2, CreditCard, Wallet, 
  Dices, Landmark, TrendingUp, BarChart3, PieChart, 
  Percent, AlertCircle, Clock, CheckCircle2,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Gift
} from "lucide-react";
import { getAuthToken } from "@/lib/auth-client";
import { useSocket } from "./SocketProvider";

import { useArenaActivity } from "@/lib/use-arena-activity";

export default function AdminV2Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [liveRound, setLiveRound] = useState<any>(null);
  const [liveRoundMatka, setLiveRoundMatka] = useState<any>(null);
  const [liveBets, setLiveBets] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const arenaActive = useArenaActivity();
  const { socket } = useSocket();

  const fetchStats = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch("/api/admin-v2/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) {}
  };

  const fetchLiveRound = async () => {
    const token = getAuthToken();
    try {
      console.log("[ADMIN V2 DASHBOARD] Calling /api/admin-v2/round-stats");
      const res = await fetch("/api/admin-v2/round-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setLiveRound(data);
    } catch (e) {}
  };

  const fetchLiveRoundMatka = async () => {
    const token = getAuthToken();
    try {
      console.log("[ADMIN V2 DASHBOARD] Calling /api/admin-v2/matka-round-stats");
      const res = await fetch("/api/admin-v2/matka-round-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setLiveRoundMatka(data);
    } catch (e) {}
  };

  useEffect(() => {
    setMounted(true);
    fetchStats();
    fetchLiveRound();
    fetchLiveRoundMatka();
    const interval = setInterval(() => {
      fetchLiveRound();
      fetchLiveRoundMatka();
    }, 1000);

    if (socket) {
      socket.on("NEW_BET", (data: any) => {
        setLiveBets((prev) => [{...data.bet, game: "H&T"}, ...prev].slice(0, 20));
        setLiveRound((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            round: {
              ...prev.round,
              totalHeadAmount: data.totalHeadAmount,
              totalTailAmount: data.totalTailAmount
            }
          };
        });
      });

      socket.on("MATKA_NEW_BET", (data: any) => {
        setLiveBets((prev) => [{...data.bet, game: "MATKA"}, ...prev].slice(0, 20));
        setLiveRoundMatka((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            round: {
              ...prev.round,
              totalAmounts: data.totalAmounts,
              totalPool: data.totalPool
            }
          };
        });
      });

      socket.on("ROUND_RESOLVED", () => {
        fetchStats();
      });

      socket.on("MATKA_ROUND_RESOLVED", () => {
        fetchStats();
      });

      socket.on("REFERRAL_QUALIFIED", () => fetchStats());
      socket.on("REFERRAL_REWARD_RELEASED", () => fetchStats());
      socket.on("DAILY_REWARD_CLAIMED", () => fetchStats());

      socket.on("NEW_USER", () => fetchStats());
      socket.on("NEW_DEPOSIT", () => fetchStats());
      socket.on("NEW_WITHDRAWAL", () => fetchStats());
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off("NEW_BET");
        socket.off("MATKA_NEW_BET");
        socket.off("ROUND_RESOLVED");
        socket.off("MATKA_ROUND_RESOLVED");
        socket.off("NEW_USER");
        socket.off("NEW_DEPOSIT");
        socket.off("NEW_WITHDRAWAL");
      }
    };
  }, [socket]);

  if (!mounted) return null;

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full p-10">
      <AlertCircle className="text-red-500 mb-4" size={48} />
      <h2 className="text-xl font-bold mb-2">Dashboard Error</h2>
      <p className="text-zinc-500 mb-6">{error}</p>
      <button onClick={fetchStats} className="px-6 py-2 bg-black text-white rounded-[4px] font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors">Retry</button>
    </div>
  );

  if (!stats) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );

  // Safe Defaults
  const safeStats = {
    totalUsers: stats.totalUsers || 0,
    activeUsers: stats.activeUsers || 0,
    totalDeposits: stats.totalDeposits || 0,
    totalWithdrawals: stats.totalWithdrawals || 0,
    pendingDeposits: stats.pendingDeposits || 0,
    pendingWithdrawals: stats.pendingWithdrawals || 0,
    totalBets: stats.totalBets || 0,
    totalPool: stats.totalPool || 0,
    lifetimeProfit: stats.lifetimeProfit || 0,
    todayProfit: stats.todayProfit || 0,
    weeklyProfit: stats.weeklyProfit || 0,
    monthlyProfit: stats.monthlyProfit || 0,
    commissions: stats.commissions || { today: 0, weekly: 0, monthly: 0, lifetime: 0 },
    referral: stats.referral || { totalPaid: 0, successful: 0, pending: 0 },
    dailyReward: stats.dailyReward || { totalPaid: 0, activeUsers: 0, completedUsers: 0 },
    audit: stats.audit || {}
  };

  const cards = [
    { label: "Total Users", val: safeStats.totalUsers, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Arena Activity", val: arenaActive, icon: Activity, color: "bg-green-50 text-green-600" },
    { label: "Real Active (5m)", val: safeStats.activeUsers, icon: MousePointer2, color: "bg-yellow-50 text-yellow-600" },
    { label: "Total Deposits", val: `₹${safeStats.totalDeposits.toLocaleString()}`, icon: CreditCard, color: "bg-purple-50 text-purple-600" },
    { label: "Total Withdrawals", val: `₹${safeStats.totalWithdrawals.toLocaleString()}`, icon: Wallet, color: "bg-red-50 text-red-600" },
    { label: "Total Bets", val: safeStats.totalBets, icon: Dices, color: "bg-indigo-50 text-indigo-600" },
    { label: "Total Pool", val: `₹${safeStats.totalPool.toLocaleString()}`, icon: Landmark, color: "bg-zinc-100 text-zinc-900" },
    { label: "Lifetime Profit", val: `₹${safeStats.lifetimeProfit.toLocaleString()}`, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
    { label: "Today's Profit", val: `₹${safeStats.todayProfit.toLocaleString()}`, icon: BarChart3, color: "bg-emerald-100 text-emerald-700" },
    { label: "Commission", val: `₹${safeStats.commissions.lifetime.toLocaleString()}`, icon: Percent, icon2: PieChart, color: "bg-amber-50 text-amber-600" },
    { label: "Pending Deps", val: safeStats.pendingDeposits, icon: AlertCircle, color: "bg-orange-50 text-orange-600" },
    { label: "Pending WDs", val: safeStats.pendingWithdrawals, icon: Clock, color: "bg-rose-50 text-rose-600" },
  ];

  const totalPool = liveRound ? (liveRound.round.totalHeadAmount + liveRound.round.totalTailAmount) : 0;
  const predictedWinner = liveRound ? (liveRound.round.totalHeadAmount < liveRound.round.totalTailAmount ? "HEAD" : "TAIL") : "N/A";

  const matkaPool = liveRoundMatka?.round.totalPool || 0;
  const getPredictedMatkaWinner = () => {
    if (!liveRoundMatka) return "N/A";
    const amounts = liveRoundMatka.round.totalAmounts;
    let min = Infinity;
    let winners: number[] = [];
    for (let i = 1; i <= 5; i++) {
      if (amounts[i] < min) {
        min = amounts[i];
        winners = [i];
      } else if (amounts[i] === min) {
        winners.push(i);
      }
    }
    return winners.join(", ");
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* STATS GRID */}
      <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4">
        {cards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            key={card.label}
            className="bg-white p-4 lg:p-5 rounded-[4px] border border-zinc-200 shadow-sm hover:border-black transition-all group"
          >
            <div className={`w-8 h-8 rounded-[4px] ${card.color} flex items-center justify-center mb-2 lg:mb-3`}>
              <card.icon size={16} />
            </div>
            <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{card.label}</p>
            <h3 className="text-lg lg:text-xl font-bold text-black tabular-nums">{card.val}</h3>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LIVE ROUND MONITOR */}
        <section className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-[4px] border border-zinc-200 p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base lg:text-lg font-bold text-black flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Live Round Monitor
                </h3>
                <p className="text-zinc-400 font-semibold text-[10px] lg:text-xs mt-1 uppercase tracking-wider">Round ID: {liveRound?.round.roundNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] lg:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Countdown</p>
                <div className={`text-xl lg:text-2xl font-bold tabular-nums ${liveRound?.secondsLeft <= 5 ? "text-red-500" : "text-black"}`}>
                  00:{liveRound?.secondsLeft?.toString().padStart(2, "0")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <div className="p-4 lg:p-6 bg-zinc-50 rounded-[4px] border border-zinc-100 group">
                <p className="text-[9px] lg:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">HEAD TOTAL</p>
                <p className="text-xl lg:text-2xl font-bold text-black tabular-nums">₹{liveRound?.round.totalHeadAmount.toLocaleString()}</p>
                <div className="mt-3 lg:mt-4 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                   <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${(liveRound?.round.totalHeadAmount / (totalPool || 1)) * 100}%` }} />
                </div>
              </div>

              <div className="p-4 lg:p-6 bg-zinc-50 rounded-[4px] border border-zinc-100 group">
                <p className="text-[9px] lg:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">TAIL TOTAL</p>
                <p className="text-xl lg:text-2xl font-bold text-black tabular-nums">₹{liveRound?.round.totalTailAmount.toLocaleString()}</p>
                <div className="mt-3 lg:mt-4 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                   <div className="h-full bg-black transition-all duration-500" style={{ width: `${(liveRound?.round.totalTailAmount / (totalPool || 1)) * 100}%` }} />
                </div>
              </div>

              <div className="p-4 lg:p-6 bg-black rounded-[4px] text-white group">
                <p className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">TOTAL POOL</p>
                <p className="text-xl lg:text-2xl font-bold tabular-nums">₹{totalPool.toLocaleString()}</p>
                <div className="mt-3 lg:mt-4 flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-yellow-500 text-black rounded-[2px] text-[8px] lg:text-[9px] font-bold uppercase">
                    Prediction: {predictedWinner}
                  </div>
                </div>
                </div>
                </div>
                </div>

                {/* MATKA LIVE MONITOR */}
                <div className="bg-white rounded-[4px] border border-zinc-200 p-4 lg:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                <div>
                <h3 className="text-base lg:text-lg font-bold text-black flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Matka Live Monitor
                </h3>
                <p className="text-zinc-400 font-semibold text-[10px] lg:text-xs mt-1 uppercase tracking-wider">Round ID: {liveRoundMatka?.round.roundNumber}</p>
                </div>
                <div className="text-right">
                <p className="text-[9px] lg:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Countdown</p>
                <div className={`text-xl lg:text-2xl font-bold tabular-nums ${liveRoundMatka?.secondsLeft <= 5 ? "text-red-500" : "text-black"}`}>
                  00:{liveRoundMatka?.secondsLeft?.toString().padStart(2, "0")}
                </div>
                </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 lg:gap-4">
                {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="p-3 lg:p-4 bg-zinc-50 rounded-[4px] border border-zinc-100">
                  <p className="text-[9px] lg:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{num} &rarr; ₹Amt</p>
                  <p className="text-base lg:text-lg font-bold text-black tabular-nums">₹{liveRoundMatka?.round.totalAmounts[num].toLocaleString() || 0}</p>
                  <div className="mt-2 h-1 bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(liveRoundMatka?.round.totalAmounts[num] / (matkaPool || 1)) * 100}%` }} />
                  </div>
                </div>
                ))}

                <div className="p-3 lg:p-4 bg-black rounded-[4px] text-white">
                <p className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">TOTAL POOL</p>
                <p className="text-base lg:text-lg font-bold tabular-nums">₹{matkaPool.toLocaleString()}</p>
                <div className="mt-2 flex flex-col gap-1">
                  <div className="px-1.5 py-0.5 bg-emerald-500 text-black rounded-[2px] text-[7px] lg:text-[8px] font-bold uppercase truncate">
                    Win: {getPredictedMatkaWinner()}
                  </div>
                  <div className="text-[7px] lg:text-[8px] font-bold text-zinc-400 uppercase">
                    Comm: ₹{liveRoundMatka?.round.commissionEarned?.toLocaleString() || 0}
                  </div>
                </div>
                </div>
                </div>
                </div>

                {/* GROWTH & ENGAGEMENT STATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-[4px] border border-zinc-200 p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Users size={16} className="text-blue-500" /> Referral Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 bg-zinc-50 rounded-[4px] border border-zinc-100">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Paid</p>
                          <p className="text-lg font-bold text-black tabular-nums">₹{stats.referral?.totalPaid.toLocaleString()}</p>
                       </div>
                       <div className="p-3 bg-zinc-50 rounded-[4px] border border-zinc-100">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Successful</p>
                          <p className="text-lg font-bold text-black tabular-nums">{stats.referral?.successful}</p>
                       </div>
                       <div className="p-3 bg-zinc-50 rounded-[4px] border border-zinc-100 col-span-2">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Pending Rewards</p>
                          <p className="text-lg font-bold text-black tabular-nums">{stats.referral?.pending}</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[4px] border border-zinc-200 p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Gift size={16} className="text-purple-500" /> Daily Reward Stats
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 bg-zinc-50 rounded-[4px] border border-zinc-100">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Paid</p>
                          <p className="text-lg font-bold text-black tabular-nums">₹{stats.dailyReward?.totalPaid.toLocaleString()}</p>
                       </div>
                       <div className="p-3 bg-zinc-50 rounded-[4px] border border-zinc-100">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">In Program</p>
                          <p className="text-lg font-bold text-black tabular-nums">{stats.dailyReward?.activeUsers}</p>
                       </div>
                       <div className="p-3 bg-zinc-50 rounded-[4px] border border-zinc-100 col-span-2">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Completed Programs</p>
                          <p className="text-lg font-bold text-black tabular-nums">{stats.dailyReward?.completedUsers}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* PROFIT & COMMISSION CENTER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[4px] border border-zinc-200 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" /> Profit Center
              </h4>
              <div className="space-y-2">
                {[
                  { label: "Today's Profit", val: stats.todayProfit, color: "text-emerald-600" },
                  { label: "Weekly Profit", val: stats.weeklyProfit, color: "text-emerald-600" },
                  { label: "Monthly Profit", val: stats.monthlyProfit, color: "text-emerald-600" },
                  { label: "Lifetime Profit", val: stats.lifetimeProfit, color: "text-black" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between p-3 bg-zinc-50 rounded-[4px] border border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-500">{row.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${row.color}`}>₹{row.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[4px] border border-zinc-200 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                <Percent size={16} className="text-blue-500" /> Commission Tracker
              </h4>
              <div className="space-y-2">
                {[
                  { label: "Today's Earnings", val: stats.commissions.today },
                  { label: "Weekly Earnings", val: stats.commissions.weekly },
                  { label: "Monthly Earnings", val: stats.commissions.monthly },
                  { label: "Lifetime Earnings", val: stats.commissions.lifetime },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between p-3 bg-zinc-50 rounded-[4px] border border-zinc-100 border-l-2 border-l-yellow-500">
                    <span className="text-xs font-semibold text-zinc-500">{row.label}</span>
                    <span className="text-sm font-bold text-black tabular-nums">₹{row.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* LIVE BET FEED */}
        <section className="xl:col-span-4">
          <div className="bg-white rounded-[4px] border border-zinc-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-sm font-bold text-black flex items-center gap-2 uppercase tracking-wider">
                Live Bet Feed
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              <AnimatePresence initial={false}>
                {liveBets.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest">
                    Waiting for activity...
                  </div>
                ) : (
                  liveBets.map((bet, i) => (
                    <motion.div
                      key={bet._id || i}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-white border border-zinc-100 rounded-[4px] flex items-center justify-between hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center font-bold text-[10px] ${
                          bet.game === "MATKA" ? "bg-emerald-500 text-white" : 
                          bet.choice === "HEAD" ? "bg-yellow-500 text-black" : "bg-black text-white"
                        }`}>
                          {bet.game === "MATKA" ? bet.choice : bet.choice[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-black tabular-nums">₹{bet.amount.toLocaleString()}</p>
                          <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-tighter">RD #{bet.roundId.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-[9px] font-bold uppercase ${
                           bet.game === "MATKA" ? "text-emerald-600" :
                           bet.choice === "HEAD" ? "text-yellow-600" : "text-black"
                         }`}>{bet.game === "MATKA" ? `NUM ${bet.choice}` : bet.choice}</p>
                         <p className="text-[8px] text-zinc-400 font-bold uppercase">{bet.game || "H&T"}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>

      {/* DATABASE AUDIT */}
      <section className="bg-zinc-900 rounded-[4px] p-6 text-white">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6">System Health & Database Audit</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {Object.entries(stats.audit).map(([key, val]) => (
            <div key={key} className="border-l border-zinc-800 pl-4">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{key}</p>
              <p className="text-xl font-bold tabular-nums">{val as any}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
