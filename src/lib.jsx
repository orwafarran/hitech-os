/* ============================================================
   HT-OS — shared component library  (window.UI)
   ============================================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---- tiny helpers ---- */
const cx = (...a) => a.filter(Boolean).join(' ');
const fmt = (n) => n.toLocaleString('en-US');
const stateColor = { ok:'var(--green)', warn:'var(--amber)', crit:'var(--red)', idle:'var(--ink3)', info:'var(--accent)', accent:'var(--accent)' };

/* ---- Dot ---- */
function Dot({ s='ok', live }) {
  return <span className={cx('dot', s, live && 'live')} />;
}

/* ---- Tag ---- */
function Tag({ s, children }) { return <span className={cx('tag', s)}>{children}</span>; }

/* ---- Bar ---- */
function Bar({ value, max=100, s='', thick }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return <div className={cx('bar', thick && 'thick')}><i className={s} style={{ width: pct + '%' }} /></div>;
}

/* ---- Panel ---- */
function Panel({ title, sub, right, glow, glowCrit, children, className, flush, style }) {
  return (
    <div className={cx('panel', glow && 'glow', glowCrit && 'glow-crit', className)} style={style}>
      {title && (
        <div className="panel-hd">
          {(glow || glowCrit) && <span className={cx('hd-dot', glowCrit && 'crit')} />}
          <span className="ttl">{title}</span>
          {sub && <span className="sub">{sub}</span>}
          <span className="spacer" />
          {right}
        </div>
      )}
      <div className={cx('panel-bd', flush && 'flush')} style={{ display:'flex', flexDirection:'column' }}>{children}</div>
    </div>
  );
}

/* ---- Btn ---- */
function Btn({ kind='', sm, children, onClick, disabled, title }) {
  return <button className={cx('btn', kind, sm && 'sm')} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}

/* ---- Animated number (counts when value changes; cyan pop while live) ---- */
function Num({ value, decimals=0, className, style, live }) {
  const [disp, setDisp] = useState(value);
  const [pop, setPop] = useState(false);
  const ref = useRef(value);
  useEffect(() => {
    const from = ref.current, to = value;
    if (from === to) return;
    ref.current = to;
    if (live) { setPop(true); const p = setTimeout(() => setPop(false), 800); }
    let raf, start;
    const dur = 700;
    const step = (t) => {
      if (!start) start = t;
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setDisp(from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const v = decimals ? disp.toFixed(decimals) : Math.round(disp);
  return <span className={cx('tnum', pop && 'countpop', className)} style={style}>{Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals })}</span>;
}

/* ---- Health ring (SVG circle) ---- */
function Ring({ value, size=140, stroke=10, color='var(--accent)', track='rgba(255,255,255,.08)', label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition:'stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)', filter:'drop-shadow(0 0 6px '+color+'66)' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
        <span className="mono tnum" style={{ fontSize:size*0.3, fontWeight:600, lineHeight:1 }}>{label}</span>
        {sub && <span className="label" style={{ fontSize:9 }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ---- Sparkline ---- */
function Spark({ data, w=92, h=26, color='var(--accent)', fill=true }) {
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((d, i) => [ (i / (data.length - 1)) * w, h - ((d - min) / rng) * (h - 4) - 2 ]);
  const line = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = `0,${h} ` + line + ` ${w},${h}`;
  return (
    <svg width={w} height={h} style={{ display:'block' }}>
      {fill && <polygon points={area} fill={color} opacity="0.1" />}
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.2" fill={color} />
    </svg>
  );
}

/* ---- KPI tile ---- */
function Kpi({ label, value, unit, delta, deltaDir='up', spark, sparkColor, size=34, children }) {
  return (
    <div className="col" style={{ gap:7, minWidth:0 }}>
      <span className="label">{label}</span>
      <div className="between" style={{ alignItems:'flex-end' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
          <span className="kpi-val mono" style={{ fontSize:size }}>{value}</span>
          {unit && <span className="kpi-unit">{unit}</span>}
        </div>
        {spark && <Spark data={spark} color={sparkColor || 'var(--accent)'} />}
      </div>
      {delta && <span className={cx('delta', deltaDir)}>{delta}</span>}
      {children}
    </div>
  );
}

/* ---- Equipment icons (simple line glyphs from basic shapes) ---- */
const EQ_PATHS = {
  truck: <g><rect x="1.5" y="7" width="12" height="4" rx="0.6" /><path d="M13.5 11 V8 H16.5 L19.5 10.3 V11" /><circle cx="5.5" cy="12.6" r="1.5" /><circle cx="16.4" cy="12.6" r="1.5" /></g>,
  crane: <g><rect x="1.5" y="9.4" width="8" height="2.6" rx="0.5" /><circle cx="3.6" cy="13.2" r="1.2" /><circle cx="7.6" cy="13.2" r="1.2" /><path d="M5.5 9.4 V3.4 L19.5 6" /><path d="M19.5 6 V8.6" /></g>,
  pickup: <g><path d="M2 11 V8.4 H7.2 L8.8 6.4 H12.6 V11" /><path d="M12.6 8.2 H21.5 V11" /><circle cx="6" cy="12.5" r="1.5" /><circle cx="17.8" cy="12.5" r="1.5" /></g>,
  fork: <g><rect x="2" y="7.4" width="8" height="4" rx="0.6" /><circle cx="4.6" cy="12.6" r="1.5" /><circle cx="9" cy="12.6" r="1.5" /><path d="M10 8.4 L20 5.4" /><path d="M20 5.4 V8.2 M20 8.2 H22.6" /></g>,
  pump: <g><rect x="1.5" y="8" width="11" height="3.6" rx="0.6" /><circle cx="4.6" cy="12.6" r="1.5" /><circle cx="10" cy="12.6" r="1.5" /><path d="M7 8 V4 L13.5 3" /></g>,
};
function EqIcon({ type='truck', size=20, color='currentColor', style }) {
  return (
    <svg className="eqi" width={size * 1.5} height={size} viewBox="0 0 24 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={style}>
      {EQ_PATHS[type] || EQ_PATHS.truck}
    </svg>
  );
}

/* ---- Mini glyph in a box (alert categories / mono code) ---- */
function Code({ children, s }) {
  const col = s ? stateColor[s] : 'var(--ink2)';
  return <span className="mono" style={{ fontSize:10, fontWeight:700, color:col, letterSpacing:'.04em' }}>{children}</span>;
}

/* ---- Toast host ---- */
function Toasts({ items }) {
  const tico = { good:'✓', warn:'▲', crit:'!', accent:'◇' };
  return (
    <div className="toasts">
      {items.map(t => (
        <div key={t.id} className={cx('toast', t.kind, t.out && 'out')}>
          <span className="ti">{tico[t.kind] || '◇'}</span>
          <div className="col" style={{ minWidth:0 }}>
            <span className="tt">{t.msg}</span>
            {t.sub && <span className="ts">{t.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   UAE command board — stylised map with factory nodes + routes
   ============================================================ */
function UAEBoard({ live, onPick, selected, routes=[] }) {
  const D = window.HTOS;
  return (
    <div className={cx('blueprint', !live && 'paused')} style={{ position:'relative', width:'100%', height:'100%', minHeight:150, borderRadius:8, overflow:'hidden',
        background:'radial-gradient(120% 90% at 60% 30%, rgba(31,224,196,.045), transparent 60%), #090c12' }}>
      <div className="sweep" />
      {/* faint simplified coastline + gulf, decorative only */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.5 }}>
        <path d="M2,40 C14,34 22,30 34,26 C46,22 58,16 70,20 C80,23 88,30 98,30 L98,8 L2,8 Z"
          fill="rgba(63,95,134,.07)" stroke="rgba(63,95,134,.22)" strokeWidth="0.4" />
        <path d="M2,82 C16,80 26,78 40,82 C54,86 66,90 82,88 L98,90 L98,99 L2,99 Z"
          fill="rgba(255,255,255,.015)" stroke="rgba(255,255,255,.06)" strokeWidth="0.3" />
        {/* routes */}
        {routes.map((r, i) => {
          const a = D.factories.find(f => f.id === r.from);
          const b = r.to;
          if (!a) return null;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={cx('route', r.cool && 'cool', r.dev && 'dev')} />;
        })}
      </svg>
      {/* region labels */}
      {[['ABU DHABI',38,84],['DUBAI',62,30],['SHARJAH',67,22],['AL AIN',78,76],['AL DHAFRA',16,86]].map(([t,x,y]) =>
        <div key={t} className="label" style={{ position:'absolute', left:x+'%', top:y+'%', fontSize:8.5, color:'var(--ink4)', transform:'translate(-50%,-50%)' }}>{t}</div>
      )}
      {/* nodes */}
      {D.factories.map(f => (
        <div key={f.id} className={cx('mapnode', f.type === 'mobile' && 'mob', live && (f.status === 'warn' || f.status === 'crit') && 'live')}
          style={{ left:f.x+'%', top:f.y+'%', color:stateColor[f.status], zIndex: selected === f.id ? 5 : 2 }}
          onClick={() => onPick && onPick(f)}>
          <span className={cx('pin', f.status)} />
          <span className="ring" />
          <span className="mlabel" style={{ color: selected === f.id ? 'var(--accent-2)' : 'var(--ink2)', borderBottom: selected===f.id?'1px solid var(--accent-line)':'none' }}>
            {f.short}{f.type === 'mobile' && ' ◇'}
          </span>
        </div>
      ))}
      {/* legend */}
      <div style={{ position:'absolute', right:12, top:10, display:'flex', gap:12, alignItems:'center', background:'rgba(7,9,13,.72)', padding:'5px 9px', borderRadius:6, border:'1px solid var(--line)' }}>
        <span className="label" style={{ display:'flex', alignItems:'center', gap:5 }}><span className="dot ok" />Running</span>
        <span className="label" style={{ display:'flex', alignItems:'center', gap:5 }}><span className="dot warn" />Watch</span>
        <span className="label" style={{ display:'flex', alignItems:'center', gap:5 }}><span className="dot crit" />Fault</span>
        <span className="label" style={{ display:'flex', alignItems:'center', gap:5 }}>◇ Mobile</span>
      </div>
    </div>
  );
}

Object.assign(window, { cx, fmt, stateColor, Dot, Tag, Bar, Panel, Btn, Num, Ring, Spark, Kpi, Code, Toasts, UAEBoard, EqIcon });
