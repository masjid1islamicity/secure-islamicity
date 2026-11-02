import React, { useState } from "react";
import { 
  Server, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  KeyRound, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Sparkles,
  Wifi,
  Thermometer,
  Zap,
  Terminal,
  FileCheck
} from "lucide-react";
import { IoTDevice, DeviceStatus } from "../types";

interface DeviceFleetMonitorProps {
  devices: IoTDevice[];
  onIsolateDevice: (deviceId: string) => void;
  onRestoreDevice: (deviceId: string) => void;
  onRotateDeviceKey: (deviceId: string) => void;
  onVerifyTPM: (deviceId: string) => void;
  selectedDevice: IoTDevice | null;
  onSelectDevice: (device: IoTDevice | null) => void;
  onOpenAIConsult: (query: string) => void;
}

export const DeviceFleetMonitor: React.FC<DeviceFleetMonitorProps> = ({
  devices,
  onIsolateDevice,
  onRestoreDevice,
  onRotateDeviceKey,
  onVerifyTPM,
  selectedDevice,
  onSelectDevice,
  onOpenAIConsult,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");

  const zones = Array.from(new Set(devices.map((d) => d.zone)));

  const filteredDevices = devices.filter((dev) => {
    const matchesSearch =
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.ip.includes(searchTerm) ||
      dev.mac.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || dev.status === statusFilter;
    const matchesZone = zoneFilter === "ALL" || dev.zone === zoneFilter;

    return matchesSearch && matchesStatus && matchesZone;
  });

  return (
    <div className="space-y-6">
      {/* Controls & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Node ID, Nama, IP, MAC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="SECURE">Aman (Secure)</option>
              <option value="ATTACK">Diserang (Attack)</option>
              <option value="DEGRADED">Degradasi (Degraded)</option>
              <option value="ISOLATED">Karantina (Isolated)</option>
            </select>
          </div>

          {/* Zone Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Zona:</span>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 max-w-[160px] truncate"
            >
              <option value="ALL">Semua Wilayah</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Devices Table / Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              Daftar Armada Perangkat IoT Terpantau ({filteredDevices.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Setiap node diverifikasi oleh hardware TPM 2.0 dan terhubung melalui saluran enkripsi AEAD
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40 text-[11px] uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Node / ID</th>
                <th className="py-3 px-4">Kategori & Lokasi</th>
                <th className="py-3 px-4">Protokol Enkripsi</th>
                <th className="py-3 px-4">Integritas TPM</th>
                <th className="py-3 px-4">Telemetri & Beban</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredDevices.map((dev) => {
                const isAttack = dev.status === "ATTACK";
                const isDegraded = dev.status === "DEGRADED";
                const isIsolated = dev.status === "ISOLATED";

                return (
                  <tr
                    key={dev.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isAttack
                        ? "bg-rose-950/20"
                        : isIsolated
                        ? "bg-purple-950/20"
                        : ""
                    }`}
                  >
                    {/* Node ID & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            isAttack
                              ? "bg-rose-500 animate-ping"
                              : isDegraded
                              ? "bg-amber-400 animate-pulse"
                              : isIsolated
                              ? "bg-purple-400"
                              : "bg-emerald-400"
                          }`}
                        />
                        <div>
                          <div className="font-mono font-bold text-slate-100">{dev.id}</div>
                          <div className="text-[11px] text-slate-300 font-medium">{dev.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">IP: {dev.ip}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Location */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{dev.category}</div>
                      <div className="text-[11px] text-slate-400">{dev.zone}</div>
                      <div className="text-[10px] text-slate-500 font-mono">MAC: {dev.mac}</div>
                    </td>

                    {/* Encryption Protocol */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                        <Lock className="w-3 h-3 text-cyan-400" />
                        <span>{dev.encryption}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Rotasi Kunci: <strong className="text-slate-200">{dev.keyRotationSecRemaining}s</strong>
                      </div>
                    </td>

                    {/* TPM Attestation */}
                    <td className="py-3.5 px-4">
                      {dev.tpmAttested ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>TPM 2.0 Valid</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-400 font-medium animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Hash Mismatch</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 font-mono">
                        FW: {dev.firmwareVersion}
                      </div>
                    </td>

                    {/* Telemetry */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-slate-200">
                        {dev.telemetry.packetRate.toLocaleString()} pkts/s
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>CPU: {dev.telemetry.cpu}%</span>
                        <span>•</span>
                        <span>{dev.telemetry.temperatureC}°C</span>
                        <span>•</span>
                        <span>{dev.telemetry.latencyMs}ms</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide ${
                          isAttack
                            ? "bg-rose-950 text-rose-300 border border-rose-600"
                            : isDegraded
                            ? "bg-amber-950 text-amber-300 border border-amber-600"
                            : isIsolated
                            ? "bg-purple-950 text-purple-300 border border-purple-600"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-600/50"
                        }`}
                      >
                        {dev.status}
                      </span>
                    </td>

                    {/* Security Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {isIsolated ? (
                          <button
                            onClick={() => onRestoreDevice(dev.id)}
                            className="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-medium text-[11px] transition-all"
                            title="Pulihkan node dari karantina"
                          >
                            Pulihkan
                          </button>
                        ) : (
                          <button
                            onClick={() => onIsolateDevice(dev.id)}
                            className="px-2 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-medium text-[11px] border border-rose-700 transition-all"
                            title="Karantina node seketika ke sandbox"
                          >
                            Isolasi
                          </button>
                        )}

                        <button
                          onClick={() => onRotateDeviceKey(dev.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                          title="Rotasi Kunci Sesi (AES/Kyber)"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onSelectDevice(dev)}
                          className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-medium text-[11px] border border-cyan-700/60"
                        >
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Inspection Side Drawer for Selected Device */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 text-slate-200 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                    {selectedDevice.id}
                  </span>
                  <h3 className="text-base font-bold text-slate-100">
                    {selectedDevice.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedDevice.zone}</p>
              </div>
              <button
                onClick={() => onSelectDevice(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400">Status Keamanan:</span>
                <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                  {selectedDevice.status}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400">Tingkat Anomali:</span>
                <div className={`text-sm font-bold font-mono mt-0.5 ${
                  selectedDevice.anomalyScore > 50 ? "text-rose-400" : "text-emerald-400"
                }`}>
                  {selectedDevice.anomalyScore}%
                </div>
              </div>
            </div>

            {/* Cryptographic & TPM Enclave Details */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Parameter Kriptografi & Attestation
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Cipher Suite:</span>
                  <span className="text-cyan-300">{selectedDevice.encryption}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Rotasi Kunci:</span>
                  <span className="text-slate-200">{selectedDevice.keyRotationSecRemaining} detik tersisa</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Firmware Version:</span>
                  <span className="text-slate-200">{selectedDevice.firmwareVersion}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block mb-1">Firmware SHA-256 Digest:</span>
                  <span className="text-[10px] text-slate-300 break-all bg-slate-900 p-1.5 rounded block">
                    {selectedDevice.firmwareHash}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Hardware Root of Trust:</span>
                  <span className="text-emerald-400 font-bold">TPM 2.0 Enclave OK</span>
                </div>
              </div>
            </div>

            {/* Live Hardware Telemetry */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Telemetri Sensor Perangkat
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-[10px] text-slate-400">Beban CPU</div>
                    <div className="font-mono font-bold text-slate-200">{selectedDevice.telemetry.cpu}%</div>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-[10px] text-slate-400">Suhu Chip</div>
                    <div className="font-mono font-bold text-slate-200">{selectedDevice.telemetry.temperatureC}°C</div>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-[10px] text-slate-400">Sinyal Radio</div>
                    <div className="font-mono font-bold text-slate-200">{selectedDevice.telemetry.signalDbm} dBm</div>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-slate-400">Packet Rate</div>
                    <div className="font-mono font-bold text-slate-200">{selectedDevice.telemetry.packetRate} /s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick AI & Security Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => onOpenAIConsult(`Analisis mendalam status node ${selectedDevice.name} (${selectedDevice.id}) dengan IP ${selectedDevice.ip}, anomali ${selectedDevice.anomalyScore}%, dan enkripsi ${selectedDevice.encryption}`)}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Audit Forensik AI untuk Node Ini</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onRotateDeviceKey(selectedDevice.id)}
                  className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rotasi Kunci Sesi</span>
                </button>
                <button
                  onClick={() => onVerifyTPM(selectedDevice.id)}
                  className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Cek Quote TPM</span>
                </button>
              </div>

              {selectedDevice.status === "ISOLATED" ? (
                <button
                  onClick={() => onRestoreDevice(selectedDevice.id)}
                  className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold"
                >
                  Cabut Status Isolasi & Gabungkan ke Mesh
                </button>
              ) : (
                <button
                  onClick={() => onIsolateDevice(selectedDevice.id)}
                  className="w-full py-2 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-200 text-xs font-bold border border-rose-600"
                >
                  Karantina Node Ini dari Jaringan Kota
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
