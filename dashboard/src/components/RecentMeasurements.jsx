import { recentMeasurements } from '../data/safetyData';
import { ArrowUpRight } from 'lucide-react';

const statusConfig = { safe:{label:'Safe',cls:'badge-safe'}, warning:{label:'Warning',cls:'badge-warning'}, danger:{label:'High',cls:'badge-danger'}, critical:{label:'Critical',cls:'badge-critical'} };

const PctBar = ({ pct }) => {
  const capped = Math.min(pct, 300);
  const color = pct>100?'#ef4444':pct>50?'#f97316':pct>20?'#f59e0b':'#10b981';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width:50, height:4, borderRadius:2, background:'var(--bg-elevated)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${Math.min((capped/300)*100,100)}%`, background:color, borderRadius:2 }} />
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, minWidth:44, textAlign:'right' }}>{pct>999?'>999':Number(pct).toFixed(1)}%</span>
    </div>
  );
};

export default function RecentMeasurements() {
  return (
    <div className="card" style={{ padding:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <div className="section-title" style={{ marginBottom:4 }}>Measurement Log</div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Recent Samples</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>All campaigns · Sorted by date descending</div>
        </div>
        <button style={{ display:'flex', alignItems:'center', gap:5, background:'transparent', border:'1px solid var(--border)', borderRadius:8, padding:'6px 12px', fontSize:11, color:'var(--accent-violet)', cursor:'pointer' }}>
          View All <ArrowUpRight size={12} />
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'92px 1fr 150px 100px 110px 70px', gap:8, padding:'0 0 8px', borderBottom:'1px solid var(--border)', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
        <div>Date</div><div>Work Area</div><div>Substance</div><div>Value</div><div>% of NGV</div><div>Status</div>
      </div>
      <div style={{ overflowY:'auto', maxHeight:340 }}>
        {recentMeasurements.map((m,i) => {
          const sc = statusConfig[m.status] ?? statusConfig.safe;
          return (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'92px 1fr 150px 100px 110px 70px', gap:8, padding:'10px 4px', borderBottom:'1px solid rgba(99,120,175,0.05)', alignItems:'center', borderRadius:4, transition:'background 0.15s', cursor:'default' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace' }}>{m.date}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.area}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{m.type}</div>
              </div>
              <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{m.substance}</div>
              <div style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-primary)' }}>{m.value}</div>
              <PctBar pct={m.pct} />
              <span className={`badge ${sc.cls}`}>{sc.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
