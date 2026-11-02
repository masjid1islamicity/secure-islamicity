import { SecurityIncident, AnomalyAlert, AudibleAlertConfig, VoiceLanguage } from "../types";

// AudioContext singleton for synthetic acoustic chime tones
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a synthesized tactical alarm chime using Web Audio API
 */
export function playSynthesizedChime(severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" = "CRITICAL") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    gainNode.connect(ctx.destination);

    if (severity === "CRITICAL") {
      // 3-tone urgent ascending warning chime
      osc1.type = "sawtooth";
      osc2.type = "sine";

      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(1174.66, now + 0.1); // D6
      osc1.frequency.setValueAtTime(1479.98, now + 0.2); // F#6

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(587.33, now + 0.1);
      osc2.frequency.setValueAtTime(739.99, now + 0.2);

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gainNode);
      osc2.connect(gainNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else if (severity === "HIGH") {
      // 2-tone alert chime
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(784, now); // G5
      osc1.frequency.setValueAtTime(987.77, now + 0.12); // B5

      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gainNode);
      osc1.start(now);
      osc1.stop(now + 0.35);
    } else {
      // Soft single notification ping
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now); // E5

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gainNode);
      osc1.start(now);
      osc1.stop(now + 0.25);
    }
  } catch (err) {
    console.warn("Could not play synthesized audio chime:", err);
  }
}

/**
 * Checks if Web Speech API is supported in current browser
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/**
 * Get list of available voices from browser
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Select best matching voice based on target language
 */
export function findBestVoice(language: VoiceLanguage, requestedURI?: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (!voices || voices.length === 0) return null;

  if (requestedURI) {
    const matched = voices.find((v) => v.voiceURI === requestedURI);
    if (matched) return matched;
  }

  // Target language prefix (e.g. 'id' or 'en')
  const langPrefix = language.split("-")[0].toLowerCase();

  // 1. Exact match (e.g. 'id-ID' or 'en-US')
  const exact = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === language.toLowerCase());
  if (exact) return exact;

  // 2. Prefix match (e.g. 'id' or 'en')
  const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
  if (prefixMatch) return prefixMatch;

  // 3. Fallback to default or first available
  const defVoice = voices.find((v) => v.default);
  return defVoice || voices[0];
}

/**
 * Stop any ongoing speech playback
 */
export function cancelSpeech() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn("Failed to cancel speech synthesis:", e);
    }
  }
}

/**
 * Generates natural language verbal summary for a Security Incident
 */
export function generateIncidentSpeechText(
  incident: SecurityIncident,
  language: VoiceLanguage = "id-ID",
  includeSuggestedAction: boolean = true
): string {
  if (language === "id-ID") {
    let text = `Peringatan Keamanan Kritis! Terdeteksi serangan ${incident.attackType} pada perangkat ${incident.deviceName} di ${incident.zone}. `;
    text += `Deskripsi: ${incident.description}. `;
    if (includeSuggestedAction && incident.suggestedAction) {
      text += `Rekomendasi tindakan mitigasi: ${incident.suggestedAction}.`;
    }
    return text;
  } else {
    let text = `Critical Security Threat Alert! ${incident.attackType} detected targeting device ${incident.deviceName} in ${incident.zone}. `;
    text += `Details: ${incident.description}. `;
    if (includeSuggestedAction && incident.suggestedAction) {
      text += `Recommended action: ${incident.suggestedAction}.`;
    }
    return text;
  }
}

/**
 * Generates natural language verbal summary for an Anomaly Alert
 */
export function generateAnomalySpeechText(
  alert: AnomalyAlert,
  language: VoiceLanguage = "id-ID",
  includeSuggestedAction: boolean = true
): string {
  const pillarName = 
    alert.pillar === "NETWORK_TRAFFIC" 
      ? (language === "id-ID" ? "Trafik Jaringan" : "Network Traffic")
      : alert.pillar === "DEVICE_LOGS"
      ? (language === "id-ID" ? "Log Sistem Perangkat" : "Device Host Logs")
      : (language === "id-ID" ? "Pola Akses Data" : "Data Access Patterns");

  if (language === "id-ID") {
    let text = `Perhatian! Anomali ${alert.severity === "CRITICAL" ? "Kritis" : "Tinggi"} terdeteksi pada pilar ${pillarName}. `;
    text += `Jenis: ${alert.anomalyType} pada node ${alert.nodeName} ${alert.zone}. `;
    text += `Nilai observasi ${alert.observedValue}, deviasi sebesar ${alert.deviationPercent > 0 ? "+" : ""}${alert.deviationPercent} persen dari baseline normal. `;
    if (includeSuggestedAction && alert.suggestedAction) {
      text += `Saran mitigasi: ${alert.suggestedAction}.`;
    }
    return text;
  } else {
    let text = `Attention! ${alert.severity} Anomaly detected in ${pillarName} pillar. `;
    text += `Type: ${alert.anomalyType} on node ${alert.nodeName}, in ${alert.zone}. `;
    text += `Observed value is ${alert.observedValue}, with a ${alert.deviationPercent}% deviation from nominal baseline. `;
    if (includeSuggestedAction && alert.suggestedAction) {
      text += `Suggested mitigation: ${alert.suggestedAction}.`;
    }
    return text;
  }
}

/**
 * Generates speech text for emergency lockdown
 */
export function generateLockdownSpeechText(active: boolean, language: VoiceLanguage = "id-ID"): string {
  if (language === "id-ID") {
    return active
      ? "Perhatian seluruh operator SOC! Protokol isolasi darurat kota telah diaktifkan. Seluruh gateway IoT beralih ke enkripsi kuantum ML-KEM-768 dan port publik ditutup."
      : "Pemberitahuan: Protokol isolasi darurat telah dicabut. Operasional jaringan IoT Sematang Borang kembali ke status nominal terproteksi.";
  } else {
    return active
      ? "Warning to all SOC operators! City-wide emergency lockdown protocol is now active. All IoT gateways have switched to quantum-resistant encryption and public ingress ports are blocked."
      : "Notice: Emergency lockdown protocol has been cleared. Sematang Borang IoT network operation restored to nominal protected status.";
  }
}

/**
 * Speaks text using Web Speech API with configuration and optional chime
 */
export function speakVerbalAlert(
  text: string,
  config: AudibleAlertConfig,
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" = "CRITICAL",
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: any) => void;
  }
): boolean {
  if (!isSpeechSynthesisSupported()) {
    console.warn("Web Speech API is not supported in this browser.");
    callbacks?.onError?.("Web Speech API not supported");
    return false;
  }

  if (!config.enabled) {
    return false;
  }

  // Check severity filter
  if (config.minSeverity === "CRITICAL" && severity !== "CRITICAL") {
    return false;
  }
  if (config.minSeverity === "HIGH" && severity !== "CRITICAL" && severity !== "HIGH") {
    return false;
  }

  // Play auditory chime tone first
  if (config.playChime) {
    playSynthesizedChime(severity);
  }

  // Cancel current speech to prevent overlapping queues
  cancelSpeech();

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = Math.max(0, Math.min(1, config.volume));
    utterance.rate = Math.max(0.5, Math.min(2.0, config.rate));
    utterance.pitch = Math.max(0.5, Math.min(2.0, config.pitch));
    utterance.lang = config.language;

    const matchedVoice = findBestVoice(config.language, config.voiceURI);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis utterance error:", e);
      callbacks?.onError?.(e);
      callbacks?.onEnd?.();
    };

    // Small delay if chime is playing
    const delay = config.playChime ? 350 : 50;
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, delay);

    return true;
  } catch (err) {
    console.error("Speech synthesis invocation failed:", err);
    callbacks?.onError?.(err);
    return false;
  }
}
