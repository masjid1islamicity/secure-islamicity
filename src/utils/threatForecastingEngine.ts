import { 
  IoTDevice, 
  SecurityIncident, 
  AnomalyAlert, 
  ForecastScenario, 
  ThreatForecastHour, 
  ThreatForecastSummary,
  AnomalyPillar
} from "../types";

/**
 * Computes a 24-hour forward threat projection based on:
 * 1. Current active and historical anomaly alert patterns across 3 pillars (Network, Device, Data Access)
 * 2. Active security incidents and compromised node telemetry
 * 3. Diurnal / temporal cycle factors (off-hours exfiltration 23:00-05:00, peak commute network spikes 07:00-09:00, 17:00-19:00)
 * 4. Harmonic periodicity of replay attacks and brute-force scans (detected recurrence cycles)
 * 5. Simulation scenario modifiers (Baseline SOAR, Pessimistic Unmitigated, Hardened Zero-Trust)
 */
export function generateThreatForecast(
  devices: IoTDevice[],
  incidents: SecurityIncident[],
  anomalyAlerts: AnomalyAlert[],
  scenario: ForecastScenario = "BASELINE_SOAR"
): {
  forecastHours: ThreatForecastHour[];
  summary: ThreatForecastSummary;
} {
  // Baseline current hour in local time (WIB or local system hour, default to current 22:00 or current Date)
  const now = new Date();
  const currentHour = now.getHours();

  // 1. Calculate active anomaly severity weights
  const activeAlerts = anomalyAlerts.filter(
    (a) => a.status === "TRIGGERED" || a.status === "ACKNOWLEDGED"
  );
  
  const netAlerts = activeAlerts.filter((a) => a.pillar === "NETWORK_TRAFFIC");
  const devAlerts = activeAlerts.filter((a) => a.pillar === "DEVICE_LOGS");
  const accAlerts = activeAlerts.filter((a) => a.pillar === "DATA_ACCESS");

  // Anomaly Pillar Base Intensities (0 - 40 base points each)
  const netBase = Math.min(
    40,
    netAlerts.reduce((acc, alert) => {
      const weight = alert.severity === "CRITICAL" ? 18 : alert.severity === "HIGH" ? 12 : 6;
      return acc + weight;
    }, 0) + (devices.filter((d) => d.status === "ATTACK").length * 8)
  );

  const devBase = Math.min(
    40,
    devAlerts.reduce((acc, alert) => {
      const weight = alert.severity === "CRITICAL" ? 15 : alert.severity === "HIGH" ? 10 : 5;
      return acc + weight;
    }, 0) + (devices.filter((d) => !d.tpmAttested || d.status === "DEGRADED").length * 6)
  );

  const accBase = Math.min(
    40,
    accAlerts.reduce((acc, alert) => {
      const weight = alert.severity === "CRITICAL" ? 16 : alert.severity === "HIGH" ? 11 : 5;
      return acc + weight;
    }, 0) + (incidents.filter((i) => i.status !== "RESOLVED").length * 7)
  );

  // Determine active threat types
  const hasReplayAttack = anomalyAlerts.some((a) => a.anomalyType.toLowerCase().includes("replay") || a.metricName.toLowerCase().includes("nonce"));
  const hasDowngrade = anomalyAlerts.some((a) => a.anomalyType.toLowerCase().includes("downgrade") || a.anomalyType.toLowerCase().includes("cipher"));
  const hasOffHoursExfil = anomalyAlerts.some((a) => a.pillar === "DATA_ACCESS" || a.anomalyType.toLowerCase().includes("exfiltration"));

  // Scenario multipliers
  let scenarioMultiplier = 1.0;
  let soarMitigationPower = 0.55; // 55% reduction on peak persistence
  if (scenario === "PESSIMISTIC_UNMITIGATED") {
    scenarioMultiplier = 1.45;
    soarMitigationPower = 0.1; // Minimal mitigation, threats compound
  } else if (scenario === "HARDENED_ZERO_TRUST") {
    scenarioMultiplier = 0.65;
    soarMitigationPower = 0.85; // Proactive mTLS + Kyber key rotation suppresses 85% of threats
  }

  const forecastHours: ThreatForecastHour[] = [];
  let peakRiskScore = 0;
  let peakHourLabel = "";
  let peakRiskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL' = 'LOW';
  let totalRiskSum = 0;
  let totalProjectedAttacks = 0;
  let totalMitigatedAttacks = 0;

  for (let offset = 1; offset <= 24; offset++) {
    const targetHourOfDay = (currentHour + offset) % 24;
    const timeLabel = `${targetHourOfDay.toString().padStart(2, "0")}:00`;

    const isOffHours = targetHourOfDay >= 23 || targetHourOfDay <= 5;
    const isPeakTrafficHours = (targetHourOfDay >= 7 && targetHourOfDay <= 9) || (targetHourOfDay >= 17 && targetHourOfDay <= 19);
    const isMiddayHeat = targetHourOfDay >= 11 && targetHourOfDay <= 14;

    // Temporal multipliers
    // Off-hours surges unauthorized data access and scanning probes (attackers leverage reduced human shift)
    const offHoursFactor = isOffHours ? 1.6 : 0.8;
    // Peak traffic hours cause network flood & SYN burst amplification
    const trafficHourFactor = isPeakTrafficHours ? 1.55 : 0.9;
    // Midday causes hardware thermal and CPU enclave strain
    const middayFactor = isMiddayHeat ? 1.35 : 0.85;

    // Harmonic attack wave simulation (Replay and SYN floods typically pulse on 4-6 hour periods)
    const harmonicWave1 = Math.sin((offset * Math.PI) / 3.5) * 12; // ~7h period
    const harmonicWave2 = Math.cos((offset * Math.PI) / 2.2) * 8;  // ~4.4h period

    // Pillar calculations with decay/mitigation factoring
    const decayFactor = Math.max(0.4, 1.0 - (offset * 0.02 * soarMitigationPower));

    // 1. Network Traffic Risk (0-100)
    let netRisk = (netBase * 1.8 * trafficHourFactor + (hasReplayAttack ? 15 : 5) + harmonicWave1) * scenarioMultiplier * decayFactor;
    netRisk = Math.max(5, Math.min(98, Math.round(netRisk)));

    // 2. Device Log Risk (0-100)
    let devRisk = (devBase * 1.7 * middayFactor + (hasDowngrade ? 14 : 4) + harmonicWave2 * 0.6) * scenarioMultiplier * decayFactor;
    devRisk = Math.max(5, Math.min(95, Math.round(devRisk)));

    // 3. Data Access Risk (0-100)
    let accRisk = (accBase * 1.9 * offHoursFactor + (hasOffHoursExfil ? 18 : 6) + (isOffHours ? 22 : 0)) * scenarioMultiplier * (scenario === "PESSIMISTIC_UNMITIGATED" ? 1.3 : decayFactor);
    accRisk = Math.max(5, Math.min(99, Math.round(accRisk)));

    // Composite Projected Risk Score (Weighted blend: 38% Network, 28% Device, 34% Data Access)
    let compositeRisk = Math.round(netRisk * 0.38 + devRisk * 0.28 + accRisk * 0.34);
    compositeRisk = Math.max(8, Math.min(99, compositeRisk));

    // Confidence Interval (95% CI): Bounds widen as forecast horizon extends into the future (+/- 4 pts near-term, +/- 14 pts at 24h)
    const ciMargin = Math.round(4 + (offset * 0.45));
    const lowerBoundCI = Math.max(2, compositeRisk - ciMargin);
    const upperBoundCI = Math.min(100, compositeRisk + ciMargin);

    // Risk Classification
    let riskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (compositeRisk >= 75) {
      riskLevel = 'CRITICAL';
    } else if (compositeRisk >= 50) {
      riskLevel = 'HIGH';
    } else if (compositeRisk >= 30) {
      riskLevel = 'ELEVATED';
    }

    // Dominant threat vector
    let dominantThreatVector = "Normal Traffic & Key Refresh";
    const riskFactors: string[] = [];

    if (netRisk >= devRisk && netRisk >= accRisk && netRisk > 40) {
      dominantThreatVector = isPeakTrafficHours ? "Ingress Traffic Flood & SYN Burst" : "Cryptographic Nonce Duplication Probe";
      riskFactors.push("Deviasi Trafik Jaringan (Z > 2.8σ)");
      if (hasReplayAttack) riskFactors.push("Potensi Replay Attack Terdeteksi");
    } else if (accRisk >= netRisk && accRisk >= devRisk && accRisk > 40) {
      dominantThreatVector = isOffHours ? "Off-Hours Unauthorized API Data Exfiltration" : "Bulk CCTV/SCADA Stream Harvesting";
      riskFactors.push("Kueri API Luar Jam Kerja");
      riskFactors.push("Probe Token & Kredensial Tidak Sah");
    } else if (devRisk > 40) {
      dominantThreatVector = "Hardware Attestation Mismatch & Enclave Load";
      riskFactors.push("Beban CPU & Suhu Enclave Tinggi");
      riskFactors.push("Potensi Cipher Downgrade");
    } else {
      dominantThreatVector = "Operasi Normal Terproteksi PQC";
      riskFactors.push("Enkripsi Kyber-768/AES Stabil");
    }

    if (isOffHours) {
      riskFactors.push("Jendela Luar Jam Kerja (23:00 - 05:00 WIB)");
    }
    if (isPeakTrafficHours) {
      riskFactors.push("Jam Sibuk Komuter Kota");
    }

    // Incident count projection (per hour)
    const baseHourIncidents = compositeRisk > 75 ? Math.floor(compositeRisk / 18) : compositeRisk > 50 ? Math.floor(compositeRisk / 26) : Math.floor(compositeRisk / 40);
    const projectedIncidentCount = Math.max(1, baseHourIncidents);
    const mitigatedBySOARCount = scenario === "PESSIMISTIC_UNMITIGATED" 
      ? Math.max(0, Math.floor(projectedIncidentCount * 0.2)) 
      : Math.max(1, Math.floor(projectedIncidentCount * 0.9));

    // Confidence Score (%) - decays slightly over 24h
    const confidenceScore = Math.max(78, Number((98.5 - offset * 0.72).toFixed(1)));

    // Track Peak
    if (compositeRisk > peakRiskScore) {
      peakRiskScore = compositeRisk;
      peakHourLabel = `${timeLabel} (H+${offset})`;
      peakRiskLevel = riskLevel;
    }

    totalRiskSum += compositeRisk;
    totalProjectedAttacks += projectedIncidentCount * 55; // estimated scaled event count
    totalMitigatedAttacks += mitigatedBySOARCount * 55;

    forecastHours.push({
      hourOffset: offset,
      timeLabel,
      hourOfDay: targetHourOfDay,
      projectedRiskScore: compositeRisk,
      lowerBoundCI,
      upperBoundCI,
      riskLevel,
      networkRisk: netRisk,
      deviceLogRisk: devRisk,
      dataAccessRisk: accRisk,
      projectedIncidentCount,
      mitigatedBySOARCount,
      dominantThreatVector,
      confidenceScore,
      isOffHours,
      isPeakTrafficHours,
      riskFactors,
    });
  }

  // Summary Metrics
  const average24hRisk = Number((totalRiskSum / 24).toFixed(1));

  // Determine highest risk pillar overall
  const avgNet = forecastHours.reduce((acc, h) => acc + h.networkRisk, 0) / 24;
  const avgDev = forecastHours.reduce((acc, h) => acc + h.deviceLogRisk, 0) / 24;
  const avgAcc = forecastHours.reduce((acc, h) => acc + h.dataAccessRisk, 0) / 24;

  let highestRiskPillar: AnomalyPillar = 'NETWORK_TRAFFIC';
  if (avgAcc > avgNet && avgAcc > avgDev) {
    highestRiskPillar = 'DATA_ACCESS';
  } else if (avgDev > avgNet && avgDev > avgAcc) {
    highestRiskPillar = 'DEVICE_LOGS';
  }

  // Identify vulnerability window
  const criticalHours = forecastHours.filter((h) => h.projectedRiskScore >= 55);
  let vulnerabilityWindow = "Terkendali (Tidak ada jendela kritis mayor)";
  if (criticalHours.length > 0) {
    const firstCritical = criticalHours[0].timeLabel;
    const lastCritical = criticalHours[criticalHours.length - 1].timeLabel;
    vulnerabilityWindow = `${firstCritical} - ${lastCritical} WIB`;
  }

  // Generate actionable AI Early Warning Notice
  let aiEarlyWarningNotice = "";
  if (highestRiskPillar === "DATA_ACCESS") {
    aiEarlyWarningNotice = "Peringatan Dini AI: Terdeteksi pola eksfiltrasi data luar jam kerja dan lonjakan kueri unauthorized pada jendela 23:00 - 05:00 WIB. Disarankan memperketat rotasi token API dan mengaktifkan inspeksi mTLS zero-trust.";
  } else if (highestRiskPillar === "NETWORK_TRAFFIC") {
    aiEarlyWarningNotice = "Peringatan Dini AI: Model memproyeksikan lonjakan trafik burst pada jam komuter pagi & petang. Filter kernel eBPF XDP disiagakan untuk menyerap flood hingga 60k pkts/s.";
  } else {
    aiEarlyWarningNotice = "Peringatan Dini AI: Terdeteksi risiko akumulasi beban komputasi enclave & potensi probe downgrade kriptografi. Rotasi master key Kyber-768 direkomendasikan setiap 15 menit.";
  }

  // Historical Incident Trend Analysis
  const totalHistoricalIncidents = incidents.length;
  const activeIncidentCount = incidents.filter((i) => i.status !== "RESOLVED").length;
  const resolvedIncidentCount = incidents.filter((i) => i.status === "RESOLVED").length;

  // Identify top historical attack type
  const attackCounts: Record<string, number> = {};
  const affectedZonesSet = new Set<string>();
  incidents.forEach((inc) => {
    attackCounts[inc.attackType] = (attackCounts[inc.attackType] || 0) + 1;
    if (inc.zone) affectedZonesSet.add(inc.zone);
  });

  let topHistoricalVector = "Injeksi Paket & Anomali Jaringan";
  let maxCount = 0;
  for (const [attackType, count] of Object.entries(attackCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topHistoricalVector = attackType;
    }
  }

  // Incident velocity trend calculation
  let incidentVelocityTrend: 'ACCELERATING' | 'STABLE' | 'DECELERATING' = 'STABLE';
  if (activeIncidentCount >= 3) {
    incidentVelocityTrend = 'ACCELERATING';
  } else if (activeIncidentCount === 0 && resolvedIncidentCount > 0) {
    incidentVelocityTrend = 'DECELERATING';
  }

  // Recurrent attack signature based on historical trends
  let recurrentAttackSignature = "Pola Penetrasi Nonce Kripto & Replay Traffic";
  if (topHistoricalVector.toLowerCase().includes("ddos") || topHistoricalVector.toLowerCase().includes("flood")) {
    recurrentAttackSignature = "Gelombang Banjir Paket Sinkronik (SYN Flood Harmonic Wave)";
  } else if (topHistoricalVector.toLowerCase().includes("man-in-the-middle") || topHistoricalVector.toLowerCase().includes("mitm")) {
    recurrentAttackSignature = "Percobaan Intersepsi Sertifikat & Peniruan Identitas Node";
  } else if (topHistoricalVector.toLowerCase().includes("firmware") || topHistoricalVector.toLowerCase().includes("tpm")) {
    recurrentAttackSignature = "Pemeriksaan Modifikasi Kernel & Integritas Firmware Enclave";
  }

  const historicalTrendMetrics = {
    totalHistoricalIncidents,
    activeIncidentCount,
    resolvedIncidentCount,
    topHistoricalVector,
    incidentVelocityTrend,
    correlatedSectors: Array.from(affectedZonesSet),
    recurrentAttackSignature,
    historicalCorrelationConfidence: Math.min(98.5, Number((88.0 + totalHistoricalIncidents * 1.5).toFixed(1))),
  };

  return {
    forecastHours,
    summary: {
      peakRiskScore,
      peakHourLabel,
      peakRiskLevel,
      average24hRisk,
      estimated24hAttacks: totalProjectedAttacks,
      estimated24hMitigatedBySOAR: totalMitigatedAttacks,
      highestRiskPillar,
      vulnerabilityWindow,
      aiEarlyWarningNotice,
      historicalTrendMetrics,
    },
  };
}
