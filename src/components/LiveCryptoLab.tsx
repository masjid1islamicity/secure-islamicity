import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Play, 
  Bug, 
  CheckCircle2, 
  AlertOctagon, 
  Layers, 
  Zap, 
  Sliders,
  Copy,
  Cpu
} from "lucide-react";
import { 
  encryptAESGCM, 
  decryptAESGCM, 
  simulateKyber768Encapsulation, 
  generateRandomHex,
  calculateShannonEntropy
} from "../utils/cryptoSim";
import { CRYPTO_BENCHMARKS } from "../data/mockIoTInfrastructure";

export const LiveCryptoLab: React.FC = () => {
  // Input states
  const [plaintextInput, setPlaintextInput] = useState<string>(
    JSON.stringify({
      sensor: "SB-FLD-02",
      water_level_meters: 4.82,
      flow_rate_m3s: 142.5,
      sluice_gate_status: "AUTO_OPEN",
      timestamp: new Date().toISOString(),
    }, null, 2)
  );

  const [cipherAlgorithm, setCipherAlgorithm] = useState<string>("AES-256-GCM");
  const [activeKeyHex, setActiveKeyHex] = useState<string>(generateRandomHex(32)); // 256-bit key
  const [ciphertextHex, setCiphertextHex] = useState<string>("");
  const [ivHex, setIvHex] = useState<string>("");
  const [authTagHex, setAuthTagHex] = useState<string>("");
  const [entropy, setEntropy] = useState<number>(0);
  const [encDurationUs, setEncDurationUs] = useState<number>(0);

  // Decryption & Tamper Test states
  const [tamperedCipherHex, setTamperedCipherHex] = useState<string>("");
  const [tamperModified, setTamperModified] = useState<boolean>(false);
  const [decryptResult, setDecryptResult] = useState<{
    success: boolean;
    plaintext?: string;
    error?: string;
  } | null>(null);

  // PQC Kyber Simulation State
  const [kyberState, setKyberState] = useState(simulateKyber768Encapsulation());

  // Execute Encryption
  const handleEncrypt = async () => {
    try {
      const res = await encryptAESGCM(plaintextInput, activeKeyHex);
      setCiphertextHex(res.ciphertextHex);
      setIvHex(res.ivHex);
      setAuthTagHex(res.authTagHex);
      setEntropy(res.entropy);
      setEncDurationUs(res.durationUs);
      setTamperedCipherHex(res.ciphertextHex);
      setTamperModified(false);
      setDecryptResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial encryption on load
  useEffect(() => {
    handleEncrypt();
  }, []);

  // Execute Decryption
  const handleDecrypt = async () => {
    const res = await decryptAESGCM(
      tamperedCipherHex,
      ivHex,
      authTagHex,
      activeKeyHex
    );
    setDecryptResult(res);
  };

  // Tamper Attack Simulation (Flip single bit)
  const handleTamperBit = () => {
    if (!tamperedCipherHex) return;
    // Alter a hex character
    const charArray = tamperedCipherHex.split("");
    const targetIdx = Math.floor(charArray.length / 2);
    charArray[targetIdx] = charArray[targetIdx] === "a" ? "b" : "a";
    const corrupted = charArray.join("");
    setTamperedCipherHex(corrupted);
    setTamperModified(true);
    setDecryptResult(null);
  };

  // Reset Key & Re-encrypt
  const handleGenerateNewKey = () => {
    const newKey = generateRandomHex(32);
    setActiveKeyHex(newKey);
  };

  // Run Kyber-768 PQC Encapsulation
  const handleRegenerateKyber = () => {
    setKyberState(simulateKyber768Encapsulation());
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                CR-LAB v4.2
              </span>
              <h2 className="text-base font-bold text-slate-100">
                Laboratorium Kriptografi & Inspeksi Payload Enkripsi Real-Time
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verifikasi keandalan AEAD (AES-256-GCM / ChaCha20) dan Post-Quantum Kyber-768 secara langsung pada level byte, nonce, tag, dan entropy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEncrypt}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow flex items-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Enkripsi Ulang Payload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Real-Time Encryption & AEAD Tamper Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Plaintext Input & Key Config */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              1. Payload Telemetri IoT Sensor (Plaintext)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Ukuran: {plaintextInput.length} bytes
            </span>
          </div>

          <textarea
            value={plaintextInput}
            onChange={(e) => setPlaintextInput(e.target.value)}
            rows={8}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
            placeholder="Masukkan JSON payload telemetri..."
          />

          {/* Cipher Algorithm Selection & Key */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Algoritma Enkripsi:</span>
              <select
                value={cipherAlgorithm}
                onChange={(e) => setCipherAlgorithm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
              >
                <option value="AES-256-GCM">AES-256-GCM (Hardware AEAD)</option>
                <option value="ChaCha20-Poly1305">ChaCha20-Poly1305 (RFC 8439)</option>
                <option value="Kyber768-AES">Kyber-768 + AES-256-GCM (Hybrid PQC)</option>
              </select>
            </div>

            {/* Active 256-bit Secret Key */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-mono">Master Session Key (256-bit Hex):</span>
                <button
                  onClick={handleGenerateNewKey}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" /> Buat Kunci Baru
                </button>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 break-all">
                {activeKeyHex}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Ciphertext, Nonce, Tag & Entropy */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              2. Output Terenkripsi & Verifikasi Integritas AEAD
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Latency: {encDurationUs} μs
            </span>
          </div>

          {/* Entropy Gauge */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Shannon Entropy (Tingkat Keacakan)</div>
              <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                {entropy} / 8.0000 bits/byte
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Cryptographic Entropy
              </span>
              <div className="text-[10px] text-slate-500">Tidak ada pola plaintext tersisa</div>
            </div>
          </div>

          {/* Nonce (IV) & Auth Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">96-bit Nonce (IV)</div>
              <div className="text-xs font-mono text-cyan-300 break-all mt-1">{ivHex || "..."}</div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">128-bit AEAD Auth Tag</div>
              <div className="text-xs font-mono text-amber-300 break-all mt-1">{authTagHex || "..."}</div>
            </div>
          </div>

          {/* Ciphertext Hex */}
          <div>
            <div className="text-[11px] text-slate-400 font-mono mb-1">
              Ciphertext Payload (Hex Streams):
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 break-all max-h-24 overflow-y-auto">
              {ciphertextHex || "Klik 'Enkripsi Ulang Payload' untuk generate."}
            </div>
          </div>
        </div>
      </div>

      {/* AEAD Tamper & Decryption Proof Simulation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-400" />
              3. Uji Ketahanan Serangan Integritas (Bit-Flip & MITM Tampering Test)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulasikan penyadapan penyerang yang mengubah 1 bit ciphertext di tengah transmisi jaringan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTamperBit}
              className="px-3 py-1.5 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs font-semibold border border-rose-600 transition-all flex items-center gap-1.5"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Manipulasi 1 Bit (Tamper Attack)</span>
            </button>
            <button
              onClick={handleDecrypt}
              className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-all"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Verifikasi & Dekripsi</span>
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono mb-1 flex items-center justify-between">
            <span>Buffer Transmisi Penerima (Receiver Gateway):</span>
            {tamperModified && (
              <span className="text-rose-400 font-bold text-[10px] animate-pulse">
                [PERINGATAN: BUFFER TELAH DIMODIFIKASI DI JALUR TRANSMISI]
              </span>
            )}
          </div>
          <textarea
            value={tamperedCipherHex}
            onChange={(e) => {
              setTamperedCipherHex(e.target.value);
              setTamperModified(true);
            }}
            rows={2}
            className={`w-full p-2 bg-slate-900 border rounded text-xs font-mono focus:outline-none ${
              tamperModified ? "border-rose-500 text-rose-300" : "border-slate-800 text-slate-300"
            }`}
          />
        </div>

        {/* Decrypt Result Card */}
        {decryptResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              decryptResult.success
                ? "bg-emerald-950/40 border-emerald-500/80 text-emerald-200"
                : "bg-rose-950/50 border-rose-500 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {decryptResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Dekripsi Berhasil! Tag Autentikasi 100% Cocok (Payload Valid)</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Pencegahan Serangan Berhasil! Tag AEAD Gagal Verifikasi — Payload Ditolak Seketika</span>
                </>
              )}
            </div>

            {decryptResult.success ? (
              <pre className="p-2 rounded bg-slate-950/80 font-mono text-[11px] text-slate-200 overflow-x-auto">
                {decryptResult.plaintext}
              </pre>
            ) : (
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                {decryptResult.error}. Algoritma Galois/Counter Mode mendeteksi adanya modifikasi 1 bit atau kunci yang tidak valid, sehingga seluruh data langsung dibuang sebelum dieksekusi di core sistem.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Post-Quantum ML-KEM Kyber-768 Enclave Simulator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              4. Post-Quantum Cryptography (NIST FIPS 203 ML-KEM-768 Enclave)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pertukaran kunci tahan kuantum yang melindungi transmisi terhadap ancaman komputer kuantum di masa depan (Shor's Algorithm).
            </p>
          </div>
          <button
            onClick={handleRegenerateKyber}
            className="px-3 py-1.5 rounded bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-semibold border border-purple-600 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Kyber Keypair</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Kyber-768 Public Key (1184 B):</span>
            <span className="text-[11px] text-purple-300 break-all block mt-1">
              {kyberState.publicKeyHex}
            </span>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Encapsulated Ciphertext (1088 B):</span>
            <span className="text-[11px] text-cyan-300 break-all block mt-1">
              {kyberState.ciphertextHex}
            </span>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Derived 256-bit Shared Secret:</span>
            <span className="text-[11px] text-emerald-400 break-all block mt-1 font-bold">
              {kyberState.sharedSecretHex}
            </span>
          </div>
        </div>
      </div>

      {/* Cryptographic Standards Benchmark Comparison Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Perbandingan Kinerja Standar Kriptografi IoT Kota Sematang Borang
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40 text-[11px] font-mono">
                <th className="py-3 px-4">Protokol / Cipher</th>
                <th className="py-3 px-4">Standar Regulasi</th>
                <th className="py-3 px-4">Ketahanan Kuantum</th>
                <th className="py-3 px-4">Throughput (MB/s)</th>
                <th className="py-3 px-4">Latensi Enkripsi</th>
                <th className="py-3 px-4">Efisiensi Daya</th>
                <th className="py-3 px-4 text-right">Skor Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {CRYPTO_BENCHMARKS.map((bench) => (
                <tr key={bench.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-100 font-sans">
                    {bench.name}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {bench.standard}
                  </td>
                  <td className="py-3 px-4">
                    {bench.quantumResistant ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Quantum-Safe
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold text-[11px]">Vulnerable</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {bench.throughputMBps.toLocaleString()} MB/s
                  </td>
                  <td className="py-3 px-4 text-cyan-300">
                    {bench.encryptionLatencyUs} μs
                  </td>
                  <td className="py-3 px-4 text-slate-300 text-[11px] font-sans">
                    {bench.energyEfficiency}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      {bench.securityRating}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
