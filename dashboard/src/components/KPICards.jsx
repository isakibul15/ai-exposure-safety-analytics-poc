import { Activity, AlertTriangle, ShieldCheck, Microscope, TrendingDown, TrendingUp, Wind, BarChart2 } from 'lucide-react';
const cards = [
  { label:'Total Measurements', value:'847', sub:'Across 8 campaigns (2020–2026)', icon:BarChart2, trend:'+12% vs prev', trendUp:true, accent:'#7c6dfa', accentDim:'rgba(124,109,250,0.12)', glow:'0 0 30px rgba(124,109,250,0.14)' },
  { label:'Compliance Rate', value:'97.3%', sub:'23 exceedances recorded total', icon:ShieldCheck, trend:'+4.2% since 2020', trendUp:true, accent:'#10b981', accentDim:'rgba(16,185,129,0.12)', glow:'0 0 30px rgba(16,185,129,0.1)' },
  { label:'Active Risk Zones', value:'3', sub:'Sensor + Flotation 2.2 / 3.2', icon:AlertTriangle, trend:'Risk score ≥6', trendUp:false, accent:'#f59e0b', accentDim:'rgba(245,158,11,0.12)', glow:'0 0 30px rgba(245,158,11,0.1)' },
  { label:'Avg Blood Lead', value:'0.47 µmol/L', sub:'Men avg · Limit: 1.5 µmol/L', icon:Microscope, trend:'−9% vs 2022', trendUp:true, accent:'#22d3ee', accentDim:'rgba(34,211,238,0.12)', glow:'0 0 30px rgba(34,211,238,0.1)' },
];
export default function KPICards() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
      {cards.map((c,i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="card animate-in" style={{ padding:'20px 22px', boxShadow:c.glow, animationDelay:`${i*60}ms` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:c.accentDim, border:`1px solid ${c.accent}28`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={18} color={c.accent} strokeWidth={2} />
              </div>
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:c.trendUp?'var(--safe)':'var(--warning)', background:c.trendUp?'var(--safe-dim)':'var(--warning-dim)', border:`1px solid ${c.trendUp?'rgba(16,185,129,0.2)':'rgba(245,158,11,0.2)'}`, borderRadius:20, padding:'3px 9px' }}>
                {c.trendUp ? <TrendingDown size={11} /> : <TrendingUp size={11} />}{c.trend}
              </span>
            </div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:26, fontWeight:700, color:c.accent, letterSpacing:'-0.5px', lineHeight:1, marginBottom:6 }}>{c.value}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{c.sub}</div>
            <div style={{ marginTop:16, height:2, borderRadius:2, background:`linear-gradient(90deg, ${c.accent} 0%, transparent 100%)`, opacity:0.5 }} />
          </div>
        );
      })}
    </div>
  );
}
