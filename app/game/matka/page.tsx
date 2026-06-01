"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Wallet, History, ChevronLeft, Clock, TrendingUp, Trophy, Users, ShieldCheck, AlertCircle, CheckCircle2, User, Gamepad2 } from "lucide-react";
import { getAuthToken, isAuthenticated } from "@/lib/auth-client";
import { useArenaActivity } from "@/lib/use-arena-activity";

export default function MatkaGame() {
  const router = useRouter();
  const arenaActive = useArenaActivity();
  const [mounted, setMounted] = useState(false);
  
  // Core Game States
  const [timeLeft, setTimeLeft] = useState(45);
  const [roundNumber, setRoundNumber] = useState("");
  
  // Flow Control States
  const [isShowingResult, setIsShowingResult] = useState(false);
  const [isRoundTransition, setIsRoundTransition] = useState(false);
  
  // UI States
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResults, setLastResults] = useState<any[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New states for UX improvements
  const [activeBets, setActiveBets] = useState<any[]>([]);
  const [permanentHistory, setPermanentHistory] = useState<any[]>([]);
  const [pools, setPools] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [totalPool, setTotalPool] = useState(0);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);

  // Refs for bulletproof tracking
  const lastProcessedRoundRef = useRef("");
  const isSequenceActiveRef = useRef(false);

  // Derived States
  const isActionLocked = isShowingResult || isRoundTransition;
  const bettingLocked = useMemo(() => timeLeft <= 5 || isActionLocked, [timeLeft, isActionLocked]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBalance = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch("/api/user/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
      } else if (data.blocked) {
        router.push("/login");
      }
    } catch (e) {}
  }, [router]);

  const fetchLatestResults = useCallback(async () => {
    try {
      const res = await fetch("/api/matka/history/results");
      const data = await res.json();
      if (data.success && data.results && Array.isArray(data.results)) {
        setLastResults(data.results);
      }
    } catch (e) {}
  }, []);

  const fetchPermanentHistory = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch("/api/matka/history/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.bets) {
        setPermanentHistory(data.bets);
      }
    } catch (e) {}
  }, []);

  const triggerResultSequence = async (roundNum: string, result: number) => {
    if (isSequenceActiveRef.current) return;
    isSequenceActiveRef.current = true;
    setIsRoundTransition(true);
    lastProcessedRoundRef.current = roundNum;
    
    setWinningNumber(result);
    setIsShowingResult(true);
    
    setTimeout(() => {
      setIsShowingResult(false);
      setIsRoundTransition(false);
      isSequenceActiveRef.current = false;
      fetchBalance();
      fetchLatestResults();
      fetchPermanentHistory();
      setSelectedNumber(null);
    }, 5000);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/matka/round/current", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      
      if (data.maintenance) {
        setMaintenance(true);
        return;
      }
      setMaintenance(false);

      if (data.success && data.round) {
        const serverTime = data.secondsLeft;
        const serverRound = data.round.roundNumber;
        const serverResult = data.round.result;

        setPools(data.round.totalAmounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        setTotalPool(data.round.totalPool || 0);
        
        if (!isActionLocked) {
          setActiveBets(data.myBets || []);
        }

        if (serverTime === 0 && !isSequenceActiveRef.current && serverRound !== lastProcessedRoundRef.current && serverResult !== null) {
          triggerResultSequence(serverRound, serverResult);
        }

        if (!isActionLocked) {
          if (serverRound !== roundNumber && roundNumber !== "") {
            setWinningNumber(null);
          }
          
          setTimeLeft(serverTime);
          setRoundNumber(serverRound);
          
          if (serverTime >= 40) {
            fetchLatestResults();
            fetchBalance();
          }
        } else {
          setTimeLeft(0);
        }
      }
    } catch (e) {}
  }, [fetchBalance, fetchLatestResults, fetchPermanentHistory, isActionLocked, roundNumber]);

  const handleConfirmBet = async () => {
    if (selectedNumber === null) {
      showToast("Select a number", "error");
      return;
    }
    if (!betAmount || Number(betAmount) <= 0) {
      showToast("Enter amount", "error");
      return;
    }
    if (bettingLocked) {
      showToast("Betting is locked", "error");
      return;
    }
    if (Number(betAmount) < 10) {
      showToast("Minimum bet is ₹10", "error");
      return;
    }
    
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/matka/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(betAmount), choice: selectedNumber }),
      });
      const data = await res.json();
      
      if (!data.success) {
        showToast(data.message, "error");
      } else {
        setBalance(data.balance);
        if (data.bet) {
          setActiveBets(prev => [...prev, data.bet]);
        }
        showToast(`Bet placed on ${selectedNumber}!`, "success");
      }
    } catch (error) {
      showToast("Betting failed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setAuthChecked(true);
      fetchBalance();
      fetchLatestResults();
      fetchPermanentHistory();
      const interval = setInterval(fetchStatus, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  if (!authChecked) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-400 font-black text-2xl italic italic">VAV COIN</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-yellow-400 selection:text-black font-sans relative">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,215,0,0.1),transparent_50%)] pointer-events-none" />

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

      {/* RESULT POPUP */}
      <AnimatePresence>
        {isShowingResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center relative w-full max-w-sm"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-yellow-400/20 blur-[100px] rounded-full animate-pulse" />
              
              <div className="relative inline-block mb-12">
                <motion.div 
                   animate={{ scale: [1, 1.1, 1] }}
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="w-52 h-52 rounded-full border-[12px] border-yellow-400 shadow-[0_0_60px_rgba(255,215,0,0.3)] bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center"
                >
                   <span className="text-8xl font-black italic gold-text-gradient">{winningNumber}</span>
                </motion.div>
              </div>
              <h2 className="text-white text-7xl font-black tracking-tighter mb-4 italic leading-none uppercase">
                NUMBER {winningNumber} <br />
                <span className="gold-text-gradient">WINS!</span>
              </h2>
              <div className="h-[2px] w-24 gold-gradient mx-auto mb-6 opacity-40" />
              <p className="text-zinc-600 font-black uppercase tracking-[8px] text-[10px]">Verified Outcome</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative z-10 px-6 py-6 border-b border-white/5 backdrop-blur-2xl sticky top-0 z-50 bg-black/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/games")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <ChevronLeft size={24} />
            </motion.button>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic gold-text-gradient">MATKA</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/games")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400"
            >
              <Gamepad2 size={18} />
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/wallet")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-yellow-400"
            >
              <Wallet size={18} />
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/history")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400"
            >
              <History size={18} />
            </motion.button>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 luxury-shadow">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
             <p className="text-zinc-500 text-[10px] font-mono font-black tracking-widest uppercase">#{roundNumber.slice(-6) || "------"}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest leading-none mb-1">Available Credits</p>
            <h2 className="text-white font-black text-sm leading-none">₹{balance.toLocaleString("en-IN")}</h2>
          </div>
        </div>
      </header>

      <div className="relative z-10 px-6 pt-6 h-[calc(100vh-180px)] overflow-y-auto no-scrollbar pb-12">
        
        {/* 1. TIMER */}
        <section className="flex flex-col items-center mb-10">
          <div className="relative flex flex-col items-center">
            <div className="absolute inset-0 bg-yellow-400/5 blur-[40px] rounded-full" />
            <h1 className={`text-8xl font-black tabular-nums leading-none tracking-tighter relative z-10 ${bettingLocked ? "text-red-500 opacity-40" : "text-white"}`}>
              00:<span className="gold-text-gradient">{timeLeft.toString().padStart(2, "0")}</span>
            </h1>
            <div className={`mt-4 px-6 py-2 rounded-full border ${bettingLocked ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-400/5 border-yellow-400/10 text-yellow-400'} backdrop-blur-xl relative z-10`}>
               <p className="text-[10px] font-black uppercase tracking-[3px]">
                 {isActionLocked ? "Resolving Round..." : bettingLocked ? "Bets Locked" : "Accepting Wagers"}
               </p>
            </div>
          </div>
        </section>

        {/* 2. NUMBER CARDS */}
        <section className="grid grid-cols-5 gap-3 mb-8">
          {[1, 2, 3, 4, 5].map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.95 }}
              onClick={() => !bettingLocked && setSelectedNumber(num)}
              disabled={bettingLocked}
              className={`relative aspect-square rounded-2xl transition-all border-2 flex flex-col items-center justify-center overflow-hidden ${
                selectedNumber === num ? "gold-gradient border-transparent shadow-[0_10px_20px_rgba(255,215,0,0.3)] scale-110 z-10" : "bg-white/5 border-white/5"
              } ${bettingLocked ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
            >
              <span className={`text-4xl font-black italic ${selectedNumber === num ? "text-black" : "gold-text-gradient"}`}>{num}</span>
              <div className="absolute top-1 right-1">
                 <p className={`text-[6px] font-black uppercase ${selectedNumber === num ? "text-black/60" : "text-zinc-600"}`}>4.0X</p>
              </div>
            </motion.button>
          ))}
        </section>

        {/* 3. AMOUNT INPUT */}
        <section className="flex flex-col items-center mb-6">
           <div className="w-full max-w-[240px] relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-yellow-400 font-black text-xl italic">₹</div>
              <input
                disabled={bettingLocked}
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-6 py-4 outline-none text-white text-2xl font-black placeholder:text-zinc-800 focus:border-yellow-400/30 transition-all disabled:opacity-50 tracking-tighter text-center"
              />
           </div>
           
           <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[10, 50, 100, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => !bettingLocked && setBetAmount(amount.toString())}
                  className={`py-2 px-4 rounded-xl text-[10px] font-black border transition-all ${
                    betAmount === amount.toString() ? 'bg-yellow-400 text-black border-transparent' : 'bg-white/5 border-white/5 text-zinc-400'
                  }`}
                  disabled={bettingLocked}
                >
                  ₹{amount}
                </button>
              ))}
           </div>
        </section>

        {/* 4. CONFIRM BET BUTTON */}
        <section className="mb-10 flex justify-center">
           <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleConfirmBet}
              disabled={bettingLocked || loading || !betAmount || selectedNumber === null}
              className={`w-full max-w-[320px] py-5 rounded-2xl font-black uppercase tracking-[4px] text-sm transition-all shadow-2xl ${
                (bettingLocked || !betAmount || selectedNumber === null) 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/5' 
                : 'bg-yellow-400 text-black shadow-yellow-400/20 active:scale-95'
              }`}
           >
              {loading ? "Processing..." : "CONFIRM BET"}
           </motion.button>
        </section>

        {/* 5. USER BET STATUS */}
        <section className="mb-10 bg-white/5 border border-white/5 rounded-3xl p-6">
           <h2 className="text-[10px] font-black text-yellow-400 tracking-[4px] uppercase mb-6 flex items-center gap-2">
              <ShieldCheck size={14} /> Your Active Bets
           </h2>
           <div className="space-y-3">
              {activeBets.length === 0 && (
                <div className="py-8 text-center">
                   <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">No active wagers</p>
                </div>
              )}
              {activeBets.map((bet, idx) => (
                <div key={idx} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-yellow-400 text-black flex items-center justify-center text-2xl font-black italic">
                         {bet.choice}
                      </div>
                      <div>
                         <p className="text-white font-black text-lg leading-none">₹{bet.amount}</p>
                         <p className="text-zinc-600 text-[8px] font-black uppercase mt-1">Number {bet.choice} → Round #{roundNumber.slice(-6)}</p>
                      </div>
                   </div>
                   <div className="px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                      <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">Live</span>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* 6. RECENT RESULTS (LAST 100) */}
        <section className="mb-10 px-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] font-black text-zinc-600 tracking-[4px] uppercase flex items-center gap-2">
              <History size={14} className="text-zinc-700" /> Recent Results
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {lastResults.map((item, index) => (
              <div 
                key={index} 
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border border-white/10 bg-white/5 text-yellow-400"
              >
                {item.result}
              </div>
            ))}
          </div>
        </section>

        {/* 7. PERMANENT USER HISTORY */}
        <section className="mb-12">
           <h2 className="text-[10px] font-black text-zinc-600 tracking-[4px] uppercase mb-6 px-2">Matka Master History</h2>
           <div className="space-y-4">
              {permanentHistory.length === 0 && <p className="text-center text-zinc-800 text-[10px] font-black uppercase py-10">Historical records empty</p>}
              {permanentHistory.map((bet, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-[24px] p-5">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                         <span className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Round #{bet.roundId?.roundNumber?.slice(-6) || "------"}</span>
                      </div>
                      <span className="text-zinc-600 text-[8px] font-black uppercase">
                        {mounted ? new Date(bet.createdAt).toLocaleDateString() : "---"} | {mounted ? new Date(bet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
                      </span>
                   </div>
                   
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${bet.status === "WIN" ? "bg-green-500/20 text-green-500" : "bg-white/5 text-zinc-500"}`}>
                            {bet.choice}
                         </div>
                         <div>
                            <p className="text-white font-black text-sm">₹{bet.amount}</p>
                            <p className="text-zinc-600 text-[8px] font-black uppercase">Selected Number</p>
                         </div>
                      </div>
                      
                      <div className="text-right">
                         <div className={`flex items-center gap-1 justify-end ${bet.status === "WIN" ? "text-green-500" : "text-red-500"}`}>
                            <span className="text-xs font-black uppercase tracking-widest">{bet.status === "WIN" ? "WIN ✅" : "LOSS ❌"}</span>
                         </div>
                         {bet.status === "WIN" && (
                           <p className="text-green-500/80 font-black text-[10px] mt-1">+₹{bet.winAmount}</p>
                         )}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>

      </div>
    </main>
  );
}
