"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gamepad2, Users, Coins, TrendingUp, Percent, 
  Clock, Landmark, History, AlertCircle, Settings, PieChart
} from "lucide-react";
import { getAuthToken } from "@/lib/auth-client";
import { useSocket } from "../SocketProvider";

export default function MatkaManagement() {
  const [stats, setStats] = useState<any>(null);
  const [liveRound, setLiveRound] = useState<any>(null);
  const [liveBets, setLiveBets] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const { socket } = useSocket();

  const fetchStats = async () => {
    const token = getAuthToken();
    try {
      console.log("[ADMIN V2 MATKA] Calling /api/admin-v2/matka-stats");
      const res = await fetch("/api/admin-v2/matka-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) {}
  };

  const fetchLiveRound = async () => {
    const token = getAuthToken();
    try {
      console.log("[ADMIN V2 MATKA] Calling /api/admin-v2/matka-round-stats");
      const res = await fetch("/api/admin-v2/matka-round-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setLiveRound(data);
    } catch (e) {}
  };

  useEffect(() => {
    setMounted(true);
    fetchStats();
    fetchLiveRound();
    const interval = setInterval(fetchLiveRound, 1000);

    if (socket) {
      socket.on("MATKA_NEW_BET", (data: any) => {
        setLiveBets((prev) => [data.bet, ...prev].slice(0, 20));
        setLiveRound((prev: any) => {
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

      socket.on("MATKA_ROUND_RESOLVED", () => {
        fetchStats();
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off("MATKA_NEW_BET");
        socket.off("MATKA_ROUND_RESOLVED");
      }
    };
  }, [socket]);

  if (!mounted || !stats) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );

  const matkaPool = liveRound?.round.totalPool || 0;
  const getPredictedWinner = () => {
    if (!liveRound) return "N/A";
    const amounts = liveRound.round.totalAmounts;
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
      {/* HEADER STATS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Matka Players", val: stats.totalPlayers, icon: Users, color: "bg-emerald-50 text-emerald-600" },
          { label: "Total Matka Bets", val: stats.totalBets, icon: Gamepad2, color: "bg-blue-50 text-blue-600" },
          { label: "Matka Lifetime Pool", val: `₹${stats.totalPool.toLocaleString()}`, icon: Coins, color: "bg-yellow-50 text-yellow-600" },
          { label: "Matka Lifetime Commission", val: `₹${stats.commissions.lifetime.toLocaleString()}`, icon: Percent, icon2: PieChart, color: "bg-purple-50 text-purple-600" },
        ].map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-[4px] border border-zinc-200 shadow-sm">
            <div className={`w-10 h-10 rounded-[4px] ${card.color} flex items-center justify-center mb-4`}>
              <card.icon size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{card.label}</p>
            <h3 className="text-2xl font-bold text-black tabular-nums">{card.val}</h3>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LIVE ROUND MONITOR */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-[4px] border border-zinc-200 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <Gamepad2 size={120} />
            </div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-black flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live Round Monitor
                </h3>
                <p className="text-zinc-400 font-semibold text-xs mt-1 uppercase tracking-wider">RD #{liveRound?.round.roundNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Time Remaining</p>
                <div className={`text-3xl font-bold tabular-nums ${liveRound?.secondsLeft <= 5 ? "text-red-500" : "text-black"}`}>
                  00:{liveRound?.secondsLeft?.toString().padStart(2, "0")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="p-6 bg-zinc-50 rounded-[4px] border border-zinc-100 flex flex-col items-center group hover:border-emerald-500 transition-colors">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 text-center">NUMBER {num}</p>
                  <p className="text-2xl font-bold text-black tabular-nums mb-3">₹{liveRound?.round.totalAmounts[num].toLocaleString() || 0}</p>
                  <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${(liveRound?.round.totalAmounts[num] / (matkaPool || 1)) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-6 bg-black rounded-[4px] text-white">
               <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Current Prize Pool</p>
                  <p className="text-3xl font-bold tabular-nums">₹{matkaPool.toLocaleString()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Current Prediction</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black font-black uppercase text-xs rounded-[2px] shadow-lg shadow-emerald-500/20">
                     <TrendingUp size={14} /> Winner: {getPredictedWinner()}
                  </div>
               </div>
            </div>
          </section>

          {/* COMMISSION TRACKER */}
          <section className="bg-white rounded-[4px] border border-zinc-200 p-8 shadow-sm">
             <h3 className="text-lg font-bold text-black mb-8 flex items-center gap-2 uppercase tracking-wider">
                <Percent size={20} className="text-purple-500" /> Revenue & Commissions
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Today's Commission", val: stats.commissions.today, color: "text-emerald-600" },
                  { label: "Weekly Commission", val: stats.commissions.weekly, color: "text-blue-600" },
                  { label: "Lifetime Commission", val: stats.commissions.lifetime, color: "text-purple-600" },
                ].map(row => (
                  <div key={row.label} className="p-6 bg-zinc-50 rounded-[4px] border border-zinc-100 border-l-4 border-l-black">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{row.label}</p>
                    <p className={`text-2xl font-bold tabular-nums ${row.color}`}>₹{row.val.toLocaleString()}</p>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* RECENT MATKA BETS */}
        <div className="lg:col-span-4 h-full">
          <section className="bg-white rounded-[4px] border border-zinc-200 shadow-sm flex flex-col h-[600px] lg:h-full overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-sm font-bold text-black flex items-center gap-2 uppercase tracking-wider">
                Live Matka Bets
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              <AnimatePresence initial={false}>
                {liveBets.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-[0.3em]">
                    Syncing...
                  </div>
                ) : (
                  liveBets.map((bet, i) => (
                    <motion.div
                      key={bet._id || i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-white border border-zinc-100 rounded-[4px] flex items-center justify-between hover:border-emerald-200 transition-all hover:bg-emerald-50/10 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[4px] bg-emerald-500 text-white flex items-center justify-center font-bold text-lg italic shadow-lg shadow-emerald-500/10">
                          {bet.choice}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black tabular-nums">₹{bet.amount.toLocaleString()}</p>
                          <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">RD #{bet.roundId.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="px-2 py-0.5 bg-zinc-100 rounded-[2px] text-[8px] font-bold text-zinc-500 uppercase mb-1">Commission</div>
                         <p className="text-xs font-bold text-emerald-600 tabular-nums">₹{bet.commission.toLocaleString()}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
