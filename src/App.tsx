import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { DashboardOverview } from "./components/DashboardOverview";
import { AnomalyDetectionConsole } from "./components/AnomalyDetectionConsole";
import { DeviceFleetMonitor } from "./components/DeviceFleetMonitor";
import { LiveCryptoLab } from "./components/LiveCryptoLab";
import { NetworkTopologyMap } from "./components/NetworkTopologyMap";
import { ThreatSimulator } from "./components/ThreatSimulator";
import { AuditComplianceReport } from "./components/AuditComplianceReport";
import { AutomatedThreatResponse } from "./components/AutomatedThreatResponse";
import { AICopilotModal } from "./components/AICopilotModal";
import { AIThreatForensicsModal } from "./components/AIThreatForensicsModal";
import { AudibleAlertModal } from "./components/AudibleAlertModal";
import { 
  INITIAL_DEVICES, 
  INITIAL_INCIDENTS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_SOAR_POLICIES,
  INITIAL_BLOCKED_IPS,
  INITIAL_QUARANTINED_DEVICES,
  INITIAL_REVOKED_CREDENTIALS,
  INITIAL_SOAR_AUDIT_LOGS,
  INITIAL_ANOMALY_ALERTS,
  INITIAL_ANOMALY_BASELINE_RULES,
  INITIAL_ANOMALY_CONFIG,
  INITIAL_AUDIBLE_ALERT_CONFIG,
  INITIAL_SPEECH_LOGS
} from "./data/mockIoTInfrastructure";
import { 
  IoTDevice, 
  SecurityIncident, 
  AuditLogEntry,
  AutomatedPolicy,
  BlockedIPEntry,
  QuarantinedDeviceEntry,
  RevokedCredentialEntry,
  SOARAuditRecord,
  ResponseActionType,
  AnomalyAlert,
  AnomalyBaselineRule,
  AnomalyDetectionConfig,
  AudibleAlertConfig,
  SpeechBroadcastLog
} from "./types";
import {
  speakVerbalAlert,
  cancelSpeech,
  generateIncidentSpeechText,
  generateAnomalySpeechText,
  generateLockdownSpeechText
} from "./utils/speechAlertService";
import { Volume2, VolumeX, Square, Radio, Sparkles, AlertOctagon } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [devices, setDevices] = useState<IoTDevice[]>(INITIAL_DEVICES);
  const [incidents, setIncidents] = useState<SecurityIncident[]>(INITIAL_INCIDENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [emergencyLockdown, setEmergencyLockdown] = useState<boolean>(false);

  // Anomaly Detection State Management
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>(INITIAL_ANOMALY_ALERTS);
  const [baselineRules, setBaselineRules] = useState<AnomalyBaselineRule[]>(INITIAL_ANOMALY_BASELINE_RULES);
  const [anomalyConfig, setAnomalyConfig] = useState<AnomalyDetectionConfig>(INITIAL_ANOMALY_CONFIG);

  // SOAR State Management
  const [policies, setPolicies] = useState<AutomatedPolicy[]>(INITIAL_SOAR_POLICIES);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIPEntry[]>(INITIAL_BLOCKED_IPS);
  const [quarantinedDevices, setQuarantinedDevices] = useState<QuarantinedDeviceEntry[]>(INITIAL_QUARANTINED_DEVICES);
  const [revokedCredentials, setRevokedCredentials] = useState<RevokedCredentialEntry[]>(INITIAL_REVOKED_CREDENTIALS);
  const [soarAuditLogs, setSoarAuditLogs] = useState<SOARAuditRecord[]>(INITIAL_SOAR_AUDIT_LOGS);

  // Audible Alert System State Management
  const [audibleConfig, setAudibleConfig] = useState<AudibleAlertConfig>(INITIAL_AUDIBLE_ALERT_CONFIG);
  const [broadcastLogs, setBroadcastLogs] = useState<SpeechBroadcastLog[]>(INITIAL_SPEECH_LOGS);
  const [isAudibleModalOpen, setIsAudibleModalOpen] = useState<boolean>(false);
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState<boolean>(false);
  const [activeSpeakingText, setActiveSpeakingText] = useState<string>("");

  // Modals & Drawers
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [selectedIncidentForForensics, setSelectedIncidentForForensics] = useState<SecurityIncident | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copilotQuery, setCopilotQuery] = useState<string>("");

  // Ref to track latest audibleConfig in async callbacks
  const audibleConfigRef = useRef(audibleConfig);
  useEffect(() => {
    audibleConfigRef.current = audibleConfig;
  }, [audibleConfig]);

  // Countdown timer for cryptographic key rotations
  useEffect(() => {
    const timer = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.keyRotationSecRemaining <= 1) {
            return {
              ...d,
              keyRotationSecRemaining: 600, // auto reset 10 mins
            };
          }
          return {
            ...d,
            keyRotationSecRemaining: d.keyRotationSecRemaining - 1,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Compute threat level
  const attackCount = devices.filter((d) => d.status === "ATTACK").length;
  const degradedCount = devices.filter((d) => d.status === "DEGRADED").length;
  const secureCount = devices.filter((d) => d.status === "SECURE").length;

  const threatLevel: "SAFE" | "ELEVATED" | "CRITICAL" =
    attackCount > 0 ? "CRITICAL" : degradedCount > 0 ? "ELEVATED" : "SAFE";

  // Audible Alert Dispatcher
  const triggerSpeechBroadcast = (
    text: string,
    source: "INCIDENT" | "ANOMALY" | "LOCKDOWN" | "TEST" | "SOAR",
    title: string,
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" = "CRITICAL",
    targetNode?: string,
    zone?: string
  ) => {
    const cfg = audibleConfigRef.current;
    if (!cfg.enabled) return;
    if (cfg.minSeverity === "CRITICAL" && severity !== "CRITICAL") return;
    if (cfg.minSeverity === "HIGH" && severity !== "CRITICAL" && severity !== "HIGH") return;

    setActiveSpeakingText(text);
    setIsCurrentlySpeaking(true);

    const newLogEntry: SpeechBroadcastLog = {
      id: `VOX-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      title,
      speechText: text,
      source,
      severity,
      targetNode,
      zone,
    };

    setBroadcastLogs((prev) => [newLogEntry, ...prev.slice(0, 49)]);

    speakVerbalAlert(
      text,
      cfg,
      severity,
      {
        onStart: () => {
          setIsCurrentlySpeaking(true);
        },
        onEnd: () => {
          setIsCurrentlySpeaking(false);
          setActiveSpeakingText("");
        },
        onError: (err) => {
          console.warn("Speech synthesis error or cancelled:", err);
          setIsCurrentlySpeaking(false);
          setActiveSpeakingText("");
        }
      }
    );
  };

  const handleSpeakIncident = (incident: SecurityIncident) => {
    const text = generateIncidentSpeechText(incident, audibleConfig.language);
    triggerSpeechBroadcast(text, "INCIDENT", incident.attackType, incident.severity, incident.deviceId, incident.zone);
  };

  const handleSpeakAnomaly = (alert: AnomalyAlert) => {
    const text = generateAnomalySpeechText(alert, audibleConfig.language);
    triggerSpeechBroadcast(text, "ANOMALY", alert.anomalyType, alert.severity, alert.nodeId, alert.zone);
  };

  const handleSpeakLockdownToggle = (willBeActive: boolean) => {
    const text = generateLockdownSpeechText(willBeActive, audibleConfig.language);
    triggerSpeechBroadcast(text, "LOCKDOWN", "Emergency Lockdown", "CRITICAL");
  };

  const handleStopSpeech = () => {
    cancelSpeech();
    setIsCurrentlySpeaking(false);
    setActiveSpeakingText("");
  };

  const handleToggleAudibleMute = () => {
    if (isCurrentlySpeaking) {
      handleStopSpeech();
    }
    setAudibleConfig((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const handleSetEmergencyLockdown = (val: boolean | ((prev: boolean) => boolean)) => {
    setEmergencyLockdown((prev) => {
      const nextVal = typeof val === "function" ? val(prev) : val;
      handleSpeakLockdownToggle(nextVal);
      return nextVal;
    });
  };

  // Action Handlers
  const handleIsolateDevice = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, status: "ISOLATED", anomalyScore: Math.min(d.anomalyScore, 20) }
          : d
      )
    );

    const dev = devices.find((d) => d.id === deviceId);
    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      actor: "SOC Administrator",
      action: "Quarantine Isolation Enacted",
      target: `${deviceId} [${dev?.name || "Node"}]`,
      result: "BLOCKED",
      details: "Perangkat dipindahkan ke sandbox VLAN terisolasi.",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleRestoreDevice = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, status: "SECURE", anomalyScore: 2, activeIncidentsCount: 0 }
          : d
      )
    );

    // Resolve any associated incident
    setIncidents((prev) =>
      prev.map((i) =>
        i.deviceId === deviceId ? { ...i, status: "RESOLVED" } : i
      )
    );

    const dev = devices.find((d) => d.id === deviceId);
    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      actor: "SOC Security Daemon",
      action: "Node Restored to Active Mesh",
      target: `${deviceId} [${dev?.name || "Node"}]`,
      result: "SUCCESS",
      details: "Integritas node diverifikasi kembali dan digabungkan ke mesh.",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleRotateDeviceKey = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, keyRotationSecRemaining: 600 }
          : d
      )
    );

    const dev = devices.find((d) => d.id === deviceId);
    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      actor: "KMS Master Node",
      action: "Manual Ephemeral Key Rotation",
      target: `${deviceId} [${dev?.name || "Node"}]`,
      result: "SUCCESS",
      details: "Kunci sesi AES/Kyber dirotasi secara langsung melalui pertukaran Diffie-Hellman / ML-KEM.",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleVerifyTPM = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, tpmAttested: true } : d
      )
    );

    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      actor: "Hardware TPM Attestation Service",
      action: "Quote & PCR Hash Verification",
      target: deviceId,
      result: "SUCCESS",
      details: "Digest SHA-256 dan sertifikat Root of Trust 100% valid.",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleMitigateIncident = (incidentId: string) => {
    const inc = incidents.find((i) => i.id === incidentId);
    if (!inc) return;

    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status: "RESOLVED" } : i))
    );

    // Restore device
    setDevices((prev) =>
      prev.map((d) =>
        d.id === inc.deviceId
          ? {
              ...d,
              status: "SECURE",
              anomalyScore: 4,
              telemetry: {
                ...d.telemetry,
                cpu: 18,
                packetRate: d.telemetry.packetRate > 20000 ? 1200 : d.telemetry.packetRate,
                droppedPackets: 0,
              },
            }
          : d
      )
    );

    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      actor: "AI Auto-Mitigation Engine",
      action: "Incident Resolved & Firewall Deployed",
      target: inc.deviceId,
      result: "SUCCESS",
      details: `Mitigasi insiden ${incidentId} berhasil diselesaikan. Aturan eBPF diterapkan.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleTriggerAttackScenario = (
    targetDeviceId: string,
    scenarioName: string,
    description: string,
    severity: "CRITICAL" | "HIGH" | "MEDIUM"
  ) => {
    // Set device to ATTACK
    setDevices((prev) =>
      prev.map((d) =>
        d.id === targetDeviceId
          ? {
              ...d,
              status: "ATTACK",
              anomalyScore: 92,
              telemetry: {
                ...d.telemetry,
                cpu: 88,
                packetRate: d.telemetry.packetRate * 4,
                droppedPackets: 180,
              },
            }
          : d
      )
    );

    const targetDev = devices.find((d) => d.id === targetDeviceId);
    const newInc: SecurityIncident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      deviceId: targetDeviceId,
      deviceName: targetDev?.name || "Sensor Node",
      zone: targetDev?.zone || "Zona Sematang Borang",
      severity,
      attackType: scenarioName,
      status: "ACTIVE",
      description,
      suggestedAction: "Terapkan isolasi firewall eBPF dan rotasi kunci ML-KEM.",
    };

    setIncidents((prev) => [newInc, ...prev]);

    // Audible alert broadcast for detected threat
    if (audibleConfigRef.current.enabled && (audibleConfigRef.current.minSeverity !== "CRITICAL" || severity === "CRITICAL")) {
      const speechText = generateIncidentSpeechText(newInc, audibleConfigRef.current.language);
      triggerSpeechBroadcast(speechText, "INCIDENT", scenarioName, severity);
    }

    // Record IDS log
    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      actor: "Cyber Range Simulator",
      action: "Threat Scenario Injected",
      target: targetDeviceId,
      result: "BLOCKED",
      details: `Simulasi serangan "${scenarioName}" dijalankan. Sensor IDS aktif.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // AUTOMATED SOAR ENGINE EVALUATION & EXECUTION
    const autoPolicy = policies.find(p => p.enabled && p.executionMode === "AUTOMATIC");
    if (autoPolicy && targetDev) {
      // 1. Auto Quarantine
      if (autoPolicy.actions.includes("QUARANTINE_DEVICE")) {
        const notYetQuarantined = !quarantinedDevices.some(q => q.deviceId === targetDeviceId && q.status === "ACTIVE_ISOLATION");
        if (notYetQuarantined) {
          setQuarantinedDevices(prev => [
            {
              deviceId: targetDeviceId,
              deviceName: targetDev.name,
              quarantinedAt: new Date().toLocaleTimeString("id-ID") + " WIB",
              reason: `Otomatis dipicu oleh ancaman: ${scenarioName}`,
              assignedVlan: 99,
              ruleId: autoPolicy.id,
              status: "ACTIVE_ISOLATION"
            },
            ...prev
          ]);
        }
      }

      // 2. Auto Block IP
      if (autoPolicy.actions.includes("BLOCK_IP")) {
        const attackerIP = `198.51.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 250) + 1}`;
        setBlockedIPs(prev => [
          {
            ip: attackerIP,
            reason: `DDoS/Exploit Ingress terdeteksi menyerang ${targetDeviceId} (${scenarioName})`,
            blockedAt: new Date().toLocaleTimeString("id-ID") + " WIB",
            associatedNodeId: targetDeviceId,
            expiresAt: "24 Jam (eBPF XDP DROP)",
            ruleId: autoPolicy.id,
            packetsBlocked: Math.floor(Math.random() * 50000) + 12000
          },
          ...prev
        ]);
      }

      // 3. Auto Revoke Credentials & Rotate Session Secret
      if (autoPolicy.actions.includes("REVOKE_CREDENTIALS")) {
        setRevokedCredentials(prev => [
          {
            id: `REV-${Date.now().toString().slice(-4)}`,
            credentialType: "mTLS_CERT",
            targetId: targetDeviceId,
            targetName: `${targetDev.name} - Cert`,
            revokedAt: new Date().toLocaleTimeString("id-ID") + " WIB",
            reason: `Dicabut otomatis oleh ${autoPolicy.id} karena anomali ${scenarioName}`,
            crlSerialNumber: `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}`
          },
          ...prev
        ]);
      }

      // 4. Log to SOAR Audit Trail
      const soarRecord: SOARAuditRecord = {
        id: `SOAR-EXEC-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
        ruleId: autoPolicy.id,
        ruleName: autoPolicy.name,
        threatDetected: scenarioName,
        target: `${targetDeviceId} (${targetDev.name})`,
        actionsTaken: autoPolicy.actions,
        executionLatencyMs: Math.floor(Math.random() * 20) + 22,
        status: "EXECUTED",
        details: `Respons otonom SOAR mengeksekusi: ${autoPolicy.actions.join(", ")} dalam latensi < 45ms.`,
        signatureDigest: `sha256:${Math.random().toString(16).slice(2, 14)}${Math.random().toString(16).slice(2, 14)}`
      };
      setSoarAuditLogs(prev => [soarRecord, ...prev]);

      // Increment policy counter
      setPolicies(prev => prev.map(p => {
        if (p.id === autoPolicy.id) {
          return {
            ...p,
            totalExecutions: p.totalExecutions + 1,
            lastExecuted: new Date().toLocaleTimeString("id-ID") + " WIB"
          };
        }
        return p;
      }));
    }
  };

  const handleReleaseQuarantine = (deviceId: string) => {
    setQuarantinedDevices(prev => prev.filter(q => q.deviceId !== deviceId));
    handleRestoreDevice(deviceId);

    const dev = devices.find(d => d.id === deviceId);
    const audit: SOARAuditRecord = {
      id: `SOAR-REL-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      ruleId: "MANUAL-ANALYST-RELEASE",
      ruleName: "Quarantine Release & Mesh Re-integration",
      threatDetected: "Integritas Node Telah Dipulihkan",
      target: `${deviceId} [${dev?.name || "Node"}]`,
      actionsTaken: ["ISOLATE_VLAN"],
      executionLatencyMs: 12,
      status: "EXECUTED",
      details: `Node ${deviceId} berhasil dikeluarkan dari Sandbox VLAN 99 dan dikembalikan ke VLAN produksi.`,
      signatureDigest: `sha256:${Math.random().toString(16).slice(2, 14)}${Math.random().toString(16).slice(2, 14)}`
    };
    setSoarAuditLogs(prev => [audit, ...prev]);
  };

  const handleUnblockIP = (ip: string) => {
    setBlockedIPs(prev => prev.filter(b => b.ip !== ip));

    const audit: SOARAuditRecord = {
      id: `SOAR-UNBLK-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      ruleId: "MANUAL-ANALYST-UNBLOCK",
      ruleName: "Kernel eBPF Filter Removal",
      threatDetected: "Whitelisted by Security Analyst",
      target: ip,
      actionsTaken: ["BLOCK_IP"],
      executionLatencyMs: 9,
      status: "EXECUTED",
      details: `Aturan pemblokiran IP ${ip} dihapus dari kernel packet filter eBPF.`,
      signatureDigest: `sha256:${Math.random().toString(16).slice(2, 14)}`
    };
    setSoarAuditLogs(prev => [audit, ...prev]);
  };

  const handleReissueCredential = (id: string) => {
    setRevokedCredentials(prev => prev.filter(r => r.id !== id));

    const audit: SOARAuditRecord = {
      id: `SOAR-REISSUE-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      ruleId: "PQC-KMS-RENEWAL",
      ruleName: "Post-Quantum Dilithium-3 Certificate Reissuance",
      threatDetected: "Credential Reissuance Authorized",
      target: id,
      actionsTaken: ["FORCE_KEY_ROTATION"],
      executionLatencyMs: 38,
      status: "EXECUTED",
      details: `Sertifikat mTLS pasca-kuantum baru diterbitkan dan didistribusikan via jalur aman.`,
      signatureDigest: `sha256:${Math.random().toString(16).slice(2, 14)}`
    };
    setSoarAuditLogs(prev => [audit, ...prev]);
  };

  const handleMitigateAnomalyAlert = (alert: AnomalyAlert) => {
    // 1. Mark alert as AUTO_MITIGATED / RESOLVED
    setAnomalyAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id ? { ...a, status: "AUTO_MITIGATED" } : a
      )
    );

    // 2. Normalize target device
    const targetDev = devices.find((d) => d.id === alert.nodeId);
    if (targetDev) {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === alert.nodeId
            ? {
                ...d,
                status: "SECURE",
                anomalyScore: Math.max(1, Math.min(d.anomalyScore, 10)),
                telemetry: {
                  ...d.telemetry,
                  cpu: Math.min(d.telemetry.cpu, 25),
                  droppedPackets: 0,
                  packetRate: d.telemetry.packetRate > 15000 ? 1200 : d.telemetry.packetRate,
                },
              }
            : d
        )
      );
    }

    // 3. Trigger automatic SOAR execution record
    const soarRecord: SOARAuditRecord = {
      id: `SOAR-ANOM-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      ruleId: "POL-01-QUARANTINE",
      ruleName: `Autonomously Mitigate ${alert.anomalyType}`,
      threatDetected: `${alert.anomalyType} (${alert.pillar})`,
      target: `${alert.nodeId} [${alert.nodeName}]`,
      actionsTaken: ["QUARANTINE_DEVICE", "DEPLOY_EBPF_FILTER", "FORCE_KEY_ROTATION"],
      executionLatencyMs: Math.floor(18 + Math.random() * 24),
      status: "EXECUTED",
      details: `Deviasi ${alert.metricName} berhasil distabilkan ke rentang nominal (${alert.baselineValue}). Aturan filter eBPF XDP aktif dan kunci sesi PQC dirotasi.`,
      signatureDigest: `sha256:${Math.random().toString(16).slice(2, 14)}${Math.random().toString(16).slice(2, 14)}`,
    };
    setSoarAuditLogs((prev) => [soarRecord, ...prev]);

    // 4. Log to Audit Trails
    const auditRecord: AuditLogEntry = {
      id: `AUD-ANOM-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      actor: "NDR Anomaly Auto-Remediator",
      action: `Mitigate Anomaly: ${alert.anomalyType}`,
      target: alert.nodeId,
      result: "SUCCESS",
      details: `Deviasi statistik ${alert.deviationPercent}% dinetralkan ke batas normal baseline.`,
    };
    setAuditLogs((prev) => [auditRecord, ...prev]);
  };

  const handleMitigateAll = () => {
    setIncidents((prev) => prev.map((i) => ({ ...i, status: "RESOLVED" })));
    setAnomalyAlerts((prev) => prev.map((a) => ({ ...a, status: "RESOLVED" })));
    setDevices((prev) =>
      prev.map((d) => ({
        ...d,
        status: "SECURE",
        anomalyScore: 2,
        telemetry: {
          ...d.telemetry,
          cpu: 16,
          droppedPackets: 0,
          packetRate: d.telemetry.packetRate > 20000 ? 1200 : d.telemetry.packetRate,
        },
      }))
    );

    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      actor: "SOC Master Admin",
      action: "Emergency Global Mitigation Applied",
      target: "All 8 City Zones",
      result: "SUCCESS",
      details: "Seluruh anomali diselesaikan. Semua kunci sesi dirotasi.",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleRotateAllKeys = () => {
    setDevices((prev) =>
      prev.map((d) => ({
        ...d,
        keyRotationSecRemaining: 600,
      }))
    );

    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      actor: "KMS Master Node",
      action: "Fleet-Wide Ephemeral Key Rotation",
      target: "All 12 Fleet Nodes",
      result: "SUCCESS",
      details: "Seluruh kunci sesi pasca-kuantum ML-KEM-768 dan AES-256-GCM berhasil dirotasi secara simultan.",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleOpenAIConsult = (query: string) => {
    setCopilotQuery(query);
    setIsCopilotOpen(true);
  };

  const activeAnomalyCount = anomalyAlerts.filter((a) => a.status === "TRIGGERED").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCopilot={() => {
          setCopilotQuery("");
          setIsCopilotOpen(true);
        }}
        threatLevel={threatLevel}
        emergencyLockdown={emergencyLockdown}
        setEmergencyLockdown={handleSetEmergencyLockdown}
        activeAttackCount={attackCount}
        totalNodes={devices.length}
        secureNodesCount={secureCount}
        anomalyAlertCount={activeAnomalyCount}
        isAudibleAlertEnabled={audibleConfig.enabled}
        isCurrentlySpeaking={isCurrentlySpeaking}
        onOpenAudibleAlertModal={() => setIsAudibleModalOpen(true)}
        onToggleAudibleMute={handleToggleAudibleMute}
      />

      {/* Floating Active Voice Announcement Ticker */}
      {isCurrentlySpeaking && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900/95 border-2 border-indigo-500 rounded-2xl p-4 shadow-2xl shadow-indigo-950/80 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-950 border border-indigo-500/60 text-cyan-300 flex-shrink-0 animate-pulse">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-600 text-white flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-ping" />
                    SIARAN SUARA AKTIF
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {audibleConfig.language === "id-ID" ? "Bahasa Indonesia" : "English (US)"}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1.5 font-medium leading-relaxed line-clamp-3">
                  "{activeSpeakingText}"
                </p>
              </div>
            </div>

            <button
              onClick={handleStopSpeech}
              className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 transition-all flex-shrink-0"
              title="Hentikan Siaran Suara"
            >
              <Square className="w-4 h-4 fill-rose-300" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Web Speech API Hands-Free Monitoring</span>
            </div>
            <button
              onClick={() => setIsAudibleModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Pengaturan Suara →
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" && (
          <DashboardOverview
            devices={devices}
            incidents={incidents}
            anomalyAlerts={anomalyAlerts}
            auditLogs={auditLogs}
            soarAuditLogs={soarAuditLogs}
            quarantinedDevices={quarantinedDevices}
            blockedIPs={blockedIPs}
            revokedCredentials={revokedCredentials}
            emergencyLockdown={emergencyLockdown}
            onToggleLockdown={() => handleSetEmergencyLockdown((prev) => !prev)}
            onClearAllAlerts={handleMitigateAll}
            onRotateAllKeys={handleRotateAllKeys}
            onOpenForensics={(inc) => setSelectedIncidentForForensics(inc)}
            onMitigateIncident={handleMitigateIncident}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
            onSpeakIncident={handleSpeakIncident}
            onSpeakAnomaly={handleSpeakAnomaly}
          />
        )}

        {activeTab === "anomaly" && (
          <AnomalyDetectionConsole
            devices={devices}
            alerts={anomalyAlerts}
            setAlerts={setAnomalyAlerts}
            baselineRules={baselineRules}
            setBaselineRules={setBaselineRules}
            config={anomalyConfig}
            setConfig={setAnomalyConfig}
            onMitigateAlert={handleMitigateAnomalyAlert}
            onOpenAIConsult={handleOpenAIConsult}
            onSpeakAnomaly={handleSpeakAnomaly}
          />
        )}

        {activeTab === "response" && (
          <AutomatedThreatResponse
            policies={policies}
            setPolicies={setPolicies}
            blockedIPs={blockedIPs}
            setBlockedIPs={setBlockedIPs}
            quarantinedDevices={quarantinedDevices}
            setQuarantinedDevices={setQuarantinedDevices}
            revokedCredentials={revokedCredentials}
            setRevokedCredentials={setRevokedCredentials}
            soarAuditLogs={soarAuditLogs}
            setSoarAuditLogs={setSoarAuditLogs}
            devices={devices}
            onReleaseQuarantine={handleReleaseQuarantine}
            onUnblockIP={handleUnblockIP}
            onReissueCredential={handleReissueCredential}
          />
        )}

        {activeTab === "devices" && (
          <DeviceFleetMonitor
            devices={devices}
            onIsolateDevice={handleIsolateDevice}
            onRestoreDevice={handleRestoreDevice}
            onRotateDeviceKey={handleRotateDeviceKey}
            onVerifyTPM={handleVerifyTPM}
            selectedDevice={selectedDevice}
            onSelectDevice={setSelectedDevice}
            onOpenAIConsult={handleOpenAIConsult}
          />
        )}

        {activeTab === "crypto" && <LiveCryptoLab />}

        {activeTab === "topology" && (
          <NetworkTopologyMap
            devices={devices}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
            onRotateKey={handleRotateDeviceKey}
            onIsolateDevice={handleIsolateDevice}
          />
        )}

        {activeTab === "simulator" && (
          <ThreatSimulator
            devices={devices}
            onTriggerAttackScenario={handleTriggerAttackScenario}
            onMitigateAll={handleMitigateAll}
            onOpenAIConsult={handleOpenAIConsult}
          />
        )}

        {activeTab === "compliance" && (
          <AuditComplianceReport
            devices={devices}
            auditLogs={auditLogs}
            incidents={incidents}
            soarAuditLogs={soarAuditLogs}
            quarantinedDevices={quarantinedDevices}
            blockedIPs={blockedIPs}
            revokedCredentials={revokedCredentials}
            anomalyAlerts={anomalyAlerts}
            onOpenAIConsult={handleOpenAIConsult}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>security.sematangborangcity.cloud • Sovereign IoT Infrastructure</span>
          </div>
          <p className="text-[11px]">
            Protected by NIST ML-KEM-768 & AES-256-GCM Hardware AEAD • Kota Sematang Borang
          </p>
        </div>
      </footer>

      {/* AI Modals */}
      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        devices={devices}
        incidents={incidents}
        initialQuery={copilotQuery}
      />

      <AIThreatForensicsModal
        incident={selectedIncidentForForensics}
        onClose={() => setSelectedIncidentForForensics(null)}
        devices={devices}
        onMitigate={handleMitigateIncident}
      />

      {/* Audible Alert System Modal */}
      <AudibleAlertModal
        isOpen={isAudibleModalOpen}
        onClose={() => setIsAudibleModalOpen(false)}
        config={audibleConfig}
        setConfig={setAudibleConfig}
        broadcastLogs={broadcastLogs}
        setBroadcastLogs={setBroadcastLogs}
        isCurrentlySpeaking={isCurrentlySpeaking}
        setIsCurrentlySpeaking={setIsCurrentlySpeaking}
        sampleIncidents={incidents}
        sampleAnomalies={anomalyAlerts}
      />
    </div>
  );
}
