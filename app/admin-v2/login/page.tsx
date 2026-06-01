"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAuthToken } from "@/lib/auth-client";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function AdminV2Login() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-v2/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthToken(data.token);
        router.push("/admin-v2");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[400px]">
        <div className="mb-10 text-center border-b border-zinc-100 pb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-[4px] mb-6">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black tracking-tight mb-1">Vavcoin Admin</h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Enterprise Control Center</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">Mobile Number</label>
            <input
              type="text"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-[4px] outline-none focus:border-black transition-all text-sm font-bold text-black"
              placeholder="9999999999"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">Access Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-[4px] outline-none focus:border-black transition-all text-sm font-bold text-black"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-[4px] text-red-600 text-[11px] font-bold text-center uppercase tracking-wider">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-black hover:bg-zinc-800 text-white rounded-[4px] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-zinc-100"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-10 text-center text-zinc-300 text-[9px] font-bold uppercase tracking-[0.2em]">
          Internal Management System
        </p>
      </div>
    </main>
  );
}
