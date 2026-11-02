import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Bug, 
  Terminal, 
  Copy, 
  Check, 
  Wrench, 
  RefreshCw,
  AlertTriangle,
  Play,
  Cpu
} from "lucide-react";
import { SecurityIncident, IoTDevice, AIThreatAnalysisResponse } from "../types";

interface AIThreatForensicsModalProps {
  incident: SecurityIncident | null;
  onClose: () => void;
  devices: IoTDevice[];
  onMitigate: (incidentId: string) => void;
}

export const AIThreatForensicsModal: React.FC<AIThreatForensicsModalProps> = ({
  incident,
  onClose,
  devices,
  onMitigate,
}) => {
  const [analysis, setAnalysis] = useState<AIThreatAnalysisResponse | null>(null);
  const [remediationScript, setRemediationScript] = useState<string>("");
  const [scriptExplanation, setScriptExplanation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [scriptLoading, setScriptLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [executed, setExecuted] = useState<boolean>(false);

  const device = devices.find((d) => d.id === incident?.deviceId);

  useEffect(() => {
    if (!incident) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/ai/threat-forensics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device,
            incident,
            logs: {
              timestamp: incident.timestamp,
              telemetry: device?.telemetry,
              packetRate: device?.telemetry.packetRate,
              tpmAttestation: device?.tpmAttested,
            },
          }),
        });

        const data = await response.json();
        setAnalysis(data);

        // Also fetch remediation script
        generateRemediation(data);
      } catch (err) {
        console.error("Forensics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [incident]);

  const generateRemediation = async (currentAnalysis?: AIThreatAnalysisResponse) => {
    if (!incident) return;
    setScriptLoading(true);
    try {
      const response = await fetch("/api/ai/generate-remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentType: incident.attackType,
          targetNode: incident.deviceId,
          ipAddress: device?.ip || "10.240.12.44",
          policy: "Strict Zero-Trust & ML-KEM Key Revocation",
        }),
      });
      const data = await response.json();
      setRemediationScript(data.script || "");
      setScriptExplanation(data.explanation || "");
    } catch (err) {
      console.error(err);
    } finally {
      setScriptLoading(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(remediationScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteRemediation = () => {
    setExecuted(true);
    if (incident) {
      onMitigate(incident.id);
    }
  };

  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-950 border border-rose-600 text-rose-300 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  AI SOC Threat Forensics & Remediation Engine
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900 text-rose-200 font-mono font-bold">
                  {incident.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Target Node: <strong className="text-slate-200">{incident.deviceName} ({incident.deviceId})</strong> • {incident.zone}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-200">
                Gemini 3.7 Flash sedang merekonstruksi jejak paket dan menghitung vektor ancaman...
              </p>
              <p className="text-xs text-slate-400">
                Mengevaluasi nonce collision, digest TPM 2.0, dan korelasi CVE siber
              </p>
            </div>
          ) : analysis ? (
            <>
              {/* Executive Summary & Severity Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    VEKTOR SERANGAN: {analysis.vector}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Confidence: {analysis.confidence}%</span>
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600 font-mono font-bold">
                      LEVEL: {analysis.threatLevel}
                    </span>
                  </div>
                </div>

                <p className="text-slate-200 leading-relaxed font-sans text-xs">
                  {analysis.summary}
                </p>

                {/* CVE Badges */}
                {analysis.cveAssociations && analysis.cveAssociations.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">Korelasi CVE/CWE:</span>
                    {analysis.cveAssociations.map((cve, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] border border-slate-700"
                      >
                        {cve}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Analysis Details & Quantum Resilience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Detailed Findings */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider font-mono text-[11px] flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5 text-amber-400" />
                    Temuan Forensik Teknis
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300 leading-relaxed text-[11px]">
                    {analysis.analysisDetails.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Quantum Resilience Assessment */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider font-mono text-[11px] flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    Evaluasi Ketahanan Kuantum (PQC)
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {analysis.quantumVulnerability}
                  </p>
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-700/50 text-[10px] text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Infrastruktur Sematang Borang terproteksi oleh enkripsi NIST ML-KEM-768.</span>
                  </div>
                </div>
              </div>

              {/* Automated Remediation Script Section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider font-mono text-[11px] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Skrip Mitigasi Otomatis (eBPF Kernel Filter & KMS Revocation)
                  </h4>
                  <button
                    onClick={handleCopyScript}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-[11px] font-mono flex items-center gap-1 border border-slate-700"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Disalin!" : "Salin Skrip"}</span>
                  </button>
                </div>

                {scriptExplanation && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {scriptExplanation}
                  </p>
                )}

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-44">
                  <pre>{remediationScript}</pre>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Sistem: security.sematangborangcity.cloud • SOC Command
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Tutup
            </button>
            <button
              onClick={handleExecuteRemediation}
              disabled={executed}
              className={`px-4 py-2 rounded-lg text-xs font-bold shadow flex items-center gap-2 transition-all active:scale-95 ${
                executed
                  ? "bg-emerald-800 text-emerald-200 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{executed ? "Mitigasi Berhasil Diterapkan!" : "Terapkan Mitigasi Seketika"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
