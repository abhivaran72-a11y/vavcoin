"use client";

import { useEffect, useState } from "react";
import { Search, ShieldAlert, ShieldCheck, UserX, Eye, Edit3, Loader2 } from "lucide-react";
import { getAuthToken } from "@/lib/auth-client";

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const token = getAuthToken();
    try {
      console.log("[ADMIN V2 USERS] Calling /api/admin-v2/users");
      const res = await fetch("/api/admin-v2/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, []);

  if (!mounted) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div>;

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 p-10 bg-white border border-zinc-200 rounded-[4px]">
      <ShieldAlert className="text-red-500 mb-4" size={48} />
      <h2 className="text-xl font-bold mb-2">Users Loading Error</h2>
      <p className="text-zinc-500 mb-6 text-center">{error}</p>
      <button onClick={fetchUsers} className="px-6 py-2 bg-black text-white rounded-[4px] font-bold text-xs uppercase tracking-widest">Retry Loading</button>
    </div>
  );

  const toggleBlock = async (userId: string, isBlocked: boolean) => {
    const token = getAuthToken();
    console.log(`[ADMIN V2 USERS] Posting block update to /api/admin-v2/users`);
    await fetch("/api/admin-v2/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, isBlocked: !isBlocked }),
    });
    fetchUsers();
  };

  const filteredUsers = users.filter(u => u.mobile.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input 
            type="text"
            placeholder="Search by mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-zinc-200 rounded-[4px] outline-none focus:border-black font-semibold text-sm transition-all"
          />
        </div>
        <button 
          onClick={fetchUsers}
          className="h-10 px-6 bg-black text-white rounded-[4px] text-sm font-bold flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Refresh Users"}
        </button>
      </div>

      <div className="bg-white rounded-[4px] border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">User / Mobile</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Balance</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Stats (W/L)</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Joined Date</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredUsers.map((u) => (
              <tr key={u._id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 rounded-[4px] flex items-center justify-center font-bold text-[10px]">
                      {u.mobile.slice(-2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black tabular-nums">{u.mobile}</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">UID: {u._id.slice(-8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-black text-sm tabular-nums">₹{u.balance.toLocaleString()}</td>
                <td className="px-6 py-4">
                   <div className="flex gap-1.5">
                     <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-bold rounded-[2px] border border-green-100">W: {u.totalWin || 0}</span>
                     <span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-[9px] font-bold rounded-[2px] border border-red-100">L: {u.totalLoss || 0}</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-zinc-500 font-semibold text-xs tabular-nums">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => toggleBlock(u._id, u.isBlocked)}
                      className={`w-8 h-8 flex items-center justify-center rounded-[4px] transition-all border ${u.isBlocked ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-zinc-400 border-zinc-200 hover:bg-zinc-50 hover:text-black"}`}
                      title={u.isBlocked ? "Unblock User" : "Block User"}
                    >
                      {u.isBlocked ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                    </button>
                    <button className="w-8 h-8 bg-white text-zinc-400 border border-zinc-200 hover:bg-black hover:text-white flex items-center justify-center rounded-[4px] transition-all">
                      <Edit3 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest bg-zinc-50/30">
            {loading ? <Loader2 className="animate-spin mx-auto h-5 w-5" /> : "No system users found"}
          </div>
        )}
      </div>
    </div>
  );
}
