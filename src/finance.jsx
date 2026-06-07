/* ============================================================
   HT-OS — Screen 11 · Finance & Accounts  (window.ScreenFinance)
   Cash, receivables (AR + aging), payables (AP), retention.
   ============================================================ */
const PAY_TAG = { approval:['warn','Awaiting approval'], scheduled:['ok','Scheduled'], paid:['ok','Paid'] };
const BUCKET_S = { 'Current':'ok', '30+':'accent', '60+':'warn', '90+':'crit' };

function ScreenFinance({ live, tick, go, toast, pushActivity }) {
  const D = window.HTOS;
  const projName = (id) => (D.projects.find(p => p.id === id) || {}).name || id;

  const [invoices, setInvoices] = useState(() => D.arInvoices.map(i => ({ ...i })));
  const [payables, setPayables] = useState(() => D.apPayables.map(p => ({ ...p })));
  const [alerts, setAlerts]     = useState(() => D.financeAlerts.map(a => ({ ...a, status:'open' })));
  const [cash, setCash]         = useState(D.financeStats.cash);
  const paidRef = useRef(0);
  const lastTick = useRef(0);

  // live: collections trickle in; a large invoice clears
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    setCash(c => +(c + Math.random() * 0.6).toFixed(1));
    if (tick % 6 === 0 && paidRef.current < D.financeIncoming.length) {
      const ev = D.financeIncoming[paidRef.current++];
      setInvoices(list => list.filter(i => i.id !== 'INV-3041'));
      setCash(c => +(c + ev.amount).toFixed(1));
      toast('Payment received', ev.text.replace('Payment received — ', ''), 'good');
      pushActivity(`Payment received — <b>AED ${ev.amount}M</b> cleared`);
    }
  }, [tick, live]);

  const receivables = invoices.reduce((a,i) => a + i.amount, 0);
  const payDue = payables.reduce((a,p) => a + p.amount, 0);
  const retentionTotal = D.retentionRows.reduce((a,r) => a + r.amount, 0);
  const bucketSum = (b) => invoices.filter(i => i.bucket === b).reduce((a,i) => a + i.amount, 0);

  const chase = (i) => { toast('Invoice chased', `${i.id} · ${projName(i.proj)} · reminder sent`, 'warn'); pushActivity(`Chased invoice <b>${i.id}</b> — ${projName(i.proj)}`); };
  const approvePay = (p) => { setPayables(list => list.map(x => x.id === p.id ? { ...x, status:'scheduled' } : x)); toast('Payment approved', `${p.supplier} · AED ${p.amount}M scheduled`, 'good'); pushActivity(`Approved payment <b>${p.id}</b> — ${p.supplier}`); };
  const releaseRet = (r) => { toast('Retention released', `${projName(r.proj)} · AED ${r.amount}M certificate raised`, 'good'); pushActivity(`Released retention — <b>${projName(r.proj)}</b> AED ${r.amount}M`); };

  const resolveAlert = (a) => {
    setAlerts(list => list.map(x => x.id === a.id ? { ...x, status:'resolved' } : x));
    setTimeout(() => { setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x)); setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520); }, 800);
  };
  const alertAct = (a, kind) => {
    if (kind === 'escalate') {
      setAlerts(list => { const t = list.find(x => x.id === a.id); if (!t) return list; return [{ ...t, status:'escalated' }, ...list.filter(x => x.id !== a.id)]; });
      toast('Escalated', `Routed to ${a.owner}`, 'warn'); pushActivity(`Escalated <b>${a.id}</b> to ${a.owner}`);
    } else if (kind === 'primary') {
      toast(a.primary.label, `${a.id} · actioned`, a.primary.kind === 'good' ? 'good' : 'accent');
      pushActivity(`${a.primary.label} — <b>${a.id}</b>`); resolveAlert(a);
    } else {
      toast('Resolved & closed', `${a.id} closed`, 'good'); pushActivity(`Resolved <b>${a.id}</b> — finance`);
      setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x));
      setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520);
    }
  };

  const openAlerts = alerts.filter(a => a.status !== 'resolved');
  const critOpen = openAlerts.filter(a => a.sev === 'crit').length;

  /* ---------- panels ---------- */
  const Kpis = (
    <Panel title="Finance & Accounts" sub="AED · live" glow right={live && <span className="label" style={{ color:'var(--accent)' }}>● LIVE</span>}>
      <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
        <Kpi label="Cash position" value={<span>AED {cash.toFixed(1)}<span className="kpi-unit"> M</span></span>} size={26} spark={D.financeStats.cashSpark} sparkColor="var(--green)" delta="▲ collections in" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Receivables" value={<span style={{ color:'var(--amber)' }}>AED {receivables}M</span>} size={26} delta={'AED ' + bucketSum('90+') + 'M overdue 90+'} deltaDir="down" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Payables due" value={<span>AED {payDue.toFixed(1)}<span className="kpi-unit"> M</span></span>} size={26} delta={payables.filter(p=>p.status==='approval').length + ' awaiting approval'} deltaDir="flat" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Retention held" value={<span>AED {retentionTotal}<span className="kpi-unit"> M</span></span>} size={26} delta="across 6 projects" deltaDir="flat" />
      </div>
    </Panel>
  );

  const AR = (
    <Panel title="Receivables · Aging" sub={'AED ' + receivables + 'M outstanding'} flush className="col" style={{ minHeight:0 }} glowCrit={bucketSum('90+') > 0}>
      <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:10, padding:'12px 12px 4px' }}>
        {['Current','30+','60+','90+'].map(b => (
          <div key={b} className="col" style={{ gap:4, padding:'8px 10px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)' }}>
            <span className="label" style={{ fontSize:8 }}>{b==='Current' ? 'Current' : b + ' days'}</span>
            <span className="mono tnum" style={{ fontSize:15, color:stateColor[BUCKET_S[b]] }}>{bucketSum(b)}<span className="kpi-unit" style={{ fontSize:8 }}> M</span></span>
          </div>
        ))}
      </div>
      <div className="scrolly" style={{ flex:1, padding:'4px 0' }}>
        {invoices.map(i => (
          <div key={i.id} className="lrow" style={{ alignItems:'center', gap:11 }} onClick={() => go('project', i.proj)} title="Open project →">
            <Dot s={i.s} live={live && i.s==='crit'} />
            <div className="col" style={{ flex:1, gap:2, minWidth:0 }}>
              <div className="between"><span className="mono" style={{ fontSize:11.5, fontWeight:600 }}>{i.id}</span><span className="mono tnum" style={{ fontSize:12.5 }}>AED {i.amount}M</span></div>
              <span className="truncate label" style={{ fontSize:8.5 }}>{projName(i.proj)} · {i.client}</span>
            </div>
            <div className="col" style={{ alignItems:'flex-end', gap:4 }}>
              <Tag s={i.s}>{i.age}d</Tag>
              {(i.bucket==='60+' || i.bucket==='90+')
                ? <Btn sm kind={i.bucket==='90+' ? 'danger' : 'warn'} onClick={(e) => { e.stopPropagation(); chase(i); }}>Chase</Btn>
                : <span className="label" style={{ fontSize:8 }}>{i.bucket}</span>}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  const Payables = (
    <Panel title="Payables · Suppliers" sub={'AED ' + payDue.toFixed(1) + 'M due'} flush className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {payables.map(p => {
          const [ts,tl] = PAY_TAG[p.status] || ['ghost', p.status];
          return (
            <div key={p.id} className="col" style={{ gap:6, padding:'10px 11px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)', boxShadow: p.s==='crit' ? 'inset 0 0 0 1px var(--red-line)' : 'none' }}>
              <div className="between" style={{ gap:8 }}>
                <span className="truncate" style={{ fontSize:12, fontWeight:600 }}>{p.supplier}</span>
                <span className="mono tnum" style={{ fontSize:12.5 }}>AED {p.amount}M</span>
              </div>
              <div className="between" style={{ gap:8 }}>
                <div className="row" style={{ gap:8, alignItems:'center' }}><Tag s={ts}>{tl}</Tag><span className="label" style={{ fontSize:8.5, color: p.s==='crit' ? 'var(--red)' : 'var(--ink3)' }}>due {p.due}</span></div>
                {p.status==='approval'
                  ? <Btn sm kind="good" onClick={() => approvePay(p)}>Approve payment</Btn>
                  : <Btn sm kind="ghost" onClick={() => toast('Payment on schedule', `${p.supplier} · ${p.due}`, 'good')}>Track</Btn>}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  const Retention = (
    <Panel title="Retention Held" sub={'AED ' + retentionTotal + 'M'} flush className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1 }}>
        {D.retentionRows.map(r => (
          <div key={r.proj} className="lrow" style={{ alignItems:'center', gap:11 }} onClick={() => go('project', r.proj)}>
            <Dot s={r.s} />
            <div className="col" style={{ flex:1, gap:2, minWidth:0 }}>
              <span className="truncate" style={{ fontSize:12.5, fontWeight:600 }}>{projName(r.proj)}</span>
              <span className="label" style={{ fontSize:8.5 }}>release · {r.release}</span>
            </div>
            <span className="mono tnum" style={{ fontSize:13 }}>AED {r.amount}M</span>
            {r.s === 'warn'
              ? <Btn sm kind="primary" onClick={(e) => { e.stopPropagation(); releaseRet(r); }}>Release</Btn>
              : <span className="label" style={{ fontSize:8, width:54, textAlign:'right' }}>held</span>}
          </div>
        ))}
      </div>
    </Panel>
  );

  const Alerts = (
    <Panel title="Finance Alerts" sub={openAlerts.length + ' open'} flush glowCrit={critOpen > 0}
      right={<Tag s="crit">{critOpen} critical</Tag>} className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {openAlerts.length === 0 &&
          <div className="col" style={{ alignItems:'center', justifyContent:'center', padding:'30px 0', gap:8 }}>
            <span className="dot ok" style={{ width:14, height:14 }} /><span className="label">All clear — books balanced</span></div>}
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
                      <Btn sm kind="warn" onClick={() => alertAct(a,'escalate')}>Escalate</Btn>
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
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'minmax(0,1.05fr) minmax(0,0.95fr) 360px', gridTemplateRows:'auto minmax(0,1fr) minmax(0,1fr)', gap:14, gridTemplateAreas:'"kpis kpis kpis" "ar payables alerts" "ar retention alerts"' }}>
      <div style={{ gridArea:'kpis' }}>{Kpis}</div>
      <div style={{ gridArea:'ar', minHeight:0, display:'grid' }}>{AR}</div>
      <div style={{ gridArea:'payables', minHeight:0, display:'grid' }}>{Payables}</div>
      <div style={{ gridArea:'retention', minHeight:0, display:'grid' }}>{Retention}</div>
      <div style={{ gridArea:'alerts', minHeight:0, display:'grid' }}>{Alerts}</div>
    </div>
  );
}
window.ScreenFinance = ScreenFinance;
