"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, Users, CreditCard, Settings, Activity, Check, X, UserX, UserCheck, Edit3, Eye, Search, Landmark, Radio, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { getAuthToken } from "@/lib/auth-client";
import { io } from "socket.io-client";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"STATS" | "USERS" | "DEPOSITS" | "WITHDRAWALS" | "BETS" | "SETTINGS">("STATS");
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [liveRound, setLiveRound] = useState<any>(null);

  const fetchAll = async () => {
    const token = getAuthToken();
    try {
      const resU = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      const dataU = await resU.json();
      if (dataU.success) setUsers(dataU.users);

      const resD = await fetch("/api/admin/deposits", { headers: { Authorization: `Bearer ${token}` } });
      const dataD = await resD.json();
      if (dataD.success) setDeposits(dataD.deposits);

      const resW = await fetch("/api/admin/withdrawals", { headers: { Authorization: `Bearer ${token}` } });
      const dataW = await resW.json();
      if (dataW.success) setWithdrawals(dataW.withdrawals);

      const resB = await fetch("/api/admin/bets", { headers: { Authorization: `Bearer ${token}` } });
      const dataB = await resB.json();
      if (dataB.success) setBets(dataB.bets);

      const resS = await fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } });
      const dataS = await resS.json();
      if (dataS.success) setSettings(dataS.settings);
    } catch (e) {}
  };

  const fetchLiveRound = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch("/api/admin/round-stats", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setLiveRound(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchAll();
    const roundInterval = setInterval(fetchLiveRound, 1000);

    const socket = io();
    
    socket.on("NEW_USER", (user) => {
      setUsers(prev => [user, ...prev]);
    });

    socket.on("NEW_DEPOSIT", (deposit) => {
      setDeposits(prev => [deposit, ...prev]);
    });

    socket.on("DEPOSIT_STATUS_UPDATED", ({ depositId, status }) => {
      setDeposits(prev => prev.map(d => d._id === depositId ? { ...d, status } : d));
    });

    socket.on("NEW_WITHDRAWAL", (withdrawal) => {
      setWithdrawals(prev => [withdrawal, ...prev]);
    });

    socket.on("WITHDRAWAL_STATUS_UPDATED", ({ withdrawalId, status }) => {
      setWithdrawals(prev => prev.map(w => w._id === withdrawalId ? { ...w, status } : w));
    });

    socket.on("NEW_BET", ({ totalHeadAmount, totalTailAmount }) => {
      setLiveRound((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          round: {
            ...prev.round,
            totalHeadAmount,
            totalTailAmount
          }
        };
      });
    });

    return () => {
      clearInterval(roundInterval);
      socket.disconnect();
    };
  }, []);

  const handleUserUpdate = async (userId: string, update: any) => {
    const token = getAuthToken();
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, ...update }),
    });
    fetchAll();
  };

  const handleDepositAction = async (depositId: string, status: string) => {
    const token = getAuthToken();
    await fetch("/api/admin/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ depositId, status }),
    });
    fetchAll();
  };

  const handleWithdrawalAction = async (withdrawalId: string, status: string) => {
    const token = getAuthToken();
    await fetch("/api/admin/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ withdrawalId, status }),
    });
    fetchAll();
  };

  const handleSettingsUpdate = async (newSettings: any) => {
    const token = getAuthToken();
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newSettings),
    });
    fetchAll();
  };

  const filteredDeposits = deposits.filter(d => 
    d.utr.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.userId?.mobile.includes(searchTerm)
  );

  const filteredWithdrawals = withdrawals.filter(w => 
    w.upiId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.userId?.mobile.includes(searchTerm)
  );

  const totalDeposits = deposits.filter(d => d.status === "APPROVED").reduce((sum, d) => sum + d.amount, 0);
  const totalWithdrawals = withdrawals.filter(w => w.status === "PAID").reduce((sum, w) => sum + w.amount, 0);
  const totalProfit = totalDeposits - totalWithdrawals;

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-red-500 selection:text-white font-sans pb-24 relative">
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.05),transparent_50%)] pointer-events-none" />

      <header className="relative z-10 px-6 py-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm">
        <div>
          <h1 className="text-lg font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={20} /> ADMIN
          </h1>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={fetchAll}
          className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all"
        >
           <Activity size={18} className="text-red-500 animate-pulse" />
        </motion.button>
      </header>

      <div className="relative z-10 px-4 mt-6">
        <div className="grid grid-cols-3 gap-1 mb-6">
          {["STATS", "USERS", "DEPOSITS", "WITHDRAWALS", "BETS", "SETTINGS"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-2 py-3 text-[9px] font-bold tracking-wider transition-all border ${
                activeTab === tab ? "bg-red-600 border-red-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="h-[calc(100vh-180px)] overflow-y-auto no-scrollbar">
          {activeTab === "STATS" && (
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      LIVE ROUND
                    </h3>
                    <span className={`text-[12px] font-mono font-bold ${liveRound?.secondsLeft <= 5 ? "text-red-500" : "text-yellow-500"}`}>
                      00:{liveRound?.secondsLeft?.toString().padStart(2, "0")}
                    </span>
                 </div>
                 
                 {liveRound && (
                   <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-2">
                       <div className="bg-black p-4 border border-zinc-800">
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-1">HEAD</p>
                          <p className="text-sm font-bold">₹{liveRound.round.totalHeadAmount.toLocaleString("en-IN")}</p>
                       </div>
                       <div className="bg-black p-4 border border-zinc-800">
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-1">TAIL</p>
                          <p className="text-sm font-bold">₹{liveRound.round.totalTailAmount.toLocaleString("en-IN")}</p>
                       </div>
                     </div>
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                 {[
                    { label: "TOTAL USERS", val: users.length },
                    { label: "ACTIVE USERS", val: liveRound?.activeUsers || 0, color: "text-green-500" },
                    { label: "PROFIT", val: `₹${totalProfit.toLocaleString("en-IN")}`, color: totalProfit >= 0 ? "text-green-500" : "text-red-500" },
                    { label: "INFLOW", val: `₹${totalDeposits.toLocaleString("en-IN")}` },
                    { label: "OUTFLOW", val: `₹${totalWithdrawals.toLocaleString("en-IN")}` }
                 ].map(card => (
                   <div key={card.label} className="bg-zinc-900 border border-zinc-800 p-4">
                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-1">{card.label}</p>
                      <h2 className={`text-sm font-bold ${card.color || "text-white"}`}>{card.val}</h2>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === "USERS" && (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u._id} className="bg-zinc-900 border border-zinc-800 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-bold">{u.mobile}</p>
                    <p className="text-yellow-500 text-[10px] font-bold">BAL: ₹{u.balance.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUserUpdate(u._id, { isBlocked: !u.isBlocked })}
                      className={`px-3 py-2 text-[10px] font-bold ${u.isBlocked ? "bg-green-900 text-green-500" : "bg-red-900 text-red-500"}`}
                    >
                      {u.isBlocked ? "UNBLOCK" : "BLOCK"}
                    </button>
                    <button 
                       onClick={() => {
                         const amount = prompt("Enter new balance", u.balance);
                         if (amount) handleUserUpdate(u._id, { balance: Number(amount) });
                       }}
                       className="px-3 py-2 bg-blue-900 text-blue-500 text-[10px] font-bold"
                    >
                      EDIT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === "DEPOSITS" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="Search UTR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-3 outline-none text-[12px] font-bold placeholder:text-zinc-600"
                />
              </div>

              {filteredDeposits.map(d => (
                <div key={d._id} className="bg-zinc-900 border border-zinc-800 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-bold text-sm">₹{d.amount.toLocaleString("en-IN")}</p>
                      <p className="text-zinc-500 text-[9px] font-mono mt-1">UTR: {d.utr}</p>
                      <p className="text-zinc-500 text-[9px] font-mono">User: {d.userId?.mobile}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setSelectedScreenshot(d.screenshot)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                      >
                        <Eye size={16} />
                      </button>
                      {d.status === "PENDING" ? (
                        <>
                          <button onClick={() => handleDepositAction(d._id, "APPROVED")} className="p-2 bg-green-900 text-green-500"><Check size={16} /></button>
                          <button onClick={() => handleDepositAction(d._id, "REJECTED")} className="p-2 bg-red-900 text-red-500"><X size={16} /></button>
                        </>
                      ) : (
                        <span className={`px-2 py-1 text-[9px] font-bold ${
                          d.status === "APPROVED" ? "bg-green-900 text-green-500" : "bg-red-900 text-red-500"
                        }`}>{d.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "WITHDRAWALS" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="Search UPI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-3 outline-none text-[12px] font-bold placeholder:text-zinc-600"
                />
              </div>

              {filteredWithdrawals.map(w => (
                <div key={w._id} className="bg-zinc-900 border border-zinc-800 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-bold text-sm">₹{w.amount.toLocaleString("en-IN")}</p>
                      <p className="text-zinc-500 text-[9px] font-mono mt-1">UPI: {w.upiId}</p>
                      <p className="text-zinc-500 text-[9px] font-mono">User: {w.userId?.mobile}</p>
                    </div>
                    <div className="flex gap-1">
                      {w.status === "PENDING" ? (
                        <>
                          <button onClick={() => handleWithdrawalAction(w._id, "APPROVED")} className="p-2 bg-green-900 text-green-500"><Check size={16} /></button>
                          <button onClick={() => handleWithdrawalAction(w._id, "REJECTED")} className="p-2 bg-red-900 text-red-500"><X size={16} /></button>
                        </>
                      ) : w.status === "APPROVED" ? (
                        <button 
                          onClick={() => handleWithdrawalAction(w._id, "PAID")} 
                          className="px-3 py-1 bg-yellow-900 text-yellow-500 text-[9px] font-bold"
                        >
                          PAY
                        </button>
                      ) : (
                        <span className={`px-2 py-1 text-[9px] font-bold ${
                          w.status === "PAID" ? "bg-green-900 text-green-500" : "bg-red-900 text-red-500"
                        }`}>{w.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "BETS" && (
            <div className="space-y-2">
              {bets.map(b => (
                <div key={b._id} className="bg-zinc-900 border border-zinc-800 p-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-white text-[12px] font-bold">{b.userId?.mobile}</p>
                    <span className={`px-2 py-0.5 text-[8px] font-bold ${
                      b.status === "WIN" ? "bg-green-900 text-green-500" : b.status === "LOSS" ? "bg-red-900 text-red-500" : "bg-zinc-800 text-zinc-400"
                    }`}>{b.status}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-zinc-500 text-[10px]">Round: {b.roundId?.roundNumber}</p>
                      <p className="text-yellow-500 text-[10px] font-bold">{b.choice} - ₹{b.amount}</p>
                    </div>
                    {b.status === "WIN" && (
                      <p className="text-green-500 text-[10px] font-bold">+₹{b.winAmount.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "SETTINGS" && (
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Round Management</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => handleSettingsUpdate({ forcedResult: "HEAD" })}
                    className={`py-3 text-[10px] font-bold ${settings.forcedResult === "HEAD" ? "bg-yellow-600 text-black" : "bg-zinc-800 text-yellow-500"}`}
                  >
                    HEAD
                  </button>
                  <button 
                    onClick={() => handleSettingsUpdate({ forcedResult: "TAIL" })}
                    className={`py-3 text-[10px] font-bold ${settings.forcedResult === "TAIL" ? "bg-yellow-600 text-black" : "bg-zinc-800 text-yellow-500"}`}
                  >
                    TAIL
                  </button>
                  <button 
                    onClick={() => handleSettingsUpdate({ forcedResult: null })}
                    className={`py-3 text-[10px] font-bold ${!settings.forcedResult ? "bg-zinc-800 text-zinc-600" : "bg-red-900 text-white"}`}
                    disabled={!settings.forcedResult}
                  >
                    RESET
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6">
                 <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Configuration</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-bold">Maintenance</p>
                      <button 
                        onClick={() => handleSettingsUpdate({ maintenanceMode: !settings.maintenanceMode })}
                        className={`px-3 py-1 text-[10px] font-bold ${settings.maintenanceMode ? "bg-red-900 text-red-500" : "bg-zinc-800 text-zinc-500"}`}
                      >
                        {settings.maintenanceMode ? "ON" : "OFF"}
                      </button>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedScreenshot && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedScreenshot(null)}>
          <img src={selectedScreenshot} alt="Payment Proof" className="w-full max-h-[80vh] object-contain border border-zinc-800" />
        </div>
      )}
    </main>
  );
}
