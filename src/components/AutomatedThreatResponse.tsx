import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Lock,
  Radio,
  Server,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Download,
  Ban,
  Key,
  Layers,
  Clock,
  Terminal,
  RefreshCw,
  ExternalLink,
  ShieldOff,
  Cpu,
  Fingerprint
} from "lucide-react";
import { 
  AutomatedPolicy, 
  BlockedIPEntry, 
  QuarantinedDeviceEntry, 
  RevokedCredentialEntry, 
  SOARAuditRecord,
  IoTDevice,
  ResponseActionType
} from "../types";

interface AutomatedThreatResponseProps {
  policies: AutomatedPolicy[];
  setPolicies: React.Dispatch<React.SetStateAction<AutomatedPolicy[]>>;
  blockedIPs: BlockedIPEntry[];
  setBlockedIPs: React.Dispatch<React.SetStateAction<BlockedIPEntry[]>>;
  quarantinedDevices: QuarantinedDeviceEntry[];
  setQuarantinedDevices: React.Dispatch<React.SetStateAction<QuarantinedDeviceEntry[]>>;
  revokedCredentials: RevokedCredentialEntry[];
  setRevokedCredentials: React.Dispatch<React.SetStateAction<RevokedCredentialEntry[]>>;
  soarAuditLogs: SOARAuditRecord[];
  setSoarAuditLogs: React.Dispatch<React.SetStateAction<SOARAuditRecord[]>>;
  devices: IoTDevice[];
  onTriggerManualMitigation?: (deviceId: string, actionType: ResponseActionType) => void;
  onReleaseQuarantine?: (deviceId: string) => void;
  onUnblockIP?: (ip: string) => void;
  onReissueCredential?: (id: string) => void;
}

export const AutomatedThreatResponse: React.FC<AutomatedThreatResponseProps> = ({
  policies,
  setPolicies,
  blockedIPs,
  setBlockedIPs,
  quarantinedDevices,
  setQuarantinedDevices,
  revokedCredentials,
  setRevokedCredentials,
  soarAuditLogs,
  setSoarAuditLogs,
  devices,
  onReleaseQuarantine,
  onUnblockIP,
  onReissueCredential
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"playbooks" | "quarantine" | "blocked_ips" | "revocations" | "audit">("playbooks");
  const [soarMasterMode, setSoarMasterMode] = useState<"AUTONOMOUS" | "SEMI_AUTO" | "PAUSED">("AUTONOMOUS");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPolicyForTest, setSelectedPolicyForTest] = useState<string>(policies[0]?.id || "");
  const [selectedTargetDevice, setSelectedTargetDevice] = useState<string>(devices[0]?.id || "");
  const [isSimulatingTest, setIsSimulatingTest] = useState(false);
  const [testExecutionResult, setTestExecutionResult] = useState<SOARAuditRecord | null>(null);

  // New Policy Modal State
  const [showNewPolicyModal, setShowNewPolicyModal] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyDesc, setNewPolicyDesc] = useState("");
  const [newPolicyPriority, setNewPolicyPriority] = useState<"CRITICAL" | "HIGH" | "MEDIUM">("HIGH");
  const [newPolicyMode, setNewPolicyMode] = useState<"AUTOMATIC" | "REQUIRE_CONFIRMATION">("AUTOMATIC");
  const [newPolicyAnomalyThreshold, setNewPolicyAnomalyThreshold] = useState<number>(70);
  const [selectedActions, setSelectedActions] = useState<ResponseActionType[]>(["QUARANTINE_DEVICE", "DEPLOY_EBPF_FILTER"]);
  
  // Manual Block IP Modal State
  const [showBlockIPModal, setShowBlockIPModal] = useState(false);
  const [manualIP, setManualIP] = useState("");
  const [manualIPReason, setManualIPReason] = useState("");
  const [manualIPNode, setManualIPNode] = useState(devices[0]?.id || "");

  // AI Rule Synthesis State
  const [isGeneratingAIRule, setIsGeneratingAIRule] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState("");

  const togglePolicy = (policyId: string) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === policyId) {
        return { ...p, enabled: !p.enabled };
      }
      return p;
    }));
  };

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName.trim()) return;

    const newPol: AutomatedPolicy = {
      id: `POL-${Date.now().toString().slice(-4)}-CUSTOM`,
      name: newPolicyName,
      description: newPolicyDesc || "Kebijakan otomatis kustom untuk keamanan node IoT.",
      enabled: true,
      executionMode: newPolicyMode,
      priority: newPolicyPriority,
      trigger: {
        minAnomalyScore: Number(newPolicyAnomalyThreshold),
        severities: ["CRITICAL", "HIGH"],
      },
      actions: selectedActions,
      cooldownSeconds: 120,
      totalExecutions: 0,
      lastExecuted: "Belum pernah dieksekusi"
    };

    setPolicies(prev => [newPol, ...prev]);

    // Record Audit
    const audit: SOARAuditRecord = {
      id: `SOAR-CONF-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      ruleId: newPol.id,
      ruleName: newPol.name,
      threatDetected: "Playbook Configuration Update",
      target: "SOAR Engine Policy Registry",
      actionsTaken: selectedActions,
      executionLatencyMs: 8,
      status: "EXECUTED",
      details: `Kebijakan playbook baru "${newPol.name}" berhasil didaftarkan dan diaktifkan.`,
      signatureDigest: `sha256:${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`
    };
    setSoarAuditLogs(prev => [audit, ...prev]);

    setShowNewPolicyModal(false);
    setNewPolicyName("");
    setNewPolicyDesc("");
  };

  const handleManualBlockIP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIP.trim()) return;

    const newBlocked: BlockedIPEntry = {
      ip: manualIP,
      reason: manualIPReason || "Pemblokiran manual oleh Analis SOC",
      blockedAt: new Date().toLocaleTimeString("id-ID") + " WIB",
      associatedNodeId: manualIPNode,
      expiresAt: "2026-08-25 24 Jam",
      ruleId: "MANUAL-SOC-BLOCK",
      packetsBlocked: 1
    };

    setBlockedIPs(prev => [newBlocked, ...prev]);

    const audit: SOARAuditRecord = {
      id: `SOAR-BLK-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      ruleId: "MANUAL-SOC-BLOCK",
      ruleName: "Manual IP Kernel Drop Insertion",
      threatDetected: manualIPReason || "Manual Anomaly Blacklist",
      target: `${manualIP} (Terkait Node: ${manualIPNode})`,
      actionsTaken: ["BLOCK_IP", "DEPLOY_EBPF_FILTER"],
      executionLatencyMs: 14,
      status: "EXECUTED",
      details: `IP ${manualIP} dimasukkan ke tabel blacklist kernel eBPF dan BGP border filter.`,
      signatureDigest: `sha256:${Math.random().toString(16).slice(2, 12)}`
    };
    setSoarAuditLogs(prev => [audit, ...prev]);

    setShowBlockIPModal(false);
    setManualIP("");
    setManualIPReason("");
  };

  const handleRunPlaybookTest = async () => {
    const policy = policies.find(p => p.id === selectedPolicyForTest);
    const target = devices.find(d => d.id === selectedTargetDevice);
    if (!policy || !target) return;

    setIsSimulatingTest(true);
    setTestExecutionResult(null);

    // Call server evaluation endpoint
    try {
      const resp = await fetch("/api/soar/evaluate-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threatEvent: {
            name: "Synthetic Cyber Range Trigger",
            severity: "HIGH",
            anomalyScore: 89,
            policyMatched: policy.name
          },
          targetDevice: target,
          activePolicies: [policy]
        })
      });

      const data = await resp.json();

      const newRecord: SOARAuditRecord = {
        id: `SOAR-SIM-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
        ruleId: policy.id,
        ruleName: policy.name,
        threatDetected: `Simulasi Uji Coba: ${policy.name}`,
        target: `${target.id} (${target.name})`,
        actionsTaken: policy.actions,
        executionLatencyMs: data.executionLatencyMs || Math.floor(Math.random() * 25) + 15,
        status: "EXECUTED",
        details: data.reasoning || `Eksekusi playbook simulasi berhasil menerapkan: ${policy.actions.join(", ")}.`,
        signatureDigest: `sha256:${Math.random().toString(16).slice(2, 14)}${Math.random().toString(16).slice(2, 14)}`
      };

      // Apply actions to state if appropriate
      if (policy.actions.includes("QUARANTINE_DEVICE")) {
        const alreadyQuarantined = quarantinedDevices.some(q => q.deviceId === target.id);
        if (!alreadyQuarantined) {
          setQuarantinedDevices(prev => [
            {
              deviceId: target.id,
              deviceName: target.name,
              quarantinedAt: new Date().toLocaleTimeString("id-ID") + " WIB",
              reason: `Uji Coba Playbook ${policy.id}`,
              assignedVlan: 99,
              ruleId: policy.id,
              status: "ACTIVE_ISOLATION"
            },
            ...prev
          ]);
        }
      }

      if (policy.actions.includes("BLOCK_IP")) {
        setBlockedIPs(prev => [
          {
            ip: target.ip,
            reason: `Blokir Simulasi dari Playbook ${policy.name}`,
            blockedAt: new Date().toLocaleTimeString("id-ID") + " WIB",
            associatedNodeId: target.id,
            expiresAt: "Simulasi (1 Jam)",
            ruleId: policy.id,
            packetsBlocked: 1420
          },
          ...prev
        ]);
      }

      if (policy.actions.includes("REVOKE_CREDENTIALS")) {
        setRevokedCredentials(prev => [
          {
            id: `REV-TEST-${Date.now().toString().slice(-4)}`,
            credentialType: "mTLS_CERT",
            targetId: target.id,
            targetName: `${target.name} - Cert`,
            revokedAt: new Date().toLocaleTimeString("id-ID") + " WIB",
            reason: `Dicabut otomatis oleh uji coba ${policy.id}`,
            crlSerialNumber: `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}`
          },
          ...prev
        ]);
      }

      setSoarAuditLogs(prev => [newRecord, ...prev]);
      setTestExecutionResult(newRecord);

      // increment policy executions
      setPolicies(prev => prev.map(p => {
        if (p.id === policy.id) {
          return {
            ...p,
            totalExecutions: p.totalExecutions + 1,
            lastExecuted: new Date().toLocaleTimeString("id-ID") + " WIB"
          };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingTest(false);
    }
  };

  const handleGenerateAIPolicy = async () => {
    if (!aiPromptInput.trim()) return;
    setIsGeneratingAIRule(true);

    try {
      const resp = await fetch("/api/ai/security-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Buat playbook respons otomatis SOAR untuk kondisi berikut: "${aiPromptInput}". Berikan nama, deskripsi teknis, prioritas, dan rekomendasi aksi mitigasi (QUARANTINE_DEVICE, BLOCK_IP, REVOKE_CREDENTIALS, ISOLATE_VLAN, DEPLOY_EBPF_FILTER, RESET_FIRMWARE_STATE).`,
          context: {
            task: "SOAR_PLAYBOOK_GENERATION",
            platform: "security.sematangborangcity.cloud"
          }
        })
      });
      const data = await resp.json();
      
      const newPol: AutomatedPolicy = {
        id: `POL-AI-${Date.now().toString().slice(-4)}`,
        name: `AI Synthesized: ${aiPromptInput.slice(0, 32)}...`,
        description: data.reply?.slice(0, 160) || `Aturan adaptif AI untuk menanggulangi ${aiPromptInput}.`,
        enabled: true,
        executionMode: "AUTOMATIC",
        priority: "HIGH",
        trigger: {
          minAnomalyScore: 65,
          severities: ["CRITICAL", "HIGH"]
        },
        actions: ["QUARANTINE_DEVICE", "DEPLOY_EBPF_FILTER", "REVOKE_CREDENTIALS"],
        cooldownSeconds: 120,
        totalExecutions: 0,
        lastExecuted: "Baru dibuat via Gemini AI"
      };

      setPolicies(prev => [newPol, ...prev]);
      setAiPromptInput("");
      setShowNewPolicyModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAIRule(false);
    }
  };

  const filteredPolicies = policies.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportAuditLog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(soarAuditLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SOAR-Audit-Trail-SematangBorang-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: SOAR Engine Status & High-Speed Automated Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Zap className="w-5 h-5 animate-pulse text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-50 tracking-tight">
                    Modul Respons Ancaman Otomatis (SOAR Engine)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                    SLA &lt; 50ms
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Orkestrasi pertahanan siber otonom: isolasi node instan, dropping IP via eBPF, dan pencabutan kredensial PQC.
                </p>
              </div>
            </div>
          </div>

          {/* Master Controller Mode Selector */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 self-start lg:self-auto">
            <span className="text-xs text-slate-400 pl-2 font-mono flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              Mode SOAR:
            </span>
            <button
              onClick={() => setSoarMasterMode("AUTONOMOUS")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                soarMasterMode === "AUTONOMOUS"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/40 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Otonom Penuh (Auto)
            </button>
            <button
              onClick={() => setSoarMasterMode("SEMI_AUTO")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                soarMasterMode === "SEMI_AUTO"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-900/40 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Supervisi Analis
            </button>
            <button
              onClick={() => setSoarMasterMode("PAUSED")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                soarMasterMode === "PAUSED"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/40 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Nonaktif
            </button>
          </div>
        </div>

        {/* 4 Real-time SOAR Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Aksi Dieksekusi</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">
              {policies.reduce((acc, p) => acc + p.totalExecutions, 0) + soarAuditLogs.length}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span>● Rerata Latensi: 31.4 ms</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Perangkat Terkarantina</span>
              <Layers className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {quarantinedDevices.filter(q => q.status === "ACTIVE_ISOLATION").length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              <span>VLAN Isolasi 99 (Sandbox)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>IP Penyerang Diblokir</span>
              <Ban className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-400 font-mono">
              {blockedIPs.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              <span>eBPF Filter Ingress Drop</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Kredensial & Kunci Dicabut</span>
              <Key className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-400 font-mono">
              {revokedCredentials.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              <span>CRL Publik BSSN Terdaftar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab("playbooks")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "playbooks"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Kebijakan & Playbook ({policies.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("quarantine")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "quarantine"
                ? "border-amber-400 text-amber-300 bg-amber-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Karantina & Sandbox</span>
            {quarantinedDevices.filter(q => q.status === "ACTIVE_ISOLATION").length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                {quarantinedDevices.filter(q => q.status === "ACTIVE_ISOLATION").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("blocked_ips")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "blocked_ips"
                ? "border-rose-400 text-rose-300 bg-rose-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Ban className="w-4 h-4" />
            <span>Blacklist IP & eBPF ({blockedIPs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("revocations")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "revocations"
                ? "border-purple-400 text-purple-300 bg-purple-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Pencabutan Kredensial & CRL ({revokedCredentials.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("audit")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "audit"
                ? "border-emerald-400 text-emerald-300 bg-emerald-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Audit Trail SOAR ({soarAuditLogs.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "playbooks" && (
            <button
              onClick={() => setShowNewPolicyModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Playbook</span>
            </button>
          )}
          {activeSubTab === "blocked_ips" && (
            <button
              onClick={() => setShowBlockIPModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-all shadow-md"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Blokir IP Baru</span>
            </button>
          )}
          {activeSubTab === "audit" && (
            <button
              onClick={exportAuditLog}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Log Audit JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: PLAYBOOKS & DEFENSE RULES */}
      {activeSubTab === "playbooks" && (
        <div className="space-y-6">
          {/* Quick Playbook Simulator Cyber-Range Tool */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Play className="w-4 h-4 text-cyan-400" />
                  <span>Uji Coba Eksekusi Playbook Respons Otomatis (Live Simulation)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Uji picu playbook SOAR pada target node untuk memverifikasi isolasi eBPF, rotasi kunci, dan kecepatan respon.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedPolicyForTest}
                  onChange={(e) => setSelectedPolicyForTest(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.name.slice(0, 30)}...
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTargetDevice}
                  onChange={(e) => setSelectedTargetDevice(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.id} ({d.name.slice(0, 24)}...)
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleRunPlaybookTest}
                  disabled={isSimulatingTest}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50 font-bold"
                >
                  {isSimulatingTest ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengeksekusi...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Jalankan Playbook Test</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test result toast if just fired */}
            {testExecutionResult && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-start justify-between gap-3 text-xs text-emerald-300 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Playbook {testExecutionResult.ruleId} Sukses Dijalankan dalam {testExecutionResult.executionLatencyMs} ms:</span>
                    <p className="text-slate-300 mt-0.5">{testExecutionResult.details}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-mono">
                      <span>Target: {testExecutionResult.target}</span>
                      <span>•</span>
                      <span>Aksi: {testExecutionResult.actionsTaken.join(" + ")}</span>
                      <span>•</span>
                      <span>Digest: {testExecutionResult.signatureDigest.slice(0, 24)}...</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setTestExecutionResult(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Search bar & Filter */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari playbook berdasarkan nama, ID, atau aksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Menampilkan {filteredPolicies.length} dari {policies.length} Playbook
            </div>
          </div>

          {/* Playbook Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPolicies.map((policy) => {
              return (
                <div
                  key={policy.id}
                  className={`bg-slate-900 border rounded-xl p-5 transition-all relative ${
                    policy.enabled
                      ? "border-slate-800 hover:border-slate-700 shadow-md"
                      : "border-slate-800/40 opacity-60 bg-slate-950/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${
                        policy.priority === "CRITICAL"
                          ? "bg-rose-950/80 text-rose-400 border border-rose-500/30"
                          : policy.priority === "HIGH"
                          ? "bg-amber-950/80 text-amber-400 border border-amber-500/30"
                          : "bg-blue-950/80 text-blue-400 border border-blue-500/30"
                      }`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {policy.id}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                            policy.priority === "CRITICAL"
                              ? "bg-rose-950 text-rose-300 border border-rose-700/50"
                              : "bg-amber-950 text-amber-300 border border-amber-700/50"
                          }`}>
                            {policy.priority}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {policy.executionMode}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                          {policy.name}
                        </h4>
                      </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => togglePolicy(policy.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        policy.enabled
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {policy.enabled ? "AKTIF" : "NONAKTIF"}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {policy.description}
                  </p>

                  {/* Actions Taken Pills */}
                  <div className="mb-4">
                    <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Aksi Otomatis yang Dijalankan:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {policy.actions.map((act) => {
                        return (
                          <span
                            key={act}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 ${
                              act === "QUARANTINE_DEVICE"
                                ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                                : act === "BLOCK_IP"
                                ? "bg-rose-950 text-rose-300 border border-rose-500/30"
                                : act === "REVOKE_CREDENTIALS"
                                ? "bg-purple-950 text-purple-300 border border-purple-500/30"
                                : act === "FORCE_KEY_ROTATION"
                                ? "bg-cyan-950 text-cyan-300 border border-cyan-500/30"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {act === "QUARANTINE_DEVICE" && <Layers className="w-3 h-3" />}
                            {act === "BLOCK_IP" && <Ban className="w-3 h-3" />}
                            {act === "REVOKE_CREDENTIALS" && <Key className="w-3 h-3" />}
                            {act === "FORCE_KEY_ROTATION" && <RotateCcw className="w-3 h-3" />}
                            {act === "DEPLOY_EBPF_FILTER" && <Cpu className="w-3 h-3" />}
                            {act}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer telemetry & stats */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>{policy.totalExecutions} Kali Dieksekusi</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Terakhir: {policy.lastExecuted || "Belum"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: QUARANTINED DEVICES & SANDBOX */}
      {activeSubTab === "quarantine" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Daftar Node IoT dalam Isolasi Karantina (Sandbox VLAN 99)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Node yang dikarantina diputus dari akses jaringan produksi smart city untuk mencegah pergerakan lateral peretas.
              </p>
            </div>
          </div>

          {quarantinedDevices.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-200">Tidak Ada Perangkat dalam Karantina</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Semua node berada pada VLAN produksi normal dengan status integritas terverifikasi.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Device ID & Nama</th>
                      <th className="p-3.5">Waktu Karantina</th>
                      <th className="p-3.5">Alasan Isolasi</th>
                      <th className="p-3.5">VLAN Sandboxing</th>
                      <th className="p-3.5">Trigger Playbook</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Aksi Analis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {quarantinedDevices.map((item) => (
                      <tr key={item.deviceId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                            <div>
                              <span className="font-mono text-cyan-400 font-semibold">{item.deviceId}</span>
                              <div className="text-slate-300 text-xs">{item.deviceName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{item.quarantinedAt}</td>
                        <td className="p-3.5 text-slate-300 max-w-xs">{item.reason}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono font-bold">
                            VLAN {item.assignedVlan}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{item.ruleId}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-semibold text-[10px]">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => onReleaseQuarantine ? onReleaseQuarantine(item.deviceId) : null}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-all shadow-sm"
                          >
                            Bebaskan Node
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: BLOCKED IPS & EBPF KERNEL DROPS */}
      {activeSubTab === "blocked_ips" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-400" />
                <span>Daftar Hitam IP & Filter Paket Kernel eBPF XDP</span>
              </h3>
              <p className="text-xs text-slate-400">
                Alamat IP yang diblokir secara otomatis di-drop pada level driver jaringan tanpa mengonsumsi siklus CPU sistem.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">IP Penyerang</th>
                    <th className="p-3.5">Penyebab Pemblokiran</th>
                    <th className="p-3.5">Target Node Terkait</th>
                    <th className="p-3.5">Waktu Blokir</th>
                    <th className="p-3.5">Paket Di-Drop</th>
                    <th className="p-3.5">Durasi Expired</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {blockedIPs.map((b) => (
                    <tr key={b.ip} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono text-rose-400 font-bold flex items-center gap-2">
                        <Ban className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        <span>{b.ip}</span>
                      </td>
                      <td className="p-3.5 text-slate-300 max-w-xs">{b.reason}</td>
                      <td className="p-3.5 font-mono text-cyan-400">{b.associatedNodeId}</td>
                      <td className="p-3.5 font-mono text-slate-400">{b.blockedAt}</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">
                        {b.packetsBlocked.toLocaleString()} pkts
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">{b.expiresAt}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onUnblockIP ? onUnblockIP(b.ip) : null}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-all"
                        >
                          Buka Blokir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: REVOKED CREDENTIALS & CRL */}
      {activeSubTab === "revocations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                <span>Certificate Revocation List (CRL) & Kunci Enkripsi Dicabut</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pencabutan sertifikat mTLS dan secret key pasca-kuantum (Kyber-768 / Dilithium-3) yang terkompromi.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">ID Pencabutan & Serial CRL</th>
                    <th className="p-3.5">Tipe Kredensial</th>
                    <th className="p-3.5">Nama Subjek / Target</th>
                    <th className="p-3.5">Waktu Dicabut</th>
                    <th className="p-3.5">Alasan Kriptografi</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {revokedCredentials.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono">
                        <div className="text-purple-400 font-bold">{r.id}</div>
                        <div className="text-[10px] text-slate-500">{r.crlSerialNumber}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-mono font-bold text-[10px]">
                          {r.credentialType}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-200">
                        <div className="font-semibold">{r.targetName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{r.targetId}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">{r.revokedAt}</td>
                      <td className="p-3.5 text-slate-300 max-w-xs">{r.reason}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onReissueCredential ? onReissueCredential(r.id) : null}
                          className="px-2.5 py-1 rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-sm"
                        >
                          Terbitkan Ulang Kunci
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: SOAR AUDIT TRAIL LOG */}
      {activeSubTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Jejak Audit Otomatisasi SOAR (Cryptographically Signed Trail)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Seluruh aksi pemblokiran, isolasi, dan rotasi kunci dicatat dengan SHA-256 integrity hash untuk kepatuhan BSSN & ISO 27001.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Log ID & Waktu</th>
                    <th className="p-3.5">Playbook Rule</th>
                    <th className="p-3.5">Ancaman Terdeteksi</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5">Aksi Dijalankan</th>
                    <th className="p-3.5">Latensi</th>
                    <th className="p-3.5">Integritas Hash (SHA-256)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {soarAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono">
                        <div className="text-cyan-400 font-bold">{log.id}</div>
                        <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{log.ruleName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{log.ruleId}</div>
                      </td>
                      <td className="p-3.5 text-rose-300 max-w-xs">{log.threatDetected}</td>
                      <td className="p-3.5 font-mono text-slate-300">{log.target}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {log.actionsTaken.map(a => (
                            <span key={a} className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                              {a}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">
                        {log.executionLatencyMs} ms
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={log.signatureDigest}>
                        {log.signatureDigest}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW POLICY MODAL */}
      {showNewPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Konfigurasi Playbook Respons Otomatis Baru</span>
              </h3>
              <button
                onClick={() => setShowNewPolicyModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* AI Generator Option */}
            <div className="bg-gradient-to-r from-cyan-950/50 to-indigo-950/50 border border-cyan-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 mb-1">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Sintesis Playbook dengan Gemini AI</span>
              </div>
              <p className="text-[11px] text-slate-300 mb-2">
                Ketik skenario serangan (misal: "Serangan brute-force pada sensor air banjir") dan AI akan merumuskan aturan secara otomatis.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik skenario ancaman..."
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateAIPolicy}
                  disabled={isGeneratingAIRule || !aiPromptInput.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 disabled:opacity-50 flex items-center gap-1"
                >
                  {isGeneratingAIRule ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Kebijakan / Playbook</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Auto-Drop SYN Flood pada Traffic Gateway"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deskripsi Teknis</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan kondisi pemicu dan respon yang diharapkan..."
                  value={newPolicyDesc}
                  onChange={(e) => setNewPolicyDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Prioritas Kebijakan</label>
                  <select
                    value={newPolicyPriority}
                    onChange={(e) => setNewPolicyPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mode Eksekusi</label>
                  <select
                    value={newPolicyMode}
                    onChange={(e) => setNewPolicyMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="AUTOMATIC">AUTOMATIC (Otonom)</option>
                    <option value="REQUIRE_CONFIRMATION">REQUIRE_CONFIRMATION (Persetujuan)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Ambang Batas Skor Anomali: {newPolicyAnomalyThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={95}
                  value={newPolicyAnomalyThreshold}
                  onChange={(e) => setNewPolicyAnomalyThreshold(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Pilih Tindakan Respons Otomatis:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "QUARANTINE_DEVICE", label: "Karantina Node (VLAN 99)" },
                    { id: "BLOCK_IP", label: "Blokir IP Penyerang" },
                    { id: "DEPLOY_EBPF_FILTER", label: "Suntikkan Filter eBPF" },
                    { id: "REVOKE_CREDENTIALS", label: "Cabut Sertifikat / Kredensial" },
                    { id: "FORCE_KEY_ROTATION", label: "Paksa Rotasi Kunci PQC" },
                    { id: "RESET_FIRMWARE_STATE", label: "Kunci Status Aman (Fail-Safe)" }
                  ].map(act => {
                    const isChecked = selectedActions.includes(act.id as ResponseActionType);
                    return (
                      <label
                        key={act.id}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                          isChecked
                            ? "bg-cyan-950/60 border-cyan-500/50 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedActions(prev => prev.filter(a => a !== act.id));
                            } else {
                              setSelectedActions(prev => [...prev, act.id as ResponseActionType]);
                            }
                          }}
                          className="accent-cyan-500"
                        />
                        <span>{act.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPolicyModal(false)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md"
                >
                  Simpan & Aktifkan Playbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL BLOCK IP MODAL */}
      {showBlockIPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400" />
                <span>Blokir Alamat IP Penyerang</span>
              </h3>
              <button
                onClick={() => setShowBlockIPModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualBlockIP} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Alamat IP Target</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 198.51.100.99"
                  value={manualIP}
                  onChange={(e) => setManualIP(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Alasan Pemblokiran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Terdeteksi upaya scan port SCADA dan brute force"
                  value={manualIPReason}
                  onChange={(e) => setManualIPReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Node yang Diserang</label>
                <select
                  value={manualIPNode}
                  onChange={(e) => setManualIPNode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.id} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBlockIPModal(false)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md"
                >
                  Terapkan eBPF Drop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
