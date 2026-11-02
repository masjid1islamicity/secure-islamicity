import { 
  SecurityIncident, 
  IoTDevice, 
  ThreatCampaign, 
  CampaignGroupingCriterion 
} from "../types";

/**
 * Maps known device IDs or IP subnets to human-readable network segment names
 */
function getSubnetForDevice(device?: IoTDevice, fallbackZone?: string): string {
  if (device) {
    const parts = device.ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24 (${device.zone || fallbackZone || "IoT Segment"})`;
    }
  }
  return `10.240.0.0/16 (${fallbackZone || "Infrastruktur Kota"})`;
}

/**
 * Identifies attack pattern signature key and archetype from incident description & attackType
 */
function detectAttackPatternCluster(incident: SecurityIncident): {
  clusterKey: string;
  category: string;
  campaignTitle: string;
  sourceIpRange: string;
  attackVector: string;
  actorAlias: string;
  actorOrigin: string;
  actorSophistication: 'NATION_STATE' | 'ORGANIZED_CRIME' | 'AUTOMATED_BOTNET' | 'INSIDER_ANOMALY';
  primaryTTP: string;
  soarPlaybook: string;
} {
  const text = `${incident.attackType} ${incident.description} ${incident.cveCode || ""}`.toLowerCase();

  // Pattern 1: Replay Attack & Nonce Injection / Duplication
  if (text.includes("replay") || text.includes("nonce") || text.includes("iv reuse") || text.includes("cwe-330") || text.includes("cve-2025-4192")) {
    return {
      clusterKey: "PATTERN_REPLAY_NONCE",
      category: "REPLAY_ATTACK",
      campaignTitle: "Kampanye 'Shadow Replay' (Duplikasi Nonce & Injeksi Telemetri)",
      sourceIpRange: "198.51.100.0/24 (External Botnet Pool)",
      attackVector: "MQTT-TLS Stream Replay pada Port 8883 dengan Reuse Cryptographic Nonce (IV)",
      actorAlias: "APT-MusiReplay Cluster",
      actorOrigin: "Distributed Botnet Mesh (Komando Eksternal)",
      actorSophistication: "HIGH" as any,
      primaryTTP: "Sniffing stream terenkripsi dan mereplay paket status lalu lintas untuk memicu kemacetan koridor",
      soarPlaybook: "SOAR-PB-01: Isolasi VLAN eBPF + Force Rotation Kunci Ephemeral ML-KEM-768",
    };
  }

  // Pattern 2: Cryptographic Cipher Downgrade & SSL Strip
  if (text.includes("downgrade") || text.includes("cipher") || text.includes("des") || text.includes("3des") || text.includes("rsa-1024") || text.includes("cwe-326") || text.includes("ssl strip")) {
    return {
      clusterKey: "PATTERN_CIPHER_DOWNGRADE",
      category: "CIPHER_DOWNGRADE",
      campaignTitle: "Kampanye 'Quantum Stripper' (Probe Downgrade Cipher & Bypass PQC)",
      sourceIpRange: "203.0.113.0/24 (Threat Hunting Subnet)",
      attackVector: "Manipulasi TLS Handshake ClientHello untuk Memaksa Negosiasi Algoritma Usang",
      actorAlias: "Vector-Downgrade-X",
      actorOrigin: "Targeted External Probe Cluster",
      actorSophistication: "ORGANIZED_CRIME",
      primaryTTP: "Memaksa fallback ke cipher usang non-PQC guna memfasilitasi dekripsi harvesting Store-Now-Decrypt-Later",
      soarPlaybook: "SOAR-PB-03: Kunci Strict TLS 1.3 / Kyber-768 Enclave + Publikasi CRL mTLS",
    };
  }

  // Pattern 3: SCADA & Industrial Reconnaissance / Port Scanning
  if (text.includes("scan") || text.includes("dnp3") || text.includes("modbus") || text.includes("recon") || text.includes("cwe-200") || text.includes("scada")) {
    return {
      clusterKey: "PATTERN_SCADA_RECON",
      category: "SCADA_RECONNAISSANCE",
      campaignTitle: "Kampanye 'Grid Recon' (Pemindaian Protokol Industri SCADA & Gardu PLN)",
      sourceIpRange: "45.33.32.0/24 (Global Scanner Range)",
      attackVector: "Distributed Port Probe pada DNP3 (Port 20000) & Modbus TCP (Port 502)",
      actorAlias: "GhostRecon-ICS",
      actorOrigin: "Automated Botnet Crawler",
      actorSophistication: "AUTOMATED_BOTNET",
      primaryTTP: "Reconnaissance otomatis memetakan RTU gardu listrik untuk persiapan serangan eksfiltrasi data grid",
      soarPlaybook: "SOAR-PB-04: Blokir Ingress Subnet SCADA + Aktifkan Deep Packet Inspection eBPF",
    };
  }

  // Pattern 4: Off-Hours Unauthorized Data Access & Exfiltration
  if (text.includes("exfiltration") || text.includes("akses data") || text.includes("token") || text.includes("unauthorized") || text.includes("harvesting")) {
    return {
      clusterKey: "PATTERN_DATA_EXFILTRATION",
      category: "DATA_EXFILTRATION",
      campaignTitle: "Kampanye 'Night Harvester' (Eksfiltrasi Data Stream CCTV Luar Jam Kerja)",
      sourceIpRange: "185.220.101.0/24 (Tor Exit Node Pool)",
      attackVector: "Penyalahgunaan API Key Token & Kueri Bulk Endpoint Telemetri Sensitif",
      actorAlias: "NightHarvester Group",
      actorOrigin: "Compromised Edge Cloud Proxy",
      actorSophistication: "ORGANIZED_CRIME",
      primaryTTP: "Memanfaatkan jendela luar jam kerja (23:00 - 05:00) untuk mengekstrak feed video kota",
      soarPlaybook: "SOAR-PB-02: Pencabutan Kredensial API Seketika + Rotasi Token Otonom",
    };
  }

  // Fallback: Generic Anomaly Cluster based on attack type
  const safeSlug = incident.attackType.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase().slice(0, 20);
  return {
    clusterKey: `PATTERN_${safeSlug}`,
    category: "ANOMALOUS_ATTACK",
    campaignTitle: `Kampanye '${incident.attackType}' (Klaster Insiden Terkoordinasi)`,
    sourceIpRange: "192.0.2.0/24 (Suspicious IP Range)",
    attackVector: incident.attackType,
    actorAlias: "Unknown Threat Vector",
    actorOrigin: "Suspicious Network Ingress",
    actorSophistication: "AUTOMATED_BOTNET",
    primaryTTP: incident.description,
    soarPlaybook: "SOAR-PB-GENERIC: Mitigasi Firewall eBPF & Isolasi Node",
  };
}

/**
 * Core Threat Campaign Grouping Algorithm:
 * Groups an array of SecurityIncident items into cohesive ThreatCampaign clusters.
 */
export function groupIncidentsIntoCampaigns(
  incidents: SecurityIncident[],
  devices: IoTDevice[],
  criterion: CampaignGroupingCriterion = "ATTACK_PATTERN"
): ThreatCampaign[] {
  if (!incidents || incidents.length === 0) {
    return [];
  }

  const deviceMap = new Map<string, IoTDevice>();
  devices.forEach((d) => deviceMap.set(d.id, d));

  // Map to hold clusters
  const clusterMap = new Map<string, {
    clusterKey: string;
    category: string;
    name: string;
    attackVector: string;
    sourceIpRange: string;
    threatActorProfile: any;
    recommendedSOARPlaybook: string;
    incidents: SecurityIncident[];
    targetDevices: Set<string>;
    cveCodes: Set<string>;
  }>();

  // 1. Cluster incidents
  incidents.forEach((incident) => {
    const dev = deviceMap.get(incident.deviceId);
    let groupKey = "";
    let clusterMeta: any = null;

    if (criterion === "ATTACK_PATTERN") {
      const pattern = detectAttackPatternCluster(incident);
      groupKey = pattern.clusterKey;
      clusterMeta = {
        clusterKey: pattern.clusterKey,
        category: pattern.category,
        name: pattern.campaignTitle,
        attackVector: pattern.attackVector,
        sourceIpRange: pattern.sourceIpRange,
        threatActorProfile: {
          alias: pattern.actorAlias,
          originEstimate: pattern.actorOrigin,
          sophistication: pattern.actorSophistication,
          primaryTTP: pattern.primaryTTP,
        },
        recommendedSOARPlaybook: pattern.soarPlaybook,
      };
    } else if (criterion === "IP_SUBNET") {
      const subnet = getSubnetForDevice(dev, incident.zone);
      groupKey = `SUBNET_${subnet.split(" ")[0].replace(/[^0-9.]/g, "_")}`;
      clusterMeta = {
        clusterKey: groupKey,
        category: "SUBNET_CAMPAIGN",
        name: `Kampanye Serangan Target Subnet: ${subnet}`,
        attackVector: `Serangan Terkonsentrasi pada Segmen Jaringan ${subnet}`,
        sourceIpRange: "Multi-Source External Threat IPs",
        threatActorProfile: {
          alias: `Subnet-Targeter-${groupKey.slice(0, 10)}`,
          originEstimate: "Distributed Scan & Penetration Mesh",
          sophistication: "HIGH",
          primaryTTP: `Penetrasi lateral pada subnet ${subnet}`,
        },
        recommendedSOARPlaybook: "SOAR-PB-05: Isolasi VLAN Subnet & Force Mutual TLS Handshake",
      };
    } else if (criterion === "SEVERITY") {
      groupKey = `SEV_${incident.severity}`;
      clusterMeta = {
        clusterKey: groupKey,
        category: "SEVERITY_TIER",
        name: `Klaster Ancaman Tingkat: ${incident.severity} SEVERITY`,
        attackVector: `Agregasi Insiden Prioritas ${incident.severity}`,
        sourceIpRange: "Global Botnet / Threat Ranges",
        threatActorProfile: {
          alias: `Tier-${incident.severity}-Aggregator`,
          originEstimate: "Multi-vector coordinated attacks",
          sophistication: incident.severity === "CRITICAL" ? "NATION_STATE" : "HIGH",
          primaryTTP: `Serangan terkoordinasi dengan tingkat keparahan ${incident.severity}`,
        },
        recommendedSOARPlaybook: `SOAR-PB-${incident.severity}: Eksekusi Playbook Darurat Tingkat ${incident.severity}`,
      };
    } else {
      // Group by Zone
      groupKey = `ZONE_${incident.zone.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
      clusterMeta = {
        clusterKey: groupKey,
        category: "ZONE_CAMPAIGN",
        name: `Kampanye Ancaman Wilayah: ${incident.zone}`,
        attackVector: `Serangan Bertarget Wilayah Fisik ${incident.zone}`,
        sourceIpRange: "External IP Ranges",
        threatActorProfile: {
          alias: `Zone-Attacker-${incident.zone.slice(0, 8)}`,
          originEstimate: "Regional Target Mesh",
          sophistication: "HIGH",
          primaryTTP: `Eksploitasi infrastruktur publik di ${incident.zone}`,
        },
        recommendedSOARPlaybook: "SOAR-PB-06: Isolasi Perimeter Fisik & Jaringan Wilayah",
      };
    }

    if (!clusterMap.has(groupKey)) {
      clusterMap.set(groupKey, {
        ...clusterMeta,
        incidents: [],
        targetDevices: new Set<string>(),
        cveCodes: new Set<string>(),
      });
    }

    const cluster = clusterMap.get(groupKey)!;
    cluster.incidents.push(incident);
    cluster.targetDevices.add(incident.deviceId);
    if (incident.cveCode) {
      cluster.cveCodes.add(incident.cveCode);
    }
  });

  // 2. Transform into structured ThreatCampaign objects
  const campaigns: ThreatCampaign[] = [];

  clusterMap.forEach((cluster, key) => {
    // Determine overall campaign severity (highest among incidents)
    let campaignSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (cluster.incidents.some((i) => i.severity === 'CRITICAL')) {
      campaignSeverity = 'CRITICAL';
    } else if (cluster.incidents.some((i) => i.severity === 'HIGH')) {
      campaignSeverity = 'HIGH';
    } else if (cluster.incidents.some((i) => i.severity === 'MEDIUM')) {
      campaignSeverity = 'MEDIUM';
    }

    // Determine campaign status
    let campaignStatus: 'ACTIVE' | 'MITIGATING' | 'CONTAINED' | 'RESOLVED' = 'RESOLVED';
    if (cluster.incidents.some((i) => i.status === 'ACTIVE')) {
      campaignStatus = 'ACTIVE';
    } else if (cluster.incidents.some((i) => i.status === 'MITIGATING')) {
      campaignStatus = 'MITIGATING';
    } else if (cluster.incidents.every((i) => i.status === 'RESOLVED')) {
      campaignStatus = 'RESOLVED';
    } else {
      campaignStatus = 'CONTAINED';
    }

    // Target devices details
    const targetDeviceList: Array<{
      deviceId: string;
      deviceName: string;
      zone: string;
      ip: string;
    }> = [];

    cluster.targetDevices.forEach((devId) => {
      const d = deviceMap.get(devId);
      if (d) {
        targetDeviceList.push({
          deviceId: d.id,
          deviceName: d.name,
          zone: d.zone,
          ip: d.ip,
        });
      } else {
        const inc = cluster.incidents.find((i) => i.deviceId === devId);
        targetDeviceList.push({
          deviceId: devId,
          deviceName: inc?.deviceName || devId,
          zone: inc?.zone || "Zona IoT",
          ip: "10.240.x.x",
        });
      }
    });

    // Derive target subnet from devices
    const primaryDevice = deviceMap.get(Array.from(cluster.targetDevices)[0]);
    const targetSubnet = getSubnetForDevice(primaryDevice, cluster.incidents[0]?.zone);

    // Timestamps
    const sortedTimestamps = cluster.incidents
      .map((i) => i.timestamp)
      .sort();
    const firstSeen = sortedTimestamps[0] || "Baru saja";
    const lastSeen = sortedTimestamps[sortedTimestamps.length - 1] || "Baru saja";

    // Confidence Score (higher if multiple incidents or known CVEs match)
    const confidenceScore = Math.min(99, 84 + cluster.incidents.length * 5 + (cluster.cveCodes.size > 0 ? 6 : 0));

    // Summary Narrative
    const summaryNarrative = `Kampanye terkoordinasi yang melibatkan ${cluster.incidents.length} insiden pada ${targetDeviceList.length} node infrastruktur (${targetSubnet}). Vektor utama: ${cluster.attackVector}. Pelaku disinyalir memanfaatkan pool IP ${cluster.sourceIpRange}.`;

    const campaignId = `CAMP-${new Date().getFullYear()}-${key.replace(/[^A-Z0-9]/g, "").slice(0, 8)}-${cluster.incidents.length}`;

    campaigns.push({
      id: campaignId,
      name: cluster.name,
      clusterKey: key,
      category: cluster.category,
      severity: campaignSeverity,
      status: campaignStatus,
      attackVector: cluster.attackVector,
      targetSubnet,
      sourceIpRange: cluster.sourceIpRange,
      targetDevices: targetDeviceList,
      affectedDeviceCount: targetDeviceList.length,
      incidentCount: cluster.incidents.length,
      incidents: cluster.incidents,
      cveCodes: Array.from(cluster.cveCodes),
      firstSeen,
      lastSeen,
      confidenceScore,
      threatActorProfile: cluster.threatActorProfile,
      recommendedSOARPlaybook: cluster.recommendedSOARPlaybook,
      summaryNarrative,
    });
  });

  // Sort campaigns: Active & Critical first, then by incident count
  campaigns.sort((a, b) => {
    const sevWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const statusWeight = { ACTIVE: 4, MITIGATING: 3, CONTAINED: 2, RESOLVED: 1 };

    const scoreA = statusWeight[a.status] * 10 + sevWeight[a.severity] * 5 + a.incidentCount;
    const scoreB = statusWeight[b.status] * 10 + sevWeight[b.severity] * 5 + b.incidentCount;

    return scoreB - scoreA;
  });

  return campaigns;
}
