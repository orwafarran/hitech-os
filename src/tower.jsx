/* ============================================================
   HT-OS — Screen 1 · Executive Control Tower  (window.ScreenTower)
   The hero. Working alert actions, live output, streaming activity.
   ============================================================ */
const STAGE = { design:'Design', approve:'Approvals', production:'Production', install:'Installation', delivery:'Delivery' };
const ICODE = { flask:'QC', doc:'DR', gear:'MX', truck:'TR', clash:'BIM', check:'OK' };

/* one alert card with the four working controls */
function AlertCard({ a, onAct, go }) {
  const done = a.status === 'approved' || a.status === 'resolved';
  return (
    <div className={cx('alert', a.sev, a.status==='escalated' && 'escalated', a.flagged && 'flagged', a.isNew && 'slidein', a.removing && 'removing')}>
      <div className="ico"><Code s={a.sev}>{ICODE[a.icon]}</Code></div>
      <div className="col" style={{ flex:1, gap:7, minWidth:0 }}>
        <div>
          <div className="between" style={{ gap:8 }}>
            <span className="label" style={{ fontSize:8.5, color:stateColor[a.sev] }}>{a.cat}</span>
            <div className="row" style={{ gap:5 }}>
              {a.status==='escalated' && <Tag s="warn">▲ Escalated</Tag>}
              {a.flagged && <Tag s="accent">⚑ Flagged</Tag>}
            </div>
          </div>
          <div className="at" style={{ marginTop:4 }}>{a.text}</div>
        </div>
        {done
          ? <span className="delta up" style={{ fontSize:11 }}>✓ {a.status==='approved' ? 'Approved & signed off' : 'Resolved & closed'} — {a.owner} notified</span>
          : <div className="alert-actions">
              <Btn sm kind="good" onClick={() => onAct(a,'approve')}>Approve</Btn>
              <Btn sm kind="warn" onClick={() => onAct(a,'escalate')}>Escalate</Btn>
              <Btn sm kind="ghost" onClick={() => onAct(a,'flag')}>{a.flagged ? 'Unflag' : 'Flag'}</Btn>
              <Btn sm kind="primary" onClick={() => onAct(a,'resolve')}>Resolve</Btn>
              {a.proj && <Btn sm kind="ghost" onClick={() => go('project', a.proj)}>Open →</Btn>}
            </div>}
      </div>
    </div>
  );
}

function ScreenTower({ live, tick, go, toast, pushActivity, activity, alerts, alertAct, cleared }) {
  const D = window.HTOS;

  // live-nudged output value — creeps toward, but never exceeds, daily capacity
  const [out, setOut] = useState(D.output.today);
  useEffect(() => { if (live && tick > 0) setOut(o => Math.min(D.output.cap - 12, o + Math.round(2 + Math.random() * 7))); }, [tick]);

  const [picked, setPicked] = useState('ICAD2');
  const routes = [
    { from:'ICAD2', to:{ x:48, y:48 } },
    { from:'ALAIN', to:{ x:58, y:46 }, cool:true },
    { from:'KEZAD', to:{ x:56, y:58 } },
    { from:'ICAD2', to:{ x:50, y:56 }, dev:true },   // DN-4470 deviation, in red
  ];

  const outPct = Math.round((out / D.output.cap) * 100);
  const sparkOut = [2780, 2910, 2840, 3010, 2980, 3090, 3041, out];

  const openAlerts = alerts.filter(a => a.status !== 'approved' && a.status !== 'resolved');
  const critOpen = openAlerts.filter(a => a.sev === 'crit').length;

  /* ---------- sub panels ---------- */
  const Health = (
    <Panel title="Company Health" sub="composite index" glow className="col" style={{ minHeight:0 }}>
      <div className="row" style={{ gap:16, alignItems:'center' }}>
        <Ring value={D.health.score} size={120} stroke={9} label={D.health.score} sub="of 100" />
        <div className="col" style={{ flex:1, gap:8 }}>
          {D.health.subs.map(s => (
            <div key={s.k} className="col" style={{ gap:4 }}>
              <div className="between">
                <span className="label" style={{ color:'var(--ink2)' }}>{s.k}</span>
                <span className="mono tnum" style={{ fontSize:12, color:stateColor[s.s] }}>{s.v}</span>
              </div>
              <Bar value={s.v} s={s.s} />
            </div>
          ))}
        </div>
      </div>
      <div className="between" style={{ marginTop:12, paddingTop:11, borderTop:'1px solid var(--line)' }}>
        <span className="label">7-day trend</span>
        <span className="delta up">▲ {D.health.trend} pts · improving</span>
      </div>
    </Panel>
  );

  const Output = (
    <Panel title="Output vs Capacity" sub="today · live" right={live && <span className="label" style={{ color:'var(--accent)' }}>● LIVE</span>}>
      <div className="between" style={{ alignItems:'flex-end' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
          <Num value={out} live={live} className="kpi-val mono" style={{ fontSize:46 }} />
          <span className="kpi-unit">m³ / {fmt(D.output.cap)}</span>
        </div>
        <Spark data={sparkOut} w={120} h={34} />
      </div>
      <div className="col" style={{ gap:6, marginTop:12 }}>
        <Bar value={out} max={D.output.cap} thick s={outPct > 85 ? 'ok' : 'warn'} />
        <div className="between">
          <span className="label">{outPct}% of 3,500 m³ capacity</span>
          <span className="delta up">▲ {fmt(out - D.output.yesterday)} vs yesterday</span>
        </div>
      </div>
      <div className="row" style={{ gap:0, marginTop:13, paddingTop:12, borderTop:'1px solid var(--line)' }}>
        <Kpi label="Month-to-date" value={fmt(D.output.mtd)} unit="m³" size={20} />
        <div style={{ width:1, background:'var(--line)', margin:'0 14px' }} />
        <Kpi label="Lines running" value="38 / 39" size={20} />
        <div style={{ width:1, background:'var(--line)', margin:'0 14px' }} />
        <Kpi label="Plants online" value="10 / 11" size={20} />
      </div>
    </Panel>
  );

  const Finance = (
    <Panel title="Financial Exposure" sub="AED · group"
      right={<Btn sm kind="ghost" onClick={() => { toast('Finance escalation opened', 'AED 47M overdue · 3 clients', 'warn'); pushActivity('Opened finance escalation — <b>AED 47M</b> overdue'); }}>Escalate ↗</Btn>}>
      <div className="between" style={{ alignItems:'flex-end' }}>
        <Kpi label="Live exposure" value={<span>{D.finance.exposure}<span className="kpi-unit"> M</span></span>} size={38} />
        <div className="col" style={{ alignItems:'flex-end', gap:3 }}>
          <span className="label">Backlog</span>
          <span className="mono tnum" style={{ fontSize:18 }}>AED {fmt(D.finance.portfolio)}M</span>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:10, marginTop:13 }}>
        {[['Work in progress', D.finance.wip, 'info'],['Receivables', D.finance.receivables, 'warn'],['Invoiced MTD', D.finance.invoicedMTD, 'ok'],['Overdue >90d', D.finance.overdue, 'crit']].map(([k,v,s]) => (
          <div key={k} className="col" style={{ gap:5, padding:'9px 11px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)' }}>
            <span className="label">{k}</span>
            <span className="mono tnum" style={{ fontSize:17, color:stateColor[s] }}>AED {fmt(v)}M</span>
          </div>
        ))}
      </div>
    </Panel>
  );

  const Factories = (
    <Panel title="Factory Network" sub="11 plants · 7 fixed + 4 mobile" flush right={<Btn kind="ghost" sm onClick={() => go('factory')}>Floor view →</Btn>} className="col" style={{ minHeight:0, overflow:'hidden' }}>
      <div style={{ flex:'none', height:148, minHeight:0, padding:12, paddingBottom:8, display:'flex' }}>
        <UAEBoard live={live} onPick={f => setPicked(f.id)} selected={picked} routes={routes} />
      </div>
      <div style={{ flex:'none', position:'relative', zIndex:3, background:'var(--panel)', borderTop:'1px solid var(--line)', display:'grid', gridAutoFlow:'column', gridAutoColumns:'minmax(128px,1fr)', gap:8, overflowX:'auto', padding:12 }}>
        {D.factories.map(f => (
          <div key={f.id} className={cx('ftile', f.status==='crit' && 'crit', f.status==='warn' && 'warn')} onClick={() => { setPicked(f.id); go('factory'); }}
            style={picked===f.id ? { borderColor:'var(--accent-line)', background:'var(--accent-dim)' } : null}>
            <div className="between"><span className="mono truncate" style={{ fontSize:11, fontWeight:600 }}>{f.short}</span><Dot s={f.status} live={live && f.status!=='ok'} /></div>
            <div className="between" style={{ marginTop:5 }}>
              <span className="mono tnum" style={{ fontSize:18 }}>{f.out}</span>
              <span className="label" style={{ fontSize:8 }}>{f.type==='mobile' ? 'MOBILE' : 'm³'}</span>
            </div>
            <Bar value={f.out} max={f.cap} s={f.status} />
            <div className="between" style={{ marginTop:4 }}>
              <span className="label" style={{ fontSize:8 }}>OEE {f.oee}%</span>
              <span className="label" style={{ fontSize:8 }}>{f.linesRun}/{f.lines} ln</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  const Projects = (
    <Panel title="Active Projects" sub="6 live" flush right={<span className="chip">AED {fmt(D.finance.portfolio)}M total</span>} className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1 }}>
        {D.projects.map(p => (
          <div key={p.id} className="lrow" onClick={() => go('project', p.id)}>
            <Dot s={p.risk} live={live && p.risk!=='ok'} />
            <div className="col" style={{ flex:1, gap:4, minWidth:0 }}>
              <div className="between">
                <span style={{ fontSize:13, fontWeight:600 }} className="truncate">{p.name}</span>
                <span className="mono tnum" style={{ fontSize:12, color:'var(--ink2)' }}>{p.pct}%</span>
              </div>
              <Bar value={p.pct} s={p.risk==='crit' ? 'crit' : p.risk==='warn' ? 'warn' : 'ok'} />
              <div className="between">
                <span className="label" style={{ fontSize:8.5 }}>{p.client}</span>
                <span className="label" style={{ fontSize:8.5 }}>{STAGE[p.stage]} · AED {p.value}M</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  const Alerts = (
    <Panel title="Critical Alerts" sub={openAlerts.length + ' open'} flush
      right={<div className="row" style={{ gap:7, alignItems:'center' }}>
        {live && <span className="label" style={{ color:'var(--accent)', fontSize:8.5 }}>● monitoring</span>}
        <Tag s="crit">{critOpen} critical</Tag>
      </div>} className="col" style={{ minHeight:0 }} glowCrit={critOpen > 0}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {openAlerts.length === 0 &&
          <div className="col" style={{ alignItems:'center', justifyContent:'center', padding:'30px 0', gap:8 }}>
            <span className="dot ok live" style={{ width:14, height:14 }} /><span className="label">All clear — queue resolved</span>
            <span className="label" style={{ fontSize:8.5, color:'var(--ink4)' }}>{cleared} actioned today · auto-triage on</span>
          </div>}
        {alerts.map(a => <AlertCard key={a.id} a={a} onAct={alertAct} go={go} />)}
      </div>
      <div className="between" style={{ padding:'9px 14px', borderTop:'1px solid var(--line)' }}>
        <span className="label" style={{ fontSize:8.5, color:'var(--green)' }}>✓ {cleared} cleared today</span>
        <span className="label" style={{ fontSize:8.5, color:'var(--ink4)' }}>auto-triage · routing on</span>
      </div>
    </Panel>
  );

  const Briefing = (
    <Panel title="Executive Morning Briefing" sub={D.briefing.date} className="col" style={{ minHeight:0 }}>
      <div className="col" style={{ gap:9 }}>
        {D.briefing.lines.map((l,i) => (
          <div key={i} className="row" style={{ gap:9, alignItems:'flex-start' }}>
            <span className={cx('dot', l.s)} style={{ marginTop:5 }} />
            <span style={{ fontSize:12.5, lineHeight:1.4, color:'var(--ink)' }}>{l.t}</span>
          </div>
        ))}
      </div>
      <div className="row" style={{ gap:8, marginTop:13, paddingTop:12, borderTop:'1px solid var(--line)' }}>
        <Btn kind="primary" sm onClick={() => go('trust')}>Review delivery proofs</Btn>
        <Btn sm kind="ghost" onClick={() => { toast('Morning brief re-sent', 'Delivered to 7 recipients', 'good'); pushActivity('Re-sent morning brief to <b>7 recipients</b>'); }}>Re-send brief</Btn>
      </div>

      {/* live activity feed */}
      <div className="col" style={{ marginTop:13, paddingTop:12, borderTop:'1px solid var(--line)', minHeight:0 }}>
        <div className="between" style={{ marginBottom:6 }}>
          <span className="label">Live Activity</span>
          <span className="label" style={{ fontSize:8.5, color: live ? 'var(--accent)' : 'var(--ink4)' }}>{live ? '● streaming' : '❙❙ paused'}</span>
        </div>
        <div className="scrolly" style={{ maxHeight:150 }}>
          {activity.map((e,i) => (
            <div key={e.id} className={cx('act', i===0 && e.isNew && 'slidein')}>
              <span className="atime">{e.t}</span>
              <span className="atext" dangerouslySetInnerHTML={{ __html:e.html }} />
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );

  return (
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'minmax(0,1.55fr) 380px', gridTemplateRows:'auto minmax(280px,1fr) auto', gap:14, gridTemplateAreas:'"kpis alerts" "fac alerts" "proj brief"' }}>
      <div style={{ gridArea:'kpis', display:'grid', gridTemplateColumns:'320px 1fr 1fr', gap:14 }}>
        {Health}{Output}{Finance}
      </div>
      <div style={{ gridArea:'fac', minHeight:0, display:'grid' }}>{Factories}</div>
      <div style={{ gridArea:'alerts', minHeight:0, display:'grid' }}>{Alerts}</div>
      <div style={{ gridArea:'proj', minHeight:0, display:'grid' }}>{Projects}</div>
      <div style={{ gridArea:'brief', minHeight:0, display:'grid' }}>{Briefing}</div>
    </div>
  );
}

window.ScreenTower = ScreenTower;
