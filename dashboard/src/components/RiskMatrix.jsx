import { riskMatrixData } from '../data/safetyData';
import { TrendingDown, Minus } from 'lucide-react';

const getRisk = (score) => {
  if (score >= 15) return { bg: 'var(--critical-dim)', color: 'var(--critical)', border: 'rgba(239,68,68,0.25)' };
  if (score >= 10) return { bg: 'var(--danger-dim)',   color: 'var(--danger)',   border: 'rgba(249,115,22,0.25)' };
  if (score >= 5)  return { bg: 'var(--warning-dim)',  color: 'var(--warning)',  border: 'rgba(245,158,11,0.25)' };
  if (score >= 3)  return { bg: 'rgba(34,211,238,0.08)', color: '#22d3ee',       border: 'rgba(34,211,238,0.2)' };
  return                   { bg: 'var(--safe-dim)',    color: 'var(--safe)',     border: 'rgba(16,185,129,0.2)' };
};

function GridCell({ s, k }) {
  const score = s * k;
  const r = getRisk(score);
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 4,
      background: r.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontWeight: 700, color: r.color,
      border: '1px solid ' + r.border,
    }}>
      {score}
    </div>
  );
}

export default function RiskMatrix() {
  const sorted = [...riskMatrixData].sort((a, b) => b.score - a.score);

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', gap: 24 }}>

        {/* 5×5 visual grid */}
        <div style={{ flexShrink: 0 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Risk Matrix (S×K)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[5, 4, 3, 2, 1].map((k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 14, fontSize: 9, color: 'var(--text-muted)', textAlign: 'right' }}>{k}</div>
                {[1, 2, 3, 4, 5].map((s) => <GridCell key={s} s={s} k={k} />)}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <div style={{ width: 14 }} />
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} style={{ width: 28, textAlign: 'center', fontSize: 9, color: 'var(--text-muted)' }}>{s}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ width: 14 }} />
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{'← Probability →'}</div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['1–2', 'Minimal', '#10b981'],
              ['3–4', 'Low',     '#22d3ee'],
              ['5–9', 'Medium',  '#f59e0b'],
              ['10–14','High',   '#f97316'],
              ['15–25','Severe', '#ef4444'],
            ].map(([range, label, col]) => (
              <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                <span style={{ width: 20, height: 8, borderRadius: 2, background: col, opacity: 0.7, display: 'inline-block' }} />
                <span style={{ color: col }}>{range}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />

        {/* Risk item list */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', maxHeight: 380 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Active Risk Items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map((item, i) => {
              const risk = getRisk(item.score);
              const rowBg = i < 3 ? risk.bg : 'rgba(255,255,255,0.01)';
              const rowBorder = i < 3 ? risk.border : 'var(--border)';
              return (
                <div
                  key={i}
                  style={{
                    background: rowBg,
                    border: '1px solid ' + rowBorder,
                    borderRadius: 10, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  {/* Score badge */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: risk.bg,
                    border: '1px solid ' + risk.border,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 800, color: risk.color }}>
                      {item.score}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {item.hazard}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.area} · {item.lastAction}
                    </div>
                  </div>

                  {/* P / C pills */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {[['P', item.probability, 'var(--accent-violet)'], ['C', item.consequence, 'var(--accent-cyan)']].map(([lbl, val, col]) => (
                      <div key={lbl} style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 6, padding: '3px 7px' }}>
                        <div style={{ fontSize: 8, color: 'var(--text-muted)', marginBottom: 1 }}>{lbl}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: col }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Trend */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {item.trend === 'improving'
                      ? <TrendingDown size={12} color="var(--safe)" />
                      : <Minus size={12} color="var(--text-muted)" />
                    }
                    <span style={{ fontSize: 10, color: item.trend === 'improving' ? 'var(--safe)' : 'var(--text-muted)' }}>
                      {item.trend === 'improving' ? 'Improving' : 'Stable'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
