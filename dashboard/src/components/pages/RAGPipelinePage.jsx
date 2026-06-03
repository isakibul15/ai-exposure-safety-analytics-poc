import { useState, useMemo } from 'react';
import { Brain, FileText, Search, CheckCircle, XCircle, Zap, Database, ChevronRight, ChevronDown, BarChart2, Folder, FolderOpen, File } from 'lucide-react';
import { mockIngestionLogs, DB_FOLDER_STRUCTURE } from '../../data/couchbaseSchema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Simulated vector search results
const MOCK_SEARCH_RESULTS = [
  { score: 0.942, chunk: 'Sensor / Gula hörnan: Inorganic dust (inhalable) measured at 39 mg/m³ against NGV of 5 mg/m³. Risk score 6 (P=2, C=3). P3 filter masks mandatory.', source: 'NF-Riskbedömning.csv', docType: 'risk_assessment' },
  { score: 0.891, chunk: 'Blood lead monitoring 2025 Q4: Male employees average 0.474 µmol/L (31.6% of limit). Female employees 0.336 µmol/L (67.2% of limit). No exceedances.', source: 'Sammanställning_Bly_NF.xlsx', docType: 'biomonitoring' },
  { score: 0.834, chunk: 'Flotation areas 2.2 and 3.2: Dust levels decreased by 85% since 2020 following ventilation upgrade. Hydrocarbons stable at 3.4% NGV.', source: 'NF-Alla_210603.csv', docType: 'measurement_campaign' },
  { score: 0.801, chunk: 'P3 full-face respirators required for all workers in Sensor/Gula zone. PPE compliance audit passed Q1 2026. Next audit scheduled Q3 2026.', source: 'NF-7462.csv', docType: 'risk_assessment' },
  { score: 0.763, chunk: 'Ventilation system: tv132 duct capacity 18,400 l/s, tv145 capacity 22,100 l/s. Total system capacity 128,885 l/s covering 12 work areas.', source: 'NF-tv145.csv', docType: 'ventilation_data' },
];

const PRESET_QUERIES = [
  'Dust exposure Sensor/Gula area',
  'Blood lead monitoring results 2025',
  'Ventilation capacity by duct',
  'PPE requirements flotation areas',
];

const CAT_COLORS = {
  root:                    '#22d3ee',
  risk_assessments:        '#7c6dfa',
  measurement_campaigns:   '#22d3ee',
  individual_measurements: '#f59e0b',
  substance_analysis:      '#f97316',
  ventilation_data:        '#10b981',
  threshold_exceedances:   '#ef4444',
  risk_models:             '#a78bfa',
  reference_docs:          '#6b7a99',
};
const TYPE_COLORS = { csv: '#22d3ee', excel: '#10b981', pdf: '#7c6dfa' };

function StatusIcon({ status }) {
  return status === 'completed'
    ? <CheckCircle size={13} color="#10b981" />
    : <XCircle size={13} color="#ef4444" />;
}

// ── Folder Tree component ─────────────────────────────────────
function FolderNode({ folder, logs, search }) {
  const [open, setOpen] = useState(false);
  const color = CAT_COLORS[folder.id] || '#6b7a99';
  const folderLogs = logs.filter(l => l.category === folder.id);
  const matched = search
    ? folderLogs.filter(l => l.file.toLowerCase().includes(search.toLowerCase()))
    : folderLogs;
  const totalChunks = folderLogs.reduce((s, l) => s + l.chunks, 0);
  const hasAlert = search && matched.length > 0;

  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', background: open ? color + '10' : 'transparent', border: '1px solid ' + (open ? color + '33' : 'transparent'), borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        {open ? <FolderOpen size={14} color={color} /> : <Folder size={14} color={color} />}
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
          {folder.name}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{folderLogs.length} files · {totalChunks} chunks</span>
        {hasAlert && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: color + '22', color, fontWeight: 700 }}>{matched.length} match</span>}
        {open ? <ChevronDown size={12} color="var(--text-muted)" /> : <ChevronRight size={12} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ marginLeft: 20, marginTop: 2, borderLeft: '1px solid ' + color + '33', paddingLeft: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 0 6px', fontStyle: 'italic' }}>{folder.description}</div>
          {(search ? matched : folderLogs).map(log => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, marginBottom: 2, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <File size={11} color={TYPE_COLORS[log.type] || '#6b7a99'} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.file}</span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: (TYPE_COLORS[log.type] || '#6b7a99') + '18', color: TYPE_COLORS[log.type] || '#6b7a99', fontFamily: 'monospace', flexShrink: 0 }}>{log.type.toUpperCase()}</span>
              <span style={{ fontSize: 10, color: '#22d3ee', fontWeight: 700, flexShrink: 0 }}>{log.chunks}c</span>
              <StatusIcon status={log.status} />
            </div>
          ))}
          {search && matched.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 8px' }}>No matches in this folder</div>
          )}
        </div>
      )}
    </div>
  );
}

function ChunksChart({ logs }) {
  const byCategory = DB_FOLDER_STRUCTURE.folders.map(f => ({
    name: f.name.replace('/', '').replace('_', ' ').substring(0, 10),
    chunks: logs.filter(l => l.category === f.id).reduce((s, l) => s + l.chunks, 0),
    color: CAT_COLORS[f.id] || '#6b7a99',
  }));
  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart data={byCategory} margin={{ left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b7a99' }} />
        <YAxis tick={{ fontSize: 9, fill: '#6b7a99' }} />
        <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 11 }} />
        <Bar dataKey="chunks" radius={[3,3,0,0]} maxBarSize={28}
          fill="#7c6dfa"
          label={false}
          activeBar={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function RAGPipelinePage() {
  const [treeSearch, setTreeSearch] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('tree');

  const stats = useMemo(() => ({
    total: mockIngestionLogs.length,
    completed: mockIngestionLogs.filter(l => l.status === 'completed').length,
    totalChunks: mockIngestionLogs.reduce((s, l) => s + l.chunks, 0),
    totalEmbeddings: mockIngestionLogs.reduce((s, l) => s + l.embeddings, 0),
  }), []);

  // flat list filtered by search (for list tab)
  const flatFiltered = useMemo(() => {
    if (!treeSearch) return mockIngestionLogs;
    return mockIngestionLogs.filter(l => l.file.toLowerCase().includes(treeSearch.toLowerCase()) || l.category.includes(treeSearch.toLowerCase()));
  }, [treeSearch]);

  const runSearch = (q) => {
    if (!q.trim()) return;
    setSearching(true);
    setQuery(q);
    setTimeout(() => { setSearchResults(MOCK_SEARCH_RESULTS); setSearching(false); }, 900);
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>67 source files · 66 CSV + 1 XLSX · ingestion_logs + document_embeddings · Vector Search (384-dim)</div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 14 }}>
        {[
          { icon: FileText,    label: 'Source Files',     value: stats.total,           color: '#7c6dfa' },
          { icon: CheckCircle, label: 'Ingested OK',       value: stats.completed,       color: '#10b981' },
          { icon: Database,    label: 'Total Chunks',      value: stats.totalChunks,     color: '#22d3ee' },
          { icon: Zap,         label: 'Embeddings (384d)', value: stats.totalEmbeddings, color: '#f59e0b' },
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

      {/* Main row: folder tree + chart + model */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Folder tree / flat list */}
        <div className="card" style={{ flex: 2, padding: 20 }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
              {[['tree','Folder Tree'],['list','All Files']].map(([v, l]) => (
                <button key={v} onClick={() => setActiveTab(v)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: activeTab === v ? 'var(--accent-violet)' : 'transparent', color: activeTab === v ? '#fff' : 'var(--text-muted)' }}>{l}</button>
              ))}
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={treeSearch} onChange={e => setTreeSearch(e.target.value)} placeholder="Filter files..."
                style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {treeSearch ? flatFiltered.length + ' matches' : stats.total + ' files'}
            </span>
          </div>

          {activeTab === 'tree' && (
            <div>
              {/* Root bucket/scope header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(124,109,250,0.08)', border: '1px solid rgba(124,109,250,0.2)', borderRadius: 8, marginBottom: 8 }}>
                <Database size={13} color="#7c6dfa" />
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#7c6dfa' }}>chemsafe_db/</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>67 files · {stats.totalChunks} chunks total</span>
              </div>

              {/* xlsx root file */}
              {DB_FOLDER_STRUCTURE.rootFiles.map(rf => (
                <div key={rf.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', marginLeft: 12, marginBottom: 6, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}>
                  <File size={12} color="#10b981" />
                  <span style={{ flex: 1, fontSize: 11, color: '#10b981', fontFamily: 'monospace' }}>{rf.name}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>XLSX</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>{rf.label}</span>
                </div>
              ))}

              {/* Folder nodes */}
              <div style={{ marginLeft: 12 }}>
                {DB_FOLDER_STRUCTURE.folders.map(folder => (
                  <FolderNode key={folder.id} folder={folder} logs={mockIngestionLogs} search={treeSearch} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['File', 'Category', 'Type', 'Status', 'Chunks', 'Date'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flatFiltered.map(log => {
                    const catColor = CAT_COLORS[log.category] || '#6b7a99';
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.file}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: catColor + '18', color: catColor }}>{log.category.replace(/_/g, ' ')}</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: (TYPE_COLORS[log.type] || '#6b7a99') + '18', color: TYPE_COLORS[log.type] || '#6b7a99', fontFamily: 'monospace' }}>{log.type.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <StatusIcon status={log.status} />
                            <span style={{ fontSize: 11, color: log.status === 'completed' ? '#10b981' : '#ef4444' }}>{log.status}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#22d3ee', textAlign: 'center' }}>{log.chunks}</td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)' }}>{log.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: chart + model config */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              <BarChart2 size={12} style={{ marginRight: 6, display: 'inline' }} />
              Chunks by Category
            </div>
            <ChunksChart logs={mockIngestionLogs} />
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Model Config</div>
            {[
              ['Model',      'all-MiniLM-L6-v2',            '#7c6dfa'],
              ['Dimensions', '384',                          '#22d3ee'],
              ['Similarity', 'dot_product',                  '#10b981'],
              ['Store',      'scorch v16',                   '#f59e0b'],
              ['Scope',      'safety_ops',                   '#a78bfa'],
              ['Sources',    '66 CSV + 1 XLSX',              '#22d3ee'],
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
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Search size={14} color="#10b981" />
          <div className="section-title">Vector Search Playground</div>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 5 }}>384-dim · dot_product · all source files</span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {PRESET_QUERIES.map(q => (
            <button key={q} onClick={() => runSearch(q)}
              style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.06)', color: '#10b981', fontSize: 11, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.06)'}>
              {q}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch(query)}
              placeholder="Enter natural language query for semantic search across all 67 source files..."
              style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button onClick={() => runSearch(query)} disabled={searching}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: searching ? 'not-allowed' : 'pointer', opacity: searching ? 0.7 : 1 }}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              {searchResults.length} results · "<span style={{ color: '#10b981' }}>{query}</span>"
            </div>
            {searchResults.map((r, i) => (
              <div key={i} style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ minWidth: 44, height: 24, borderRadius: 5, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>{(r.score * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 4, flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (r.score * 100) + '%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(124,109,250,0.15)', color: '#7c6dfa', fontFamily: 'monospace', flexShrink: 0 }}>{r.docType}</span>
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
