import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Radio,
  Layers,
  Server,
  AlertTriangle,
  Flame,
  Globe,
  Sparkles,
  Volume2,
  Eye,
  Crosshair,
  FileText,
  Filter,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";
import { 
  SecurityIncident, 
  IoTDevice, 
  ThreatCampaign, 
  CampaignGroupingCriterion 
} from "../types";
import { groupIncidentsIntoCampaigns } from "../utils/threatCampaignEngine";

interface ThreatCampaignsGroupProps {
  incidents: SecurityIncident[];
  devices: IoTDevice[];
  onOpenForensics: (incident: SecurityIncident) => void;
  onMitigateIncident: (incidentId: string) => void;
  onSpeakIncident?: (incident: SecurityIncident) => void;
  onDrillDownThreat?: (incident: SecurityIncident) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ThreatCampaignsGroup: React.FC<ThreatCampaignsGroupProps> = ({
  incidents,
  devices,
  onOpenForensics,
  onMitigateIncident,
  onSpeakIncident,
  onDrillDownThreat,
  onNavigateToTab,
}) => {
  const [viewMode, setViewMode] = useState<"CAMPAIGNS" | "FLAT_LIST">("CAMPAIGNS");
  const [criterion, setCriterion] = useState<CampaignGroupingCriterion>("ATTACK_PATTERN");
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [batchMitigatingId, setBatchMitigatingId] = useState<string | null>(null);

  // Group incidents using algorithm
  const campaigns = useMemo(() => {
    return groupIncidentsIntoCampaigns(incidents, devices, criterion);
  }, [incidents, devices, criterion]);

  // Set first active campaign expanded by default
  React.useEffect(() => {
    if (campaigns.length > 0) {
      setExpandedCampaigns((prev) => {
        if (Object.keys(prev).length === 0) {
          const initial: Record<string, boolean> = {};
          campaigns.forEach((c, idx) => {
            initial[c.id] = idx === 0 || c.status === "ACTIVE";
          });
          return initial;
        }
        return prev;
      });
    }
  }, [campaigns]);

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    campaigns.forEach((c) => (all[c.id] = true));
    setExpandedCampaigns(all);
  };

  const collapseAll = () => {
    setExpandedCampaigns({});
  };

  // Handle batch mitigation for entire campaign
  const handleBatchMitigateCampaign = (campaign: ThreatCampaign) => {
    setBatchMitigatingId(campaign.id);
    setTimeout(() => {
      campaign.incidents.forEach((inc) => {
        if (inc.status !== "RESOLVED") {
          onMitigateIncident(inc.id);
        }
      });
      setBatchMitigatingId(null);
    }, 600);
  };

  // Speak whole campaign summary via Web Speech API
  const handleSpeakCampaign = (campaign: ThreatCampaign) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text = `Peringatan Kampanye Ancaman. ${campaign.name}. Melibatkan ${campaign.incidentCount} insiden pada ${campaign.affectedDeviceCount} node infrastruktur. Vektor serangan: ${campaign.attackVector}. Disarankan eksekusi: ${campaign.recommendedSOARPlaybook}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } else if (onSpeakIncident && campaign.incidents[0]) {
      onSpeakIncident(campaign.incidents[0]);
    }
  };

  const activeCampaignsCount = campaigns.filter((c) => c.status === "ACTIVE").length;
  const totalAffectedNodes = new Set(campaigns.flatMap((c) => c.targetDevices.map((d) => d.deviceId))).size;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header with Title & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/30 text-rose-400">
              <Crosshair className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Klaster Kampanye Ancaman (Threat Campaigns Grouping)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-rose-300 font-mono font-bold border border-rose-700/40">
              {campaigns.length} Kampanye Teridentifikasi
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Algoritma pengelompokan insiden otomatis berdasarkan korelasi tanda tangan serangan, subnet IP target, dan pool ancaman.
          </p>
        </div>

        {/* View Switcher: Grouped Campaigns vs Flat Feed */}
        <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode("CAMPAIGNS")}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === "CAMPAIGNS"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kampanye ({campaigns.length})</span>
          </button>
          <button
            onClick={() => setViewMode("FLAT_LIST")}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === "FLAT_LIST"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daftar Log ({incidents.length})</span>
          </button>
        </div>
      </div>

      {/* Campaign Controls Bar */}
      {viewMode === "CAMPAIGNS" && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs">
          {/* Criterion Filter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3 text-cyan-400" />
              Kriteria Pengelompokan:
            </span>
            <select
              value={criterion}
              onChange={(e) => setCriterion(e.target.value as CampaignGroupingCriterion)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="ATTACK_PATTERN">Pola Serangan (Attack Signature & TTP)</option>
              <option value="IP_SUBNET">Subnet Jaringan Target (/24 Subnet)</option>
              <option value="SEVERITY">Tingkat Keparahan (Severity Tier)</option>
              <option value="ZONE">Wilayah Fisik Kota (Zone)</option>
            </select>
          </div>

          {/* Quick Stats & Expand/Collapse All Buttons */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              <strong className="text-rose-400">{activeCampaignsCount}</strong> Aktif •{" "}
              <strong className="text-cyan-300">{totalAffectedNodes}</strong> Node Terdampak
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={expandAll}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700"
              >
                Buka Semua
              </button>
              <button
                onClick={collapseAll}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700"
              >
                Tutup Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGN CARD GROUPS (COLLAPSIBLE) */}
      {viewMode === "CAMPAIGNS" ? (
        <div className="space-y-3.5">
          {campaigns.map((campaign) => {
            const isExpanded = !!expandedCampaigns[campaign.id];
            const isCritical = campaign.severity === "CRITICAL";
            const isHigh = campaign.severity === "HIGH";
            const isActive = campaign.status === "ACTIVE";
            const isMitigating = campaign.status === "MITIGATING";
            const isResolved = campaign.status === "RESOLVED";

            return (
              <div
                key={campaign.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isActive && isCritical
                    ? "bg-rose-950/25 border-rose-600/70 shadow-lg shadow-rose-950/20"
                    : isActive && isHigh
                    ? "bg-amber-950/20 border-amber-600/60 shadow-md shadow-amber-950/10"
                    : isResolved
                    ? "bg-slate-950/40 border-slate-800/80 opacity-85"
                    : "bg-slate-950/70 border-slate-800"
                }`}
              >
                {/* Collapsible Card Group Header */}
                <div
                  onClick={() => toggleCampaign(campaign.id)}
                  className="p-4 cursor-pointer hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {isActive ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
                      ) : isMitigating ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-100">
                          {campaign.name}
                        </span>
                        
                        {/* Actor Badge */}
                        {campaign.threatActorProfile && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 font-mono border border-purple-800/60 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-purple-400" />
                            {campaign.threatActorProfile.alias}
                          </span>
                        )}

                        {/* Severity Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                            isCritical
                              ? "bg-rose-900 text-rose-200 border border-rose-600"
                              : isHigh
                              ? "bg-amber-900 text-amber-200 border border-amber-600"
                              : "bg-blue-900 text-blue-200 border border-blue-600"
                          }`}
                        >
                          {campaign.severity}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                            isActive
                              ? "bg-rose-600 text-white animate-pulse"
                              : isMitigating
                              ? "bg-amber-600 text-white"
                              : "bg-emerald-800 text-emerald-100"
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>

                      {/* Subnet & Cluster Details */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span className="font-mono text-cyan-300">
                          Subnet Target: {campaign.targetSubnet}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-300">
                          Pool Sumber: {campaign.sourceIpRange}
                        </span>
                        <span>•</span>
                        <span>
                          Insiden Terhubung: <strong className="text-slate-200 font-mono">{campaign.incidentCount} Log</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Affected Nodes & Expand Chevron */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-mono font-bold text-slate-200">
                        {campaign.affectedDeviceCount} Node Target
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono">
                        Akurasi: {campaign.confidenceScore}%
                      </div>
                    </div>

                    <div className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* EXPANDED CONTENT DRAWER */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/60 p-4.5 space-y-4">
                    {/* Campaign Overview & Threat Intelligence Profiling */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                      {/* Intelligence Summary Box */}
                      <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Karakteristik & Vektor TTP (Tactics, Techniques, Procedures)</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {campaign.id}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {campaign.summaryNarrative}
                        </p>
                        
                        {/* Threat Actor Specifics */}
                        {campaign.threatActorProfile && (
                          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400">Klasifikasi Pelaku:</span>
                              <div className="font-semibold text-purple-300">
                                {campaign.threatActorProfile.alias} ({campaign.threatActorProfile.sophistication})
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400">Estimasi Asal:</span>
                              <div className="font-mono text-slate-300">
                                {campaign.threatActorProfile.originEstimate}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* SOAR Action Card */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs flex flex-col justify-between space-y-2.5">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                            Rekomendasi SOAR Playbook
                          </span>
                          <div className="font-mono text-slate-200 font-semibold text-xs mt-1">
                            {campaign.recommendedSOARPlaybook}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Mencakup isolasi firewall eBPF XDP, karantina VLAN 99, dan rotasi sertifikat mTLS.
                          </p>
                        </div>

                        {/* Batch Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          {!isResolved ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBatchMitigateCampaign(campaign);
                              }}
                              disabled={batchMitigatingId === campaign.id}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>
                                {batchMitigatingId === campaign.id
                                  ? "Menjalankan SOAR..."
                                  : "Mitigasi Seluruh Klaster"}
                              </span>
                            </button>
                          ) : (
                            <div className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Seluruh Insiden Teratasi</span>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSpeakCampaign(campaign);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-cyan-300 border border-slate-700"
                            title="Bacakan Ringkasan Narasi Kampanye"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Target Devices Impacted Pill List */}
                    <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-cyan-400" />
                          Armada Node Target dalam Kampanye Ini ({campaign.targetDevices.length}):
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          First: {campaign.firstSeen} • Last: {campaign.lastSeen}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {campaign.targetDevices.map((dev) => (
                          <div
                            key={dev.deviceId}
                            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-[11px]"
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="font-mono font-bold text-slate-200">{dev.deviceId}</span>
                            <span className="text-slate-400">({dev.deviceName})</span>
                            <span className="text-[9px] font-mono text-cyan-400 bg-slate-900 px-1 rounded">
                              {dev.ip}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Individual Child Incidents in this Campaign */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>Daftar Insiden Terkorelasi ({campaign.incidents.length}):</span>
                        {campaign.cveCodes.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">CVE Terkait:</span>
                            {campaign.cveCodes.map((cve, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/50"
                              >
                                {cve}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {campaign.incidents.map((incident) => {
                          const incResolved = incident.status === "RESOLVED";
                          return (
                            <div
                              key={incident.id}
                              className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                                incResolved
                                  ? "bg-slate-950/40 border-slate-800 text-slate-400"
                                  : incident.severity === "CRITICAL"
                                  ? "bg-rose-950/40 border-rose-500/60 text-slate-200"
                                  : "bg-slate-900 border-slate-800 text-slate-200"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-cyan-400 font-bold">
                                      {incident.id}
                                    </span>
                                    <span className="font-bold text-slate-100">
                                      {incident.attackType}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                    <span>Target: <strong className="text-slate-300">{incident.deviceName} ({incident.deviceId})</strong></span>
                                    <span>•</span>
                                    <span>{incident.zone}</span>
                                    <span>•</span>
                                    <span className="font-mono">{incident.timestamp}</span>
                                  </div>
                                </div>

                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                                    incResolved
                                      ? "bg-slate-800 text-slate-400"
                                      : "bg-rose-600 text-white"
                                  }`}
                                >
                                  {incident.status}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-300 leading-relaxed">
                                {incident.description}
                              </p>

                              {/* Action Footer for Child Incident */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                                <span className="text-slate-400">
                                  Saran: <em className="text-slate-300">{incident.suggestedAction}</em>
                                </span>

                                <div className="flex items-center gap-2">
                                  {onDrillDownThreat && (
                                    <button
                                      onClick={() => onDrillDownThreat(incident)}
                                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
                                    >
                                      <Eye className="w-3 h-3" /> Drill-Down
                                    </button>
                                  )}

                                  <button
                                    onClick={() => onOpenForensics(incident)}
                                    className="text-amber-400 hover:text-amber-300 font-semibold"
                                  >
                                    AI Forensik
                                  </button>

                                  {!incResolved && (
                                    <button
                                      onClick={() => onMitigateIncident(incident.id)}
                                      className="text-emerald-400 hover:text-emerald-300 font-semibold"
                                    >
                                      Mitigasi
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* FLAT LIST FEED FALLBACK */
        <div className="space-y-3">
          {incidents.map((incident) => {
            const isResolved = incident.status === "RESOLVED";
            return (
              <div
                key={incident.id}
                className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                  isResolved
                    ? "bg-slate-950/40 border-slate-800 text-slate-400"
                    : incident.severity === "CRITICAL"
                    ? "bg-rose-950/50 border-rose-500 text-rose-200 shadow-md shadow-rose-950/20"
                    : incident.severity === "HIGH"
                    ? "bg-rose-950/30 border-rose-500/50 text-slate-200"
                    : "bg-amber-950/30 border-amber-500/40 text-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-100">{incident.attackType}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      isResolved ? "bg-slate-800 text-slate-400" : "bg-rose-600 text-white"
                    }`}
                  >
                    {incident.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {incident.description}
                </p>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                  <span>{incident.deviceId} • {incident.timestamp}</span>

                  <div className="flex items-center gap-2">
                    {onSpeakIncident && (
                      <>
                        <button
                          onClick={() => onSpeakIncident(incident)}
                          className="text-indigo-300 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
                          title="Dengarkan Narasi Suara Ancaman"
                        >
                          <Volume2 className="w-3 h-3 text-cyan-400" /> Suara
                        </button>
                        <span>|</span>
                      </>
                    )}

                    {onDrillDownThreat && (
                      <button
                        onClick={() => onDrillDownThreat(incident)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
                      >
                        <Eye className="w-3 h-3" /> Drill-Down
                      </button>
                    )}

                    {!isResolved && (
                      <>
                        <span>|</span>
                        <button
                          onClick={() => onOpenForensics(incident)}
                          className="text-amber-400 hover:text-amber-300 font-semibold"
                        >
                          AI Forensik
                        </button>
                        <span>|</span>
                        <button
                          onClick={() => onMitigateIncident(incident.id)}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          Mitigasi
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
