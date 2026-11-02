import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw,
  Terminal,
  Zap,
  Lock
} from "lucide-react";
import { IoTDevice, SecurityIncident } from "../types";

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: IoTDevice[];
  incidents: SecurityIncident[];
  initialQuery?: string;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  devices,
  incidents,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-welcome",
      sender: "ai",
      text: "Halo! Saya adalah **AI SOC Security Copilot** untuk platform `security.sematangborangcity.cloud`.\n\nSaya memantau status kriptografi, anomali telemetri perangkat IoT, dan integritas jaringan Smart City Sematang Borang secara real-time. Ada yang dapat saya bantu analisis?",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/security-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          context: {
            domain: "security.sematangborangcity.cloud",
            totalDevices: devices.length,
            secureCount: devices.filter((d) => d.status === "SECURE").length,
            attackCount: devices.filter((d) => d.status === "ATTACK").length,
            activeIncidents: incidents.filter((i) => i.status === "ACTIVE"),
            cryptoSuites: ["AES-256-GCM", "ChaCha20-Poly1305", "Kyber-768", "Dilithium-3"],
          },
        }),
      });

      const data = await response.json();
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply || "Maaf, terjadi kendala saat menganalisis permintaan keamanan.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "Gagal terhubung ke backend SOC. Pastikan server aktif dan coba beberapa saat lagi.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    "Analisis status keamanan seluruh node kota saat ini",
    "Jelaskan keunggulan Kyber-768 vs RSA untuk IoT",
    "Bagaimana cara menangani serangan Replay Nonce pada sensor banjir?",
    "Buatkan aturan firewall eBPF untuk blokir port rentan",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-950">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  AI SOC Security Intelligence Copilot
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Gemini 3.7 Flash Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                security.sematangborangcity.cloud • Asisten Analisis Forensik & Kriptografi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">Tanya Cepat:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-all border border-slate-700/60 hover:border-cyan-500/40"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
          {messages.map((m) => {
            const isAI = m.sender === "ai";
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isAI ? "items-start" : "items-start flex-row-reverse"}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isAI
                      ? "bg-cyan-950 border border-cyan-700 text-cyan-300"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 space-y-2 ${
                    isAI
                      ? "bg-slate-950 border border-slate-800 text-slate-200"
                      : "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {m.text}
                  </div>

                  <div className="flex items-center justify-between text-[10px] opacity-60 pt-1">
                    <span>{m.timestamp}</span>
                    {isAI && (
                      <button
                        onClick={() => copyToClipboard(m.text, m.id)}
                        className="hover:opacity-100 flex items-center gap-1"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Disalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Salin
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>AI Copilot sedang menganalisis telemetri & merumuskan rekomendasi...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Tanyakan analisis keamanan IoT, audit kriptografi, atau kepatuhan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-all shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
