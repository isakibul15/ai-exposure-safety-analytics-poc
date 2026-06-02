import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Wind } from 'lucide-react';

const radarData = [
  { subject:'XRF PH1', dust:8, no2:3.2, hc:2.1 },
  { subject:'Flot 2.2', dust:21, no2:3.8, hc:2.8 },
  { subject:'Flot 3.2', dust:18, no2:3.6, hc:3.6 },
  { subject:'Finesline', dust:15, no2:3.1, hc:2.4 },
  { subject:'Water Tr.', dust:6, no2:3.2, hc:3.2 },
  { subject:'Dry Sep', dust:12, no2:4.2, hc:2.8 },
  { subject:'Sensor', dust:39, no2:3.6, hc:3.1 },
  { subject:'Ficka 55', dust:22, no2:3.0, hc:2.2 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1424', border:'1px solid rgba(99,120,175,0.25)', borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,0.5)', fontSize:11 }}>
      <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color, marginBottom:2 }}>{p.name}: <strong>{Number(p.value).toFixed(1)}%</strong></div>)}
    </div>
  );
};

export default function GasMonitorCard() {
  return (
    <div className="card glow-cyan" style={{ padding:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div className="section-title" style={{ marginBottom:4 }}>Gas Exposure Radar</div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Multi-Zone Comparison</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Dust · NO₂ · HC · % of NGV</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--safe-dim)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'6px 12px', fontSize:12, fontWeight:600, color:'var(--safe)', alignSelf:'flex-start' }}>
          <Wind size={14} />All safe
        </div>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        {[['NO₂ Latest','3.61%','of NGV (0.96 mg/m³)','#22d3ee'],['Hydrocarbons','3.6%','of NGV (0.05 mg/m³)','#7c6dfa']].map(([l,v,s,c]) => (
          <div key={l} style={{ flex:1, background:'var(--bg-elevated)', borderRadius:10, padding:'10px 14px', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>{l}</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:c, lineHeight:1 }}>{v}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>{s}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <RadarChart data={radarData} margin={{ top:10, right:30, bottom:10, left:30 }}>
          <PolarGrid stroke="rgba(99,120,175,0.15)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill:'#6b7fa8', fontSize:9 }} />
          <Radar name="Dust % NGV" dataKey="dust" stroke="#7c6dfa" fill="#7c6dfa" fillOpacity={0.18} strokeWidth={2} />
          <Radar name="NO₂ % NGV" dataKey="no2" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.12} strokeWidth={1.5} />
          <Radar name="HC % NGV" dataKey="hc" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:4 }}>
        {[['Dust','#7c6dfa'],['NO₂','#22d3ee'],['Hydrocarbons','#10b981']].map(([l,c]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--text-muted)' }}>
            <span style={{ width:16, height:2, background:c, display:'inline-block', borderRadius:2 }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}
