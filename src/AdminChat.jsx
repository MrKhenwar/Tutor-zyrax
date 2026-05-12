import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "./api";

const chatApi = api;

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const initials = (name) =>
  (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const typeColor = (t) =>
  ({ tutor: "#7c3aed", zyrax: "#0284c7", zylo: "#059669" }[t] || "#6b7280");

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar = ({ name, picture, size = 38 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: picture ? "transparent" : "#334155",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.38, fontWeight: 700, color: "#fff",
    flexShrink: 0, overflow: "hidden",
  }}>
    {picture
      ? <img src={picture} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      : initials(name)}
  </div>
);

// ── Shared chat logic hook ────────────────────────────────────────────────────

function useChatLogic({ isOpen = true } = {}) {
  const [view, setView]                     = useState("conversations");
  const [conversations, setConversations]   = useState([]);
  const [loadingConvs, setLoadingConvs]     = useState(true);
  const [activeUser, setActiveUser]         = useState(null);
  const [messages, setMessages]             = useState([]);
  const [draft, setDraft]                   = useState("");
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [sending, setSending]               = useState(false);
  const [sendError, setSendError]           = useState("");

  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);
  const searchDebounce = useRef(null);
  const inputRef       = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const r = await chatApi.get("/chat/conversations/");
      setConversations(r.data || []);
    } catch (_) {} finally {
      setLoadingConvs(false);
    }
  }, []);

  const fetchMessages = useCallback(async (userId) => {
    try {
      const r = await chatApi.get(`/chat/messages/${userId}/`);
      setMessages(r.data || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!isOpen || view !== "conversations") return;
    fetchConversations();
    pollRef.current = setInterval(fetchConversations, 10000);
    return () => clearInterval(pollRef.current);
  }, [isOpen, view, fetchConversations]);

  useEffect(() => {
    if (!isOpen || view !== "thread" || !activeUser) return;
    fetchMessages(activeUser.id);
    pollRef.current = setInterval(() => fetchMessages(activeUser.id), 3000);
    return () => clearInterval(pollRef.current);
  }, [isOpen, view, activeUser, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (view === "thread") setTimeout(() => inputRef.current?.focus(), 80);
  }, [view]);

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        const r = await chatApi.get("/chat/search-users/", { params: { q: searchQuery.trim() } });
        setSearchResults(r.data || []);
      } catch (_) {}
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery]);

  const openThread = (user) => {
    setActiveUser(user);
    setMessages([]);
    setSearchQuery("");
    setSearchResults([]);
    setView("thread");
  };

  const goBack = () => {
    clearInterval(pollRef.current);
    setView("conversations");
    setActiveUser(null);
    setMessages([]);
    setSearchQuery("");
    setSearchResults([]);
    fetchConversations();
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !activeUser || sending) return;
    setSending(true);
    setSendError("");
    setDraft("");
    try {
      const r = await chatApi.post("/chat/send/", { receiver_id: activeUser.id, content });
      setMessages((prev) => [...prev, r.data]);
      fetchConversations();
    } catch (_) {
      setDraft(content);
      setSendError("Failed to send. Try again.");
      setTimeout(() => setSendError(""), 3000);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return {
    view, setView,
    conversations, loadingConvs, activeUser, messages,
    draft, setDraft,
    searchQuery, setSearchQuery,
    searchResults,
    sending, sendError,
    messagesEndRef, inputRef,
    openThread, goBack, sendMessage, handleKeyDown,
    fetchConversations,
  };
}

// ── Chat UI body (shared between section and panel) ───────────────────────────

function ChatBody({ view, setView, conversations, loadingConvs, activeUser, messages,
  draft, setDraft, searchQuery, setSearchQuery, searchResults,
  sending, sendError, messagesEndRef, inputRef,
  openThread, goBack, sendMessage, handleKeyDown,
  onNewChat,
}) {
  return (
    <>
      {/* Header */}
      <div style={S.header}>
        {view !== "conversations" && (
          <button onClick={goBack} style={S.iconBtn}>←</button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {view === "conversations" && <span style={S.title}>Messages</span>}
          {view === "search" && <span style={S.title}>New Chat</span>}
          {view === "thread" && activeUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={activeUser.name} picture={activeUser.profile_picture} size={28} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeUser.name || activeUser.username}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: typeColor(activeUser.user_type), textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {activeUser.user_type} · @{activeUser.username}
                </div>
              </div>
            </div>
          )}
        </div>
        {view === "conversations" && (
          <button
            onClick={onNewChat}
            style={S.iconBtn}
            title="Start new chat"
          >✏️</button>
        )}
      </div>

      {/* Search bar */}
      {(view === "conversations" || view === "search") && (
        <div style={S.searchBar}>
          <input
            autoFocus={view === "search"}
            type="text"
            placeholder="Search users by name or phone…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setView("search"); }}
            onFocus={() => { if (view !== "search") setView("search"); }}
            style={S.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setView("conversations"); }}
              style={{ ...S.iconBtn, fontSize: 12, color: "#94a3b8" }}
            >✕</button>
          )}
        </div>
      )}

      {/* Body */}
      <div style={S.body}>
        {view === "conversations" && (
          loadingConvs ? (
            <div style={{ padding: "8px 4px" }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#334155", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ height: 11, background: "#334155", borderRadius: 6, width: "55%" }} />
                    <div style={{ height: 9, background: "#1e3045", borderRadius: 6, width: "75%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div style={S.empty}>
              No conversations yet.<br />
              <button onClick={onNewChat} style={S.startBtn}>Start a chat ✏️</button>
            </div>
          ) : (
            conversations.map((c) => (
              <button key={c.id} onClick={() => openThread(c)} style={S.row}>
                <Avatar name={c.name} picture={c.profile_picture} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.rowTop}>
                    <span style={S.rowName}>{c.name || c.username}</span>
                    <span style={S.rowTime}>{fmtTime(c.last_message_time)}</span>
                  </div>
                  <div style={S.rowBottom}>
                    <span style={S.rowPreview}>{c.is_sent_by_me ? "You: " : ""}{c.last_message}</span>
                    {c.unread_count > 0 && <span style={S.pill}>{c.unread_count}</span>}
                  </div>
                </div>
              </button>
            ))
          )
        )}

        {view === "search" && (
          searchQuery.trim().length < 2 ? (
            <div style={S.empty}>Type at least 2 characters to search</div>
          ) : searchResults.length === 0 ? (
            <div style={S.empty}>No users found for "{searchQuery}"</div>
          ) : (
            searchResults.map((u) => (
              <button key={u.id} onClick={() => openThread(u)} style={S.row}>
                <Avatar name={u.name} picture={u.profile_picture} />
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.name || u.username}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 1 }}>
                    <span style={{ color: typeColor(u.user_type), fontWeight: 600, textTransform: "uppercase" }}>{u.user_type}</span>
                    <span style={{ color: "#64748b" }}> · @{u.username}</span>
                  </div>
                </div>
              </button>
            ))
          )
        )}

        {view === "thread" && (
          messages.length === 0
            ? <div style={S.empty}>No messages yet. Say hello!</div>
            : messages.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.is_mine ? "flex-end" : "flex-start", marginBottom: 6 }}>
                  <div style={m.is_mine ? S.mine : S.theirs}>
                    <span style={{ fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</span>
                    <span style={S.ts}>{fmtTime(m.timestamp)}</span>
                  </div>
                </div>
              ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {view === "thread" && (
        <div style={S.inputArea}>
          {sendError && <div style={S.errorMsg}>{sendError}</div>}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              style={S.textarea}
            />
            <button
              onClick={sendMessage}
              disabled={!draft.trim() || sending}
              style={{ ...S.sendBtn, opacity: !draft.trim() || sending ? 0.4 : 1 }}
            >
              {sending ? "…" : "➤"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── ChatSection — full-page section for dashboard ─────────────────────────────

export function ChatSection({ fullPage = false }) {
  const chat = useChatLogic();

  const onNewChat = () => {
    chat.setView("search");
    chat.setSearchQuery("");
  };

  const containerStyle = fullPage
    ? { ...SS.container, height: "calc(100vh - 120px)" }
    : SS.container;

  return (
    <div style={containerStyle}>
      <ChatBody
        {...chat}
        onNewChat={onNewChat}
      />
    </div>
  );
}

// ── AdminChat — FAB + popup (kept for legacy use) ─────────────────────────────

export default function AdminChat() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const chat = useChatLogic({ isOpen: open });

  const fetchUnread = useCallback(async () => {
    try {
      const r = await chatApi.get("/chat/unread-count/");
      setUnread(r.data.unread_count || 0);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!open) {
      fetchUnread();
      const id = setInterval(fetchUnread, 10000);
      return () => clearInterval(id);
    }
  }, [open, fetchUnread]);

  const handleOpen = () => {
    setOpen(true);
    chat.setView("conversations");
    chat.fetchConversations();
  };

  const onNewChat = () => {
    chat.setView("search");
    chat.setSearchQuery("");
  };

  return (
    <>
      <button
        onClick={() => open ? setOpen(false) : handleOpen()}
        style={{ ...S.fab, position: "fixed" }}
        title="Chat with users"
      >
        <span style={{ fontSize: 22 }}>{open ? "✕" : "💬"}</span>
        {!open && unread > 0 && (
          <span style={S.badge}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={S.panel}>
          <ChatBody
            {...chat}
            onNewChat={onNewChat}
          />
          {/* extra close button on panel header is injected via ChatBody's onNewChat,
              but we need to handle panel-level close separately */}
        </div>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const SS = {
  container: {
    background: "#1e293b",
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,.25)",
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 210px)",
    minHeight: 420,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.08)",
  },
};

const S = {
  fab: {
    bottom: 28, right: 28,
    width: 52, height: 52,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
    color: "#fff", border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(79,70,229,.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9000,
  },
  badge: {
    position: "absolute", top: -4, right: -4,
    background: "#ef4444", color: "#fff",
    fontSize: 10, fontWeight: 700,
    borderRadius: "50%", width: 18, height: 18,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid #fff", pointerEvents: "none",
  },
  panel: {
    position: "fixed", bottom: 90, right: 28,
    width: 340, height: 540,
    background: "#1e293b",
    borderRadius: 16,
    boxShadow: "0 12px 40px rgba(0,0,0,.55)",
    display: "flex", flexDirection: "column",
    zIndex: 8999, overflow: "hidden",
    border: "1px solid rgba(255,255,255,.08)",
  },
  header: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "12px 12px",
    background: "#0f172a",
    borderBottom: "1px solid rgba(255,255,255,.07)",
    flexShrink: 0,
  },
  title: { fontWeight: 700, fontSize: 15, color: "#f1f5f9" },
  iconBtn: {
    background: "none", border: "none",
    color: "#94a3b8", fontSize: 16,
    cursor: "pointer", padding: "2px 6px",
    borderRadius: 6, lineHeight: 1, flexShrink: 0,
  },
  searchBar: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 12px",
    background: "#0f172a",
    borderBottom: "1px solid rgba(255,255,255,.06)",
    flexShrink: 0,
  },
  searchInput: {
    flex: 1, padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.1)",
    background: "#1e293b",
    color: "#f1f5f9", fontSize: 13,
    outline: "none",
  },
  body: { flex: 1, overflowY: "auto" },
  empty: {
    textAlign: "center", color: "#64748b",
    fontSize: 13, padding: "40px 20px", lineHeight: 1.9,
  },
  startBtn: {
    marginTop: 10, background: "#4f46e5", color: "#fff",
    border: "none", borderRadius: 8,
    padding: "8px 18px", cursor: "pointer",
    fontSize: 13, fontWeight: 600,
  },
  row: {
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", background: "none", border: "none",
    cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.05)",
    textAlign: "left",
  },
  rowTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  rowName: { fontWeight: 600, fontSize: 13, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rowTime: { fontSize: 10, color: "#94a3b8", flexShrink: 0, marginLeft: 6 },
  rowBottom: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  rowPreview: { fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 },
  pill: {
    background: "#4f46e5", color: "#fff",
    fontSize: 10, fontWeight: 700,
    borderRadius: 10, padding: "1px 6px",
    flexShrink: 0, marginLeft: 4,
  },
  mine: {
    background: "#4f46e5", color: "#fff",
    borderRadius: "14px 14px 4px 14px",
    padding: "8px 12px", maxWidth: "78%",
    display: "flex", flexDirection: "column", gap: 3,
  },
  theirs: {
    background: "#334155", color: "#f1f5f9",
    borderRadius: "14px 14px 14px 4px",
    padding: "8px 12px", maxWidth: "78%",
    display: "flex", flexDirection: "column", gap: 3,
  },
  ts: { fontSize: 10, opacity: 0.55, alignSelf: "flex-end", marginTop: 2 },
  inputArea: {
    padding: "10px 12px",
    borderTop: "1px solid rgba(255,255,255,.07)",
    background: "#0f172a", flexShrink: 0,
  },
  errorMsg: {
    color: "#f87171", fontSize: 11,
    marginBottom: 6, textAlign: "center",
  },
  textarea: {
    flex: 1, padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.1)",
    background: "#1e293b", color: "#f1f5f9",
    fontSize: 13, outline: "none",
    resize: "none", lineHeight: 1.4,
    maxHeight: 80, overflowY: "auto",
    fontFamily: "inherit",
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: "50%",
    background: "#4f46e5", color: "#fff",
    border: "none", cursor: "pointer",
    fontSize: 15, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "opacity .15s",
  },
};
