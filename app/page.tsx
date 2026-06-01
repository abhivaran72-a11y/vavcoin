"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, Lock, ArrowRight, Loader2 } from "lucide-react";
import { setAuthToken } from "@/lib/auth-client";

export default function EntryPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async () => {
    if (!mobile || !password) {
      alert("Please enter both mobile and password");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile, password }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setAuthToken(data.token);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      router.push("/games");
    } catch (error) {
      alert("Something went wrong during login");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.05),transparent_50%)] pointer-events-none z-0" />
        <div className="text-yellow-400 font-black italic text-2xl animate-pulse z-10">VAV COIN</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 1. STABLE BACKGROUND DECORATION */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.05),transparent_50%)] pointer-events-none z-0" />
      
      {/* 2. STABLE UI LAYER - No motion.div or opacity-0 logic */}
      <div className="w-full max-w-sm z-10 relative">
        <div className="w-full">
          <div className="glass-card rounded-[40px] p-8 luxury-shadow relative">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black tracking-tighter gold-text-gradient mb-2 uppercase">LOGIN</h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Access your account</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" size={18} />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white/5 border border-white/5 outline-none text-white font-bold focus:border-yellow-400/30 transition-all placeholder:text-zinc-800"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white/5 border border-white/5 outline-none text-white font-bold focus:border-yellow-400/30 transition-all placeholder:text-zinc-800"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-16 rounded-2xl gold-gradient text-black font-black text-lg shadow-xl shadow-yellow-500/10 active:scale-95 transition-all flex items-center justify-center gap-3 mt-6"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>SIGN IN <ArrowRight size={20} /></>
                )}
              </button>
            </div>

            <div className="mt-8 flex items-center justify-between px-2">
              <button 
                onClick={() => router.push("/register")}
                className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider hover:text-yellow-400 transition-colors"
              >
                Create Account
              </button>
              <button className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider hover:text-yellow-400 transition-colors">
                Forgot Details?
              </button>
            </div>
          </div>
        </div>
        
        <p className="mt-10 text-zinc-800 text-[8px] font-black uppercase tracking-[4px] text-center">VAV COIN SECURE ACCESS</p>
      </div>
    </main>
  );
}
