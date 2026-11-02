export type DeviceStatus = 'SECURE' | 'DEGRADED' | 'ATTACK' | 'ISOLATED' | 'OFFLINE';

export type EncryptionType = 
  | 'AES-256-GCM' 
  | 'ChaCha20-Poly1305' 
  | 'Kyber768-AES' 
  | 'Dilithium3-ECDSA'
  | 'mTLS-1.3-Hardware';

export interface IoTDevice {
  id: string;
  name: string;
  category: 'TRAFFIC' | 'CCTV' | 'GRID' | 'WATER_FLOOD' | 'ENVIRONMENT' | 'HOSPITAL_SCADA' | 'EMERGENCY_NODE' | 'GATEWAY';
  zone: string;
  ip: string;
  mac: string;
  status: DeviceStatus;
  encryption: EncryptionType;
  keyRotationSecRemaining: number;
  firmwareVersion: string;
  firmwareHash: string;
  tpmAttested: boolean;
  anomalyScore: number; // 0 to 100
  telemetry: {
    cpu: number; // %
    memory: number; // %
    packetRate: number; // pkts/sec
    droppedPackets: number;
    latencyMs: number;
    signalDbm: number;
    voltage?: number;
    temperatureC: number;
  };
  coordinates: { x: number; y: number }; // Relative map % (0-100)
  lastSeen: string;
  activeIncidentsCount: number;
}

export interface SecurityIncident {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  zone: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  attackType: string;
  cveCode?: string;
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED';
  description: string;
  suggestedAction: string;
  mitigationScript?: string;
}

export interface LiveTelemetryPacket {
  id: string;
  timestamp: string;
  sourceNodeId: string;
  sourceNodeName: string;
  destination: string;
  algorithm: EncryptionType;
  plaintextSize: number;
  ivHex: string;
  ciphertextHex: string;
  authTagHex: string;
  entropyScore: number; // 0.0 - 8.0
  integrityVerified: boolean;
  tampered?: boolean;
}

export interface CryptoBenchmark {
  id: string;
  name: string;
  standard: string;
  keyLengthBits: number;
  quantumResistant: boolean;
  throughputMBps: number;
  encryptionLatencyUs: number;
  energyEfficiency: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  recommendedFor: string;
  securityRating: number; // 1 - 100
}

export interface AIThreatAnalysisResponse {
  summary: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  vector: string;
  cveAssociations: string[];
  quantumVulnerability: string;
  analysisDetails: string[];
  remediationSteps: string[];
}

export type ResponseActionType = 
  | 'QUARANTINE_DEVICE' 
  | 'BLOCK_IP' 
  | 'REVOKE_CREDENTIALS' 
  | 'FORCE_KEY_ROTATION' 
  | 'ISOLATE_VLAN' 
  | 'DEPLOY_EBPF_FILTER' 
  | 'RESET_FIRMWARE_STATE';

export interface ThreatTriggerCondition {
  minAnomalyScore?: number;
  severities?: ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')[];
  attackTypes?: string[];
  detectNonceCollision?: boolean;
  detectTPMFailure?: boolean;
  minPacketRate?: number;
}

export interface AutomatedPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  executionMode: 'AUTOMATIC' | 'REQUIRE_CONFIRMATION';
  trigger: ThreatTriggerCondition;
  actions: ResponseActionType[];
  cooldownSeconds: number;
  totalExecutions: number;
  lastExecuted?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface BlockedIPEntry {
  ip: string;
  reason: string;
  blockedAt: string;
  associatedNodeId: string;
  expiresAt: string;
  ruleId: string;
  packetsBlocked: number;
}

export interface QuarantinedDeviceEntry {
  deviceId: string;
  deviceName: string;
  quarantinedAt: string;
  reason: string;
  assignedVlan: number;
  ruleId: string;
  status: 'ACTIVE_ISOLATION' | 'RELEASED';
}

export interface RevokedCredentialEntry {
  id: string;
  credentialType: 'mTLS_CERT' | 'KYBER_SHARED_SECRET' | 'AES_SESSION_KEY' | 'API_TOKEN';
  targetId: string;
  targetName: string;
  revokedAt: string;
  reason: string;
  crlSerialNumber: string;
}

export interface SOARAuditRecord {
  id: string;
  timestamp: string;
  ruleId: string;
  ruleName: string;
  threatDetected: string;
  target: string;
  actionsTaken: ResponseActionType[];
  executionLatencyMs: number;
  status: 'EXECUTED' | 'BLOCKED' | 'PENDING_APPROVAL';
  details: string;
  signatureDigest: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  result: 'SUCCESS' | 'BLOCKED' | 'WARNING';
  details: string;
}

export type AnomalyPillar = 'NETWORK_TRAFFIC' | 'DEVICE_LOGS' | 'DATA_ACCESS';

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  pillar: AnomalyPillar;
  nodeId: string;
  nodeName: string;
  zone: string;
  metricName: string;
  baselineValue: string | number;
  observedValue: string | number;
  deviationPercent: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TRIGGERED' | 'ACKNOWLEDGED' | 'AUTO_MITIGATED' | 'RESOLVED';
  anomalyType: string;
  description: string;
  mitreTechnique?: string;
  suggestedAction: string;
  confidenceScore: number;
  rawSample?: string;
}

export interface AnomalyBaselineRule {
  id: string;
  pillar: AnomalyPillar;
  metric: string;
  unit: string;
  normalRangeMin: number;
  normalRangeMax: number;
  warningThreshold: number;
  criticalThreshold: number;
  sampleIntervalSec: number;
  description: string;
}

export interface AnomalyDetectionConfig {
  trafficZScoreThreshold: number;
  entropyFloor: number;
  cpuSpikeThreshold: number;
  unauthorizedAccessRate: number;
  sensitivityMode: 'STRICT' | 'BALANCED' | 'RELAXED';
  autoMitigateCritical: boolean;
  alertSoundEnabled: boolean;
}

export interface AnomalyDiagnosticsAIResponse {
  anomalyId: string;
  rootCauseAnalysis: string;
  behavioralDriftAssessment: string;
  affectedPillars: AnomalyPillar[];
  mitreMapping: {
    tactic: string;
    techniqueId: string;
    techniqueName: string;
  };
  recommendedRemediations: string[];
  urgencyLevel: 'IMMEDIATE' | 'ELEVATED' | 'MONITOR';
}

export type VoiceLanguage = 'id-ID' | 'en-US';

export interface AudibleAlertConfig {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  rate: number; // 0.5 to 2.0 (speech speed)
  pitch: number; // 0.5 to 2.0
  language: VoiceLanguage;
  voiceURI: string;
  minSeverity: 'CRITICAL' | 'HIGH' | 'ALL';
  playChime: boolean;
  repeatCriticalCount: number; // 1 or 2
  includeSuggestedAction: boolean;
}

export interface SpeechBroadcastLog {
  id: string;
  timestamp: string;
  title: string;
  speechText: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  source: 'INCIDENT' | 'ANOMALY' | 'LOCKDOWN' | 'TEST' | 'SOAR';
  targetNode?: string;
  zone?: string;
}

export type ForecastScenario = 'BASELINE_SOAR' | 'PESSIMISTIC_UNMITIGATED' | 'HARDENED_ZERO_TRUST';

export interface ThreatForecastHour {
  hourOffset: number; // 1 to 24
  timeLabel: string; // e.g. "23:00", "00:00", "01:00", ...
  hourOfDay: number; // 0 - 23
  projectedRiskScore: number; // 0 - 100
  lowerBoundCI: number; // 95% CI lower
  upperBoundCI: number; // 95% CI upper
  riskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  networkRisk: number; // 0 - 100
  deviceLogRisk: number; // 0 - 100
  dataAccessRisk: number; // 0 - 100
  projectedIncidentCount: number;
  mitigatedBySOARCount: number;
  dominantThreatVector: string;
  confidenceScore: number;
  isOffHours: boolean;
  isPeakTrafficHours: boolean;
  riskFactors: string[];
}

export interface ThreatForecastSummary {
  peakRiskScore: number;
  peakHourLabel: string;
  peakRiskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  average24hRisk: number;
  estimated24hAttacks: number;
  estimated24hMitigatedBySOAR: number;
  highestRiskPillar: AnomalyPillar;
  vulnerabilityWindow: string;
  aiEarlyWarningNotice: string;
  historicalTrendMetrics?: {
    totalHistoricalIncidents: number;
    activeIncidentCount: number;
    resolvedIncidentCount: number;
    topHistoricalVector: string;
    incidentVelocityTrend: 'ACCELERATING' | 'STABLE' | 'DECELERATING';
    correlatedSectors: string[];
    recurrentAttackSignature: string;
    historicalCorrelationConfidence: number;
  };
}

export type CampaignGroupingCriterion = 'ATTACK_PATTERN' | 'IP_SUBNET' | 'SEVERITY' | 'ZONE';

export interface ThreatCampaign {
  id: string;
  name: string;
  clusterKey: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'MITIGATING' | 'CONTAINED' | 'RESOLVED';
  attackVector: string;
  targetSubnet: string;
  sourceIpRange: string;
  targetDevices: Array<{
    deviceId: string;
    deviceName: string;
    zone: string;
    ip: string;
  }>;
  affectedDeviceCount: number;
  incidentCount: number;
  incidents: SecurityIncident[];
  cveCodes: string[];
  firstSeen: string;
  lastSeen: string;
  confidenceScore: number; // 0 - 100
  threatActorProfile?: {
    alias: string;
    originEstimate: string;
    sophistication: 'NATION_STATE' | 'ORGANIZED_CRIME' | 'AUTOMATED_BOTNET' | 'INSIDER_ANOMALY';
    primaryTTP: string;
  };
  recommendedSOARPlaybook: string;
  summaryNarrative: string;
}


