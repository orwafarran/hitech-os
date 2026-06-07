/* ============================================================
   HT-OS — Screen 3 · Production Floor  (window.ScreenFactory)
   Lines, element "passport", predictive maintenance & QC flags.
   ============================================================ */
function ScreenFactory({ live, tick, go, toast, pushActivity }) {
  const D = window.HTOS;
  const P = D.passport;
  const stages = D.passportStages;

  const [loads, setLoads] = useState(D.lines.map(l => l.load));
  const baseOut = D.lines.reduce((a,l) => a + l.out, 0);
  const [tout, setTout] = useState(baseOut);
  useEffect(() => {
    if (!live || tick === 0) return;
    setLoads(ls => ls.map((v,i) => D.lines[i].status === 'idle' ? v : Math.max(40, Math.min(99, v + Math.round((Math.random()-0.45)*6)))));
    setTout(o => Math.min(baseOut + 150, o + Math.round(2 + Math.random()*7)));
  }, [tick]);

  // maintenance / QC action state
  const [disp, setDisp] = useState({});
  const [quar, setQuar] = useState(false);
  const dispatch = (m) => {
    setDisp(d => ({ ...d, [m.id]:true }));
    toast('Technician dispatched', `${(D.factories.find(f=>f.id===m.fac)||{}).short} · ETA 40 min`, m.sev==='crit' ? 'crit' : 'warn');
    pushActivity(`Dispatched technician — <b>${(D.factories.find(f=>f.id===m.fac)||{}).short}</b>`);
  };

  // element passport — advances a stage when QC is approved
  const [cur, setCur] = useState(P.current);
  const [events, setEvents] = useState(P.events);
  const [qcDone, setQcDone] = useState(false);
  const approveQc = () => {
    if (qcDone) return;
    setQcDone(true);
    setCur(c => c + 1);
    setEvents(ev => [ ...ev.map(e => ({ ...e, active:false })), { stage:'Stored', t:hhmm()+' today', who:'QC approved · cleared to bay', hash:'b8c1' } ]);
    toast('QC approved', `${P.id} cleared to Stored`, 'good');
    pushActivity(`Approved QC — <b>${P.id}</b> cleared to Stored`);
  };

  return (
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 360px', gridTemplateRows:'auto auto 1fr', gap:14 }}>

      {/* header KPIs */}
      <div style={{ gridColumn:'1 / -1' }}>
        <Panel>
          <div className="between" style={{ alignItems:'center' }}>
            <div className="col" style={{ gap:8 }}>
              <div className="row" style={{ gap:10, alignItems:'center' }}>
                <Btn kind="ghost" sm onClick={() => go('tower')}>← Tower</Btn>
                <span style={{ fontSize:22, fontWeight:600 }}>ICAD II — Mussafah</span>
                <Tag s="ok"><span className="dot ok live" />Running</Tag>
              </div>
              <span className="label">Flagship plant · 6 lines · hollowcore + façade + structural</span>
            </div>
            <div className="row" style={{ gap:24 }}>
              <Kpi label="Output today" value={<Num value={tout} live={live} />} unit="m³" size={26} />
              <Kpi label="Lines running" value="5 / 6" size={26} />
              <Kpi label="Plant OEE" value="91%" size={26} />
              <Kpi label="QC pass rate" value={<span style={{ color:'var(--accent)' }}>96.4%</span>} size={26} />
            </div>
          </div>
        </Panel>
      </div>

      {/* production lines */}
      <div style={{ gridColumn:'1 / 2' }}>
        <Panel title="Production Lines" sub="live load" right={live && <span className="label" style={{ color:'var(--accent)' }}>● LIVE</span>}>
          <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:11 }}>
            {D.lines.map((l,i) => (
              <div key={l.id} className={cx('ftile', l.status==='warn' && 'warn')} style={{ padding:'12px 13px', display:'flex', flexDirection:'column', gap:9 }}
                onClick={() => toast(l.name, `${loads[i]}% load · ${l.el!=='—' ? 'casting '+l.el : 'idle — '+(l.flag||'')}`, l.status==='warn' ? 'warn' : l.status==='idle' ? 'accent' : 'good')}>
                <div className="between" style={{ gap:8 }}>
                  <span className="mono truncate" style={{ fontSize:12, fontWeight:600 }}>{l.name}</span>
                  <Dot s={l.status} live={live && l.status==='warn'} />
                </div>
                <div className="between" style={{ alignItems:'flex-end', gap:8 }}>
                  <div className="col" style={{ gap:2 }}>
                    <span className="label" style={{ fontSize:8 }}>Line load</span>
                    <span className="mono tnum" style={{ fontSize:20, lineHeight:1, color: l.status==='idle' ? 'var(--ink3)' : 'var(--ink)' }}>{loads[i]}%</span>
                  </div>
                  <div className="col" style={{ alignItems:'flex-end', gap:2, minWidth:0 }}>
                    <span className="label" style={{ fontSize:8 }}>{l.out} m³</span>
                    <span className="mono truncate" style={{ fontSize:10, color:'var(--ink3)', maxWidth:96 }}>{l.el}</span>
                  </div>
                </div>
                <Bar value={loads[i]} s={l.status==='warn' ? 'warn' : l.status==='idle' ? '' : 'ok'} thick />
                {l.flag && <div className="row" style={{ gap:6, alignItems:'center' }}>
                  <span className={cx('dot', l.status==='idle' ? 'idle' : 'warn')} style={{ flex:'none' }} />
                  <span className="label truncate" style={{ fontSize:8.5, color: l.status==='idle' ? 'var(--ink3)' : 'var(--amber)' }}>{l.flag}</span>
                </div>}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* predictive maintenance + QC */}
      <div style={{ gridColumn:'2 / 3', gridRow:'2 / 4', minHeight:0, display:'grid' }}>
        <Panel title="Predictive & Quality Flags" sub="auto-detected" flush className="col" style={{ minHeight:0 }}>
          <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:10 }}>
            <span className="label" style={{ color:'var(--ink3)' }}>Predictive Maintenance</span>
            {D.maintenance.map((m) => (
              <div key={m.id} className={cx('alert', m.sev)}>
                <div className="ico"><Code s={m.sev}>MX</Code></div>
                <div className="col" style={{ gap:4, flex:1 }}>
                  <span style={{ fontSize:12.5 }}>{m.t}</span>
                  <div className="between">
                    <span className="label" style={{ fontSize:8.5 }}>{(D.factories.find(f=>f.id===m.fac)||{}).short}</span>
                    <span className="mono" style={{ fontSize:10, color:stateColor[m.sev] }}>fail in {m.risk}</span>
                  </div>
                  <div className="row" style={{ gap:6, marginTop:2 }}>
                    {disp[m.id]
                      ? <Btn sm kind="good" disabled>✓ Tech dispatched</Btn>
                      : <Btn sm kind={m.sev==='crit' ? 'danger' : 'warn'} onClick={() => dispatch(m)}>Dispatch tech</Btn>}
                    <Btn sm kind="ghost" onClick={() => { toast('Maintenance scheduled', `${m.t} · next window`, 'accent'); pushActivity(`Scheduled maintenance — <b>${(D.factories.find(f=>f.id===m.fac)||{}).short}</b>`); }}>Schedule</Btn>
                  </div>
                </div>
              </div>
            ))}
            <span className="label" style={{ color:'var(--ink3)', marginTop:4 }}>Quality Control</span>
            <div className="alert warn">
              <div className="ico"><Code s="warn">QC</Code></div>
              <div className="col" style={{ gap:4, flex:1 }}>
                <span style={{ fontSize:12.5 }}>Line 2 façade — strength variance trending up</span>
                <span className="label" style={{ fontSize:8.5 }}>Last 6 pours within tolerance · monitor</span>
              </div>
            </div>
            <div className="alert crit">
              <div className="ico"><Code s="crit">QC</Code></div>
              <div className="col" style={{ gap:4, flex:1 }}>
                <span style={{ fontSize:12.5 }}>YA-FP-117 quarantined — 28-day fail</span>
                <div className="row" style={{ gap:6, marginTop:2 }}>
                  {quar
                    ? <Btn sm kind="good" disabled>✓ Quarantined</Btn>
                    : <Btn sm kind="danger" onClick={() => { setQuar(true); toast('Batch quarantined', 'YA-FP-117 · re-cast scheduled', 'crit'); pushActivity('Quarantined <b>YA-FP-117</b> — re-cast scheduled'); }}>Quarantine</Btn>}
                  <Btn sm kind="ghost" onClick={() => go('project','YAS')}>Project →</Btn>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* element passport */}
      <div style={{ gridColumn:'1 / 2', minHeight:0, display:'grid' }}>
        <Panel title="Element Passport" sub={P.id} glow
          right={<span className="chip">{P.type}</span>} className="col" style={{ minHeight:0 }}>
          <div className="scrolly" style={{ flex:1 }}>
            {/* passport stages */}
            <div className="chain" style={{ marginTop:4, marginBottom:16 }}>
              {stages.map((s,i) => (
                <div key={s} className={cx('node', i<cur && 'done', i===cur && 'active')}>
                  {i>0 && <span className="link" />}
                  <span className="knob" style={{ width:26, height:26, fontSize:10 }}>{i<cur ? '✓' : i+1}</span>
                  <span className="clabel" style={{ fontSize:8.5 }}>{s}</span>
                </div>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
              {[['Project',P.project],['Plant',P.plant],['Weight',P.weight],['Mould',P.mould]].map(([k,v]) => (
                <div key={k} className="col" style={{ gap:3, padding:'8px 10px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)' }}>
                  <span className="label" style={{ fontSize:8 }}>{k}</span><span className="mono" style={{ fontSize:12 }}>{v}</span>
                </div>
              ))}
            </div>
            {/* event log */}
            <span className="label" style={{ color:'var(--ink3)' }}>Signed event trail</span>
            <div className="col" style={{ gap:0, marginTop:8 }}>
              {events.map((e,i) => (
                <div key={i} className={cx('between', i===events.length-1 && qcDone && 'flash-good')} style={{ padding:'9px 0', borderBottom:'1px solid var(--line)' }}>
                  <div className="row" style={{ gap:10, alignItems:'center' }}>
                    <span className={cx('dot', e.active ? 'warn' : 'ok')} />
                    <div className="col" style={{ gap:2 }}>
                      <span className="mono" style={{ fontSize:12, fontWeight:600 }}>{e.stage}</span>
                      <span className="label" style={{ fontSize:8.5 }}>{e.who}</span>
                    </div>
                  </div>
                  <div className="col" style={{ alignItems:'flex-end', gap:2 }}>
                    <span className="mono" style={{ fontSize:10, color:'var(--ink3)' }}>{e.t}</span>
                    <span className="hashline hash-ok" style={{ fontSize:9 }}>#{e.hash}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="row" style={{ gap:8, marginTop:12 }}>
              {qcDone
                ? <Btn kind="good" sm disabled>✓ QC approved</Btn>
                : <Btn kind="good" sm onClick={approveQc}>Approve QC</Btn>}
              <Btn kind="ghost" sm onClick={() => go('trust')}>View delivery proof →</Btn>
            </div>
          </div>
        </Panel>
      </div>

    </div>
  );
}
window.ScreenFactory = ScreenFactory;
