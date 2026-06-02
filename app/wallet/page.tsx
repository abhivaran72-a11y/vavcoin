"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ArrowDownCircle, ArrowUpCircle, History, QrCode, CreditCard, Landmark, CheckCircle2, Clock, AlertCircle, Camera, Upload, Coins, User, Gamepad2, Copy, Check, Loader2 } from "lucide-react";
import { getAuthToken } from "@/lib/auth-client";

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<"DEPOSIT" | "WITHDRAW" | "HISTORY">("DEPOSIT");
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [depositConfig, setDepositConfig] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchBalance = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch("/api/user/balance", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setBalance(data.balance);
    } catch (e) {}
  };

  const fetchDepositConfig = async () => {
    setQrLoading(true);
    setQrError(false);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch("/api/admin-v2/deposit-config", { signal: controller.signal });
      const data = await res.json();
      if (data.success) {
        setDepositConfig(data.settings);
      } else {
        setQrError(true);
      }
    } catch (e) {
      setQrError(true);
    } finally {
      setQrLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const resD = await fetch("/api/wallet/deposit", { headers: { Authorization: `Bearer ${token}` } });
      const dataD = await resD.json();
      if (dataD.success) setDeposits(dataD.deposits);

      const resW = await fetch("/api/wallet/withdraw", { headers: { Authorization: `Bearer ${token}` } });
      const dataW = await resW.json();
      if (dataW.success) setWithdrawals(dataW.withdrawals);
    } catch (e) {}
  };

  useEffect(() => {
    setMounted(true);
    fetchBalance();
    fetchHistory();
    fetchDepositConfig();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("File too large (max 2MB)");
      const reader = new FileReader();
      reader.onloadend = () => setScreenshot(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDeposit = async () => {
    if (!amount || !utr || !screenshot) return alert("All fields (Amount, UTR, Screenshot) are required.");
    if (Number(amount) < 100) return alert("Minimum deposit ₹100");
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount), utr, screenshot }),
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setAmount("");
        setUtr("");
        setScreenshot("");
        fetchHistory();
      }
    } catch (e) {
      alert("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !upiId) return alert("Enter amount and UPI ID");
    if (Number(amount) < 100) return alert("Minimum withdrawal ₹100");
    if (Number(amount) > balance) return alert("Insufficient balance");
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount), upiId }),
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setAmount("");
        setUpiId("");
        fetchBalance();
        fetchHistory();
      }
    } catch (e) {
      alert("Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return (
    <main className="min-h-screen bg-[#022c22] flex items-center justify-center">
       <div className="text-yellow-400 font-black italic text-2xl animate-pulse">VAV COIN</div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#022c22] text-white selection:bg-yellow-400 selection:text-black overflow-hidden relative isolate">
      {/* Background layer - explicitly layered */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(241,213,146,0.15),transparent_50%)] pointer-events-none z-0" />

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2">
              <Check size={14} /> UPI ID Copied
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="px-6 py-6 border-b border-white/5 backdrop-blur-2xl sticky top-0 z-50 bg-black/40 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-xl rotate-3">
              <span className="text-black font-black text-xl italic">V</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic gold-text-gradient">WALLET</h1>
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

        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 luxury-shadow relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center text-black">
              <Coins size={14} />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Liquid Balance</span>
          </div>
          <span className="text-white font-black text-lg md:text-xl tracking-tighter italic">₹{balance.toLocaleString("en-IN")}</span>
        </div>
      </header>

      <div className="relative z-10 px-4 md:px-6 mt-6 h-[calc(100vh-220px)] overflow-y-auto no-scrollbar pb-12 isolate">
        <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/5 shadow-2xl sticky top-0 z-20">
          {["DEPOSIT", "WITHDRAW", "HISTORY"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3.5 rounded-xl text-[9px] md:text-[10px] font-black tracking-widest transition-all ${
                activeTab === tab ? "gold-gradient text-black gold-shadow" : "text-zinc-500 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8 md:mt-10 relative z-10">
          {activeTab === "DEPOSIT" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center space-y-8 md:space-y-10">
              {/* QR SECTION */}
              <div className="w-full max-w-[340px] flex flex-col items-center">
                <div className="aspect-square w-48 md:w-56 bg-white p-4 rounded-3xl mb-6 shadow-2xl relative flex items-center justify-center overflow-hidden">
                  {qrLoading ? (
                    <div className="flex flex-col items-center gap-2">
                       <Loader2 className="animate-spin text-black" size={32} />
                       <span className="text-[8px] font-black text-black uppercase tracking-widest">Loading QR...</span>
                    </div>
                  ) : qrError ? (
                    <div className="flex flex-col items-center gap-3 text-center px-4">
                       <AlertCircle className="text-red-500" size={32} />
                       <p className="text-[9px] font-black text-black uppercase leading-tight">Failed to load QR code</p>
                       <button 
                         onClick={fetchDepositConfig}
                         className="px-4 py-1.5 bg-black text-white rounded-lg text-[8px] font-black uppercase"
                       >
                         Retry
                       </button>
                    </div>
                  ) : (
                    <img 
                      src={depositConfig.qrImage} 
                      alt="Payment QR" 
                      className="w-full h-full object-contain"
                      onError={() => setQrError(true)}
                    />
                  )}
                </div>
                <div className="text-center space-y-3 w-full">
                  <p className="text-zinc-400 text-xs md:text-sm font-black tabular-nums tracking-tight bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 truncate">{depositConfig?.upiId || "---"}</p>
                  <button 
                    onClick={() => depositConfig?.upiId && copyToClipboard(depositConfig.upiId)}
                    className="flex items-center justify-center gap-2 bg-yellow-400 text-black px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-yellow-400/20 w-full"
                  >
                    <Copy size={14} /> Copy UPI ID
                  </button>
                </div>
              </div>

              {/* FORM SECTION */}
              <div className="w-full max-w-[320px] space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[3px] block text-center">Enter Amount</label>
                   <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-yellow-400 font-black text-xl italic">₹</span>
                     <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-4 md:py-5 outline-none text-white text-xl font-black placeholder:text-zinc-900 focus:border-yellow-400/30 transition-all text-center"
                    />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[3px] block text-center">UTR Reference</label>
                   <input
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="12-digit UTR"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 md:py-5 outline-none text-white text-lg font-black placeholder:text-zinc-900 focus:border-yellow-400/30 transition-all text-center"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[3px] block text-center">Upload Screenshot</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <div className="flex justify-center">
                    <label
                      htmlFor="screenshot-upload"
                      className="flex flex-col items-center justify-center w-32 h-32 md:w-36 md:h-36 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-yellow-400/30 transition-all overflow-hidden shadow-xl"
                    >
                      {screenshot ? (
                        <img src={screenshot} alt="Screenshot" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera size={28} className="text-zinc-700 mb-2" />
                          <span className="text-zinc-700 text-[8px] font-black uppercase tracking-widest">Select File</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleDeposit}
                    disabled={loading}
                    className="w-full gold-gradient text-black font-black py-4 md:py-5 rounded-xl text-lg gold-shadow active:scale-95 transition-all uppercase tracking-widest"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin mx-auto" size={24} />
                    ) : "SUBMIT DEPOSIT"}
                  </button>
                </div>
              </div>
              
              <div className="pb-10">
                <p className="text-zinc-600 text-[8px] text-center font-black uppercase tracking-[4px] leading-relaxed max-w-[280px]">
                  Funds will be credited after manual verification of UTR and screenshot.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "WITHDRAW" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 md:space-y-10">
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 md:p-8 flex gap-4 md:gap-6 items-start luxury-shadow backdrop-blur-sm">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                   <AlertCircle size={24} />
                </div>
                <div>
                   <h4 className="text-red-500 text-[10px] font-black uppercase tracking-[2px] mb-1.5 md:mb-2">Withdrawal Notice</h4>
                   <p className="text-red-200/40 text-[8px] md:text-[9px] font-black uppercase leading-relaxed tracking-widest">
                     Min ₹100. Verification in 24h. Check UPI ID carefully.
                   </p>
                </div>
              </div>

              <div className="space-y-6 px-2 flex flex-col items-center">
                <div className="space-y-2 w-full max-w-[320px]">
                   <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block text-center">Withdrawal Amount</label>
                   <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="₹ 0"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-8 py-5 md:py-6 outline-none text-white text-2xl md:text-3xl font-black placeholder:text-zinc-900 focus:border-yellow-400/30 transition-all shadow-xl text-center"
                  />
                </div>
                
                <div className="space-y-2 w-full max-w-[320px]">
                   <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block text-center">Your UPI ID</label>
                   <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="user@upi"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-8 py-5 md:py-6 outline-none text-white text-lg md:text-xl font-black placeholder:text-zinc-900 focus:border-yellow-400/30 transition-all shadow-xl text-center"
                  />
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full max-w-[320px] bg-white text-black font-black py-5 md:py-6 rounded-xl text-lg md:text-xl active:scale-95 transition-all shadow-2xl mt-6 uppercase tracking-widest"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mx-auto" size={24} />
                  ) : "REQUEST PAYOUT"}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "HISTORY" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 md:space-y-12 pb-10">
              <section>
                <h3 className="text-zinc-700 text-[10px] font-black tracking-[5px] uppercase mb-6 md:mb-8 px-4 flex items-center gap-3">
                   <div className="w-1.5 h-4 gold-gradient rounded-full" /> Deposits
                </h3>
                <div className="space-y-4 md:space-y-5">
                  {deposits.map((d) => (
                    <div key={d._id} className="glass-card rounded-2xl p-5 md:p-6 flex items-center justify-between luxury-shadow border-white/5">
                      <div className="flex items-center gap-4 md:gap-5">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-green-500/5 border border-green-500/10 flex items-center justify-center text-green-500">
                          <ArrowUpCircle size={28} />
                        </div>
                        <div>
                          <p className="text-white font-black text-lg md:text-xl tracking-tighter">₹{d.amount}</p>
                          <p className="text-zinc-600 text-[9px] font-mono mt-0.5 md:mt-1 uppercase opacity-60">UTR: {d.utr.slice(-8)}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 md:px-5 md:py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                        d.status === "APPROVED" ? "bg-green-500 text-black shadow-lg shadow-green-500/10" :
                        d.status === "REJECTED" ? "bg-red-500/20 text-red-500" :
                        "bg-white/5 text-zinc-600"
                      }`}>
                        {d.status}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-zinc-700 text-[10px] font-black tracking-[5px] uppercase mb-6 md:mb-8 px-4 flex items-center gap-3">
                   <div className="w-1.5 h-4 gold-gradient rounded-full" /> Withdrawals
                </h3>
                <div className="space-y-4 md:space-y-5">
                  {withdrawals.map((w) => (
                    <div key={w._id} className="glass-card rounded-2xl p-5 md:p-6 flex items-center justify-between luxury-shadow border-white/5">
                      <div className="flex items-center gap-4 md:gap-5">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500">
                          <ArrowDownCircle size={28} />
                        </div>
                        <div>
                          <p className="text-white font-black text-lg md:text-xl tracking-tighter">₹{w.amount}</p>
                          <p className="text-zinc-600 text-[9px] font-black mt-0.5 md:mt-1 uppercase tracking-widest opacity-60 truncate max-w-[100px] md:max-w-[120px]">{w.upiId}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 md:px-5 md:py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                        w.status === "PAID" ? "gold-gradient text-black gold-shadow" :
                        w.status === "APPROVED" ? "bg-green-500/10 text-green-500" :
                        w.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
                        "bg-white/5 text-zinc-600"
                      }`}>
                        {w.status}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
