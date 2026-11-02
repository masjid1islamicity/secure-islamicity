import { IoTDevice } from "../types";

export type TimeframeOption = "1H" | "6H" | "12H" | "24H";

export interface NodeUtilizationDataPoint {
  timestamp: string; // e.g. "14:30 WIB"
  timeOffsetLabel: string; // e.g. "-45m", "-2h"
  cpu: number; // 0 - 100%
  memory: number; // 0 - 100%
  temperature: number; // °C
  cryptoLoad: number; // Cryptographic overhead %
  packetRate: number; // pkts/sec
  isAnomaly: boolean;
  eventAnnotation?: string;
}

export interface NodeUtilizationSummary {
  currentCpu: number;
  currentMemory: number;
  peakCpu: number;
  peakMemory: number;
  avgCpu: number;
  avgMemory: number;
  thermalStatus: "NORMAL" | "ELEVATED" | "CRITICAL_THROTTLING";
  oomRisk: "LOW" | "MODERATE" | "HIGH";
  cryptographicOverheadPercent: number;
  headroomMemoryPercent: number;
  activeAnomaliesCount: number;
  pqcHardwareProtected: boolean;
}

/**
 * Deterministically generates realistic time-series telemetry curve for selected critical node(s)
 */
export function generateNodeUtilizationTimeline(
  selectedNode: IoTDevice | null,
  allCriticalNodes: IoTDevice[],
  timeframe: TimeframeOption
): {
  dataPoints: NodeUtilizationDataPoint[];
  summary: NodeUtilizationSummary;
} {
  const now = new Date();
  let pointCount = 24;
  let intervalMinutes = 60; // default for 24H

  if (timeframe === "1H") {
    pointCount = 20;
    intervalMinutes = 3; // every 3 minutes
  } else if (timeframe === "6H") {
    pointCount = 24;
    intervalMinutes = 15; // every 15 minutes
  } else if (timeframe === "12H") {
    pointCount = 24;
    intervalMinutes = 30; // every 30 minutes
  } else {
    pointCount = 24;
    intervalMinutes = 60; // every 1 hour
  }

  // Base telemetry parameters
  const isAggregate = selectedNode === null;
  const baseCpu = isAggregate
    ? allCriticalNodes.length > 0
      ? allCriticalNodes.reduce((acc, n) => acc + n.telemetry.cpu, 0) / allCriticalNodes.length
      : 35
    : selectedNode.telemetry.cpu;

  const baseMemory = isAggregate
    ? allCriticalNodes.length > 0
      ? allCriticalNodes.reduce((acc, n) => acc + n.telemetry.memory, 0) / allCriticalNodes.length
      : 48
    : selectedNode.telemetry.memory;

  const baseTemp = isAggregate ? 42.5 : selectedNode.telemetry.temperatureC;
  const isAttackNode = isAggregate
    ? allCriticalNodes.some((n) => n.status === "ATTACK")
    : selectedNode.status === "ATTACK";
  const isPqc = isAggregate
    ? allCriticalNodes.some((n) => n.encryption.includes("Kyber") || n.encryption.includes("Dilithium"))
    : selectedNode.encryption.includes("Kyber") || selectedNode.encryption.includes("Dilithium");

  // Pseudo-random seed derived from node id or aggregate string
  const seedString = isAggregate ? "AGGREGATE_CRITICAL_FLEET" : `${selectedNode.id}_${selectedNode.status}`;
  let seedNum = 0;
  for (let i = 0; i < seedString.length; i++) {
    seedNum = (seedNum << 5) - seedNum + seedString.charCodeAt(i);
    seedNum |= 0;
  }
  const pseudoRandom = (step: number) => {
    const x = Math.sin(seedNum + step * 987.65) * 10000;
    return x - Math.floor(x);
  };

  const dataPoints: NodeUtilizationDataPoint[] = [];

  for (let i = pointCount - 1; i >= 0; i--) {
    const minutesAgo = i * intervalMinutes;
    const pointTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
    const hour = pointTime.getHours();
    const minute = pointTime.getMinutes();
    const timeLabel = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    let offsetLabel = "";
    if (minutesAgo === 0) offsetLabel = "Sekarang";
    else if (minutesAgo < 60) offsetLabel = `-${minutesAgo}m`;
    else offsetLabel = `-${(minutesAgo / 60).toFixed(1)}j`;

    // Daily operational workload curve (peak during business & traffic rush: 07:00-09:00 and 16:00-19:00)
    let diurnalMultiplier = 0.9;
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)) {
      diurnalMultiplier = 1.25;
    } else if (hour >= 23 || hour <= 4) {
      diurnalMultiplier = 0.75;
    }

    const jitterCpu = (pseudoRandom(i * 3 + 1) - 0.48) * 12;
    const jitterMem = (pseudoRandom(i * 3 + 2) - 0.45) * 8;

    // Simulate an attack or anomaly surge at specific past interval if node is in ATTACK or DEGRADED
    let attackSpike = 0;
    let eventNote: string | undefined = undefined;

    if (isAttackNode) {
      // Recent surge in the last 4-6 intervals
      if (i <= 6) {
        attackSpike = 28 + (6 - i) * 3;
        if (i === 4) eventNote = "DDoS SYN-Flood & Key Exchange Storm";
        else if (i === 1) eventNote = "eBPF Rate-Limiter Triggered";
      }
    } else if (i === 10 && pseudoRandom(99) > 0.6) {
      attackSpike = 14;
      eventNote = "Rotasi Kunci PQC Massal";
    }

    // Compute final CPU and Memory values within 5% - 99%
    let calculatedCpu = Math.max(5, Math.min(99, Math.round((baseCpu * diurnalMultiplier + jitterCpu + attackSpike) * 10) / 10));
    let calculatedMem = Math.max(10, Math.min(98, Math.round((baseMemory * 0.95 + jitterMem + attackSpike * 0.55) * 10) / 10));

    // Current point (i === 0) matches actual current telemetry
    if (i === 0) {
      calculatedCpu = Math.round(baseCpu * 10) / 10;
      calculatedMem = Math.round(baseMemory * 10) / 10;
    }

    // PQC & Hardware Crypto Overhead (ML-KEM / Dilithium requires 4-15% processor cycle)
    const cryptoOverhead = isPqc
      ? Math.round((calculatedCpu * 0.18 + 4.5) * 10) / 10
      : Math.round((calculatedCpu * 0.08 + 1.5) * 10) / 10;

    // Temperature closely tracks sustained CPU load
    const calculatedTemp = Math.round((baseTemp + (calculatedCpu - 35) * 0.22) * 10) / 10;

    dataPoints.push({
      timestamp: `${timeLabel} WIB`,
      timeOffsetLabel: offsetLabel,
      cpu: calculatedCpu,
      memory: calculatedMem,
      temperature: calculatedTemp,
      cryptoLoad: cryptoOverhead,
      packetRate: Math.round((isAggregate ? 8500 : selectedNode.telemetry.packetRate) * (calculatedCpu / 50)),
      isAnomaly: calculatedCpu >= 85 || calculatedMem >= 85 || Boolean(eventNote),
      eventAnnotation: eventNote,
    });
  }

  // Summary Metrics
  const cpuValues = dataPoints.map((d) => d.cpu);
  const memValues = dataPoints.map((d) => d.memory);

  const currentCpu = cpuValues[cpuValues.length - 1];
  const currentMemory = memValues[memValues.length - 1];
  const peakCpu = Math.max(...cpuValues);
  const peakMemory = Math.max(...memValues);
  const avgCpu = Math.round((cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length) * 10) / 10;
  const avgMemory = Math.round((memValues.reduce((a, b) => a + b, 0) / memValues.length) * 10) / 10;

  const currentTemp = dataPoints[dataPoints.length - 1].temperature;
  let thermalStatus: "NORMAL" | "ELEVATED" | "CRITICAL_THROTTLING" = "NORMAL";
  if (currentTemp > 65 || currentCpu > 88) thermalStatus = "CRITICAL_THROTTLING";
  else if (currentTemp > 50 || currentCpu > 70) thermalStatus = "ELEVATED";

  let oomRisk: "LOW" | "MODERATE" | "HIGH" = "LOW";
  if (currentMemory >= 85 || peakMemory >= 92) oomRisk = "HIGH";
  else if (currentMemory >= 70) oomRisk = "MODERATE";

  const cryptoOverheadPercent = dataPoints[dataPoints.length - 1].cryptoLoad;
  const headroomMemoryPercent = Math.max(0, Math.round((100 - currentMemory) * 10) / 10);
  const activeAnomaliesCount = dataPoints.filter((d) => d.isAnomaly).length;

  return {
    dataPoints,
    summary: {
      currentCpu,
      currentMemory,
      peakCpu,
      peakMemory,
      avgCpu,
      avgMemory,
      thermalStatus,
      oomRisk,
      cryptographicOverheadPercent: cryptoOverheadPercent,
      headroomMemoryPercent,
      activeAnomaliesCount,
      pqcHardwareProtected: isPqc,
    },
  };
}
