"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Copy, Share2, ChevronLeft, Gift, 
  TrendingUp, Wallet, CheckCircle2, Clock, AlertCircle, Coins
} from "lucide-react";
import { getAuthToken, isAuthenticated } from "@/lib/auth-client";

export default function ReferralPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [copyToast, setCopyToast] = useState<{ message: string; type: "success" } | null>(null);

  const showToast = (message: string) => {
    setCopyToast({ message, type: "success" });
    setTimeout(() => setCopyToast(null), 2000);
  };

  const fetchStats = useCallback(async () => {
    try {
      console.log("[REFERRAL PAGE] Fetching stats...");
      const token = getAuthToken();
      if (!token) {
        console.log("[REFERRAL PAGE] No token found");
        return;
      }
      const res = await fetch("/api/referral", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("[REFERRAL PAGE] API Response:", data);
      
      if (data.success && data.data) {
        setStats(data.data);
      } else {
        console.error("[REFERRAL PAGE] API failed:", data.message);
      }
    } catch (e) {
      console.error("[REFERRAL PAGE] Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      fetchStats();
    }
  }, [fetchStats, router]);

  const handleCopy = (text: string | undefined, label: string) => {
    if (!text) {
      showToast("Generating data...");
      return;
    }
    navigator.clipboard.writeText(text);
    showToast(`${label} copied!`);
  };

  const referralLink = stats?.referralCode && mounted 
    ? `${window.location.origin}/register?ref=${stats.referralCode}` 
    : "";

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
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 backdrop-blur-xl">
              <CheckCircle2 size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">{copyToast.message}</p>
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
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic gold-text-gradient">Refer & Earn</h1>
        </div>
      </header>

      <div className="relative z-10 px-6 pt-8 max-w-lg mx-auto isolate">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
             <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[4px]">Syncing Data...</p>
          </div>
        ) : (
          <>
            {/* HERO SECTION */}
            <section className="text-center mb-10">
               <div className="w-20 h-20 bg-yellow-400/10 rounded-[28px] border border-yellow-400/20 flex items-center justify-center mx-auto mb-6">
                  <Users size={40} className="text-yellow-400" />
               </div>
               <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Invite Friends</h2>
               <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[3px] leading-relaxed">
                 Earn ₹50 for every friend who <br /> makes their first deposit.
               </p>
            </section>

            {/* REFERRAL CODE CARD */}
            <section className="glass-card rounded-[32px] p-6 mb-6 luxury-shadow">
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Your Unique Code</p>
               <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl p-4">
                  <span className="text-2xl font-black italic gold-text-gradient tracking-tighter">{stats?.referralCode || "---"}</span>
                  <button 
                    disabled={!stats?.referralCode}
                    onClick={() => handleCopy(stats?.referralCode, "Code")}
                    className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50"
                  >
                     <Copy size={18} />
                  </button>
               </div>
            </section>

            {/* REFERRAL LINK CARD */}
            <section className="glass-card rounded-[32px] p-6 mb-8 luxury-shadow">
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Sharing Link</p>
               <div className="flex items-center gap-3">
                  <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden">
                     <p className="text-[10px] font-bold text-zinc-500 truncate">{referralLink || "Generating link..."}</p>
                  </div>
                  <button 
                    disabled={!referralLink}
                    onClick={() => handleCopy(referralLink, "Link")}
                    className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
                  >
                     <Share2 size={20} className="text-yellow-400" />
                  </button>
               </div>
            </section>

            {/* STATS GRID */}
            <section className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-white/5 border border-white/5 rounded-3xl p-5">
                  <Users size={16} className="text-blue-400 mb-3" />
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Invites</p>
                  <h4 className="text-xl font-black italic">{stats?.totalReferrals}</h4>
               </div>
               <div className="bg-white/5 border border-white/5 rounded-3xl p-5">
                  <CheckCircle2 size={16} className="text-green-400 mb-3" />
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Successful</p>
                  <h4 className="text-xl font-black italic">{stats?.successfulReferrals}</h4>
               </div>
               <div className="bg-white/5 border border-white/5 rounded-3xl p-5">
                  <Clock size={16} className="text-yellow-400 mb-3" />
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Pending</p>
                  <h4 className="text-xl font-black italic">{stats?.pendingReferrals}</h4>
               </div>
               <div className="bg-white/5 border border-white/5 rounded-3xl p-5">
                  <Coins size={16} className="text-emerald-400 mb-3" />
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Earnings</p>
                  <h4 className="text-xl font-black italic text-emerald-400">₹{stats?.referralEarnings}</h4>
               </div>
            </section>

            {/* REWARD INFO */}
            <section className="bg-white/5 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                  <Gift size={100} />
               </div>
               <h3 className="text-[12px] font-black uppercase tracking-[3px] mb-4">Program Rules</h3>
               <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1" />
                     <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed">Friend must make a first deposit of ₹100 or more.</p>
                  </li>
                  <li className="flex items-start gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1" />
                     <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed">Referrer receives ₹50 once the deposit is approved.</p>
                  </li>
                  <li className="flex items-start gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1" />
                     <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed">New user receives ₹30 welcome bonus upon approval.</p>
                  </li>
               </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
