import { useState, useMemo } from 'react';
import { Cpu, Search, Activity, AlertTriangle, CheckCircle, Wifi } from 'lucide-react';
import { mockSensors, generateTimeSeriesData } from '../../data/couchbaseSchema';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const TYPE_LABELS = { dust_inhalable: 'Inhalable Dust', dust_respirable: 'Respirable Dust', no2: 'Nitrogen Dioxide', hydrocarbons: 'Hydrocarbons', metals_lead: 'Lead (Pb)' };
const TYPE_COLORS = { dust_inhalable: '#f59e0b', dust_respirable: '#f97316', no2: '#22d3ee', hydrocarbons: '#a78bfa', metals_lead: '#ef4444' };

function MiniSparkline({ sensorId, baseNgvPct, color }) {
  const data = useMemo(() => generateTimeSeriesData(sensorId, baseNgvPct), [sensorId, baseNgvPct]);
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={'sg_' + sensorId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="hour" hide />
        <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 6, fontSize: 10 }} formatter={v => [v.toFixed(1) + '% NGV']} labelStyle={{ color: '#6b7a99' }} />
        <Area type="monotone" dataKey="ngv_pct" stroke={color} strokeWidth={1.5} fill={'url(#sg_' + sensorId + ')'} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SensorCard({ sensor }) {
  const color = TYPE_COLORS[sensor.type] || '#7c6dfa';
  const sc = sensor.status === 'critical' ? '#ef4444' : sensor.status === 'warning' ? '#f59e0b' : '#10b981';
  return (
    <div className="card" style={{ padding: 16, borderColor: sensor.status === 'critical' ? 'rgba(239,68,68,0.3)' : 'var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '18', border: '1px solid ' + color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Cpu size={14} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace' }}>{sensor.id}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sensor.model}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, background: sc + '18', color: sc, fontWeight: 700 }}>{sensor.status.toUpperCase()}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sensor.area}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>{TYPE_LABELS[sensor.type] || sensor.type}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: sc }}>{sensor.pct.toFixed(1)}%</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>of NGV</span>
        <span style={{ fontSize: 11, color, marginLeft: 'auto', fontFamily: 'monospace' }}>{sensor.value}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: Math.min(sensor.pct, 100) + '%', background: sc, borderRadius: 2 }} />
      </div>
      <MiniSparkline sensorId={sensor.id} baseNgvPct={sensor.pct} color={color} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
        <span>Cal: {sensor.lastCalibrated}</span>
        <span>NGV: {sensor.ngv}</span>
      </div>
    </div>
  );
}

export default function SensorsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let d = [...mockSensors];
    if (search) d = d.filter(s => s.id.toLowerCase().includes(search.toLowerCase()) || s.area.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter !== 'all')   d = d.filter(s => s.type === typeFilter);
    if (statusFilter !== 'all') d = d.filter(s => s.status === statusFilter);
    return d;
  }, [search, typeFilter, statusFilter]);

  const stats = { total: mockSensors.length, critical: mockSensors.filter(s => s.status === 'critical').length, warning: mockSensors.filter(s => s.status === 'warning').length, safe: mockSensors.filter(s => s.status === 'safe').length };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Cpu size={18} color="#22d3ee" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>IoT Sensors</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>chemsafe · safety_ops · sensors collection · Live telemetry</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        {[{ icon: Activity, label: 'Total', value: stats.total, color: '#22d3ee' }, { icon: AlertTriangle, label: 'Critical', value: stats.critical, color: '#ef4444' }, { icon: Wifi, label: 'Warning', value: stats.warning, color: '#f59e0b' }, { icon: CheckCircle, label: 'Safe', value: stats.safe, color: '#10b981' }].map(({ icon: Icon, label, value, color }) => (
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

      <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sensor ID or area..."
            style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'dust_inhalable', 'no2', 'hydrocarbons', 'metals_lead'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 11, background: typeFilter === t ? 'rgba(34,211,238,0.2)' : 'var(--bg-elevated)', borderColor: typeFilter === t ? '#22d3ee' : 'var(--border)', color: typeFilter === t ? '#22d3ee' : 'var(--text-muted)' }}>
              {t === 'all' ? 'All Types' : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all','critical','warning','safe'].map(s => {
            const c = s === 'critical' ? '#ef4444' : s === 'warning' ? '#f59e0b' : s === 'safe' ? '#10b981' : 'var(--text-muted)';
            return <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: statusFilter === s ? c + '22' : 'var(--bg-elevated)', borderColor: statusFilter === s ? c : 'var(--border)', color: statusFilter === s ? c : 'var(--text-muted)' }}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</button>;
          })}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} sensors</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {filtered.map(s => <SensorCard key={s.id} sensor={s} />)}
      </div>
    </div>
  );
}
