/* ============================================================
   HT-OS — Screen 3 · Production Floor  (window.ScreenFactory)
   Lines, element "passport", predictive maintenance & QC flags.
   ============================================================ */
function ScreenFactory({
  live,
  tick,
  go,
  toast,
  pushActivity
}) {
  const D = window.HTOS;
  const P = D.passport;
  const stages = D.passportStages;
  const [loads, setLoads] = useState(D.lines.map(l => l.load));
  const baseOut = D.lines.reduce((a, l) => a + l.out, 0);
  const [tout, setTout] = useState(baseOut);
  useEffect(() => {
    if (!live || tick === 0) return;
    setLoads(ls => ls.map((v, i) => D.lines[i].status === 'idle' ? v : Math.max(40, Math.min(99, v + Math.round((Math.random() - 0.45) * 6)))));
    setTout(o => Math.min(baseOut + 150, o + Math.round(2 + Math.random() * 7)));
  }, [tick]);

  // maintenance / QC action state
  const [disp, setDisp] = useState({});
  const [quar, setQuar] = useState(false);
  const dispatch = m => {
    setDisp(d => ({
      ...d,
      [m.id]: true
    }));
    toast('Technician dispatched', `${(D.factories.find(f => f.id === m.fac) || {}).short} · ETA 40 min`, m.sev === 'crit' ? 'crit' : 'warn');
    pushActivity(`Dispatched technician — <b>${(D.factories.find(f => f.id === m.fac) || {}).short}</b>`);
  };

  // element passport — advances a stage when QC is approved
  const [cur, setCur] = useState(P.current);
  const [events, setEvents] = useState(P.events);
  const [qcDone, setQcDone] = useState(false);
  const approveQc = () => {
    if (qcDone) return;
    setQcDone(true);
    setCur(c => c + 1);
    setEvents(ev => [...ev.map(e => ({
      ...e,
      active: false
    })), {
      stage: 'Stored',
      t: hhmm() + ' today',
      who: 'QC approved · cleared to bay',
      hash: 'b8c1'
    }]);
    toast('QC approved', `${P.id} cleared to Stored`, 'good');
    pushActivity(`Approved QC — <b>${P.id}</b> cleared to Stored`);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "screen pad fade-in",
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 360px',
      gridTemplateRows: 'auto auto 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "ghost",
    sm: true,
    onClick: () => go('tower')
  }, "\u2190 Tower"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 600
    }
  }, "ICAD II \u2014 Mussafah"), /*#__PURE__*/React.createElement(Tag, {
    s: "ok"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot ok live"
  }), "Running")), /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Flagship plant \xB7 6 lines \xB7 hollowcore + fa\xE7ade + structural")), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Output today",
    value: /*#__PURE__*/React.createElement(Num, {
      value: tout,
      live: live
    }),
    unit: "m\xB3",
    size: 26
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Lines running",
    value: "5 / 6",
    size: 26
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Plant OEE",
    value: "91%",
    size: 26
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "QC pass rate",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--accent)'
      }
    }, "96.4%"),
    size: 26
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / 2'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Production Lines",
    sub: "live load",
    right: live && /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        color: 'var(--accent)'
      }
    }, "\u25CF LIVE")
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 11
    }
  }, D.lines.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: l.id,
    className: cx('ftile', l.status === 'warn' && 'warn'),
    style: {
      padding: '12px 13px',
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    },
    onClick: () => toast(l.name, `${loads[i]}% load · ${l.el !== '—' ? 'casting ' + l.el : 'idle — ' + (l.flag || '')}`, l.status === 'warn' ? 'warn' : l.status === 'idle' ? 'accent' : 'good')
  }, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono truncate",
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, l.name), /*#__PURE__*/React.createElement(Dot, {
    s: l.status,
    live: live && l.status === 'warn'
  })), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      alignItems: 'flex-end',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, "Line load"), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 20,
      lineHeight: 1,
      color: l.status === 'idle' ? 'var(--ink3)' : 'var(--ink)'
    }
  }, loads[i], "%")), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      alignItems: 'flex-end',
      gap: 2,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, l.out, " m\xB3"), /*#__PURE__*/React.createElement("span", {
    className: "mono truncate",
    style: {
      fontSize: 10,
      color: 'var(--ink3)',
      maxWidth: 96
    }
  }, l.el))), /*#__PURE__*/React.createElement(Bar, {
    value: loads[i],
    s: l.status === 'warn' ? 'warn' : l.status === 'idle' ? '' : 'ok',
    thick: true
  }), l.flag && /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: cx('dot', l.status === 'idle' ? 'idle' : 'warn'),
    style: {
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "label truncate",
    style: {
      fontSize: 8.5,
      color: l.status === 'idle' ? 'var(--ink3)' : 'var(--amber)'
    }
  }, l.flag))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '2 / 3',
      gridRow: '2 / 4',
      minHeight: 0,
      display: 'grid'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Predictive & Quality Flags",
    sub: "auto-detected",
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      color: 'var(--ink3)'
    }
  }, "Predictive Maintenance"), D.maintenance.map(m => /*#__PURE__*/React.createElement("div", {
    key: m.id,
    className: cx('alert', m.sev)
  }, /*#__PURE__*/React.createElement("div", {
    className: "ico"
  }, /*#__PURE__*/React.createElement(Code, {
    s: m.sev
  }, "MX")), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 4,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5
    }
  }, m.t), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, (D.factories.find(f => f.id === m.fac) || {}).short), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: stateColor[m.sev]
    }
  }, "fail in ", m.risk)), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6,
      marginTop: 2
    }
  }, disp[m.id] ? /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "good",
    disabled: true
  }, "\u2713 Tech dispatched") : /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: m.sev === 'crit' ? 'danger' : 'warn',
    onClick: () => dispatch(m)
  }, "Dispatch tech"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => {
      toast('Maintenance scheduled', `${m.t} · next window`, 'accent');
      pushActivity(`Scheduled maintenance — <b>${(D.factories.find(f => f.id === m.fac) || {}).short}</b>`);
    }
  }, "Schedule"))))), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      color: 'var(--ink3)',
      marginTop: 4
    }
  }, "Quality Control"), /*#__PURE__*/React.createElement("div", {
    className: "alert warn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ico"
  }, /*#__PURE__*/React.createElement(Code, {
    s: "warn"
  }, "QC")), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 4,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5
    }
  }, "Line 2 fa\xE7ade \u2014 strength variance trending up"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "Last 6 pours within tolerance \xB7 monitor"))), /*#__PURE__*/React.createElement("div", {
    className: "alert crit"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ico"
  }, /*#__PURE__*/React.createElement(Code, {
    s: "crit"
  }, "QC")), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 4,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5
    }
  }, "YA-FP-117 quarantined \u2014 28-day fail"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6,
      marginTop: 2
    }
  }, quar ? /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "good",
    disabled: true
  }, "\u2713 Quarantined") : /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "danger",
    onClick: () => {
      setQuar(true);
      toast('Batch quarantined', 'YA-FP-117 · re-cast scheduled', 'crit');
      pushActivity('Quarantined <b>YA-FP-117</b> — re-cast scheduled');
    }
  }, "Quarantine"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => go('project', 'YAS')
  }, "Project \u2192"))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / 2',
      minHeight: 0,
      display: 'grid'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Element Passport",
    sub: P.id,
    glow: true,
    right: /*#__PURE__*/React.createElement("span", {
      className: "chip"
    }, P.type),
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "chain",
    style: {
      marginTop: 4,
      marginBottom: 16
    }
  }, stages.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s,
    className: cx('node', i < cur && 'done', i === cur && 'active')
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "link"
  }), /*#__PURE__*/React.createElement("span", {
    className: "knob",
    style: {
      width: 26,
      height: 26,
      fontSize: 10
    }
  }, i < cur ? '✓' : i + 1), /*#__PURE__*/React.createElement("span", {
    className: "clabel",
    style: {
      fontSize: 8.5
    }
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 10,
      marginBottom: 14
    }
  }, [['Project', P.project], ['Plant', P.plant], ['Weight', P.weight], ['Mould', P.mould]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "col",
    style: {
      gap: 3,
      padding: '8px 10px',
      border: '1px solid var(--line)',
      borderRadius: 6,
      background: 'var(--panel2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12
    }
  }, v)))), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      color: 'var(--ink3)'
    }
  }, "Signed event trail"), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 0,
      marginTop: 8
    }
  }, events.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: cx('between', i === events.length - 1 && qcDone && 'flash-good'),
    style: {
      padding: '9px 0',
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: cx('dot', e.active ? 'warn' : 'ok')
  }), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, e.stage), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, e.who))), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      alignItems: 'flex-end',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--ink3)'
    }
  }, e.t), /*#__PURE__*/React.createElement("span", {
    className: "hashline hash-ok",
    style: {
      fontSize: 9
    }
  }, "#", e.hash))))), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      marginTop: 12
    }
  }, qcDone ? /*#__PURE__*/React.createElement(Btn, {
    kind: "good",
    sm: true,
    disabled: true
  }, "\u2713 QC approved") : /*#__PURE__*/React.createElement(Btn, {
    kind: "good",
    sm: true,
    onClick: approveQc
  }, "Approve QC"), /*#__PURE__*/React.createElement(Btn, {
    kind: "ghost",
    sm: true,
    onClick: () => go('trust')
  }, "View delivery proof \u2192"))))));
}
window.ScreenFactory = ScreenFactory;