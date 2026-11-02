import React, { useState } from "react";
import { 
  FileCheck2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Printer, 
  Lock, 
  Award, 
  Building2,
  Calendar,
  Layers,
  Sparkles,
  FileType,
  FileText,
  ShieldAlert,
  Bot,
  Filter,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Eye,
  SlidersHorizontal,
  X
} from "lucide-react";
import { 
  AuditLogEntry, 
  IoTDevice, 
  SecurityIncident, 
  SOARAuditRecord, 
  QuarantinedDeviceEntry, 
  BlockedIPEntry, 
  RevokedCredentialEntry,
  AnomalyAlert 
} from "../types";
import { generateAuditCompliancePDF } from "../utils/pdfReportGenerator";

interface AuditComplianceReportProps {
  devices: IoTDevice[];
  auditLogs: AuditLogEntry[];
  incidents?: SecurityIncident[];
  soarAuditLogs?: SOARAuditRecord[];
  quarantinedDevices?: QuarantinedDeviceEntry[];
  blockedIPs?: BlockedIPEntry[];
  revokedCredentials?: RevokedCredentialEntry[];
  anomalyAlerts?: AnomalyAlert[];
  onOpenAIConsult: (query: string) => void;
}

export const AuditComplianceReport: React.FC<AuditComplianceReportProps> = ({
  devices,
  auditLogs,
  incidents = [],
  soarAuditLogs = [],
  quarantinedDevices = [],
  blockedIPs = [],
  revokedCredentials = [],
  anomalyAlerts = [],
  onOpenAIConsult,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // PDF Export Customization Options
  const [includeThreatMitigations, setIncludeThreatMitigations] = useState<boolean>(true);
  const [includeSOARAutomations, setIncludeSOARAutomations] = useState<boolean>(true);
  const [includeAuditTrail, setIncludeAuditTrail] = useState<boolean>(true);
  const [includeComplianceCert, setIncludeComplianceCert] = useState<boolean>(true);
  const [auditorName, setAuditorName] = useState<string>("BSSN & SOC Sematang Borang Lead Auditor");

  // Local Table Filtering
  const [auditFilter, setAuditFilter] = useState<string>("ALL");
  const [mitigationFilter, setMitigationFilter] = useState<string>("ALL");

  const complianceStandards = [
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
    },
    {
      id: "iec-62443",
      name: "IEC 62443 Industrial IoT / SCADA Cybersecurity",
      category: "Keamanan Infrastruktur Kritis",
      score: "97.8%",
      status: "COMPLIANT",
      items: [
        "Segmentasi jaringan VLAN khusus sensor air banjir dan gardu listrik",
        "Autentikasi mutual perangkat keras (Hardware Root of Trust)",
        "Perlindungan integritas data telemetri menggunakan tag AEAD"
      ]
    },
    {
      id: "nist-pqc",
      name: "NIST FIPS 203 & 204 Post-Quantum Cryptography Readiness",
      category: "Kriptografi Masa Depan",
      score: "100%",
      status: "COMPLIANT",
      items: [
        "Implementasi ML-KEM-768 untuk pertukaran kunci tahan kuantum",
        "Tanda tangan digital Dilithium-3 untuk integritas firmware OTA",
        "Dukungan dual hybrid cipher suite (AES-256-GCM + Kyber)"
      ]
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = () => {
    setPdfGenerating(true);

    try {
      // Filter data according to user settings
      const filteredAuditLogs = auditFilter === "ALL" 
        ? auditLogs 
        : auditLogs.filter(l => l.result === auditFilter);

      const filteredIncidents = mitigationFilter === "ALL"
        ? incidents
        : incidents.filter(i => i.status === mitigationFilter);

      const pdf = generateAuditCompliancePDF({
        title: "Laporan Audit Kepatuhan & Mitigasi Ancaman Siber IoT",
        domain: "security.sematangborangcity.cloud",
        generatedBy: auditorName,
        devices,
        auditLogs: includeAuditTrail ? filteredAuditLogs : [],
        incidents: includeThreatMitigations ? filteredIncidents : [],
        soarAuditLogs: includeSOARAutomations ? soarAuditLogs : [],
        quarantinedDevices,
        blockedIPs,
        revokedCredentials,
        anomalyAlerts,
        complianceStandards: includeComplianceCert ? complianceStandards : [],
      });

      const fileName = `SematangBorang_SOC_Audit_Compliance_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      setDownloadSuccess(true);
      setShowExportModal(false);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleExportJSON = () => {
    const reportData = {
      title: "Laporan Audit Kepatuhan Keamanan IoT Sematang Borang",
      domain: "security.sematangborangcity.cloud",
      generatedAt: new Date().toISOString(),
      devicesSummary: {
        total: devices.length,
        secure: devices.filter((d) => d.status === "SECURE").length,
        tpmAttestedRate: "100%",
        encryptionProtocols: ["Kyber-768", "AES-256-GCM", "ChaCha20-Poly1305", "Dilithium-3"]
      },
      threatMitigationsSummary: {
        totalIncidents: incidents.length,
        active: incidents.filter(i => i.status === "ACTIVE").length,
        mitigated: incidents.filter(i => i.status === "RESOLVED").length,
        soarExecutions: soarAuditLogs.length,
        quarantinedCount: quarantinedDevices.length,
        blockedIPsCount: blockedIPs.length,
      },
      complianceScoreAvg: "98.8%",
      auditLogsCount: auditLogs.length,
      auditLogs,
      incidents,
      soarAuditLogs
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SematangBorang_SOC_Audit_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Filtered lists for UI rendering
  const displayedAuditLogs = auditFilter === "ALL"
    ? auditLogs
    : auditLogs.filter(l => l.result === auditFilter);

  const displayedIncidents = mitigationFilter === "ALL"
    ? incidents
    : incidents.filter(i => i.status === mitigationFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                AUDIT SOC CERTIFIED
              </span>
              <h2 className="text-base font-bold text-slate-100">
                Audit Keamanan & Kepatuhan Regulasi Infrastruktur Kota Cerdas
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verifikasi pemenuhan standar regulasi BSSN, ISO/IEC 27001, IEC 62443, dan NIST Post-Quantum Cryptography untuk wilayah Sematang Borang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Direct PDF Generate Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/60 flex items-center gap-2 transition-all active:scale-95 border border-indigo-400/40"
              title="Konfigurasi dan Unduh Laporan PDF Ringkasan Audit & Mitigasi Ancaman"
            >
              <FileText className="w-4 h-4 text-cyan-200" />
              <span>Unduh Ringkasan PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor JSON</span>
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="mt-3 py-2 px-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Laporan Berhasil Dibuat dan Diunduh ke Perangkat Anda!</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">PDF & JSON Sync Ready</span>
          </div>
        )}
      </div>

      {/* Official Certificate Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border border-emerald-500/40 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900/60 border border-emerald-500/60 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-lg shadow-emerald-950/50">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300">
                TINGKAT KEPATUHAN: 98.8% (EXCELLENT)
              </span>
              <span className="text-xs text-slate-400 font-mono">ID Sertifikat: SB-SOC-2026-A9</span>
            </div>
            <h3 className="text-lg font-bold text-slate-50 mt-1">
              Sertifikasi Kelaikan Infrastruktur Siber Kota Sematang Borang
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Seluruh node jaringan mesh IoT terverifikasi menggunakan enkripsi simetris AEAD AES-256-GCM, isolasi TPM 2.0, dan kesiapan pertahanan kriptografi pasca-kuantum ML-KEM/Kyber.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 shadow flex items-center gap-1.5 transition-all"
          >
            <FileType className="w-4 h-4 text-indigo-400" />
            <span>Generate Dokumen PDF</span>
          </button>
          <button
            onClick={() => onOpenAIConsult("Buatkan analisis kesiapan audit kepatuhan ISO 27001 dan regulasi BSSN untuk platform security.sematangborangcity.cloud secara komprehensif")}
            className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow flex items-center gap-2 flex-shrink-0 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Analisis Kepatuhan AI</span>
          </button>
        </div>
      </div>

      {/* Compliance Standards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {complianceStandards.map((std) => (
          <div
            key={std.id}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                  {std.category}
                </span>
                <h4 className="text-sm font-bold text-slate-100 mt-0.5">{std.name}</h4>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-xs font-bold">
                {std.score}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {std.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION: THREAT MITIGATIONS & INCIDENT RESOLUTIONS SUMMARY */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Daftar Ancaman & Riwayat Mitigasi Keamanan (Threat Mitigations)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Status eksekusi tindakan mitigasi insiden siber, isolasi node, dan respons protektif
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
              <select
                value={mitigationFilter}
                onChange={(e) => setMitigationFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Semua ({incidents.length})</option>
                <option value="RESOLVED">Termitigasi ({incidents.filter(i => i.status === "RESOLVED").length})</option>
                <option value="ACTIVE">Aktif ({incidents.filter(i => i.status === "ACTIVE").length})</option>
                <option value="MITIGATING">Proses ({incidents.filter(i => i.status === "MITIGATING").length})</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40 text-[11px]">
                <th className="py-3 px-4">ID Insiden</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Target Perangkat</th>
                <th className="py-3 px-4">Tipe Serangan</th>
                <th className="py-3 px-4">Tingkat Keparahan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tindakan Mitigasi Terverifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                    Tidak ada catatan insiden sesuai filter yang dipilih.
                  </td>
                </tr>
              ) : (
                displayedIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-cyan-400">{inc.id}</td>
                    <td className="py-3 px-4 text-slate-400">{inc.timestamp}</td>
                    <td className="py-3 px-4 text-slate-200">
                      <div className="font-sans font-semibold">{inc.deviceName}</div>
                      <span className="text-[10px] text-slate-400">{inc.deviceId} • {inc.zone}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-semibold">{inc.attackType}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          inc.severity === "CRITICAL"
                            ? "bg-rose-950 text-rose-300 border border-rose-700"
                            : inc.severity === "HIGH"
                            ? "bg-orange-950 text-orange-300 border border-orange-700"
                            : "bg-amber-950 text-amber-300 border border-amber-700"
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          inc.status === "RESOLVED"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                            : inc.status === "ACTIVE"
                            ? "bg-rose-950 text-rose-300 border border-rose-700 animate-pulse"
                            : "bg-cyan-950 text-cyan-300 border border-cyan-700"
                        }`}
                      >
                        {inc.status === "RESOLVED" ? "TERMITIGASI" : inc.status === "ACTIVE" ? "AKTIF" : "SEDANG MITIGASI"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px] font-sans">
                      {inc.suggestedAction || inc.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Trail Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              Log Audit Integritas & Tindakan Keamanan Terenkripsi (Current Audit Logs)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Setiap catatan ditandatangani secara kriptografis dan disimpan dalam immutable log SOC
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Hasil:</span>
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Semua Hasil ({auditLogs.length})</option>
                <option value="SUCCESS">SUCCESS ({auditLogs.filter(l => l.result === "SUCCESS").length})</option>
                <option value="BLOCKED">BLOCKED ({auditLogs.filter(l => l.result === "BLOCKED").length})</option>
                <option value="WARNING">WARNING ({auditLogs.filter(l => l.result === "WARNING").length})</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40 text-[11px]">
                <th className="py-3 px-4">Audit ID</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Aktor / Daemon</th>
                <th className="py-3 px-4">Tindakan Keamanan</th>
                <th className="py-3 px-4">Target Node</th>
                <th className="py-3 px-4">Hasil</th>
                <th className="py-3 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-cyan-400">{log.id}</td>
                  <td className="py-3 px-4 text-slate-400">{log.timestamp}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{log.actor}</td>
                  <td className="py-3 px-4 text-slate-200 font-semibold">{log.action}</td>
                  <td className="py-3 px-4 text-slate-300">{log.target}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.result === "SUCCESS"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                          : log.result === "BLOCKED"
                          ? "bg-rose-950 text-rose-300 border border-rose-700"
                          : "bg-amber-950 text-amber-300 border border-amber-700"
                      }`}
                    >
                      {log.result}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 text-[11px] font-sans">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF EXPORT CUSTOMIZATION MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/50 flex items-center justify-center text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Generate & Download PDF Summary Report
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dokumen Resmi Kepatuhan Regulasi & Mitigasi Ancaman Siber
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Configuration */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pilih Bagian yang Disertakan dalam Laporan PDF:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-850 border border-slate-750 hover:bg-slate-800 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={includeThreatMitigations}
                    onChange={(e) => setIncludeThreatMitigations(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Mitigasi Ancaman Siber</div>
                    <div className="text-[10px] text-slate-400">{incidents.length} riwayat insiden</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-850 border border-slate-750 hover:bg-slate-800 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={includeAuditTrail}
                    onChange={(e) => setIncludeAuditTrail(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Log Audit Integritas</div>
                    <div className="text-[10px] text-slate-400">{auditLogs.length} entri audit trail</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-850 border border-slate-750 hover:bg-slate-800 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={includeSOARAutomations}
                    onChange={(e) => setIncludeSOARAutomations(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Eksekusi Respons SOAR</div>
                    <div className="text-[10px] text-slate-400">{soarAuditLogs.length} tindakan otomatis</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-850 border border-slate-750 hover:bg-slate-800 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={includeComplianceCert}
                    onChange={(e) => setIncludeComplianceCert(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Evaluasi Standar BSSN/ISO</div>
                    <div className="text-[10px] text-slate-400">4 kerangka kerja kepatuhan</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Auditor Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Nama Petugas / Otoritas Auditor (Untuk Tanda Tangan Digital):
              </label>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="Masukkan nama otoritas auditor atau unit SOC"
              />
            </div>

            {/* Information Notice */}
            <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                Dokumen PDF yang dihasilkan mencakup header resmi Pemerintah Kota Palembang / Sematang Borang, tabel multi-halaman berformat standar internasional, nomor registrasi dokumen unik, dan verifikasi hash integritas kriptografi SHA-256.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={pdfGenerating}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {pdfGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Menyusun Dokumen PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-cyan-200" />
                    <span>Download Laporan PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
