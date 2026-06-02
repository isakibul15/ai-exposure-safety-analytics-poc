import { metalsMeasurements } from '../data/safetyData';
import { FlaskConical } from 'lucide-react';

const StatusBar = ({ pct }) => {
  const color = pct>100?'#ef4444':pct>50?'#f97316':pct>20?'#f59e0b':'#10b981';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:5, borderRadius:3, background:'var(--bg-elevated)', overflow:'hidden', minWidth:60 }}>
        <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:color, borderRadius:3 }} />
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, minWidth:36, textAlign:'right' }}>{pct}%</span>
    </div>
  );
};

export default function MetalsTable() {
  return (
    <div className="card" style={{ padding:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <div className="section-title" style={{ marginBottom:4 }}>Metal Contaminants</div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>% of NGV Limit by Substance</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Latest measurement · All fractions combined</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-secondary)' }}>
          <FlaskConical size={14} /><span>10 substances</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 90px 1fr 62px', gap:8, padding:'0 0 10px', borderBottom:'1px solid var(--border)', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
        <div/><div>Substance</div><div>NGV Limit</div><div>% of NGV</div><div>Status</div>
      </div>
      {metalsMeasurements.map((m,i) => {
        const status = m.latestPct>100?'critical':m.latestPct>50?'danger':m.latestPct>20?'warning':'safe';
        const labels = { safe:'Safe', warning:'Advisory', danger:'High', critical:'Critical' };
        const colors = { safe:'var(--safe)', warning:'var(--warning)', danger:'var(--danger)', critical:'var(--critical)' };
        const dims = { safe:'var(--safe-dim)', warning:'var(--warning-dim)', danger:'var(--danger-dim)', critical:'var(--critical-dim)' };
        return (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'28px 1fr 90px 1fr 62px', gap:8, padding:'11px 0', borderBottom:'1px solid rgba(99,120,175,0.06)', alignItems:'center' }}>
            <div style={{ width:24, height:24, borderRadius:6, background:dims[status], display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:colors[status] }}>{m.symbol}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{m.metal}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>{m.campaigns} campaigns</div>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace' }}>{m.ngv}</div>
            <StatusBar pct={m.latestPct} />
            <span className={`badge badge-${status}`}>{labels[status]}</span>
          </div>
        );
      })}
    </div>
  );
}
