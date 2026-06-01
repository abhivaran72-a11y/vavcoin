"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, Lock, ArrowRight, UserPlus, Loader2 } from "lucide-react";
import { setAuthToken, isAuthenticated } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async () => {
    console.log("STEP 1 CLICK");
    try {
      if (!mobile || !password) {
        alert("Please enter mobile and password");
        return;
      }

      console.log("STEP 2 VALIDATION PASSED");
      console.log("STEP 3 FETCH START");
      setLoading(true);
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile, password }),
      });

      console.log("STEP 4 FETCH RESPONSE", res.status);
      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      console.log("STEP 5 SUCCESS");
      setAuthToken(data.token);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      router.push("/games");
    } catch (error) {
      console.log("STEP 6 ERROR", error);
      alert("Something went wrong during login");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg aspect-square bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none z-0" />
        <div className="text-yellow-400 font-black italic text-2xl animate-pulse z-10">VAV COIN</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 1. STABLE BACKGROUND LAYER */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg aspect-square bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none z-0" />
      
      {/* 2. STABLE MAIN UI LAYER */}
      <div className="w-full max-w-md relative z-10">
        <div className="w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-tighter text-yellow-400 mb-2 italic uppercase">WELCOME BACK</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Access your VAV COIN account</p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full h-16 pl-14 pr-6 rounded-2xl bg-zinc-900 border border-white/5 outline-none text-white font-bold focus:border-yellow-400/50 transition-all"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-16 pl-14 pr-6 rounded-2xl bg-zinc-900 border border-white/5 outline-none text-white font-bold focus:border-yellow-400/50 transition-all"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-16 rounded-2xl bg-yellow-400 text-black font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>LOGIN TO SYSTEM <ArrowRight size={20} /></>
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => router.push("/register")}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
            >
              <UserPlus size={16} /> Don't have an account? <span className="text-yellow-400">Register</span>
            </button>
          </div>
        </div>
      </div>
      
      <p className="mt-10 text-zinc-800 text-[8px] font-black uppercase tracking-[4px] text-center relative z-10">VAV COIN SECURE ACCESS</p>
    </main>
  );
}
