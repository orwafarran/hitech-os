/* ============================================================
   HT-OS — app shell · nav · live engine · toasts · router
   ============================================================ */
function clockStr(d) {
  return d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
function hhmm() {
  return new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}
function shortLabel(a) {
  const D = window.HTOS;
  const where = a.proj ? (D.projects.find(p => p.id === a.proj) || {}).name
              : a.fac ? (D.factories.find(f => f.id === a.fac) || {}).short : 'group';
  const catWord = (a.cat || '').split(' ')[0];
  return `${catWord} · ${where || 'group'}`;
}

const NAV = [
  { id:'tower',   l:'TOWER' },
  { id:'project', l:'PROJECT' },
  { id:'verify',  l:'TRUCKS' },
  { id:'factory', l:'FLOOR' },
  { id:'graph',   l:'GRAPH' },
  { id:'trust',   l:'TRUST' },
  { id:'sales',   l:'SALES' },
  { id:'store',   l:'STORE' },
  { id:'design',  l:'DESIGN' },
  { id:'people',  l:'PEOPLE' },
  { id:'fleet',   l:'FLEET' },
  { id:'finance', l:'FINANCE' },
];
const navNum = (id) => String(NAV.findIndex(i => i.id === id) + 1).padStart(2, '0');
const TITLES = {
  tower:'Executive Control Tower', project:'Project View', verify:'Truck Trip Verification',
  factory:'Production Floor', graph:'Knowledge Graph', trust:'Trust & Verification',
  sales:'Sales & Orders', store:'Store & Procurement',
  design:'Design & Engineering', people:'People & HR',
  fleet:'Fleet & Suppliers', finance:'Finance & Accounts',
};

function App() {
  const D = window.HTOS;
  const [screen, setScreen] = useState('tower');
  const [param, setParam] = useState('YAS');
  const [live, setLive] = useState(true);
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(new Date());

  // ---- toasts -------------------------------------------------
  const toastId = useRef(0);
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, sub, kind='accent') => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, sub, kind }]);
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? { ...x, out:true } : x)), 2900);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3250);
  }, []);

  // ---- activity feed -----------------------------------------
  const actId = useRef(0);
  const [activity, setActivity] = useState(() => D.activitySeed.map(a => ({ id:++actId.current, t:a.t, html:a.html, isNew:false })));
  const pushActivity = useCallback((html) => {
    const id = ++actId.current;
    setActivity(list => [{ id, t:hhmm(), html, isNew:true }, ...list].slice(0, 40));
  }, []);

  // ---- alert queue (lifted so the nav badge reflects live state) ----
  const [alerts, setAlerts] = useState(() => D.alerts.map(a => ({ ...a, status:'open' })));
  const [cleared, setCleared] = useState(14);
  const incRef = useRef(0);
  const lastTick = useRef(0);

  const alertAct = useCallback((a, kind) => {
    if (kind === 'approve' || kind === 'resolve') {
      setAlerts(list => list.map(x => x.id === a.id ? { ...x, status:kind, isNew:false } : x));
      toast(kind === 'approve' ? 'Approved & signed off' : 'Resolved & closed', `${a.id} · ${a.owner} notified`, 'good');
      pushActivity(`${kind === 'approve' ? 'Approved' : 'Resolved'} <b>${a.id}</b> — ${shortLabel(a)}`);
      setTimeout(() => {
        setAlerts(list => list.map(x => x.id === a.id ? { ...x, removing:true } : x));
        setTimeout(() => { setAlerts(list => list.filter(x => x.id !== a.id)); setCleared(c => c + 1); }, 520);
      }, 900);
    } else if (kind === 'escalate') {
      setAlerts(list => { const t = list.find(x => x.id === a.id); if (!t) return list; const rest = list.filter(x => x.id !== a.id); return [{ ...t, status:'escalated', isNew:false }, ...rest]; });
      toast('Escalated', `Routed to ${a.owner}`, 'warn');
      pushActivity(`Escalated <b>${a.id}</b> to ${a.owner}`);
    } else if (kind === 'flag') {
      setAlerts(list => list.map(x => x.id === a.id ? { ...x, flagged:!x.flagged, isNew:false } : x));
      toast(a.flagged ? 'Flag cleared' : 'Flagged for review', `${a.id} ${a.flagged ? 'removed from' : 'added to'} watchlist`, 'accent');
      pushActivity(`${a.flagged ? 'Unflagged' : 'Flagged'} <b>${a.id}</b> — ${shortLabel(a)}`);
    }
  }, [toast, pushActivity]);

  // clock
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  // live tick engine
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setTick(k => k + 1), 2200);
    return () => clearInterval(t);
  }, [live]);
  // live alert slide-in (every 3rd tick, drains the incoming pool)
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    if (tick % 3 === 0 && incRef.current < D.incoming.length) {
      const a = D.incoming[incRef.current++];
      setAlerts(list => [{ ...a, status:'open', isNew:true, cat:`${a.cat} · ${hhmm()}` }, ...list]);
      pushActivity(`New ${a.sev === 'crit' ? 'critical' : a.sev} alert — ${shortLabel(a)}`);
    }
  }, [tick, live, pushActivity]);

  const go = (s, p) => { setScreen(s); if (p) setParam(p); const m = document.querySelector('.main'); if (m) m.scrollTop = 0; };

  const critOpen = alerts.filter(a => a.sev === 'crit' && a.status !== 'approved' && a.status !== 'resolved').length;

  const salesCrit = D.salesAlerts.filter(a => a.sev === 'crit').length;
  const storeLow = D.materials.filter(m => m.stock < m.reorder).length;
  const designCrit = D.designAlerts.filter(a => a.sev === 'crit').length;
  const peopleCrit = D.peopleAlerts.filter(a => a.sev === 'crit').length;
  const fleetCrit = D.fleetAlerts.filter(a => a.sev === 'crit').length;
  const financeCrit = D.financeAlerts.filter(a => a.sev === 'crit').length;
  const verifyCrit = D.verifyAlerts.filter(a => a.sev === 'crit').length;
  const navBadge = { tower: critOpen, verify: verifyCrit, sales: salesCrit, store: storeLow, design: designCrit, people: peopleCrit, fleet: fleetCrit, finance: financeCrit };

  const common = { live, tick, go, toast, pushActivity };
  const screens = {
    tower:   () => <ScreenTower {...common} activity={activity} alerts={alerts} alertAct={alertAct} cleared={cleared} />,
    project: () => <ScreenProject {...common} pid={param} />,
    verify:  () => <ScreenVerify {...common} />,
    factory: () => <ScreenFactory {...common} />,
    graph:   () => <ScreenGraph {...common} />,
    trust:   () => <ScreenTrust {...common} />,
    sales:   () => <ScreenSales {...common} />,
    store:   () => <ScreenStore {...common} />,
    design:  () => <ScreenDesign {...common} />,
    people:  () => <ScreenPeople {...common} />,
    fleet:   () => <ScreenFleet {...common} />,
    finance: () => <ScreenFinance {...common} />,
  };

  return (
    <div className={cx('app', !live && 'paused')}>
      {/* brand */}
      <div className="brandcell">
        <div className="brandmark"><span>HT</span></div>
      </div>

      {/* topbar */}
      <div className="topbar">
        <div className="logoplate" title="Hi-Tech Concrete Products">
          <img src="uploads/hitech.png" alt="Hi-Tech Concrete Products" />
        </div>
        <div className="wordmark" style={{ marginLeft:4 }}>
          <span className="ht">HT</span><span className="os">·OS</span>
        </div>
        <span style={{ width:1, height:26, background:'var(--line)', margin:'0 8px 0 12px' }} />
        {(() => {
          const ni = NAV.find(i => i.id === screen) || {};
          return (
            <div className="loc" title={'You are here · ' + TITLES[screen]}>
              <span className="loc-n">{navNum(screen)}</span>
              <div className="col" style={{ gap:0 }}>
                <span className="loc-k">Now viewing</span>
                <span className="loc-t">{TITLES[screen]}</span>
              </div>
            </div>
          );
        })()}
        <span className="spacer" />
        <div className="clock">
          <span>ABU DHABI</span><b className="tnum">{clockStr(now)}</b><span>GST</span>
        </div>
        <button className={cx('live-toggle', live && 'on')} onClick={() => setLive(v => !v)} title={live ? 'Pause live data' : 'Resume live data'}>
          <span className="ld" />{live ? 'LIVE' : 'PAUSED'}
        </button>
      </div>

      {/* nav rail */}
      <div className="nav">
        {NAV.map(item => (
          <button key={item.id} className={cx('nav-btn', screen===item.id && 'active')} onClick={() => go(item.id)} title={TITLES[item.id]}>
            {navBadge[item.id] > 0 && <span className="nb">{navBadge[item.id]}</span>}
            <span className="nav-num">{navNum(item.id)}</span>
            <span className="nl">{item.l}</span>
          </button>
        ))}
        <span className="sp" />
        <div className="nav-mini mono" title="System nominal" style={{ color:'var(--green)' }}>◇</div>
      </div>

      {/* main */}
      <div className="main">
        {screens[screen] ? screens[screen]() : null}
      </div>

      {/* global toasts */}
      <Toasts items={toasts} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
