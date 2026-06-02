import { Bell, Search, Calendar, RefreshCw, Download } from 'lucide-react';
export default function Header() {
  return (
    <header style={{ position:'sticky', top:0, zIndex:40, background:'rgba(6,11,24,0.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)', padding:'0 28px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div>
        <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:20, fontWeight:700, background:'linear-gradient(135deg, #e2e8f8 0%, #7c6dfa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Exposure Safety Dashboard</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>Chemical Workplace Risk Analytics · NF Halmstad · AFS 2020:6</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'7px 14px', color:'var(--text-muted)', fontSize:13 }}>
          <Search size={14} /><span>Search substances...</span>
          <span style={{ marginLeft:8, fontSize:10, padding:'1px 6px', background:'var(--bg-elevated)', borderRadius:4 }}>⌘K</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'7px 14px', fontSize:12, color:'var(--text-secondary)' }}>
          <Calendar size={14} /><span>2020 – 2026</span>
        </div>
        <button style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:10, background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer' }}><RefreshCw size={15} /></button>
        <button style={{ display:'flex', alignItems:'center', gap:7, background:'linear-gradient(135deg, #7c6dfa, #5b8dee)', border:'none', borderRadius:10, padding:'8px 16px', fontSize:12, fontWeight:600, color:'#fff', cursor:'pointer', boxShadow:'0 4px 16px rgba(124,109,250,0.3)' }}>
          <Download size={14} />Export Report
        </button>
        <div style={{ position:'relative' }}>
          <button style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:10, background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer' }}><Bell size={15} /></button>
          <span style={{ position:'absolute', top:-3, right:-3, width:16, height:16, borderRadius:'50%', background:'var(--critical)', fontSize:9, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg-base)' }}>3</span>
        </div>
        <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg, #7c6dfa, #22d3ee)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', border:'2px solid var(--border-bright)', cursor:'pointer' }}>NF</div>
      </div>
    </header>
  );
}
