/* ============================================================
   HT-OS — Screen 10 · Fleet & Suppliers  (window.ScreenFleet)
   External plant: trailers, cranes, pickups — by site, active now,
   by supplier. Live convoy animation.
   ============================================================ */
function ScreenFleet({ live, tick, go, toast, pushActivity }) {
  const D = window.HTOS;
  const projName = (id) => (D.projects.find(p => p.id === id) || D.factories.find(f => f.id === id) || {}).short || (D.projects.find(p => p.id === id) || {}).name || id;

  const [types, setTypes] = useState(() => D.fleetTypes.map(t => ({ ...t })));
  const [alerts, setAlerts] = useState(() => D.fleetAlerts.map(a => ({ ...a, status:'open' })));
  const incRef = useRef(0);
  const lastTick = useRef(0);

  // live: units go active / return; a predictive alert can auto-surface
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    setTypes(ts => ts.map(t => {
      const lo = Math.round(t.total * 0.4), hi = t.total - t.maint;
      const next = Math.max(lo, Math.min(hi, t.active + Math.round((Math.random() - 0.5) * 3)));
      return { ...t, active: next, idle: t.total - next - t.maint };
    }));
    if (tick % 8 === 0 && incRef.current < D.fleetIncoming.length) {
      const a = D.fleetIncoming[incRef.current++];
      setAlerts(list => [{ ...a, status:'open', isNew:true }, ...list]);
      toast('Predictive flag', `${projName(a.site)} · ${a.cat.toLowerCase()}`, 'warn');
      pushActivity(`Fleet predictive flag — <b>${projName(a.site)}</b>`);
    }
  }, [tick, live]);

  const totalUnits = types.reduce((a,t) => a + t.total, 0);
  const activeNow  = types.reduce((a,t) => a + t.active, 0);
  const util       = Math.round(activeNow / totalUnits * 100);
  const spendDay   = types.reduce((a,t) => a + t.active * t.rate, 0); // AED/day
  const inTransit  = D.fleetSites.reduce((a,s) => a + s.transit, 0);
  const TYPE_ICON  = { trailer:'truck', crane:'crane', pickup:'pickup', telehandler:'fork', pump:'pump', lowbed:'truck' };

  const resolveAlert = (a) => {
    setAlerts(list => list.map(x => x.id === a.id ? { ...x, status:'resolved' } : x));
    setTimeout(() => { setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x)); setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520); }, 800);
  };
  const alertAct = (a, kind) => {
    if (kind === 'escalate') {
      setAlerts(list => { const t = list.find(x => x.id === a.id); if (!t) return list; return [{ ...t, status:'escalated' }, ...list.filter(x => x.id !== a.id)]; });
      toast('Escalated', `Routed to ${a.owner}`, 'warn'); pushActivity(`Escalated <b>${a.id}</b> to ${a.owner}`);
    } else if (kind === 'primary') {
      const extra = a.primary.label === 'Off-hire' ? 'AED 28.5k/day saved' : a.id + ' · actioned';
      toast(a.primary.label, extra, a.primary.kind === 'good' ? 'good' : 'accent');
      pushActivity(`${a.primary.label} — <b>${a.id}</b>`); resolveAlert(a);
    } else {
      toast('Resolved & closed', `${a.id} closed`, 'good'); pushActivity(`Resolved <b>${a.id}</b> — fleet`);
      setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x));
      setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520);
    }
  };

  const openAlerts = alerts.filter(a => a.status !== 'resolved');
  const critOpen = openAlerts.filter(a => a.sev === 'crit').length;

  /* ---------- panels ---------- */
  const Kpis = (
    <Panel title="Fleet & Suppliers" sub="external plant · live" glow right={live && <span className="label" style={{ color:'var(--accent)' }}>● LIVE</span>}>
      <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
        <Kpi label="Units on hire" value={<Num value={totalUnits} />} size={28} delta="6 categories" deltaDir="flat" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Active now" value={<span style={{ color:'var(--green)' }}><Num value={activeNow} live={live} /></span>} size={28} delta={'● ' + inTransit + ' in transit'} />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Utilisation" value={<span style={{ color: util < 60 ? 'var(--amber)' : 'var(--accent)' }}>{util}%</span>} size={28} delta="of hired fleet" deltaDir="flat" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="External spend" value={<span>AED {Math.round(spendDay/1000)}<span className="kpi-unit"> k/day</span></span>} size={28} delta="hire cost" deltaDir="flat" />
      </div>
      <div className="col" style={{ gap:5, marginTop:13, paddingTop:12, borderTop:'1px solid var(--line)' }}>
        <div className="between"><span className="label">Live movement · factory ⇄ site</span><span className="label" style={{ color: live ? 'var(--accent)' : 'var(--ink4)', fontSize:8.5 }}>{live ? '● rolling' : '❙❙ paused'}</span></div>
        <div className="convoy">
          <div className="road" />
          <span className="rig" style={{ animationDuration:'7s' }}><EqIcon type="truck" size={13} /></span>
          <span className="rig" style={{ animationDuration:'11s', animationDelay:'-4s', color:'var(--ink3)' }}><EqIcon type="pickup" size={12} /></span>
          <span className="rig" style={{ animationDuration:'9s', animationDelay:'-6s' }}><EqIcon type="truck" size={12} /></span>
          <span className="rig" style={{ animationDuration:'13s', animationDelay:'-3s', color:'var(--ink3)' }}><EqIcon type="crane" size={14} /></span>
        </div>
      </div>
    </Panel>
  );

  const Equipment = (
    <Panel title="Equipment by Category" sub={totalUnits + ' units · external'} flush className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {types.map(t => (
          <div key={t.id} className="eqtile">
            <span className="eqbadge"><EqIcon type={TYPE_ICON[t.id]} size={18} /></span>
            <div className="col" style={{ flex:1, gap:5, minWidth:0 }}>
              <div className="between" style={{ gap:8 }}>
                <span className="truncate" style={{ fontSize:12.5, fontWeight:600 }}>{t.name}</span>
                <span className="mono tnum" style={{ fontSize:13 }}><span style={{ color:'var(--green)' }}>{t.active}</span><span style={{ color:'var(--ink4)' }}> / {t.total}</span></span>
              </div>
              <Bar value={t.active} max={t.total} s="ok" />
              <div className="between">
                <span className="label" style={{ fontSize:8 }}>{t.supplier}</span>
                <span className="label" style={{ fontSize:8 }}>
                  <span style={{ color:'var(--ink3)' }}>{t.idle} idle</span>{t.maint > 0 && <span style={{ color:'var(--amber)' }}> · {t.maint} maint</span>}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  const Deploy = (
    <Panel title="Deployment by Site" sub="who's using what" flush className="col" style={{ minHeight:0 }}
      right={<Btn kind="ghost" sm onClick={() => go('tower')}>Map →</Btn>}>
      <div className="scrolly" style={{ flex:1 }}>
        {D.fleetSites.map(s => {
          const tot = s.trailers + s.cranes + s.pickups;
          const cell = (icon, n, c) => (
            <div className="row" style={{ gap:5, alignItems:'center' }} title={n + ' ' + icon}>
              <span style={{ color: c || 'var(--ink3)' }}><EqIcon type={icon} size={13} /></span>
              <span className="mono tnum" style={{ fontSize:12 }}>{n}</span>
            </div>
          );
          return (
            <div key={s.id} className="lrow" style={{ alignItems:'center', gap:12 }} onClick={() => { go('project', s.id); }} title="Open site →">
              <div className="col" style={{ flex:1, gap:3, minWidth:0 }}>
                <span className="truncate" style={{ fontSize:12.5, fontWeight:600 }}>{projName(s.id)}</span>
                <span className="label" style={{ fontSize:8 }}>{tot} units{s.transit > 0 && <span style={{ color:'var(--accent)' }}> · {s.transit} inbound</span>}</span>
              </div>
              <div className="row" style={{ gap:14, alignItems:'center' }}>
                {cell('truck', s.trailers)}
                {cell('crane', s.cranes, s.cranes >= 5 ? 'var(--amber)' : 'var(--ink3)')}
                {cell('pickup', s.pickups)}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  const Suppliers = (
    <Panel title="External Suppliers" sub={D.fleetSuppliers.length + ' on contract'} flush className="col" style={{ minHeight:0 }}
      right={<span className="chip">AED {Math.round(spendDay/1000)}k / day</span>}>
      <div className="scrolly" style={{ flex:1 }}>
        {D.fleetSuppliers.map(s => (
          <div key={s.id} className="lrow" style={{ alignItems:'center', gap:11 }} onClick={() => toast(s.name, `${s.active}/${s.units} active · AED ${s.spend}k/day`, s.s === 'warn' ? 'warn' : 'good')}>
            <Dot s={s.s} live={live && s.s !== 'ok'} />
            <div className="col" style={{ flex:1, gap:2, minWidth:0 }}>
              <span className="truncate" style={{ fontSize:12.5, fontWeight:600 }}>{s.name}</span>
              <span className="label" style={{ fontSize:8 }}>{s.cat}</span>
            </div>
            <div className="col" style={{ alignItems:'flex-end', gap:2 }}>
              <span className="mono tnum" style={{ fontSize:12 }}><span style={{ color:'var(--green)' }}>{s.active}</span><span style={{ color:'var(--ink4)' }}>/{s.units}</span></span>
              <span className="label" style={{ fontSize:8 }}>AED {s.spend}k/d</span>
            </div>
            {s.s === 'warn'
              ? <Btn sm kind="warn" onClick={(e) => { e.stopPropagation(); toast('Rate review opened', `${s.name} · framework variance`, 'warn'); pushActivity(`Opened rate review — <b>${s.name}</b>`); }}>Review</Btn>
              : <Btn sm kind="ghost" onClick={(e) => { e.stopPropagation(); toast('Hire extended', `${s.name} · +30 days`, 'good'); pushActivity(`Extended hire — <b>${s.name}</b>`); }}>Extend</Btn>}
          </div>
        ))}
      </div>
    </Panel>
  );

  const Alerts = (
    <Panel title="Fleet Alerts" sub={openAlerts.length + ' open'} flush glowCrit={critOpen > 0}
      right={<div className="row" style={{ gap:7, alignItems:'center' }}>{live && <span className="label" style={{ color:'var(--accent)', fontSize:8.5 }}>● tracking</span>}<Tag s="crit">{critOpen} critical</Tag></div>}
      className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {openAlerts.length === 0 &&
          <div className="col" style={{ alignItems:'center', justifyContent:'center', padding:'30px 0', gap:8 }}>
            <span className="dot ok" style={{ width:14, height:14 }} /><span className="label">All clear — fleet optimal</span></div>}
        {alerts.map(a => {
          const done = a.status === 'resolved';
          return (
            <div key={a.id} className={cx('alert', a.sev, a.status==='escalated' && 'escalated', a.isNew && 'slidein', a.removing && 'removing')}>
              <div className="ico"><Code s={a.sev}>{a.cat.slice(0,3)}</Code></div>
              <div className="col" style={{ flex:1, gap:7, minWidth:0 }}>
                <div>
                  <div className="between" style={{ gap:8 }}>
                    <span className="label" style={{ fontSize:8.5, color:stateColor[a.sev] }}>{a.cat}{a.site ? ' · ' + projName(a.site) : ''}</span>
                    {a.status==='escalated' && <Tag s="warn">▲ Escalated</Tag>}
                  </div>
                  <div className="at" style={{ marginTop:4 }}>{a.text}</div>
                </div>
                {done
                  ? <span className="delta up" style={{ fontSize:11 }}>✓ Actioned — {a.owner} notified</span>
                  : <div className="alert-actions">
                      <Btn sm kind={a.primary.kind} onClick={() => alertAct(a,'primary')}>{a.primary.label}</Btn>
                      <Btn sm kind="warn" onClick={() => alertAct(a,'escalate')}>Escalate</Btn>
                      <Btn sm kind="ghost" onClick={() => alertAct(a,'resolve')}>Resolve</Btn>
                    </div>}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  return (
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'minmax(0,1.05fr) minmax(0,0.95fr) 360px', gridTemplateRows:'auto minmax(0,1fr) minmax(0,1fr)', gap:14, gridTemplateAreas:'"kpis kpis kpis" "equipment deploy alerts" "equipment suppliers alerts"' }}>
      <div style={{ gridArea:'kpis' }}>{Kpis}</div>
      <div style={{ gridArea:'equipment', minHeight:0, display:'grid' }}>{Equipment}</div>
      <div style={{ gridArea:'deploy', minHeight:0, display:'grid' }}>{Deploy}</div>
      <div style={{ gridArea:'suppliers', minHeight:0, display:'grid' }}>{Suppliers}</div>
      <div style={{ gridArea:'alerts', minHeight:0, display:'grid' }}>{Alerts}</div>
    </div>
  );
}
window.ScreenFleet = ScreenFleet;
