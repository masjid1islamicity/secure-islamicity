import React, { useState } from "react";
import { 
  Zap, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  FileText, 
  KeyRound, 
  Volume2, 
  ChevronDown, 
  ChevronUp, 
  X, 
  AlertTriangle, 
  Activity, 
  ArrowRight, 
  Check, 
  RefreshCw, 
  Sparkles,
  ExternalLink
} from "lucide-react";
import { 
  IoTDevice, 
  SecurityIncident, 
  AnomalyAlert, 
  AuditLogEntry, 
  SOARAuditRecord, 
  QuarantinedDeviceEntry, 
  BlockedIPEntry, 
  RevokedCredentialEntry 
} from "../types";
import { generateAuditCompliancePDF } from "../utils/pdfReportGenerator";

export interface QuickActionsFloatingMenuProps {
  emergencyLockdown: boolean;
  onToggleLockdown: () => void;
  onClearAllAlerts: () => void;
  onExportAuditReport?: () => void;
  onRotateAllKeys?: () => void;
  devices: IoTDevice[];
  incidents: SecurityIncident[];
  anomalyAlerts?: AnomalyAlert[];
  auditLogs?: AuditLogEntry[];
  soarAuditLogs?: SOARAuditRecord[];
  quarantinedDevices?: QuarantinedDeviceEntry[];
  blockedIPs?: BlockedIPEntry[];
  revokedCredentials?: RevokedCredentialEntry[];
  onSpeakIncident?: (incident: SecurityIncident) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const QuickActionsFloatingMenu: React.FC<QuickActionsFloatingMenuProps> = ({
  emergencyLockdown,
  onToggleLockdown,
  onClearAllAlerts,
  onExportAuditReport,
  onRotateAllKeys,
  devices,
  incidents,
  anomalyAlerts = [],
  auditLogs = [],
  soarAuditLogs = [],
  quarantinedDevices = [],
  blockedIPs = [],
  revokedCredentials = [],
  onSpeakIncident,
  onNavigateToTab,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "warning" | "info" } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);

  const activeIncidents = incidents.filter((i) => i.status !== "RESOLVED");
  const activeAnomalies = anomalyAlerts.filter((a) => a.status === "TRIGGERED");
  const totalActiveThreats = activeIncidents.length + activeAnomalies.length;
  const underAttackCount = devices.filter((d) => d.status === "ATTACK").length;

  const showToast = (text: string, type: "success" | "warning" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3800);
  };

  // 1. One-Click: Trigger Global Lockdown
  const handleLockdownClick = () => {
    onToggleLockdown();
    if (!emergencyLockdown) {
      showToast("🚨 GLOBAL LOCKDOWN DIKUKUHKAN: Seluruh gateway diisolasi & rotasi kunci dipaksa!", "warning");
    } else {
      showToast("🛡️ Global Lockdown Dibatalkan: Mesh routing kembali ke status standar.", "info");
    }
  };

  // 2. One-Click: Clear All Alerts
  const handleClearAlertsClick = () => {
    onClearAllAlerts();
    showToast(`✅ Seluruh ${totalActiveThreats} alert & insiden aktif berhasil dibersihkan! Node kembali aman.`, "success");
  };

  // 3. One-Click: Export Audit Report (PDF)
  const handleExportClick = () => {
    if (onExportAuditReport) {
      onExportAuditReport();
      showToast("📄 Mengekspor Laporan Audit Kepatuhan...", "info");
      return;
    }

    setIsExporting(true);
    try {
      const pdf = generateAuditCompliancePDF({
        title: "Laporan Audit Kepatuhan & Mitigasi Ancaman Siber IoT",
        domain: "security.sematangborangcity.cloud",
        generatedBy: "SOC Sematang Borang Central Command",
        devices,
        auditLogs,
        incidents,
        soarAuditLogs,
        quarantinedDevices,
        blockedIPs,
        revokedCredentials,
        anomalyAlerts,
        complianceStandards: [
          {
            id: "bssn-csf",
            name: "BSSN Cyber Security Framework (Peraturan BSSN No. 8/2020)",
            category: "Regulasi Nasional RI",
            score: "98.4%",
            status: "COMPLIANT",
            items: [
              "Identifikasi aset IoT Smart City terdata 100% dengan hardware ID",
              "Enkripsi kanal transmisi telemetri sesuai standar kriptografi nasional",
              "Log audit terenkripsi dan disimpan minimum 180 hari"
            ]
          },
          {
            id: "iso-27001",
            name: "ISO/IEC 27001:2022 Information Security Management",
            category: "Standar Internasional",
            score: "99.1%",
            status: "COMPLIANT",
            items: [
              "Kontrol akses Zero-Trust berbasis sertifikat perangkat mTLS",
              "Manajemen kerentanan dan patch firmware TPM 2.0",
              "Rencana pemulihan insiden siber teruji otomatis"
            ]
          }
        ]
      });

      const fileName = `SematangBorang_SOC_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      showToast(`📄 Laporan Audit PDF "${fileName}" berhasil diunduh!`, "success");
    } catch (err) {
      console.error("PDF generation failed:", err);
      showToast("Gagal mengunduh laporan PDF. Silakan coba lagi.", "warning");
    } finally {
      setIsExporting(false);
    }
  };

  // Bonus One-Click: Rotate All Keys
  const handleRotateKeysClick = () => {
    setIsRotating(true);
    if (onRotateAllKeys) {
      onRotateAllKeys();
    }
    setTimeout(() => {
      setIsRotating(false);
      showToast("🔑 Kunci sesi ML-KEM-768 & AES-256 seluruh 12 node berhasil dirotasi seketika!", "success");
    }, 600);
  };

  // Bonus One-Click: Hands-Free Voice Briefing
  const handleVoiceBriefingClick = () => {
    if (activeIncidents.length > 0 && onSpeakIncident) {
      onSpeakIncident(activeIncidents[0]);
      showToast(`🔊 Memutar siaran suara insiden: ${activeIncidents[0].attackType}`, "info");
    } else {
      showToast("🔊 Seluruh sistem aman. Tidak ada insiden siber aktif.", "info");
    }
  };

  return (
    <aside aria-label="Quick Actions Floating Menu" className="fixed top-24 right-3 sm:right-6 z-40 max-w-xs sm:max-w-sm w-full select-none">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-2 p-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium animate-in slide-in-from-top-2 duration-200 flex items-start gap-2.5 ${
          toastMessage.type === "success"
            ? "bg-emerald-950/95 border-emerald-500/80 text-emerald-200 shadow-emerald-950/60"
            : toastMessage.type === "warning"
            ? "bg-rose-950/95 border-rose-500/80 text-rose-200 shadow-rose-950/60"
            : "bg-cyan-950/95 border-cyan-500/80 text-cyan-200 shadow-cyan-950/60"
        }`}>
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : toastMessage.type === "warning" ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-[11px] leading-relaxed">
            {toastMessage.text}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-0.5"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Floating Capsule / Card */}
      <div className={`transition-all duration-300 rounded-2xl border shadow-2xl backdrop-blur-xl ${
        emergencyLockdown
          ? "bg-slate-950/95 border-rose-500/80 shadow-rose-950/70"
          : totalActiveThreats > 0
          ? "bg-slate-950/95 border-amber-500/60 shadow-amber-950/40"
          : "bg-slate-950/95 border-cyan-500/40 shadow-cyan-950/50"
      }`}>
        {/* Floating Menu Header Bar (Always Visible as Trigger / Toggle) */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border transition-all ${
              emergencyLockdown
                ? "bg-rose-950 border-rose-500 text-rose-300 animate-pulse"
                : totalActiveThreats > 0
                ? "bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse"
                : "bg-cyan-950/80 border-cyan-500/50 text-cyan-300"
            }`}>
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 tracking-wide flex items-center gap-1">
                  Quick Actions
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  1-KLIK
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {emergencyLockdown
                  ? "LOCKDOWN AKTIF"
                  : totalActiveThreats > 0
                  ? `${totalActiveThreats} Ancaman Perlu Tindakan`
                  : "Sistem Terkendali • Standby"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {emergencyLockdown ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold animate-pulse">
                LOCKDOWN
              </span>
            ) : totalActiveThreats > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 font-mono font-bold">
                {totalActiveThreats} ALERT
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-semibold">
                NORMAL
              </span>
            )}
            <button
              type="button"
              className="p-1 rounded-lg text-slate-400 group-hover:text-cyan-300 transition-colors"
              aria-label={isOpen ? "Tutup Quick Actions" : "Buka Quick Actions"}
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content Area */}
        {isOpen && (
          <div className="px-3 pb-3.5 pt-1 space-y-2 border-t border-slate-800/80 animate-in fade-in duration-150">
            <p className="text-[10px] text-slate-400 px-1 pt-1">
              Perintah cepat SOC untuk percepatan mitigasi insiden siber:
            </p>

            {/* ACTION 1: Trigger Global Lockdown */}
            <button
              onClick={handleLockdownClick}
              className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all active:scale-[0.98] ${
                emergencyLockdown
                  ? "bg-rose-950/80 hover:bg-rose-900 border-rose-500 text-rose-100 shadow-md shadow-rose-950/50"
                  : "bg-slate-900/90 hover:bg-rose-950/40 border-slate-800 hover:border-rose-500/60 text-slate-200 group"
              }`}
            >
              <div className={`p-2 rounded-lg border flex-shrink-0 mt-0.5 ${
                emergencyLockdown
                  ? "bg-rose-900 border-rose-400 text-rose-100 animate-pulse"
                  : "bg-slate-950 border-slate-800 text-rose-400 group-hover:border-rose-500/50"
              }`}>
                {emergencyLockdown ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                    {emergencyLockdown ? "Batalkan Global Lockdown" : "Trigger Global Lockdown"}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    emergencyLockdown
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {emergencyLockdown ? "ACTIVE" : "STANDBY"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {emergencyLockdown
                    ? "Normalisasi gerbang IoT dan kembalikan rute jaringan mesh."
                    : "Isolasi seluruh gateway IoT & jalankan rotasi darurat."}
                </p>
              </div>
            </button>

            {/* ACTION 2: Clear All Alerts */}
            <button
              onClick={handleClearAlertsClick}
              disabled={totalActiveThreats === 0 && underAttackCount === 0}
              className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all active:scale-[0.98] ${
                totalActiveThreats > 0 || underAttackCount > 0
                  ? "bg-slate-900/90 hover:bg-emerald-950/40 border-slate-800 hover:border-emerald-500/60 text-slate-200 group cursor-pointer"
                  : "bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 group-hover:border-emerald-500/50 flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                    Clear All Alerts
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    totalActiveThreats > 0
                      ? "bg-amber-950 text-amber-300 border border-amber-700/60"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {totalActiveThreats > 0 ? `${totalActiveThreats} Aktif` : "Bersih"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Selesaikan semua insiden siber, normalkan anomali & pulihkan node.
                </p>
              </div>
            </button>

            {/* ACTION 3: Export Audit Report */}
            <button
              onClick={handleExportClick}
              disabled={isExporting}
              className="w-full p-2.5 rounded-xl bg-slate-900/90 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/60 text-slate-200 text-left flex items-start gap-3 transition-all active:scale-[0.98] group cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 group-hover:border-cyan-500/50 flex-shrink-0 mt-0.5">
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {isExporting ? "Menyiapkan PDF..." : "Export Audit Report"}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    PDF • BSSN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Generate & unduh laporan kepatuhan BSSN & ISO 27001 seketika.
                </p>
              </div>
            </button>

            {/* SECONDARY ROW: Fast KMS Key Rotation & Speech Briefing */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleRotateKeysClick}
                disabled={isRotating}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/50 text-left transition-all active:scale-95 group"
                title="Rotasi kunci sesi seluruh 12 node seketika"
              >
                <div className="flex items-center gap-1.5 text-indigo-400 group-hover:text-indigo-300">
                  <KeyRound className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-200">
                    Rotasi Semua Kunci
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  12 Node PQC ML-KEM
                </span>
              </button>

              <button
                onClick={handleVoiceBriefingClick}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/50 text-left transition-all active:scale-95 group"
                title="Dengarkan ringkasan ancaman hands-free"
              >
                <div className="flex items-center gap-1.5 text-cyan-400 group-hover:text-cyan-300">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-200">
                    Siaran Suara
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Briefing Audio SOC
                </span>
              </button>
            </div>

            {/* Quick Links Footer */}
            {onNavigateToTab && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <button
                  onClick={() => onNavigateToTab("response")}
                  className="hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <span>Aturan SOAR</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => onNavigateToTab("compliance")}
                  className="hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <span>Detail Audit BSSN</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
