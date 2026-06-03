import { useState, useEffect, useRef } from 'react';
import { Brain, Zap } from 'lucide-react';

// ── Node definitions ──────────────────────────────────────────
// x/y are % of SIZE — kept ≥ 8 and ≤ 92 so glows never clip
const NODES = [
  { id: 'ai',         label: 'ChemSafe AI',    sub: 'llama-3.3-70b',      x: 50,  y: 50,  r: 26, color: '#7c6dfa' },
  { id: 'employees',  label: 'Employees',       sub: '12 workers',         x: 50,  y: 12,  r: 15, color: '#22d3ee' },
  { id: 'sensors',    label: 'IoT Sensors',     sub: '12 nodes',           x: 79,  y: 25,  r: 15, color: '#10b981' },
  { id: 'risk',       label: 'Risk Matrix',     sub: 'score ≥ 6',          x: 86,  y: 58,  r: 15, color: '#ef4444' },
  { id: 'blood',      label: 'Blood Lead',      sub: '16 quarters',        x: 67,  y: 84,  r: 13, color: '#f97316' },
  { id: 'meas',       label: 'Measurements',    sub: '14 samples',         x: 33,  y: 84,  r: 13, color: '#f59e0b' },
  { id: 'exposure',   label: 'Exp. Trends',     sub: '8 campaigns',        x: 14,  y: 58,  r: 13, color: '#a78bfa' },
  { id: 'compliance', label: 'Compliance',      sub: 'AFS 2020:6',         x: 21,  y: 25,  r: 13, color: '#34d399' },
  { id: 'rag',        label: 'RAG Pipeline',    sub: '67 files',           x: 66,  y: 6,   r: 10, color: '#818cf8' },
  { id: 'afs',        label: 'AFS 2020:6',      sub: 'NGV limits',         x: 92,  y: 42,  r: 10, color: '#60a5fa' },
  { id: 'metals',     label: 'Metals',          sub: '10 substances',      x: 92,  y: 68,  r: 10, color: '#fb923c' },
  { id: 'icsc',       label: 'ICSCs',           sub: 'Safety cards',       x: 8,   y: 68,  r: 10, color: '#f472b6' },
  { id: 'areas',      label: 'Work Areas',      sub: '12 zones',           x: 8,   y: 42,  r: 10, color: '#38bdf8' },
];

const EDGES = [
  ['ai','employees'],['ai','sensors'],['ai','risk'],['ai','blood'],
  ['ai','meas'],['ai','exposure'],['ai','compliance'],
  ['employees','rag'],['employees','blood'],
  ['sensors','afs'],['sensors','metals'],
  ['risk','afs'],['risk','metals'],
  ['blood','icsc'],['meas','areas'],
  ['exposure','icsc'],['compliance','afs'],
];

// Orbiting particle angles (7 satellites around AI core)
const ORBIT_PARTICLES = [
  { angle: 0,          r: 44, size: 2.8, color: '#7c6dfa', speed: 0.38 },
  { angle: Math.PI/2,  r: 52, size: 2,   color: '#22d3ee', speed: 0.28 },
  { angle: Math.PI,    r: 44, size: 2.5, color: '#a78bfa', speed: 0.45 },
  { angle: 3*Math.PI/2,r: 52, size: 1.8, color: '#7c6dfa', speed: 0.33 },
  { angle: Math.PI/4,  r: 60, size: 1.5, color: '#22d3ee', speed: 0.22 },
  { angle: 5*Math.PI/4,r: 60, size: 1.5, color: '#a78bfa', speed: 0.19 },
  { angle: 3*Math.PI/4,r: 48, size: 2,   color: '#10b981', speed: 0.41 },
];

const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));
const SIZE = 420;
const PAD  = 24;                          // viewBox padding so edge glows never clip
const p = pct => (pct / 100) * SIZE;

function hexPath(cx, cy, r, rot = 0) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + rot;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

// Smooth blob path using 8-point organic warp
function blobPath(cx, cy, baseR, warp, t) {
  const pts = 12;
  const coords = [];
  for (let i = 0; i < pts; i++) {
    const angle = (2 * Math.PI * i) / pts;
    const freq1 = Math.sin(t * 0.7 + angle * 2) * warp;
    const freq2 = Math.sin(t * 1.1 + angle * 3 + 1) * warp * 0.6;
    const r = baseR + freq1 + freq2;
    coords.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  // Smooth closed curve via cubic bezier approximation
  let d = `M ${coords[0][0].toFixed(2)},${coords[0][1].toFixed(2)}`;
  for (let i = 0; i < pts; i++) {
    const curr = coords[i];
    const next = coords[(i + 1) % pts];
    const cpx = (curr[0] + next[0]) / 2;
    const cpy = (curr[1] + next[1]) / 2;
    d += ` Q ${curr[0].toFixed(2)},${curr[1].toFixed(2)} ${cpx.toFixed(2)},${cpy.toFixed(2)}`;
  }
  return d + ' Z';
}

export default function MemoryGraphCard() {
  const [hovered, setHovered] = useState(null);
  const [active,  setActive]  = useState(null);
  const animRef   = useRef(null);
  const tRef      = useRef(0);
  const lastRef   = useRef(null);

  // All animated values stored in a single ref to avoid re-render lag
  const [animState, setAnimState] = useState({
    t: 0,
    rot1: 0, rot2: 0, rot3: 0,
    particles: ORBIT_PARTICLES.map(op => ({ ...op })),
    pulse: 1,
    edgePulse: 0,
  });

  useEffect(() => {
    function frame(now) {
      if (!lastRef.current) lastRef.current = now;
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      tRef.current += dt;
      const t = tRef.current;

      setAnimState({
        t,
        rot1:  t * 0.25,                  // slow CW ring
        rot2: -t * 0.16,                  // slower CCW ring
        rot3:  t * 0.40,                  // fast inner hex
        pulse: 1 + Math.sin(t * 1.8) * 0.06 + Math.sin(t * 0.7) * 0.03,
        edgePulse: (t * 0.35) % 1,
        particles: ORBIT_PARTICLES.map(op => ({
          ...op,
          angle: op.angle + t * op.speed,
        })),
      });

      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const { t, rot1, rot2, rot3, pulse, edgePulse, particles } = animState;

  const sel = active || hovered;
  const connectedIds = sel
    ? new Set(EDGES.filter(([a, b]) => a === sel || b === sel).flatMap(e => e))
    : null;
  const selNode = sel ? nodeMap[sel] : null;

  const aiCX = p(50), aiCY = p(50);

  return (
    <div className="card" style={{ padding: '18px 22px', overflow: 'visible' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,rgba(124,109,250,0.2),rgba(34,211,238,0.1))', border: '1px solid rgba(124,109,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={16} color="#7c6dfa" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>AI Memory Graph</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
            Knowledge nodes loaded into ChemSafe AI · hover or click to explore
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(124,109,250,0.08)', border: '1px solid rgba(124,109,250,0.2)', borderRadius: 8 }}>
          <Zap size={11} color="#7c6dfa" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#7c6dfa' }}>~4k tokens</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── SVG Graph ─────────────────────────────────────────── */}
        {/* viewBox adds PAD on all sides so edge-node glows are never clipped */}
        <svg
          viewBox={`${-PAD} ${-PAD} ${SIZE + PAD * 2} ${SIZE + PAD * 2}`}
          width={SIZE + PAD * 2}
          height={SIZE + PAD * 2}
          style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
        >
          <defs>
            {NODES.map(n => (
              <radialGradient key={n.id} id={'rg_' + n.id} cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={n.color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={n.color} stopOpacity="0.02" />
              </radialGradient>
            ))}

            {/* AI core layered gradient */}
            <radialGradient id="ai_core" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#b0a0ff" stopOpacity="1" />
              <stop offset="35%"  stopColor="#7c6dfa" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#4433cc" stopOpacity="0.7" />
            </radialGradient>
            <radialGradient id="ai_glow_grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#7c6dfa" stopOpacity="0.55" />
              <stop offset="60%"  stopColor="#7c6dfa" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>

            {/* Soft blur for glow layers */}
            <filter id="blur_xl" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
            <filter id="blur_md" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <filter id="blur_sm" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
            <filter id="node_glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Deep background glow ────────────────────────────── */}
          <circle cx={aiCX} cy={aiCY} r={180}
            fill="url(#ai_glow_grad)"
            transform={`scale(${pulse})`}
            style={{ transformOrigin: `${aiCX}px ${aiCY}px` }}
          />

          {/* Ambient orbital rings */}
          <circle cx={aiCX} cy={aiCY} r={160} fill="none" stroke="rgba(124,109,250,0.06)" strokeWidth="1" />
          <circle cx={aiCX} cy={aiCY} r={105} fill="none" stroke="rgba(34,211,238,0.05)"  strokeWidth="1" />
          <circle cx={aiCX} cy={aiCY} r={58}  fill="none" stroke="rgba(124,109,250,0.08)" strokeWidth="0.8" />

          {/* ── Edges ──────────────────────────────────────────────── */}
          {EDGES.map(([a, b]) => {
            const na = nodeMap[a], nb = nodeMap[b];
            const x1 = p(na.x), y1 = p(na.y), x2 = p(nb.x), y2 = p(nb.y);
            const hl   = connectedIds && connectedIds.has(a) && connectedIds.has(b);
            const fd   = connectedIds && !hl;
            const core = a === 'ai' || b === 'ai';
            const len  = Math.hypot(x2 - x1, y2 - y1);
            // Travelling dash offset
            const dashOff = -(edgePulse * (len + 20));

            return (
              <g key={a + b} opacity={fd ? 0.05 : 1}>
                {/* Base line */}
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={hl ? na.color : core ? 'rgba(124,109,250,0.22)' : 'rgba(255,255,255,0.05)'}
                  strokeWidth={hl ? 2 : core ? 1.2 : 0.7}
                  strokeLinecap="round"
                />
                {/* Animated flow dash */}
                {(core || hl) && (
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={hl ? na.color : '#7c6dfa'}
                    strokeWidth={hl ? 2.5 : 1.2}
                    strokeDasharray="6 16"
                    strokeDashoffset={dashOff}
                    opacity={hl ? 1 : 0.35}
                    strokeLinecap="round"
                  />
                )}
                {/* Travelling bright dot on highlighted edges */}
                {hl && (() => {
                  const frac = edgePulse;
                  const px2 = x1 + (x2 - x1) * frac;
                  const py2 = y1 + (y2 - y1) * frac;
                  return <circle cx={px2} cy={py2} r={3} fill={na.color} opacity={0.95} filter="url(#blur_sm)" />;
                })()}
              </g>
            );
          })}

          {/* ── AI Core Ball — THE STAR ────────────────────────────── */}
          <g transform={`translate(${aiCX},${aiCY})`}>

            {/* Outermost pulsing aurora blob */}
            <path d={blobPath(0, 0, 58, 6, t * 0.6)}
              fill="url(#rg_ai)" filter="url(#blur_xl)" opacity="0.7" />

            {/* Second organic blob layer */}
            <path d={blobPath(0, 0, 44, 5, t * 0.9 + 1.5)}
              fill="rgba(124,109,250,0.18)" filter="url(#blur_md)" />

            {/* Rotating outer rings */}
            <g transform={`rotate(${rot1 * 180 / Math.PI})`}>
              <circle r={46} fill="none" stroke="rgba(124,109,250,0.18)" strokeWidth="1" strokeDasharray="4 8" />
              <circle r={46} fill="none" stroke="rgba(34,211,238,0.1)"   strokeWidth="0.5" strokeDasharray="2 20" />
            </g>
            <g transform={`rotate(${rot2 * 180 / Math.PI})`}>
              <path d={hexPath(0, 0, 40)} fill="none" stroke="rgba(124,109,250,0.22)" strokeWidth="0.8" />
              {/* Corner sparkles */}
              {[0,1,2,3,4,5].map(i => {
                const a = (Math.PI / 3) * i + rot2;
                return <circle key={i} cx={40 * Math.cos(a)} cy={40 * Math.sin(a)} r={1.5} fill="#7c6dfa" opacity={0.6} />;
              })}
            </g>
            <g transform={`rotate(${rot3 * 180 / Math.PI})`}>
              <path d={hexPath(0, 0, 30)} fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="0.7" />
            </g>

            {/* Orbiting particles */}
            {particles.map((op, i) => {
              const px2 = op.r * Math.cos(op.angle);
              const py2 = op.r * Math.sin(op.angle);
              const trail1 = { x: op.r * Math.cos(op.angle - 0.25), y: op.r * Math.sin(op.angle - 0.25) };
              const trail2 = { x: op.r * Math.cos(op.angle - 0.5),  y: op.r * Math.sin(op.angle - 0.5)  };
              return (
                <g key={i}>
                  {/* Trail */}
                  <circle cx={trail2.x} cy={trail2.y} r={op.size * 0.4} fill={op.color} opacity={0.15} />
                  <circle cx={trail1.x} cy={trail1.y} r={op.size * 0.65} fill={op.color} opacity={0.3} />
                  {/* Main particle */}
                  <circle cx={px2} cy={py2} r={op.size} fill={op.color} opacity={0.9} filter="url(#blur_sm)" />
                </g>
              );
            })}

            {/* Core ball glow layers */}
            <circle r={26 * pulse} fill="rgba(124,109,250,0.3)" filter="url(#blur_md)" />
            <circle r={22 * pulse} fill="rgba(100,80,255,0.5)" filter="url(#blur_sm)" />

            {/* Main ball */}
            <circle r={22 * pulse} fill="url(#ai_core)" />

            {/* Inner hex crystal overlay */}
            <g transform={`rotate(${rot3 * 180 / Math.PI})`} opacity="0.5">
              <path d={hexPath(0, 0, 13)} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
              <path d={hexPath(0, 0, 7)}  fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
            </g>

            {/* Specular highlight */}
            <circle cx={-6} cy={-7} r={6} fill="rgba(255,255,255,0.22)" />
            <circle cx={-4} cy={-5} r={2} fill="rgba(255,255,255,0.45)" />

            {/* Centre dot */}
            <circle r={3} fill="#fff" opacity={0.85} />

            {/* Label */}
            <text y={36} textAnchor="middle" fontSize={9} fontWeight={700}
              fill="rgba(255,255,255,0.75)" style={{ userSelect: 'none' }}>
              ChemSafe AI
            </text>
            <text y={46} textAnchor="middle" fontSize={7} fontWeight={500}
              fill="rgba(124,109,250,0.85)" style={{ userSelect: 'none' }}>
              llama-3.3-70b
            </text>
          </g>

          {/* ── Other Nodes ───────────────────────────────────────── */}
          {NODES.filter(n => n.id !== 'ai').map(n => {
            const cx  = p(n.x), cy = p(n.y);
            const hov = hovered === n.id || active === n.id;
            const fd  = connectedIds && !connectedIds.has(n.id);
            const r   = n.r * (hov ? 1.4 : 1);
            const large = n.r >= 13;

            return (
              <g key={n.id}
                transform={`translate(${cx},${cy})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setActive(active === n.id ? null : n.id)}
                opacity={fd ? 0.1 : 1}
                filter={hov ? 'url(#node_glow)' : undefined}
              >
                {hov && <circle r={r + 12} fill="none" stroke={n.color} strokeWidth="0.7" opacity="0.4" />}
                {hov && <circle r={r + 20} fill="none" stroke={n.color} strokeWidth="0.4" opacity="0.15" />}
                <circle r={r + (large ? 10 : 7)} fill={'url(#rg_' + n.id + ')'} />

                {large
                  ? <>
                      <path d={hexPath(0, 0, r)} fill={n.color + '22'} stroke={n.color} strokeWidth={hov ? 1.8 : 1} />
                      <path d={hexPath(0, 0, r * 0.55)} fill={n.color + '10'} stroke={n.color + '60'} strokeWidth="0.6" />
                    </>
                  : <>
                      <circle r={r} fill={n.color + '1a'} stroke={n.color} strokeWidth={hov ? 1.5 : 0.8} />
                      <circle r={r * 0.55} fill={n.color + '10'} stroke={n.color + '55'} strokeWidth="0.5" />
                    </>
                }
                <circle r={hov ? 3.5 : 2.2} fill={n.color} opacity={0.9} />

                <text y={r + 11} textAnchor="middle"
                  fontSize={large ? 8 : 7.5}
                  fontWeight={hov ? 800 : 600}
                  fill={hov ? n.color : 'rgba(255,255,255,0.6)'}
                  style={{ userSelect: 'none' }}>
                  {n.label}
                </text>
                {hov && (
                  <text y={r + 21} textAnchor="middle" fontSize={6.5}
                    fill={n.color} opacity={0.8} style={{ userSelect: 'none' }}>
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Info panel ────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          {selNode ? (
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid ' + selNode.color + '44',
              borderRadius: 12, padding: '14px 16px',
              boxShadow: '0 0 24px ' + selNode.color + '14',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: selNode.color, boxShadow: '0 0 8px ' + selNode.color }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: selNode.color }}>{selNode.label}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>{selNode.sub}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Connected nodes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {EDGES
                  .filter(([a, b]) => a === sel || b === sel)
                  .map(([a, b]) => {
                    const o = nodeMap[a === sel ? b : a];
                    return (
                      <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', background: o.color + '0d', border: '1px solid ' + o.color + '25', borderRadius: 7 }}>
                        <div style={{ width: 7, height: 7, borderRadius: 2, background: o.color, flexShrink: 0, boxShadow: '0 0 5px ' + o.color }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{o.label}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 9, color: o.color, opacity: 0.8 }}>{o.sub}</span>
                      </div>
                    );
                  })
                }
              </div>
              {active === sel && (
                <button onClick={() => setActive(null)}
                  style={{ marginTop: 10, width: '100%', padding: '5px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer' }}>
                  Deselect
                </button>
              )}
            </div>
          ) : (
            <>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Legend</div>
                {[
                  { color: '#7c6dfa', label: 'AI Core',     sub: 'Animated crystal ball',  shape: 'circle' },
                  { color: '#22d3ee', label: 'Primary data', sub: 'Inner-ring hex nodes',   shape: 'hex' },
                  { color: '#818cf8', label: 'References',   sub: 'Outer circle nodes',     shape: 'circle' },
                  { color: '#10b981', label: 'Live flow',    sub: 'Animated edge dashes',   shape: 'dash' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <svg width={18} height={18} viewBox="0 0 18 18">
                      {item.shape === 'hex'
                        ? <path d={hexPath(9, 9, 7)} fill={item.color + '22'} stroke={item.color} strokeWidth="1.2" />
                        : item.shape === 'dash'
                        ? <line x1={1} y1={9} x2={17} y2={9} stroke={item.color} strokeWidth="1.5" strokeDasharray="4 4" />
                        : <circle cx={9} cy={9} r={7} fill={item.color + '22'} stroke={item.color} strokeWidth="1.2" />
                      }
                    </svg>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{item.label}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(124,109,250,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Context budget · 12k limit</div>
                {[
                  { label: 'Loaded',   val: 4025, color: '#7c6dfa' },
                  { label: 'Response', val: 1024, color: '#22d3ee' },
                  { label: 'Headroom', val: 6951, color: '#10b981' },
                ].map(b => (
                  <div key={b.label} style={{ marginBottom: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>
                      <span>{b.label}</span>
                      <span style={{ color: b.color, fontWeight: 700 }}>{b.val.toLocaleString()} tk</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: (b.val / 12000 * 100) + '%', background: `linear-gradient(90deg,${b.color},${b.color}88)`, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                Click a node to pin · hover to preview connections
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
