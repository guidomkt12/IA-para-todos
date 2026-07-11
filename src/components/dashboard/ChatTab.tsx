import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, MessageSquare, RefreshCw, Check, CheckCheck } from "lucide-react";
import { n8nPost } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type Instancia = { instancia_id: string; nome: string };

type WaChat = {
  wa_chatid: string;
  wa_contactName?: string;
  wa_name?: string;
  name?: string;
  imagePreview?: string;
  wa_lastMsgTimestamp?: number;
  wa_unreadCount?: number;
  wa_lastMessageTextVote?: string;
  wa_lastMessageType?: string;
  wa_lastMessageSender?: string;
  phone?: string;
};

type WaMsg = {
  id?: string;
  text?: string;
  body?: string;
  message?: any;
  fromMe?: boolean;
  isFromMe?: boolean;
  timestamp?: number;
  messageTimestamp?: number;
  type?: string;
  messageType?: string;
  status?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-rose-500", "bg-violet-500", "bg-blue-500",
  "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
];

function avatarColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function extractNumber(chatid: string): string {
  return chatid
    .replace("@s.whatsapp.net", "")
    .replace("@c.us", "")
    .replace("@lid", "")
    .replace(/\D/g, "");
}

function formatPhone(digits: string): string {
  if (digits.length === 13 && digits.startsWith("55")) {
    return `+${digits.slice(0,2)} (${digits.slice(2,4)}) ${digits.slice(4,9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12 && digits.startsWith("55")) {
    return `+${digits.slice(0,2)} (${digits.slice(2,4)}) ${digits.slice(4,8)}-${digits.slice(8)}`;
  }
  return digits;
}

function isBrazilianPhone(digits: string): boolean {
  return (
    (digits.length === 12 || digits.length === 13) &&
    digits.startsWith("55")
  );
}

function chatName(c: WaChat): string {
  const name = c.wa_contactName || c.wa_name || c.name || "";
  if (name && name.trim()) return name.trim();

  const raw = c.wa_chatid || "";
  const cleaned = raw
    .replace("@s.whatsapp.net", "")
    .replace("@c.us", "")
    .replace("@g.us", "")
    .replace("@lid", "")
    .replace("@newsletter", "");

  if (cleaned.includes("-")) {
    const phoneDigits = cleaned.split("-")[0].replace(/\D/g, "");
    if (isBrazilianPhone(phoneDigits)) return formatPhone(phoneDigits);
    return "Grupo";
  }

  const digitsOnly = cleaned.replace(/\D/g, "");

  if (isBrazilianPhone(digitsOnly)) return formatPhone(digitsOnly);

  if (digitsOnly.length > 13) return "Contato";

  return cleaned.slice(0, 15) || "Desconhecido";
}

function formatMsgText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(@\d{6,20})/g);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) => {
        if (/^@\d{6,20}$/.test(part)) {
          const digits = part.replace("@", "");
          const formatted = digits.length >= 10 && digits.length <= 15
            ? "@" + digits
            : part;
          return (
            <span key={i} className="text-emerald-600 dark:text-emerald-400 font-medium">
              {formatted}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function chatInitials(c: WaChat) {
  return chatName(c).slice(0, 2).toUpperCase();
}

function lastMsgPreview(c: WaChat): string {
  if (c.wa_lastMessageTextVote) return c.wa_lastMessageTextVote;
  const icons: Record<string, string> = {
    AudioMessage: "🎵 Áudio", ImageMessage: "📷 Imagem",
    VideoMessage: "🎬 Vídeo", StickerMessage: "😀 Sticker",
    DocumentMessage: "📄 Documento", TemplateMessage: "📋 Mensagem",
  };
  return icons[c.wa_lastMessageType || ""] || "";
}

function formatTime(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getTs(m: WaMsg) { return m.timestamp || m.messageTimestamp || 0; }
function getFromMe(m: WaMsg) { return m.fromMe ?? m.isFromMe ?? false; }
function getText(m: WaMsg): string {
  if (typeof m.message === "string") return m.message;
  if (m.message && typeof m.message === "object") {
    return m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      m.message.videoMessage?.caption || "";
  }
  return m.text || m.body || "";
}
function isAudio(m: WaMsg): boolean {
  const t = (m.type || m.messageType || "").toLowerCase();
  return t.includes("audio") || (getText(m) === "" && t.includes("ptt"));
}
function isMedia(m: WaMsg): boolean {
  const t = (m.type || m.messageType || "").toLowerCase();
  return t.includes("image") || t.includes("video") || t.includes("sticker") || t.includes("document");
}
function mediaLabel(m: WaMsg): string {
  const t = (m.type || m.messageType || "").toLowerCase();
  if (t.includes("image")) return "📷 Imagem";
  if (t.includes("video")) return "🎬 Vídeo";
  if (t.includes("sticker")) return "😀 Sticker";
  if (t.includes("document")) return "📄 Documento";
  return "📎 Arquivo";
}

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChatTab({
  clienteId,
  instancias: _instanciasProp = [],
}: {
  clienteId: string;
  instancias: Instancia[];
}) {
  const [instanciaId, setInstanciaId]   = useState("");
  const [instancias, setInstancias]     = useState<Instancia[]>([]);

  const [chats, setChats]               = useState<WaChat[]>([]);
  const [chatAtivo, setChatAtivo]       = useState<WaChat | null>(null);
  const [mensagens, setMensagens]       = useState<WaMsg[]>([]);
  const [texto, setTexto]               = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);
  const [enviando, setEnviando]         = useState(false);
  const [erro, setErro]                 = useState<string | null>(null);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgCache     = useRef<Record<string, WaMsg[]>>({});
  const isAtBottom   = useRef(true);
  const isMounted    = useRef(true);
  const msgSeqRef    = useRef(0);
  const chatAtivoRef = useRef<WaChat | null>(null);

  useEffect(() => { chatAtivoRef.current = chatAtivo; }, [chatAtivo]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── 1. Buscar instâncias ─────────────────────────────────────────────────
  useEffect(() => {
    if (!clienteId) return;
    setLoadingToken(true);
    n8nPost("uazapi-manager", { cliente_id: clienteId, acao: "listar" })
      .then(data => {
        if (!isMounted.current) return;
        const lista = data?.instancias || [];
        const mapped: Instancia[] = lista.map((i: any) => ({
          instancia_id: i.instancia_id,
          nome: i.nome || i.instancia_id,
        }));
        setInstancias(mapped);
        if (mapped.length > 0) setInstanciaId(mapped[0].instancia_id);
      })
      .catch(() => {})
      .finally(() => { if (isMounted.current) setLoadingToken(false); });
  }, [clienteId]);

  // ── 2. Resetar ao trocar de instância ────────────────────────────────────
  useEffect(() => {
    if (!instanciaId) return;
    setChatAtivo(null);
    setMensagens([]);
    setChats([]);
    msgCache.current = {};
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, [instanciaId]);

  // ── 3. Carregar chats quando instância selecionada ───────────────────────
  const carregarChats = useCallback(async () => {
    if (!instanciaId) return;
    if (isMounted.current) { setLoadingChats(true); setErro(null); }
    try {
      const data = await n8nPost("saas-chat", {
        instancia_id: instanciaId,
        acao: "listar_chats",
        sort: "-wa_lastMsgTimestamp",
        limit: 100,
      });
      const lista: WaChat[] = data?.chats || (Array.isArray(data) ? data : []);
      if (isMounted.current) setChats(lista);
    } catch {
      if (isMounted.current) setErro("Erro ao carregar conversas.");
    } finally {
      if (isMounted.current) setLoadingChats(false);
    }
  }, [instanciaId]);

  useEffect(() => {
    if (instanciaId) carregarChats();
  }, [instanciaId, carregarChats]);

  // ── 4. Carregar mensagens via proxy n8n ──────────────────────────────────
  const carregarMensagens = useCallback(async (chat: WaChat, silent = false) => {
    if (!instanciaId) return;

    const seq = ++msgSeqRef.current;

    if (!silent) {
      if (isMounted.current) setLoadingMsgs(true);
    }

    try {
      const data = await n8nPost("saas-chat", {
        instancia_id: instanciaId,
        acao: "buscar_mensagens",
        chatid: chat.wa_chatid,
        limit: 50,
        offset: 0,
      });

      if (msgSeqRef.current !== seq) return;

      let rawMsgs: WaMsg[] = [];
      if (data?.messages) rawMsgs = data.messages;
      else if (Array.isArray(data?.data?.messages)) rawMsgs = data.data.messages;
      else if (Array.isArray(data?.data)) rawMsgs = data.data;
      else if (Array.isArray(data)) rawMsgs = data[0]?.messages ?? data;

      const sorted = [...rawMsgs].sort((a, b) => getTs(a) - getTs(b));

      if (!isMounted.current) return;

      msgCache.current[chat.wa_chatid] = sorted;

      setMensagens(prev => {
        if (sorted.length === 0) return prev;
        const optimistic = prev.filter(m =>
          m.id?.startsWith("temp-") &&
          !sorted.some(s => Math.abs(getTs(s) - getTs(m)) < 5000)
        );
        return [...sorted, ...optimistic];
      });
      setLoadingMsgs(false);

    } catch {
      if (msgSeqRef.current !== seq) return;
      if (isMounted.current) { setLoadingMsgs(false); }
    }
  }, [instanciaId]);

  // ── 5. Polling ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!chatAtivo) return;

    carregarMensagens(chatAtivo);

    pollRef.current = setInterval(() => {
      if (document.visibilityState === "visible" && chatAtivoRef.current) {
        carregarMensagens(chatAtivoRef.current, true);
      }
    }, 4000);

    const onVisibility = () => {
      if (document.visibilityState === "visible" && chatAtivoRef.current)
        carregarMensagens(chatAtivoRef.current, true);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [chatAtivo, carregarMensagens]);

  // ── 6. Auto-scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isAtBottom.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  // ── Ações ────────────────────────────────────────────────────────────────

  const abrirChat = useCallback((chat: WaChat) => {
    const cached = msgCache.current[chat.wa_chatid] || [];
    setMensagens(cached);
    setChatAtivo(chat);
    isAtBottom.current = true;

    if ((chat.wa_unreadCount || 0) > 0 && instanciaId) {
      n8nPost("saas-chat", {
        instancia_id: instanciaId,
        acao: "marcar_lido",
        id: [],
      }).catch(() => {});
      setChats(prev => prev.map(c =>
        c.wa_chatid === chat.wa_chatid ? { ...c, wa_unreadCount: 0 } : c
      ));
    }
  }, [instanciaId]);

  const enviarMensagem = useCallback(async () => {
    const chatAtual = chatAtivoRef.current;
    if (!texto.trim() || !chatAtual || !instanciaId) return;

    setEnviando(true);
    const msg = texto.trim();
    setTexto("");
    const tempMsg: WaMsg = {
      id: `temp-${Date.now()}`,
      text: msg,
      fromMe: true,
      timestamp: Date.now(),
    };
    setMensagens(prev => [...prev, tempMsg]);
    isAtBottom.current = true;

    try {
      await n8nPost("saas-chat", {
        instancia_id: instanciaId,
        acao: "enviar",
        number: extractNumber(chatAtual.wa_chatid),
        text: msg,
        delay: 300,
      });
    } catch {
      if (isMounted.current) setErro("Erro ao enviar mensagem.");
    } finally {
      if (isMounted.current) setEnviando(false);
    }
  }, [texto, instanciaId]);

  // ── Render helpers ───────────────────────────────────────────────────────

  const nomeInstancia = instancias.find(i => i.instancia_id === instanciaId)?.nome || "Número 1";

  function renderMessages() {
    if (!Array.isArray(mensagens)) return null;
    const elements: JSX.Element[] = [];
    let lastDay = "";
    mensagens.forEach((m, idx) => {
      const ts  = getTs(m);
      const day = ts ? dayLabel(ts) : "";
      if (day && day !== lastDay) {
        lastDay = day;
        elements.push(
          <div key={`day-${ts}-${idx}`} className="flex justify-center my-3">
            <span className="text-[11px] bg-white/80 dark:bg-gray-800/80 text-gray-500 px-3 py-0.5 rounded-full shadow-sm">
              {day}
            </span>
          </div>
        );
      }
      const fromMe  = getFromMe(m);
      const msgText = getText(m);
      const audio   = isAudio(m);
      const media   = isMedia(m);
      const key     = m.id && !m.id.startsWith("temp-") ? m.id : `msg-${idx}-${ts}`;
      elements.push(
        <div key={key} className={`flex ${fromMe ? "justify-end" : "justify-start"} mb-0.5`}>
          <div className={`max-w-[72%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
            fromMe
              ? "bg-[#DCF8C6] dark:bg-[#005C4B] text-gray-800 dark:text-white rounded-br-none"
              : "bg-white dark:bg-[#202C33] text-gray-800 dark:text-white rounded-bl-none"
          }`}>
            {audio ? (
              <div className="flex items-center gap-1.5 italic opacity-75">
                <span>🎵</span><span>Mensagem de áudio</span>
              </div>
            ) : media ? (
              <div className="flex items-center gap-1.5 italic opacity-75">
                <span>{mediaLabel(m)}</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words text-sm">
                {formatMsgText(msgText)}
              </div>
            )}
            <div className={`flex items-center gap-1 mt-0.5 ${fromMe ? "justify-end" : "justify-start"}`}>
              <span className="text-[10px] opacity-60">
                {ts ? new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
              </span>
              {fromMe && (
                m.status === "read"
                  ? <CheckCheck size={11} className="opacity-60 text-blue-500" />
                  : <Check size={11} className="opacity-60" />
              )}
            </div>
          </div>
        </div>
      );
    });
    return elements;
  }

  // ── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[640px] rounded-xl overflow-hidden border border-border w-full">

      {/* ── Sidebar ── */}
      <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-border">

        {/* Header */}
        <div className="bg-[#075E54] dark:bg-[#1F2C33] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {instancias.length > 1 ? (
              <Select value={instanciaId} onValueChange={setInstanciaId}>
                <SelectTrigger className="h-7 text-xs bg-transparent border-white/30 text-white flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {instancias.map(i => (
                    <SelectItem key={i.instancia_id} value={i.instancia_id} className="text-xs">
                      {i.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="font-semibold text-sm truncate">{nomeInstancia}</span>
            )}
          </div>
          <button onClick={carregarChats} disabled={loadingChats} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
            {loadingChats
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <RefreshCw size={15} />}
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto bg-background">
          {loadingToken ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            </div>
          ) : loadingChats && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
              <p className="text-xs text-muted-foreground">Carregando conversas...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
              <MessageSquare size={28} className="text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                {instanciaId ? "Nenhuma conversa" : "Conecte um número primeiro"}
              </p>
            </div>
          ) : (
            chats.map(chat => {
              const ativo = chatAtivo?.wa_chatid === chat.wa_chatid;
              return (
                <button
                  key={chat.wa_chatid}
                  onClick={() => abrirChat(chat)}
                  className={`w-full text-left px-3 py-2.5 border-b border-border/50 flex items-center gap-3 transition-colors ${
                    ativo ? "bg-accent border-l-2 border-emerald-500" : "hover:bg-accent/50 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {chat.imagePreview ? (
                      <img src={chat.imagePreview} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarColor(chat.wa_chatid)}`}>
                        {chatInitials(chat)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate flex-1 mr-2">
                        {chatName(chat)}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatTime(chat.wa_lastMsgTimestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[11px] text-muted-foreground truncate flex-1">
                        {lastMsgPreview(chat)}
                      </span>
                      {(chat.wa_unreadCount || 0) > 0 && (
                        <span className="ml-1 flex-shrink-0 bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {chat.wa_unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Conversation area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!chatAtivo ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F0F2F5] dark:bg-[#0B141A] gap-3">
            <MessageSquare size={48} className="text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Selecione uma conversa</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-[#075E54] dark:bg-[#1F2C33] text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
              {chatAtivo.imagePreview ? (
                <img src={chatAtivo.imagePreview} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarColor(chatAtivo.wa_chatid)}`}>
                  {chatInitials(chatAtivo)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{chatName(chatAtivo)}</p>
                {(() => {
                  const raw = chatAtivo.wa_chatid
                    .replace("@s.whatsapp.net","").replace("@c.us","")
                    .replace("@g.us","").replace("@lid","");
                  const digits = raw.replace(/\D/g,"");
                  if (isBrazilianPhone(digits)) {
                    return <p className="text-[11px] opacity-70 truncate">{formatPhone(digits)}</p>;
                  }
                  return null;
                })()}
              </div>
              <button
                onClick={() => carregarMensagens(chatAtivo)}
                className="opacity-70 hover:opacity-100 transition-opacity p-1"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-3 bg-[#ECE5DD] dark:bg-[#0B141A]"
              onScroll={e => {
                const el = e.currentTarget;
                isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
              }}
            >
              {loadingMsgs && mensagens.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                  <p className="text-xs text-muted-foreground">Carregando mensagens...</p>
                </div>
              )}

              {mensagens.length > 0 && (
                <>
                  {renderMessages()}
                  <div ref={bottomRef} />
                </>
              )}

              {!loadingMsgs && mensagens.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-muted-foreground">Nenhuma mensagem</p>
                </div>
              )}

              {erro && (
                <p className="text-xs text-destructive text-center py-2 bg-destructive/10 rounded px-3 mt-2">
                  {erro}
                </p>
              )}
            </div>

            {/* Input */}
            <div className="bg-[#F0F2F5] dark:bg-[#202C33] px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
              <Input
                placeholder="Digite uma mensagem"
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && !enviando) {
                    e.preventDefault();
                    enviarMensagem();
                  }
                }}
                className="flex-1 rounded-full bg-white dark:bg-[#2A3942] border-0 px-4 h-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={enviando}
              />
              <button
                onClick={enviarMensagem}
                disabled={enviando || !texto.trim()}
                className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center text-white transition-colors flex-shrink-0"
              >
                {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
