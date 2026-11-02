import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Eye,
  FileText,
  Filter,
  Flame,
  Layers,
  Lock,
  Play,
  Pause,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
  X
} from "lucide-react";
import { 
  AnomalyAlert, 
  AnomalyBaselineRule, 
  AnomalyDetectionConfig, 
  AnomalyPillar, 
  IoTDevice, 
  SecurityIncident 
} from "../types";
import { AnomalyDiagnosticsModal } from "./AnomalyDiagnosticsModal";

interface AnomalyDetectionConsoleProps {
  devices: IoTDevice[];
  alerts: AnomalyAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<AnomalyAlert[]>>;
  baselineRules: AnomalyBaselineRule[];
  setBaselineRules: React.Dispatch<React.SetStateAction<AnomalyBaselineRule[]>>;
  config: AnomalyDetectionConfig;
  setConfig: React.Dispatch<React.SetStateAction<AnomalyDetectionConfig>>;
  onMitigateAlert: (alert: AnomalyAlert) => void;
  onOpenAIConsult: (query: string) => void;
  onSpeakAnomaly?: (alert: AnomalyAlert) => void;
}

export const AnomalyDetectionConsole: React.FC<AnomalyDetectionConsoleProps> = ({
  devices,
  alerts,
  setAlerts,
  baselineRules,
  setBaselineRules,
  config,
  setConfig,
  onMitigateAlert,
  onOpenAIConsult,
  onSpeakAnomaly,
}) => {
  // Navigation / Pillar Filter
  const [selectedPillar, setSelectedPillar] = useState<AnomalyPillar | "ALL">("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Real-time Engine State
  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"ALERTS" | "BASELINES" | "INJECTOR" | "ANALYTICS">("ALERTS");
  
  // AI Diagnostics Modal
  const [selectedAlertForDiagnostics, setSelectedAlertForDiagnostics] = useState<AnomalyAlert | null>(null);

  // Live Metric Telemetry Snapshot
  const [liveMetrics, setLiveMetrics] = useState({
    trafficThroughput: 428.4,
    trafficEntropy: 7.91,
    trafficPacketRate: 1420,
    deviceAvgCpu: 22.4,
    deviceAvgTemp: 34.8,
    tpmValidRatio: 100,
    apiAccessFreq: 14,
    unauthorizedAttempts: 0,
    dataExfiltrationRate: 0.8,
  });

  // Simulated Real-Time Multi-Pillar Anomaly Monitoring Loop
  useEffect(() => {
    if (!isMonitoringActive) return;

    const interval = setInterval(() => {
      // 1. Jitter live telemetry within safe/drift bounds
      setLiveMetrics((prev) => ({
        trafficThroughput: Number((415 + Math.random() * 25).toFixed(1)),
        trafficEntropy: Number((7.84 + Math.random() * 0.14).toFixed(2)),
        trafficPacketRate: Math.floor(1350 + Math.random() * 250),
        deviceAvgCpu: Number((20 + Math.random() * 6).toFixed(1)),
        deviceAvgTemp: Number((33.5 + Math.random() * 2.5).toFixed(1)),
        tpmValidRatio: 100,
        apiAccessFreq: Math.floor(10 + Math.random() * 12),
        unauthorizedAttempts: Math.random() > 0.85 ? 1 : 0,
        dataExfiltrationRate: Number((0.6 + Math.random() * 0.5).toFixed(2)),
      }));

      // Random spontaneous subtle drift alert generator (infrequent)
      if (Math.random() < 0.12) {
        const randomDev = devices[Math.floor(Math.random() * devices.length)];
        if (!randomDev) return;

        const pillars: AnomalyPillar[] = ["NETWORK_TRAFFIC", "DEVICE_LOGS", "DATA_ACCESS"];
        const chosenPillar = pillars[Math.floor(Math.random() * pillars.length)];

        let newAlert: AnomalyAlert | null = null;
        const nowStr = new Date().toLocaleTimeString("id-ID") + " WIB";

        if (chosenPillar === "NETWORK_TRAFFIC") {
          newAlert = {
            id: `ANOM-${Date.now().toString().slice(-4)}`,
            timestamp: nowStr,
            pillar: "NETWORK_TRAFFIC",
            nodeId: randomDev.id,
            nodeName: randomDev.name,
            zone: randomDev.zone,
            metricName: "Micro-Burst Jitter & Port Scan Ingress",
            baselineValue: "15 pkts/sec (Port 8883)",
            observedValue: "420 pkts/sec (Ports 22, 23, 80, 8883)",
            deviationPercent: 2700,
            severity: "MEDIUM",
            status: "TRIGGERED",
            anomalyType: "Reconnaissance Port Sweep Detected",
            description: `Aktivitas pemindaian port TCP terdeteksi dari subnet eksternal pada node ${randomDev.name}.`,
            mitreTechnique: "T0846 - Remote System Discovery",
            suggestedAction: "Terapkan aturan isolasi port eBPF dan batasi handshake mTLS.",
            confidenceScore: 92.4,
            rawSample: `TCP_SYN_SCAN: 10.240.18.2 -> ${randomDev.ip}:[22, 23, 80, 443, 8883]`
          };
        } else if (chosenPillar === "DEVICE_LOGS") {
          newAlert = {
            id: `ANOM-${Date.now().toString().slice(-4)}`,
            timestamp: nowStr,
            pillar: "DEVICE_LOGS",
            nodeId: randomDev.id,
            nodeName: randomDev.name,
            zone: randomDev.zone,
            metricName: "Thread Spike & Task Queue Delay",
            baselineValue: "18% CPU / 4.2ms latency",
            observedValue: "68% CPU / 28.4ms latency",
            deviationPercent: 277,
            severity: "MEDIUM",
            status: "TRIGGERED",
            anomalyType: "Hardware Thread Contention Anomaly",
            description: `Antrian task kriptografi pada hardware enclave mengalami penumpukan tidak wajar pada ${randomDev.name}.`,
            mitreTechnique: "T0807 - Command-Line Interface Unauthorized Execution",
            suggestedAction: "Kirim sinyal sinkronisasi RTOS dan bersihkan ring buffer telemetri.",
            confidenceScore: 89.1,
            rawSample: `RTOS_SCHED: queue_depth=148, task_starvation_warning=true`
          };
        } else {
          newAlert = {
            id: `ANOM-${Date.now().toString().slice(-4)}`,
            timestamp: nowStr,
            pillar: "DATA_ACCESS",
            nodeId: randomDev.id,
            nodeName: randomDev.name,
            zone: randomDev.zone,
            metricName: "Off-Hours Query Frequency",
            baselineValue: "1 req/min",
            observedValue: "28 req/min",
            deviationPercent: 2700,
            severity: "HIGH",
            status: "TRIGGERED",
            anomalyType: "Unusual Off-Hours API Polling",
            description: `Frekuensi kueri API telemetri melonjak pada waktu di luar jam operasional rutin kota.`,
            mitreTechnique: "T0855 - Unauthorized Command Message",
            suggestedAction: "Validasi token autentikasi dan terapkan rate-limiter ketat.",
            confidenceScore: 95.8,
            rawSample: `GET /api/v1/nodes/${randomDev.id}/sensors - 28 requests in 60s`
          };
        }

        if (newAlert) {
          setAlerts((prev) => [newAlert!, ...prev.slice(0, 24)]);
        }
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isMonitoringActive, devices, setAlerts]);

  // Statistics Calculation
  const totalAlerts = alerts.length;
  const activeTriggeredAlerts = alerts.filter((a) => a.status === "TRIGGERED");
  const criticalAlertsCount = alerts.filter((a) => a.severity === "CRITICAL" && a.status === "TRIGGERED").length;
  const networkAlertsCount = alerts.filter((a) => a.pillar === "NETWORK_TRAFFIC").length;
  const deviceLogsAlertsCount = alerts.filter((a) => a.pillar === "DEVICE_LOGS").length;
  const dataAccessAlertsCount = alerts.filter((a) => a.pillar === "DATA_ACCESS").length;

  // Filtered Alerts List
  const filteredAlerts = alerts.filter((alert) => {
    const matchesPillar = selectedPillar === "ALL" || alert.pillar === selectedPillar;
    const matchesSeverity = selectedSeverity === "ALL" || alert.severity === selectedSeverity;
    const matchesStatus = selectedStatus === "ALL" || alert.status === selectedStatus;
    const matchesSearch =
      alert.nodeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.nodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.anomalyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.zone.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesPillar && matchesSeverity && matchesStatus && matchesSearch;
  });

  // Action: Acknowledge Alert
  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "ACKNOWLEDGED" } : a))
    );
  };

  // Action: Resolve Alert
  const handleResolve = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "RESOLVED" } : a))
    );
  };

  // Action: Inject Specific Simulated Anomaly Test
  const handleInjectAnomaly = (
    pillar: AnomalyPillar,
    type: string,
    targetDevId: string,
    metric: string,
    baselineVal: string,
    observedVal: string,
    devPct: number,
    sev: "CRITICAL" | "HIGH" | "MEDIUM",
    desc: string,
    mitre: string,
    sample: string
  ) => {
    const targetDev = devices.find((d) => d.id === targetDevId) || devices[0];
    const newAlert: AnomalyAlert = {
      id: `ANOM-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      pillar,
      nodeId: targetDev.id,
      nodeName: targetDev.name,
      zone: targetDev.zone,
      metricName: metric,
      baselineValue: baselineVal,
      observedValue: observedVal,
      deviationPercent: devPct,
      severity: sev,
      status: "TRIGGERED",
      anomalyType: type,
      description: desc,
      mitreTechnique: mitre,
      suggestedAction: "Terapkan mitigasi otomatis SOAR, firewall eBPF, dan rotasi kunci sesi PQC.",
      confidenceScore: Number((96 + Math.random() * 3.8).toFixed(1)),
      rawSample: sample,
    };

    setAlerts((prev) => [newAlert, ...prev]);

    // If autoMitigateCritical is on and alert is CRITICAL
    if (config.autoMitigateCritical && sev === "CRITICAL") {
      setTimeout(() => {
        onMitigateAlert(newAlert);
        setAlerts((prev) =>
          prev.map((a) => (a.id === newAlert.id ? { ...a, status: "AUTO_MITIGATED" } : a))
        );
      }, 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Anomaly Detection Engine Header & Live Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Title & Engine Gauge */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-950 to-cyan-950 border border-indigo-500/40 flex flex-col items-center justify-center text-center shadow-lg shadow-indigo-950/40">
                <span className="text-xs font-mono font-bold text-indigo-300">
                  {isMonitoringActive ? "ACTIVE" : "PAUSED"}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">IDS/NDR</span>
              </div>
              <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                isMonitoringActive ? "bg-emerald-400 animate-ping" : "bg-amber-400"
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-[11px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  REAL-TIME ANOMALY DETECTION ENGINE
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  3-Pillar Behavioral Profiler (Z-Score σ: {config.trafficZScoreThreshold})
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-100 mt-0.5 flex items-center gap-2">
                Sistem Deteksi Anomali Jaringan, Log & Pola Akses Data IoT
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring deviasi statistik real-time terhadap trafik paket, log kernel/TPM 2.0, dan pola kueri API Kota Sematang Borang
              </p>
            </div>
          </div>

          {/* Engine Controls */}
          <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-center">
            {/* Sensitivity Mode Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
              <span className="text-slate-400">Sensitivitas:</span>
              <span className={`font-mono font-bold ${
                config.sensitivityMode === "STRICT"
                  ? "text-rose-400"
                  : config.sensitivityMode === "BALANCED"
                  ? "text-cyan-400"
                  : "text-emerald-400"
              }`}>
                {config.sensitivityMode} (NIST 800-207)
              </span>
            </div>

            {/* Pause/Play Stream Button */}
            <button
              onClick={() => setIsMonitoringActive(!isMonitoringActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isMonitoringActive
                  ? "bg-slate-950 border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40"
                  : "bg-amber-950/80 border-amber-500/60 text-amber-300"
              }`}
            >
              {isMonitoringActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isMonitoringActive ? "Jeda Sensor" : "Lanjutkan Sensor"}</span>
            </button>

            {/* AI Advisor Button */}
            <button
              onClick={() => onOpenAIConsult("Jelaskan tren anomali terbaru yang terdeteksi di Sematang Borang dan rekomendasi pengetatan baseline.")}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white flex items-center gap-1.5 shadow transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Anomaly Advisor</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab("ALERTS")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                activeTab === "ALERTS"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Daftar Alert Anomali ({alerts.length})</span>
              {criticalAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold animate-pulse">
                  {criticalAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("BASELINES")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                activeTab === "BASELINES"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Ambang Batas Baseline ({baselineRules.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("INJECTOR")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                activeTab === "INJECTOR"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Injektor & Pengujian Anomali Real-Time</span>
            </button>

            <button
              onClick={() => setActiveTab("ANALYTICS")}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                activeTab === "ANALYTICS"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analitik Deviasi Statistik (3-Sigma)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Throughput Live: {liveMetrics.trafficThroughput} Mbps</span>
          </div>
        </div>
      </div>

      {/* 3-PILLAR TELEMETRY & BEHAVIORAL DEVIATION OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Pillar 1: Network Traffic Monitoring Card */}
        <div
          onClick={() => setSelectedPillar("NETWORK_TRAFFIC")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            selectedPillar === "NETWORK_TRAFFIC"
              ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/30"
              : "bg-slate-900/80 border-slate-800 hover:border-cyan-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-700/50 text-cyan-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Pilar 1</span>
                <h3 className="text-xs font-bold text-slate-100">Network Traffic Monitoring</h3>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
              {networkAlertsCount} Anomali
            </span>
          </div>

          <div className="space-y-2 mt-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono">
              <span className="text-slate-400">Throughput Ingress:</span>
              <span className="text-slate-200 font-bold">{liveMetrics.trafficThroughput} Mbps</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono">
              <span className="text-slate-400">Entropi Shannon H(X):</span>
              <span className={liveMetrics.trafficEntropy < 7.2 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                {liveMetrics.trafficEntropy} / 8.00
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono">
              <span className="text-slate-400">Laju Paket Rata-Rata:</span>
              <span className="text-slate-200 font-bold">{liveMetrics.trafficPacketRate.toLocaleString()} pkts/s</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-medium">
            <span>Filter Anomali Jaringan</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Pillar 2: Device Logs & System Behavioral Card */}
        <div
          onClick={() => setSelectedPillar("DEVICE_LOGS")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            selectedPillar === "DEVICE_LOGS"
              ? "bg-slate-900 border-indigo-500 shadow-md shadow-indigo-950/30"
              : "bg-slate-900/80 border-slate-800 hover:border-indigo-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-700/50 text-indigo-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">Pilar 2</span>
                <h3 className="text-xs font-bold text-slate-100">Device Logs & Host Health</h3>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800">
              {deviceLogsAlertsCount} Anomali
            </span>
          </div>

          <div className="space-y-2 mt-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono">
              <span className="text-slate-400">Rata-Rata Beban CPU:</span>
              <span className="text-slate-200 font-bold">{liveMetrics.deviceAvgCpu}%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono">
              <span className="text-slate-400">Temperatur Inti Edge:</span>
              <span className="text-slate-200 font-bold">{liveMetrics.deviceAvgTemp}°C</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono">
              <span className="text-slate-400">TPM 2.0 PCR Attestation:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Valid
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400 font-medium">
            <span>Filter Anomali Log Perangkat</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Pillar 3: Data Access Patterns & API Monitoring Card */}
        <div
          onClick={() => setSelectedPillar("DATA_ACCESS")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            selectedPillar === "DATA_ACCESS"
              ? "bg-slate-900 border-amber-500 shadow-md shadow-amber-950/30"
              : "bg-slate-900/80 border-slate-800 hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-950 border border-amber-700/50 text-amber-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Pilar 3</span>
                <h3 className="text-xs font-bold text-slate-100">Data Access Patterns & API</h3>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800">
              {dataAccessAlertsCount} Anomali
            </span>
          </div>

          <div className="space-y-2 mt-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono">
              <span className="text-slate-400">Frekuensi Kueri API:</span>
              <span className="text-slate-200 font-bold">{liveMetrics.apiAccessFreq} req/min</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono">
              <span className="text-slate-400">Percobaan 401/403:</span>
              <span className={liveMetrics.unauthorizedAttempts > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                {liveMetrics.unauthorizedAttempts} attempts/min
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono">
              <span className="text-slate-400">Laju Transfer Eksternal:</span>
              <span className="text-slate-200 font-bold">{liveMetrics.dataExfiltrationRate} MB/min</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-400 font-medium">
            <span>Filter Anomali Pola Akses Data</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* TAB 1: REAL-TIME ANOMALY ALERTS FEED */}
      {activeTab === "ALERTS" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          {/* Filter Ribbon & Search Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Anomali, Node ID, Deskripsi..."
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

            {/* Multi-Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto text-xs">
              {/* Pillar Selector */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setSelectedPillar("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedPillar === "ALL" ? "bg-slate-800 text-cyan-300 font-bold" : "text-slate-400"
                  }`}
                >
                  Semua ({alerts.length})
                </button>
                <button
                  onClick={() => setSelectedPillar("NETWORK_TRAFFIC")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedPillar === "NETWORK_TRAFFIC" ? "bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-bold" : "text-slate-400"
                  }`}
                >
                  Trafik Jaringan
                </button>
                <button
                  onClick={() => setSelectedPillar("DEVICE_LOGS")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedPillar === "DEVICE_LOGS" ? "bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-bold" : "text-slate-400"
                  }`}
                >
                  Log Host/Perangkat
                </button>
                <button
                  onClick={() => setSelectedPillar("DATA_ACCESS")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedPillar === "DATA_ACCESS" ? "bg-amber-950 text-amber-300 border border-amber-700/50 font-bold" : "text-slate-400"
                  }`}
                >
                  Pola Akses Data
                </button>
              </div>

              {/* Severity Filter */}
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Semua Tingkat</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Only</option>
                <option value="MEDIUM">Medium Only</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="TRIGGERED">Triggered (Aktif)</option>
                <option value="ACKNOWLEDGED">Diakui (Acknowledged)</option>
                <option value="AUTO_MITIGATED">Auto Mitigated</option>
                <option value="RESOLVED">Resolved (Tuntas)</option>
              </select>
            </div>
          </div>

          {/* Anomaly Alerts Cards Feed */}
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-300">Tidak ada anomali yang cocok dengan kriteria filter</p>
              <p className="text-slate-500 mt-1">Seluruh metrik trafik, log sistem, dan akses data berada di dalam batas normal baseline.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredAlerts.map((alert) => {
                const isCritical = alert.severity === "CRITICAL";
                const isHigh = alert.severity === "HIGH";
                const isTriggered = alert.status === "TRIGGERED";
                const isAutoMitigated = alert.status === "AUTO_MITIGATED";
                const isResolved = alert.status === "RESOLVED";

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                      isTriggered && isCritical
                        ? "bg-rose-950/40 border-rose-500/70 text-slate-100 shadow-md shadow-rose-950/30"
                        : isTriggered && isHigh
                        ? "bg-amber-950/30 border-amber-500/60 text-slate-100 shadow-sm"
                        : isResolved
                        ? "bg-slate-950/40 border-slate-800 text-slate-400 opacity-80"
                        : "bg-slate-950/80 border-slate-800 text-slate-200"
                    }`}
                  >
                    {/* Header Line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Pillar Badge */}
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          alert.pillar === "NETWORK_TRAFFIC"
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-700/50"
                            : alert.pillar === "DEVICE_LOGS"
                            ? "bg-indigo-950 text-indigo-300 border border-indigo-700/50"
                            : "bg-amber-950 text-amber-300 border border-amber-700/50"
                        }`}>
                          {alert.pillar === "NETWORK_TRAFFIC" ? "TRAFIK JARINGAN" : alert.pillar === "DEVICE_LOGS" ? "LOG HOST/PERANGKAT" : "POLA AKSES DATA"}
                        </span>

                        {/* Severity Badge */}
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          isCritical
                            ? "bg-rose-600 text-white"
                            : isHigh
                            ? "bg-amber-600 text-white"
                            : "bg-slate-800 text-slate-300"
                        }`}>
                          {alert.severity}
                        </span>

                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                          isTriggered
                            ? "bg-rose-950 text-rose-300 border border-rose-800 animate-pulse"
                            : isAutoMitigated
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : isResolved
                            ? "bg-slate-800 text-slate-400"
                            : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}>
                          STATUS: {alert.status}
                        </span>

                        <span className="text-slate-400 font-mono text-[11px]">{alert.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 text-[11px]">
                          Confidence: <strong>{alert.confidenceScore}%</strong>
                        </span>
                        {alert.mitreTechnique && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {alert.mitreTechnique.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Target Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        {alert.anomalyType}
                      </h4>
                      <span className="text-xs text-slate-300 font-mono">
                        Node: <strong className="text-slate-100">{alert.nodeId}</strong> ({alert.nodeName}) • {alert.zone}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {alert.description}
                    </p>

                    {/* Baseline vs Observed Deviation Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800/90">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Baseline Standar:</span>
                        <span className="font-mono font-semibold text-emerald-400 text-xs">
                          {alert.baselineValue}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Observasi Terdeteksi:</span>
                        <span className="font-mono font-semibold text-rose-400 text-xs">
                          {alert.observedValue}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Deviasi Perilaku:</span>
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {alert.deviationPercent > 0 ? `+${alert.deviationPercent}%` : `${alert.deviationPercent}%`} (Z &gt; {config.trafficZScoreThreshold}σ)
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 flex-wrap gap-2">
                      <div className="text-[11px] text-slate-400">
                        Saran: <span className="text-slate-200">{alert.suggestedAction}</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Acknowledge Button */}
                        {isTriggered && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Akui (Ack)</span>
                          </button>
                        )}

                        {/* Verbal Speech Audio Button */}
                        {onSpeakAnomaly && (
                          <button
                            onClick={() => onSpeakAnomaly(alert)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                            title="Dengarkan Ringkasan Suara Anomali"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Suara</span>
                          </button>
                        )}

                        {/* AI Deep Diagnostics Button */}
                        <button
                          onClick={() => setSelectedAlertForDiagnostics(alert)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Diagnostik AI</span>
                        </button>

                        {/* Mitigate Alert Button */}
                        {alert.status !== "RESOLVED" && (
                          <button
                            onClick={() => {
                              onMitigateAlert(alert);
                              handleResolve(alert.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow transition-all active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Mitigasi SOAR</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BASELINE THRESHOLD & ANOMALY RULES CONFIGURATION */}
      {activeTab === "BASELINES" && (
        <div className="space-y-6">
          {/* Baseline Sensitivity Control Panel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Konfigurasi Sensitivitas Mesin Deteksi & Ambang Batas 3-Sigma
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sesuaikan parameter toleransi deviasi statistik dan kebijakan mitigasi otonom
                </p>
              </div>

              {/* Sensitivity Preset Pills */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, sensitivityMode: "STRICT", trafficZScoreThreshold: 2.2, entropyFloor: 7.5 }))}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    config.sensitivityMode === "STRICT"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Strict Zero-Trust (2.2σ)
                </button>
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, sensitivityMode: "BALANCED", trafficZScoreThreshold: 2.8, entropyFloor: 7.2 }))}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    config.sensitivityMode === "BALANCED"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Balanced Smart City (2.8σ)
                </button>
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, sensitivityMode: "RELAXED", trafficZScoreThreshold: 3.5, entropyFloor: 6.8 }))}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    config.sensitivityMode === "RELAXED"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Maintenance Mode (3.5σ)
                </button>
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-800 text-xs">
              
              {/* Z-Score Sensitivity */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Ambang Batas Z-Score:</span>
                  <span className="font-mono font-bold text-cyan-300">{config.trafficZScoreThreshold}σ</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="4.0"
                  step="0.1"
                  value={config.trafficZScoreThreshold}
                  onChange={(e) => setConfig((prev) => ({ ...prev, trafficZScoreThreshold: parseFloat(e.target.value) }))}
                  className="w-full accent-cyan-400"
                />
                <span className="text-[10px] text-slate-500 block">Toleransi deviasi standar trafik</span>
              </div>

              {/* Entropy Floor */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Batas Minimum Entropi:</span>
                  <span className="font-mono font-bold text-emerald-300">{config.entropyFloor} H(X)</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="7.9"
                  step="0.1"
                  value={config.entropyFloor}
                  onChange={(e) => setConfig((prev) => ({ ...prev, entropyFloor: parseFloat(e.target.value) }))}
                  className="w-full accent-emerald-400"
                />
                <span className="text-[10px] text-slate-500 block">Deteksi kebocoran plaintext AEAD</span>
              </div>

              {/* CPU Spike Threshold */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Batas Beban CPU Edge:</span>
                  <span className="font-mono font-bold text-indigo-300">{config.cpuSpikeThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={config.cpuSpikeThreshold}
                  onChange={(e) => setConfig((prev) => ({ ...prev, cpuSpikeThreshold: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-400"
                />
                <span className="text-[10px] text-slate-500 block">Deteksi loop miner/proses siluman</span>
              </div>

              {/* Auto Mitigate Switch */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Auto-Mitigasi Kritis (SOAR):</span>
                  <input
                    type="checkbox"
                    checked={config.autoMitigateCritical}
                    onChange={(e) => setConfig((prev) => ({ ...prev, autoMitigateCritical: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Otomatis mengeksekusi isolasi eBPF dan pencabutan kunci untuk anomali berbobot CRITICAL.
                </p>
              </div>
            </div>
          </div>

          {/* Active Baseline Rules Matrix Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Matriks Aturan Profiling Baseline 3-Pilar (9 Aturan Aktif)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-mono">
                    <th className="py-2.5 px-3">Rule ID</th>
                    <th className="py-2.5 px-3">Pilar</th>
                    <th className="py-2.5 px-3">Metrik Terpantau</th>
                    <th className="py-2.5 px-3">Rentang Normal</th>
                    <th className="py-2.5 px-3">Ambang Peringatan</th>
                    <th className="py-2.5 px-3">Ambang Kritis</th>
                    <th className="py-2.5 px-3">Interval Sampling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {baselineRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-cyan-300 font-bold">{rule.id}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rule.pillar === "NETWORK_TRAFFIC"
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                            : rule.pillar === "DEVICE_LOGS"
                            ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                            : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}>
                          {rule.pillar === "NETWORK_TRAFFIC" ? "TRAFFIC" : rule.pillar === "DEVICE_LOGS" ? "HOST LOG" : "DATA ACCESS"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-sans font-medium">
                        {rule.metric}
                      </td>
                      <td className="py-3 px-3 text-emerald-400">
                        {rule.normalRangeMin} - {rule.normalRangeMax} {rule.unit}
                      </td>
                      <td className="py-3 px-3 text-amber-400">
                        &gt; {rule.warningThreshold} {rule.unit}
                      </td>
                      <td className="py-3 px-3 text-rose-400 font-bold">
                        &gt; {rule.criticalThreshold} {rule.unit}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {rule.sampleIntervalSec} detik
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REAL-TIME ANOMALY INJECTOR & TEST SIMULATOR */}
      {activeTab === "INJECTOR" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Injektor & Uji Coba Simulasi Anomali Multi-Pilar Real-Time
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Uji responsivitas deteksi sistem dengan menyuntikkan deviasi spesifik ke aliran telemetri
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            
            {/* Scenario 1: Traffic SYN Flood */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 hover:border-cyan-400 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  PILAR 1 • JARINGAN
                </span>
                <span className="text-xs font-bold text-rose-400">CRITICAL</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">
                Mirai-Style SYN Packet Burst & Replay Collision
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Lonjakan paket ingress hingga 48,900 pkts/s dan penggunaan ulang Cryptographic IV pada port MQTT 8883.
              </p>
              <button
                onClick={() =>
                  handleInjectAnomaly(
                    "NETWORK_TRAFFIC",
                    "Mirai-Style SYN Burst & Nonce Reuse",
                    "SB-TRF-04",
                    "Laju Paket & Entropi IV",
                    "1,200 pkts/s",
                    "48,900 pkts/s (IV Reused)",
                    3975,
                    "CRITICAL",
                    "Terdeteksi lonjakan 48,900 pkts/s dengan IV collision pada sensor Simpang Borang Raya.",
                    "T0814 - Denial of Service",
                    "RAW_PCAP: [MQTT_SYN_BURST] 0x8F90C21A_COLLISION"
                  )
                }
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Suntikkan Anomali Trafik</span>
              </button>
            </div>

            {/* Scenario 2: Entropy Plaintext Leak */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 hover:border-cyan-400 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  PILAR 1 • JARINGAN
                </span>
                <span className="text-xs font-bold text-amber-400">HIGH</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">
                Shannon Entropy Drop (Plaintext Leak / Cipher Downgrade)
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Nilai entropi payload stream terenkripsi anjlok ke 4.82 H(X) mengindikasikan transmisi data tanpa enkripsi AEAD.
              </p>
              <button
                onClick={() =>
                  handleInjectAnomaly(
                    "NETWORK_TRAFFIC",
                    "Entropy Drop & Plaintext Leak",
                    "SB-CCTV-09",
                    "Entropi Shannon H(X)",
                    "7.94 bits/byte",
                    "4.82 bits/byte",
                    -39.3,
                    "HIGH",
                    "Penurunan drastis nilai entropi pada CCTV Bundaran Sematang mengindikasikan payload unencrypted.",
                    "T0886 - Remote Session Hijacking",
                    "PAYLOAD_ENTROPY_SAMPLE: H(X)=4.82 (PLAINTEXT_LEAK_WARNING)"
                  )
                }
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Suntikkan Penurunan Entropi</span>
              </button>
            </div>

            {/* Scenario 3: Device Log Rogue Process */}
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 hover:border-indigo-400 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  PILAR 2 • LOG PERANGKAT
                </span>
                <span className="text-xs font-bold text-amber-400">HIGH</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">
                Rogue Daemon Execution & CPU Saturation
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Proses tidak sah `/tmp/.dropbear_pty` membebani thread hardware enclave hingga 89% CPU dan suhu 54.2°C.
              </p>
              <button
                onClick={() =>
                  handleInjectAnomaly(
                    "DEVICE_LOGS",
                    "Rogue Daemon & CPU Spike",
                    "SB-TRF-04",
                    "Beban CPU & Suhu Node",
                    "18% CPU / 38°C",
                    "89% CPU / 54.2°C",
                    394,
                    "HIGH",
                    "Utilisasi CPU melonjak 89% akibat eksekusi proses siluman pada sensor koridor utama.",
                    "T0807 - Command-Line Interface Unauthorized Execution",
                    "KERNEL_LOG: PID 4192 /tmp/.dropbear_pty spawned by unauthorized parent"
                  )
                }
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Suntikkan Anomali CPU/Host</span>
              </button>
            </div>

            {/* Scenario 4: Off-Hours SCADA Actuation */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 hover:border-amber-400 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  PILAR 3 • POLA AKSES
                </span>
                <span className="text-xs font-bold text-rose-400">CRITICAL</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">
                Off-Hours Unauthorized SCADA Breaker Trip
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Percobaan pengiriman perintah pemutus sakelar listrik Gardu PLN pada dini hari tanpa token mTLS yang sah.
              </p>
              <button
                onClick={() =>
                  handleInjectAnomaly(
                    "DATA_ACCESS",
                    "Off-Hours Unauthorized SCADA Actuation",
                    "SB-GRID-07",
                    "Frekuensi Kueri API Sensitif",
                    "0 req/min (Normal: Tutup)",
                    "42 req/min (/scada/trip)",
                    4200,
                    "CRITICAL",
                    "42 percobaan akses tidak sah ke endpoint kontrol daya gardu induk PLN Sematang.",
                    "T0855 - Unauthorized Command Message",
                    "HTTP_POST: /api/v1/scada/trip-breaker [MISSING_PQC_CERTIFICATE]"
                  )
                }
                className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Suntikkan Akses SCADA Liar</span>
              </button>
            </div>

            {/* Scenario 5: Bulk Telemetry Exfiltration */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 hover:border-amber-400 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  PILAR 3 • POLA AKSES
                </span>
                <span className="text-xs font-bold text-amber-400">MEDIUM</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">
                Bulk Medical Telemetry Exfiltration Spike
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Pengunduhan massal data sensor suhu oksigen dan vaksin RSUD melampaui batas kuota 15 MB/min.
              </p>
              <button
                onClick={() =>
                  handleInjectAnomaly(
                    "DATA_ACCESS",
                    "Bulk Telemetry Exfiltration Spike",
                    "SB-HOSP-01",
                    "Laju Ekstraksi Data",
                    "0.4 MB/min",
                    "84.2 MB/min",
                    20950,
                    "MEDIUM",
                    "Permintaan bulk telemetry data storage cold chain RSUD melampaui ambang batas 15 MB/min.",
                    "T0802 - Automated Exfiltration",
                    "API_BULK_GET: /api/v1/telemetry/archive [VOLUME: 84.2MB in 60s]"
                  )
                }
                className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Suntikkan Eksfiltrasi Bulk</span>
              </button>
            </div>

            {/* Scenario 6: TPM Hardware Attestation Tamper */}
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 hover:border-indigo-400 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  PILAR 2 • LOG PERANGKAT
                </span>
                <span className="text-xs font-bold text-rose-400">CRITICAL</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">
                TPM 2.0 PCR-7 Digest Mismatch (Rootkit Tamper)
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Nilai hash pengukuran bootloader tidak cocok dengan sertifikat Root of Trust resmi kota.
              </p>
              <button
                onClick={() =>
                  handleInjectAnomaly(
                    "DEVICE_LOGS",
                    "TPM 2.0 Quote Mismatch (Rootkit)",
                    "SB-FLD-02",
                    "Integritas PCR-7 Register",
                    "Match (Valid Hash)",
                    "MISMATCH (0x9F82A0 != 0x3F901A)",
                    999,
                    "CRITICAL",
                    "Digest TPM 2.0 pada sensor pintu air banjir tidak cocok dengan database KMS kota.",
                    "T0858 - Change Operating Mode",
                    "TPM_QUOTE_VERIFY_FAIL: PCR[7] expected 0x3f901a, observed 0x9f82a0"
                  )
                }
                className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Suntikkan Kerusakan TPM 2.0</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 3-SIGMA STATISTICAL VARIANCE & ANALYTICS */}
      {activeTab === "ANALYTICS" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Analisis Model Distribusi Gaussian & Kurva Deviasi 3-Sigma ($3\sigma$)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Perbandingan distribusi frekuensi nominal vs observasi real-time untuk mendeteksi pergeseran perilaku (*Behavioral Drift*)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            {/* Visual Box 1: Traffic Variance */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">Varians Trafik Ingress</span>
                <span className="text-xs font-mono text-emerald-400">Normal Range (1.2σ)</span>
              </div>
              <div className="h-24 flex items-end justify-between gap-1 pt-2">
                {[15, 18, 22, 19, 24, 21, 28, 26, 22, 25, 92, 24, 20, 18].map((h, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-t transition-all ${
                      h > 70 ? "bg-rose-500 animate-pulse" : "bg-cyan-500/60 hover:bg-cyan-400"
                    }`}
                    style={{ height: `${h}%` }}
                    title={`Sampel ${i}: ${h}%`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>μ = 1,420 pkts/s</span>
                <span>σ = 180 pkts/s</span>
                <span className="text-rose-400 font-bold">Spike: +3975%</span>
              </div>
            </div>

            {/* Visual Box 2: Shannon Entropy Distribution */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">Distribusi Entropi Kriptografi</span>
                <span className="text-xs font-mono text-emerald-400">PQC Optimal (7.91)</span>
              </div>
              <div className="h-24 flex items-end justify-between gap-1 pt-2">
                {[94, 96, 95, 98, 97, 96, 95, 97, 98, 96, 48, 97, 96, 98].map((h, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-t transition-all ${
                      h < 60 ? "bg-rose-500 animate-pulse" : "bg-emerald-500/60 hover:bg-emerald-400"
                    }`}
                    style={{ height: `${h}%` }}
                    title={`Sampel ${i}: ${h}%`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Min Floor: {config.entropyFloor} H(X)</span>
                <span>Max: 8.00 H(X)</span>
                <span className="text-emerald-400 font-bold">AES-GCM Zero Leak</span>
              </div>
            </div>

            {/* Visual Box 3: API Request Rate & Off-Hours Access */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">Pola Akses API Kota</span>
                <span className="text-xs font-mono text-amber-400">Zero-Trust Guard</span>
              </div>
              <div className="h-24 flex items-end justify-between gap-1 pt-2">
                {[8, 12, 10, 14, 11, 16, 12, 15, 14, 18, 88, 14, 12, 10].map((h, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-t transition-all ${
                      h > 70 ? "bg-rose-500 animate-pulse" : "bg-amber-500/60 hover:bg-amber-400"
                    }`}
                    style={{ height: `${h}%` }}
                    title={`Sampel ${i}: ${h}%`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Rata-rata: 14 req/min</span>
                <span>Threshold: 20 req/min</span>
                <span className="text-amber-400 font-bold">401 Auto-Drop: ON</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Anomaly Diagnostics Modal */}
      <AnomalyDiagnosticsModal
        alert={selectedAlertForDiagnostics}
        onClose={() => setSelectedAlertForDiagnostics(null)}
        devices={devices}
        onMitigate={onMitigateAlert}
      />
    </div>
  );
};
