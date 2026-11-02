import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  Cpu,
  Layers,
  Activity,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Clock,
  Thermometer,
  HardDrive,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Sparkles,
  Info,
  Maximize2,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { IoTDevice, SecurityIncident } from "../types";
import {
  generateNodeUtilizationTimeline,
  TimeframeOption,
  NodeUtilizationDataPoint,
} from "../utils/nodeTelemetryEngine";

interface NodeResourceUtilizationChartProps {
  devices: IoTDevice[];
  incidents?: SecurityIncident[];
  onSelectDevice?: (device: IoTDevice) => void;
  onOpenForensics?: (incident: SecurityIncident) => void;
}

type ViewMode = "COMBINED" | "SPLIT";
type NodeCategoryFilter = "ALL" | "GATEWAY_SCADA" | "ATTACK_DEGRADED" | "PQC_HARDENED";

export const NodeResourceUtilizationChart: React.FC<NodeResourceUtilizationChartProps> = ({
  devices,
  incidents = [],
  onSelectDevice,
  onOpenForensics,
}) => {
  // 1. Identify Critical Nodes (Gateways, SCADA, Grid, or non-secure/high anomaly score)
  const criticalNodes = useMemo(() => {
    return devices.filter((d) => {
      const isCriticalRole =
        d.category === "GATEWAY" ||
        d.category === "HOSPITAL_SCADA" ||
        d.category === "GRID" ||
        d.category === "WATER_FLOOD";
      const isElevatedRisk =
        d.status === "ATTACK" ||
        d.status === "DEGRADED" ||
        d.status === "ISOLATED" ||
        d.anomalyScore >= 40 ||
        d.activeIncidentsCount > 0;
      return isCriticalRole || isElevatedRisk;
    });
  }, [devices]);

  // Selected state
  const [selectedNodeId, setSelectedNodeId] = useState<string>("ALL"); // "ALL" = Aggregate
  const [timeframe, setTimeframe] = useState<TimeframeOption>("12H");
  const [viewMode, setViewMode] = useState<ViewMode>("COMBINED");
  const [categoryFilter, setCategoryFilter] = useState<NodeCategoryFilter>("ALL");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [manualRefreshNonce, setManualRefreshNonce] = useState<number>(0);

  // Selected single node (if not aggregate)
  const selectedNode = useMemo(() => {
    if (selectedNodeId === "ALL") return null;
    return criticalNodes.find((d) => d.id === selectedNodeId) || null;
  }, [selectedNodeId, criticalNodes]);

  // Filtered list of critical nodes for dropdown/tabs
  const filteredCriticalNodes = useMemo(() => {
    return criticalNodes.filter((d) => {
      if (categoryFilter === "GATEWAY_SCADA") {
        return d.category === "GATEWAY" || d.category === "HOSPITAL_SCADA" || d.category === "GRID";
      }
      if (categoryFilter === "ATTACK_DEGRADED") {
        return d.status === "ATTACK" || d.status === "DEGRADED" || d.activeIncidentsCount > 0;
      }
      if (categoryFilter === "PQC_HARDENED") {
        return d.encryption.includes("Kyber") || d.encryption.includes("Dilithium");
      }
      return true;
    });
  }, [criticalNodes, categoryFilter]);

  // Compute telemetry timeline data points and summary
  const { dataPoints, summary } = useMemo(() => {
    // manualRefreshNonce triggers re-computation if user hits refresh
    return generateNodeUtilizationTimeline(selectedNode, criticalNodes, timeframe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode, criticalNodes, timeframe, manualRefreshNonce]);

  // Associated incident for selected node if under attack
  const activeIncidentForNode = useMemo(() => {
    if (!selectedNode) {
      return incidents.find((i) => i.status !== "RESOLVED" && i.severity === "CRITICAL") || null;
    }
    return incidents.find((i) => i.deviceId === selectedNode.id && i.status !== "RESOLVED") || null;
  }, [selectedNode, incidents]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setManualRefreshNonce((prev) => prev + 1);
      setIsRefreshing(false);
    }, 450);
  };

  // Custom tooltip for Recharts Area charts
  const CustomUtilizationTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point: NodeUtilizationDataPoint = payload[0].payload;
      const isCpuCritical = point.cpu >= 85;
      const isCpuWarning = point.cpu >= 70 && point.cpu < 85;
      const isMemCritical = point.memory >= 85;

      return (
        <div className="bg-slate-950/95 border border-slate-700/90 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs font-sans max-w-xs space-y-2 text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-slate-100">{point.timestamp}</span>
              <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({point.timeOffsetLabel})</span>
            </div>
            {point.isAnomaly && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-600/50 animate-pulse">
                STRESS DETECTED
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <Cpu className="w-3.5 h-3.5" /> Beban CPU:
              </span>
              <span className="font-mono font-bold text-slate-100 text-[13px]">
                {point.cpu}%
                <span className={`text-[10px] ml-1.5 font-normal ${
                  isCpuCritical ? "text-rose-400" : isCpuWarning ? "text-amber-400" : "text-emerald-400"
                }`}>
                  ({isCpuCritical ? "Overload" : isCpuWarning ? "Warning" : "Nominal"})
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-violet-400 font-medium">
                <HardDrive className="w-3.5 h-3.5" /> Beban RAM:
              </span>
              <span className="font-mono font-bold text-slate-100 text-[13px]">
                {point.memory}%
                <span className={`text-[10px] ml-1.5 font-normal ${
                  isMemCritical ? "text-rose-400" : "text-violet-300"
                }`}>
                  ({Math.round(100 - point.memory)}% Headroom)
                </span>
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Suhu Enclave:</span>
                <span className="font-mono text-amber-300 ml-1 font-semibold">{point.temperature}°C</span>
              </div>
              <div>
                <span className="text-slate-400">PQC Overhead:</span>
                <span className="font-mono text-purple-300 ml-1 font-semibold">{point.cryptoLoad}%</span>
              </div>
            </div>

            {point.eventAnnotation && (
              <div className="mt-2 p-1.5 rounded-lg bg-rose-950/70 border border-rose-700/60 text-[11px] text-rose-200">
                <strong className="text-rose-300 block">Korelasi Insiden:</strong>
                {point.eventAnnotation}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Pelacakan Tren Utilisasi CPU & Memori Node Kritis
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50 text-[10px] font-mono font-bold">
                  RECHARTS AREA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring time-series kapasitas komputasi, reservasi memori hardware enclave, dan thermal throttling IoT
              </p>
            </div>
          </div>
        </div>

        {/* Global Action & Refresh Controls */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            {(["1H", "6H", "12H", "24H"] as TimeframeOption[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                  timeframe === tf
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf === "1H" ? "1 Jam" : tf === "6H" ? "6 Jam" : tf === "12H" ? "12 Jam" : "24 Jam"}
              </button>
            ))}
          </div>

          {/* View Mode Toggle (Combined Dual Area vs Split) */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode("COMBINED")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === "COMBINED"
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Grafik Area Gabungan CPU & Memori"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dual Area</span>
            </button>
            <button
              onClick={() => setViewMode("SPLIT")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === "SPLIT"
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Grafik Terpisah CPU & Memori"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
          </div>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors disabled:opacity-50"
            title="Sinkronisasi Ulang Telemetri Real-Time"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* FILTER & NODE SELECTOR RIBBON */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
        {/* Node Dropdown Selector */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Fokus Node:
          </span>
          <select
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="ALL">
              ⚡ Seluruh Armada Node Kritis (Rata-rata Agregat {criticalNodes.length} Node)
            </option>
            <optgroup label="Node Infrastruktur Kritis Pilihan">
              {filteredCriticalNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.id} — {node.name} [{node.status}] (CPU: {node.telemetry.cpu}%, RAM: {node.telemetry.memory}%)
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Category Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 md:pb-0">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
              categoryFilter === "ALL"
                ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800"
            }`}
          >
            Semua ({criticalNodes.length})
          </button>
          <button
            onClick={() => setCategoryFilter("ATTACK_DEGRADED")}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
              categoryFilter === "ATTACK_DEGRADED"
                ? "bg-rose-950 text-rose-300 border border-rose-600/50"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800"
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Siaga / Serangan</span>
          </button>
          <button
            onClick={() => setCategoryFilter("GATEWAY_SCADA")}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
              categoryFilter === "GATEWAY_SCADA"
                ? "bg-indigo-950 text-indigo-300 border border-indigo-600/50"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800"
            }`}
          >
            Gateway & SCADA
          </button>
          <button
            onClick={() => setCategoryFilter("PQC_HARDENED")}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
              categoryFilter === "PQC_HARDENED"
                ? "bg-purple-950 text-purple-300 border border-purple-600/50"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800"
            }`}
          >
            <Lock className="w-3 h-3 text-purple-400" />
            <span>Enclave PQC</span>
          </button>
        </div>
      </div>

      {/* TOP TELEMETRY SUMMARY CHIPS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Current CPU Load */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1 text-cyan-400 font-medium">
              <Cpu className="w-3.5 h-3.5" /> CPU Terkini
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
              summary.currentCpu >= 85
                ? "bg-rose-950 text-rose-300 border border-rose-600/50"
                : summary.currentCpu >= 70
                ? "bg-amber-950 text-amber-300 border border-amber-600/50"
                : "bg-emerald-950 text-emerald-300 border border-emerald-600/50"
            }`}>
              {summary.currentCpu >= 85 ? "STRESS" : summary.currentCpu >= 70 ? "HIGH" : "NORMAL"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-100">{summary.currentCpu}%</span>
            <span className="text-[10px] text-slate-500 font-mono">avg {summary.avgCpu}%</span>
          </div>
          <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                summary.currentCpu >= 85 ? "bg-rose-500" : summary.currentCpu >= 70 ? "bg-amber-500" : "bg-cyan-500"
              }`}
              style={{ width: `${summary.currentCpu}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Peak CPU 24h */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-slate-400 font-medium">Puncak CPU</span>
            <span className="text-[10px] text-slate-500 font-mono">Peak Spikes</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-xl font-bold font-mono ${
              summary.peakCpu >= 85 ? "text-rose-400" : summary.peakCpu >= 70 ? "text-amber-400" : "text-slate-100"
            }`}>
              {summary.peakCpu}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">max</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {summary.peakCpu >= 85 ? "Pernah menyentuh batas kritis" : "Dalam toleransi beban kerja"}
          </p>
        </div>

        {/* Metric 3: Memory Used */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1 text-violet-400 font-medium">
              <HardDrive className="w-3.5 h-3.5" /> RAM Terpakai
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Buffer</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-100">{summary.currentMemory}%</span>
            <span className="text-[10px] text-slate-500 font-mono">peak {summary.peakMemory}%</span>
          </div>
          <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${summary.currentMemory}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Headroom Memory */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-slate-400 font-medium">Headroom Bebas</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">AVAIL</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {summary.headroomMemoryPercent}%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {summary.headroomMemoryPercent > 20 ? "Kapasitas aman" : "Peringatan low memory"}
          </p>
        </div>

        {/* Metric 5: Thermal / Throttling */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Thermometer className="w-3.5 h-3.5" /> Suhu Enclave
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-xl font-bold font-mono ${
              summary.thermalStatus === "CRITICAL_THROTTLING"
                ? "text-rose-400"
                : summary.thermalStatus === "ELEVATED"
                ? "text-amber-400"
                : "text-slate-100"
            }`}>
              {dataPoints[dataPoints.length - 1]?.temperature || 38.5}°C
            </span>
          </div>
          <p className={`text-[10px] mt-1 truncate font-medium ${
            summary.thermalStatus === "CRITICAL_THROTTLING"
              ? "text-rose-400"
              : summary.thermalStatus === "ELEVATED"
              ? "text-amber-400"
              : "text-emerald-400"
          }`}>
            {summary.thermalStatus === "CRITICAL_THROTTLING"
              ? "Throttling Aktif"
              : summary.thermalStatus === "ELEVATED"
              ? "Suhu Meningkat"
              : "Thermal Nominal"}
          </p>
        </div>

        {/* Metric 6: PQC Crypto Overhead */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1 text-purple-400 font-medium">
              <Lock className="w-3.5 h-3.5" /> PQC Overhead
            </span>
            <span className="text-[10px] text-purple-400 font-mono font-bold">AVX2</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-purple-300">
              {summary.cryptographicOverheadPercent}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">siklus</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {summary.pqcHardwareProtected ? "Kyber/Dilithium aktif" : "Kripto Standar"}
          </p>
        </div>
      </div>

      {/* ACTIVE INCIDENT CORRELATION ALERT BANNER */}
      {activeIncidentForNode && (
        <div className="bg-gradient-to-r from-rose-950/90 via-rose-900/40 to-slate-950 border border-rose-600/50 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-900/80 border border-rose-500 text-rose-300 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-rose-200">
                Lonjakan Utilisasi Terkorelasi dengan Serangan Siber:
              </span>
              <span className="text-rose-300 ml-1.5 font-medium">
                {activeIncidentForNode.attackType} pada {activeIncidentForNode.deviceName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onOpenForensics && (
              <button
                onClick={() => onOpenForensics(activeIncidentForNode)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-medium flex items-center gap-1 shadow-sm transition-all"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Analisis AI Forensik</span>
              </button>
            )}
            {selectedNode && onSelectDevice && (
              <button
                onClick={() => onSelectDevice(selectedNode)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1 transition-all"
              >
                <span>Inspeksi Node</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* RECHARTS AREA CHARTS VISUALIZATION */}
      {viewMode === "COMBINED" ? (
        /* DUAL AREA CHART: OVERLAPPING CPU & MEMORY */
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Kurva Utilisasi CPU & Memori Real-Time (Dual Area Overlay)
              </span>
            </div>

            {/* Threshold Legend Guide */}
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Peringatan (70%)
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-0.5 bg-rose-500 inline-block" /> Batas Kritis (85%)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataPoints} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                <defs>
                  {/* CPU Area Gradient */}
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                  </linearGradient>

                  {/* Memory Area Gradient */}
                  <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={{ stroke: "#334155" }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={{ stroke: "#334155" }}
                  unit="%"
                />
                <Tooltip content={<CustomUtilizationTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value) => {
                    if (value === "cpu") return <span className="text-cyan-400 font-medium">Beban Prosesor (CPU %)</span>;
                    if (value === "memory") return <span className="text-violet-400 font-medium">Konsumsi Memori (RAM %)</span>;
                    return value;
                  }}
                />

                {/* 70% Warning Threshold */}
                <ReferenceLine
                  y={70}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                  label={{
                    value: "Ambang Peringatan 70%",
                    fill: "#fbbf24",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />

                {/* 85% Critical Threshold */}
                <ReferenceLine
                  y={85}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "Batas Kritis Enclave 85%",
                    fill: "#fb7185",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />

                {/* Recharts Area for Memory */}
                <Area
                  type="monotone"
                  dataKey="memory"
                  name="memory"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#memGradient)"
                  activeDot={{ r: 6, fill: "#a78bfa", stroke: "#1e1b4b", strokeWidth: 2 }}
                />

                {/* Recharts Area for CPU */}
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="cpu"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cpuGradient)"
                  activeDot={{ r: 6, fill: "#22d3ee", stroke: "#083344", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* SPLIT VIEW: DEDICATED INDIVIDUAL AREA CHARTS */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CPU Dedicated Area Chart */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Tren Utilisasi CPU (%)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Puncak: <strong className="text-cyan-400">{summary.peakCpu}%</strong>
              </span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cpuSplitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} unit="%" />
                  <Tooltip content={<CustomUtilizationTooltip />} />
                  <ReferenceLine y={85} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} />
                  <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#cpuSplitGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Memory Dedicated Area Chart */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-violet-400" />
                Tren Utilisasi Memori RAM & Enclave Buffer (%)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Puncak: <strong className="text-violet-400">{summary.peakMemory}%</strong>
              </span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="memSplitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} unit="%" />
                  <Tooltip content={<CustomUtilizationTooltip />} />
                  <ReferenceLine y={85} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} />
                  <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#memSplitGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER DIAGNOSTICS & ENCLAVE INTEGRITY CONTEXT */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Hardware Enclave TPM 2.0 & AVX2 Acceleration Terverifikasi
          </span>
          <span className="text-slate-600">•</span>
          <span>Sampling Interval: {timeframe === "1H" ? "3 Menit" : timeframe === "6H" ? "15 Menit" : "30-60 Menit"}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-slate-400">
            Resiko OOM:{" "}
            <strong className={`${
              summary.oomRisk === "HIGH" ? "text-rose-400" : summary.oomRisk === "MODERATE" ? "text-amber-400" : "text-emerald-400"
            }`}>
              {summary.oomRisk === "HIGH" ? "Tinggi" : summary.oomRisk === "MODERATE" ? "Moderat" : "Rendah"}
            </strong>
          </span>
          {selectedNode && (
            <span className="text-slate-400 font-mono text-[11px]">
              IP: <span className="text-slate-300">{selectedNode.ip}</span> ({selectedNode.zone})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
