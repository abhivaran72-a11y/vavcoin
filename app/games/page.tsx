"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, History, User, Coins, ChevronRight, Gamepad2, Play, Users, Gift } from "lucide-react";
import { getAuthToken, isAuthenticated } from "@/lib/auth-client";

export default function GamesLobby() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const fetchUser = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setBalance(data.user.balance);
      }
    } catch (e) {}
  };

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      fetchUser();
    }
  }, []);

  const games = [
    {
      id: "head-tail",
      title: "Head & Tail",
      description: "Predict the outcome of a coin flip and win double.",
      image: "🪙",
      path: "/game/head-tail",
      color: "from-yellow-400 to-yellow-600",
      active: true
    },
    {
      id: "matka",
      title: "MATKA",
      description: "Pick a number from 1-5 and win 4x your bet.",
      image: "🏺",
      path: "/game/matka",
      color: "from-green-500 to-emerald-600",
      active: true
    },
    {
      id: "color-prediction",
      title: "Color Prediction",
      description: "Join the red, green or violet arena for high rewards.",
      image: "🎨",
      path: "#",
      color: "from-red-500 to-purple-600",
      active: false
    },
    {
      id: "dice",
      title: "Lucky Dice",
      description: "Roll the digital dice and aim for the winning numbers.",
      image: "🎲",
      path: "#",
      color: "from-blue-500 to-cyan-600",
      active: false
    }
  ];

  if (!mounted) return (
    <main className="min-h-screen bg-[#022c22] flex items-center justify-center">
       <div className="text-yellow-400 font-black italic text-2xl animate-pulse">VAV COIN</div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#022c22] text-white selection:bg-yellow-400 selection:text-black font-sans pb-10 relative isolate overflow-x-hidden">
      {/* BACKGROUND DECORATION - explicitly layered */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(241,213,146,0.15),transparent_50%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.1),transparent_40%)] pointer-events-none z-0" />

      {/* MOBILE APP HEADER */}
      <header className="px-6 py-6 border-b border-white/5 backdrop-blur-2xl sticky top-0 z-50 bg-black/40 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-xl rotate-3">
              <span className="text-black font-black text-xl italic">V</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic gold-text-gradient">VAV COIN</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/referral")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400"
            >
              <Users size={18} />
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/daily-reward")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400"
            >
              <Gift size={18} />
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

        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 luxury-shadow">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center text-black">
              <Coins size={14} />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Available Balance</span>
          </div>
          <span className="text-white font-black text-xl tracking-tighter italic">₹{balance.toLocaleString("en-IN")}</span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-lg mx-auto isolate px-4 md:px-6">
        <section className="pt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[12px] font-black uppercase tracking-[4px] text-zinc-500 flex items-center gap-2">
              <div className="w-1.5 h-6 gold-gradient rounded-full" /> Gaming Arenas
            </h3>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Server v4.2</span>
            </div>
          </div>

          <div className="grid gap-6">
            {games.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => game.active && router.push(game.path)}
                  disabled={!game.active}
                  className={`relative w-full glass-card rounded-3xl p-6 flex flex-col gap-6 text-left overflow-hidden group luxury-shadow ${!game.active ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl md:text-4xl shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500`}>
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative z-10 drop-shadow-2xl">{game.image}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic">{game.title}</h4>
                      <p className="text-zinc-500 text-[10px] font-bold leading-tight uppercase tracking-widest opacity-60 mt-1 line-clamp-1">{game.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between relative z-10 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-[#121212] bg-zinc-800 flex items-center justify-center">
                             <User size={10} className="text-zinc-500" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">{mounted ? (400 + Math.floor(Math.random() * 200)) : 500} Live</span>
                    </div>

                    <div className={`px-5 py-2.5 rounded-xl gold-gradient text-black text-[9px] md:text-[10px] font-black uppercase tracking-[2px] flex items-center gap-2 shadow-xl shadow-yellow-500/10 group-hover:bg-white transition-all ${!game.active ? 'bg-zinc-800 text-zinc-500' : ''}`}>
                      {game.active ? (
                        <>Enter Arena <ChevronRight size={14} /></>
                      ) : (
                        "Locked"
                      )}
                    </div>
                  </div>

                  {!game.active && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                       <div className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-[10px] font-black text-zinc-500 uppercase tracking-[2px]">Coming Soon</div>
                    </div>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="mt-12 px-8 text-center pb-12">
           <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[6px] italic">Verified Premium Gaming • Vav Coin Ecosystem</p>
        </footer>
      </div>
    </main>
  );
}
