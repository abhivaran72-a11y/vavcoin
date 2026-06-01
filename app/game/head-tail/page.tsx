"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Wallet, History, ChevronLeft, Clock, TrendingUp, Trophy, Users, ShieldCheck, AlertCircle, CheckCircle2, User, Gamepad2 } from "lucide-react";
import { getAuthToken, isAuthenticated } from "@/lib/auth-client";
import { useArenaActivity } from "@/lib/use-arena-activity";

export default function HeadTailGame() {
  const router = useRouter();
  const arenaActive = useArenaActivity();
  const [mounted, setMounted] = useState(false);
  
  // Core Game States
  const [timeLeft, setTimeLeft] = useState(30);
  const [roundNumber, setRoundNumber] = useState("");
  const [coinSide, setCoinSide] = useState("H"); // "H" or "T"
  
  // Flow Control States
  const [isFlipping, setIsFlipping] = useState(false);
  const [isShowingResult, setIsShowingResult] = useState(false);
  const [isRoundTransition, setIsRoundTransition] = useState(false);
  
  // UI States
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState("");
  const [selectedSide, setSelectedSide] = useState<"HEAD" | "TAIL" | null>(null);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [lastResults, setLastResults] = useState<any[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New states for UX improvements
  const [myBets, setMyBets] = useState<any[]>([]);
  const [pools, setPools] = useState({ head: 0, tail: 0 });
  const [roundResult, setRoundResult] = useState<any>(null);

  // Refs for bulletproof tracking
  const lastProcessedRoundRef = useRef("");
  const isSequenceActiveRef = useRef(false);

  // Derived States
  const isActionLocked = isFlipping || isShowingResult || isRoundTransition;
  const bettingLocked = useMemo(() => timeLeft <= 5 || isActionLocked, [timeLeft, isActionLocked]);

  const headBetAmount = useMemo(() => myBets.find(b => b.choice === "HEAD")?.amount || 0, [myBets]);
  const tailBetAmount = useMemo(() => myBets.find(b => b.choice === "TAIL")?.amount || 0, [myBets]);
  const totalWager = useMemo(() => headBetAmount + tailBetAmount, [headBetAmount, tailBetAmount]);
  const totalPotentialReturn = useMemo(() => {
    if (headBetAmount > 0 && tailBetAmount > 0) {
      return Math.max(headBetAmount, tailBetAmount) * 2;
    }
    return totalWager * 2;
  }, [headBetAmount, tailBetAmount, totalWager]);

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
      const res = await fetch("/api/history/results");
      const data = await res.json();
      if (data.success && data.results && Array.isArray(data.results)) {
        setLastResults(data.results);
        return data.results[0];
      }
    } catch (e) {}
    return null;
  }, []);

  const triggerResultSequence = async (roundNum: string, result: string) => {
    if (isSequenceActiveRef.current) return;
    isSequenceActiveRef.current = true;
    setIsRoundTransition(true);
    lastProcessedRoundRef.current = roundNum;
    
    // Calculate Win/Loss for the status section
    const headBet = myBets.find(b => b.choice === "HEAD");
    const tailBet = myBets.find(b => b.choice === "TAIL");
    const winningBet = result === "HEAD" ? headBet : tailBet;
    const losingBet = result === "HEAD" ? tailBet : headBet;

    if (winningBet) {
      const payout = winningBet.amount * 2;
      const commission = payout * 0.01; // 1% commission
      setRoundResult({
        win: true,
        side: result,
        amount: winningBet.amount,
        payout: payout - commission,
        commission: commission
      });
    } else if (losingBet) {
      setRoundResult({
        win: false,
        side: losingBet.choice,
        amountLost: losingBet.amount
      });
    }

    // 1. SET RESULT SIDE
    const resultSide = result === "HEAD" ? "H" : "T";
    setCoinSide(resultSide);
    
    // 2. START COIN FLIP ANIMATION (3s)
    setIsFlipping(true);
    
    setTimeout(() => {
      setIsFlipping(false);
      setIsShowingResult(true); // 3. SHOW RESULT POPUP (3s)
      
      setTimeout(() => {
        setIsShowingResult(false);
        
        // 4. WAIT 2 SECONDS (To complete 8s total buffer: 3 + 3 + 2)
        setTimeout(() => {
          isSequenceActiveRef.current = false;
          setIsRoundTransition(false);
          // Result stays for 3-5 seconds after round resolution as per requirement 6
          setTimeout(() => setRoundResult(null), 5000);
          fetchBalance();
          fetchLatestResults(); // Refresh history after round completes
        }, 2000);
      }, 3000);
    }, 3000);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/round/current", {
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

        // Only update myBets if not resolving
        if (!isActionLocked) {
          setMyBets(data.myBets || []);
        }

        // TRIGGER LOGIC:
        // Must be T=0 AND not already processing AND this round hasn't been flipped yet.
        if (serverTime === 0 && !isSequenceActiveRef.current && serverRound !== lastProcessedRoundRef.current && serverResult) {
          triggerResultSequence(serverRound, serverResult);
        }

        // Only update timer/round number if we aren't in the middle of a flip/result
        if (!isActionLocked) {
          // If a new round has started, reset the result status
          if (serverRound !== roundNumber && roundNumber !== "") {
            setRoundResult(null);
          }
          
          setTimeLeft(serverTime);
          setRoundNumber(serverRound);
          
          // Sync on new round start
          if (serverTime >= 28) {
            fetchLatestResults();
            fetchBalance();
          }
        } else {
          // Keep UI stable at 0 during transition
          setTimeLeft(0);
        }
      }
    } catch (e) {}
  }, [fetchBalance, fetchLatestResults, isActionLocked, triggerResultSequence, roundNumber]);

  const handlePlaceBet = async () => {
    if (!selectedSide || !betAmount) {
      showToast("Select side and amount", "error");
      return;
    }
    if (bettingLocked) {
      showToast("Betting is locked", "error");
      return;
    }
    if (Number(betAmount) < 5) {
      showToast("Minimum bet is ₹5", "error");
      return;
    }
    
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(betAmount), choice: selectedSide }),
      });
      const data = await res.json();
      
      if (!data.success) {
        showToast(data.message, "error");
      } else {
        setBalance(data.balance);
        setBetAmount("");
        if (data.bet) {
          setMyBets(prev => [...prev, data.bet]);
        }
        showToast("Bet placed successfully!", "success");
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
                   animate={{ rotateY: 360 }}
                   transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                   className={`w-52 h-52 rounded-full border-[12px] ${coinSide === 'H' ? 'border-yellow-400 shadow-[0_0_60px_rgba(255,215,0,0.3)]' : 'border-zinc-400 shadow-[0_0_60px_rgba(255,255,255,0.1)]'} bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center`}
                >
                   <span className={`text-8xl font-black italic ${coinSide === 'H' ? 'gold-text-gradient' : 'text-zinc-400'}`}>{coinSide}</span>
                </motion.div>
              </div>
              <h2 className="text-white text-7xl font-black tracking-tighter mb-4 italic leading-none uppercase">
                {coinSide === "H" ? "HEAD" : "TAIL"} <br />
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
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic gold-text-gradient">ARENA</h1>
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
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400"
            >
              <User size={18} />
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
        
        {/* TIMER & STATUS & PLAYERS */}
        <section className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 mb-4">
             <Users size={12} className="text-zinc-500" />
             <p className="text-[9px] font-black uppercase tracking-[2px] text-zinc-500">{mounted ? arenaActive : 0} ACTIVE PLAYERS</p>
          </div>
          
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

        {/* PREMIUM COIN AREA */}
        <section className="flex justify-center mb-12">
          <div className="relative w-64 h-64 perspective-1000">
            <motion.div
              initial={false}
              animate={isFlipping ? {
                rotateY: [0, 1800 + (coinSide === "T" ? 180 : 0)],
                transition: { duration: 3, ease: [0.4, 0, 0.2, 1] }
              } : {
                rotateY: coinSide === "T" ? 180 : 0,
                transition: { duration: isActionLocked ? 0 : 0.5 }
              }}
              style={{ transformStyle: "preserve-3d" }}
              className="w-full h-full relative"
            >
              {/* FRONT (HEAD) */}
              <div 
                className="absolute inset-0 rounded-full border-[12px] border-yellow-500 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_60px_rgba(255,215,0,0.25)] overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]" />
                <span className="text-black text-[140px] font-black italic select-none relative z-10 drop-shadow-2xl">H</span>
                <div className="absolute bottom-4 text-[10px] font-black text-black/40 uppercase tracking-[4px]">VAV COIN</div>
              </div>
              
              {/* BACK (TAIL) */}
              <div 
                className="absolute inset-0 rounded-full border-[12px] border-zinc-500 bg-gradient-to-br from-zinc-300 via-zinc-500 to-zinc-700 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.15)] overflow-hidden"
                style={{ 
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent)]" />
                <span className="text-black text-[140px] font-black italic select-none relative z-10 drop-shadow-2xl">T</span>
                <div className="absolute bottom-4 text-[10px] font-black text-black/40 uppercase tracking-[4px]">VAV COIN</div>
              </div>
            </motion.div>
            
            {/* Ambient Glow */}
            <div className={`absolute -inset-10 rounded-full border border-yellow-400/10 blur-[40px] transition-opacity duration-1000 ${isActionLocked ? "opacity-100" : "opacity-0"}`} />
          </div>
        </section>

        {/* POOL INFORMATION */}
        <section className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">HEAD Pool</p>
            <h3 className="text-white font-black text-lg">₹{pools.head.toLocaleString("en-IN")}</h3>
            {myBets.find(b => b.choice === "HEAD") && (
              <div className="absolute inset-0 bg-yellow-400/5 flex items-center justify-center">
                 <div className="flex items-center gap-1 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter">
                   <TrendingUp size={8} /> YOUR BET ₹{myBets.find(b => b.choice === "HEAD")?.amount}
                 </div>
              </div>
            )}
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">TAIL Pool</p>
            <h3 className="text-white font-black text-lg">₹{pools.tail.toLocaleString("en-IN")}</h3>
            {myBets.find(b => b.choice === "TAIL") && (
              <div className="absolute inset-0 bg-yellow-400/5 flex items-center justify-center">
                 <div className="flex items-center gap-1 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter">
                   <TrendingUp size={8} /> YOUR BET ₹{myBets.find(b => b.choice === "TAIL")?.amount}
                 </div>
              </div>
            )}
          </div>
        </section>

        {/* SELECTION TILES */}
        <section className="grid grid-cols-2 gap-5 mb-10">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => !bettingLocked && setSelectedSide("HEAD")}
            className={`relative h-44 rounded-[40px] transition-all border-2 flex flex-col items-center justify-center overflow-hidden luxury-shadow ${
              selectedSide === "HEAD" ? "gold-gradient border-transparent shadow-[0_20px_40px_rgba(255,215,0,0.2)]" : "bg-white/5 border-white/5"
            } ${bettingLocked ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
          >
            <span className={`text-6xl font-black italic mb-2 ${selectedSide === "HEAD" ? "text-black" : "gold-text-gradient"}`}>H</span>
            <h2 className={`${selectedSide === "HEAD" ? "text-black" : "text-white"} text-lg font-black italic uppercase tracking-tighter`}>HEAD</h2>
            <p className={`${selectedSide === "HEAD" ? "text-black/60" : "text-zinc-600"} text-[9px] font-black mt-1 uppercase tracking-widest`}>2.0X Payout</p>
            {selectedSide === "HEAD" && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-black animate-ping" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => !bettingLocked && setSelectedSide("TAIL")}
            className={`relative h-44 rounded-[40px] transition-all border-2 flex flex-col items-center justify-center overflow-hidden luxury-shadow ${
              selectedSide === "TAIL" ? "gold-gradient border-transparent shadow-[0_20px_40px_rgba(255,215,0,0.2)]" : "bg-white/5 border-white/5"
            } ${bettingLocked ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
          >
            <span className={`text-6xl font-black italic mb-2 ${selectedSide === "TAIL" ? "text-black" : "gold-text-gradient"}`}>T</span>
            <h2 className={`${selectedSide === "TAIL" ? "text-black" : "text-white"} text-lg font-black italic uppercase tracking-tighter`}>TAIL</h2>
            <p className={`${selectedSide === "TAIL" ? "text-black/60" : "text-zinc-600"} text-[9px] font-black mt-1 uppercase tracking-widest`}>2.0X Payout</p>
            {selectedSide === "TAIL" && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-black animate-ping" />}
          </motion.button>
        </section>

        {/* LIVE BET STATUS / WIN-LOSS MESSAGE */}
        <AnimatePresence>
          {(myBets.length > 0 || roundResult) && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-6"
            >
              {roundResult ? (
                <div className={`rounded-[32px] p-6 border-2 luxury-shadow overflow-hidden relative ${
                  roundResult.win ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                }`}>
                   <div className="flex items-center justify-between relative z-10">
                      <div>
                         <h3 className={`text-2xl font-black italic uppercase leading-none ${roundResult.win ? "text-green-500" : "text-red-500"}`}>
                           {roundResult.win ? "✅ YOU WON" : "❌ YOU LOST"}
                         </h3>
                         <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mt-2">
                           Bet: {roundResult.side} | Amount: ₹{roundResult.amount || roundResult.amountLost}
                         </p>
                      </div>
                      {roundResult.win && (
                        <div className="text-right">
                           <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest leading-none mb-1">Payout</p>
                           <h4 className="text-green-500 font-black text-xl leading-none">₹{roundResult.payout}</h4>
                           <p className="text-zinc-600 text-[7px] font-black uppercase tracking-widest mt-1">Comm: ₹{roundResult.commission}</p>
                        </div>
                      )}
                   </div>
                </div>
              ) : (
                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-[32px] p-6 luxury-shadow relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 blur-[40px] rounded-full" />
                   <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-black">
                            <TrendingUp size={20} />
                         </div>
                         <div>
                            <h3 className="text-yellow-400 font-black text-sm uppercase tracking-widest">🟡 YOUR LIVE BET</h3>
                            <div className="flex gap-4 mt-1">
                               {myBets.map((bet, idx) => (
                                 <p key={idx} className="text-white text-[10px] font-black uppercase tracking-tighter">
                                   {bet.choice}: <span className="text-yellow-400">₹{bet.amount}</span>
                                 </p>
                               ))}
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest leading-none mb-1">Potential Payout</p>
                         <h4 className="text-white font-black text-lg leading-none">₹{totalPotentialReturn}</h4>
                      </div>
                   </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* BETTING CONTROL PANEL */}
        <section className="glass-card rounded-[48px] p-6 mb-10 luxury-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] font-black text-zinc-500 flex items-center gap-2 uppercase tracking-[3px]">
              <Coins size={14} className="text-yellow-400" /> Wager Console
            </h2>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
               <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Min: ₹5</span>
            </div>
          </div>
          
          {/* COMPACT INPUT */}
          <div className="relative mb-6 w-1/2 mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 font-black text-lg italic">₹</div>
            <input
              disabled={bettingLocked}
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-8 pr-4 py-3 outline-none text-white text-xl font-black placeholder:text-zinc-900 focus:border-yellow-400/30 transition-all disabled:opacity-50 tracking-tighter text-center"
            />
          </div>

          {/* PLACE BET */}
          <div className="flex justify-center mb-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handlePlaceBet}
              disabled={bettingLocked || loading}
              className={`w-1/2 py-4 rounded-[24px] font-black text-lg shadow-2xl transition-all disabled:opacity-20 disabled:grayscale relative overflow-hidden group ${
                bettingLocked ? 'bg-zinc-800 text-zinc-600 shadow-none' : 'gold-gradient text-black gold-shadow'
              }`}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative z-10 tracking-widest uppercase">
                {loading ? "..." : isActionLocked ? "..." : bettingLocked ? "CLOSED" : "PLACE BET"}
              </span>
            </motion.button>
          </div>

          <div className="flex justify-center gap-3">
            {[5, 10, 50, 100, 500].map((amount) => (
              <motion.button
                key={amount}
                whileTap={{ scale: 0.9 }}
                onClick={() => !bettingLocked && setBetAmount(amount.toString())}
                className={`py-4 px-6 rounded-xl flex items-center justify-center transition-all border text-[12px] font-black ${
                  betAmount === amount.toString() ? 'bg-yellow-400 text-black border-transparent' : 'bg-white/5 border-white/5 text-white'
                }`}
                disabled={bettingLocked}
              >
                ₹{amount}
              </motion.button>
            ))}
          </div>
        </section>

        {/* RECENT OUTCOMES LOG */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6 px-4">
            <h2 className="text-[10px] font-black text-zinc-600 tracking-[4px] uppercase flex items-center gap-2">
              <History size={14} className="text-zinc-700" /> Global Feed
            </h2>
            <button 
              onClick={() => router.push("/history")}
              className="text-[9px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-400/5 px-3 py-1.5 rounded-xl border border-yellow-400/10 active:scale-90"
            >
              Archived Logs
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
            {lastResults && Array.isArray(lastResults) && lastResults.map((item, index) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.05 }}
                key={index} 
                className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border-2 luxury-shadow transition-all ${
                  item.result === "HEAD" ? "gold-gradient border-transparent text-black" : "bg-white/5 border-white/5 text-zinc-500"
                }`}
              >
                {item.result === "HEAD" ? "H" : "T"}
              </motion.div>
            ))}
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="bg-white/5 border border-white/5 rounded-[32px] p-6 mb-12 flex items-center justify-between backdrop-blur-sm">
           <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                       <User size={14} className="text-zinc-600" />
                    </div>
                 ))}
              </div>
              <div>
                 <p className="text-white font-black text-[10px] uppercase leading-none">{mounted ? arenaActive : 0} Players</p>
                 <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mt-1">Live in Arena</p>
              </div>
           </div>
           <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
              <span className="text-green-500 text-[8px] font-black uppercase tracking-[2px] animate-pulse uppercase">Secure Connection</span>
           </div>
        </section>
      </div>
    </main>
  );
}
