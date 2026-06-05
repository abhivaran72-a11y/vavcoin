"use client";

import { useEffect, useState } from "react";
import { Save, ShieldAlert, Percent, Coins, Loader2, QrCode, Upload, Image as ImageIcon, Gamepad2 } from "lucide-react";
import { getAuthToken } from "@/lib/auth-client";

export default function SettingsManagement() {
  const [settings, setSettings] = useState<any>({ minBet: 1, maxBet: 10000, commissionPercentage: 1 });
  const [matkaSettings, setMatkaSettings] = useState<any>({ minBet: 10, maxBet: 10000, timerSeconds: 45, commissionPercentage: 2 });
  const [depositConfig, setDepositConfig] = useState<any>({ upiId: "vavcoin@upi", qrImage: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingMatka, setSavingMatka] = useState(false);
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    const token = getAuthToken();
    try {
      console.log("[ADMIN V2 SETTINGS] Synchronizing all settings from /api/admin-v2/");
      const [resS, resM, resD] = await Promise.all([
        fetch("/api/admin-v2/settings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin-v2/matka-settings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin-v2/deposit-config", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const dataS = await resS.json();
      console.log("[SETTINGS LOAD RESPONSE] Standard Settings:", dataS);
      if (dataS.success) setSettings(dataS.settings);

      const dataM = await resM.json();
      console.log("[SETTINGS LOAD RESPONSE] Matka Settings:", dataM);
      if (dataM.success) setMatkaSettings(dataM.settings);

      const dataD = await resD.json();
      console.log("[SETTINGS LOAD RESPONSE] Deposit Config:", dataD);
      if (dataD.success) setDepositConfig(dataD.settings);

    } catch (e) {
      console.error("[SETTINGS LOAD ERROR]", e);
      setError("Failed to synchronize some settings. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, []);

  if (!mounted) return null;

  if (loading && !settings) return (
    <div className="flex flex-col items-center justify-center h-full p-20">
      <Loader2 className="animate-spin mb-4" size={32} />
      <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Loading configurations...</p>
    </div>
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getAuthToken();
    try {
      console.log("SETTINGS SAVE REQUEST (Standard)", settings);
      const res = await fetch("/api/admin-v2/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        console.log("SETTINGS SAVED SUCCESSFULLY (Standard)");
        alert("Platform configurations saved successfully!");
      }
      fetchSettings();
    } catch (e) {
      console.error("SAVE ERROR (Standard)", e);
    }
    setSaving(false);
  };

  const handleMatkaUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMatka(true);
    const token = getAuthToken();
    try {
      console.log("SETTINGS SAVE REQUEST (Matka)", matkaSettings);
      const res = await fetch("/api/admin-v2/matka-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(matkaSettings),
      });
      const data = await res.json();
      if (data.success) {
        console.log("SETTINGS SAVED SUCCESSFULLY (Matka)");
        alert("Matka configurations saved successfully!");
      }
      fetchSettings();
    } catch (e) {
      console.error("SAVE ERROR (Matka)", e);
    }
    setSavingMatka(false);
  };

  const handleDepositUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDeposit(true);
    const token = getAuthToken();
    try {
      console.log("SETTINGS SAVE REQUEST (Deposit)", depositConfig);
      const res = await fetch("/api/admin-v2/deposit-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(depositConfig),
      });
      const data = await res.json();
      if (data.success) {
        console.log("SETTINGS SAVED SUCCESSFULLY (Deposit)");
        alert("Deposit configuration updated!");
      }
      fetchSettings();
    } catch (e) {
      console.error("SAVE ERROR (Deposit)", e);
    }
    setSavingDeposit(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDepositConfig({ ...depositConfig, qrImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* DEPOSIT CONFIGURATION */}
      <form onSubmit={handleDepositUpdate} className="space-y-6">
        <section className="bg-white rounded-[4px] p-4 sm:p-6 border border-zinc-200 shadow-sm">
           <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2 mb-6">
             <QrCode className="text-purple-600" size={18} /> Deposit Configuration
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">Payment UPI ID</label>
                  <input 
                    type="text"
                    required
                    value={depositConfig.upiId}
                    onChange={(e) => setDepositConfig({ ...depositConfig, upiId: e.target.value })}
                    placeholder="example@upi"
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-[4px] outline-none focus:border-black font-bold text-sm text-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">QR Code Image</label>
                  <div className="relative group">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-32 border-2 border-dashed border-zinc-200 rounded-[4px] flex flex-col items-center justify-center gap-2 bg-zinc-50 group-hover:border-black transition-colors">
                       <Upload size={20} className="text-zinc-400" />
                       <span className="text-[10px] font-bold text-zinc-500 uppercase">Click to upload new QR</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border border-zinc-100 bg-zinc-50/50 rounded-[4px] p-4">
                 <p className="text-[9px] font-black text-zinc-400 uppercase mb-3">Live Preview</p>
                 {depositConfig.qrImage ? (
                   <img src={depositConfig.qrImage} alt="QR Preview" className="w-28 h-28 sm:w-32 sm:h-32 object-contain bg-white p-2 border border-zinc-200 rounded-[4px]" />
                 ) : (
                   <div className="w-28 h-28 sm:w-32 sm:h-32 bg-zinc-100 flex items-center justify-center rounded-[4px] text-zinc-300">
                     <ImageIcon size={32} />
                   </div>
                 )}
                 <p className="mt-3 text-[10px] font-bold text-black tabular-nums tracking-tight text-center break-all">{depositConfig.upiId || "No UPI ID set"}</p>
              </div>
           </div>

           <div className="mt-6 border-t border-zinc-100 pt-6">
              <button 
                type="submit"
                disabled={savingDeposit}
                className="w-full h-12 bg-black hover:bg-zinc-800 text-white rounded-[4px] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {savingDeposit ? <Loader2 className="animate-spin" size={16} /> : (
                  <>
                    <Save size={16} /> Update Deposit Settings
                  </>
                )}
              </button>
           </div>
        </section>
      </form>

      <form onSubmit={handleMatkaUpdate} className="space-y-6">
        <section className="bg-white rounded-[4px] p-6 sm:p-8 border border-zinc-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 hidden sm:block">
              <Gamepad2 size={100} className="text-emerald-500" />
           </div>

           <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
                  <Gamepad2 className="text-emerald-600" size={18} /> Matka Game Control
                </h3>
                <p className="text-zinc-400 font-semibold text-[10px] mt-0.5 uppercase tracking-tighter">Independent Game Configuration</p>
              </div>
              <button
                type="button"
                onClick={() => setMatkaSettings({ ...matkaSettings, maintenanceMode: !matkaSettings.maintenanceMode })}
                className={`w-12 h-6 rounded-[2px] p-0.5 transition-all duration-200 ${matkaSettings.maintenanceMode ? "bg-red-500" : "bg-emerald-500"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-[1px] shadow-sm transform transition-transform duration-200 ${matkaSettings.maintenanceMode ? "translate-x-6" : "translate-x-0"}`} />
              </button>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">Matka Min Bet (₹)</label>
                <input 
                  type="number"
                  value={matkaSettings.minBet}
                  onChange={(e) => setMatkaSettings({ ...matkaSettings, minBet: Number(e.target.value) })}
                  className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-[4px] outline-none focus:border-emerald-500 font-bold text-sm text-black tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">Matka Max Bet (₹)</label>
                <input 
                  type="number"
                  value={matkaSettings.maxBet}
                  onChange={(e) => setMatkaSettings({ ...matkaSettings, maxBet: Number(e.target.value) })}
                  className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-[4px] outline-none focus:border-emerald-500 font-bold text-sm text-black tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">Round Timer (Sec)</label>
                <input 
                  type="number"
                  value={matkaSettings.timerSeconds}
                  onChange={(e) => setMatkaSettings({ ...matkaSettings, timerSeconds: Number(e.target.value) })}
                  className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-[4px] outline-none focus:border-emerald-500 font-bold text-sm text-black tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">Matka Comm (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={matkaSettings.commissionPercentage}
                    onChange={(e) => setMatkaSettings({ ...matkaSettings, commissionPercentage: Number(e.target.value) })}
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-[4px] outline-none focus:border-emerald-500 font-bold text-sm text-black tabular-nums"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">%</div>
                </div>
              </div>
           </div>

           <button 
            type="submit"
            disabled={savingMatka}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {savingMatka ? <Loader2 className="animate-spin" size={16} /> : (
              <>
                <Save size={16} /> Save Matka Configuration
              </>
            )}
          </button>
        </section>
      </form>

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* MAINTENANCE MODE */}
        <section className="bg-white rounded-[4px] p-6 border border-zinc-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="text-red-500" size={18} /> Maintenance Control
                </h3>
                <p className="text-zinc-400 font-semibold text-[10px] mt-0.5 uppercase tracking-tighter">System Lockdown</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                className={`w-12 h-6 rounded-[2px] p-0.5 transition-all duration-200 ${settings.maintenanceMode ? "bg-red-500" : "bg-zinc-200"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-[1px] shadow-sm transform transition-transform duration-200 ${settings.maintenanceMode ? "translate-x-6" : "translate-x-0"}`} />
              </button>
           </div>
           <div className={`p-4 rounded-[4px] border ${settings.maintenanceMode ? "bg-red-50 border-red-100" : "bg-zinc-50 border-zinc-100"}`}>
              <p className={`text-xs font-bold ${settings.maintenanceMode ? "text-red-600" : "text-zinc-500"}`}>
                {settings.maintenanceMode 
                  ? "SYSTEM IS LOCKED. Public access to games and betting is disabled." 
                  : "SYSTEM IS OPERATIONAL. All public features are active."}
              </p>
           </div>
        </section>

        {/* BET CONFIGURATION */}
        <section className="bg-white rounded-[4px] p-6 border border-zinc-200 shadow-sm">
           <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2 mb-6">
             <Coins className="text-yellow-600" size={18} /> Bet Limits
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">Min Bet (₹)</label>
                <input 
                  type="number"
                  value={settings.minBet}
                  onChange={(e) => setSettings({ ...settings, minBet: Number(e.target.value) })}
                  className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-[4px] outline-none focus:border-black font-bold text-sm text-black"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">Max Bet (₹)</label>
                <input 
                  type="number"
                  value={settings.maxBet || 10000}
                  onChange={(e) => setSettings({ ...settings, maxBet: Number(e.target.value) })}
                  className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-[4px] outline-none focus:border-black font-bold text-sm text-black"
                />
              </div>
           </div>
        </section>

        {/* FINANCIALS */}
        <section className="bg-white rounded-[4px] p-6 border border-zinc-200 shadow-sm">
           <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2 mb-6">
             <Percent className="text-blue-600" size={18} /> Platform Fee
           </h3>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-0.5">Commission (%)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={settings.commissionPercentage || 1}
                  onChange={(e) => setSettings({ ...settings, commissionPercentage: Number(e.target.value) })}
                  className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-[4px] outline-none focus:border-black font-bold text-sm text-black"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">%</div>
              </div>
              <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-tighter mt-2 ml-0.5">This fee is deducted from user winnings before payout.</p>
           </div>
        </section>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={saving}
            className="w-full h-14 bg-black hover:bg-zinc-800 text-white rounded-[4px] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <Save size={18} /> Save Configurations
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
