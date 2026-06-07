/* ============================================================
   HT-OS — Screen 9 · People & HR  (window.ScreenPeople)
   Workforce, deployment by site, HSE/safety, compliance.
   ============================================================ */
function ScreenPeople({ live, tick, go, toast, pushActivity }) {
  const D = window.HTOS;
  const total = D.peopleStats.total;

  const [present, setPresent] = useState(Math.round(total * 0.93));
  const [compliance, setCompliance] = useState(() => D.compliance.map(c => ({ ...c })));
  const [alerts, setAlerts] = useState(() => D.peopleAlerts.map(a => ({ ...a, status:'open' })));
  const [tab, setTab] = useState('safety');
  const incRef = useRef(0);
  const lastTick = useRef(0);

  // live: people clock in through the morning; a staffing alert can auto-surface
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    setPresent(p => Math.min(Math.round(total * 0.965), p + Math.round(8 + Math.random() * 22)));
    if (tick % 8 === 0 && incRef.current < D.peopleIncoming.length) {
      const a = D.peopleIncoming[incRef.current++];
      setAlerts(list => [{ ...a, status:'open', isNew:true }, ...list]);
      toast('Attendance alert', `${a.site} · auto-flagged`, 'warn');
      pushActivity(`Attendance dip auto-flagged — <b>${a.site}</b>`);
    }
  }, [tick, live]);

  const attendance = Math.round(present / total * 100);
  const fnMax = Math.max(...D.workforceFn.map(f => f.n));

  const renew = (c) => {
    setCompliance(list => list.map(x => x.id === c.id ? { ...x, removing:true } : x));
    setTimeout(() => setCompliance(list => list.filter(x => x.id !== c.id)), 520);
    toast('Renewal filed', `${c.type} · ${c.who} submitted to PRO`, 'good');
    pushActivity(`Filed renewal — <b>${c.type}</b> (${c.who})`);
  };
  const escalateC = (c) => { toast('Escalated', `${c.type} · ${c.days}d to expiry`, 'warn'); pushActivity(`Escalated compliance — <b>${c.type}</b>`); };

  const resolveAlert = (a) => {
    setAlerts(list => list.map(x => x.id === a.id ? { ...x, status:'resolved' } : x));
    setTimeout(() => { setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x)); setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520); }, 800);
  };
  const alertAct = (a, kind) => {
    if (kind === 'escalate' || (kind === 'primary' && a.primary.label === 'Escalate')) {
      setAlerts(list => { const t = list.find(x => x.id === a.id); if (!t) return list; return [{ ...t, status:'escalated' }, ...list.filter(x => x.id !== a.id)]; });
      toast('Escalated', `Routed to ${a.owner}`, 'warn'); pushActivity(`Escalated <b>${a.id}</b> to ${a.owner}`);
    } else if (kind === 'primary') {
      toast(a.primary.label, `${a.id} · actioned`, a.primary.kind === 'good' ? 'good' : 'accent');
      pushActivity(`${a.primary.label} — <b>${a.id}</b>`); resolveAlert(a);
    } else {
      toast('Resolved & closed', `${a.id} closed`, 'good'); pushActivity(`Resolved <b>${a.id}</b> — HR`);
      setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x));
      setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520);
    }
  };

  const openAlerts = alerts.filter(a => a.status !== 'resolved');
  const critOpen = openAlerts.filter(a => a.sev === 'crit').length;

  /* ---------- panels ---------- */
  const Kpis = (
    <Panel title="People & HR" sub="workforce · live" glow right={live && <span className="label" style={{ color:'var(--accent)' }}>● LIVE</span>}>
      <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
        <Kpi label="Total workforce" value={<Num value={total} />} size={28} delta={'▲ ' + D.peopleStats.openRoles + ' roles open'} deltaDir="flat" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Present today" value={<Num value={present} live={live} />} size={28} delta="▲ clocking in" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Attendance" value={<span style={{ color: attendance < 90 ? 'var(--amber)' : 'var(--green)' }}>{attendance}%</span>} size={28} delta="of deployed" deltaDir="flat" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Days without LTI" value={<span style={{ color:'var(--accent)' }}>{D.hse.daysNoLTI}</span>} size={28} delta="safety 96 / 100" />
      </div>
    </Panel>
  );

  const Workforce = (
    <Panel title="Workforce by Function" sub={fmt(total) + ' total'} className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
        {D.workforceFn.map(f => (
          <div key={f.k} className="col" style={{ gap:6 }}>
            <div className="between">
              <span className="label" style={{ color:'var(--ink2)' }}>{f.k}</span>
              <span className="mono tnum" style={{ fontSize:13 }}>{fmt(f.n)}</span>
            </div>
            <Bar value={f.n} max={fnMax} thick s="" />
          </div>
        ))}
      </div>
      <div className="between" style={{ marginTop:11, paddingTop:11, borderTop:'1px solid var(--line)' }}>
        <span className="label">Group · Trojan Construction</span>
        <span className="delta up">▲ {D.peopleStats.openRoles} open positions</span>
      </div>
    </Panel>
  );

  const Compliance = (
    <Panel title="Compliance · Expiring" sub={compliance.filter(c=>c.s==='crit').length + ' urgent'} flush className="col" style={{ minHeight:0 }}
      glowCrit={compliance.some(c => c.s === 'crit')}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {compliance.map(c => (
          <div key={c.id} className={cx('col', c.removing && 'removing')} style={{ gap:6, padding:'10px 11px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)', boxShadow: c.s==='crit' ? 'inset 0 0 0 1px var(--red-line)' : c.s==='warn' ? 'inset 0 0 0 1px var(--amber-line)' : 'none' }}>
            <div className="between" style={{ gap:8 }}>
              <div className="row" style={{ gap:8, alignItems:'center', minWidth:0 }}>
                <Dot s={c.s} live={live && c.s==='crit'} />
                <span className="truncate" style={{ fontSize:12, fontWeight:600 }}>{c.type}</span>
              </div>
              <span className="mono tnum" style={{ fontSize:11, color: c.s==='crit' ? 'var(--red)' : c.s==='warn' ? 'var(--amber)' : 'var(--ink2)' }}>{c.days}d</span>
            </div>
            <span className="label" style={{ fontSize:8.5 }}>{c.who}</span>
            <div className="row" style={{ gap:6 }}>
              <Btn sm kind={c.s==='crit' ? 'primary' : 'ghost'} onClick={() => renew(c)}>Renew</Btn>
              <Btn sm kind="ghost" onClick={() => escalateC(c)}>Escalate</Btn>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  const Deployment = (
    <Panel title="Deployment by Location" sub={D.deployment.length + ' sites'} flush className="col" style={{ minHeight:0 }}
      right={<Btn kind="ghost" sm onClick={() => go('factory')}>Floor →</Btn>}>
      <div className="scrolly" style={{ flex:1 }}>
        {D.deployment.map(d => {
          const att = Math.round(d.present / d.head * 100);
          const s = att < 85 ? 'warn' : 'ok';
          return (
            <div key={d.id} className="lrow" style={{ alignItems:'center', gap:11 }} onClick={() => toast(d.site, `${fmt(d.present)} / ${fmt(d.head)} present · ${att}% attendance`, s==='warn' ? 'warn' : 'good')}>
              <Dot s={s} live={live && s==='warn'} />
              <div className="col" style={{ flex:1, gap:4, minWidth:0 }}>
                <div className="between">
                  <span className="truncate" style={{ fontSize:12.5, fontWeight:600 }}>{d.site}</span>
                  <span className="mono tnum" style={{ fontSize:11, color:'var(--ink2)' }}>{fmt(d.present)}/{fmt(d.head)}</span>
                </div>
                <Bar value={d.present} max={d.head} s={s} />
              </div>
              <span className="mono tnum" style={{ fontSize:12, color: s==='warn' ? 'var(--amber)' : 'var(--ink2)', width:34, textAlign:'right' }}>{att}%</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  const HSE = (
    <Panel title={tab === 'safety' ? 'HSE · Safety' : 'Attendance · Today'} sub={tab === 'safety' ? 'site-wide' : 'live'} flush className="col" style={{ minHeight:0 }}
      right={<div className="seg">
        <button className={tab==='safety' ? 'on' : ''} onClick={() => setTab('safety')}>Safety</button>
        <button className={tab==='attend' ? 'on' : ''} onClick={() => setTab('attend')}>Attendance</button>
      </div>}>
      <div className="scrolly" style={{ flex:1, padding:12 }}>
        {tab === 'safety'
          ? <div className="col" style={{ gap:12 }}>
              <div className="between" style={{ alignItems:'flex-end' }}>
                <Kpi label="Days without LTI" value={<span style={{ color:'var(--green)' }}>{D.hse.daysNoLTI}</span>} size={34} />
                <div className="col" style={{ alignItems:'flex-end', gap:3 }}>
                  <span className="label">Safety score</span>
                  <span className="mono tnum" style={{ fontSize:18, color:'var(--green)' }}>{D.hse.safetyScore}/100</span>
                </div>
              </div>
              <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['Incidents · MTD', D.hse.incidentsMonth, 'warn'],['Near-misses', D.hse.nearMiss, 'info'],['Inductions today', D.hse.inductions, 'ok'],['Toolbox talks', D.hse.toolbox, 'ok']].map(([k,v,s]) => (
                  <div key={k} className="col" style={{ gap:5, padding:'9px 11px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)' }}>
                    <span className="label">{k}</span>
                    <span className="mono tnum" style={{ fontSize:17, color:stateColor[s] }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="row" style={{ gap:8, marginTop:2 }}>
                <Btn sm kind="warn" onClick={() => { toast('Incident acknowledged', 'Al Hamra LTI · investigation assigned', 'warn'); pushActivity('Acknowledged HSE incident — <b>Al Hamra</b>'); }}>Acknowledge incident</Btn>
                <Btn sm kind="ghost" onClick={() => { toast('Toolbox talk scheduled', 'All sites · 06:30 tomorrow', 'accent'); pushActivity('Scheduled toolbox talk — <b>all sites</b>'); }}>Schedule talk</Btn>
              </div>
            </div>
          : <div className="col" style={{ gap:12 }}>
              <div className="col" style={{ gap:7 }}>
                <div className="between"><span className="label">Present</span><span className="mono tnum" style={{ color:'var(--green)' }}><Num value={present} live={live} /></span></div>
                <Bar value={present} max={total} thick s="ok" />
                <div className="between"><span className="label" style={{ fontSize:9 }}>{attendance}% of {fmt(total)} deployed</span><span className="label" style={{ fontSize:9, color:'var(--accent)' }}>● live clock-ins</span></div>
              </div>
              <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['On leave', 214, 'info'],['Absent', total - present - 214, 'warn'],['Night shift', 1180, 'ok'],['Contractors', 640, 'ok']].map(([k,v,s]) => (
                  <div key={k} className="col" style={{ gap:5, padding:'9px 11px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)' }}>
                    <span className="label">{k}</span>
                    <span className="mono tnum" style={{ fontSize:17, color:stateColor[s] }}>{fmt(Math.max(0, v))}</span>
                  </div>
                ))}
              </div>
              <Btn sm kind="good" onClick={() => { toast('Leave approved', '6 requests · cover arranged', 'good'); pushActivity('Approved leave — <b>6 requests</b>'); }}>Approve leave (6)</Btn>
            </div>}
      </div>
    </Panel>
  );

  const Alerts = (
    <Panel title="People Alerts" sub={openAlerts.length + ' open'} flush glowCrit={critOpen > 0}
      right={<div className="row" style={{ gap:7, alignItems:'center' }}>{live && <span className="label" style={{ color:'var(--accent)', fontSize:8.5 }}>● auto-watch</span>}<Tag s="crit">{critOpen} critical</Tag></div>}
      className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {openAlerts.length === 0 &&
          <div className="col" style={{ alignItems:'center', justifyContent:'center', padding:'30px 0', gap:8 }}>
            <span className="dot ok" style={{ width:14, height:14 }} /><span className="label">All clear — workforce stable</span></div>}
        {alerts.map(a => {
          const done = a.status === 'resolved';
          return (
            <div key={a.id} className={cx('alert', a.sev, a.status==='escalated' && 'escalated', a.isNew && 'slidein', a.removing && 'removing')}>
              <div className="ico"><Code s={a.sev}>{a.cat.slice(0,3)}</Code></div>
              <div className="col" style={{ flex:1, gap:7, minWidth:0 }}>
                <div>
                  <div className="between" style={{ gap:8 }}>
                    <span className="label" style={{ fontSize:8.5, color:stateColor[a.sev] }}>{a.cat}</span>
                    {a.status==='escalated' && <Tag s="warn">▲ Escalated</Tag>}
                  </div>
                  <div className="at" style={{ marginTop:4 }}>{a.text}</div>
                </div>
                {done
                  ? <span className="delta up" style={{ fontSize:11 }}>✓ Actioned — {a.owner} notified</span>
                  : <div className="alert-actions">
                      <Btn sm kind={a.primary.kind} onClick={() => alertAct(a,'primary')}>{a.primary.label}</Btn>
                      {a.primary.label !== 'Escalate' && <Btn sm kind="warn" onClick={() => alertAct(a,'escalate')}>Escalate</Btn>}
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
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr) 360px', gridTemplateRows:'auto minmax(0,1fr) minmax(0,1fr)', gap:14, gridTemplateAreas:'"kpis kpis kpis" "workforce deploy alerts" "compliance hse alerts"' }}>
      <div style={{ gridArea:'kpis' }}>{Kpis}</div>
      <div style={{ gridArea:'workforce', minHeight:0, display:'grid' }}>{Workforce}</div>
      <div style={{ gridArea:'compliance', minHeight:0, display:'grid' }}>{Compliance}</div>
      <div style={{ gridArea:'deploy', minHeight:0, display:'grid' }}>{Deployment}</div>
      <div style={{ gridArea:'hse', minHeight:0, display:'grid' }}>{HSE}</div>
      <div style={{ gridArea:'alerts', minHeight:0, display:'grid' }}>{Alerts}</div>
    </div>
  );
}
window.ScreenPeople = ScreenPeople;
