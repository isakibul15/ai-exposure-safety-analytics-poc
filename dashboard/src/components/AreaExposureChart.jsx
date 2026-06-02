import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { latestExposureByArea } from '../data/safetyData';
import { MapPin } from 'lucide-react';

const getColor = p => p > 100 ? '#ef4444' : p > 50 ? '#f97316' : p > 20 ? '#f59e0b' : '#10b981';
const shortLabel = s => s.replace('Flotation ','Flot. ').replace('Plockhytt ','PH ').slice(0,14);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = latestExposureByArea.find(a => a.area === label);
  return (
    <div style={{ background:'#0d1424', border:'1px solid rgba(99,120,175,0.25)', borderRadius:12, padding:'12px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', minWidth:180 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:16, marginBottom:3 }}>
          <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{p.name}</span>
          <span style={{ fontSize:11, fontWeight:700, color:getColor(p.value) }}>{p.value}%</span>
        </div>
      ))}
      {d && <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)', fontSize:11, color:'var(--text-muted)' }}>Risk Score: <span style={{ color:d.riskScore>=6?'#ef4444':d.riskScore>=3?'#f59e0b':'#10b981', fontWeight:700 }}>{d.riskScore}/25</span></div>}
    </div>
  );
};

export default function AreaExposureChart() {
  const sorted = [...latestExposureByArea].sort((a,b) => b.dust - a.dust);
  return (
    <div className="card" style={{ padding:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div className="section-title" style={{ marginBottom:4 }}>Area Exposure Map</div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Latest Measurements by Work Zone</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>% of occupational limit (NGV) · Most recent campaign</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-muted)' }}>
          <MapPin size={13} /><span>12 areas</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:14, marginBottom:14 }}>
        {[['< 20% Safe','#10b981'],['20–50% Low','#f59e0b'],['50–100% Med','#f97316'],['>100% Critical','#ef4444']].map(([l,c]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--text-muted)' }}>
            <span style={{ width:8, height:8, borderRadius:2, background:c, display:'inline-block' }} />{l}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={sorted} margin={{ top:0, right:0, left:-20, bottom:60 }} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,120,175,0.08)" horizontal vertical={false} />
          <XAxis dataKey="area" tick={{ fill:'#6b7fa8', fontSize:10 }} tickFormatter={shortLabel} axisLine={false} tickLine={false} angle={-45} textAnchor="end" interval={0} />
          <YAxis tick={{ fill:'#6b7fa8', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
          <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} />
          <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.3} />
          <Bar dataKey="dust" name="Dust % NGV" radius={[4,4,0,0]}>
            {sorted.map((entry,i) => <Cell key={i} fill={getColor(entry.dust)} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
