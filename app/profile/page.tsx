"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, ShieldCheck, ChevronRight, 
  Coins, Wallet, History, ShieldAlert, Gamepad2, Trophy,
  LogOut, Settings, Loader2
} from "lucide-react";
import { getAuthToken, removeAuthToken, isAuthenticated } from "@/lib/auth-client";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
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
      fetchProfile();
    }
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  if (!mounted) return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center">
       <div className="text-yellow-400 font-black italic text-2xl animate-pulse">VAV COIN</div>
    </main>
  );

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-400 font-black tracking-tighter italic text-2xl animate-pulse">VAV COIN</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-yellow-400 selection:text-black font-sans pb-10 relative overflow-hidden isolate">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.1),transparent_40%)] pointer-events-none z-0" />
      
      <header className="px-6 py-8 border-b border-white/5 backdrop-blur-2xl sticky top-0 z-50 bg-black/40 relative">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-400/20">
                 <User className="text-black" size={28} />
              </div>
              <div>
                 <h1 className="text-2xl font-black italic tracking-tighter gold-text-gradient uppercase">Identity</h1>
                 <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[3px]">Verified Player</p>
              </div>
           </div>
           <button 
            onClick={handleLogout}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-red-500 active:scale-90 transition-all"
           >
              <LogOut size={20} />
           </button>
        </div>
      </header>

      <div className="relative z-10 px-6 pt-10 max-w-lg mx-auto isolate">
        
        {/* USER CARD */}
        <section className="mb-12">
          <div className="glass-card rounded-[48px] p-10 flex flex-col items-center text-center luxury-shadow relative overflow-hidden">
               <div className="absolute inset-0 bg-yellow-400/10 blur-3xl rounded-full" />
               <div className="w-20 h-20 rounded-full border-4 border-yellow-400 p-1 mb-6 relative z-10">
                  <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center">
                     <ShieldCheck className="text-yellow-400" size={32} />
                  </div>
               </div>
               <h2 className="text-3xl font-black italic text-white mb-2 tabular-nums">{user?.mobile}</h2>
               <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest relative z-10">
                  <Trophy size={12} /> Rank: Platinum
               </div>
          </div>
        </section>

        {/* STATS PREVIEW */}
        <section className="grid grid-cols-2 gap-4 mb-10">
           <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Total Payouts</p>
              <h3 className="text-white font-black text-xl italic">₹{user?.totalWin?.toLocaleString()}</h3>
           </div>
           <div className="bg-white/5 border border-white/5 rounded-3xl p-6 text-right">
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Wager Volume</p>
              <h3 className="text-zinc-400 font-black text-xl italic">₹{(user?.totalWin + user?.totalLoss)?.toLocaleString()}</h3>
           </div>
        </section>

        {/* NAV LIST */}
        <section className="space-y-4">
           <h3 className="text-zinc-700 text-[10px] font-black tracking-[5px] uppercase mb-6 px-4">Navigation</h3>
           <div className="glass-card rounded-[48px] p-8 luxury-shadow relative overflow-hidden">
              <div className="space-y-6">
                 {[
                   { label: "Gaming Lobby", icon: Gamepad2, path: "/games" },
                   { label: "Financial Desk", icon: Wallet, path: "/wallet" },
                   { label: "Transaction History", icon: History, path: "/history" },
                   { label: "Account Settings", icon: Settings, path: "#" },
                   { label: "Admin Access", icon: ShieldAlert, path: "/admin-v2", hidden: !user?.isAdmin },
                 ].filter(i => !i.hidden).map((item, index) => (
                   <button 
                    key={index}
                    onClick={() => item.path !== "#" && router.push(item.path)}
                    className="w-full flex items-center justify-between group"
                   >
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-yellow-400 transition-colors">
                            <item.icon size={20} />
                         </div>
                         <span className="text-sm font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">{item.label}</span>
                      </div>
                      <ChevronRight className="text-zinc-700 group-hover:text-yellow-400 transition-colors" size={18} />
                   </button>
                 ))}
              </div>
           </div>
        </section>

        <footer className="mt-20 text-center pb-12">
           <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[6px] italic">Vav Coin Network • Secure Profile</p>
           <p className="text-[8px] font-bold text-zinc-900 uppercase tracking-widest mt-2 opacity-40 italic">Encryption active</p>
        </footer>

      </div>
    </main>
  );
}
