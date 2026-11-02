import React, { useState } from "react";
import { 
  Layers, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Radio, 
  Server, 
  Activity, 
  Eye, 
  Zap, 
  MapPin,
  RefreshCw,
  Maximize2
} from "lucide-react";
import { IoTDevice } from "../types";

interface NetworkTopologyMapProps {
  devices: IoTDevice[];
  onSelectDevice: (device: IoTDevice) => void;
  onRotateKey: (deviceId: string) => void;
  onIsolateDevice: (deviceId: string) => void;
}

export const NetworkTopologyMap: React.FC<NetworkTopologyMapProps> = ({
  devices,
  onSelectDevice,
  onRotateKey,
  onIsolateDevice,
}) => {
  const [hoveredNode, setHoveredNode] = useState<IoTDevice | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const coreGateway = devices.find((d) => d.category === "GATEWAY") || devices[0];

  const displayedDevices = devices.filter(
    (d) => filterCategory === "ALL" || d.category === filterCategory
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
              PETA MESH v4.2
            </span>
            <h2 className="text-sm font-bold text-slate-100">
              Topologi Jaringan Mesh IoT & Jalur Terowongan Terenkripsi Kota Sematang Borang
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualisasi koneksi mTLS 1.3 dan saluran PQC dari sensor lapangan ke Core Gateway Komando Kota
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {["ALL", "TRAFFIC", "CCTV", "WATER_FLOOD", "GRID", "HOSPITAL_SCADA"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                filterCategory === cat
                  ? "bg-cyan-600 text-white font-bold"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat === "ALL" ? "Semua Node" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Map Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Map Canvas / SVG (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-2xl min-h-[480px] flex flex-col justify-between">
          {/* Map Grid Background Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          {/* Map Header Status Indicator */}
          <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Jangkauan Sinyal Mesh: <strong className="text-slate-200">100% Aktif</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> PQC Link
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Anomali
              </span>
            </div>
          </div>

          {/* SVG Map Links & Nodes */}
          <div className="relative w-full h-[400px] my-2">
            <svg className="w-full h-full absolute inset-0 pointer-events-none">
              <defs>
                <linearGradient id="linkGradSecure" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="linkGradAttack" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#881337" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Draw animated lines from Core Gateway to each device */}
              {displayedDevices.map((dev) => {
                if (dev.id === coreGateway.id) return null;
                const isAttack = dev.status === "ATTACK";
                const isIsolated = dev.status === "ISOLATED";

                return (
                  <g key={`line-${dev.id}`}>
                    <line
                      x1={`${coreGateway.coordinates.x}%`}
                      y1={`${coreGateway.coordinates.y}%`}
                      x2={`${dev.coordinates.x}%`}
                      y2={`${dev.coordinates.y}%`}
                      stroke={isAttack ? "url(#linkGradAttack)" : isIsolated ? "#6b21a8" : "url(#linkGradSecure)"}
                      strokeWidth={isAttack ? 2.5 : 1.5}
                      strokeDasharray={isIsolated ? "4,4" : isAttack ? "6,3" : "none"}
                      className={isAttack ? "animate-pulse" : ""}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render Node Pins */}
            {displayedDevices.map((dev) => {
              const isGateway = dev.category === "GATEWAY";
              const isAttack = dev.status === "ATTACK";
              const isDegraded = dev.status === "DEGRADED";
              const isIsolated = dev.status === "ISOLATED";

              return (
                <div
                  key={dev.id}
                  style={{
                    left: `${dev.coordinates.x}%`,
                    top: `${dev.coordinates.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
                  onClick={() => onSelectDevice(dev)}
                  onMouseEnter={() => setHoveredNode(dev)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer Pulsing Glow */}
                  {isAttack && (
                    <div className="absolute inset-0 -m-3 rounded-full bg-rose-500/40 animate-ping" />
                  )}

                  {/* Node Circle */}
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
                      isGateway
                        ? "bg-cyan-950 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40"
                        : isAttack
                        ? "bg-rose-950 border-rose-500 text-rose-300 animate-bounce"
                        : isDegraded
                        ? "bg-amber-950 border-amber-500 text-amber-300"
                        : isIsolated
                        ? "bg-purple-950 border-purple-500 text-purple-300"
                        : "bg-slate-900 border-slate-700 text-emerald-400 hover:border-emerald-400"
                    }`}
                  >
                    {isGateway ? (
                      <Server className="w-4 h-4 text-cyan-300" />
                    ) : isAttack ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Node Label */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-300 shadow pointer-events-none">
                    {dev.id}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom City Zone Legend */}
          <div className="relative z-10 pt-2 border-t border-slate-900 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>Wilayah: <strong>Kota Sematang Borang</strong> (Radius Mesh 12.5 KM)</span>
            <span className="font-mono text-cyan-400">Saluran Aktif: Kyber-768 / AES-256-GCM Tunnels</span>
          </div>
        </div>

        {/* Node Detail & Quick Action Panel (1 Col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            Detail Node Terpilih
          </h3>

          {hoveredNode || displayedDevices[0] ? (
            (() => {
              const node = hoveredNode || displayedDevices[0];
              const isAttack = node.status === "ATTACK";

              return (
                <div className="space-y-4 text-xs">
                  {/* Node ID Card */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-300 text-sm">{node.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          isAttack ? "bg-rose-600 text-white" : "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        }`}
                      >
                        {node.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200">{node.name}</div>
                    <div className="text-[11px] text-slate-400">{node.zone}</div>
                  </div>

                  {/* Specs & Security Details */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Protokol Enkripsi:</span>
                      <span className="text-cyan-300 font-semibold">{node.encryption}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP Gateway Link:</span>
                      <span className="text-slate-200">{node.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Packet Rate:</span>
                      <span className="text-slate-200">{node.telemetry.packetRate} pkts/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">TPM 2.0 State:</span>
                      <span className="text-emerald-400 font-bold">Terotentikasi</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Skor Anomali:</span>
                      <span className={node.anomalyScore > 50 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {node.anomalyScore}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => onRotateKey(node.id)}
                      className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Rotasi Kunci Enkripsi Sekarang</span>
                    </button>

                    {node.status === "ISOLATED" ? (
                      <button
                        onClick={() => onIsolateDevice(node.id)}
                        className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold"
                      >
                        Buka Karantina
                      </button>
                    ) : (
                      <button
                        onClick={() => onIsolateDevice(node.id)}
                        className="w-full py-2 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-200 text-xs font-bold border border-rose-600"
                      >
                        Isolasi Node Ini ke Sandbox
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <p className="text-xs text-slate-400">Arahkan kursor ke node pada peta untuk melihat telemetri.</p>
          )}
        </div>
      </div>
    </div>
  );
};
