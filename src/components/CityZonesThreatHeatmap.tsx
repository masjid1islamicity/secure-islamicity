import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  Layers, 
  Radio, 
  Eye, 
  Zap, 
  Lock, 
  Activity, 
  AlertTriangle, 
  SlidersHorizontal,
  Navigation,
  Info,
  Maximize2,
  RefreshCw,
  Building2,
  Cpu
} from "lucide-react";
import { IoTDevice, SecurityIncident, DeviceStatus } from "../types";

export type HeatmapMode = "THREAT_DENSITY" | "PQC_READINESS" | "NETWORK_LOAD";

export interface ZoneData {
  id: string;
  name: string;
  shortName: string;
  sector: string;
  sectorCategory: string;
  center: [number, number]; // [x%, y%] (0-100)
  polygon: [number, number][]; // Array of [x, y] coordinates
  description: string;
  devices: IoTDevice[];
  incidents: SecurityIncident[];
  threatDensityScore: number; // 0 - 100
  threatTier: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  pqcReadinessScore: number; // 0 - 100
  networkLoadScore: number; // 0 - 100
  totalPacketRate: number;
  attackCount: number;
  degradedCount: number;
  secureCount: number;
  isolatedCount: number;
  primaryEncryption: string;
}

interface CityZonesThreatHeatmapProps {
  devices: IoTDevice[];
  incidents: SecurityIncident[];
  onOpenForensics?: (incident: SecurityIncident) => void;
  onDrillDownZone?: (zone: ZoneData) => void;
  onDrillDownDevice?: (device: IoTDevice) => void;
  onNavigateToTab?: (tab: string) => void;
}

// Fixed City Sector Geometries (Normalized 1000 x 650 coordinate space)
const CITY_ZONES_DEFINITIONS = [
  {
    id: "ZONE_UTARA",
    name: "Zona Utara - Koridor Utama",
    shortName: "Koridor Utara",
    sector: "Transportasi Cerdas & Lalu Lintas AI",
    sectorCategory: "TRAFFIC",
    center: [420, 150] as [number, number],
    polygon: [
      [300, 30], [580, 30], [640, 180], [510, 260], [330, 240], [270, 140]
    ] as [number, number][],
    description: "Koridor arteri Jalan Protokol Sematang Raya, AI traffic light controller, sensor radar kepadatan lalu lintas, dan gateway V2X.",
  },
  {
    id: "ZONE_KOMANDO",
    name: "Zona Pusat Komando (Pusat Kota)",
    shortName: "Pusat Komando",
    sector: "Inti Tata Kelola & Backbone Jaringan",
    sectorCategory: "GATEWAY",
    center: [500, 320] as [number, number],
    polygon: [
      [420, 260], [590, 250], [620, 390], [530, 430], [410, 390]
    ] as [number, number][],
    description: "Kantor Walikota & Data Center SOC Sematang Borang, root gateway kriptografi pasca-kuantum (ML-KEM), dan backbone fiber optik kota.",
  },
  {
    id: "ZONE_LANDMARK",
    name: "Zona Pusat - Landmark",
    shortName: "Pusat Landmark",
    sector: "Pengawasan Publik & Edge AI Vision",
    sectorCategory: "CCTV",
    center: [640, 260] as [number, number],
    polygon: [
      [590, 220], [750, 190], [800, 340], [670, 390], [610, 340]
    ] as [number, number][],
    description: "Bundaran Landmark Sematang, pusat keramaian publik dengan jaringan panoramic AI CCTV dan sistem face recognition edge.",
  },
  {
    id: "ZONE_SUNGAI",
    name: "Zona Aliran Sungai Borang",
    shortName: "DAS Sungai Borang",
    sector: "Hidrologi & Pengendalian Banjir SCADA",
    sectorCategory: "WATER_FLOOD",
    center: [280, 460] as [number, number],
    polygon: [
      [140, 380], [340, 350], [390, 520], [260, 610], [120, 530]
    ] as [number, number][],
    description: "Daerah Aliran Sungai (DAS) Borang, pintu air otomatis (sluice gates), sensor ultrasonik ketinggian air, dan pompa pengendali banjir.",
  },
  {
    id: "ZONE_INDUSTRI",
    name: "Zona Industri & Energi",
    shortName: "Industri & Energi",
    sector: "Gardu Induk Cerdas & Smart Grid PLN",
    sectorCategory: "GRID",
    center: [780, 480] as [number, number],
    polygon: [
      [670, 400], [860, 360], [950, 480], [880, 610], [690, 580]
    ] as [number, number][],
    description: "Kawasan Industri & Pembangkit Listrik Gardu Induk PLN Sematang, SCADA IEC 62443, proteksi transformator, dan meteran energi pintar.",
  },
  {
    id: "ZONE_MEDIS",
    name: "Zona Medis & Kesehatan",
    shortName: "Medis RSUD",
    sector: "Layanan Kesehatan & Rantai Dingin Obat",
    sectorCategory: "HOSPITAL_SCADA",
    center: [350, 310] as [number, number],
    polygon: [
      [250, 230], [390, 240], [410, 380], [300, 390], [220, 310]
    ] as [number, number][],
    description: "Kompleks RSUD Sematang Borang, sistem SCADA oksigen medis sentral, cold-chain vaksin bersertifikasi HIPAA, dan telemetri IoT kritis.",
  },
  {
    id: "ZONE_HIJAU",
    name: "Zona Ruang Terbuka Hijau",
    shortName: "Taman & Ekologi",
    sector: "Kualitas Udara & Mikroklimat",
    sectorCategory: "ENVIRONMENT",
    center: [740, 160] as [number, number],
    polygon: [
      [650, 40], [870, 50], [920, 190], [770, 210], [680, 170]
    ] as [number, number][],
    description: "Hutan Kota & Taman Wisata Sematang, sensor polusi udara ISPU (PM2.5/PM10), stasiun meteorologi cerdas, dan detektor curah hujan.",
  },
  {
    id: "ZONE_PEMUKIMAN",
    name: "Zona Pemukiman Warga Borang",
    shortName: "Pemukiman Warga",
    sector: "Pertahanan Sipil & Sirene Evakuasi",
    sectorCategory: "EMERGENCY_NODE",
    center: [190, 210] as [number, number],
    polygon: [
      [80, 90], [250, 70], [280, 230], [180, 280], [80, 210]
    ] as [number, number][],
    description: "Kawasan hunian padat penduduk, beacon sirene peringatan dini kebencanaan (EWS), dan sistem pengeras suara pertahanan sipil.",
  }
];

export const CityZonesThreatHeatmap: React.FC<CityZonesThreatHeatmapProps> = ({
  devices,
  incidents,
  onOpenForensics,
  onDrillDownZone,
  onDrillDownDevice,
  onNavigateToTab,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [activeMode, setActiveMode] = useState<HeatmapMode>("THREAT_DENSITY");
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>("ALL");
  const [hoveredZone, setHoveredZone] = useState<ZoneData | null>(null);
  const [hoveredDevice, setHoveredDevice] = useState<IoTDevice | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);
  const [showNodeLabels, setShowNodeLabels] = useState<boolean>(true);
  const [showHeatGlow, setShowHeatGlow] = useState<boolean>(true);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Compute Zone Metrics & Aggregations
  const zonesData: ZoneData[] = useMemo(() => {
    return CITY_ZONES_DEFINITIONS.map((def) => {
      // Find devices matching this zone name or category
      const zoneDevices = devices.filter((d) => {
        if (d.zone.toLowerCase().includes(def.name.toLowerCase()) || 
            def.name.toLowerCase().includes(d.zone.toLowerCase())) {
          return true;
        }
        // Fallback by category
        return d.category === def.sectorCategory;
      });

      // Find incidents matching this zone
      const zoneIncidents = incidents.filter((inc) => {
        const matchesDev = zoneDevices.some((d) => d.id === inc.deviceId);
        const matchesZoneName = inc.zone && (
          inc.zone.toLowerCase().includes(def.name.toLowerCase()) ||
          def.name.toLowerCase().includes(inc.zone.toLowerCase())
        );
        return matchesDev || matchesZoneName;
      });

      const activeZoneIncidents = zoneIncidents.filter((i) => i.status !== "RESOLVED");

      const attackCount = zoneDevices.filter((d) => d.status === "ATTACK").length;
      const degradedCount = zoneDevices.filter((d) => d.status === "DEGRADED").length;
      const secureCount = zoneDevices.filter((d) => d.status === "SECURE").length;
      const isolatedCount = zoneDevices.filter((d) => d.status === "ISOLATED").length;

      // Calculate Real-Time Threat Density Score (0 - 100)
      const avgAnomaly = zoneDevices.length > 0
        ? zoneDevices.reduce((sum, d) => sum + d.anomalyScore, 0) / zoneDevices.length
        : 0;

      let rawDensity = (avgAnomaly * 0.45) + (attackCount * 35) + (degradedCount * 12) + (activeZoneIncidents.length * 15);
      if (zoneDevices.length === 0) rawDensity = 5;
      const threatDensityScore = Math.min(100, Math.max(0, Math.round(rawDensity)));

      let threatTier: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
      if (threatDensityScore >= 75 || attackCount > 0) threatTier = "CRITICAL";
      else if (threatDensityScore >= 50) threatTier = "HIGH";
      else if (threatDensityScore >= 25 || degradedCount > 0) threatTier = "MODERATE";

      // PQC Readiness Score (0 - 100)
      const pqcCount = zoneDevices.filter((d) => 
        d.encryption.includes("Kyber") || d.encryption.includes("Dilithium")
      ).length;
      const pqcReadinessScore = zoneDevices.length > 0 
        ? Math.round((pqcCount / zoneDevices.length) * 100) 
        : 85;

      // Network Load Score (0 - 100)
      const totalPacketRate = zoneDevices.reduce((sum, d) => sum + (d.telemetry?.packetRate || 0), 0);
      const networkLoadScore = Math.min(100, Math.round((totalPacketRate / 50000) * 100));

      const primaryEncryption = zoneDevices[0]?.encryption || "Kyber768-AES";

      return {
        ...def,
        devices: zoneDevices,
        incidents: zoneIncidents,
        threatDensityScore,
        threatTier,
        pqcReadinessScore,
        networkLoadScore,
        totalPacketRate,
        attackCount,
        degradedCount,
        secureCount,
        isolatedCount,
        primaryEncryption,
      };
    });
  }, [devices, incidents]);

  // Overall City Threat Stats
  const citySummary = useMemo(() => {
    const criticalZones = zonesData.filter((z) => z.threatTier === "CRITICAL").length;
    const highZones = zonesData.filter((z) => z.threatTier === "HIGH").length;
    const avgThreatDensity = Math.round(
      zonesData.reduce((sum, z) => sum + z.threatDensityScore, 0) / zonesData.length
    );
    const highestThreatZone = [...zonesData].sort((a, b) => b.threatDensityScore - a.threatDensityScore)[0];

    return {
      criticalZones,
      highZones,
      avgThreatDensity,
      highestThreatZone,
    };
  }, [zonesData]);

  // Render D3 Visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clean previous render

    const width = 1000;
    const height = 650;

    // Create defs for filters, patterns, and gradients
    const defs = svg.append("defs");

    // Heatmap Gaussian Blur Filter
    const filter = defs.append("filter")
      .attr("id", "heat-blur")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "35")
      .attr("result", "blur");

    // Glow Filter for Attack Nodes
    const glowFilter = defs.append("filter")
      .attr("id", "node-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "6")
      .attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Grid Pattern for Cyberpunk HUD background
    const pattern = defs.append("pattern")
      .attr("id", "cyber-grid")
      .attr("width", 30)
      .attr("height", 30)
      .attr("patternUnits", "userSpaceOnUse");
    
    pattern.append("path")
      .attr("d", "M 30 0 L 0 0 0 30")
      .attr("fill", "none")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", "0.5")
      .attr("opacity", "0.4");

    // D3 Color Scales
    // 1. Threat Scale: Emerald (#059669) -> Cyan (#0891b2) -> Amber (#d97706) -> Rose (#e11d48) -> Deep Red (#881337)
    const threatColorInterpolator = (t: number) => {
      if (t < 0.25) return d3.interpolateRgb("#064e3b", "#0284c7")(t / 0.25);
      if (t < 0.55) return d3.interpolateRgb("#0284c7", "#d97706")((t - 0.25) / 0.3);
      if (t < 0.8) return d3.interpolateRgb("#d97706", "#f43f5e")((t - 0.55) / 0.25);
      return d3.interpolateRgb("#f43f5e", "#991b1b")((t - 0.8) / 0.2);
    };

    // 2. PQC Scale: Slate -> Indigo -> Violet -> Fuchsia -> Cyan
    const pqcColorInterpolator = d3.interpolatePurples;

    // 3. Network Load Scale: Blue -> Cyan -> Teal -> Emerald
    const loadColorInterpolator = d3.interpolateViridis;

    // SVG Root Container with Cyber Grid
    const rootG = svg.append("g");

    // Background Grid
    rootG.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#090d16");

    rootG.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#cyber-grid)");

    // Natural Feature: Sungai Borang River Stream (Curved D3 Path)
    const riverLine = d3.line<[number, number]>()
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    const riverCoords: [number, number][] = [
      [90, 620],
      [220, 520],
      [360, 440],
      [490, 360],
      [580, 240],
      [680, 110],
      [820, 40],
      [920, 10]
    ];

    // River background flow
    rootG.append("path")
      .attr("d", riverLine(riverCoords))
      .attr("fill", "none")
      .attr("stroke", "#0284c7")
      .attr("stroke-width", "28")
      .attr("stroke-linecap", "round")
      .attr("opacity", "0.15")
      .attr("filter", "url(#heat-blur)");

    rootG.append("path")
      .attr("d", riverLine(riverCoords))
      .attr("fill", "none")
      .attr("stroke", "#0369a1")
      .attr("stroke-width", "12")
      .attr("stroke-linecap", "round")
      .attr("opacity", "0.35");

    rootG.append("path")
      .attr("d", riverLine(riverCoords))
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", "2")
      .attr("stroke-dasharray", "8,12")
      .attr("opacity", "0.6");

    // City Major Arterial Roads / Grid Interconnects
    const roadNetwork: [number, number][][] = [
      [[180, 200], [420, 150], [740, 160], [860, 180]],
      [[420, 150], [500, 320], [780, 480]],
      [[190, 210], [350, 310], [500, 320], [640, 260]],
      [[280, 460], [350, 310], [420, 150]],
      [[500, 320], [280, 460]],
      [[640, 260], [780, 480]],
      [[640, 260], [740, 160]]
    ];

    roadNetwork.forEach((coords) => {
      rootG.append("path")
        .attr("d", riverLine(coords))
        .attr("fill", "none")
        .attr("stroke", "#334155")
        .attr("stroke-width", "3")
        .attr("opacity", "0.4");

      rootG.append("path")
        .attr("d", riverLine(coords))
        .attr("fill", "none")
        .attr("stroke", "#64748b")
        .attr("stroke-width", "1")
        .attr("stroke-dasharray", "4,6")
        .attr("opacity", "0.5");
    });

    // Layer 1: Heatmap Density Blobs (Generated using D3 Radial Gradients & Blurs)
    if (showHeatGlow) {
      const heatGroup = rootG.append("g").attr("class", "heatmap-layer");

      zonesData.forEach((zone, idx) => {
        if (selectedSectorFilter !== "ALL" && zone.sectorCategory !== selectedSectorFilter) return;

        let metricNormalized = zone.threatDensityScore / 100;
        if (activeMode === "PQC_READINESS") metricNormalized = zone.pqcReadinessScore / 100;
        if (activeMode === "NETWORK_LOAD") metricNormalized = zone.networkLoadScore / 100;

        let color = threatColorInterpolator(metricNormalized);
        if (activeMode === "PQC_READINESS") color = pqcColorInterpolator(metricNormalized);
        if (activeMode === "NETWORK_LOAD") color = loadColorInterpolator(metricNormalized);

        const radialGradId = `heat-grad-${idx}`;
        const grad = defs.append("radialGradient")
          .attr("id", radialGradId)
          .attr("cx", "50%")
          .attr("cy", "50%")
          .attr("r", "50%");

        grad.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", color)
          .attr("stop-opacity", 0.6 + metricNormalized * 0.3);

        grad.append("stop")
          .attr("offset", "60%")
          .attr("stop-color", color)
          .attr("stop-opacity", 0.25);

        grad.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", color)
          .attr("stop-opacity", "0");

        const radius = 90 + metricNormalized * 65;

        heatGroup.append("circle")
          .attr("cx", zone.center[0])
          .attr("cy", zone.center[1])
          .attr("r", radius)
          .attr("fill", `url(#${radialGradId})`)
          .attr("filter", "url(#heat-blur)")
          .style("mix-blend-mode", "screen");
      });
    }

    // Layer 2: Zone Boundary Polygons & Interactive Slices
    const zonesGroup = rootG.append("g").attr("class", "zones-polygon-layer");

    zonesData.forEach((zone) => {
      const isFilteredOut = selectedSectorFilter !== "ALL" && zone.sectorCategory !== selectedSectorFilter;
      const isSelected = selectedZone?.id === zone.id;
      const isHovered = hoveredZone?.id === zone.id;

      let metricVal = zone.threatDensityScore;
      let strokeColor = "#38bdf8";
      let fillColor = "#0f172a";

      if (activeMode === "THREAT_DENSITY") {
        if (zone.threatTier === "CRITICAL") {
          strokeColor = "#f43f5e";
          fillColor = "#881337";
        } else if (zone.threatTier === "HIGH") {
          strokeColor = "#fb923c";
          fillColor = "#7c2d12";
        } else if (zone.threatTier === "MODERATE") {
          strokeColor = "#eab308";
          fillColor = "#451a03";
        } else {
          strokeColor = "#10b981";
          fillColor = "#064e3b";
        }
      } else if (activeMode === "PQC_READINESS") {
        strokeColor = "#a855f7";
        fillColor = "#3b0764";
      } else {
        strokeColor = "#06b6d4";
        fillColor = "#083344";
      }

      // Convert polygon points to SVG path string
      const polygonPath = zone.polygon.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") + " Z";

      const zonePolygon = zonesGroup.append("path")
        .attr("d", polygonPath)
        .attr("fill", fillColor)
        .attr("fill-opacity", isFilteredOut ? 0.05 : (isSelected ? 0.45 : (isHovered ? 0.35 : 0.18)))
        .attr("stroke", strokeColor)
        .attr("stroke-width", isSelected ? 2.5 : (isHovered ? 2 : 1.2))
        .attr("stroke-dasharray", isSelected ? "none" : (zone.threatTier === "CRITICAL" ? "6,3" : "none"))
        .attr("stroke-opacity", isFilteredOut ? 0.2 : (isSelected ? 1 : (isHovered ? 0.9 : 0.6)))
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease");

      // Interactive Events
      zonePolygon
        .on("mouseenter", function (event) {
          setHoveredZone(zone);
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: mx, y: my });
        })
        .on("mousemove", function (event) {
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: mx, y: my });
        })
        .on("mouseleave", function () {
          setHoveredZone(null);
          setTooltipPos(null);
        })
        .on("click", function () {
          setSelectedZone(zone);
          if (onDrillDownZone) {
            onDrillDownZone(zone);
          }
        });

      // Zone Label & Metric Badge
      if (showNodeLabels && !isFilteredOut) {
        const labelG = zonesGroup.append("g")
          .attr("transform", `translate(${zone.center[0]}, ${zone.center[1] - 25})`)
          .style("pointer-events", "none");

        // Sector Badge
        labelG.append("rect")
          .attr("x", -65)
          .attr("y", -14)
          .attr("width", 130)
          .attr("height", 24)
          .attr("rx", 6)
          .attr("fill", "#020617")
          .attr("fill-opacity", "0.85")
          .attr("stroke", strokeColor)
          .attr("stroke-width", "1")
          .attr("stroke-opacity", "0.7");

        labelG.append("text")
          .attr("text-anchor", "middle")
          .attr("y", 2)
          .attr("fill", "#f8fafc")
          .attr("font-size", "10px")
          .attr("font-weight", "bold")
          .attr("font-family", "ui-sans-serif, system-ui, sans-serif")
          .text(zone.shortName);

        // Value Indicator Pill
        const subLabelG = zonesGroup.append("g")
          .attr("transform", `translate(${zone.center[0]}, ${zone.center[1] + 12})`)
          .style("pointer-events", "none");

        let pillText = `Ancaman: ${zone.threatDensityScore}%`;
        let pillColor = strokeColor;
        if (activeMode === "PQC_READINESS") pillText = `PQC: ${zone.pqcReadinessScore}%`;
        if (activeMode === "NETWORK_LOAD") pillText = `${(zone.totalPacketRate / 1000).toFixed(1)}k pkt/s`;

        subLabelG.append("rect")
          .attr("x", -48)
          .attr("y", -9)
          .attr("width", 96)
          .attr("height", 18)
          .attr("rx", 4)
          .attr("fill", "#0f172a")
          .attr("fill-opacity", "0.9")
          .attr("stroke", pillColor)
          .attr("stroke-width", "0.8");

        subLabelG.append("text")
          .attr("text-anchor", "middle")
          .attr("y", 4)
          .attr("fill", pillColor)
          .attr("font-size", "9px")
          .attr("font-weight", "600")
          .attr("font-family", "monospace")
          .text(pillText);
      }
    });

    // Layer 3: IoT Device Physical Nodes & Pulse Indicators
    const nodesGroup = rootG.append("g").attr("class", "device-nodes-layer");

    devices.forEach((dev) => {
      // Convert coordinates (0-100%) to SVG (1000 x 650)
      const nx = (dev.coordinates?.x || 50) * 10;
      const ny = (dev.coordinates?.y || 50) * 6.5;

      const isAttack = dev.status === "ATTACK";
      const isDegraded = dev.status === "DEGRADED";
      const isIsolated = dev.status === "ISOLATED";
      const isSecure = dev.status === "SECURE";

      const nodeColor = isAttack 
        ? "#f43f5e" 
        : isDegraded 
        ? "#f59e0b" 
        : isIsolated 
        ? "#a855f7" 
        : "#10b981";

      const nodeG = nodesGroup.append("g")
        .attr("transform", `translate(${nx}, ${ny})`)
        .style("cursor", "pointer");

      // Attack Animation Rings
      if (isAttack) {
        nodeG.append("circle")
          .attr("r", 18)
          .attr("fill", "none")
          .attr("stroke", "#f43f5e")
          .attr("stroke-width", "2")
          .attr("opacity", "0.8")
          .append("animate")
          .attr("attributeName", "r")
          .attr("values", "8;26;8")
          .attr("dur", "1.6s")
          .attr("repeatCount", "indefinite");

        nodeG.append("circle")
          .attr("r", 24)
          .attr("fill", "none")
          .attr("stroke", "#f43f5e")
          .attr("stroke-width", "1")
          .attr("opacity", "0.4")
          .append("animate")
          .attr("attributeName", "opacity")
          .attr("values", "0.8;0.1;0.8")
          .attr("dur", "1.6s")
          .attr("repeatCount", "indefinite");
      }

      // Outer Halo
      nodeG.append("circle")
        .attr("r", 7)
        .attr("fill", nodeColor)
        .attr("fill-opacity", "0.3")
        .attr("filter", "url(#node-glow)");

      // Core Node Dot
      nodeG.append("circle")
        .attr("r", 4.5)
        .attr("fill", nodeColor)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", "1.2");

      // Node ID Tag
      if (showNodeLabels) {
        nodeG.append("text")
          .attr("x", 8)
          .attr("y", 3)
          .attr("fill", "#cbd5e1")
          .attr("font-size", "8.5px")
          .attr("font-family", "monospace")
          .attr("font-weight", "bold")
          .text(dev.id);
      }

      // Node Hover Interaction
      nodeG
        .on("mouseenter", function (event) {
          setHoveredDevice(dev);
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: mx, y: my });
        })
        .on("mousemove", function (event) {
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: mx, y: my });
        })
        .on("mouseleave", function () {
          setHoveredDevice(null);
          setTooltipPos(null);
        })
        .on("click", function () {
          if (onDrillDownDevice) {
            onDrillDownDevice(dev);
          }
        });
    });

  }, [
    zonesData, 
    devices, 
    activeMode, 
    selectedSectorFilter, 
    selectedZone, 
    hoveredZone, 
    showNodeLabels, 
    showHeatGlow
  ]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Peta Kepadatan Ancaman Geografis & Sektoral Kota (D3 Heatmap)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-mono font-semibold">
              Live GIS Vector
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualisasi spasial kepadatan ancaman, kesiapan kriptografi PQC, dan beban jaringan real-time di seluruh sektor kota Sematang Borang
          </p>
        </div>

        {/* Toolbar & Layer Modes */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMode("THREAT_DENSITY")}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeMode === "THREAT_DENSITY"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Kepadatan Ancaman</span>
            </button>
            <button
              onClick={() => setActiveMode("PQC_READINESS")}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeMode === "PQC_READINESS"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kesiapan PQC</span>
            </button>
            <button
              onClick={() => setActiveMode("NETWORK_LOAD")}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeMode === "NETWORK_LOAD"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Beban Jaringan</span>
            </button>
          </div>

          {/* Sector Filter Dropdown */}
          <select
            value={selectedSectorFilter}
            onChange={(e) => setSelectedSectorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Semua Sektor ({zonesData.length} Zona)</option>
            <option value="TRAFFIC">Transportasi & Lalu Lintas</option>
            <option value="GATEWAY">Pusat Komando & Core</option>
            <option value="GRID">Energi & Gardu Induk</option>
            <option value="WATER_FLOOD">Pengendalian Banjir & SCADA</option>
            <option value="CCTV">Pengawasan Kamera AI</option>
            <option value="HOSPITAL_SCADA">Medis & Kesehatan</option>
            <option value="ENVIRONMENT">Ruang Terbuka Hijau</option>
            <option value="EMERGENCY_NODE">Pertahanan Sipil</option>
          </select>

          {/* Layer Toggles */}
          <button
            onClick={() => setShowNodeLabels(!showNodeLabels)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showNodeLabels
                ? "bg-slate-800 border-cyan-500/50 text-cyan-300"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
            title="Toggle Label Node & Sektor"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowHeatGlow(!showHeatGlow)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showHeatGlow
                ? "bg-slate-800 border-rose-500/50 text-rose-300"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
            title="Toggle Efek Pancaran Panas (Heat Glow)"
          >
            <Radio className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK SUMMARY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Zona Risiko Kritis</span>
            <span className="text-sm font-bold font-mono text-rose-400">
              {citySummary.criticalZones} Sektor
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Rerata Kepadatan Ancaman</span>
            <span className="text-sm font-bold font-mono text-amber-300">
              {citySummary.avgThreatDensity}% Indeks
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-600/40 text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Sektor Paling Rentan</span>
            <span className="text-xs font-bold text-slate-200 truncate max-w-[120px] block">
              {citySummary.highestThreatZone?.shortName || "Stabil"}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-600/40 text-indigo-400">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Kedaulatan PQC Kota</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              NIST FIPS 203
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* D3 MAP STAGE CONTAINER */}
      <div 
        ref={containerRef} 
        className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] select-none"
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1000 650"
          className="w-full h-auto block"
          style={{ minHeight: "360px", maxHeight: "560px" }}
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-[10px] space-y-2 shadow-lg max-w-xs">
          <div className="font-bold text-slate-200 flex items-center justify-between">
            <span>Legenda Skala {activeMode === "THREAT_DENSITY" ? "Kepadatan Ancaman" : activeMode === "PQC_READINESS" ? "Kesiapan PQC" : "Beban Jaringan"}</span>
            <span className="text-cyan-400 font-mono">D3 Scale</span>
          </div>

          {activeMode === "THREAT_DENSITY" ? (
            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full bg-gradient-to-r from-emerald-600 via-amber-500 via-rose-500 to-red-900" />
              <div className="flex justify-between text-slate-400 font-mono text-[9px]">
                <span>0% Aman</span>
                <span>25% Waspada</span>
                <span>50% Siaga</span>
                <span>100% Kritis</span>
              </div>
              <div className="flex items-center gap-3 pt-1 text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" /> Diserang
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Terdegradasi
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Aman
                </span>
              </div>
            </div>
          ) : activeMode === "PQC_READINESS" ? (
            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full bg-gradient-to-r from-slate-700 via-indigo-600 via-purple-600 to-cyan-400" />
              <div className="flex justify-between text-slate-400 font-mono text-[9px]">
                <span>Legacy RSA</span>
                <span>Hybrid PQC</span>
                <span>NIST ML-KEM Full</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full bg-gradient-to-r from-blue-900 via-cyan-600 to-emerald-400" />
              <div className="flex justify-between text-slate-400 font-mono text-[9px]">
                <span>&lt; 5k pkt/s</span>
                <span>25k pkt/s</span>
                <span>&gt; 50k pkt/s</span>
              </div>
            </div>
          )}

          <div className="pt-1 border-t border-slate-800 text-slate-400 text-[9px]">
            Garis Biru: Aliran Sungai Borang • Titik: Node Armada IoT
          </div>
        </div>

        {/* Dynamic Tooltip on Hover */}
        {tooltipPos && (hoveredZone || hoveredDevice) && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-950/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl text-xs text-slate-200 max-w-xs backdrop-blur-md transition-all"
            style={{
              left: `${Math.min(tooltipPos.x + 15, 680)}px`,
              top: `${Math.min(tooltipPos.y + 15, 420)}px`,
            }}
          >
            {hoveredDevice ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-100 font-mono">{hoveredDevice.id}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    hoveredDevice.status === "ATTACK"
                      ? "bg-rose-600 text-white"
                      : hoveredDevice.status === "DEGRADED"
                      ? "bg-amber-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}>
                    {hoveredDevice.status}
                  </span>
                </div>
                <div className="font-medium text-slate-300">{hoveredDevice.name}</div>
                <p className="text-[10px] text-slate-400">{hoveredDevice.zone}</p>
                <div className="pt-1.5 border-t border-slate-800 text-[10px] space-y-1 font-mono text-slate-300">
                  <div>Enkripsi: <strong className="text-cyan-300">{hoveredDevice.encryption}</strong></div>
                  <div>IP: {hoveredDevice.ip}</div>
                  <div>Anomali: <strong className={hoveredDevice.anomalyScore > 50 ? "text-rose-400" : "text-emerald-400"}>{hoveredDevice.anomalyScore}%</strong></div>
                  <div>Throughput: {hoveredDevice.telemetry?.packetRate.toLocaleString()} pkt/s</div>
                </div>
              </div>
            ) : hoveredZone ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-100">{hoveredZone.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    hoveredZone.threatTier === "CRITICAL"
                      ? "bg-rose-600 text-white"
                      : hoveredZone.threatTier === "HIGH"
                      ? "bg-amber-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}>
                    {hoveredZone.threatTier}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{hoveredZone.sector}</p>
                <div className="pt-1.5 border-t border-slate-800 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kepadatan Ancaman:</span>
                    <span className="font-bold font-mono text-rose-400">{hoveredZone.threatDensityScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kesiapan PQC:</span>
                    <span className="font-bold font-mono text-purple-300">{hoveredZone.pqcReadinessScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Node Aktif:</span>
                    <span className="font-mono text-slate-200">
                      {hoveredZone.devices.length} Node ({hoveredZone.attackCount} Diserang)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Throughput Total:</span>
                    <span className="font-mono text-slate-200">{hoveredZone.totalPacketRate.toLocaleString()} pkt/s</span>
                  </div>
                </div>
                <div className="pt-1 border-t border-slate-800 text-[9px] text-cyan-400 font-semibold flex items-center justify-between">
                  <span>Klik untuk Drill-Down Sektor</span>
                  <Eye className="w-3 h-3" />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* SECTOR CARDS GRID BREAKDOWN */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            Rincian Status 8 Sektor Infrastruktur Cerdas
          </h4>
          <span className="text-[10px] text-slate-400">
            Klik kartu untuk inspeksi drill-down terperinci
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {zonesData.map((zone) => {
            const isCritical = zone.threatTier === "CRITICAL";
            const isHigh = zone.threatTier === "HIGH";
            const isModerate = zone.threatTier === "MODERATE";

            return (
              <div
                key={zone.id}
                onClick={() => {
                  setSelectedZone(zone);
                  if (onDrillDownZone) onDrillDownZone(zone);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                  isCritical
                    ? "bg-rose-950/30 border-rose-500/50 hover:border-rose-400 hover:bg-rose-950/40"
                    : isHigh
                    ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/30"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors block">
                      {zone.shortName}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[140px] block">
                      {zone.sectorCategory}
                    </span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    isCritical
                      ? "bg-rose-600 text-white"
                      : isHigh
                      ? "bg-amber-600 text-white"
                      : isModerate
                      ? "bg-amber-950 text-amber-300 border border-amber-700/50"
                      : "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                  }`}>
                    {zone.threatTier}
                  </span>
                </div>

                {/* Progress bar of Threat Density */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Kepadatan Ancaman</span>
                    <span className={`font-mono font-bold ${
                      isCritical ? "text-rose-400" : isHigh ? "text-amber-300" : "text-emerald-400"
                    }`}>
                      {zone.threatDensityScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCritical
                          ? "bg-rose-500"
                          : isHigh
                          ? "bg-amber-500"
                          : isModerate
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${zone.threatDensityScore}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>{zone.devices.length} Node ({zone.attackCount > 0 ? `${zone.attackCount} Serangan` : "Aman"})</span>
                  <span className="font-mono text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                    Drill-Down →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
