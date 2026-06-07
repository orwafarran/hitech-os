/* ============================================================
   HT-OS — Screen 8 · Design & Engineering  (window.ScreenDesign)
   BIM, drawing register, consultant approvals (SLA), clash detection.
   ============================================================ */
const DSTAT = { ifc:['ok','IFC'], approved:['ok','Approved'], review:['accent','In review'], pending:['crit','Pending'], design:['warn','In design'] };

function ScreenDesign({ live, tick, go, toast, pushActivity }) {
  const D = window.HTOS;
  const projName = (id) => (D.projects.find(p => p.id === id) || {}).name || id;

  const [approvals, setApprovals] = useState(() => D.designApprovals.map(a => ({ ...a })));
  const [clashes, setClashes]     = useState(() => D.designClashes.map(c => ({ ...c })));
  const [alerts, setAlerts]       = useState(() => D.designAlerts.map(a => ({ ...a, status:'open' })));
  const [ifc, setIfc]             = useState(D.designStats.ifcIssued);
  const [approvedToday, setApprovedToday] = useState(31);
  const [tab, setTab]             = useState('approvals');
  const incRef = useRef(0);
  const lastTick = useRef(0);

  // live: drawings keep being issued; BIM keeps scanning → a new clash can auto-surface
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    if (tick % 3 === 0) setIfc(v => v + 1);
    if (tick % 7 === 0 && incRef.current < D.designIncoming.length) {
      const c = D.designIncoming[incRef.current++];
      setClashes(cs => [{ ...c, isNew:true }, ...cs]);
      toast('Clash auto-detected', `${projName(c.proj)} · ${c.desc}`, 'warn');
      pushActivity(`BIM clash auto-detected — <b>${projName(c.proj)}</b>`);
    }
  }, [tick, live]);

  const approveDwg = (a) => {
    setApprovals(list => list.filter(x => x.id !== a.id));
    setApprovedToday(n => n + 1);
    toast('Drawing approved', `${a.desc} · IFC released`, 'good');
    pushActivity(`Approved drawing — <b>${projName(a.proj)}</b> ${a.desc}`);
  };
  const escalateApr = (a) => { toast('Escalated to consultant', `${a.desc} · SLA breach logged`, 'warn'); pushActivity(`Escalated approval — <b>${projName(a.proj)}</b>`); };
  const assignClash = (c) => {
    setClashes(list => list.map(x => x.id === c.id ? { ...x, assigned:true } : x));
    toast('Clash assigned', `${c.desc} · routed to ${c.disc.split(' ')[0]} lead`, 'accent');
    pushActivity(`Assigned clash — <b>${projName(c.proj)}</b>`);
  };
  const resolveClash = (c) => {
    setClashes(list => list.map(x => x.id === c.id ? { ...x, removing:true } : x));
    setTimeout(() => setClashes(list => list.filter(x => x.id !== c.id)), 520);
    toast('Clash resolved', `${c.desc} · model updated`, 'good');
    pushActivity(`Resolved clash — <b>${projName(c.proj)}</b>`);
  };

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
      toast('Resolved & closed', `${a.id} closed`, 'good'); pushActivity(`Resolved <b>${a.id}</b> — design`);
      setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x));
      setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520);
    }
  };

  const openAlerts = alerts.filter(a => a.status !== 'resolved');
  const critOpen = openAlerts.filter(a => a.sev === 'crit').length;

  /* ---------- panels ---------- */
  const Kpis = (
    <Panel title="Design & Engineering" sub="BIM · live" glow right={live && <span className="label" style={{ color:'var(--accent)' }}>● LIVE</span>}>
      <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
        <Kpi label="Drawings issued (IFC)" value={<Num value={ifc} live={live} />} size={28} delta={'▲ ' + approvedToday + ' approved today'} />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Approval rate" value={<span style={{ color:'var(--accent)' }}>{D.designStats.approvalRate}%</span>} size={28} delta="consultant sign-off" deltaDir="flat" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Open BIM clashes" value={<span style={{ color: clashes.length > 3 ? 'var(--red)' : 'var(--amber)' }}>{clashes.length}</span>} size={28} delta="auto-detected" deltaDir="flat" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Avg approval time" value={<span>{D.designStats.avgApprovalDays}<span className="kpi-unit"> d</span></span>} size={28} delta="▼ vs 4.1d target" deltaDir="up" />
      </div>
    </Panel>
  );

  const Register = (
    <Panel title="Drawing Register" sub={D.drawingRegister.length + ' sets'} flush
      right={<Btn kind="ghost" sm onClick={() => go('graph')}>Trace in graph →</Btn>} className="col" style={{ minHeight:0 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 0.9fr 1.3fr 0.7fr', padding:'9px 14px', borderBottom:'1px solid var(--line)' }}>
        {['Project','Set · Rev','Approved','Status'].map(h => <span key={h} className="label" style={{ fontSize:8.5 }}>{h}</span>)}
      </div>
      <div className="scrolly" style={{ flex:1 }}>
        {D.drawingRegister.map(d => {
          const [ts,tl] = DSTAT[d.status] || ['ghost', d.status];
          return (
            <div key={d.proj} className="lrow" style={{ display:'grid', gridTemplateColumns:'1.3fr 0.9fr 1.3fr 0.7fr', alignItems:'center', gap:8 }} onClick={() => go('project', d.proj)} title="Open project →">
              <div className="col" style={{ gap:2, minWidth:0 }}>
                <span className="truncate" style={{ fontSize:12.5, fontWeight:600 }}>{projName(d.proj)}</span>
                <span className="label" style={{ fontSize:8 }}>{fmt(d.count)} drawings</span>
              </div>
              <span className="mono" style={{ fontSize:11.5, color:'var(--ink2)' }}>{d.set} · {d.rev}</span>
              <div className="col" style={{ gap:4, minWidth:0 }}>
                <span className="mono tnum" style={{ fontSize:11, color: d.approved===100 ? 'var(--green)' : d.s==='crit' ? 'var(--red)' : 'var(--ink2)' }}>{d.approved}%</span>
                <Bar value={d.approved} s={d.s==='crit' ? 'crit' : d.s==='warn' ? 'warn' : d.approved===100 ? 'ok' : 'accent'} />
              </div>
              <Tag s={ts}>{tl}</Tag>
            </div>
          );
        })}
      </div>
      <div className="between" style={{ padding:'9px 14px', borderTop:'1px solid var(--line)' }}>
        <span className="label" style={{ fontSize:8.5, color:'var(--accent)' }}>● {ifc.toLocaleString('en-US')} drawings issued for construction</span>
        <span className="label" style={{ fontSize:8.5, color:'var(--ink4)' }}>click a set to open →</span>
      </div>
    </Panel>
  );

  const Mid = (
    <Panel title={tab === 'approvals' ? 'Consultant Approvals · SLA' : 'Design Workload'} sub={tab === 'approvals' ? approvals.length + ' pending' : 'by team'} flush className="col" style={{ minHeight:0 }}
      right={<div className="seg">
        <button className={tab==='approvals' ? 'on' : ''} onClick={() => setTab('approvals')}>Approvals</button>
        <button className={tab==='workload' ? 'on' : ''} onClick={() => setTab('workload')}>Workload</button>
      </div>}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {tab === 'approvals'
          ? approvals.map(a => (
              <div key={a.id} className="col" style={{ gap:6, padding:'10px 11px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)', boxShadow: a.s==='crit' ? 'inset 0 0 0 1px var(--red-line)' : 'none' }}>
                <div className="between" style={{ gap:8 }}>
                  <span className="truncate" style={{ fontSize:12, fontWeight:600 }}>{projName(a.proj)}</span>
                  <span className="mono tnum" style={{ fontSize:11, color: a.s==='crit' ? 'var(--red)' : a.s==='warn' ? 'var(--amber)' : 'var(--ink2)' }}>{a.days}d / {a.sla}d SLA</span>
                </div>
                <span className="truncate" style={{ fontSize:11.5, color:'var(--ink2)' }}>{a.desc}</span>
                <div className="between" style={{ gap:8 }}>
                  <Bar value={Math.min(100, a.days / a.sla * 100)} s={a.s==='crit' ? 'crit' : a.s==='warn' ? 'warn' : 'ok'} />
                </div>
                <div className="row" style={{ gap:6 }}>
                  <Btn sm kind="good" onClick={() => approveDwg(a)}>Approve</Btn>
                  <Btn sm kind="warn" onClick={() => escalateApr(a)}>Escalate</Btn>
                </div>
              </div>
            ))
          : D.designWorkload.map(w => (
              <div key={w.team} className="col" style={{ gap:6, padding:'10px 11px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)' }}>
                <div className="between"><span style={{ fontSize:12, fontWeight:600 }}>{w.team}</span><Dot s={w.s} live={live && w.s!=='ok'} /></div>
                <div className="between"><span className="label" style={{ fontSize:8.5 }}>{w.inprog} in progress · {w.issued} issued</span></div>
                <Bar value={w.issued} max={w.inprog + w.issued} s={w.s} />
              </div>
            ))}
      </div>
    </Panel>
  );

  const Clashes = (
    <Panel title="BIM Clash Detection" sub={clashes.length + ' open'} flush className="col" style={{ minHeight:0 }}
      right={live && <span className="label" style={{ color:'var(--accent)', fontSize:8.5 }}>● scanning</span>}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {clashes.length === 0 &&
          <div className="col" style={{ alignItems:'center', justifyContent:'center', padding:'24px 0', gap:8 }}>
            <span className="dot ok" style={{ width:14, height:14 }} /><span className="label">No open clashes — model clean</span></div>}
        {clashes.map(c => (
          <div key={c.id} className={cx('alert', c.s, c.isNew && 'slidein', c.removing && 'removing')}>
            <div className="ico"><Code s={c.s}>3D</Code></div>
            <div className="col" style={{ flex:1, gap:6, minWidth:0 }}>
              <div>
                <div className="between" style={{ gap:8 }}>
                  <span className="label" style={{ fontSize:8.5, color:stateColor[c.s] }}>{projName(c.proj)} · {c.disc}</span>
                  {c.assigned && <Tag s="accent">assigned</Tag>}
                </div>
                <div className="at" style={{ marginTop:4 }}>{c.desc} — <span style={{ color:'var(--ink3)' }}>{c.note}</span></div>
              </div>
              <div className="row" style={{ gap:6 }}>
                {!c.assigned && <Btn sm kind="primary" onClick={() => assignClash(c)}>Assign</Btn>}
                <Btn sm kind="good" onClick={() => resolveClash(c)}>Resolve</Btn>
                <Btn sm kind="ghost" onClick={() => go('graph')}>Trace →</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  const Alerts = (
    <Panel title="Design Alerts" sub={openAlerts.length + ' open'} flush glowCrit={critOpen > 0}
      right={<Tag s="crit">{critOpen} critical</Tag>} className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {openAlerts.length === 0 &&
          <div className="col" style={{ alignItems:'center', justifyContent:'center', padding:'30px 0', gap:8 }}>
            <span className="dot ok" style={{ width:14, height:14 }} /><span className="label">All clear — design on track</span></div>}
        {alerts.map(a => {
          const done = a.status === 'resolved';
          return (
            <div key={a.id} className={cx('alert', a.sev, a.status==='escalated' && 'escalated', a.removing && 'removing')}>
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
                      {a.proj && <Btn sm kind="ghost" onClick={() => go('project', a.proj)}>Open →</Btn>}
                    </div>}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  return (
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'minmax(0,1.05fr) minmax(0,0.95fr) 360px', gridTemplateRows:'auto minmax(0,1fr) minmax(0,1fr)', gap:14, gridTemplateAreas:'"kpis kpis kpis" "register mid alerts" "register clashes alerts"' }}>
      <div style={{ gridArea:'kpis' }}>{Kpis}</div>
      <div style={{ gridArea:'register', minHeight:0, display:'grid' }}>{Register}</div>
      <div style={{ gridArea:'mid', minHeight:0, display:'grid' }}>{Mid}</div>
      <div style={{ gridArea:'clashes', minHeight:0, display:'grid' }}>{Clashes}</div>
      <div style={{ gridArea:'alerts', minHeight:0, display:'grid' }}>{Alerts}</div>
    </div>
  );
}
window.ScreenDesign = ScreenDesign;
