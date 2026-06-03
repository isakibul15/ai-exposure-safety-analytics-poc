import { useState, useEffect } from 'react';
import { Brain, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, BookOpen, Loader } from 'lucide-react';
import { getRecommendations } from '../services/openRouterService';

const PRIORITY_STYLES = {
  High:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: '#ef4444', dot: '#ef4444' },
  Medium: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  color: '#f59e0b', dot: '#f59e0b' },
  Low:    { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  color: '#10b981', dot: '#10b981' },
};

const FALLBACK = [
  {
    title: 'Increase ventilation in Sensor / Gula zone',
    description: 'Current lead exposure in the Sensor / Gula area exceeds 80% of the NGV limit. Increase local exhaust ventilation capacity and inspect filtration units per AFS 2020:6 § 14.',
    priority: 'High',
    source_reference: 'AFS 2020:6, ICSC 0052 (Lead), GreenMetalWaste study',
  },
  {
    title: 'Schedule BPb retest for elevated employees',
    description: 'Three employees show BPb levels above 70% of the gender-specific limit. Schedule re-testing within 30 days and consider temporary reassignment per AFS 2011:19 biomonitoring protocol.',
    priority: 'High',
    source_reference: 'AFS 2011:19, Rapport 2014:1',
  },
  {
    title: 'Enforce RPE in Flotation 2.2 / 3.2',
    description: 'Lead and cadmium dust measurements in Flotation areas remain elevated. Mandatory use of P3-class respirators is recommended during processing operations.',
    priority: 'Medium',
    source_reference: 'AFS 2020:6, ICSC 0116 (Cadmium), Rapport 2014:10',
  },
];

function RecCard({ rec, idx }) {
  const [exp, setExp] = useState(false);
  const ps = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.Medium;

  return (
    <div
      onClick={() => setExp(e => !e)}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        borderLeft: '3px solid ' + ps.dot,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = ps.border}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.borderLeftColor = ps.dot; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Index badge */}
        <div style={{
          width: 22, height: 22, borderRadius: 6, background: ps.bg,
          border: '1px solid ' + ps.border, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 10, fontWeight: 800, color: ps.color, flexShrink: 0,
        }}>
          {idx + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {rec.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                background: ps.bg, border: '1px solid ' + ps.border, color: ps.color,
              }}>
                {rec.priority}
              </span>
              {exp ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
            </div>
          </div>

          {exp && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
                {rec.description}
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                background: 'rgba(124,109,250,0.06)', border: '1px solid rgba(124,109,250,0.15)',
                borderRadius: 8,
              }}>
                <BookOpen size={11} color="#7c6dfa" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: '#7c6dfa', fontWeight: 600 }}>
                  {rec.source_reference}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecommendationsCard() {
  const [recs, setRecs]           = useState([]);
  const [status, setStatus]       = useState('idle');
  const [errMsg, setErrMsg]       = useState('');
  const [lastFetch, setLastFetch] = useState(null);

  async function fetch_() {
    setStatus('loading');
    setErrMsg('');
    try {
      const result = await getRecommendations();
      if (Array.isArray(result) && result.length > 0) {
        setRecs(result);
        setStatus('done');
      } else {
        setRecs(FALLBACK);
        setStatus('fallback');
      }
    } catch (e) {
      setRecs(FALLBACK);
      setStatus('error');
      setErrMsg(e.message);
    }
    setLastFetch(new Date());
  }

  // Auto-fetch on mount
  useEffect(() => { fetch_(); }, []);

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(124,109,250,0.18) 0%, rgba(34,211,238,0.1) 100%)',
          border: '1px solid rgba(124,109,250,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={17} color="#7c6dfa" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
            AI Safety Recommendations
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
            Powered by ChemSafe AI · llama-3.3-70b · Groq · Based on live sensor + biomonitoring data
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastFetch && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {lastFetch.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetch_}
            disabled={status === 'loading'}
            title="Refresh recommendations"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              fontSize: 11, color: 'var(--text-muted)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (status !== 'loading') { e.currentTarget.style.borderColor = 'rgba(124,109,250,0.4)'; e.currentTarget.style.color = '#7c6dfa'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <RefreshCw
              size={12}
              style={{ animation: status === 'loading' ? 'spin 1s linear infinite' : 'none' }}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Status banners */}
      {status === 'loading' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
          background: 'rgba(124,109,250,0.06)', border: '1px solid rgba(124,109,250,0.15)',
          borderRadius: 10, marginBottom: 14,
        }}>
          <Loader size={14} color="#7c6dfa" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Analysing sensor readings, biomonitoring data, and risk matrix...
          </span>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, marginBottom: 12, fontSize: 11, color: '#f87171',
        }}>
          <AlertTriangle size={13} />
          <span>AI unavailable ({errMsg || 'network error'}). Showing reference recommendations.</span>
        </div>
      )}

      {status === 'fallback' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: 8, marginBottom: 12, fontSize: 11, color: '#f59e0b',
        }}>
          <AlertTriangle size={12} />
          <span>AI returned empty response. Showing reference recommendations.</span>
        </div>
      )}

      {/* Recommendation cards */}
      {(status === 'done' || status === 'error' || status === 'fallback') && recs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recs.map((rec, i) => <RecCard key={i} rec={rec} idx={i} />)}
        </div>
      )}

      {/* Skeleton loading state */}
      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 48, borderRadius: 12,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(124,109,250,0.08) 50%, transparent 100%)',
                animation: 'shimmer 1.4s infinite',
                transform: 'translateX(-100%)',
              }} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
