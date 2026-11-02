import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Radio, 
  Cpu, 
  Sparkles, 
  AlertTriangle,
  Server,
  Activity,
  Layers,
  KeyRound,
  FileCheck2,
  Flame,
  Zap,
  Volume2,
  VolumeX,
  Headphones
} from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCopilot: () => void;
  threatLevel: "SAFE" | "ELEVATED" | "CRITICAL";
  emergencyLockdown: boolean;
  setEmergencyLockdown: (val: boolean | ((prev: boolean) => boolean)) => void;
  activeAttackCount: number;
  totalNodes: number;
  secureNodesCount: number;
  anomalyAlertCount?: number;
  isAudibleAlertEnabled?: boolean;
  isCurrentlySpeaking?: boolean;
  onOpenAudibleAlertModal?: () => void;
  onToggleAudibleMute?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openCopilot,
  threatLevel,
  emergencyLockdown,
  setEmergencyLockdown,
  activeAttackCount,
  totalNodes,
  secureNodesCount,
  anomalyAlertCount = 0,
  isAudibleAlertEnabled = true,
  isCurrentlySpeaking = false,
  onOpenAudibleAlertModal,
  onToggleAudibleMute
}) => {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta"
        }) + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "overview", label: "Dashboard SOC", icon: Activity },
    { id: "anomaly", label: "Deteksi Anomali (NDR/IDS)", icon: ShieldAlert, badge: anomalyAlertCount > 0 ? anomalyAlertCount : null },
    { id: "response", label: "Respons Otomatis (SOAR)", icon: Zap, badge: activeAttackCount > 0 ? "AUTO" : null },
    { id: "devices", label: "Perangkat IoT Fleet", icon: Server, badge: activeAttackCount > 0 ? activeAttackCount : null },
    { id: "crypto", label: "Kriptografi & Lab Enkripsi", icon: KeyRound },
    { id: "topology", label: "Topologi Jaringan Mesh", icon: Layers },
    { id: "simulator", label: "Simulasi Ancaman Siber", icon: Flame, isSpecial: true },
    { id: "compliance", label: "Audit & Kepatuhan BSSN", icon: FileCheck2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      {/* Top Banner / Platform Domain & Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/60 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE MESH TELEMETRY
          </div>
          <span className="text-slate-400 font-mono hidden sm:inline">
            Domain: <strong className="text-cyan-400 font-semibold">security.sematangborangcity.cloud</strong>
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 font-mono hidden md:inline">
            Infrastruktur Cerdas Kota Sematang Borang
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400 font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeStr}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Status Pertahanan:</span>
            {emergencyLockdown ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold tracking-wide animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                LOCKDOWN AKTIF
              </span>
            ) : threatLevel === "CRITICAL" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-400 font-semibold">
                <ShieldAlert className="w-3 h-3" />
                SIAGA KRITIS ({activeAttackCount} Ancaman)
              </span>
            ) : threatLevel === "ELEVATED" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-400 font-semibold">
                <ShieldAlert className="w-3 h-3" />
                WASPADA ANOMALI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                OPTIMAL (100% PQC)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-900/30 flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-50 tracking-tight">
                Sematang Borang <span className="text-cyan-400 font-mono font-medium">IoT Security Cloud</span>
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700/50 text-cyan-300 font-mono uppercase">
                PQC v4.2
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Sovereign Smart City SOC & Hardware Enclave Monitor</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">{secureNodesCount}/{totalNodes} Node Aman</span>
            </p>
          </div>
        </div>

        {/* Action Controls & AI Copilot Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Audible Alert System Controls */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700/80 p-0.5 shadow-sm">
            <button
              onClick={onToggleAudibleMute}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                isAudibleAlertEnabled
                  ? isCurrentlySpeaking
                    ? "bg-rose-950 text-rose-300 ring-1 ring-rose-500 animate-pulse"
                    : "bg-slate-800 text-cyan-300 hover:text-cyan-200"
                  : "bg-transparent text-slate-500 hover:text-slate-300"
              }`}
              title={isAudibleAlertEnabled ? "Peringatan Suara Aktif (Klik untuk Mute)" : "Peringatan Suara Dimatikan (Klik untuk Aktifkan)"}
            >
              {isAudibleAlertEnabled ? (
                <Volume2 className={`w-3.5 h-3.5 ${isCurrentlySpeaking ? "text-rose-400" : "text-cyan-400"}`} />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
            <button
              onClick={onOpenAudibleAlertModal}
              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 border-l border-slate-800 transition-all"
              title="Buka Pengaturan & Uji Siaran Suara Verbal"
            >
              <Headphones className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Voice Alert</span>
              {isCurrentlySpeaking ? (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              ) : (
                <span className={`w-1.5 h-1.5 rounded-full ${isAudibleAlertEnabled ? "bg-emerald-400" : "bg-slate-600"}`} />
              )}
            </button>
          </div>

          {/* Emergency Lockdown Toggle */}
          <button
            onClick={() => setEmergencyLockdown((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              emergencyLockdown
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/50 ring-2 ring-rose-400/50"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600"
            }`}
            title="Isolasi seluruh gateway dan aktifkan rotasi kunci darurat"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>{emergencyLockdown ? "Batalkan Lockdown" : "Protokol Lockdown"}</span>
          </button>

          {/* AI SOC Assistant Trigger */}
          <button
            onClick={openCopilot}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-cyan-950/50 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>AI SOC Copilot</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-900">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-cyan-400 text-cyan-300 bg-cyan-950/20 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
              <span>{item.label}</span>
              {item.badge !== null && item.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-bounce">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
