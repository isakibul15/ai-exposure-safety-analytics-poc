import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader, ChevronDown, Beaker } from 'lucide-react';
import { askSafetyAIStream } from '../services/openRouterService';

// ── Simple markdown-ish renderer (bold + bullet lists) ─────────
function MsgContent({ text }) {
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--text-primary)' }}>
      {lines.map((line, i) => {
        // bullet list
        const isBullet = /^[-•*]\s/.test(line);
        const content = line.replace(/^[-•*]\s/, '');
        // bold: **text**
        const parts = content.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
            : p
        );
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        if (isBullet) return (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
            <span style={{ color: '#7c6dfa', flexShrink: 0, marginTop: 1 }}>▸</span>
            <span>{rendered}</span>
          </div>
        );
        return <div key={i} style={{ marginBottom: 2 }}>{rendered}</div>;
      })}
    </div>
  );
}

const SUGGESTED = [
  'Which zones have the highest lead exposure?',
  'Who has BPb above 70% of the limit?',
  'What are the top risk matrix items?',
  'Summarize compliance status for 2026',
];

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m **ChemSafe AI**, your occupational health assistant for Stena Recycling NF.\n\nI have full access to your exposure measurements, biomonitoring data, risk matrix, and IoT sensor telemetry. Ask me anything about safety compliance, risk zones, or employee health metrics.',
    },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggested, setShowSuggested] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const historyRef = useRef([]); // {role, content}[] for API

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setShowSuggested(false);
    setLoading(true);

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);

    // Build history for API (skip the initial greeting)
    const history = historyRef.current;
    const placeholderIdx = messages.length + 1; // will be inserted below

    // Add streaming placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    await askSafetyAIStream(
      msg,
      history,
      // onChunk
      (_token, full) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: full, streaming: true };
          return updated;
        });
      },
      // onDone
      (full) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: full, streaming: false };
          return updated;
        });
        // Update history ref
        historyRef.current = [
          ...history,
          { role: 'user', content: msg },
          { role: 'assistant', content: full },
        ];
        setLoading(false);
      },
      // onError
      (err) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Error: ' + err + '\n\nPlease check your API key in `.env` and try again.',
            streaming: false,
            error: true,
          };
          return updated;
        });
        setLoading(false);
      },
    );
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      {/* ── Floating Action Button ─────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="ChemSafe AI Assistant"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: open
            ? 'var(--bg-elevated)'
            : 'linear-gradient(135deg, #7c6dfa 0%, #22d3ee 100%)',
          border: open ? '1px solid var(--border)' : 'none',
          boxShadow: open
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(124,109,250,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {open
          ? <X size={20} color="var(--text-secondary)" />
          : <MessageCircle size={22} color="#fff" strokeWidth={2.2} />
        }
        {/* Unread dot — shown only when closed and has messages */}
        {!open && messages.length > 1 && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 10, height: 10, borderRadius: '50%',
            background: '#10b981', border: '2px solid var(--bg-base)',
          }} />
        )}
      </button>

      {/* ── Chat Window ───────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 94, right: 28, zIndex: 999,
          width: 400, maxHeight: '70vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          animation: 'fadeSlideUp 0.18s ease',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(124,109,250,0.15) 0%, rgba(34,211,238,0.08) 100%)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c6dfa 0%, #22d3ee 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(124,109,250,0.4)',
            }}>
              <Beaker size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>ChemSafe AI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span className="live-dot" style={{ width: 6, height: 6 }} />
                <span style={{ fontSize: 10, color: 'var(--safe)' }}>Online · llama-3.3-70b · Groq</span>
              </div>
            </div>
            <button
              onClick={() => { setMessages([messages[0]]); historyRef.current = []; setShowSuggested(true); }}
              style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 12,
            scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: msg.role === 'user'
                    ? 'rgba(124,109,250,0.2)'
                    : 'linear-gradient(135deg, #7c6dfa22 0%, #22d3ee22 100%)',
                  border: '1px solid ' + (msg.role === 'user' ? 'rgba(124,109,250,0.3)' : 'rgba(34,211,238,0.2)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 2,
                }}>
                  {msg.role === 'user'
                    ? <User size={13} color="#7c6dfa" />
                    : <Bot size={13} color="#22d3ee" />
                  }
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: '80%',
                  background: msg.role === 'user'
                    ? 'rgba(124,109,250,0.14)'
                    : (msg.error ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)'),
                  border: '1px solid ' + (
                    msg.role === 'user'
                      ? 'rgba(124,109,250,0.25)'
                      : msg.error ? 'rgba(239,68,68,0.25)' : 'var(--border)'
                  ),
                  borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  padding: '10px 12px',
                }}>
                  <MsgContent text={msg.content} />
                  {msg.streaming && (
                    <span style={{
                      display: 'inline-block', width: 6, height: 14,
                      background: '#7c6dfa', borderRadius: 1,
                      marginLeft: 2, verticalAlign: 'middle',
                      animation: 'blink 0.8s step-end infinite',
                    }} />
                  )}
                </div>
              </div>
            ))}

            {/* Suggested questions */}
            {showSuggested && messages.length === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Suggested questions
                </div>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => send(q)} style={{
                    textAlign: 'left', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    padding: '7px 10px', cursor: 'pointer', fontSize: 11,
                    color: 'var(--text-secondary)', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,109,250,0.4)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: 'var(--bg-elevated)',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder="Ask about exposure, compliance, risk..."
              rows={1}
              style={{
                flex: 1, resize: 'none', overflowY: 'hidden',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 12px', color: 'var(--text-primary)',
                fontSize: 12, outline: 'none', lineHeight: 1.5,
                maxHeight: 80, fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(124,109,250,0.5)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #7c6dfa 0%, #22d3ee 100%)'
                  : 'var(--bg-card)',
                border: '1px solid ' + (input.trim() && !loading ? 'transparent' : 'var(--border)'),
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                boxShadow: input.trim() && !loading ? '0 0 12px rgba(124,109,250,0.35)' : 'none',
              }}
            >
              {loading
                ? <Loader size={14} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                : <Send size={14} color={input.trim() && !loading ? '#fff' : 'var(--text-muted)'} />
              }
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
