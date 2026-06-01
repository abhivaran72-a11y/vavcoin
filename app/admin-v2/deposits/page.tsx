"use client";

import { useEffect, useState } from "react";
import { Check, X, Eye, Loader2, Search, ExternalLink, ShieldAlert } from "lucide-react";
import { getAuthToken } from "@/lib/auth-client";

export default function DepositsManagement() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchDeposits = async () => {
    setLoading(true);
    setError(null);
    const token = getAuthToken();
    try {
      console.log("[ADMIN V2 DEPOSITS] Calling /api/admin-v2/deposits");
      const res = await fetch("/api/admin-v2/deposits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeposits(data.deposits);
      } else {
        setError(data.message || "Failed to fetch deposits");
      }
    } catch (e) {
      setError("Network error while fetching deposits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDeposits();
  }, []);

  if (!mounted) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div>;

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 p-10 bg-white border border-zinc-200 rounded-[4px]">
      <ShieldAlert className="text-red-500 mb-4" size={48} />
      <h2 className="text-xl font-bold mb-2">Deposits Loading Error</h2>
      <p className="text-zinc-500 mb-6 text-center">{error}</p>
      <button onClick={fetchDeposits} className="px-6 py-2 bg-black text-white rounded-[4px] font-bold text-xs uppercase tracking-widest">Retry Loading</button>
    </div>
  );

  const handleAction = async (depositId: string, status: string) => {
    const token = getAuthToken();
    console.log(`[ADMIN V2 DEPOSITS] Posting action ${status} to /api/admin-v2/deposits`);
    await fetch("/api/admin-v2/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ depositId, status }),
    });
    fetchDeposits();
  };

  const filtered = deposits.filter(d => (d.utr || "").includes(searchTerm) || d.userId?.mobile.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input 
            type="text"
            placeholder="Search by UTR or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-zinc-200 rounded-[4px] outline-none focus:border-black font-semibold text-sm transition-all"
          />
        </div>
        <button 
          onClick={fetchDeposits}
          className="h-10 px-6 bg-black text-white rounded-[4px] text-sm font-bold flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Refresh Deposits"}
        </button>
      </div>

      <div className="bg-white rounded-[4px] border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">User / Mobile</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Amount</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">UTR / Reference</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((d) => (
              <tr key={d._id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-black tabular-nums">{d.userId?.mobile}</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">UID: {d.userId?._id.slice(-8)}</p>
                </td>
                <td className="px-6 py-4 font-bold text-black text-sm tabular-nums">₹{d.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[10px] font-bold bg-zinc-100 px-2 py-0.5 rounded-[2px] text-zinc-600 tabular-nums">{d.utr}</p>
                    <button 
                      onClick={() => setSelectedImage(d.screenshot)}
                      className="p-1.5 bg-yellow-50 text-yellow-600 rounded-[2px] hover:bg-yellow-100 transition-colors border border-yellow-100"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-[2px] text-[9px] font-bold uppercase tracking-wider border ${
                    d.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-100" :
                    d.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" :
                    "bg-orange-50 text-orange-700 border-orange-100"
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {d.status === "PENDING" ? (
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleAction(d._id, "APPROVED")}
                        className="h-8 px-3 bg-black text-white rounded-[4px] text-[10px] font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => handleAction(d._id, "REJECTED")}
                        className="h-8 px-3 bg-white text-red-600 border border-red-200 rounded-[4px] text-[10px] font-bold flex items-center gap-1.5 transition-all hover:bg-red-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <p className="text-[9px] font-bold text-zinc-300 uppercase italic">Archived</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest bg-zinc-50/30">
            {loading ? <Loader2 className="animate-spin mx-auto h-5 w-5" /> : "No deposit requests found"}
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl w-full flex flex-col items-center">
            <img 
              src={selectedImage} 
              alt="Payment Proof" 
              className="max-h-[85vh] w-auto object-contain rounded-[4px] border border-white/20 shadow-2xl" 
            />
            <button 
              className="mt-6 px-6 py-2.5 bg-white text-black rounded-[4px] text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all"
              onClick={() => setSelectedImage(null)}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
