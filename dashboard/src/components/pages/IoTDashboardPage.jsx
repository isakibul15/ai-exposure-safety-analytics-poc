import { useState, useEffect } from 'react';
import { Zap, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { mockSensors, generateTimeSeriesData } from '../../data/couchbaseSchema';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

function buildMultiSeries(hours) {
  const now = new Date('2026-03-11T12:00:00Z');
  return Array.from({ length: hours }, (_, i) => {
    const ts = new Date(now - (hours - i) * 3600000);
    const h = ts.getHours().toString().padStart(2, '0') + ':00';
    const n = () => (Math.random() - 0.48) * 0.25;
    return { hour: h, dust: parseFloat((246 + n() * 246).toFixed(1)), no2: parseFloat((3.6 + n() * 3.6).toFixed(1)), hc: parseFloat((3.4 + n() * 3.4).toFixed(1)) };
  });
}

const areaBarData = [
  { area: 'Sensor/Gula', dust: 246, no2: 3.6, hc: 3.1 }, { area: 'Flotation 2.2', dust: 21, no2: 3.8, hc: 2.8 },
  { area: 'Flotation 3.2', dust: 18, no2: 3.6, hc: 3.4 }, { area: 'Finesline', dust: 15, no2: 3.1, hc: 2.4 },
  { area: 'XRF 1', dust: 2.2, no2: 3.2, hc: 2.1 }, { area: 'Water Treat.', dust: 4, no2: 4.0, hc: 3.2 },
  { area: 'Dry Sep', dust: 12, no2: 4.2, hc: 2.8 }, { area: 'Ficka 55', dust: 22, no2: 3.0, hc: 2.2 },
];

const ALERTS = [
  { sensor: 'SENS-DUST-001', area: 'Sensor / Gula',   substance: 'Inhalable Dust', value: '246.0', level: 'CRITICAL', time: '07:00' },
  { sensor: 'SENS-DUST-002', area: 'Flotation 2.2',   substance: 'Inhalable Dust', value: '21.0',  level: 'WARNING',  time: '07:05' },
  { sensor: 'SENS-NO2-002',  area: 'Dry Sep / IWT',   substance: 'NO2',            value: '4.2',   level: 'SAFE',     time: '07:10' },
  { sensor: 'SENS-HC-001',   area: 'Flotation 3.2',   substance: 'Hydrocarbons',   value: '3.4',   level: 'SAFE',     time: '07:15' },
];

const tt = { contentStyle: { background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 11 }, labelStyle: { color: '#6b7a99' } };

export default function IoTDashboardPage() {
  const [series] = useState(() => buildMultiSeries(24));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="#22d3ee" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>IoT Time-Series</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>sensor_measurements · 24h window · 2026-03-11</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Live · tick #{tick}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        {mockSensors.filter(s => ['SENS-DUST-001','SENS-NO2-003','SENS-HC-007','SENS-MET-001'].includes(s.id)).map(s => {
          const c = { dust_inhalable:'#f59e0b', no2:'#22d3ee', hydrocarbons:'#a78bfa', metals_lead:'#ef4444' }[s.type] || '#7c6dfa';
          const sc = s.status === 'critical' ? '#ef4444' : '#10b981';
          return (
            <div key={s.id} className="card" style={{ flex: 1, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Activity size={14} color={c} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.id}</span>
                <span className="live-dot" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: sc }}>{s.pct.toFixed(1)}%</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.area}</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 8 }}>
                <div style={{ height: '100%', width: Math.min(s.pct, 100) + '%', background: c, borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>24-Hour Rolling % NGV — Multi-Substance</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={series}>
            <defs>
              {[['dust','#f59e0b'],['no2','#22d3ee'],['hc','#a78bfa']].map(([k,c]) => (
                <linearGradient key={k} id={'iot_' + k} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6b7a99' }} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7a99' }} tickFormatter={v => v + '%'} />
            <Tooltip {...tt} formatter={v => [v.toFixed(1) + '% NGV']} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
            <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
            <Area type="monotone" dataKey="dust" name="Dust (I)" stroke="#f59e0b" strokeWidth={2} fill="url(#iot_dust)" dot={false} />
            <Area type="monotone" dataKey="no2"  name="NO2"      stroke="#22d3ee" strokeWidth={2} fill="url(#iot_no2)"  dot={false} />
            <Area type="monotone" dataKey="hc"   name="HC"        stroke="#a78bfa" strokeWidth={2} fill="url(#iot_hc)"   dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div className="card" style={{ flex: 2, padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Latest % NGV by Work Area</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={areaBarData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="area" tick={{ fontSize: 10, fill: '#6b7a99' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7a99' }} tickFormatter={v => v + '%'} />
              <Tooltip {...tt} formatter={v => [v.toFixed(1) + '% NGV']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" />
              <Bar dataKey="dust" name="Dust" fill="#f59e0b" radius={[3,3,0,0]} maxBarSize={24} activeBar={false} />
              <Bar dataKey="no2"  name="NO2"  fill="#22d3ee" radius={[3,3,0,0]} maxBarSize={24} activeBar={false} />
              <Bar dataKey="hc"   name="HC"   fill="#a78bfa" radius={[3,3,0,0]} maxBarSize={24} activeBar={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ flex: 1, padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Alert Feed</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ALERTS.map((a, i) => {
              const c = a.level === 'CRITICAL' ? '#ef4444' : a.level === 'WARNING' ? '#f59e0b' : '#10b981';
              return (
                <div key={i} style={{ background: c + '0d', border: '1px solid ' + c + '33', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={12} color={c} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: c }}>{a.sensor}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{a.area} · {a.value}% NGV · {a.time}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: c + '22', color: c, fontWeight: 700 }}>{a.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>Morning shift 2026-03-11</div>
        </div>
      </div>
    </div>
  );
}
