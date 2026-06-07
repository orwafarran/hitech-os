/* ============================================================
   HT-OS — Screen 3 · Truck Trip Verification  (window.ScreenVerify)
   A verified trip TIMESHEET: every trip's gate times (in/out),
   stamped verified by hash chain + QR. Replaces paper + signatures.
   ============================================================ */
const TV_STATUS = {
  verified:  { s:'ok',   label:'✓ Verified' },
  suspended: { s:'warn', label:'⚠ Review' },
  unclaimed: { s:'info', label:'◷ No note' },
  rejected:  { s:'crit', label:'✗ Rejected' },
};

function ScreenVerify({ live, tick, go, toast, pushActivity }) {
  const D = window.HTOS;
  const V = D.tvStats;
  const trips = D.verifyTrips;

  const [verified, setVerified] = useState(V.verifiedToday);
  const [claimed, setClaimed]   = useState(V.claimed);
  const [trucks, setTrucks]     = useState(() => D.verifyTrucks.map(t => ({ ...t })));
  const [alerts, setAlerts]     = useState(() => D.verifyAlerts.map(a => ({ ...a, status:'open' })));
  const incRef = useRef(0);
  const lastTick = useRef(0);

  // live: trips keep getting camera-counted; an alert can auto-surface
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    if (tick % 4 === 0) { setVerified(n => n + 1); setClaimed(n => n + 1); }
    if (tick % 9 === 0 && incRef.current < D.verifyIncoming.length) {
      const a = D.verifyIncoming[incRef.current++];
      setAlerts(list => [{ ...a, status:'open', isNew:true }, ...list]);
      toast('Unclaimed trip', 'Camera recorded · no delivery note', 'warn');
      pushActivity('Unclaimed trip flagged — camera saw, no note');
    }
  }, [tick, live]);

  const gap = claimed - verified;

  const registerTruck = (p) => { setTrucks(ts => ts.map(t => t.plate === p ? { ...t, status:'active', note:null } : t)); toast('Truck registered', `${p} added to fleet registry`, 'good'); pushActivity(`Registered truck <b>${p}</b>`); };
  const rowDetail = (t) => {
    const st = TV_STATUS[t.status];
    toast(`${t.id} · ${t.plate}`, t.status === 'rejected' ? 'No camera record — supplier claim rejected' : t.status === 'suspended' ? 'Timestamps off — sent for dual review' : t.status === 'unclaimed' ? 'Camera saw it — awaiting supplier note' : 'Camera-verified · hash ' + t.hash, st.s);
  };

  const resolveAlert = (a) => {
    setAlerts(list => list.map(x => x.id === a.id ? { ...x, status:'resolved' } : x));
    setTimeout(() => { setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x)); setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520); }, 800);
  };
  const alertAct = (a, kind) => {
    if (kind === 'escalate') {
      setAlerts(list => { const t = list.find(x => x.id === a.id); if (!t) return list; return [{ ...t, status:'escalated' }, ...list.filter(x => x.id !== a.id)]; });
      toast('Escalated', `Routed to ${a.owner}`, 'warn'); pushActivity(`Escalated <b>${a.id}</b> to ${a.owner}`);
    } else if (kind === 'primary') {
      if (a.primary.label === 'Register' && a.plate) registerTruck(a.plate);
      else { toast(a.primary.label, `${a.id} · actioned`, a.primary.kind === 'good' ? 'good' : 'accent'); pushActivity(`${a.primary.label} — <b>${a.id}</b>`); }
      resolveAlert(a);
    } else {
      toast('Resolved & closed', `${a.id} closed`, 'good'); pushActivity(`Resolved <b>${a.id}</b> — verification`);
      setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x));
      setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520);
    }
  };

  const openAlerts = alerts.filter(a => a.status !== 'resolved');
  const critOpen = openAlerts.filter(a => a.sev === 'crit').length;

  /* ---------- KPI strip ---------- */
  const Kpis = (
    <Panel title="Truck Trip Verification" sub="cameras count the trips · live" glow right={live && <span className="label" style={{ color:'var(--accent)' }}>● LIVE</span>}>
      <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
        <Kpi label="Registered trucks" value={<Num value={V.registered} />} size={26} delta={V.camsOnline + '/' + V.camsTotal + ' cameras online'} deltaDir="flat" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Camera-verified today" value={<span style={{ color:'var(--green)' }}><Num value={verified} live={live} /></span>} size={26} delta="● complete trips" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Supplier claimed" value={<span style={{ color: gap > 0 ? 'var(--red)' : 'var(--ink)' }}><Num value={claimed} live={live} /></span>} size={26} delta={'▼ ' + gap + ' not payable'} deltaDir="down" />
        <div style={{ width:1, background:'var(--line)', margin:'0 16px' }} />
        <Kpi label="Tamper-proof" value={<span style={{ color:'var(--green)' }}>Hash ✓</span>} size={22} delta="no edit · no override" deltaDir="flat" />
      </div>
    </Panel>
  );

  /* ---------- the verified TIMESHEET ---------- */
  const cols = '0.95fr 1fr 1.25fr 1.25fr 1.05fr';
  const Timesheet = (
    <Panel title="Verified Trip Timesheet" sub="June 2026 · camera-counted" flush
      right={<Tag s="ok">✓ Tamper-proof</Tag>} className="col" style={{ minHeight:0 }}>

      {/* verification seal — replaces the paper stamp + signature */}
      <div style={{ display:'flex', gap:16, alignItems:'center', padding:'14px 16px', borderBottom:'1px solid var(--line)',
        background:'linear-gradient(180deg, rgba(31,224,196,.10), rgba(31,224,196,.03))', boxShadow:'inset 0 0 0 1px var(--accent-line)' }}>
        <div className="qr" style={{ width:72, height:72, flex:'none' }} />
        <div className="col" style={{ flex:1, gap:5, minWidth:0 }}>
          <div className="row" style={{ gap:8, alignItems:'center' }}>
            <span className="label" style={{ color:'var(--accent-2)', fontSize:9.5 }}>Verified by camera · hash-chained · QR-scannable</span>
            <Tag s="ok">✓ chain intact</Tag>
          </div>
          <span style={{ fontSize:12.5, color:'var(--ink)', lineHeight:1.4 }}>This sheet <b>replaces the paper timesheet, stamp &amp; signature</b>. The number here is the number on the invoice.</span>
          <div className="row" style={{ gap:18, marginTop:1, flexWrap:'wrap' }}>
            <span className="mono" style={{ fontSize:11, color:'var(--ink2)' }}>Trips this period <b style={{ color:'var(--green)' }}><Num value={verified} live={live} /></b></span>
            <span className="hashline hash-ok" style={{ fontSize:10 }}>sheet hash 0x7f3a91c…e5a7</span>
          </div>
        </div>
        <div className="col" style={{ gap:6, flex:'none' }}>
          <Btn kind="primary" sm onClick={() => toast('Live count opened', `QR resolves to ${verified} camera-verified trips`, 'accent')}>Open live count</Btn>
          <Btn kind="ghost" sm onClick={() => { toast('Timesheet exported', 'PDF with embedded QR · sent to billing', 'good'); pushActivity('Exported verified timesheet — <b>PDF + QR</b>'); }}>Export sheet</Btn>
        </div>
      </div>

      {/* table header */}
      <div style={{ display:'grid', gridTemplateColumns:cols, gap:10, padding:'9px 16px', borderBottom:'1px solid var(--line)' }}>
        <span className="label" style={{ fontSize:8.5 }}>Truck</span>
        <span className="label" style={{ fontSize:8.5 }}>Route</span>
        <span className="label" style={{ fontSize:8.5 }}>Factory · empty → loaded</span>
        <span className="label" style={{ fontSize:8.5 }}>Site · loaded → empty</span>
        <span className="label" style={{ fontSize:8.5 }}>Verified</span>
      </div>

      {/* rows */}
      <div className="scrolly" style={{ flex:1 }}>
        {trips.map(t => {
          const st = TV_STATUS[t.status];
          const rej = t.status === 'rejected';
          return (
            <div key={t.id} className="lrow" style={{ display:'grid', gridTemplateColumns:cols, gap:10, alignItems:'center' }} onClick={() => rowDetail(t)}>
              <div className="col" style={{ gap:2, minWidth:0 }}>
                <span className="mono" style={{ fontSize:12, fontWeight:600 }}>{t.plate}</span>
                <span className="label" style={{ fontSize:8 }}>{t.sup}</span>
              </div>
              <span className="truncate label" style={{ fontSize:9 }}>{t.from} → {t.to}</span>
              {rej
                ? <span className="mono" style={{ fontSize:10.5, color:'var(--red)' }}>no camera record</span>
                : <span className="mono tnum" style={{ fontSize:11.5, color:'var(--ink2)' }}>{t.fIn} <span style={{ color:'var(--ink4)' }}>→</span> {t.fOut}</span>}
              {rej
                ? <span className="mono" style={{ fontSize:10.5, color:'var(--red)' }}>—</span>
                : <span className="mono tnum" style={{ fontSize:11.5, color: t.status==='suspended' ? 'var(--amber)' : 'var(--ink2)' }}>{t.sIn} <span style={{ color:'var(--ink4)' }}>→</span> {t.sOut}</span>}
              <div className="col" style={{ gap:3, alignItems:'flex-start' }}>
                <Tag s={st.s}>{st.label}</Tag>
                <span className="hashline hash-ok" style={{ fontSize:8.5, color: rej ? 'var(--ink4)' : 'var(--green)' }}>#{t.hash}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="between" style={{ padding:'10px 16px', borderTop:'1px solid var(--line)' }}>
        <span className="label" style={{ fontSize:8.5, color:'var(--green)' }}>● {verified} camera-verified · = the invoice</span>
        <span className="label" style={{ fontSize:8.5, color:'var(--ink4)' }}>no signatures · no stamps · no edits</span>
      </div>
    </Panel>
  );

  /* ---------- registry (right top) ---------- */
  const Registry = (
    <Panel title="Trucks We Know About" sub={trucks.length + ' shown · ' + V.registered + ' registered'} flush className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1 }}>
        {trucks.map(t => {
          const st = t.status === 'active' ? 'ok' : t.status === 'unregistered' ? 'crit' : t.status === 'suspended' ? 'warn' : t.status === 'unclaimed' ? 'info' : 'idle';
          return (
            <div key={t.plate} className="lrow" style={{ alignItems:'center', gap:11 }} onClick={() => toast(t.plate, `${t.supplier} · ${t.trips} trips today${t.note ? ' · ' + t.note : ''}`, st === 'crit' ? 'crit' : st === 'warn' ? 'warn' : 'good')}>
              <span style={{ color: stateColor[st === 'idle' ? 'idle' : st], flex:'none' }}><EqIcon type="truck" size={15} /></span>
              <div className="col" style={{ flex:1, gap:2, minWidth:0 }}>
                <span className="mono" style={{ fontSize:11.5, fontWeight:600 }}>{t.plate}</span>
                <span className="label truncate" style={{ fontSize:8, color: t.note ? stateColor[st] : 'var(--ink4)' }}>{t.supplier}{t.note ? ' · ' + t.note : ''}</span>
              </div>
              {t.status === 'unregistered'
                ? <Btn sm kind="primary" onClick={(e) => { e.stopPropagation(); registerTruck(t.plate); }}>Register</Btn>
                : <span className="mono tnum" style={{ fontSize:11, color:'var(--ink3)' }}>{t.trips}</span>}
            </div>
          );
        })}
      </div>
      <div className="between" style={{ padding:'8px 14px', borderTop:'1px solid var(--line)' }}>
        <span className="cam-id"><span className={cx('dot ok', live && 'live')} />{V.camsOnline} gate cameras</span>
        <span className="label" style={{ fontSize:8, color:'var(--ink4)' }}>unregistered = blocked</span>
      </div>
    </Panel>
  );

  /* ---------- alerts (right bottom) ---------- */
  const Alerts = (
    <Panel title="Verification Alerts" sub={openAlerts.length + ' open'} flush glowCrit={critOpen > 0}
      right={<Tag s="crit">{critOpen} critical</Tag>} className="col" style={{ minHeight:0 }}>
      <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:9 }}>
        {openAlerts.length === 0 &&
          <div className="col" style={{ alignItems:'center', justifyContent:'center', padding:'24px 0', gap:8 }}>
            <span className="dot ok" style={{ width:14, height:14 }} /><span className="label">All clear — every trip verified</span></div>}
        {alerts.map(a => {
          const done = a.status === 'resolved';
          return (
            <div key={a.id} className={cx('alert', a.sev, a.status==='escalated' && 'escalated', a.isNew && 'slidein', a.removing && 'removing')} style={{ flex:'none' }}>
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
                    </div>}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  return (
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 380px', gridTemplateRows:'auto minmax(0,1fr)', gap:14, gridTemplateAreas:'"kpis kpis" "sheet side"' }}>
      <div style={{ gridArea:'kpis' }}>{Kpis}</div>
      <div style={{ gridArea:'sheet', minHeight:0, display:'grid' }}>{Timesheet}</div>
      <div style={{ gridArea:'side', minHeight:0, display:'grid', gridTemplateRows:'minmax(0,0.95fr) minmax(0,1.05fr)', gap:14 }}>{Registry}{Alerts}</div>
    </div>
  );
}
window.ScreenVerify = ScreenVerify;
