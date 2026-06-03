import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { exposureTrendData } from '../data/safetyData';
import { TrendingDown } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1424', border:'1px solid rgba(99,120,175,0.25)', borderRadius:12, padding:'12px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', minWidth:200 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:16, marginBottom:4 }}>
          <span style={{ fontSize:11, color:p.color, display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:p.color, display:'inline-block' }} />{p.name}
          </span>
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-primary)' }}>{Number(p.value).toFixed(1)}% NGV</span>
        </div>
      ))}
    </div>
  );
};
const CustomLegend = ({ payload }) => (
  <div style={{ display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap', marginTop:4 }}>
    {payload?.map((p,i) => (
      <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-secondary)' }}>
        <span style={{ width:20, height:2, background:p.color, display:'inline-block', borderRadius:2 }} />{p.value}
      </div>
    ))}
  </div>
);
export default function ExposureTrendChart({ dateFrom = 2020, dateTo = 2026 }) {
  // Filter campaigns to the selected year range
  const filtered = exposureTrendData.filter(d => {
    const year = parseInt(d.date.split(' ').pop());
    return year >= dateFrom && year <= dateTo;
  });

  return (
    <div className="card glow-violet" style={{ padding:'24px', height:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <div className="section-title" style={{ marginBottom:4 }}>Exposure Trends</div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>% of Occupational Limit (NGV) Over Time</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{filtered.length} campaigns · {dateFrom}–{dateTo} · All work areas combined</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--safe-dim)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'6px 12px', fontSize:12, fontWeight:600, color:'var(--safe)' }}>
          <TrendingDown size={14} />Improving
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={filtered} margin={{ top:10, right:10, left:-10, bottom:0 }}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c6dfa" stopOpacity={0.3}/><stop offset="95%" stopColor="#7c6dfa" stopOpacity={0}/></linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
            <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
            <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2}/><stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,120,175,0.08)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill:'#6b7fa8', fontSize:11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill:'#6b7fa8', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value:'NGV Limit', position:'insideTopRight', fill:'#ef4444', fontSize:10 }} />
          <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.35} label={{ value:'20% Advisory', position:'insideTopRight', fill:'#f59e0b', fontSize:10 }} />
          <Area type="monotone" dataKey="dust_inhalable" name="Inhalable Dust" stroke="#7c6dfa" strokeWidth={2.5} fill="url(#g1)" dot={{ r:3, fill:'#7c6dfa', strokeWidth:0 }} activeDot={{ r:5 }} />
          <Area type="monotone" dataKey="metals_lead" name="Lead (Pb) Dust" stroke="#f97316" strokeWidth={2} fill="url(#g2)" dot={{ r:3, fill:'#f97316', strokeWidth:0 }} activeDot={{ r:5 }} />
          <Area type="monotone" dataKey="metals_copper" name="Copper (Cu) Dust" stroke="#22d3ee" strokeWidth={2} fill="url(#g3)" dot={{ r:3, fill:'#22d3ee', strokeWidth:0 }} activeDot={{ r:5 }} />
          <Area type="monotone" dataKey="dust_respirable" name="Respirable Dust" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#g4)" dot={{ r:2, fill:'#a78bfa', strokeWidth:0 }} activeDot={{ r:4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
