import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Activity, 
  Lock, 
  Zap, 
  AlertOctagon, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles, 
  Wrench, 
  RefreshCw,
  Cpu,
  Layers,
  Radio,
  Eye,
  Server,
  Search,
  Filter,
  SlidersHorizontal,
  Clock,
  Wifi,
  Thermometer,
  FileText,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  Volume2
} from "lucide-react";
import { 
  IoTDevice, 
  SecurityIncident, 
  LiveTelemetryPacket, 
  EncryptionType, 
  AnomalyAlert,
  AuditLogEntry,
  SOARAuditRecord,
  QuarantinedDeviceEntry,
  BlockedIPEntry,
  RevokedCredentialEntry
} from "../types";
import { generateRandomHex } from "../utils/cryptoSim";
import { DashboardDrillDownModal, DrillDownData } from "./DashboardDrillDownModal";
import { ThreatForecastingChart } from "./ThreatForecastingChart";
import { NodeResourceUtilizationChart } from "./NodeResourceUtilizationChart";
import { ThreatCampaignsGroup } from "./ThreatCampaignsGroup";
import { CityZonesThreatHeatmap, ZoneData } from "./CityZonesThreatHeatmap";
import { QuickActionsFloatingMenu } from "./QuickActionsFloatingMenu";
import { generateAuditCompliancePDF } from "../utils/pdfReportGenerator";

interface DashboardOverviewProps {
  devices: IoTDevice[];
  incidents: SecurityIncident[];
  anomalyAlerts?: AnomalyAlert[];
  auditLogs?: AuditLogEntry[];
  soarAuditLogs?: SOARAuditRecord[];
  quarantinedDevices?: QuarantinedDeviceEntry[];
  blockedIPs?: BlockedIPEntry[];
  revokedCredentials?: RevokedCredentialEntry[];
  emergencyLockdown?: boolean;
  onToggleLockdown?: () => void;
  onClearAllAlerts?: () => void;
  onExportAuditReport?: () => void;
  onRotateAllKeys?: () => void;
  onOpenForensics: (incident: SecurityIncident) => void;
  onMitigateIncident: (incidentId: string) => void;
  onNavigateToTab: (tab: string) => void;
  onSelectDevice: (device: IoTDevice) => void;
  onSpeakIncident?: (incident: SecurityIncident) => void;
  onSpeakAnomaly?: (anomaly: AnomalyAlert) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  devices,
  incidents,
  anomalyAlerts = [],
  auditLogs = [],
  soarAuditLogs = [],
  quarantinedDevices = [],
  blockedIPs = [],
  revokedCredentials = [],
  emergencyLockdown,
  onToggleLockdown,
  onClearAllAlerts,
  onExportAuditReport,
  onRotateAllKeys,
  onOpenForensics,
  onMitigateIncident,
  onNavigateToTab,
  onSelectDevice,
  onSpeakIncident,
  onSpeakAnomaly,
}) => {
  // Global Filters & Search State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState<string>("LIVE");
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Drill-Down State
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);

  // Live Telemetry Packets State
  const [livePackets, setLivePackets] = useState<LiveTelemetryPacket[]>([]);
  const [throughputMbps, setThroughputMbps] = useState<number>(425.8);

  const totalNodes = devices.length;
  const attackNodes = devices.filter((d) => d.status === "ATTACK").length;
  const degradedNodes = devices.filter((d) => d.status === "DEGRADED").length;
  const secureNodes = devices.filter((d) => d.status === "SECURE").length;
  const isolatedNodes = devices.filter((d) => d.status === "ISOLATED").length;
  const pqcNodes = devices.filter((d) => d.encryption.includes("Kyber") || d.encryption.includes("Dilithium")).length;

  // 1. Total Active Threats (Real-Time from incidents)
  const activeIncidents = incidents.filter((i) => i.status !== "RESOLVED");
  const criticalActiveThreats = activeIncidents.filter((i) => i.severity === "CRITICAL").length;
  const highActiveThreats = activeIncidents.filter((i) => i.severity === "HIGH").length;
  const mediumActiveThreats = activeIncidents.filter((i) => i.severity === "MEDIUM" || i.severity === "LOW").length;
  const totalActiveThreatsCount = activeIncidents.length;

  // Emergency Lockdown & Quick Actions State Management
  const [internalLockdown, setInternalLockdown] = useState<boolean>(false);
  const isLockdownActive = emergencyLockdown !== undefined ? emergencyLockdown : internalLockdown;

  const handleToggleLockdown = () => {
    if (onToggleLockdown) {
      onToggleLockdown();
    } else {
      setInternalLockdown((prev) => !prev);
    }
  };

  const handleClearAllAlerts = () => {
    if (onClearAllAlerts) {
      onClearAllAlerts();
    } else {
      activeIncidents.forEach((i) => onMitigateIncident(i.id));
    }
  };

  const handleExportAuditReport = () => {
    if (onExportAuditReport) {
      onExportAuditReport();
    } else {
      try {
        const pdf = generateAuditCompliancePDF({
          title: "Laporan Audit Kepatuhan & Mitigasi Ancaman Siber IoT",
          domain: "security.sematangborangcity.cloud",
          generatedBy: "SOC Sematang Borang Command Center",
          devices,
          auditLogs: auditLogs || [],
          incidents,
          soarAuditLogs: soarAuditLogs || [],
          quarantinedDevices: quarantinedDevices || [],
          blockedIPs: blockedIPs || [],
          revokedCredentials: revokedCredentials || [],
          anomalyAlerts,
        });
        const fileName = `SematangBorang_SOC_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
        pdf.save(fileName);
      } catch (err) {
        console.error("PDF export failed:", err);
      }
    }
  };

  // 2. Security Posture Score (0 - 100%) calculated in real-time
  const pqcBonus = totalNodes > 0 ? (pqcNodes / totalNodes) * 12 : 12;
  const attackPenalty = attackNodes * 11;
  const degradedPenalty = degradedNodes * 3.5;
  const activeIncidentPenalty = activeIncidents.length * 4.5;
  const securityPostureScore = Math.max(
    0,
    Math.min(100, Number(((totalNodes > 0 ? (secureNodes / totalNodes) * 85 : 85) + pqcBonus - attackPenalty - degradedPenalty - activeIncidentPenalty).toFixed(1)))
  );
  const postureScore = securityPostureScore; // Sync with existing gauge

  // 3. Average Key Rotation Latency (Real-time in milliseconds across device fleet)
  const totalLatencySum = devices.reduce((sum, dev) => {
    let baseLat = 3.2;
    if (dev.encryption === "Kyber768-AES") baseLat = 4.15;
    else if (dev.encryption === "Dilithium3-ECDSA") baseLat = 6.42;
    else if (dev.encryption === "AES-256-GCM") baseLat = 2.15;
    else if (dev.encryption === "ChaCha20-Poly1305") baseLat = 1.78;
    else if (dev.encryption === "mTLS-1.3-Hardware") baseLat = 2.85;

    // Latency jitter under active attack or degradation
    if (dev.status === "ATTACK") baseLat += 2.65;
    else if (dev.status === "DEGRADED") baseLat += 1.15;

    return sum + baseLat;
  }, 0);
  const avgKeyRotationLatency = devices.length > 0 ? Number((totalLatencySum / devices.length).toFixed(2)) : 3.25;

  // 4. System Health Percentage (0 - 100%) calculated from operational device states
  const totalHealthPoints = devices.reduce((acc, dev) => {
    if (dev.status === "SECURE") return acc + 100;
    if (dev.status === "DEGRADED") return acc + 65;
    if (dev.status === "ISOLATED") return acc + 40;
    if (dev.status === "ATTACK") return acc + 15;
    return acc + 80;
  }, 0);
  const systemHealthPercentage = devices.length > 0 ? Number((totalHealthPoints / devices.length).toFixed(1)) : 100;

  // Filter Devices
  const filteredDevices = devices.filter((dev) => {
    const matchesSearch = 
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.ip.includes(searchTerm) ||
      dev.encryption.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.zone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "ALL" || dev.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || dev.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Simulated live telemetry stream
  useEffect(() => {
    if (isStreamPaused) return;

    const interval = setInterval(() => {
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      if (!randomDevice) return;

      const isAnomaly = randomDevice.status === "ATTACK";
      const newPacket: LiveTelemetryPacket = {
        id: `PKT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
        timestamp: new Date().toLocaleTimeString("id-ID"),
        sourceNodeId: randomDevice.id,
        sourceNodeName: randomDevice.name,
        destination: "SB-GW-01 [Core Gateway]",
        algorithm: randomDevice.encryption,
        plaintextSize: Math.floor(Math.random() * 800) + 120,
        ivHex: generateRandomHex(12),
        ciphertextHex: generateRandomHex(24) + "...",
        authTagHex: generateRandomHex(16),
        entropyScore: isAnomaly ? 5.2 : Number((7.85 + Math.random() * 0.14).toFixed(3)),
        integrityVerified: !isAnomaly,
        tampered: isAnomaly,
      };

      setLivePackets((prev) => [newPacket, ...prev.slice(0, 6)]);
      setThroughputMbps((prev) => Number((415 + Math.random() * 22).toFixed(1)));
    }, 1800);

    return () => clearInterval(interval);
  }, [devices, isStreamPaused]);

  // Handle Manual Refresh
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setThroughputMbps(Number((420 + Math.random() * 15).toFixed(1)));
    }, 600);
  };

  // Helper for Encryption Tier Data
  const getEncryptionTierData = (tier: number) => {
    if (tier === 4) {
      return {
        tierName: "Tingkat 4: Post-Quantum Hybrid (ML-KEM-768 + AES-256-GCM)",
        algorithm: "Kyber768-AES" as EncryptionType,
        standard: "NIST FIPS 203 / FIPS 197",
        securityRating: 99,
        quantumResistant: true,
        assignedDevices: devices.filter((d) => d.encryption === "Kyber768-AES"),
        description: "Enkripsi paling mutakhir dengan perlindungan kuantum ganda. Pertukaran kunci berbasis kisi (lattice) ML-KEM-768 dan transfer data AES-256-GCM dengan hardware acceleration. Diterapkan pada Core Gateway dan sistem SCADA pengendali banjir.",
      };
    } else if (tier === 3) {
      return {
        tierName: "Tingkat 3: Post-Quantum Digital Signature (ML-DSA Dilithium-3)",
        algorithm: "Dilithium3-ECDSA" as EncryptionType,
        standard: "NIST FIPS 204",
        securityRating: 98,
        quantumResistant: true,
        assignedDevices: devices.filter((d) => d.encryption === "Dilithium3-ECDSA"),
        description: "Tanda tangan digital pasca-kuantum dengan validasi hardware TPM 2.0. Menjamin integritas pembaruan firmware OTA dan transmisi sinyal sirine evakuasi darurat tanpa risiko pemalsuan.",
      };
    } else if (tier === 2) {
      return {
        tierName: "Tingkat 2: Hardware-Accelerated AEAD (AES-256-GCM)",
        algorithm: "AES-256-GCM" as EncryptionType,
        standard: "NIST SP 800-38D",
        securityRating: 96,
        quantumResistant: true,
        assignedDevices: devices.filter((d) => d.encryption === "AES-256-GCM"),
        description: "Standar industri militer untuk transmisi data berkecepatan tinggi dengan throughput mencapai > 4 GB/s. Diterapkan pada kamera CCTV Edge AI dan sensor radar lalu lintas.",
      };
    } else {
      return {
        tierName: "Tingkat 1: Lightweight Edge AEAD (ChaCha20-Poly1305 / mTLS 1.3)",
        algorithm: "ChaCha20-Poly1305" as EncryptionType,
        standard: "RFC 8439",
        securityRating: 95,
        quantumResistant: true,
        assignedDevices: devices.filter((d) => d.encryption === "ChaCha20-Poly1305" || d.encryption === "mTLS-1.3-Hardware"),
        description: "Cipher stream ringan dengan autentikasi Poly1305 yang dioptimalkan untuk mikrokontroler berdaya rendah, sensor bertenaga baterai/solar, dan stasiun cuaca lingkungan.",
      };
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* SECTION: Quick Actions Floating Menu in Top-Right of Dashboard */}
      <QuickActionsFloatingMenu
        emergencyLockdown={isLockdownActive}
        onToggleLockdown={handleToggleLockdown}
        onClearAllAlerts={handleClearAllAlerts}
        onExportAuditReport={handleExportAuditReport}
        onRotateAllKeys={onRotateAllKeys}
        devices={devices}
        incidents={incidents}
        anomalyAlerts={anomalyAlerts}
        auditLogs={auditLogs}
        soarAuditLogs={soarAuditLogs}
        quarantinedDevices={quarantinedDevices}
        blockedIPs={blockedIPs}
        revokedCredentials={revokedCredentials}
        onSpeakIncident={onSpeakIncident}
        onNavigateToTab={onNavigateToTab}
      />

      {/* Central Command Header & Real-Time Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Title & Platform Health Gauge */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-950 to-slate-950 border border-cyan-500/40 flex flex-col items-center justify-center text-center shadow-lg shadow-cyan-950/40">
                <span className="text-xs font-mono font-bold text-cyan-300">{postureScore}%</span>
                <span className="text-[9px] text-slate-400 font-medium">HEALTH</span>
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold">
                  SOC CENTRAL COMMAND
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  security.sematangborangcity.cloud
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-100 mt-0.5 flex items-center gap-2">
                Pusat Komando Keamanan IoT & Kriptografi Kuantum
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring terpadu 12 node kritis, mitigasi otomatis SOAR, dan enkripsi AEAD NIST FIPS 203/204
              </p>
            </div>
          </div>

          {/* Time Horizon Selector & Live Controls */}
          <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-center">
            {/* Time Range Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setTimeRange("LIVE")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  timeRange === "LIVE"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                <span>Live (30s)</span>
              </button>
              <button
                onClick={() => setTimeRange("1H")}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  timeRange === "1H"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                1 Jam
              </button>
              <button
                onClick={() => setTimeRange("24H")}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  timeRange === "24H"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                24 Jam
              </button>
              <button
                onClick={() => setTimeRange("7D")}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  timeRange === "7D"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                7 Hari
              </button>
            </div>

            {/* Live Stream Pause/Play Toggle */}
            <button
              onClick={() => setIsStreamPaused(!isStreamPaused)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isStreamPaused
                  ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                  : "bg-slate-950 border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40"
              }`}
              title={isStreamPaused ? "Lanjutkan Stream Telemetri" : "Jeda Stream Telemetri"}
            >
              {isStreamPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* Manual Sync Button */}
            <button
              onClick={handleManualRefresh}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Sinkronisasi Seluruh Node"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            {/* Quick Actions Fast Button */}
            <button
              onClick={() => {
                const asideEl = document.querySelector('aside[aria-label="Quick Actions Floating Menu"]');
                if (asideEl) {
                  asideEl.classList.add("ring-2", "ring-cyan-400", "scale-105");
                  setTimeout(() => {
                    asideEl.classList.remove("ring-2", "ring-cyan-400", "scale-105");
                  }, 800);
                }
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isLockdownActive
                  ? "bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse"
                  : totalActiveThreatsCount > 0
                  ? "bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900/60"
                  : "bg-cyan-950/80 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60"
              }`}
              title="Menu Quick Actions Melayang di Kanan Atas"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Quick Actions</span>
              {totalActiveThreatsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-bold font-mono">
                  {totalActiveThreatsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Search & Sector Filter Ribbon */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Node, Wilayah, IP, Algoritma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sector Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                categoryFilter === "ALL"
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Semua Sektor ({devices.length})
            </button>
            <button
              onClick={() => setCategoryFilter("TRAFFIC")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                categoryFilter === "TRAFFIC"
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Lalu Lintas
            </button>
            <button
              onClick={() => setCategoryFilter("GRID")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                categoryFilter === "GRID"
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Smart Grid
            </button>
            <button
              onClick={() => setCategoryFilter("WATER_FLOOD")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                categoryFilter === "WATER_FLOOD"
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Pintu Air Banjir
            </button>
            <button
              onClick={() => setCategoryFilter("CCTV")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                categoryFilter === "CCTV"
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              CCTV AI
            </button>
          </div>
        </div>
      </div>

      {/* Top Threat Alert Banner if Active Attack */}
      {activeIncidents.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/90 via-rose-900/60 to-slate-900 border border-rose-600/60 rounded-2xl p-4 shadow-lg shadow-rose-950/40 text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-900/80 border border-rose-500 text-rose-300 animate-pulse flex-shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                  SIAGA 1 SIBER
                </span>
                <h2 className="text-sm font-bold text-rose-200">
                  {activeIncidents.length} Insiden Keamanan IoT Aktif Terdeteksi di Sematang Borang
                </h2>
              </div>
              <p className="text-xs text-rose-300/90 mt-1 max-w-3xl leading-relaxed">
                {activeIncidents[0].deviceName}: {activeIncidents[0].description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
            <button
              onClick={() => {
                setDrillDownData({
                  type: "THREAT",
                  title: `Drill-Down Ancaman: ${activeIncidents[0].attackType}`,
                  subtitle: `Target: ${activeIncidents[0].deviceName} (${activeIncidents[0].deviceId})`,
                  threat: activeIncidents[0],
                });
              }}
              className="flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Detail</span>
            </button>
            {onSpeakIncident && (
              <button
                onClick={() => onSpeakIncident(activeIncidents[0])}
                className="flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                title="Dengarkan Ringkasan Suara Verbal Hands-Free"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dengarkan Suara</span>
              </button>
            )}
            <button
              onClick={() => onOpenForensics(activeIncidents[0])}
              className="flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-semibold bg-rose-800 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Analisis AI</span>
            </button>
            <button
              onClick={() => onMitigateIncident(activeIncidents[0].id)}
              className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Mitigasi Seketika</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Anomaly Detection Status Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100">
                Sistem Deteksi Anomali 3-Pilar (NDR/IDS Real-Time):
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-semibold border border-emerald-800/60">
                SENSOR AKTIF
              </span>
            </div>
            <p className="text-slate-400 mt-0.5 text-[11px]">
              Memantau deviasi trafik paket (Z &gt; 2.8σ), integritas log kernel/TPM 2.0, dan pola kueri API luar jam kerja.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="font-mono text-slate-400 text-[11px]">
            {anomalyAlerts.filter((a) => a.status === "TRIGGERED").length} Anomali Aktif
          </span>
          <button
            onClick={() => onNavigateToTab("anomaly")}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow transition-all active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Buka Konsol Anomali</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* SECTION 1: TOP-LEVEL STATISTICS DASHBOARD */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Top-Level Statistics Dashboard
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono font-semibold">
              Live Fleet Telemetry
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Pembaruan metrik eksekutif terintegrasi per 1.5 detik
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric Card 1: Total Active Threats */}
          <div
            onClick={() => {
              if (activeIncidents.length > 0) {
                setDrillDownData({
                  type: "THREAT",
                  title: `Drill-Down Ancaman Aktif (${activeIncidents.length} Insiden)`,
                  subtitle: `Ancaman Tertinggi: ${activeIncidents[0].attackType} pada ${activeIncidents[0].deviceName}`,
                  threat: activeIncidents[0],
                });
              } else {
                setDrillDownData({
                  type: "METRIC_THREATS",
                  title: "Status Ancaman Siber & Mitigasi SOAR Real-Time",
                  subtitle: "0 Ancaman Aktif • Seluruh perimeter eBPF dalam status aman",
                });
              }
            }}
            className={`border rounded-2xl p-4 shadow-sm transition-all cursor-pointer group select-none ${
              totalActiveThreatsCount > 0
                ? "bg-rose-950/20 border-rose-500/60 hover:border-rose-400 hover:bg-rose-950/30"
                : "bg-slate-900/80 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 group-hover:text-rose-300 transition-colors">
                Total Active Threats
              </span>
              <div className={`p-1.5 rounded-lg border transition-colors ${
                totalActiveThreatsCount > 0
                  ? "bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse"
                  : "bg-emerald-950/80 border-emerald-500/30 text-emerald-400"
              }`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${
                totalActiveThreatsCount > 0 ? "text-rose-200" : "text-emerald-300"
              }`}>
                {totalActiveThreatsCount}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                totalActiveThreatsCount > 0
                  ? "bg-rose-900 text-rose-200 border border-rose-600"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
              }`}>
                {totalActiveThreatsCount > 0
                  ? `${criticalActiveThreats} Kritis • ${highActiveThreats} Tinggi`
                  : "0 Ancaman • Normal"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{attackNodes} node terdampak</span>
              <span className="font-mono text-slate-300">{incidents.length} riwayat log</span>
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-rose-400 font-medium">
              <span>{totalActiveThreatsCount > 0 ? "Buka Investigasi Ancaman" : "Log SOC Bersih"}</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Metric Card 2: Security Posture Score */}
          <div
            onClick={() => {
              setDrillDownData({
                type: "METRIC_PQC",
                title: "Analisis Skor Postur Keamanan (Security Posture)",
                subtitle: "Standarisasi NIST FIPS 203/204 & Kedaulatan Kriptografi Post-Quantum BSSN",
              });
            }}
            className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 shadow-sm transition-all cursor-pointer group hover:bg-slate-900 select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 group-hover:text-cyan-300 transition-colors">
                Security Posture Score
              </span>
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-500 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-100">{securityPostureScore}%</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                securityPostureScore >= 90
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                  : securityPostureScore >= 75
                  ? "bg-amber-950 text-amber-300 border border-amber-700/50"
                  : "bg-rose-950 text-rose-300 border border-rose-700/50"
              }`}>
                {securityPostureScore >= 90 ? "Grade A+ (Optimal)" : securityPostureScore >= 75 ? "Grade B (Waspada)" : "Grade C (Rentan)"}
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  securityPostureScore >= 90
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-400"
                    : securityPostureScore >= 75
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${securityPostureScore}%` }}
              />
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-cyan-400 font-medium">
              <span>NIST FIPS 203 ({pqcNodes}/{totalNodes} Node PQC)</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Metric Card 3: Average Key Rotation Latency */}
          <div
            onClick={() => {
              setDrillDownData({
                type: "METRIC_THROUGHPUT",
                title: "Analisis Latensi Rotasi Kunci & Throughput Kriptografi",
                subtitle: "Evaluasi Hardware Enclave TPM 2.0, AVX2 KEM Cycle, dan Jitter Re-Keying",
              });
            }}
            className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-sm transition-all cursor-pointer group hover:bg-slate-900 select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-300 transition-colors">
                Average Key Rotation Latency
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 group-hover:border-indigo-500 transition-colors">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-100">{avgKeyRotationLatency}</span>
              <span className="text-xs text-slate-400 font-mono">ms</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                {avgKeyRotationLatency < 5.0 ? "< 5ms Fast KEM" : "Re-Keying Active"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Siklus: <strong className="text-slate-200">60 Detik</strong></span>
              <span className="text-emerald-400 font-mono font-semibold">Jitter &lt; 0.2ms</span>
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-indigo-400 font-medium">
              <span>Drill-Down Kripto & Hardware TPM</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Metric Card 4: System Health Percentage */}
          <div
            onClick={() => {
              setDrillDownData({
                type: "METRIC_HEALTH",
                title: "Analisis Integritas & Status Kesehatan Armada IoT",
                subtitle: "Evaluasi Hardware TPM 2.0, Utilisasi CPU, dan Kestabilan Sinyal Real-Time",
              });
            }}
            className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 shadow-sm transition-all cursor-pointer group hover:bg-slate-900 select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-300 transition-colors">
                System Health Percentage
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 group-hover:border-emerald-500 transition-colors">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-100">{systemHealthPercentage}%</span>
              <span className="text-xs text-slate-400 font-medium">
                {secureNodes}/{totalNodes} Sehat
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${(secureNodes / totalNodes) * 100}%` }}
                title={`Secure: ${secureNodes}`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${(degradedNodes / totalNodes) * 100}%` }}
                title={`Degraded: ${degradedNodes}`}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: `${(attackNodes / totalNodes) * 100}%` }}
                title={`Attack: ${attackNodes}`}
              />
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${(isolatedNodes / totalNodes) * 100}%` }}
                title={`Isolated: ${isolatedNodes}`}
              />
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-emerald-400 font-medium">
              <span>Uptime 99.98% • Klik untuk Drill-Down</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 24-HOUR THREAT FORECASTING CHART WITH RECHARTS */}
      <ThreatForecastingChart
        devices={devices}
        incidents={incidents}
        anomalyAlerts={anomalyAlerts}
        onOpenForensics={onOpenForensics}
        onNavigateToTab={onNavigateToTab}
      />

      {/* TRACKING CPU/MEMORY UTILIZATION TRENDS FOR CRITICAL IOT NODES (RECHARTS AREA CHARTS) */}
      <NodeResourceUtilizationChart
        devices={devices}
        incidents={incidents}
        onSelectDevice={onSelectDevice}
        onOpenForensics={onOpenForensics}
      />

      {/* GEOGRAPHIC HEATMAP VISUALIZATION OF CITY ZONES USING D3 */}
      <CityZonesThreatHeatmap
        devices={devices}
        incidents={incidents}
        onOpenForensics={onOpenForensics}
        onDrillDownZone={(zone: ZoneData) => {
          setDrillDownData({
            type: "ZONE",
            title: `Drill-Down Sektor: ${zone.name}`,
            subtitle: `${zone.sector} • Kepadatan Ancaman ${zone.threatDensityScore}% (${zone.threatTier})`,
            zoneInfo: {
              name: zone.name,
              sector: zone.sector,
              threatDensityScore: zone.threatDensityScore,
              threatTier: zone.threatTier,
              pqcReadinessScore: zone.pqcReadinessScore,
              description: zone.description,
              devices: zone.devices,
              incidents: zone.incidents,
            }
          });
        }}
        onDrillDownDevice={(device: IoTDevice) => {
          setDrillDownData({
            type: "DEVICE",
            title: `Inspeksi Telemetri Node: ${device.id}`,
            subtitle: `${device.name} (${device.zone})`,
            device: device,
          });
        }}
        onNavigateToTab={onNavigateToTab}
      />

      {/* SECTION 2: DATA ENCRYPTION LEVELS ARCHITECTURE VISUALIZER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Tingkat Enkripsi Data & Kedaulatan Kriptografi (4-Tier Matrix)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Klasifikasi hierarki algoritma pengamanan data IoT sesuai standar NIST FIPS & BSSN
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab("crypto")}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            Buka Lab Enkripsi & Benchmark <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4-Tier Interactive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Tier 4 */}
          <div
            onClick={() => setDrillDownData({ type: "ENCRYPTION_TIER", title: "Drill-Down: Tingkat 4 (ML-KEM-768)", encryptionTier: getEncryptionTierData(4) })}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/40 hover:border-purple-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-purple-950 text-purple-300 border border-purple-600/40">
                LEVEL 4 • POST-QUANTUM
              </span>
              <span className="text-xs font-mono font-bold text-purple-400">99/100</span>
            </div>
            <div className="font-bold text-xs text-slate-100 group-hover:text-purple-300 transition-colors">
              ML-KEM-768 + AES-GCM
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {devices.filter((d) => d.encryption === "Kyber768-AES").length} Node Terhubung (Gateway & SCADA)
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-purple-400 font-medium flex items-center justify-between">
              <span>Drill-Down Kriptografi</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tier 3 */}
          <div
            onClick={() => setDrillDownData({ type: "ENCRYPTION_TIER", title: "Drill-Down: Tingkat 3 (Dilithium-3)", encryptionTier: getEncryptionTierData(3) })}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-600/40">
                LEVEL 3 • PQC SIGNATURE
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">98/100</span>
            </div>
            <div className="font-bold text-xs text-slate-100 group-hover:text-cyan-300 transition-colors">
              Dilithium-3 + TPM 2.0
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {devices.filter((d) => d.encryption === "Dilithium3-ECDSA").length} Node (Firmware & Panic Beacon)
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-cyan-400 font-medium flex items-center justify-between">
              <span>Drill-Down Kriptografi</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tier 2 */}
          <div
            onClick={() => setDrillDownData({ type: "ENCRYPTION_TIER", title: "Drill-Down: Tingkat 2 (AES-256-GCM)", encryptionTier: getEncryptionTierData(2) })}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                LEVEL 2 • HARDWARE AEAD
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">96/100</span>
            </div>
            <div className="font-bold text-xs text-slate-100 group-hover:text-emerald-300 transition-colors">
              AES-256-GCM (NIST SP 800-38D)
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {devices.filter((d) => d.encryption === "AES-256-GCM").length} Node (CCTV AI & Radar Lalu Lintas)
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-medium flex items-center justify-between">
              <span>Drill-Down Kriptografi</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tier 1 */}
          <div
            onClick={() => setDrillDownData({ type: "ENCRYPTION_TIER", title: "Drill-Down: Tingkat 1 (ChaCha20-Poly1305)", encryptionTier: getEncryptionTierData(1) })}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 hover:border-indigo-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-600/40">
                LEVEL 1 • EDGE LOW-POWER
              </span>
              <span className="text-xs font-mono font-bold text-indigo-400">95/100</span>
            </div>
            <div className="font-bold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors">
              ChaCha20-Poly1305 / mTLS
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {devices.filter((d) => d.encryption === "ChaCha20-Poly1305" || d.encryption === "mTLS-1.3-Hardware").length} Node (Sensor Lingkungan)
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-indigo-400 font-medium flex items-center justify-between">
              <span>Drill-Down Kriptografi</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 & 4: MAIN GRID (DEVICE HEALTH STATUS & ACTIVE THREATS/INCIDENTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Device Fleet Health Status & Telemetry Matrix */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Device Health Status Module */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Status Kesehatan & Integritas Armada Node IoT
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menampilkan {filteredDevices.length} dari {devices.length} node infrastruktur aktif
                </p>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">Semua Status ({devices.length})</option>
                  <option value="SECURE">Aman ({secureNodes})</option>
                  <option value="ATTACK">Diserang ({attackNodes})</option>
                  <option value="DEGRADED">Degradasi ({degradedNodes})</option>
                  <option value="ISOLATED">Karantina ({isolatedNodes})</option>
                </select>
              </div>
            </div>

            {/* Devices List */}
            <div className="space-y-2.5">
              {filteredDevices.slice(0, 6).map((device) => {
                const isAttack = device.status === "ATTACK";
                const isDegraded = device.status === "DEGRADED";
                const isIsolated = device.status === "ISOLATED";

                return (
                  <div
                    key={device.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isAttack
                        ? "bg-rose-950/40 border-rose-500/60 text-slate-100 shadow-md shadow-rose-950/20"
                        : isDegraded
                        ? "bg-amber-950/30 border-amber-500/50 text-slate-100"
                        : isIsolated
                        ? "bg-purple-950/30 border-purple-500/50 text-slate-100"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 ${
                          isAttack
                            ? "bg-rose-500 animate-ping"
                            : isDegraded
                            ? "bg-amber-400 animate-pulse"
                            : isIsolated
                            ? "bg-purple-400"
                            : "bg-emerald-400 shadow-sm shadow-emerald-500/50"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-100">
                            {device.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            {device.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 font-mono text-cyan-300 border border-slate-700">
                            {device.encryption}
                          </span>
                          {device.tpmAttested && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-mono font-semibold">
                              TPM 2.0
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{device.zone}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-300">IP: {device.ip}</span>
                          <span>•</span>
                          <span>Anomali: <strong className={device.anomalyScore > 50 ? "text-rose-400" : "text-emerald-400"}>{device.anomalyScore}%</strong></span>
                          <span>•</span>
                          <span>Rotasi Kunci: <strong className="text-amber-300 font-mono">{device.keyRotationSecRemaining}s</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-mono text-slate-300">
                          {device.telemetry.packetRate.toLocaleString()} pkt/s
                        </div>
                        <div className="text-[10px] text-slate-400">
                          CPU: {device.telemetry.cpu}% • {device.telemetry.latencyMs}ms • {device.telemetry.temperatureC}°C
                        </div>
                      </div>
                      
                      {/* Drill-Down Action Button */}
                      <button
                        onClick={() => {
                          setDrillDownData({
                            type: "DEVICE",
                            title: `Inspeksi Telemetri Node: ${device.id}`,
                            subtitle: `${device.name} (${device.zone})`,
                            device: device,
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Drill-Down</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
              <span className="text-slate-400">Menampilkan armada telemetri real-time</span>
              <button
                onClick={() => onNavigateToTab("devices")}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                Buka Manajemen Seluruh Node ({devices.length}) →
              </button>
            </div>
          </div>

          {/* SECTION 5: LIVE CRYPTOGRAPHIC TELEMETRY PACKET DISSECTOR */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  Live Cryptographic Telemetry Stream (Dissektor Frame AEAD)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pemindaian paket real-time dengan verifikasi nonce dan autentikasi tag AES/PQC
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab("crypto")}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Buka Lab Enkripsi →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-2">Waktu</th>
                    <th className="py-2.5 px-2">Sumber Node</th>
                    <th className="py-2.5 px-2">Cipher & Nonce</th>
                    <th className="py-2.5 px-2">Entropi H(X)</th>
                    <th className="py-2.5 px-2 text-right">Integritas & Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {livePackets.map((pkt) => (
                    <tr
                      key={pkt.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        pkt.tampered ? "bg-rose-950/20 text-rose-300" : "text-slate-300"
                      }`}
                    >
                      <td className="py-2.5 px-2 text-slate-400">{pkt.timestamp}</td>
                      <td className="py-2.5 px-2">
                        <span className="font-semibold text-slate-200">{pkt.sourceNodeId}</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="text-cyan-400">{pkt.algorithm}</span>
                        <span className="text-slate-500 ml-1.5 text-[10px]">IV:{pkt.ivHex.slice(0, 6)}..</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pkt.entropyScore > 7.5
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                              : "bg-rose-950 text-rose-300 border border-rose-700/50"
                          }`}
                        >
                          {pkt.entropyScore} H(X)
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {pkt.integrityVerified ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px] animate-pulse">
                              <AlertOctagon className="w-3.5 h-3.5" /> MISMATCH
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setDrillDownData({
                                type: "PACKET",
                                title: `Disseksi Frame Paket: ${pkt.id}`,
                                subtitle: `Sumber: ${pkt.sourceNodeId} • Algoritma: ${pkt.algorithm}`,
                                packet: pkt,
                              });
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400"
                            title="Inspeksi Hex Frame Lengkap"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Threat Campaigns & Incidents Feed */}
        <div className="space-y-6">
          
          {/* Threat Campaigns Collapsible Groups Module */}
          <ThreatCampaignsGroup
            incidents={incidents}
            devices={devices}
            onOpenForensics={onOpenForensics}
            onMitigateIncident={onMitigateIncident}
            onSpeakIncident={onSpeakIncident}
            onDrillDownThreat={(threat) => {
              setDrillDownData({
                type: "THREAT",
                title: `Drill-Down Insiden: ${threat.attackType}`,
                subtitle: `Target: ${threat.deviceName} (${threat.deviceId})`,
                threat: threat,
              });
            }}
            onNavigateToTab={onNavigateToTab}
          />

          {/* SOAR Autonomous Response Status Widget */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm text-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                Orkestrasi SOAR Respons Otomatis
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">OTONOM AKTIF</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Kecepatan Respons Otomatis:</span>
                <span className="font-mono text-emerald-400 font-bold">&lt; 35 ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Protokol Mitigasi:</span>
                <span className="font-mono text-cyan-300">eBPF Drop + VLAN 99</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pencabutan Kredensial:</span>
                <span className="font-mono text-purple-300">PQC CRL Sync</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab("response")}
              className="w-full py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Buka Modul Respons Otomatis (SOAR) →</span>
            </button>
          </div>

          {/* Cryptographic Key Management (KMS) Status Widget */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm text-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Manajemen Kunci Kriptografi (KMS)
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono">Rotasi Otomatis</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Kyber-768 Mesh Master Key</div>
                  <div className="text-[10px] text-slate-400 font-mono">FIPS 203 • Hash: a89f..192c</div>
                </div>
                <span className="text-emerald-400 text-xs font-mono font-bold">AKTIF</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Dilithium-3 Firmware Root</div>
                  <div className="text-[10px] text-slate-400 font-mono">FIPS 204 • Hardware TPM 2.0</div>
                </div>
                <span className="text-cyan-400 text-xs font-mono font-bold">LIFETIME OK</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">mTLS 1.3 CA Subordinate</div>
                  <div className="text-[10px] text-slate-400 font-mono">ECDSA-P256 • Kota Sematang</div>
                </div>
                <span className="text-emerald-400 text-xs font-mono font-bold">TERVALIDASI</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab("crypto")}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Kelola & Rotasi Kunci Enkripsi</span>
            </button>
          </div>

        </div>
      </div>

      {/* CENTRAL DRILL-DOWN MODAL */}
      <DashboardDrillDownModal
        data={drillDownData}
        onClose={() => setDrillDownData(null)}
        onOpenForensics={onOpenForensics}
        onMitigateIncident={onMitigateIncident}
        onSelectDevice={onSelectDevice}
        onNavigateToTab={onNavigateToTab}
      />
    </div>
  );
};
