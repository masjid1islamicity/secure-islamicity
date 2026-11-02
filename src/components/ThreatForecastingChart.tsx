import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Clock,
  Sparkles,
  Info,
  Sliders,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  Lock,
  Radio,
  History,
  Target,
  FileText
} from "lucide-react";
import { 
  IoTDevice, 
  SecurityIncident, 
  AnomalyAlert, 
  ForecastScenario, 
  ThreatForecastHour 
} from "../types";
import { generateThreatForecast } from "../utils/threatForecastingEngine";

interface ThreatForecastingChartProps {
  devices: IoTDevice[];
  incidents: SecurityIncident[];
  anomalyAlerts?: AnomalyAlert[];
  onOpenForensics?: (incident: SecurityIncident) => void;
  onNavigateToTab?: (tab: string) => void;
}

type ChartViewMode = "COMPOSITE" | "PILLARS" | "VOLUME";

export const ThreatForecastingChart: React.FC<ThreatForecastingChartProps> = ({
  devices,
  incidents,
  anomalyAlerts = [],
  onOpenForensics,
  onNavigateToTab,
}) => {
  const [scenario, setScenario] = useState<ForecastScenario>("BASELINE_SOAR");
  const [viewMode, setChartViewMode] = useState<ChartViewMode>("COMPOSITE");
  const [selectedHour, setSelectedHour] = useState<ThreatForecastHour | null>(null);

  // Generate 24-hour forecast data
  const { forecastHours, summary } = useMemo(() => {
    return generateThreatForecast(devices, incidents, anomalyAlerts, scenario);
  }, [devices, incidents, anomalyAlerts, scenario]);

  // Set default selected hour to peak hour or first critical
  const activeHourDetail = selectedHour || forecastHours.reduce((max, curr) => curr.projectedRiskScore > max.projectedRiskScore ? curr : max, forecastHours[0]);

  // Custom Tooltip Component for Recharts
  const CustomForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: ThreatForecastHour = payload[0].payload;
      const isCritical = data.projectedRiskScore >= 75;
      const isHigh = data.projectedRiskScore >= 50 && data.projectedRiskScore < 75;

      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs font-sans max-w-xs space-y-2 text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-slate-100">{data.timeLabel} WIB</span>
              <span className="text-[10px] text-slate-400 ml-1.5 font-mono">H+{data.hourOffset}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                isCritical
                  ? "bg-rose-950 text-rose-300 border border-rose-600/50 animate-pulse"
                  : isHigh
                  ? "bg-amber-950 text-amber-300 border border-amber-600/50"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-600/50"
              }`}
            >
              {data.riskLevel} • {data.projectedRiskScore}%
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">95% Confidence Band:</span>
              <span className="font-mono text-cyan-300">
                {data.lowerBoundCI}% - {data.upperBoundCI}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono text-center">
              <div className="bg-slate-900 p-1.5 rounded border border-cyan-500/20">
                <div className="text-cyan-400 font-bold">{data.networkRisk}%</div>
                <div className="text-slate-400 text-[9px]">Trafik</div>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-purple-500/20">
                <div className="text-purple-400 font-bold">{data.deviceLogRisk}%</div>
                <div className="text-slate-400 text-[9px]">Node Log</div>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-amber-500/20">
                <div className="text-amber-400 font-bold">{data.dataAccessRisk}%</div>
                <div className="text-slate-400 text-[9px]">Akses API</div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80">
              <div className="text-[10px] text-slate-400">Vektor Utama:</div>
              <div className="text-slate-200 font-medium text-[11px] truncate">
                {data.dominantThreatVector}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
              <span>Est. Insiden: <strong className="text-rose-400">{data.projectedIncidentCount}/jam</strong></span>
              <span>Mitigasi SOAR: <strong className="text-emerald-400">{data.mitigatedBySOARCount}/jam</strong></span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header & Scenario Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Prediksi Tingkat Ancaman 24 Jam ke Depan (AI Threat Forecasting Engine)
            </h3>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] font-semibold border border-indigo-700/50">
              PROYEKSI TIME-SERIES
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulasi probabilistik berdasarkan 3-Pilar Anomali (Trafik Jaringan, Log Node/TPM, Pola Akses Data) & siklus temporal kota.
          </p>
        </div>

        {/* View Mode & Simulation Scenario Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart View Mode Buttons */}
          <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setChartViewMode("COMPOSITE")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === "COMPOSITE"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Indeks Komposit
            </button>
            <button
              onClick={() => setChartViewMode("PILLARS")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === "PILLARS"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              3-Pilar Anomali
            </button>
            <button
              onClick={() => setChartViewMode("VOLUME")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === "VOLUME"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Volume & Mitigasi SOAR
            </button>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 hidden sm:inline text-[11px]">Skenario:</span>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as ForecastScenario)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="BASELINE_SOAR">SOAR Otonom Aktif (Baseline)</option>
              <option value="PESSIMISTIC_UNMITIGATED">Tanpa SOAR (Propagasi Pesimis)</option>
              <option value="HARDENED_ZERO_TRUST">Hardened Zero-Trust (Proaktif)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Peak Risk */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Puncak Ancaman 24 Jam
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-rose-400">
                {summary.peakRiskScore}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {summary.peakHourLabel}
              </span>
            </div>
            <p className="text-[10px] text-rose-300/80 mt-1">
              Status: <strong className="font-bold">{summary.peakRiskLevel}</strong>
            </p>
          </div>
          <div className="p-2 rounded-lg bg-rose-950/50 border border-rose-700/40 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Avg 24h Risk */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Rata-Rata Risiko 24 Jam
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {summary.average24hRisk}%
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                PQC Suppressed
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Pilar Tertinggi: <strong className="text-cyan-300 font-mono">{summary.highestRiskPillar.replace('_', ' ')}</strong>
            </p>
          </div>
          <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-700/40 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        {/* Forecasted Incidents & SOAR Absorbed */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Estimasi Percobaan Serangan
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-100">
                ~{summary.estimated24hAttacks.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                Event
              </span>
            </div>
            <p className="text-[10px] text-emerald-400 mt-1">
              {summary.estimated24hMitigatedBySOAR.toLocaleString()} diserap eBPF / PQC
            </p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-950/50 border border-indigo-700/40 text-indigo-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        {/* Vulnerability Window */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Jendela Kesiagaan Kritis
            </span>
            <div className="mt-1 text-lg font-bold font-mono text-amber-300">
              {summary.vulnerabilityWindow}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Fokus: Patroli SOC & Audit Nonce Otomatis
            </p>
          </div>
          <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-700/40 text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Historical Incident Trend Correlation Indicator Bar */}
      {summary.historicalTrendMetrics && (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/40 text-indigo-300 flex-shrink-0 mt-0.5 sm:mt-0">
              <History className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-slate-200">
                  Korelasi Tren Riwayat Insiden:
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {summary.historicalTrendMetrics.totalHistoricalIncidents} Kejadian ({summary.historicalTrendMetrics.activeIncidentCount} Aktif / {summary.historicalTrendMetrics.resolvedIncidentCount} Termitigasi)
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-slate-400">
                  Vektor Dominan: <strong className="text-amber-300 font-mono">{summary.historicalTrendMetrics.topHistoricalVector}</strong>
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>Pola Rekuren: <strong className="text-slate-300">{summary.historicalTrendMetrics.recurrentAttackSignature}</strong></span>
                {summary.historicalTrendMetrics.correlatedSectors.length > 0 && (
                  <>
                    <span className="text-slate-600 hidden sm:inline">|</span>
                    <span>Sektor Terdampak: <strong className="text-cyan-400">{summary.historicalTrendMetrics.correlatedSectors.join(", ")}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 ${
              summary.historicalTrendMetrics.incidentVelocityTrend === 'ACCELERATING'
                ? "bg-rose-950 text-rose-300 border-rose-700 animate-pulse"
                : summary.historicalTrendMetrics.incidentVelocityTrend === 'DECELERATING'
                ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                : "bg-slate-900 text-cyan-300 border-slate-700"
            }`}>
              <Target className="w-3 h-3" />
              Laju: {summary.historicalTrendMetrics.incidentVelocityTrend}
            </span>
            <span className="text-[10px] font-mono text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
              Confidence: {summary.historicalTrendMetrics.historicalCorrelationConfidence}%
            </span>
          </div>
        </div>
      )}

      {/* Main Recharts Visualization Canvas */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "COMPOSITE" ? (
              <AreaChart
                data={forecastHours}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    setSelectedHour(e.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  {/* Composite Risk Gradient */}
                  <linearGradient id="riskScoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Upper/Lower CI Gradient */}
                  <linearGradient id="ciBandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  domain={[0, 100]}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip content={<CustomForecastTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />

                {/* Critical and Warning Reference Lines */}
                <ReferenceLine
                  y={75}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{
                    value: "Ambang Kritis (75%)",
                    fill: "#f43f5e",
                    fontSize: 9,
                    position: "insideTopRight",
                  }}
                />
                <ReferenceLine
                  y={50}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{
                    value: "Ambang Waspada (50%)",
                    fill: "#f59e0b",
                    fontSize: 9,
                    position: "insideTopRight",
                  }}
                />

                {/* 95% Confidence Interval Upper Bound Area */}
                <Area
                  type="monotone"
                  dataKey="upperBoundCI"
                  name="Batas Atas 95% CI"
                  stroke="#6366f1"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  fill="url(#ciBandGradient)"
                  dot={false}
                />

                {/* Main Projected Composite Risk Score */}
                <Area
                  type="monotone"
                  dataKey="projectedRiskScore"
                  name="Indeks Risiko Terproyeksi"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#riskScoreGradient)"
                  dot={{ r: 3, fill: "#06b6d4", stroke: "#0e7490", strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: "#38bdf8", stroke: "#fff", strokeWidth: 2 }}
                />

                {/* Lower Bound CI */}
                <Area
                  type="monotone"
                  dataKey="lowerBoundCI"
                  name="Batas Bawah 95% CI"
                  stroke="#475569"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  fill="transparent"
                  dot={false}
                />
              </AreaChart>
            ) : viewMode === "PILLARS" ? (
              <LineChart
                data={forecastHours}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    setSelectedHour(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  domain={[0, 100]}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip content={<CustomForecastTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />

                <ReferenceLine y={75} stroke="#f43f5e" strokeDasharray="4 4" />

                {/* Pillar 1: Network Traffic Risk */}
                <Line
                  type="monotone"
                  dataKey="networkRisk"
                  name="Pilar 1: Trafik Jaringan"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />

                {/* Pillar 2: Device Log / Firmware Risk */}
                <Line
                  type="monotone"
                  dataKey="deviceLogRisk"
                  name="Pilar 2: Log Node & TPM"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />

                {/* Pillar 3: Data Access Risk */}
                <Line
                  type="monotone"
                  dataKey="dataAccessRisk"
                  name="Pilar 3: Akses Data / API"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <ComposedChart
                data={forecastHours}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    setSelectedHour(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  unit=" evt"
                />
                <Tooltip content={<CustomForecastTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />

                {/* Bar of Forecasted Incidents */}
                <Bar
                  dataKey="projectedIncidentCount"
                  name="Prediksi Insiden Muncul"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />

                {/* Bar of SOAR Mitigations */}
                <Bar
                  dataKey="mitigatedBySOARCount"
                  name="Mitigasi Otomatis SOAR"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />

                {/* Projected Threat Line */}
                <Line
                  type="monotone"
                  dataKey="projectedRiskScore"
                  name="Skor Risiko Terproyeksi (%)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Timeline Quick scrubber hint */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Klik pada titik waktu di grafik untuk memeriksa rincian risiko per jam
          </span>
          <span className="font-mono text-slate-400">
            Interval: 24 Jam Forward • Algoritma: AR-LSTM & Harmonic Anomaly Wave
          </span>
        </div>
      </div>

      {/* AI Early Warning Advisory Banner & Selected Hour Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: AI Early Warning Notice */}
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-bold">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Rekomendasi Preskriptif AI Security Intelligence</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {summary.aiEarlyWarningNotice}
          </p>
          <div className="pt-2 flex items-center gap-3">
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab("anomaly")}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Buka Pengaturan Ambang Anomali</span>
              </button>
            )}
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab("response")}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulasikan Respons SOAR</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Col: Selected Hour Deep Inspector */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="font-bold text-slate-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspeksi Jam: {activeHourDetail.timeLabel} (H+{activeHourDetail.hourOffset})</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                activeHourDetail.projectedRiskScore >= 75
                  ? "bg-rose-950 text-rose-300 border border-rose-700"
                  : activeHourDetail.projectedRiskScore >= 50
                  ? "bg-amber-950 text-amber-300 border border-amber-700"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-700"
              }`}
            >
              {activeHourDetail.riskLevel} • {activeHourDetail.projectedRiskScore}%
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="text-slate-400">Vektor Ancaman Dominan:</div>
            <div className="text-slate-200 font-semibold bg-slate-900 p-1.5 rounded border border-slate-800">
              {activeHourDetail.dominantThreatVector}
            </div>

            <div className="pt-1">
              <div className="text-slate-400 text-[10px] mb-1">Faktor Pemicu Risiko Terdeteksi:</div>
              <div className="flex flex-wrap gap-1">
                {activeHourDetail.riskFactors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                  >
                    • {factor}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Akurasi Model: <strong className="text-cyan-300">{activeHourDetail.confidenceScore}%</strong></span>
              <span>Off-Hours: <strong className={activeHourDetail.isOffHours ? "text-amber-300" : "text-slate-300"}>{activeHourDetail.isOffHours ? "Ya (23-05)" : "Tidak"}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
