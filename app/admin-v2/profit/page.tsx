"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, TrendingDown, Landmark, PieChart, 
  ArrowUpRight, ArrowDownRight, BarChart3, 
  Calendar, RefreshCw 
} from "lucide-react";
import { getAuthToken } from "@/lib/auth-client";

export default function ProfitCenter() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    const token = getAuthToken();
    try {
      console.log("[ADMIN V2 PROFIT] Calling /api/admin-v2/stats");
      const res = await fetch("/api/admin-v2/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || "Failed to calculate revenue stats");
      }
    } catch (e) {
      setError("Network error while calculating profit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  if (!mounted) return null;

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full p-20 bg-white border border-zinc-200 rounded-[4px]">
      <TrendingDown className="text-red-500 mb-4" size={48} />
      <h2 className="text-xl font-bold mb-2">Revenue Analytics Error</h2>
      <p className="text-zinc-500 mb-6 text-center">{error}</p>
      <button onClick={fetchStats} className="px-6 py-2 bg-black text-white rounded-[4px] font-bold text-xs uppercase tracking-widest">Retry Calculation</button>
    </div>
  );

  if (!stats) return (
    <div className="flex items-center justify-center h-full p-20">
      <RefreshCw className="animate-spin h-8 w-8 text-black" />
    </div>
  );

  const profitCards = [
    { label: "Platform Collection", val: stats.totalPool || 0, icon: Landmark, desc: "Total amount wagered by users" },
    { label: "User Payouts", val: (stats.totalPool || 0) - (stats.lifetimeProfit || 0), icon: PieChart, desc: "Total amount won by users" },
    { label: "Net Profit", val: stats.lifetimeProfit || 0, icon: TrendingUp, desc: "Net revenue for the platform", highlight: true },
    { label: "Total Commission", val: stats.commissions?.lifetime || 0, icon: BarChart3, desc: "1% platform service fee" },
  ];

  const periodicProfit = [
    { label: "Today's Net Profit", val: stats.todayProfit || 0, trend: (stats.todayProfit || 0) >= 0 ? "up" : "down" },
    { label: "Weekly Net Profit", val: stats.weeklyProfit || 0, trend: (stats.weeklyProfit || 0) >= 0 ? "up" : "down" },
    { label: "Monthly Net Profit", val: stats.monthlyProfit || 0, trend: (stats.monthlyProfit || 0) >= 0 ? "up" : "down" },
  ];

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {profitCards.map(card => (
          <div key={card.label} className={`p-6 rounded-[4px] border border-zinc-200 shadow-sm ${card.highlight ? "bg-black text-white" : "bg-white text-black"}`}>
            <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center mb-4 ${card.highlight ? "bg-yellow-400 text-black" : "bg-zinc-100 text-zinc-600"}`}>
              <card.icon size={16} />
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${card.highlight ? "text-zinc-400" : "text-zinc-500"}`}>{card.label}</p>
            <h3 className="text-2xl font-bold mb-2 tabular-nums">₹{card.val.toLocaleString()}</h3>
            <p className={`text-[9px] font-semibold uppercase ${card.highlight ? "text-zinc-500" : "text-zinc-400"}`}>{card.desc}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-7 bg-white rounded-[4px] p-8 border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-bold text-black uppercase tracking-widest">Revenue Performance</h4>
            <Calendar className="text-zinc-300" size={20} />
          </div>
          <div className="space-y-6">
            {periodicProfit.map(item => (
              <div key={item.label} className="flex items-center justify-between border-b border-zinc-50 pb-6 last:border-0 last:pb-0">
                <div>
                  <p className="text-xs font-bold text-black">{item.label}</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Aggregate Profit</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-bold tabular-nums ${item.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                    ₹{item.val.toLocaleString()}
                  </span>
                  <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center border ${item.trend === "up" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                    {item.trend === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 bg-zinc-50 rounded-[4px] p-8 border border-zinc-200 shadow-sm">
           <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 pb-4">
             <div className="w-10 h-10 bg-black rounded-[4px] flex items-center justify-center text-white"><BarChart3 size={20} /></div>
             <h4 className="text-sm font-bold text-black uppercase tracking-widest">Commission<br/>Breakdown</h4>
           </div>
           <div className="space-y-4">
              {[
                { label: "Today", val: stats.commissions?.today || 0 },
                { label: "Weekly", val: stats.commissions?.weekly || 0 },
                { label: "Monthly", val: stats.commissions?.monthly || 0 },
                { label: "Lifetime", val: stats.commissions?.lifetime || 0 },
              ].map(row => (
                <div key={row.label} className="bg-white p-4 rounded-[4px] border border-zinc-200 flex items-center justify-between group hover:border-yellow-500 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{row.label}</span>
                  <span className="text-lg font-bold text-black tabular-nums">₹{row.val.toLocaleString()}</span>
                </div>
              ))}
           </div>
           <p className="mt-6 text-[8px] font-bold text-zinc-400 uppercase tracking-wider text-center">Service fee aggregated at 1% of winning pools.</p>
        </section>
      </div>
    </div>
  );
}
