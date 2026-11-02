import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Play,
  Square,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  SlidersHorizontal,
  Globe,
  Settings,
  Headphones,
  Zap,
  RotateCcw,
  Trash2,
  X,
  Volume1,
  Mic,
  Activity,
  Layers
} from "lucide-react";
import { AudibleAlertConfig, SpeechBroadcastLog, VoiceLanguage, SecurityIncident, AnomalyAlert } from "../types";
import { 
  getAvailableVoices, 
  speakVerbalAlert, 
  cancelSpeech, 
  isSpeechSynthesisSupported, 
  playSynthesizedChime,
  generateIncidentSpeechText,
  generateAnomalySpeechText,
  generateLockdownSpeechText
} from "../utils/speechAlertService";

interface AudibleAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AudibleAlertConfig;
  setConfig: React.Dispatch<React.SetStateAction<AudibleAlertConfig>>;
  broadcastLogs: SpeechBroadcastLog[];
  setBroadcastLogs: React.Dispatch<React.SetStateAction<SpeechBroadcastLog[]>>;
  isCurrentlySpeaking: boolean;
  setIsCurrentlySpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  sampleIncidents: SecurityIncident[];
  sampleAnomalies: AnomalyAlert[];
}

export const AudibleAlertModal: React.FC<AudibleAlertModalProps> = ({
  isOpen,
  onClose,
  config,
  setConfig,
  broadcastLogs,
  setBroadcastLogs,
  isCurrentlySpeaking,
  setIsCurrentlySpeaking,
  sampleIncidents,
  sampleAnomalies,
}) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [customTestText, setCustomTestText] = useState<string>(
    "Peringatan Keamanan SOC: Anomali kriptografi terdeteksi pada AI Traffic Sensor Simpang Borang Raya. Rekomendasi mitigasi otomatis eBPF disiagakan."
  );
  const [activeTab, setActiveTab] = useState<"SETTINGS" | "TESTER" | "LOGS">("SETTINGS");
  const isSupported = isSpeechSynthesisSupported();

  // Load available speech synthesis voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = getAvailableVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isSupported]);

  // Update sample custom text when language changes
  const handleLanguageChange = (newLang: VoiceLanguage) => {
    setConfig((prev) => ({ ...prev, language: newLang }));
    if (newLang === "id-ID") {
      setCustomTestText(
        "Peringatan Keamanan SOC: Anomali kriptografi terdeteksi pada AI Traffic Sensor Simpang Borang Raya. Rekomendasi mitigasi otomatis disiagakan."
      );
    } else {
      setCustomTestText(
        "SOC Security Warning: Cryptographic anomaly detected on AI Traffic Sensor Simpang Borang Raya. Automated mitigation is recommended."
      );
    }
  };

  const handleSpeakCustom = (textToSpeak?: string) => {
    const text = textToSpeak || customTestText;
    if (!text.trim()) return;

    speakVerbalAlert(
      text,
      { ...config, enabled: true },
      "HIGH",
      {
        onStart: () => setIsCurrentlySpeaking(true),
        onEnd: () => setIsCurrentlySpeaking(false),
        onError: () => setIsCurrentlySpeaking(false),
      }
    );

    const newLog: SpeechBroadcastLog = {
      id: `VOICE-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      title: "Operator Manual Test Broadcast",
      speechText: text,
      severity: "INFO",
      source: "TEST",
    };
    setBroadcastLogs((prev) => [newLog, ...prev.slice(0, 40)]);
  };

  const handleStopSpeech = () => {
    cancelSpeech();
    setIsCurrentlySpeaking(false);
  };

  const handleTestIncidentSpeech = (incident?: SecurityIncident) => {
    const target = incident || sampleIncidents[0];
    if (!target) return;

    const text = generateIncidentSpeechText(target, config.language, config.includeSuggestedAction);
    speakVerbalAlert(text, { ...config, enabled: true }, target.severity, {
      onStart: () => setIsCurrentlySpeaking(true),
      onEnd: () => setIsCurrentlySpeaking(false),
      onError: () => setIsCurrentlySpeaking(false),
    });

    const newLog: SpeechBroadcastLog = {
      id: `VOICE-INC-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      title: `Threat Broadcast: ${target.attackType}`,
      speechText: text,
      severity: target.severity,
      source: "INCIDENT",
      targetNode: target.deviceName,
      zone: target.zone,
    };
    setBroadcastLogs((prev) => [newLog, ...prev.slice(0, 40)]);
  };

  const handleTestAnomalySpeech = (anomaly?: AnomalyAlert) => {
    const target = anomaly || sampleAnomalies[0];
    if (!target) return;

    const text = generateAnomalySpeechText(target, config.language, config.includeSuggestedAction);
    speakVerbalAlert(text, { ...config, enabled: true }, target.severity, {
      onStart: () => setIsCurrentlySpeaking(true),
      onEnd: () => setIsCurrentlySpeaking(false),
      onError: () => setIsCurrentlySpeaking(false),
    });

    const newLog: SpeechBroadcastLog = {
      id: `VOICE-ANOM-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      title: `Anomaly Alert: ${target.anomalyType}`,
      speechText: text,
      severity: target.severity,
      source: "ANOMALY",
      targetNode: target.nodeName,
      zone: target.zone,
    };
    setBroadcastLogs((prev) => [newLog, ...prev.slice(0, 40)]);
  };

  const handleTestLockdownSpeech = () => {
    const text = generateLockdownSpeechText(true, config.language);
    speakVerbalAlert(text, { ...config, enabled: true }, "CRITICAL", {
      onStart: () => setIsCurrentlySpeaking(true),
      onEnd: () => setIsCurrentlySpeaking(false),
      onError: () => setIsCurrentlySpeaking(false),
    });

    const newLog: SpeechBroadcastLog = {
      id: `VOICE-LCK-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
      title: "Lockdown Protocol Announcement",
      speechText: text,
      severity: "CRITICAL",
      source: "LOCKDOWN",
    };
    setBroadcastLogs((prev) => [newLog, ...prev.slice(0, 40)]);
  };

  if (!isOpen) return null;

  // Filter voices that match selected language
  const filteredVoices = availableVoices.filter((v) =>
    v.lang.toLowerCase().startsWith(config.language.split("-")[0].toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-100 my-6 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
              config.enabled
                ? "bg-indigo-950/90 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950/50"
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}>
              {config.enabled ? (
                <Volume2 className="w-5 h-5 text-cyan-400" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center gap-1">
                  <Headphones className="w-3 h-3 text-cyan-400" />
                  WEB SPEECH API • HANDS-FREE MONITORING
                </span>
                {isCurrentlySpeaking && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                    <Radio className="w-3 h-3 animate-spin" />
                    LIVE BROADCASTING...
                  </span>
                )}
                {!isSupported && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-600 text-white">
                    BROWSER SPEECH SYNTHESIS TIDAK TERSEDIA
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-0.5">
                Sistem Peringatan Suara Otomatis (Audible Threat Broadcast)
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ringkasan verbal otonom untuk ancaman kritis & anomali infrastruktur IoT Sematang Borang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Audio Activity & Master Toggle Banner */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Master Enable Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                Audible Operator Alerts: {config.enabled ? "AKTIF (ENABLED)" : "NONAKTIF (MUTED)"}
              </span>
              <span className="text-[11px] text-slate-400">
                Otomatis menyuarakan ancaman berbobot CRITICAL saat terdeteksi oleh SOC
              </span>
            </div>
          </div>

          {/* Sound wave visualizer / stop button */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {isCurrentlySpeaking ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-xs">
                <div className="flex items-center gap-0.5 h-4">
                  <span className="w-1 bg-rose-400 h-2 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 bg-rose-400 h-4 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 bg-rose-400 h-3 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="w-1 bg-rose-400 h-4 animate-bounce" style={{ animationDelay: "75ms" }} />
                </div>
                <span className="text-rose-300 font-mono font-bold text-[11px]">Output Suara Aktif</span>
                <button
                  onClick={handleStopSpeech}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 shadow transition-all ml-1"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Hentikan</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Engine Siaga</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("SETTINGS")}
              className={`px-3.5 py-2 font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "SETTINGS"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Pengaturan Suara & Filter</span>
            </button>

            <button
              onClick={() => setActiveTab("TESTER")}
              className={`px-3.5 py-2 font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "TESTER"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulasi Uji Broadcast ({sampleIncidents.length + sampleAnomalies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("LOGS")}
              className={`px-3.5 py-2 font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "LOGS"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Riwayat Transkrip Suara ({broadcastLogs.length})</span>
            </button>
          </div>

          <button
            onClick={() => playSynthesizedChime("CRITICAL")}
            className="px-2.5 py-1 mb-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Tes Chime Sirine</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: SETTINGS & POLICIES */}
          {activeTab === "SETTINGS" && (
            <div className="space-y-6">
              {/* Language & Voice Selector */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Bahasa & Karakter Suara Sintesis
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Language Selector */}
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1.5">
                      Bahasa Ringkasan Verbal (Language)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLanguageChange("id-ID")}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                          config.language === "id-ID"
                            ? "bg-cyan-950 border-cyan-500 text-cyan-300 shadow-sm"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span>🇮🇩 Bahasa Indonesia</span>
                      </button>
                      <button
                        onClick={() => handleLanguageChange("en-US")}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                          config.language === "en-US"
                            ? "bg-cyan-950 border-cyan-500 text-cyan-300 shadow-sm"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span>🇺🇸 English (US)</span>
                      </button>
                    </div>
                  </div>

                  {/* Browser Speech Voice Selection */}
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1.5">
                      Pilihan Suara Browser ({filteredVoices.length || availableVoices.length} suara terdeteksi)
                    </label>
                    <select
                      value={config.voiceURI}
                      onChange={(e) => setConfig((prev) => ({ ...prev, voiceURI: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">Otomatis (Pilihan Terbaik Sistem)</option>
                      {(filteredVoices.length > 0 ? filteredVoices : availableVoices).map((voice) => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name} ({voice.lang}) {voice.default ? "[Default]" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sliders: Rate, Pitch, Volume */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  Parameter Output Akustik
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Volume Slider */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Volume:</span>
                      <span className="font-mono font-bold text-cyan-300">{Math.round(config.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={config.volume}
                      onChange={(e) => setConfig((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))}
                      className="w-full accent-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 block">Tingkat kekerasan suara</span>
                  </div>

                  {/* Speech Rate Slider */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Kecepatan (Rate):</span>
                      <span className="font-mono font-bold text-indigo-300">{config.rate.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.6"
                      step="0.05"
                      value={config.rate}
                      onChange={(e) => setConfig((prev) => ({ ...prev, rate: parseFloat(e.target.value) }))}
                      className="w-full accent-indigo-400"
                    />
                    <span className="text-[10px] text-slate-500 block">Artikulasi & tempo bicara</span>
                  </div>

                  {/* Speech Pitch Slider */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Nada Suara (Pitch):</span>
                      <span className="font-mono font-bold text-emerald-300">{config.pitch.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.05"
                      value={config.pitch}
                      onChange={(e) => setConfig((prev) => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                      className="w-full accent-emerald-400"
                    />
                    <span className="text-[10px] text-slate-500 block">Frekuensi nada artikulator</span>
                  </div>
                </div>
              </div>

              {/* Broadcast Trigger Policies & Options */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Kebijakan Pemicu Siaran Suara (Trigger Policy)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Severity Filter */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1.5">
                    <span className="text-slate-300 font-bold block">Tingkat Keparahan Minimum</span>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Pilih ancaman apa yang berhak memicu pengumuman suara otomatis di control room:
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setConfig((prev) => ({ ...prev, minSeverity: "CRITICAL" }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          config.minSeverity === "CRITICAL"
                            ? "bg-rose-600 text-white"
                            : "bg-slate-950 border border-slate-800 text-slate-400"
                        }`}
                      >
                        Critical Only (Disarankan)
                      </button>
                      <button
                        onClick={() => setConfig((prev) => ({ ...prev, minSeverity: "HIGH" }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          config.minSeverity === "HIGH"
                            ? "bg-amber-600 text-white"
                            : "bg-slate-950 border border-slate-800 text-slate-400"
                        }`}
                      >
                        High & Critical
                      </button>
                      <button
                        onClick={() => setConfig((prev) => ({ ...prev, minSeverity: "ALL" }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          config.minSeverity === "ALL"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-950 border border-slate-800 text-slate-400"
                        }`}
                      >
                        Semua Peringatan
                      </button>
                    </div>
                  </div>

                  {/* Pre-Chime Tone Toggle */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 flex items-start justify-between gap-2">
                    <div>
                      <span className="text-slate-300 font-bold block">Chime Sirine Taktis Awal</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Memainkan nada sirine multi-tone Web Audio API sebelum suara sintesis dimulai untuk menarik perhatian operator seketika.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.playChime}
                      onChange={(e) => setConfig((prev) => ({ ...prev, playChime: e.target.checked }))}
                      className="w-4 h-4 accent-cyan-400 cursor-pointer mt-1"
                    />
                  </div>

                  {/* Include Suggested Action Toggle */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 flex items-start justify-between gap-2">
                    <div>
                      <span className="text-slate-300 font-bold block">Sertakan Rekomendasi Mitigasi</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Menambahkan instruksi langkah penanganan cepat (SOAR/eBPF) pada akhir kalimat narasi.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.includeSuggestedAction}
                      onChange={(e) => setConfig((prev) => ({ ...prev, includeSuggestedAction: e.target.checked }))}
                      className="w-4 h-4 accent-cyan-400 cursor-pointer mt-1"
                    />
                  </div>

                  {/* Hands-Free Operational Notice */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center gap-2.5 text-[11px] text-slate-300">
                    <Headphones className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span>
                      Mendukung headset nirkabel & speaker control room. Suara tetap aktif saat berpindah tab monitoring.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE TESTER & SIMULATION */}
          {activeTab === "TESTER" && (
            <div className="space-y-6">
              
              {/* Quick Scenario Triggers */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>Skenario Siaran Cepat (Quick Test Scenarios)</span>
                  <span className="text-[11px] font-mono text-cyan-400">Klik untuk menyuarakan</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Test 1: Critical Threat Incident */}
                  <button
                    onClick={() => handleTestIncidentSpeech()}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-rose-500/40 text-left transition-all group hover:scale-[1.01] active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        CRITICAL THREAT
                      </span>
                      <Play className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">Serangan Replay & Quantum Probe</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      Tes siaran suara insiden serangan siber pada AI Traffic Sensor Simpang Borang.
                    </p>
                  </button>

                  {/* Test 2: Multi-Pillar Anomaly */}
                  <button
                    onClick={() => handleTestAnomalySpeech()}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-amber-500/40 text-left transition-all group hover:scale-[1.01] active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        ANOMALY DEVIATION
                      </span>
                      <Play className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">Anomali Laju Paket +3975%</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      Tes siaran deviasi statistik 3-sigma trafik jaringan & nonce reuse.
                    </p>
                  </button>

                  {/* Test 3: Lockdown Protocol */}
                  <button
                    onClick={() => handleTestLockdownSpeech()}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-indigo-500/40 text-left transition-all group hover:scale-[1.01] active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        CITY LOCKDOWN
                      </span>
                      <Play className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">Protokol Isolasi Darurat</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      Tes pengumuman evakuasi siber dan pemindahan gateway ke PQC ML-KEM-768.
                    </p>
                  </button>
                </div>
              </div>

              {/* Custom Text-to-Speech Sandbox */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-cyan-400" />
                    Sandbox Uji Teks Bebas (Custom TTS Broadcast)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Bahasa: <strong>{config.language === "id-ID" ? "Indonesia" : "English"}</strong>
                  </span>
                </div>

                <textarea
                  value={customTestText}
                  onChange={(e) => setCustomTestText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed"
                  placeholder="Ketik pesan narasi yang ingin disuarakan..."
                />

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>Karakter: {customTestText.length}</span>
                    <span>•</span>
                    <span>Kecepatan: {config.rate}x</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrentlySpeaking ? (
                      <button
                        onClick={handleStopSpeech}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow transition-all active:scale-95"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Hentikan Suara</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSpeakCustom()}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Suarakan Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BROADCAST HISTORY TRANSCRIPTS */}
          {activeTab === "LOGS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-300">
                  Transkrip Siaran Verbal ({broadcastLogs.length} Entri)
                </div>
                {broadcastLogs.length > 0 && (
                  <button
                    onClick={() => setBroadcastLogs([])}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Bersihkan Riwayat</span>
                  </button>
                )}
              </div>

              {broadcastLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/80">
                  <Volume2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">Belum ada transkrip siaran suara</p>
                  <p className="text-slate-500 mt-1">
                    Saat ancaman kritis atau anomali disuarakan, transkrip narasi akan dicatat di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {broadcastLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            log.severity === "CRITICAL"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : log.severity === "HIGH"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-slate-800 text-slate-300"
                          }`}>
                            {log.severity}
                          </span>
                          <span className="font-bold text-slate-200">{log.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({log.source})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">{log.timestamp}</span>
                          <button
                            onClick={() => handleSpeakCustom(log.speechText)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-all"
                            title="Dengarkan Ulang"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 text-[11px]">
                        "{log.speechText}"
                      </p>

                      {log.targetNode && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Target: {log.targetNode} {log.zone ? `• ${log.zone}` : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span className="font-mono">Web Speech API</span>
            <span>•</span>
            <span className={config.enabled ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
              {config.enabled ? "Hands-Free Auto-Broadcast Active" : "Broadcast Muted"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
