import React, { useState, useEffect } from "react";
import { 
  AlertOctagon, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Wrench, 
  Activity, 
  Layers, 
  Cpu, 
  Radio, 
  Database, 
  ArrowRight, 
  X, 
  ExternalLink,
  Code2,
  Lock,
  Zap,
  Terminal
} from "lucide-react";
import { AnomalyAlert, AnomalyDiagnosticsAIResponse, IoTDevice } from "../types";

interface AnomalyDiagnosticsModalProps {
  alert: AnomalyAlert | null;
  onClose: () => void;
  devices: IoTDevice[];
  onMitigate: (alert: AnomalyAlert) => void;
}

export const AnomalyDiagnosticsModal: React.FC<AnomalyDiagnosticsModalProps> = ({
  alert,
  onClose,
  devices,
  onMitigate,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [diagnostics, setDiagnostics] = useState<AnomalyDiagnosticsAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alert) {
      setDiagnostics(null);
      return;
    }

    const fetchDiagnostics = async () => {
      setLoading(true);
      setError(null);
      try {
        const targetDev = devices.find((d) => d.id === alert.nodeId);
        const res = await fetch("/api/ai/anomaly-diagnostics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alert,
            deviceContext: targetDev,
            relatedLogs: [
              `[TELEMETRY] Observed metric: ${alert.metricName} = ${alert.observedValue} (Baseline: ${alert.baselineValue})`,
              `[DEVIATION] Calculated variance: +${alert.deviationPercent}% deviation from nominal envelope`,
              `[RAW_SAMPLE] ${alert.rawSample || "No raw sample attached"}`,
            ],
          }),
        });

        if (!res.ok) {
          throw new Error("Gagal menghubungi server diagnostik AI");
        }

        const data = await res.json();
        setDiagnostics(data);
      } catch (err: any) {
        console.error("AI Anomaly Diagnostics Error:", err);
        setError(err.message || "Terjadi kesalahan saat memproses diagnostik");
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostics();
  }, [alert, devices]);

  if (!alert) return null;

  const targetDevice = devices.find((d) => d.id === alert.nodeId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-100 my-8">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              alert.severity === "CRITICAL"
                ? "bg-rose-950/80 border-rose-500 text-rose-300"
                : alert.severity === "HIGH"
                ? "bg-amber-950/80 border-amber-500 text-amber-300"
                : "bg-cyan-950/80 border-cyan-500 text-cyan-300"
            }`}>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  GEMINI 3.7 FLASH • ANOMALY ENGINE
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  alert.severity === "CRITICAL"
                    ? "bg-rose-600 text-white"
                    : alert.severity === "HIGH"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}>
                  SEVERITY: {alert.severity}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1">
                Diagnostik AI Anomali: {alert.anomalyType}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Target Node: {alert.nodeId} ({alert.nodeName}) • {alert.zone}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          
          {/* Anomaly Profile Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Profil Deviasi Perilaku ({alert.pillar})</span>
              <span className="font-mono text-cyan-400">Confidence: {alert.confidenceScore}%</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Baseline Normal</span>
                <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                  {alert.baselineValue}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Nilai Observasi</span>
                <span className="font-mono font-bold text-rose-400 mt-0.5 block">
                  {alert.observedValue}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Deviasi Statistik</span>
                <span className="font-mono font-bold text-amber-300 mt-0.5 block">
                  {alert.deviationPercent > 0 ? `+${alert.deviationPercent}%` : `${alert.deviationPercent}%`}
                </span>
              </div>
            </div>

            {alert.rawSample && (
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto flex items-start gap-2">
                <Terminal className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="break-all">{alert.rawSample}</span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-400 font-mono">
                Model AI Gemini sedang merekonstruksi deviasi telemetri & korelasi pilar...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs">
              <strong>Terjadi Masalah:</strong> {error}
            </div>
          )}

          {/* AI Result Content */}
          {diagnostics && !loading && (
            <div className="space-y-5">
              
              {/* Root Cause Card */}
              <div className="bg-slate-950/60 border border-cyan-900/50 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Analisis Akar Penyebab (Root-Cause Investigation)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {diagnostics.rootCauseAnalysis}
                </p>
              </div>

              {/* Behavioral Drift Assessment */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Evaluasi Pergeseran Perilaku (Behavioral Drift)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {diagnostics.behavioralDriftAssessment}
                </p>
              </div>

              {/* MITRE ATT&CK for IoT Mapping */}
              {diagnostics.mitreMapping && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      Pemetaan MITRE ATT&CK® for ICS / IoT
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      {diagnostics.mitreMapping.techniqueId}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg text-xs space-y-1">
                    <div className="text-slate-400 text-[11px]">
                      Taktik: <strong className="text-slate-200">{diagnostics.mitreMapping.tactic}</strong>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Teknik: <strong className="text-cyan-300">{diagnostics.mitreMapping.techniqueName}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Remediations */}
              <div className="bg-slate-950/80 border border-emerald-900/40 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  Rekomendasi Tindakan SOAR & Mitigasi Cepat
                </h3>
                <ul className="space-y-2">
                  {diagnostics.recommendedRemediations.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Kriptografi: <strong>{targetDevice?.encryption || "AES-256-GCM / PQC"}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex-1 sm:flex-initial"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onMitigate(alert);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 flex-1 sm:flex-initial"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Eksekusi Mitigasi SOAR Seketika</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
