/* ============================================================
   HT-OS — Screen 7 · Store & Procurement  (window.ScreenStore)
   Live inventory, purchase orders, deliveries, consumption.
   Low-stock alerts fire on their own before a line stalls.
   ============================================================ */
const PO_TAG  = { transit:['info','In transit'], confirmed:['ok','Confirmed'], approval:['warn','Awaiting approval'], late:['crit','Late'] };
const DEL_TAG = { received:['ok','Received'], due:['accent','Due'], transit:['info','In transit'], late:['crit','Overdue'] };
const matStatus = (v, m) => v < m.reorder * 0.5 ? 'crit' : v < m.reorder ? 'warn' : 'ok';

function ScreenStore({ live, tick, go, toast, pushActivity }) {
  const D = window.HTOS;
  const projName = (id) => (D.projects.find(p => p.id === id) || {}).name || id;

  const [stocks, setStocks] = useState(() => D.materials.map(m => m.stock));
  const [pos, setPos]       = useState(() => D.purchaseOrders.map(p => ({ ...p })));
  const [dels, setDels]     = useState(() => D.deliveriesDue.map(d => ({ ...d })));
  const [alerts, setAlerts] = useState(() => D.storeAlerts.map(a => ({ ...a, status:'open' })));
  const [tab, setTab]       = useState('deliveries');
  const poSeq = useRef(7750);
  const aggFired = useRef(false);
  const lastTick = useRef(0);

  // live: stock consumed each tick (ties to the floor)
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    setStocks(ss => ss.map((v,i) => {
      const m = D.materials[i];
      if (m.unit === '%') return Math.max(20, v - (Math.random() < 0.4 ? 1 : 0));
      const rate = m.id === 'MAT-AGG' ? 0.012 : 0.005;
      const dec = Math.max(1, Math.round(m.stock * rate * (0.5 + Math.random())));
      return Math.max(Math.round(m.reorder * 0.2), v - dec);
    }));
  }, [tick, live]);

  // low-stock alert fires on its own when aggregates crosses reorder
  useEffect(() => {
    const i = D.materials.findIndex(m => m.id === 'MAT-AGG');
    if (i < 0 || aggFired.current) return;
    if (stocks[i] < D.materials[i].reorder) {
      aggFired.current = true;
      setAlerts(al => [{ id:'ST-LIVE', sev:'crit', cat:'STOCK · AUTO ' + new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}), owner:'Procurement Lead', mat:'MAT-AGG',
        primary:{ label:'Raise PO', kind:'primary' }, status:'open', isNew:true,
        text:`Aggregates dropped to ${fmt(stocks[i])} t — below 4,000 t reorder. Auto-PO suggested before Line 1 stalls.` }, ...al]);
      toast('Low-stock auto-alert', 'Aggregates below reorder', 'crit');
      pushActivity('Auto low-stock alert — <b>Aggregates</b> below reorder');
    }
  }, [stocks]);

  const stockValue = D.materials.reduce((a,m,i) => a + m.value * (stocks[i] / m.stock), 0);
  const belowReorder = stocks.filter((v,i) => v < D.materials[i].reorder).length;
  const openPOval = pos.reduce((a,p) => a + p.value, 0);
  const dueToday = dels.filter(d => d.status === 'due' || d.status === 'transit').length;

  /* ---------- actions ---------- */
  const raisePO = (m) => {
    const id = 'PO-' + (++poSeq.current);
    setPos(ps => [{ id, supplier:'Auto-sourced', items:'Replenish ' + m.name, value:+(m.value * 0.3).toFixed(2), eta:'+5 days', status:'approval', isNew:true }, ...ps]);
    toast('PO raised', `${id} · ${m.name} · awaiting approval`, 'accent');
    pushActivity(`Raised PO <b>${id}</b> — ${m.name}`);
  };
  const flagLow = (m) => { toast('Low stock flagged', `${m.name} · added to watchlist`, 'warn'); pushActivity(`Flagged low stock — <b>${m.name}</b>`); };
  const approvePO = (id) => { setPos(ps => ps.map(p => p.id === id ? { ...p, status:'confirmed' } : p)); toast('PO approved', `${id} confirmed`, 'good'); pushActivity(`Approved PO <b>${id}</b>`); };
  const expeditePO = (id) => { setPos(ps => ps.map(p => p.id === id ? { ...p, status:'transit' } : p)); setDels(ds => ds.map(d => d.id === id ? { ...d, status:'transit', eta:'priority' } : d)); toast('Delivery expedited', `${id} · priority dispatch`, 'warn'); pushActivity(`Expedited delivery <b>${id}</b>`); };
  const receiveDel = (id) => { setDels(ds => ds.map(d => d.id === id ? { ...d, status:'received', eta:'now' } : d)); toast('Delivery received', `${id} · booked into store`, 'good'); pushActivity(`Received delivery <b>${id}</b>`); };

  const resolveAlert = (a) => {
    setAlerts(list => list.map(x => x.id === a.id ? { ...x, status:'resolved' } : x));
    setTimeout(() => { setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x)); setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520); }, 800);
  };
  const alertAct = (a, kind) => {
    if (kind === 'primary') {
      if (a.primary.label === 'Raise PO' && a.mat) { const m = D.materials.find(x => x.id === a.mat); if (m) raisePO(m); }
      else if (a.primary.label === 'Approve PO' && a.po) approvePO(a.po);
      else if (a.primary.label === 'Expedite' && a.po) expeditePO(a.po);
      else { toast(a.primary.label, `${a.id} · actioned`, 'accent'); pushActivity(`${a.primary.label} — <b>${a.id}</b>`); }
      resolveAlert(a);
    } else if (kind === 'escalate') {
      setAlerts(list => { const t = list.find(x => x.id === a.id); if (!t) return list; return [{ ...t, status:'escalated' }, ...list.filter(x => x.id !== a.id)]; });
      toast('Escalated', `Routed to ${a.owner}`, 'warn'); pushActivity(`Escalated <b>${a.id}</b> to ${a.owner}`);
    } else {
      toast('Resolved & closed', `${a.id} closed`, 'good'); pushActivity(`Resolved <b>${a.id}</b> — store`);
      setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x));
      setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520);
    }
  };

  const openAlerts = alerts.filter(a => a.status !== 'resolved');
  const critOpen = openAlerts.filter(a => a.sev === 'crit').length;

  /* ---------- panels ---------- */
  const Kpis = (
    <Panel title="Store & Procurement" sub="live · AED" glow right={live && <span className="label" style={{ color:'var(--accent)' }}>● LIVE</span>}>
      <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
        <Kpi label="Total stock value" value={<span className={cx(live && 'countpop')} key={stockValue.toFixed(1)}>AED {stockValue.toFixed(1)}<span className="kpi-unit"> M</span></span>} size={26} delta="▼ consuming live" deltaDir="down" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Open PO value" value={<span>AED {openPOval.toFixed(2)}<span className="kpi-unit"> M</span></span>} size={26} delta={pos.length + ' open orders'} deltaDir="flat" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Below reorder" value={<span style={{ color: belowReorder > 2 ? 'var(--red)' : 'var(--amber)' }}>{belowReorder}</span>} size={26} delta="items need PO" deltaDir="flat" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Deliveries due today" value={dueToday} size={26} delta={dels.filter(d=>d.status==='received').length + ' received'} deltaDir="up" />
      </div>
    </Panel>
  );

  const Inventory = (
    <Panel title="Live Inventory" sub="6 materials · consumption-linked" flush
      right={<span className="chip">AED {stockValue.toFixed(1)}M on hand</span>} className="col" style={{ minHeight:0 }} glowCrit={belowReorder > 2}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {D.materials.map((m,i) => {
          const v = stocks[i]; const st = matStatus(v, m); const low = v < m.reorder;
          return (
            <div key={m.id} className="col" style={{ gap:7, padding:11, border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)', boxShadow: st==='crit' ? 'inset 0 0 0 1px var(--red-line)' : st==='warn' ? 'inset 0 0 0 1px var(--amber-line)' : 'none' }}>
              <div className="between" style={{ gap:8 }}>
                <div className="row" style={{ gap:8, alignItems:'center', minWidth:0 }}>
                  <Dot s={st} live={live && low} />
                  <span className="truncate" style={{ fontSize:12.5, fontWeight:600 }}>{m.name}</span>
                </div>
                <span className="mono tnum" style={{ fontSize:15, color: st!=='ok' ? stateColor[st] : 'var(--ink)' }}>{fmt(v)}<span className="kpi-unit" style={{ fontSize:9 }}> {m.unit}</span></span>
              </div>
              <Bar value={v} max={m.reorder * 2.5} s={st} thick />
              <div className="between" style={{ gap:8 }}>
                <span className="label" style={{ fontSize:8.5 }}>reorder {fmt(m.reorder)} {m.unit} · {m.use}</span>
                {low
                  ? <div className="row" style={{ gap:6 }}>
                      <Btn sm kind="primary" onClick={() => raisePO(m)}>Raise PO</Btn>
                      <Btn sm kind="ghost" onClick={() => flagLow(m)}>Flag</Btn>
                    </div>
                  : <Tag s="ok">In stock</Tag>}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  const POs = (
    <Panel title="Purchase Orders" sub={pos.length + ' open'} flush className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {pos.map(p => {
          const [ts,tl] = PO_TAG[p.status] || ['ghost', p.status];
          return (
            <div key={p.id} className={cx('col', p.isNew && 'slidein')} style={{ gap:6, padding:'10px 11px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)' }}>
              <div className="between" style={{ gap:8 }}>
                <span className="mono" style={{ fontSize:12, fontWeight:600 }}>{p.id}</span>
                <span className="mono tnum" style={{ fontSize:12.5 }}>AED {p.value}M</span>
              </div>
              <span className="truncate" style={{ fontSize:11.5, color:'var(--ink2)' }}>{p.supplier} · {p.items}</span>
              <div className="between" style={{ gap:8 }}>
                <div className="row" style={{ gap:8, alignItems:'center' }}><Tag s={ts}>{tl}</Tag><span className="label" style={{ fontSize:8.5 }}>ETA {p.eta}</span></div>
                <div className="row" style={{ gap:6 }}>
                  {p.status==='approval' && <Btn sm kind="good" onClick={() => approvePO(p.id)}>Approve PO</Btn>}
                  {(p.status==='late' || p.status==='transit') && <Btn sm kind="warn" onClick={() => expeditePO(p.id)}>Expedite</Btn>}
                  {p.status==='confirmed' && <Btn sm kind="ghost" onClick={() => toast('PO on track', `${p.id} · ETA ${p.eta}`, 'good')}>Track</Btn>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  const Flow = (
    <Panel title={tab === 'deliveries' ? 'Deliveries Due' : 'Consumption · today'} sub={tab === 'deliveries' ? 'incoming / received' : 'ties to the floor'} flush className="col" style={{ minHeight:0 }}
      right={<div className="seg">
        <button className={tab==='deliveries' ? 'on' : ''} onClick={() => setTab('deliveries')}>Deliveries</button>
        <button className={tab==='consumption' ? 'on' : ''} onClick={() => setTab('consumption')}>Consumption</button>
      </div>}>
      <div className="scrolly" style={{ flex:1 }}>
        {tab === 'deliveries'
          ? dels.map(d => {
              const [ts,tl] = DEL_TAG[d.status] || ['ghost', d.status];
              return (
                <div key={d.id} className="lrow" style={{ alignItems:'center', gap:10 }}>
                  <Dot s={d.status==='received' ? 'ok' : d.status==='late' ? 'crit' : d.status==='due' ? 'accent' : 'info'} live={live && (d.status==='transit'||d.status==='late')} />
                  <div className="col" style={{ flex:1, gap:2, minWidth:0 }}>
                    <div className="between"><span className="mono" style={{ fontSize:11.5, fontWeight:600 }}>{d.id}</span><span className="label" style={{ fontSize:8.5 }}>{d.eta}</span></div>
                    <span className="truncate" style={{ fontSize:11.5, color:'var(--ink2)' }}>{d.supplier} · {d.items}</span>
                  </div>
                  <div className="row" style={{ gap:6, alignItems:'center' }}>
                    <Tag s={ts}>{tl}</Tag>
                    {d.status==='due' && <Btn sm kind="ghost" onClick={() => receiveDel(d.id)}>Receive</Btn>}
                    {d.status==='late' && <Btn sm kind="warn" onClick={() => expeditePO(d.id)}>Expedite</Btn>}
                  </div>
                </div>
              );
            })
          : D.consumption.map((c,i) => (
              <div key={i} className="lrow" style={{ alignItems:'center', gap:10 }} onClick={() => go('factory')} title="Open production floor →">
                <div className="col" style={{ flex:1, gap:2, minWidth:0 }}>
                  <span className="truncate" style={{ fontSize:12.5, fontWeight:600 }}>{projName(c.proj)}</span>
                  <span className="label" style={{ fontSize:8.5 }}>{c.material}</span>
                </div>
                <span className="mono tnum" style={{ fontSize:13 }}>{fmt(c.used)} <span className="kpi-unit" style={{ fontSize:9 }}>{c.unit}</span></span>
                <span className="label" style={{ fontSize:8.5, color:'var(--ink4)' }}>today →</span>
              </div>
            ))}
      </div>
    </Panel>
  );

  const Alerts = (
    <Panel title="Procurement Alerts" sub={openAlerts.length + ' open'} flush glowCrit={critOpen > 0}
      right={<div className="row" style={{ gap:7, alignItems:'center' }}>{live && <span className="label" style={{ color:'var(--accent)', fontSize:8.5 }}>● auto-watch</span>}<Tag s="crit">{critOpen} critical</Tag></div>}
      className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {openAlerts.length === 0 &&
          <div className="col" style={{ alignItems:'center', justifyContent:'center', padding:'30px 0', gap:8 }}>
            <span className="dot ok" style={{ width:14, height:14 }} /><span className="label">All clear — stock healthy</span></div>}
        {alerts.map(a => {
          const done = a.status === 'resolved';
          return (
            <div key={a.id} className={cx('alert', a.sev, a.status==='escalated' && 'escalated', a.isNew && 'slidein', a.removing && 'removing')}>
              <div className="ico"><Code s={a.sev}>{a.cat.split(' ')[0].slice(0,3)}</Code></div>
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
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'minmax(0,1.05fr) minmax(0,0.95fr) 360px', gridTemplateRows:'auto minmax(0,1fr) minmax(0,1fr)', gap:14, gridTemplateAreas:'"kpis kpis kpis" "inventory pos alerts" "inventory flow alerts"' }}>
      <div style={{ gridArea:'kpis' }}>{Kpis}</div>
      <div style={{ gridArea:'inventory', minHeight:0, display:'grid' }}>{Inventory}</div>
      <div style={{ gridArea:'pos', minHeight:0, display:'grid' }}>{POs}</div>
      <div style={{ gridArea:'flow', minHeight:0, display:'grid' }}>{Flow}</div>
      <div style={{ gridArea:'alerts', minHeight:0, display:'grid' }}>{Alerts}</div>
    </div>
  );
}
window.ScreenStore = ScreenStore;
