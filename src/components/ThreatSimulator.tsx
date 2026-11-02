import React, { useState } from "react";
import { 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  Layers,
  Terminal,
  Activity
} from "lucide-react";
import { IoTDevice } from "../types";

interface ThreatSimulatorProps {
  devices: IoTDevice[];
  onTriggerAttackScenario: (targetDeviceId: string, scenarioName: string, attackType: string, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM') => void;
  onMitigateAll: () => void;
  onOpenAIConsult: (query: string) => void;
}

interface AttackScenario {
  id: string;
  title: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  targetCategory: string;
  defenseAction: string;
}

export const ThreatSimulator: React.FC<ThreatSimulatorProps> = ({
  devices,
  onTriggerAttackScenario,
  onMitigateAll,
  onOpenAIConsult,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string>("quantum-harvest");
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const scenarios: AttackScenario[] = [
    {
      id: "quantum-harvest",
      title: "1. Quantum Harvest-Now-Decrypt-Later Interception",
      category: "KRIPTOGRAFI KUANTUM",
      severity: "CRITICAL",
      description: "Penyerang menyadap lalu lintas transmisi untuk disimpan dan didekripsi di masa depan menggunakan komputer kuantum (algoritma Shor).",
      targetCategory: "TRAFFIC",
      defenseAction: "Sistem mengaktifkan saluran NIST ML-KEM-768 & enkripsi AES-256-GCM sehingga data terbukti kebal terhadap komputasi kuantum.",
    },
    {
      id: "replay-nonce",
      title: "2. Man-in-the-Middle Nonce Reuse & Replay Injection",
      category: "INTEGRITAS PROTOKOL",
      severity: "HIGH",
      description: "Penyerang merekam frame perintah sensor dan menyuntikkan ulang paket identik untuk membuka pintu air banjir atau mengubah lampu lalu lintas.",
      targetCategory: "WATER_FLOOD",
      defenseAction: "AEAD Galois Counter Mode mendeteksi duplikasi nilai IV 96-bit dan membuang frame sebelum diproses oleh aktuator.",
    },
    {
      id: "ddos-flood",
      title: "3. Mirai-Style IoT Botnet Syn/Packet Flood",
      category: "KETERSEDIAAN INFRASTRUKTUR",
      severity: "HIGH",
      description: "Ribuan paket tak terotentikasi ditembakkan ke port 8883 MQTT untuk melumpuhkan gateway komunikasi pusat kota.",
      targetCategory: "CCTV",
      defenseAction: "eBPF XDP filter di kernel Linux memfilter 50,000 paket/detik dalam 2 milidetik dan mengisolasi IP sumber serangan.",
    },
    {
      id: "firmware-poison",
      title: "4. Malicious OTA Firmware Tampering Attempt",
      category: "INTEGRITAS HARDWARE",
      severity: "CRITICAL",
      description: "Penyerang mencoba mengunggah payload firmware palsu tanpa tanda tangan digital valid ke gardu listrik pintar.",
      targetCategory: "GRID",
      defenseAction: "Hardware TPM 2.0 menolak flashing karena tanda tangan Dilithium-3 tidak cocok dengan sertifikat Root of Trust kota.",
    },
    {
      id: "cipher-downgrade",
      title: "5. TLS Cipher Suite Downgrade to Legacy DES/RSA",
      category: "KEAMANAN KANAL",
      severity: "MEDIUM",
      description: "Penyerang memanipulasi ClientHello handshake untuk memaksa server beralih ke cipher usang yang mudah dipecahkan.",
      targetCategory: "HOSPITAL_SCADA",
      defenseAction: "Strict Zero-Trust policy menolak negosiasi non-TLS 1.3 dan memicu rotasi kunci darurat.",
    }
  ];

  const activeScenarioObj = scenarios.find((s) => s.id === selectedScenario) || scenarios[0];

  const handleLaunchSimulation = () => {
    setIsSimulating(true);
    setSimulationLogs([
      `[${new Date().toLocaleTimeString()}] Memulai Simulasi Skenario: "${activeScenarioObj.title}"...`,
      `[${new Date().toLocaleTimeString()}] Menembakkan vektor serangan ke node kategori: ${activeScenarioObj.targetCategory}...`,
    ]);

    // Find suitable device
    const targetDev = devices.find((d) => d.category === activeScenarioObj.targetCategory) || devices[1];

    setTimeout(() => {
      setSimulationLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [DETEKSI] Anomali telemetri terdeteksi pada node ${targetDev.id} (${targetDev.name})!`,
        `[${new Date().toLocaleTimeString()}] [SISTEM PERTAHANAN] Mengaktifkan protokol: ${activeScenarioObj.defenseAction}`,
      ]);

      onTriggerAttackScenario(
        targetDev.id,
        activeScenarioObj.title,
        activeScenarioObj.description,
        activeScenarioObj.severity
      );

      setTimeout(() => {
        setSimulationLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [SOAR ORCHESTRATION] Playbook SOAR otomatis dieksekusi: Isolasi VLAN 99, Pemblokiran IP via eBPF XDP DROP, dan Pencabutan Kredensial PQC berhasil! (Latensi: 28ms)`,
          `[${new Date().toLocaleTimeString()}] [MITIGASI SUKSES] Serangan berhasil diisolasi. Log insiden dan jejak audit kriptografis terdaftar di SOC & BSSN.`,
        ]);
        setIsSimulating(false);
      }, 1200);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700">
                CYBER RANGE v4.2
              </span>
              <h2 className="text-base font-bold text-slate-100">
                Simulasi Serangan Siber & Uji Otomasi Pertahanan Cerdas Kota
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Uji ketangguhan infrastruktur security.sematangborangcity.cloud terhadap 5 vektor ancaman nyata standar militer dan industri.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onMitigateAll}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pulihkan Semua Node (Mitigate All)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Grid & Simulation Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Select Scenarios (1 Col) */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono px-1">
            Pilih Skenario Ancaman:
          </h3>

          {scenarios.map((sc) => {
            const isSelected = sc.id === selectedScenario;
            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50 text-slate-100 ring-1 ring-rose-500/50"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs">{sc.title}</span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      sc.severity === "CRITICAL"
                        ? "bg-rose-600 text-white"
                        : sc.severity === "HIGH"
                        ? "bg-amber-600 text-white"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {sc.severity}
                  </span>
                </div>
                <div className="text-[10px] text-cyan-400 font-mono mt-1">
                  Kategori: {sc.category}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Scenario Details & Execution Engine (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          {/* Active Scenario Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                {activeScenarioObj.category}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Target: Node Kategori {activeScenarioObj.targetCategory}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-100">
              {activeScenarioObj.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeScenarioObj.description}
            </p>

            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-600/40 text-xs text-emerald-300 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Mekanisme Pertahanan Otomatis Kota:
              </span>
              <p className="text-[11px] leading-relaxed text-emerald-200/90">
                {activeScenarioObj.defenseAction}
              </p>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLaunchSimulation}
              disabled={isSimulating}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold shadow-lg transition-all flex items-center gap-2 ${
                isSimulating
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white active:scale-95 shadow-rose-950/50"
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSimulating ? "Menjalankan Simulasi..." : "Luncurkan Simulasi Serangan Siber"}</span>
            </button>

            <button
              onClick={() => onOpenAIConsult(`Berikan rekomendasi mitigasi taktis mendalam untuk skenario serangan: "${activeScenarioObj.title}". Bagaimana arsitektur security.sematangborangcity.cloud menangani vektor ini?`)}
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Konsultasi AI Copilot</span>
            </button>
          </div>

          {/* Live Execution Terminal Log Stream */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-900 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Terminal Eksekusi Kernel Pertahanan (eBPF & KMS Daemon)
              </span>
              <span className="text-[10px] text-slate-500">STDERR / STDOUT</span>
            </div>

            <div className="min-h-[140px] max-h-[220px] overflow-y-auto space-y-1 text-slate-300 text-[11px] leading-relaxed">
              {simulationLogs.length === 0 ? (
                <span className="text-slate-600 italic">
                  Siap menjalankan simulasi. Klik "Luncurkan Simulasi Serangan Siber" di atas.
                </span>
              ) : (
                simulationLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes("[DETEKSI]")
                        ? "text-rose-400 font-bold"
                        : log.includes("[MITIGASI SUKSES]")
                        ? "text-emerald-400 font-bold"
                        : "text-slate-300"
                    }
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
