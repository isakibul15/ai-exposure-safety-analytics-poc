import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { complianceDonutData } from '../data/safetyData';
import { CheckCircle } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background:'#0d1424', border:'1px solid rgba(99,120,175,0.25)', borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize:12, fontWeight:700, color:d.color, marginBottom:4 }}>{d.name}</div>
      <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{d.value}% of all samples</div>
    </div>
  );
};

export default function ComplianceDonut() {
  return (
    <div className="card" style={{ padding:'24px', minWidth:0, height:'100%' }}>
      <div style={{ marginBottom:16 }}>
        <div className="section-title" style={{ marginBottom:4 }}>Compliance Distribution</div>
        <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>All Measurement Results</div>
      </div>
      <div style={{ position:'relative', height:190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={complianceDonutData} cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {complianceDonutData.map((entry,i) => <Cell key={i} fill={entry.color} opacity={0.9} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:26, fontWeight:700, color:'#10b981', lineHeight:1 }}>86%</div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>Compliant</div>
        </div>
      </div>
      <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:8 }}>
        {complianceDonutData.map((d,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:d.color, display:'inline-block', flexShrink:0 }} />
              <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{d.name}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:60, height:4, borderRadius:2, background:'var(--bg-elevated)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${d.value}%`, background:d.color, borderRadius:2 }} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:d.color, minWidth:28, textAlign:'right' }}>{d.value}%</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--safe)' }}>
        <CheckCircle size={13} />
        <span>68% of measurements well below limits</span>
      </div>
    </div>
  );
}
