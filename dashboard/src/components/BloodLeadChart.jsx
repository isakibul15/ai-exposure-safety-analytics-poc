import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { bloodLeadData } from '../data/safetyData';
import { AlertTriangle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1424', border:'1px solid rgba(99,120,175,0.25)', borderRadius:12, padding:'12px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', minWidth:200 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{label}</div>
      {payload.map((p,i) => {
        const exceeded = p.name==='Women (avg)' && p.value >= 0.5;
        return (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:16, marginBottom:4 }}>
            <span style={{ fontSize:11, color:p.color, display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:p.color, display:'inline-block' }} />{p.name}
            </span>
            <span style={{ fontSize:11, fontWeight:700, color:exceeded?'#ef4444':p.color }}>{Number(p.value).toFixed(3)} µmol/L{exceeded?' ⚠️':''}</span>
          </div>
        );
      })}
      <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)', fontSize:10, color:'var(--text-muted)' }}>Ref: 0.15–0.20 µmol/L (non-occupational)</div>
    </div>
  );
};
const CustomLegend = ({ payload }) => (
  <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:6 }}>
    {payload?.map((p,i) => (
      <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-secondary)' }}>
        <span style={{ width:20, height:2, background:p.color, display:'inline-block', borderRadius:2 }} />{p.value}
      </div>
    ))}
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(239,68,68,0.7)' }}>
      <span style={{ width:20, height:1, background:'#ef4444', display:'inline-block' }} />Women limit (0.5)
    </div>
  </div>
);

export default function BloodLeadChart() {
  const latest = bloodLeadData[bloodLeadData.length-1];
  return (
    <div className="card glow-red" style={{ padding:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div className="section-title" style={{ marginBottom:4 }}>Biological Monitoring</div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Blood Lead Levels (Bly i Blod)</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Quarterly averages · µmol/L · All NF workers</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[['Men avg', latest.men.toFixed(3), '#7c6dfa'],['Women avg', latest.women.toFixed(3),'#f97316']].map(([l,v,c]) => (
            <div key={l} style={{ background:c==='#7c6dfa'?'var(--accent-violet-dim)':'rgba(249,115,22,0.1)', border:`1px solid ${c}33`, borderRadius:10, padding:'6px 12px', textAlign:'center' }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:15, fontWeight:700, color:c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'8px 12px', fontSize:11, color:'#f59e0b' }}>
        <AlertTriangle size={13} />
        <span>Female workers exceeded 0.5 µmol/L limit in Q1–Q2 2023 and Q1 2024. Corrective measures implemented.</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={bloodLeadData} margin={{ top:0, right:10, left:-10, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,120,175,0.08)" vertical={false} />
          <XAxis dataKey="period" tick={{ fill:'#6b7fa8', fontSize:10 }} axisLine={false} tickLine={false} interval={3} />
          <YAxis tick={{ fill:'#6b7fa8', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>v.toFixed(1)} domain={[0,1.0]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <ReferenceLine y={0.5} stroke="#ef4444" strokeDasharray="5 3" strokeOpacity={0.6} strokeWidth={1.5} />
          <ReferenceLine y={1.5} stroke="#ef444440" strokeDasharray="5 3" strokeOpacity={0.4} label={{ value:'Men limit', position:'insideTopRight', fill:'#ef4444', fontSize:9, opacity:0.6 }} />
          <ReferenceLine y={0.2} stroke="#10b98140" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value:'Ref lvl', position:'insideBottomRight', fill:'#10b981', fontSize:9, opacity:0.5 }} />
          <Line type="monotone" dataKey="men" name="Men (avg)" stroke="#7c6dfa" strokeWidth={2.5} dot={false} activeDot={{ r:5, fill:'#7c6dfa' }} />
          <Line type="monotone" dataKey="women" name="Women (avg)" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r:5, fill:'#f97316' }} strokeDasharray="6 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
