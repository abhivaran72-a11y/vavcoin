"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, removeAuthToken, getAuthToken } from "@/lib/auth-client";
import { 
  LayoutDashboard, Users, CreditCard, Wallet, Settings, 
  Bell, LogOut, Menu, X, ShieldCheck, TrendingUp, Gamepad2,
  ChevronRight, Search, Clock, CheckCircle2, AlertCircle, Percent
} from "lucide-react";
import { useSocket } from "./SocketProvider";

export default function AdminV2Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [counts, setCounts] = useState({ deposits: 0, withdrawals: 0 });
  const { notifications, clearNotifications } = useSocket();

  const fetchCounts = async () => {
    const token = getAuthToken();
    try {
      console.log("[ADMIN V2 SHELL] Calling /api/admin-v2/stats");
      const res = await fetch("/api/admin-v2/stats", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setCounts({
          deposits: data.stats.pendingDeposits || 0,
          withdrawals: data.stats.pendingWithdrawals || 0
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/admin-v2/login");
    } else {
      fetchCounts();
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [router]);

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin-v2" },
    { label: "Users Management", icon: Users, href: "/admin-v2/users" },
    { label: "Deposits", icon: CreditCard, href: "/admin-v2/deposits", badge: counts.deposits },
    { label: "Withdrawals", icon: Wallet, href: "/admin-v2/withdrawals", badge: counts.withdrawals },
    { label: "Matka Management", icon: Gamepad2, href: "/admin-v2/matka" },
    { label: "Profit Center", icon: TrendingUp, href: "/admin-v2/profit" },
    { label: "System Settings", icon: Settings, href: "/admin-v2/settings" },
  ];

  const handleLogout = () => {
    removeAuthToken();
    router.push("/admin-v2/login");
  };

  if (!mounted) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-zinc-50 text-black font-sans flex overflow-hidden isolate">
      {/* SIDEBAR */}
      <aside className={`fixed lg:relative z-50 h-screen bg-white border-r border-zinc-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? "w-64" : "w-0 lg:w-16 overflow-hidden"}`}>
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-black rounded-[4px] flex items-center justify-center shrink-0">
               <ShieldCheck className="text-white" size={18} />
            </div>
            <span className={`font-bold text-lg tracking-tight ${!isSidebarOpen && "lg:hidden"}`}>VAVCOIN</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 no-scrollbar">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[4px] transition-colors group relative ${pathname === item.href ? "bg-zinc-100 text-black font-bold" : "text-zinc-500 hover:bg-zinc-50 hover:text-black"}`}
                >
                  <item.icon size={18} className={pathname === item.href ? "text-black" : "text-zinc-400 group-hover:text-black"} />
                  <span className={!isSidebarOpen ? "lg:hidden" : ""}>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-zinc-100">
           <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-red-500 hover:bg-red-50 transition-colors"
           >
            <LogOut size={18} />
            <span className={!isSidebarOpen ? "lg:hidden" : ""}>Sign Out</span>
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative isolate">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 relative z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-100 rounded-[4px] transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-bold text-sm uppercase tracking-widest text-zinc-400 hidden sm:block">
              {navItems.find(i => i.href === pathname)?.label || "Management"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
               <button className="p-2 hover:bg-zinc-100 rounded-[4px] transition-colors relative">
                  <Bell size={20} className="text-zinc-500" />
                  {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
               </button>
               
               {/* NOTIFICATION DROPDOWN */}
               <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 shadow-lg rounded-[4px] overflow-hidden z-50 hidden group-hover:block">
                  <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                     <span className="font-bold text-[10px] uppercase tracking-widest">Recent Activity</span>
                     <button onClick={clearNotifications} className="text-[10px] font-bold text-blue-600 hover:underline">Clear</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto no-scrollbar">
                     {notifications.length === 0 ? (
                       <p className="p-8 text-center text-zinc-400 text-[10px] font-bold uppercase italic">No new events</p>
                     ) : (
                       notifications.map((n, i) => (
                         <div key={i} className="p-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                            <p className="text-xs font-bold text-black mb-1">{n.message}</p>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase">{new Date(n.time).toLocaleTimeString()}</p>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>

            <div className="h-8 w-[1px] bg-zinc-200 mx-2 hidden sm:block" />

            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-black">Administrator</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Level 4 Clearance</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white font-black text-[10px]">
                  AD
               </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/30 p-6 lg:p-10 relative isolate">
          {children}
        </main>
      </div>
    </div>
  );
}
