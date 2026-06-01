"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, ChevronLeft, CheckCircle2, AlertCircle, Clock, 
  Trophy, Star, Calendar, Sparkles, Coins
} from "lucide-react";
import { getAuthToken, isAuthenticated } from "@/lib/auth-client";

export default function DailyRewardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch("/api/reward/daily", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      fetchStatus();
    }
  }, [fetchStatus, router]);

  const handleClaim = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/reward/daily", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        fetchStatus();
      } else {
        showToast(data.message, "error");
      }
    } catch (e) {
      showToast("Claim failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const canClaim = useMemo(() => {
    if (!status || status.isCompleted) return false;
    if (!status.lastClaim) return true;
    const lastClaim = new Date(status.lastClaim);
    const now = new Date();
    const diffMs = now.getTime() - lastClaim.getTime();
    return diffMs >= 24 * 60 * 60 * 1000;
  }, [status]);

  const getRemainingTime = () => {
    if (!status || !status.lastClaim) return "";
    const lastClaim = new Date(status.lastClaim);
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = nextClaim.getTime() - now.getTime();
    if (diffMs <= 0) return "Ready to claim!";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Next claim in ${hours}h ${mins}m`;
  };

  if (!mounted) return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center">
       <div className="text-yellow-400 font-black italic text-2xl animate-pulse">VAV COIN</div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-yellow-400 selection:text-black font-sans relative pb-10 overflow-hidden isolate">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.1),transparent_50%)] pointer-events-none z-0" />

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm"
          >
            <div className={`flex items-center gap-3 p-5 rounded-[24px] border ${
              toast.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
            } backdrop-blur-2xl shadow-2xl`}>
              {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="text-[10px] font-black uppercase tracking-widest">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative px-6 py-6 border-b border-white/5 backdrop-blur-2xl sticky top-0 z-50 bg-black/40">
        <div className="flex items-center gap-3">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/games")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <ChevronLeft size={24} />
            </motion.button>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic gold-text-gradient">Daily Reward</h1>
        </div>
      </header>

      <div className="relative z-10 px-6 pt-8 max-w-lg mx-auto isolate">
        
        {/* HERO */}
        <section className="text-center mb-10">
           <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-yellow-400/20 blur-[40px] rounded-full animate-pulse" />
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[32px] flex items-center justify-center relative z-10 shadow-2xl rotate-3">
                 <Gift size={48} className="text-black" />
              </div>
           </div>
           <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">7-Day Bonus</h2>
           <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[3px] leading-relaxed">
             Claim free rewards every day. <br /> Total program value: ₹103
           </p>
        </section>

        {/* PROGRESS TRACKER */}
        <section className="bg-white/5 border border-white/5 rounded-[40px] p-6 mb-8 luxury-shadow relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles size={120} />
           </div>

           <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Current Status</p>
                <h3 className="text-xl font-black italic gold-text-gradient uppercase">Day {status?.isCompleted ? 7 : status?.currentDay} / 7</h3>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rewards Claimed</p>
                 <h3 className="text-xl font-black italic text-white uppercase">{status?.isCompleted ? 7 : status?.currentDay - 1} Days</h3>
              </div>
           </div>

           <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 relative z-10">
              {status?.rewards.map((amt: number, idx: number) => {
                const day = idx + 1;
                const isClaimed = status.isCompleted || day < status.currentDay;
                const isCurrent = !status.isCompleted && day === status.currentDay;
                
                return (
                  <div key={day} className="flex flex-col items-center gap-2">
                    <div className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
                      isClaimed ? 'bg-green-500/20 border-green-500/40 text-green-400' :
                      isCurrent ? 'bg-yellow-400 border-transparent text-black scale-110 shadow-lg shadow-yellow-400/20' :
                      'bg-white/5 border-white/5 text-zinc-500'
                    }`}>
                      {isClaimed ? <CheckCircle2 size={16} /> : <p className="text-xs font-black">₹{amt}</p>}
                    </div>
                    <p className={`text-[8px] font-black uppercase ${isCurrent ? 'text-yellow-400' : 'text-zinc-600'}`}>D{day}</p>
                  </div>
                );
              })}
           </div>
        </section>

        {/* ACTION BUTTON */}
        <section className="mb-10 text-center">
           {status?.isCompleted ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 text-center">
                 <Trophy size={48} className="text-green-500 mx-auto mb-4" />
                 <h3 className="text-xl font-black uppercase italic text-green-400 mb-2">Program Completed</h3>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">You have claimed all 7 rewards!</p>
              </div>
           ) : (
              <div className="space-y-6">
                 <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClaim}
                    disabled={!canClaim || claiming}
                    className={`w-full py-6 rounded-[32px] font-black uppercase tracking-[6px] text-lg transition-all shadow-2xl ${
                      !canClaim ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed grayscale' : 'bg-yellow-400 text-black shadow-yellow-400/20 active:scale-95'
                    }`}
                 >
                    {claiming ? "Processing..." : canClaim ? "CLAIM REWARD" : "NEXT REWARD LOCKED"}
                 </motion.button>
                 
                 {!canClaim && (
                   <div className="flex items-center justify-center gap-2 text-zinc-500">
                      <Clock size={14} className="text-yellow-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest">{getRemainingTime()}</p>
                   </div>
                 )}
              </div>
           )}
        </section>

        {/* INFO BOX */}
        <section className="bg-white/5 border border-white/5 rounded-3xl p-6">
           <h3 className="text-[12px] font-black uppercase tracking-[3px] mb-4 flex items-center gap-2 text-zinc-400">
              <Star size={16} /> How it works
           </h3>
           <div className="space-y-4">
              <div className="flex items-start gap-3">
                 <Calendar size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                 <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed">Login every 24 hours to claim your daily bonus. Rewards get bigger as you progress!</p>
              </div>
              <div className="flex items-start gap-3">
                 <Sparkles size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                 <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed">Missing a day won't reset your streak. You'll continue from where you left off until Day 7.</p>
              </div>
           </div>
        </section>

      </div>
    </main>
  );
}
