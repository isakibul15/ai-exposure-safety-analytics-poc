import { useState, useMemo } from 'react';
import { Brain, FileText, Search, CheckCircle, XCircle, Clock, Zap, Database, ChevronRight, BarChart2 } from 'lucide-react';
import { mockIngestionLogs } from '../../data/couchbaseSchema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Simulated vector search results for a query
const MOCK_SEARCH_RESULTS = [
  { score: 0.942, chunk: 'Sensor / Gula hörnan: Inorganic dust (inhalable) measured at 39 mg/m³ against NGV of 5 mg/m³. Risk score 6 (P=2, C=3). P3 filter masks mandatory.', source: 'chemsafe_risk_assessment_2026.pdf#p12', docType: 'risk_assessment' },
  { score: 0.891, chunk: 'Blood lead monitoring 2025 Q4: Male employees average 0.474 µmol/L (31.6% of limit). Female employees 0.336 µmol/L (67.2% of limit). No exceedances.', source: 'chemsafe_risk_assessment_2026.pdf#p28', docType: 'risk_assessment' },
  { score: 0.834, chunk: 'Flotation areas 2.2 and 3.2: Dust levels decreased by 85% since 2020 following ventilation upgrade. Hydrocarbons stable at 3.4% NGV.', source: 'measurement_campaign_260311.xlsx#sheet1', docType: 'measurement_campaign' },
  { score: 0.801, chunk: 'P3 full-face respirators required for all workers in Sensor/Gula zone. PPE compliance audit passed Q1 2026. Next audit scheduled Q3 2026.', source: 'chemsafe_risk_assessment_2026.pdf#p45', docType: 'risk_assessment' },
  { score: 0.763, chunk: 'Ventilation system capacity: 128,885 l/s. Last service: 2026-01-15. Covers 12 work areas. No deficiencies noted in latest inspection.', source: 'ventilation_audit_report_2023.pdf#p8', docType: 'ventilation_audit' },
];

const PRESET_QUERIES = [
  'What are the dust exposure levels in Sensor/Gula?',
  'Blood lead monitoring results 2025',
  'PPE requirements for flotation area',
  'Ventilation capacity and maintenance',
];

const TYPE_COLORS = { pdf: '#7c6dfa', excel: '#22d3ee' };
const STATUS_COLORS = { completed: '#10b981', error: '#ef4444', processing: '#f59e0b' };

function StatusIcon({ status }) {
  if (status === 'completed') return <CheckCircle size={14} color="#10b981" />;
  if (status === 'error') return <XCircle size={14} color="#ef4444" />;
  return <Clock size={14} color="#f59e0b" />;
}

function IngestionTimeline() {
  const data = mockIngestionLogs.slice(0, 6).map(l => ({
    date: l.date.slice(0, 7),
    chunks: l.chunks,
    ms: Math.round(l.ms / 100) / 10,
  })).reverse();

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7a99' }} />
        <YAxis tick={{ fontSize: 10, fill: '#6b7a99' }} />
        <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 11 }} formatter={v => [v, 'Chunks']} />
        <Bar dataKey="chunks" fill="#7c6dfa" radius={[3,3,0,0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function RAGPipelinePage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const stats = useMemo(() => ({
    total: mockIngestionLogs.length,
    completed: mockIngestionLogs.filter(l => l.status === 'completed').length,
    totalChunks: mockIngestionLogs.reduce((s, l) => s + l.chunks, 0),
    totalEmbeddings: mockIngestionLogs.reduce((s, l) => s + l.embeddings, 0),
  }), []);

  const runSearch = (q) => {
    if (!q.trim()) return;
    setSearching(true);
    setQuery(q);
    setTimeout(() => {
      setSearchResults(MOCK_SEARCH_RESULTS);
      setSearching(false);
    }, 900);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={18} color="#10b981" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>AI / RAG Pipeline</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ingestion_logs · document_embeddings · Vector Search (384-dim)</div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 14 }}>
        {[
          { icon: FileText,   label: 'Documents Ingested', value: stats.total,           color: '#7c6dfa' },
          { icon: CheckCircle,label: 'Completed',           value: stats.completed,       color: '#10b981' },
          { icon: Database,   label: 'Total Chunks',        value: stats.totalChunks,     color: '#22d3ee' },
          { icon: Zap,        label: 'Embeddings',          value: stats.totalEmbeddings, color: '#f59e0b' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card" style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', border: '1px solid ' + color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top row: ingestion log + timeline */}
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Ingestion log table */}
        <div className="card" style={{ flex: 2, padding: '20px' }}>
          <div className="section-title" style={{ marginBottom: 14 }}>
            <FileText size={12} style={{ marginRight: 6, display: 'inline' }} />
            Ingestion Logs
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Log ID', 'Source File', 'Type', 'Status', 'Chunks', 'Embeddings', 'Time', 'Date'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockIngestionLogs.map((log, i) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px', fontSize: 11, fontFamily: 'monospace', color: '#7c6dfa' }}>{log.id}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.file}>{log.file}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: (TYPE_COLORS[log.type] || '#6b7280') + '22', color: TYPE_COLORS[log.type] || '#6b7280', fontWeight: 700 }}>{log.type.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <StatusIcon status={log.status} />
                        <span style={{ fontSize: 11, color: STATUS_COLORS[log.status] }}>{log.status}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#22d3ee', textAlign: 'center' }}>{log.chunks}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#f59e0b', textAlign: 'center' }}>{log.embeddings}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-muted)' }}>{log.ms}ms</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-muted)' }}>{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline chart + model info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: '16px' }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              <BarChart2 size={12} style={{ marginRight: 6, display: 'inline' }} />
              Chunks per Ingestion
            </div>
            <IngestionTimeline />
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Model Config</div>
            {[
              ['Model', 'all-MiniLM-L6-v2', '#7c6dfa'],
              ['Dimensions', '384', '#22d3ee'],
              ['Similarity', 'dot_product', '#10b981'],
              ['Store', 'scorch v16', '#f59e0b'],
              ['Scope', 'safety_ops', '#a78bfa'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vector Search Playground */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Search size={14} color="#10b981" />
          <div className="section-title">Vector Search Playground</div>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 5 }}>384-dim · dot_product</span>
        </div>

        {/* Preset queries */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {PRESET_QUERIES.map(q => (
            <button key={q} onClick={() => runSearch(q)} style={{
              padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.06)', color: '#10b981', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
            }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
               onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.06)'}>
              {q}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSearch(query)}
              placeholder="Enter natural language query for semantic search..."
              style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button onClick={() => runSearch(query)} disabled={searching} style={{
            padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: searching ? 'not-allowed' : 'pointer', opacity: searching ? 0.7 : 1,
          }}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {searchResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              {searchResults.length} results · Query: "<span style={{ color: '#10b981' }}>{query}</span>"
            </div>
            {searchResults.map((r, i) => (
              <div key={i} style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 44, height: 24, borderRadius: 5, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>{(r.score * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 4, flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (r.score * 100) + '%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(124,109,250,0.15)', color: '#7c6dfa', fontFamily: 'monospace' }}>{r.docType}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.chunk}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <ChevronRight size={10} color="var(--text-muted)" />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.source}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
