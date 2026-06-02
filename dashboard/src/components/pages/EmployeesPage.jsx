import { useState, useMemo } from 'react';
import { Users, Search, Activity, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { mockEmployees } from '../../data/couchbaseSchema';

const ZONE_COLORS = {
  'Sensor / Gula': '#ef4444', 'Flotation 2.2': '#f97316', 'Flotation 3.2': '#f97316',
  'XRF Plockhytt 1': '#10b981', 'XRF Plockhytt 2': '#10b981', 'Finesline / SGM': '#f59e0b',
  'Water Treatment': '#10b981', 'Dry Sep / IWT': '#f59e0b', 'Ficka 55 / Rygg': '#f97316',
  'Catwalk / Balkong': '#10b981', 'Hjullastare': '#10b981', 'Styrhytt': '#10b981',
};

function MiniBar({ value, limit, color }) {
  const pct = Math.min((value / limit) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 700, minWidth: 34, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

// Compact health metric chip for the expanded row
function HealthMetric({ label, value, unit, limit, limitLabel, color }) {
  const pct = Math.min((value / limit) * 100, 100);
  const statusColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : pct > 50 ? '#f97316' : '#10b981';
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid ' + statusColor + '33', borderRadius: 10, padding: '10px 14px', minWidth: 150, flex: 1 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: statusColor, marginBottom: 2 }}>{value} <span style={{ fontSize: 10, fontWeight: 400 }}>{unit}</span></div>
      <MiniBar value={value} limit={limit} color={statusColor} />
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>Limit: {limit} {unit} ({limitLabel})</div>
    </div>
  );
}

function BloodLeadBar({ pct }) {
  const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : pct > 50 ? '#f97316' : '#10b981';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>
        <span style={{ color }}>{pct.toFixed(1)}%</span><span>of limit</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: Math.min(pct, 100) + '%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function EmpRow({ emp, expanded, onToggle }) {
  const zc = ZONE_COLORS[emp.zone] || '#7c6dfa';
  const risk = emp.pct > 90 ? 'critical' : emp.pct > 70 ? 'warning' : emp.pct > 50 ? 'elevated' : 'safe';
  const rc = { critical: '#ef4444', warning: '#f59e0b', elevated: '#f97316', safe: '#10b981' }[risk];

  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

        {/* ID + avatar only — no name */}
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(124,109,250,0.15)', border: '1px solid rgba(124,109,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#7c6dfa', flexShrink: 0, fontFamily: 'monospace' }}>
              {emp.id.replace('EMP-', '')}
            </div>
            <span style={{ fontSize: 11, color: '#7c6dfa', fontFamily: 'monospace' }}>{emp.id}</span>
          </div>
        </td>

        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{emp.role}</td>

        <td style={{ padding: '12px 16px' }}>
          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: zc + '18', color: zc, fontWeight: 600 }}>{emp.zone}</span>
        </td>

        {/* Blood lead % bar */}
        <td style={{ padding: '12px 16px', minWidth: 150 }}>
          <BloodLeadBar pct={emp.pct} />
        </td>

        {/* Cadmium % of limit */}
        <td style={{ padding: '12px 16px', minWidth: 120 }}>
          <MiniBar value={emp.bloodCadmium} limit={emp.cdLimit} color={emp.bloodCadmium / emp.cdLimit > 0.7 ? '#f59e0b' : '#10b981'} />
        </td>

        {/* Arsenic % of limit */}
        <td style={{ padding: '12px 16px', minWidth: 120 }}>
          <MiniBar value={emp.urinaryArsenic} limit={emp.asLimit} color={emp.urinaryArsenic / emp.asLimit > 0.7 ? '#f59e0b' : '#10b981'} />
        </td>

        <td style={{ padding: '12px 16px' }}>
          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: rc + '18', color: rc, fontWeight: 700 }}>{risk.toUpperCase()}</span>
        </td>

        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>

      {/* Expanded health detail */}
      {expanded && (
        <tr style={{ background: 'rgba(124,109,250,0.03)' }}>
          <td colSpan={8} style={{ padding: '14px 16px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Health Report — {emp.id} · Last medical: {emp.lastMedical} · Badge: {emp.badge}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              {/* The 3 health measurements */}
              <HealthMetric
                label="Blood Lead (BPb)"
                value={emp.bloodLead}
                unit="µmol/L"
                limit={emp.limit}
                limitLabel={emp.gender === 'M' ? 'men' : 'women'}
                color="#ef4444"
              />
              <HealthMetric
                label="Blood Cadmium (BCd)"
                value={emp.bloodCadmium}
                unit="nmol/L"
                limit={emp.cdLimit}
                limitLabel={emp.gender === 'M' ? 'men, AFS 2011:19' : 'women, AFS 2011:19'}
                color="#f59e0b"
              />
              <HealthMetric
                label="Urinary Arsenic (UAs)"
                value={emp.urinaryArsenic}
                unit="µmol/mol cr"
                limit={emp.asLimit}
                limitLabel="inorganic As, AFS 2011:19"
                color="#a78bfa"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                ['Couchbase Key', 'emp::' + emp.id, '#10b981'],
                ['Gender', emp.gender === 'M' ? 'Male' : 'Female', '#22d3ee'],
                ['Zone', emp.zone, ZONE_COLORS[emp.zone] || '#7c6dfa'],
                ['Pb Limit', emp.limit + ' µmol/L', '#6b7a99'],
                ['Cd Limit', emp.cdLimit + ' nmol/L', '#6b7a99'],
                ['As Limit', emp.asLimit + ' µmol/mol cr', '#6b7a99'],
              ].map(([label, value, color]) => (
                <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '6px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: label === 'Couchbase Key' ? 'monospace' : 'inherit' }}>{value}</div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    let d = [...mockEmployees];
    if (search) d = d.filter(e => e.role.toLowerCase().includes(search.toLowerCase()) || e.zone.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'pb_alert') d = d.filter(e => e.pct > 50);
    if (filter === 'cd_alert') d = d.filter(e => (e.bloodCadmium / e.cdLimit) > 0.5);
    if (filter === 'as_alert') d = d.filter(e => (e.urinaryArsenic / e.asLimit) > 0.5);
    return d.sort((a, b) => b.pct - a.pct);
  }, [search, filter]);

  const stats = {
    total: mockEmployees.length,
    pbAlert: mockEmployees.filter(e => e.pct > 50).length,
    cdAlert: mockEmployees.filter(e => (e.bloodCadmium / e.cdLimit) > 0.5).length,
    asAlert: mockEmployees.filter(e => (e.urinaryArsenic / e.asLimit) > 0.5).length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,109,250,0.15)', border: '1px solid rgba(124,109,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={18} color="#7c6dfa" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Employees</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>chemsafe · safety_ops · employees collection · Biomonitoring (BPb · BCd · UAs)</div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 14 }}>
        {[
          { icon: Users,         label: 'Total',        value: stats.total,   color: '#7c6dfa', sub: 'employees' },
          { icon: AlertTriangle, label: 'BPb > 50%',    value: stats.pbAlert, color: '#ef4444', sub: 'blood lead alert' },
          { icon: AlertTriangle, label: 'BCd > 50%',    value: stats.cdAlert, color: '#f59e0b', sub: 'cadmium alert' },
          { icon: Activity,      label: 'UAs > 50%',    value: stats.asAlert, color: '#a78bfa', sub: 'arsenic alert' },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="card" style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', border: '1px solid ' + color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label} · {sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search role, zone, ID..."
              style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all','All'],['pb_alert','BPb >50%'],['cd_alert','BCd >50%'],['as_alert','UAs >50%']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{ padding: '6px 13px', borderRadius: 7, border: '1px solid', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: filter === val ? 'var(--accent-violet)' : 'var(--bg-elevated)', borderColor: filter === val ? 'var(--accent-violet)' : 'var(--border)', color: filter === val ? '#fff' : 'var(--text-muted)' }}>{label}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} / {mockEmployees.length} records</div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                {[
                  { label: 'ID',           sub: null },
                  { label: 'Role',         sub: null },
                  { label: 'Zone',         sub: null },
                  { label: 'Blood Lead',   sub: '% of limit (BPb)' },
                  { label: 'Cadmium',      sub: '% of limit (BCd)' },
                  { label: 'Arsenic',      sub: '% of limit (UAs)' },
                  { label: 'Overall Risk', sub: null },
                  { label: '',             sub: null },
                ].map(({ label, sub }) => (
                  <th key={label} style={{ padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    {sub && <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400, marginTop: 1 }}>{sub}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <EmpRow key={emp.id} emp={emp} expanded={expanded === emp.id} onToggle={() => setExpanded(expanded === emp.id ? null : emp.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
