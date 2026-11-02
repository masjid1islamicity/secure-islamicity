import React, { useState } from "react";
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Cpu, 
  Activity, 
  Zap, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Terminal, 
  Server, 
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Layers,
  Database,
  ExternalLink,
  MapPin
} from "lucide-react";
import { IoTDevice, SecurityIncident, LiveTelemetryPacket, CryptoBenchmark, EncryptionType } from "../types";

export type DrillDownType = 
  | 'METRIC_PQC'
  | 'METRIC_THREATS'
  | 'METRIC_HEALTH'
  | 'METRIC_THROUGHPUT'
  | 'METRIC_COMPLIANCE'
  | 'THREAT'
  | 'DEVICE'
  | 'ZONE'
  | 'ENCRYPTION_TIER'
  | 'PACKET';

export interface DrillDownData {
  type: DrillDownType;
  title: string;
  subtitle?: string;
  metricKey?: string;
  threat?: SecurityIncident;
  device?: IoTDevice;
  packet?: LiveTelemetryPacket;
  zoneInfo?: {
    name: string;
    sector: string;
    threatDensityScore: number;
    threatTier: string;
    pqcReadinessScore: number;
    description: string;
    devices: IoTDevice[];
    incidents: SecurityIncident[];
  };
  encryptionTier?: {
    tierName: string;
    algorithm: EncryptionType;
    standard: string;
    securityRating: number;
    quantumResistant: boolean;
    assignedDevices: IoTDevice[];
    benchmark?: CryptoBenchmark;
    description: string;
  };
}

interface DashboardDrillDownModalProps {
  data: DrillDownData | null;
  onClose: () => void;
  onOpenForensics?: (incident: SecurityIncident) => void;
  onMitigateIncident?: (incidentId: string) => void;
  onSelectDevice?: (device: IoTDevice) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const DashboardDrillDownModal: React.FC<DashboardDrillDownModalProps> = ({
  data,
  onClose,
  onOpenForensics,
  onMitigateIncident,
  onSelectDevice,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<string>("overview");

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              {data.type.startsWith("METRIC") && <TrendingUp className="w-5 h-5" />}
              {data.type === "THREAT" && <ShieldAlert className="w-5 h-5 text-rose-400" />}
              {data.type === "DEVICE" && <Server className="w-5 h-5 text-emerald-400" />}
              {data.type === "ENCRYPTION_TIER" && <Lock className="w-5 h-5 text-purple-400" />}
              {data.type === "PACKET" && <Radio className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  DRILL-DOWN ANALYTICS
                </span>
                <h2 className="text-base font-bold text-slate-100">{data.title}</h2>
              </div>
              {data.subtitle && (
                <p className="text-xs text-slate-400 mt-0.5">{data.subtitle}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          
          {/* ========================================================= */}
          {/* CASE 1: METRIC DRILL-DOWN (PQC, THREATS, HEALTH, ETC.) */}
          {/* ========================================================= */}
          {data.type === "METRIC_PQC" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Post-Quantum Cryptographic Readiness</div>
                  <div className="text-2xl font-bold font-mono text-cyan-300">100%</div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> NIST FIPS 203 & 204 Active
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Algoritma Pertukaran Kunci</div>
                  <div className="text-2xl font-bold font-mono text-purple-300">ML-KEM-768</div>
                  <div className="text-[11px] text-slate-400">192-bit Quantum Security</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Upaya Downgrade Tercegah</div>
                  <div className="text-2xl font-bold font-mono text-emerald-300">100% (0 Lolos)</div>
                  <div className="text-[11px] text-slate-400">AEAD Tag Enforcement</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Arsitektur Kriptografi Pasca-Kuantum Kota Sematang Borang
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Infrastruktur IoT Kota Sematang Borang menerapkan skema enkripsi hibrida pasca-kuantum berlapis. Sesi pertukaran kunci ephemeral diamankan dengan algoritma berbasis kisi (lattice-based cryptography) <strong>NIST ML-KEM-768 (Kyber)</strong> untuk mencegah ancaman <em>"Harvest Now, Decrypt Later"</em> dari komputer kuantum masa depan. Transmisi payload data telemetri real-time dienkripsi dengan <strong>AES-256-GCM</strong> dengan integritas tag terotentikasi penuh 128-bit.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="font-semibold text-cyan-300">ML-KEM-768 (Kyber) Key Exchange</div>
                    <div className="text-[11px] text-slate-400 mt-1">Ukuran Public Key: 1,184 bytes • Ciphertext: 1,088 bytes • Latensi Enkapsulasi: &lt; 15μs</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="font-semibold text-purple-300">ML-DSA Dilithium-3 Signature</div>
                    <div className="text-[11px] text-slate-400 mt-1">Tanda Tangan Digital Firmware OTA & Perintah Darurat • Tervalidasi dengan TPM 2.0</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {data.type === "METRIC_THREATS" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Total Serangan Diblokir (24 Jam)</div>
                  <div className="text-2xl font-bold font-mono text-rose-300">1,842</div>
                  <div className="text-[11px] text-emerald-400 font-mono">100% Tingkat Keberhasilan Mitigasi</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Rerata Waktu Respons (MTTR)</div>
                  <div className="text-2xl font-bold font-mono text-cyan-300">28 ms</div>
                  <div className="text-[11px] text-slate-400">eBPF XDP Driver Kernel</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Nonce Replay Collision Detected</div>
                  <div className="text-2xl font-bold font-mono text-amber-300">412</div>
                  <div className="text-[11px] text-slate-400">Auto-dropped at Gateway</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Distribusi Vektor Serangan Siber IoT Terkini
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Replay Attack & Nonce Reuse (CWE-330)</span>
                    <span className="font-mono text-amber-400 font-bold">48.3% (890 insiden)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: "48.3%" }}></div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-300">DDoS Syn / Packet Inundation (Mirai/Botnet)</span>
                    <span className="font-mono text-rose-400 font-bold">29.3% (540 insiden)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: "29.3%" }}></div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-300">Cipher Downgrade & MITM Interception</span>
                    <span className="font-mono text-purple-400 font-bold">22.4% (412 insiden)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: "22.4%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {data.type === "METRIC_HEALTH" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Integritas Hardware TPM 2.0</div>
                  <div className="text-2xl font-bold font-mono text-emerald-300">100%</div>
                  <div className="text-[11px] text-emerald-400">PCR Registers Valid & Teruji</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Rerata Utilisasi CPU Armada</div>
                  <div className="text-2xl font-bold font-mono text-cyan-300">24.6%</div>
                  <div className="text-[11px] text-slate-400">Beban Sangat Stabil</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Tingkat Paket Terkirim (Delivery)</div>
                  <div className="text-2xl font-bold font-mono text-purple-300">99.98%</div>
                  <div className="text-[11px] text-slate-400">0.02% Noise Dropped</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Rincian Kesehatan & Kepatuhan Firmware
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Setiap node IoT di Kota Sematang Borang dilengkapi dengan secure enclave <strong>TPM 2.0 (Trusted Platform Module)</strong>. Boot loader melakukan verifikasi tanda tangan kriptografis pasca-kuantum (Dilithium-3) pada setiap tahapan kernel booting. Node yang mengalami perubahan hash firmware secara otomatis diputus dari jaringan inti dan dialihkan ke sandbox VLAN 99.
                </p>
              </div>
            </div>
          )}

          {data.type === "METRIC_THROUGHPUT" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Throughput Terenkripsi Total</div>
                  <div className="text-2xl font-bold font-mono text-cyan-300">425.8 Mbps</div>
                  <div className="text-[11px] text-emerald-400">Zero Plaintext Guarantee</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Rerata Latensi Kriptografi</div>
                  <div className="text-2xl font-bold font-mono text-emerald-300">3.2 ms</div>
                  <div className="text-[11px] text-slate-400">Hardware AEAD Acceleration</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Tingkat Entropi Data Shannon</div>
                  <div className="text-2xl font-bold font-mono text-purple-300">7.96 / 8.00</div>
                  <div className="text-[11px] text-slate-400">Distribusi Acak Maksimal</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Efisiensi Jalur Data Terenkripsi
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pipa data menghubungkan sensor IoT cerdas, CCTV lalu lintas, dan gateway SCADA melalui jalur aman terenkripsi AEAD. Seluruh frame data diperiksa terhadap kebocoran plaintext di tingkat driver eBPF sebelum didistribusikan ke pusat kendali.
                </p>
              </div>
            </div>
          )}

          {data.type === "METRIC_COMPLIANCE" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Skor Kepatuhan BSSN & ISO 27001</div>
                  <div className="text-2xl font-bold font-mono text-emerald-300">98.5%</div>
                  <div className="text-[11px] text-emerald-400">Tingkat Kedaulatan Kriptografi Tinggi</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Otomasi Respons SOAR</div>
                  <div className="text-2xl font-bold font-mono text-cyan-300">100% Otonom</div>
                  <div className="text-[11px] text-slate-400">Latensi Isolasi &lt; 35ms</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Integritas Audit Trail Kriptografi</div>
                  <div className="text-2xl font-bold font-mono text-purple-300">SHA-256 HMAC</div>
                  <div className="text-[11px] text-slate-400">Immutable Log Chain</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CASE 2: THREAT DRILL-DOWN */}
          {/* ========================================================= */}
          {data.type === "THREAT" && data.threat && (
            <div className="space-y-6">
              {/* Threat Overview Banner */}
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-600/70 space-y-2 text-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold">
                      {data.threat.severity}
                    </span>
                    <span className="font-mono text-xs text-rose-300">{data.threat.id}</span>
                  </div>
                  <span className="text-xs text-slate-400">{data.threat.timestamp}</span>
                </div>
                <h3 className="text-base font-bold text-rose-200">{data.threat.attackType}</h3>
                <p className="text-xs text-rose-200/90 leading-relaxed">{data.threat.description}</p>
              </div>

              {/* Technical Forensics Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    Target Node & Jaringan Terpengaruh
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Node ID:</span>
                      <span className="font-mono font-bold text-slate-200">{data.threat.deviceId}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Nama Perangkat:</span>
                      <span className="text-slate-200">{data.threat.deviceName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Wilayah / Sektor:</span>
                      <span className="text-slate-200">{data.threat.zone}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Identifikasi CVE / CWE:</span>
                      <span className="font-mono text-amber-400 font-bold">{data.threat.cveCode || "CWE-330"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Rekomendasi Tindakan Mitigasi
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {data.threat.suggestedAction}
                  </p>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300">
                    # eBPF Kernel Policy & Quarantine Rule<br />
                    $ tc filter add dev eth0 egress bpf da drop_ip {data.threat.deviceId}<br />
                    $ sematang-pqc-kms rotate-key --target={data.threat.deviceId} --algorithm=ML-KEM-768
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                {onOpenForensics && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenForensics(data.threat!);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Luncurkan Investigasi AI Forensik</span>
                  </button>
                )}
                {onMitigateIncident && data.threat.status !== "RESOLVED" && (
                  <button
                    onClick={() => {
                      onMitigateIncident(data.threat!.id);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Eksekusi Mitigasi SOAR Sekarang</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CASE 3: DEVICE DRILL-DOWN */}
          {/* ========================================================= */}
          {data.type === "DEVICE" && data.device && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${
                    data.device.status === "SECURE" ? "bg-emerald-400 shadow-lg shadow-emerald-500/50" :
                    data.device.status === "ATTACK" ? "bg-rose-500 animate-ping" :
                    data.device.status === "DEGRADED" ? "bg-amber-400" : "bg-purple-400"
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-100">{data.device.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 font-mono text-cyan-300 border border-slate-700">
                        {data.device.encryption}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{data.device.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    data.device.status === "SECURE" ? "bg-emerald-950 text-emerald-300 border border-emerald-700/50" :
                    data.device.status === "ATTACK" ? "bg-rose-950 text-rose-300 border border-rose-700/50" :
                    "bg-amber-950 text-amber-300 border border-amber-700/50"
                  }`}>
                    {data.device.status}
                  </span>
                </div>
              </div>

              {/* Device Telemetry Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="text-slate-400">Beban CPU</div>
                  <div className="text-lg font-bold font-mono text-slate-200 mt-1">{data.device.telemetry.cpu}%</div>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${data.device.telemetry.cpu}%` }}></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="text-slate-400">Penggunaan Memori</div>
                  <div className="text-lg font-bold font-mono text-slate-200 mt-1">{data.device.telemetry.memory}%</div>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${data.device.telemetry.memory}%` }}></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="text-slate-400">Laju Paket Transmisi</div>
                  <div className="text-lg font-bold font-mono text-slate-200 mt-1">{data.device.telemetry.packetRate.toLocaleString()} pkt/s</div>
                  <div className="text-[10px] text-slate-500 mt-1">Loss: {data.device.telemetry.droppedPackets} pkts</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="text-slate-400">Latensi Jaringan</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">{data.device.telemetry.latencyMs} ms</div>
                  <div className="text-[10px] text-slate-500 mt-1">Signal: {data.device.telemetry.signalDbm} dBm</div>
                </div>
              </div>

              {/* Hardware & TPM Register Audit */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Integritas Firmware & Hardware TPM 2.0
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-normal">PCR-00 s/d PCR-07 Tervalidasi</span>
                </h4>
                
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Firmware Version:</span>
                    <span className="font-mono text-slate-200">{data.device.firmwareVersion}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Firmware SHA-256 Digest:</span>
                    <span className="font-mono text-[11px] text-cyan-300 truncate max-w-xs">{data.device.firmwareHash}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">IP / MAC Address:</span>
                    <span className="font-mono text-slate-200">{data.device.ip} • {data.device.mac}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Rotasi Kunci Berikutnya:</span>
                    <span className="font-mono text-amber-300 font-bold">{data.device.keyRotationSecRemaining} detik lagi</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CASE 4: ENCRYPTION TIER DRILL-DOWN */}
          {/* ========================================================= */}
          {data.type === "ENCRYPTION_TIER" && data.encryptionTier && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-slate-100">{data.encryptionTier.tierName}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
                    Rating Keamanan: {data.encryptionTier.securityRating}/100
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{data.encryptionTier.description}</p>
                <div className="flex items-center gap-4 text-xs pt-1 text-slate-400 font-mono">
                  <span>Standar: <strong className="text-slate-200">{data.encryptionTier.standard}</strong></span>
                  <span>•</span>
                  <span>Quantum-Resistant: <strong className={data.encryptionTier.quantumResistant ? "text-emerald-400" : "text-amber-400"}>{data.encryptionTier.quantumResistant ? "YA (NIST FIPS)" : "TIDAK"}</strong></span>
                </div>
              </div>

              {/* Assigned Devices in this Tier */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Daftar Node Terhubung ({data.encryptionTier.assignedDevices.length} Perangkat)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Semua terenkripsi secara aktif</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto">
                  {data.encryptionTier.assignedDevices.map((dev) => (
                    <div
                      key={dev.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-200">{dev.id}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{dev.name}</div>
                      </div>
                      <span className="font-mono text-[10px] text-cyan-400">{dev.ip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CASE 5: ZONE / SECTOR DRILL-DOWN */}
          {/* ========================================================= */}
          {data.type === "ZONE" && data.zoneInfo && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-slate-100">{data.zoneInfo.name}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold ${
                    data.zoneInfo.threatTier === "CRITICAL"
                      ? "bg-rose-950 border border-rose-600 text-rose-300"
                      : data.zoneInfo.threatTier === "HIGH"
                      ? "bg-amber-950 border border-amber-600 text-amber-300"
                      : "bg-emerald-950 border border-emerald-600 text-emerald-300"
                  }`}>
                    Kepadatan Ancaman: {data.zoneInfo.threatDensityScore}% ({data.zoneInfo.threatTier})
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{data.zoneInfo.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Sektor:</span>
                    <strong className="text-slate-200">{data.zoneInfo.sector}</strong>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Kesiapan PQC:</span>
                    <strong className="text-purple-300">{data.zoneInfo.pqcReadinessScore}% (NIST FIPS 203)</strong>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Node Terhubung:</span>
                    <strong className="text-cyan-300">{data.zoneInfo.devices.length} Perangkat</strong>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Insiden Aktif:</span>
                    <strong className={data.zoneInfo.incidents.length > 0 ? "text-rose-400" : "text-emerald-400"}>
                      {data.zoneInfo.incidents.length} Kasus
                    </strong>
                  </div>
                </div>
              </div>

              {/* Devices in this Zone */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Armada Node IoT di Sektor Ini ({data.zoneInfo.devices.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">Klik untuk telemetri individual</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto">
                  {data.zoneInfo.devices.map((dev) => (
                    <div
                      key={dev.id}
                      onClick={() => onSelectDevice && onSelectDevice(dev)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                        dev.status === "ATTACK"
                          ? "bg-rose-950/40 border-rose-500/60 hover:bg-rose-950/60"
                          : dev.status === "DEGRADED"
                          ? "bg-amber-950/30 border-amber-500/50 hover:bg-amber-950/50"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-200">{dev.id}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            dev.status === "ATTACK" ? "bg-rose-600 text-white" : dev.status === "DEGRADED" ? "bg-amber-600 text-white" : "bg-emerald-800 text-emerald-200"
                          }`}>
                            {dev.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">{dev.name}</div>
                      </div>
                      <div className="text-right font-mono text-[10px]">
                        <span className="text-cyan-400 block">{dev.encryption}</span>
                        <span className="text-slate-500">{dev.ip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CASE 6: PACKET FRAME DRILL-DOWN */}
          {/* ========================================================= */}
          {data.type === "PACKET" && data.packet && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400">{data.packet.id}</span>
                  <span className="text-xs text-slate-400">{data.packet.timestamp}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Sumber:</span>
                    <div className="font-mono font-bold text-slate-200 mt-0.5">{data.packet.sourceNodeId}</div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Tujuan:</span>
                    <div className="font-mono font-bold text-slate-200 mt-0.5">{data.packet.destination}</div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Algoritma:</span>
                    <div className="font-mono font-bold text-cyan-400 mt-0.5">{data.packet.algorithm}</div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Entropi Shannon:</span>
                    <div className="font-mono font-bold text-emerald-400 mt-0.5">{data.packet.entropyScore} H(X)</div>
                  </div>
                </div>
              </div>

              {/* Byte Dissection */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Disseksi Struktur Frame Kriptografis
                </h4>
                
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">96-Bit Initialization Vector (IV / Nonce):</span>
                    <span className="text-amber-300 break-all">{data.packet.ivHex}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Encrypted Payload (Ciphertext):</span>
                    <span className="text-cyan-300 break-all">{data.packet.ciphertextHex}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">128-Bit AEAD Authentication Tag (MAC):</span>
                    <span className="text-purple-300 break-all">{data.packet.authTagHex}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Pusat Keamanan Siber IoT Kota Sematang Borang</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
