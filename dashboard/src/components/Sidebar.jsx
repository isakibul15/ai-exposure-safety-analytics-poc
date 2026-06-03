import { LayoutDashboard, Activity, FlaskConical, AlertTriangle, Users, Settings, ChevronRight, Beaker, BarChart3, TrendingUp, ShieldCheck, Database, Cpu, Brain, Zap } from 'lucide-react';

// Each item has a unique navId — only ONE is ever highlighted
const NAV_SECTIONS = [
  {
    title: 'Safety Dashboard',
    items: [
      { icon: LayoutDashboard, label: 'Overview',          navId: 'overview',          page: 'overview' },
      { icon: Activity,        label: 'Exposure Trends',   navId: 'exposure_trends',   page: 'overview' },
      { icon: FlaskConical,    label: 'Chemical Analysis', navId: 'chemical_analysis', page: 'overview' },
      { icon: AlertTriangle,   label: 'Risk Matrix',       navId: 'risk_matrix',       page: 'overview', badge: '3' },
      { icon: Users,           label: 'Bio. Monitoring',   navId: 'bio_monitoring',    page: 'overview' },
      { icon: BarChart3,       label: 'Measurements',      navId: 'measurements',      page: 'overview' },
      { icon: TrendingUp,      label: 'Compliance',        navId: 'compliance',        page: 'overview' },
      { icon: ShieldCheck,     label: 'Actions & PPE',     navId: 'actions_ppe',       page: 'overview' },
    ],
  },
  {
    title: 'Database / IoT',
    items: [
      { icon: Database, label: 'DB Schema',       navId: 'schema',    page: 'schema'    },
      { icon: Users,    label: 'Employees',       navId: 'employees', page: 'employees' },
      { icon: Cpu,      label: 'Sensors',         navId: 'sensors',   page: 'sensors'   },
      { icon: Zap,      label: 'IoT Time-Series', navId: 'iot',       page: 'iot'       },
      { icon: Brain,    label: 'RAG Pipeline',    navId: 'rag',       page: 'rag'       },
    ],
  },
];

// activeNavId: the navId of the currently selected item
// onNavigate(page, navId): called when a nav item is clicked
export default function Sidebar({ activeNavId, onNavigate }) {
  return (
    <aside style={{ width:'var(--sidebar-w)', minHeight:'100vh', background:'var(--bg-card)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, zIndex:50 }}>
      {/* Logo */}
      <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, #7c6dfa 0%, #22d3ee 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(124,109,250,0.35)' }}>
            <Beaker size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:14, color:'var(--text-primary)', letterSpacing:'-0.2px' }}>ExpoSure</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.5px', textTransform:'uppercase' }}>Analytics POC</div>
          </div>
        </div>
      </div>

      {/* Facility badge */}
      <div style={{ margin:'16px 12px', padding:'12px 14px', background:'var(--accent-violet-dim)', borderRadius:12, border:'1px solid rgba(124,109,250,0.2)' }}>
        <div style={{ fontSize:10, color:'var(--accent-violet)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>Active Facility</div>
        <div style={{ fontSize:12, color:'var(--text-primary)', fontWeight:600 }}>Stena Recycling NF</div>
        <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:2 }}>Halmstad, Sweden</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
          <span className="live-dot" />
          <span style={{ fontSize:10, color:'var(--safe)' }}>Monitoring Active</span>
        </div>
      </div>

      {/* Nav sections */}
      <nav style={{ flex:1, padding:'8px 10px', overflowY:'auto' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.title} style={{ marginBottom: 18 }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', padding:'4px 10px 8px' }}>
              {section.title}
            </div>
            {section.items.map(item => {
              const Icon = item.icon;
              const active = activeNavId === item.navId;
              return (
                <button
                  key={item.navId}
                  onClick={() => onNavigate(item.page, item.navId)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:10,
                    padding:'9px 12px', borderRadius:10, marginBottom:2,
                    background: active ? 'rgba(124,109,250,0.14)' : 'transparent',
                    border: active ? '1px solid rgba(124,109,250,0.25)' : '1px solid transparent',
                    color: active ? 'var(--accent-violet)' : 'var(--text-secondary)',
                    cursor:'pointer', transition:'all 0.15s', textAlign:'left', fontSize:13,
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                  <span style={{ flex:1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background:'var(--critical-dim)', color:'var(--critical)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:6, fontSize:10, fontWeight:700, padding:'1px 6px' }}>
                      {item.badge}
                    </span>
                  )}
                  {active && <ChevronRight size={14} />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding:'12px 10px', borderTop:'1px solid var(--border)' }}>
        <button style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, background:'transparent', border:'1px solid transparent', color:'var(--text-secondary)', cursor:'pointer', fontSize:13 }}>
          <Settings size={16} strokeWidth={2} /><span>Settings</span>
        </button>
        <div style={{ margin:'8px 12px 2px', fontSize:10, color:'var(--text-muted)' }}>Assessment rev. 2026-05-28</div>
        <div style={{ margin:'0 12px', fontSize:10, color:'var(--text-muted)' }}>AFS 2020:6 Compliant</div>
      </div>
    </aside>
  );
}
