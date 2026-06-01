"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ChevronLeft, History, Filter, Search, 
  ArrowUpRight, ArrowDownRight, RefreshCcw,
  Clock, CheckCircle2, XCircle, Wallet, Loader2
} from "lucide-react";
import { getAuthToken, isAuthenticated } from "@/lib/auth-client";

export default function HistoryPage() {
  const router = useRouter();
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchBets = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await fetch("/api/history/bets", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBets(data.bets);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      fetchBets();
    }
  }, []);

  if (!mounted) return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center">
       <div className="text-yellow-400 font-black italic text-2xl animate-pulse">VAV COIN</div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-yellow-400 selection:text-black font-sans relative overflow-hidden isolate">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.08),transparent_50%)] pointer-events-none z-0" />
      
      <header className="px-6 py-6 border-b border-white/5 backdrop-blur-2xl sticky top-0 z-50 bg-black/40 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/games")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <ChevronLeft size={24} />
            </motion.button>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic gold-text-gradient">Bet Log</h1>
          </div>
          
          <button 
            onClick={fetchBets}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 active:rotate-180 transition-transform duration-500"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      <div className="relative z-10 px-6 pt-8 h-[calc(100vh-100px)] overflow-y-auto no-scrollbar pb-20 isolate">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <History size={14} className="text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Transaction Master</span>
           </div>
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">{bets.length} Recorded Entries</p>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="animate-spin text-yellow-400" size={32} />
               <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[4px]">Syncing Ledger...</p>
            </div>
          ) : bets.length === 0 ? (
            <div className="text-center py-20 px-10">
               <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Filter size={24} className="text-zinc-800" />
               </div>
               <h3 className="text-white font-black text-lg mb-2">NO RECORDS FOUND</h3>
               <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Start playing to populate your ledger</p>
            </div>
          ) : (
            bets.map((bet, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={bet._id} 
                className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-5 luxury-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />
                
                <div className="flex items-center justify-between mb-5 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${bet.status === 'WIN' ? 'bg-green-500 text-black' : 'bg-white/5 text-zinc-500'}`}>
                         {bet.choice[0]}
                      </div>
                      <div>
                         <h4 className="text-white font-black text-xs uppercase tracking-widest">{bet.choice} PREDICTION</h4>
                         <p className="text-zinc-600 text-[8px] font-black uppercase mt-0.5 tracking-tighter">Round #{bet.roundId?.roundNumber?.slice(-6) || '------'}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">{new Date(bet.createdAt).toLocaleDateString()}</p>
                      <p className="text-white font-black text-sm tabular-nums italic">₹{bet.amount}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-white/5 relative z-10">
                   <div className="flex items-center gap-2">
                      {bet.status === "WIN" ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
                           <CheckCircle2 size={10} />
                           <span className="text-[8px] font-black uppercase tracking-widest">Successful Payout</span>
                        </div>
                      ) : bet.status === "LOSS" ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                           <XCircle size={10} />
                           <span className="text-[8px] font-black uppercase tracking-widest">Entry Terminated</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                           <Clock size={10} />
                           <span className="text-[8px] font-black uppercase tracking-widest">Awaiting Flip</span>
                        </div>
                      )}
                   </div>
                   
                   {bet.status === "WIN" && (
                     <div className="flex flex-col items-end">
                        <span className="text-green-500 font-black text-sm tabular-nums">+₹{bet.winAmount}</span>
                        <p className="text-zinc-600 text-[7px] font-bold uppercase tracking-widest">Credited to Wallet</p>
                     </div>
                   )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
