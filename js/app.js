function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* ============================================================
   HT-OS — app shell · nav · live engine · toasts · router
   ============================================================ */
function clockStr(d) {
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
function hhmm() {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
function shortLabel(a) {
  const D = window.HTOS;
  const where = a.proj ? (D.projects.find(p => p.id === a.proj) || {}).name : a.fac ? (D.factories.find(f => f.id === a.fac) || {}).short : 'group';
  const catWord = (a.cat || '').split(' ')[0];
  return `${catWord} · ${where || 'group'}`;
}
const NAV = [{
  id: 'tower',
  n: '01',
  l: 'TOWER'
}, {
  id: 'project',
  n: '02',
  l: 'PROJECT'
}, {
  id: 'factory',
  n: '03',
  l: 'FLOOR'
}, {
  id: 'graph',
  n: '04',
  l: 'GRAPH'
}, {
  id: 'trust',
  n: '05',
  l: 'TRUST'
}, {
  id: 'sales',
  n: '06',
  l: 'SALES'
}, {
  id: 'store',
  n: '07',
  l: 'STORE'
}, {
  id: 'design',
  n: '08',
  l: 'DESIGN'
}, {
  id: 'people',
  n: '09',
  l: 'PEOPLE'
}, {
  id: 'fleet',
  n: '10',
  l: 'FLEET'
}, {
  id: 'finance',
  n: '11',
  l: 'FINANCE'
}];
const TITLES = {
  tower: 'Executive Control Tower',
  project: 'Project View',
  factory: 'Production Floor',
  graph: 'Knowledge Graph',
  trust: 'Trust & Verification',
  sales: 'Sales & Orders',
  store: 'Store & Procurement',
  design: 'Design & Engineering',
  people: 'People & HR',
  fleet: 'Fleet & Suppliers',
  finance: 'Finance & Accounts'
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
  const toast = useCallback((msg, sub, kind = 'accent') => {
    const id = ++toastId.current;
    setToasts(t => [...t, {
      id,
      msg,
      sub,
      kind
    }]);
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? {
      ...x,
      out: true
    } : x)), 2900);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3250);
  }, []);

  // ---- activity feed -----------------------------------------
  const actId = useRef(0);
  const [activity, setActivity] = useState(() => D.activitySeed.map(a => ({
    id: ++actId.current,
    t: a.t,
    html: a.html,
    isNew: false
  })));
  const pushActivity = useCallback(html => {
    const id = ++actId.current;
    setActivity(list => [{
      id,
      t: hhmm(),
      html,
      isNew: true
    }, ...list].slice(0, 40));
  }, []);

  // ---- alert queue (lifted so the nav badge reflects live state) ----
  const [alerts, setAlerts] = useState(() => D.alerts.map(a => ({
    ...a,
    status: 'open'
  })));
  const [cleared, setCleared] = useState(14);
  const incRef = useRef(0);
  const lastTick = useRef(0);
  const alertAct = useCallback((a, kind) => {
    if (kind === 'approve' || kind === 'resolve') {
      setAlerts(list => list.map(x => x.id === a.id ? {
        ...x,
        status: kind,
        isNew: false
      } : x));
      toast(kind === 'approve' ? 'Approved & signed off' : 'Resolved & closed', `${a.id} · ${a.owner} notified`, 'good');
      pushActivity(`${kind === 'approve' ? 'Approved' : 'Resolved'} <b>${a.id}</b> — ${shortLabel(a)}`);
      setTimeout(() => {
        setAlerts(list => list.map(x => x.id === a.id ? {
          ...x,
          removing: true
        } : x));
        setTimeout(() => {
          setAlerts(list => list.filter(x => x.id !== a.id));
          setCleared(c => c + 1);
        }, 520);
      }, 900);
    } else if (kind === 'escalate') {
      setAlerts(list => {
        const t = list.find(x => x.id === a.id);
        if (!t) return list;
        const rest = list.filter(x => x.id !== a.id);
        return [{
          ...t,
          status: 'escalated',
          isNew: false
        }, ...rest];
      });
      toast('Escalated', `Routed to ${a.owner}`, 'warn');
      pushActivity(`Escalated <b>${a.id}</b> to ${a.owner}`);
    } else if (kind === 'flag') {
      setAlerts(list => list.map(x => x.id === a.id ? {
        ...x,
        flagged: !x.flagged,
        isNew: false
      } : x));
      toast(a.flagged ? 'Flag cleared' : 'Flagged for review', `${a.id} ${a.flagged ? 'removed from' : 'added to'} watchlist`, 'accent');
      pushActivity(`${a.flagged ? 'Unflagged' : 'Flagged'} <b>${a.id}</b> — ${shortLabel(a)}`);
    }
  }, [toast, pushActivity]);

  // clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
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
      setAlerts(list => [{
        ...a,
        status: 'open',
        isNew: true,
        cat: `${a.cat} · ${hhmm()}`
      }, ...list]);
      pushActivity(`New ${a.sev === 'crit' ? 'critical' : a.sev} alert — ${shortLabel(a)}`);
    }
  }, [tick, live, pushActivity]);
  const go = (s, p) => {
    setScreen(s);
    if (p) setParam(p);
    const m = document.querySelector('.main');
    if (m) m.scrollTop = 0;
  };
  const critOpen = alerts.filter(a => a.sev === 'crit' && a.status !== 'approved' && a.status !== 'resolved').length;
  const salesCrit = D.salesAlerts.filter(a => a.sev === 'crit').length;
  const storeLow = D.materials.filter(m => m.stock < m.reorder).length;
  const designCrit = D.designAlerts.filter(a => a.sev === 'crit').length;
  const peopleCrit = D.peopleAlerts.filter(a => a.sev === 'crit').length;
  const fleetCrit = D.fleetAlerts.filter(a => a.sev === 'crit').length;
  const financeCrit = D.financeAlerts.filter(a => a.sev === 'crit').length;
  const navBadge = {
    tower: critOpen,
    sales: salesCrit,
    store: storeLow,
    design: designCrit,
    people: peopleCrit,
    fleet: fleetCrit,
    finance: financeCrit
  };
  const common = {
    live,
    tick,
    go,
    toast,
    pushActivity
  };
  const screens = {
    tower: () => /*#__PURE__*/React.createElement(ScreenTower, _extends({}, common, {
      activity: activity,
      alerts: alerts,
      alertAct: alertAct,
      cleared: cleared
    })),
    project: () => /*#__PURE__*/React.createElement(ScreenProject, _extends({}, common, {
      pid: param
    })),
    factory: () => /*#__PURE__*/React.createElement(ScreenFactory, common),
    graph: () => /*#__PURE__*/React.createElement(ScreenGraph, common),
    trust: () => /*#__PURE__*/React.createElement(ScreenTrust, common),
    sales: () => /*#__PURE__*/React.createElement(ScreenSales, common),
    store: () => /*#__PURE__*/React.createElement(ScreenStore, common),
    design: () => /*#__PURE__*/React.createElement(ScreenDesign, common),
    people: () => /*#__PURE__*/React.createElement(ScreenPeople, common),
    fleet: () => /*#__PURE__*/React.createElement(ScreenFleet, common),
    finance: () => /*#__PURE__*/React.createElement(ScreenFinance, common)
  };
  return /*#__PURE__*/React.createElement("div", {
    className: cx('app', !live && 'paused')
  }, /*#__PURE__*/React.createElement("div", {
    className: "brandcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brandmark"
  }, /*#__PURE__*/React.createElement("span", null, "HT"))), /*#__PURE__*/React.createElement("div", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logoplate",
    title: "Hi-Tech Concrete Products"
  }, /*#__PURE__*/React.createElement("img", {
    src: "uploads/hitech.png",
    alt: "Hi-Tech Concrete Products"
  })), /*#__PURE__*/React.createElement("div", {
    className: "wordmark",
    style: {
      marginLeft: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ht"
  }, "HT"), /*#__PURE__*/React.createElement("span", {
    className: "os"
  }, "\xB7OS")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 26,
      background: 'var(--line)',
      margin: '0 8px 0 12px'
    }
  }), (() => {
    const ni = NAV.find(i => i.id === screen) || {};
    return /*#__PURE__*/React.createElement("div", {
      className: "loc",
      title: 'You are here · ' + TITLES[screen]
    }, /*#__PURE__*/React.createElement("span", {
      className: "loc-n"
    }, ni.n), /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "loc-k"
    }, "Now viewing"), /*#__PURE__*/React.createElement("span", {
      className: "loc-t"
    }, TITLES[screen])));
  })(), /*#__PURE__*/React.createElement("span", {
    className: "spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "clock"
  }, /*#__PURE__*/React.createElement("span", null, "ABU DHABI"), /*#__PURE__*/React.createElement("b", {
    className: "tnum"
  }, clockStr(now)), /*#__PURE__*/React.createElement("span", null, "GST")), /*#__PURE__*/React.createElement("button", {
    className: cx('live-toggle', live && 'on'),
    onClick: () => setLive(v => !v),
    title: live ? 'Pause live data' : 'Resume live data'
  }, /*#__PURE__*/React.createElement("span", {
    className: "ld"
  }), live ? 'LIVE' : 'PAUSED')), /*#__PURE__*/React.createElement("div", {
    className: "nav"
  }, NAV.map(item => /*#__PURE__*/React.createElement("button", {
    key: item.id,
    className: cx('nav-btn', screen === item.id && 'active'),
    onClick: () => go(item.id),
    title: TITLES[item.id]
  }, navBadge[item.id] > 0 && /*#__PURE__*/React.createElement("span", {
    className: "nb"
  }, navBadge[item.id]), /*#__PURE__*/React.createElement("span", {
    className: "nav-num"
  }, item.n), /*#__PURE__*/React.createElement("span", {
    className: "nl"
  }, item.l))), /*#__PURE__*/React.createElement("span", {
    className: "sp"
  }), /*#__PURE__*/React.createElement("div", {
    className: "nav-mini mono",
    title: "System nominal",
    style: {
      color: 'var(--green)'
    }
  }, "\u25C7")), /*#__PURE__*/React.createElement("div", {
    className: "main"
  }, screens[screen] ? screens[screen]() : null), /*#__PURE__*/React.createElement(Toasts, {
    items: toasts
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));