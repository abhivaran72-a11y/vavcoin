"use client";

import { useEffect, useState } from "react";
import { Check, X, Loader2, Search, Wallet, Landmark, ShieldAlert } from "lucide-react";
import { getAuthToken } from "@/lib/auth-client";

export default function WithdrawalsManagement() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    const token = getAuthToken();
    try {
      console.log("[ADMIN V2 WITHDRAWALS] Calling /api/admin-v2/withdrawals");
      const res = await fetch("/api/admin-v2/withdrawals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
      } else {
        setError(data.message || "Failed to fetch withdrawals");
      }
    } catch (e) {
      setError("Network error while fetching withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchWithdrawals();
  }, []);

  if (!mounted) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div>;

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 p-10 bg-white border border-zinc-200 rounded-[4px]">
      <ShieldAlert className="text-red-500 mb-4" size={48} />
      <h2 className="text-xl font-bold mb-2">Withdrawals Loading Error</h2>
      <p className="text-zinc-500 mb-6 text-center">{error}</p>
      <button onClick={fetchWithdrawals} className="px-6 py-2 bg-black text-white rounded-[4px] font-bold text-xs uppercase tracking-widest">Retry Loading</button>
    </div>
  );

  const handleAction = async (withdrawalId: string, status: string) => {
    const token = getAuthToken();
    console.log(`[ADMIN V2 WITHDRAWALS] Posting action ${status} to /api/admin-v2/withdrawals`);
    await fetch("/api/admin-v2/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ withdrawalId, status }),
    });
    fetchWithdrawals();
  };

  const filtered = withdrawals.filter(w => (w.upiId || "").includes(searchTerm) || w.userId?.mobile.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input 
            type="text"
            placeholder="Search by UPI or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-zinc-200 rounded-[4px] outline-none focus:border-black font-semibold text-sm transition-all"
          />
        </div>
        <button 
          onClick={fetchWithdrawals}
          className="w-full sm:w-auto h-10 px-6 bg-black text-white rounded-[4px] text-sm font-bold flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Refresh Withdrawals"}
        </button>
      </div>

      <div className="bg-white rounded-[4px] border border-zinc-200 overflow-hidden shadow-sm">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">User / Mobile</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Withdrawal Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Payment Dest (UPI)</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((w) => (
                <tr key={w._id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-black tabular-nums">{w.userId?.mobile}</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">UID: {w.userId?._id.slice(-8)}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-red-600 text-sm tabular-nums">₹{w.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-100 text-zinc-500 rounded-[2px] flex items-center justify-center border border-zinc-200">
                        <Landmark size={12} />
                      </div>
                      <p className="font-bold text-black text-xs tabular-nums tracking-tight">{w.upiId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded-[2px] text-[9px] font-bold uppercase tracking-wider border ${
                      w.status === "PAID" ? "bg-green-50 text-green-700 border-green-100" :
                      w.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" :
                      w.status === "APPROVED" ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
                      "bg-orange-50 text-orange-700 border-orange-100"
                    }`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {w.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAction(w._id, "APPROVED")}
                          className="h-8 px-3 bg-black text-white rounded-[4px] text-[10px] font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleAction(w._id, "REJECTED")}
                          className="h-8 px-3 bg-white text-red-600 border border-red-200 rounded-[4px] text-[10px] font-bold flex items-center gap-1.5 transition-all hover:bg-red-50"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : w.status === "APPROVED" ? (
                      <button 
                        onClick={() => handleAction(w._id, "PAID")}
                        className="h-8 px-4 bg-yellow-400 hover:bg-yellow-500 text-black rounded-[4px] font-bold uppercase text-[9px] tracking-widest transition-all"
                      >
                        Complete Payout
                      </button>
                    ) : (
                      <p className="text-[9px] font-bold text-zinc-300 uppercase italic">Settled</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y divide-zinc-100">
          {filtered.map((w) => (
            <div key={w._id} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-black tabular-nums">{w.userId?.mobile}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">UID: {w.userId?._id.slice(-8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600 tabular-nums">₹{w.amount.toLocaleString()}</p>
                  <span className={`px-2 py-0.5 rounded-[2px] text-[8px] font-bold uppercase tracking-wider border ${
                    w.status === "PAID" ? "bg-green-50 text-green-700 border-green-100" :
                    w.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" :
                    w.status === "APPROVED" ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
                    "bg-orange-50 text-orange-700 border-orange-100"
                  }`}>
                    {w.status}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-[4px] border border-zinc-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-white text-zinc-500 rounded-[4px] flex items-center justify-center border border-zinc-200 shrink-0">
                  <Landmark size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">UPI ID</p>
                  <p className="font-bold text-black text-xs tabular-nums truncate">{w.upiId}</p>
                </div>
              </div>

              {w.status === "PENDING" ? (
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => handleAction(w._id, "APPROVED")}
                    className="flex-1 h-10 bg-black text-white rounded-[4px] text-[10px] font-bold flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <Check size={16} /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(w._id, "REJECTED")}
                    className="flex-1 h-10 bg-white text-red-600 border border-red-200 rounded-[4px] text-[10px] font-bold flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              ) : w.status === "APPROVED" ? (
                <button 
                  onClick={() => handleAction(w._id, "PAID")}
                  className="w-full h-10 bg-yellow-400 text-black rounded-[4px] font-bold uppercase text-[10px] tracking-widest"
                >
                  Complete Payout
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest bg-zinc-50/30">
            {loading ? <Loader2 className="animate-spin mx-auto h-5 w-5" /> : "No withdrawal requests found"}
          </div>
        )}
      </div>
    </div>
  );
}
