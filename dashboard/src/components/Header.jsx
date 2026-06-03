import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Calendar, RefreshCw, Download, Users, Cpu, X } from 'lucide-react';
import { mockEmployees, mockSensors } from '../data/couchbaseSchema';

// Build a flat searchable index once
const SEARCH_INDEX = [
  ...mockEmployees.map(e => ({ type: 'employee', label: e.id + ' — ' + e.role, sub: e.zone, page: 'employees', navId: 'employees', icon: 'user' })),
  ...mockSensors.map(s => ({ type: 'sensor',   label: s.id,                  sub: s.area + ' · ' + s.type, page: 'sensors', navId: 'sensors', icon: 'cpu' })),
];

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

export default function Header({ pageTitle, pageSub, onNavigate, dateFrom, dateTo, onDateFrom, onDateTo }) {
  const [search, setSearch]     = useState('');
  const [focused, setFocused]   = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
  const dateRef   = useRef(null);

  const results = search.trim().length > 0
    ? SEARCH_INDEX.filter(r =>
        r.label.toLowerCase().includes(search.toLowerCase()) ||
        r.sub.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6)
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false);
      if (dateRef.current && !dateRef.current.contains(e.target)) setDateOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function pickResult(r) {
    onNavigate && onNavigate(r.page, r.navId);
    setSearch('');
    setFocused(false);
  }

  return (
    <header style={{ position:'sticky', top:0, zIndex:40, background:'rgba(6,11,24,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)', padding:'0 28px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div>
        <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:20, fontWeight:700, background:'linear-gradient(135deg, #e2e8f8 0%, #7c6dfa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          {pageTitle || 'Exposure Safety Dashboard'}
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>
          {pageSub || 'Chemical Workplace Risk Analytics · NF Halmstad · AFS 2020:6'}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>

        {/* ── Functional Search ──────────────────────────────── */}
        <div ref={wrapRef} style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid ' + (focused ? 'rgba(124,109,250,0.45)' : 'var(--border)'), borderRadius:10, padding:'7px 14px', transition:'border-color 0.15s', minWidth:220 }}>
            <Search size={14} color={focused ? '#7c6dfa' : 'var(--text-muted)'} style={{ flexShrink:0 }} />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Search employees, sensors..."
              style={{ border:'none', outline:'none', background:'transparent', color:'var(--text-primary)', fontSize:13, width:'100%', minWidth:140 }}
            />
            {search && (
              <button onClick={() => { setSearch(''); inputRef.current?.focus(); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:0, display:'flex', alignItems:'center' }}>
                <X size={13} />
              </button>
            )}
            <span style={{ marginLeft:4, fontSize:10, padding:'1px 6px', background:'var(--bg-elevated)', borderRadius:4, color:'var(--text-muted)', flexShrink:0 }}>⌘K</span>
          </div>

          {/* Results dropdown */}
          {focused && results.length > 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:100 }}>
              {results.map((r, i) => (
                <button key={i} onClick={() => pickResult(r)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 14px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,109,250,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width:24, height:24, borderRadius:6, background: r.icon === 'user' ? 'rgba(124,109,250,0.15)' : 'rgba(34,211,238,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {r.icon === 'user' ? <Users size={12} color="#7c6dfa" /> : <Cpu size={12} color="#22d3ee" />}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{r.label}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>{r.sub}</div>
                  </div>
                  <span style={{ marginLeft:'auto', fontSize:10, padding:'2px 7px', borderRadius:4, background: r.icon === 'user' ? 'rgba(124,109,250,0.12)' : 'rgba(34,211,238,0.1)', color: r.icon === 'user' ? '#7c6dfa' : '#22d3ee' }}>
                    {r.type}
                  </span>
                </button>
              ))}
            </div>
          )}
          {focused && search.trim().length > 0 && results.length === 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:100 }}>
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>No results for "{search}"</span>
            </div>
          )}
        </div>

        {/* ── Functional Date Range ──────────────────────────── */}
        <div ref={dateRef} style={{ position:'relative' }}>
          <button
            onClick={() => setDateOpen(o => !o)}
            style={{ display:'flex', alignItems:'center', gap:7, background:'var(--bg-card)', border:'1px solid ' + (dateOpen ? 'rgba(124,109,250,0.45)' : 'var(--border)'), borderRadius:10, padding:'7px 14px', fontSize:12, color:'var(--text-secondary)', cursor:'pointer', transition:'border-color 0.15s' }}
          >
            <Calendar size={14} />
            <span style={{ fontWeight:600 }}>{dateFrom} – {dateTo}</span>
          </button>
          {dateOpen && (
            <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:100, minWidth:200 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Campaign Year Range</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>From</div>
                  <select value={dateFrom} onChange={e => onDateFrom && onDateFrom(Number(e.target.value))}
                    style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', color:'var(--text-primary)', fontSize:12, outline:'none', cursor:'pointer' }}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <span style={{ color:'var(--text-muted)', marginTop:14 }}>—</span>
                <div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>To</div>
                  <select value={dateTo} onChange={e => onDateTo && onDateTo(Number(e.target.value))}
                    style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', color:'var(--text-primary)', fontSize:12, outline:'none', cursor:'pointer' }}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => { onDateFrom && onDateFrom(2020); onDateTo && onDateTo(2026); }}
                style={{ marginTop:10, width:'100%', padding:'5px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'var(--text-muted)', fontSize:11, cursor:'pointer' }}>
                Reset to full range
              </button>
            </div>
          )}
        </div>

        <button style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:10, background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer' }}>
          <RefreshCw size={15} />
        </button>
        <button style={{ display:'flex', alignItems:'center', gap:7, background:'linear-gradient(135deg, #7c6dfa, #5b8dee)', border:'none', borderRadius:10, padding:'8px 16px', fontSize:12, fontWeight:600, color:'#fff', cursor:'pointer', boxShadow:'0 4px 16px rgba(124,109,250,0.3)' }}>
          <Download size={14} />Export
        </button>
        <div style={{ position:'relative' }}>
          <button style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:10, background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer' }}>
            <Bell size={15} />
          </button>
          <span style={{ position:'absolute', top:-3, right:-3, width:16, height:16, borderRadius:'50%', background:'var(--critical)', fontSize:9, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg-base)' }}>3</span>
        </div>
        <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg, #7c6dfa, #22d3ee)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', border:'2px solid var(--border-bright)', cursor:'pointer' }}>NF</div>
      </div>
    </header>
  );
}
