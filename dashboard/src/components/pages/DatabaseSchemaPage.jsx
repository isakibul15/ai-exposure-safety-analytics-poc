import { useState } from 'react';
import { Database, Layers, Zap, Search, Copy, Check, ChevronRight, GitBranch, Cpu, Brain } from 'lucide-react';
import { n1qlSetup, n1qlJoinQuery, n1qlTimeSeriesQuery, vectorIndexDef, exampleDocuments } from '../../data/couchbaseSchema';

function CodeBlock({ code, title }) {
  const [copied, setCopied] = useState(false);
  const text = typeof code === 'string' ? code : JSON.stringify(code, null, 2);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ background: '#060e1f', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: '#0a1628' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{title}</span>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: copied ? 'var(--safe)' : 'var(--text-muted)', fontSize: 11 }}>
          {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '16px', overflowX: 'auto', fontSize: 12, lineHeight: 1.7, color: '#c8d8f0', fontFamily: "monospace" }}>{text}</pre>
    </div>
  );
}

const PILLARS = [
  { id: 'p1', label: 'Pillar 1', title: 'Core Entities', icon: Database, color: '#7c6dfa', dim: 'rgba(124,109,250,0.08)', border: 'rgba(124,109,250,0.25)',
    collections: [
      { name: 'employees', key: 'emp::{employee_id}', fields: ['employee_id','full_name','role','zone','gender','gender_limit','ppe_certified','badge_id','status'], color: '#7c6dfa' },
      { name: 'sensors',   key: 'sensor::{sensor_id}', fields: ['sensor_id','area','sensor_type','manufacturer','model','unit','ngv','alert_thresholds','status'], color: '#7c6dfa' },
    ]},
  { id: 'p2', label: 'Pillar 2', title: 'IoT Time-Series', icon: Zap, color: '#22d3ee', dim: 'rgba(34,211,238,0.06)', border: 'rgba(34,211,238,0.2)',
    collections: [
      { name: 'health_reports',      key: 'health::{emp_id}::{date}::{type}', fields: ['employee_id','report_date','blood_lead_umol','pct_of_limit','compliance_status','follow_up_required'], color: '#22d3ee' },
      { name: 'sensor_measurements', key: 'meas::{sensor_id}::{timestamp}',   fields: ['sensor_id','area','substance','measured_at','value','ngv','ngv_pct','alert_level','quality_flag'], color: '#22d3ee' },
    ]},
  { id: 'p3', label: 'Pillar 3', title: 'AI / RAG Pipeline', icon: Brain, color: '#10b981', dim: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)',
    collections: [
      { name: 'ingestion_logs',      key: 'ingest::{log_id}',     fields: ['source_file','source_type','status','chunks_created','embeddings_generated','processing_ms','ingested_at'], color: '#10b981' },
      { name: 'document_embeddings', key: 'emb::{log_id}::{idx}', fields: ['source_log_id','chunk_text','embedding_vector (384-dim)','doc_type','source_ref','token_count'], color: '#10b981' },
    ]},
];

function PillarCard({ pillar, activeCol, setActiveCol }) {
  const Icon = pillar.icon;
  return (
    <div style={{ background: pillar.dim, border: '1px solid ' + pillar.border, borderRadius: 14, padding: 18, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: pillar.color + '22', border: '1px solid ' + pillar.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={pillar.color} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: pillar.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{pillar.label}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{pillar.title}</div>
        </div>
      </div>
      {pillar.collections.map(col => {
        const active = activeCol === col.name;
        return (
          <button key={col.name} onClick={() => setActiveCol(active ? null : col.name)}
            style={{ width: '100%', textAlign: 'left', background: active ? col.color + '18' : 'var(--bg-elevated)', border: '1px solid ' + (active ? col.color + '55' : 'var(--border)'), borderRadius: 10, padding: '10px 12px', cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={12} color={col.color} />
                <span style={{ fontSize: 12, fontWeight: 700, color: col.color, fontFamily: 'monospace' }}>{col.name}</span>
              </div>
              <ChevronRight size={10} color="var(--text-muted)" style={{ transform: active ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            <div style={{ marginTop: 4, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{col.key}</div>
            {active && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {col.fields.map(f => <span key={f} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: col.color + '18', color: col.color, fontFamily: 'monospace' }}>{f}</span>)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

const TABS = ['Architecture', 'N1QL Setup', 'Example Docs', 'Vector Index', 'Sample Queries'];

export default function DatabaseSchemaPage() {
  const [tab, setTab] = useState('Architecture');
  const [activeCol, setActiveCol] = useState(null);
  const [activeDocCol, setActiveDocCol] = useState('employees');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,109,250,0.15)', border: '1px solid rgba(124,109,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={18} color="#7c6dfa" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Database Schema</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Couchbase Capella · Bucket: chemsafe · Scope: safety_ops</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['6','Collections'],['384','Vector Dims'],['3','Pillars']].map(([v,l]) => (
            <div key={l} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-violet)' }}>{v}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === t ? 'var(--accent-violet)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}>{t}</button>
        ))}
      </div>

      {tab === 'Architecture' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '16px 20px', background: 'rgba(124,109,250,0.06)', border: '1px solid rgba(124,109,250,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Database size={16} color="#7c6dfa" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                BUCKET: <span style={{ color: '#7c6dfa' }}>chemsafe</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 16 }}>SCOPE:</span>
                <span style={{ color: '#22d3ee', marginLeft: 6 }}>safety_ops</span>
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 6 }}>Couchbase Capella v7.6+</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {PILLARS.map(p => <PillarCard key={p.id} pillar={p} activeCol={activeCol} setActiveCol={setActiveCol} />)}
          </div>
          <div className="card" style={{ padding: '18px 20px' }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Document Relationships (FK Arrows)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { from: 'employees.employee_id', to: 'health_reports.employee_id', color: '#7c6dfa' },
                { from: 'sensors.sensor_id',     to: 'sensor_measurements.sensor_id', color: '#22d3ee' },
                { from: 'ingestion_logs.log_id', to: 'document_embeddings.source_log_id', color: '#10b981' },
              ].map(rel => (
                <div key={rel.from} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 14px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, color: rel.color, fontFamily: 'monospace' }}>{rel.from}</span>
                  <ChevronRight size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{rel.to}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,211,238,0.06)', borderRadius: 8, padding: '8px 14px', border: '1px solid rgba(34,211,238,0.2)' }}>
                <Cpu size={12} color="#22d3ee" />
                <span style={{ fontSize: 11, color: '#22d3ee', fontFamily: 'monospace' }}>document_embeddings.embedding_vector</span>
                <ChevronRight size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vector Search (384-dim · dot_product)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'N1QL Setup' && (
        <div className="card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>N1QL — Create Scope, Collections & Indexes</div>
          <CodeBlock code={n1qlSetup} title="chemsafe_setup.n1ql" />
        </div>
      )}

      {tab === 'Example Docs' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div className="section-title">Example JSON Documents</div>
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
              {Object.keys(exampleDocuments).map(col => (
                <button key={col} onClick={() => setActiveDocCol(col)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', background: activeDocCol === col ? 'var(--accent-violet)' : 'var(--bg-elevated)', borderColor: activeDocCol === col ? 'var(--accent-violet)' : 'var(--border)', color: activeDocCol === col ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s' }}>{col}</button>
              ))}
            </div>
          </div>
          {(exampleDocuments[activeDocCol] || []).map((doc, i) => <CodeBlock key={i} code={doc} title={doc._key} />)}
        </div>
      )}

      {tab === 'Vector Index' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
            {[['384','Dimensions'],['dot_product','Similarity'],['all-MiniLM-L6-v2','Model'],['scorch','Store']].map(([v,l]) => (
              <div key={l} style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#22d3ee', fontFamily: 'monospace' }}>{v}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
          <div className="section-title" style={{ marginBottom: 12 }}>Couchbase FTS / Vector Search Index Payload</div>
          <CodeBlock code={vectorIndexDef} title="idx_doc_embeddings_v1.json" />
        </div>
      )}

      {tab === 'Sample Queries' && (
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Sample N1QL Queries</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>employees JOIN health_reports — latest blood-lead per active employee</div>
          <CodeBlock code={n1qlJoinQuery} title="join_employee_health.n1ql" />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, marginTop: 8 }}>sensors JOIN sensor_measurements — 24h rolling average</div>
          <CodeBlock code={n1qlTimeSeriesQuery} title="timeseries_rolling_avg.n1ql" />
        </div>
      )}
    </div>
  );
}
