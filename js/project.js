/* ============================================================
   HT-OS — Screen 2 · Project View (drill-in)  (window.ScreenProject)
   ============================================================ */
const STAGEP = {
  design: 'Design',
  approve: 'Approvals',
  production: 'Production',
  install: 'Installation',
  delivery: 'Delivery'
};
function ScreenProject({
  live,
  tick,
  go,
  toast,
  pushActivity,
  pid
}) {
  const D = window.HTOS;
  const p = D.projects.find(x => x.id === pid) || D.projects[0];

  // chain: use detailed yasChain for Yas Acres, else derive from pct
  const chain = p.id === 'YAS' ? D.yasChain : [{
    k: 'Design',
    pct: Math.min(100, p.pct * 2.2),
    state: p.pct > 10 ? 'done' : 'active',
    meta: 'IFC drawings'
  }, {
    k: 'Approvals',
    pct: Math.min(100, p.pct * 1.9),
    state: p.pct > 20 ? 'done' : 'active',
    meta: 'consultant sign-off'
  }, {
    k: 'Production',
    pct: Math.min(100, p.pct * 1.3),
    state: p.pct > 30 && p.pct < 90 ? 'active' : p.pct >= 90 ? 'done' : 'idle',
    meta: fmt(p.done) + ' / ' + fmt(p.elements) + ' cast'
  }, {
    k: 'Delivery',
    pct: Math.max(0, p.pct - 12),
    state: p.pct > 50 ? 'active' : 'idle',
    meta: 'to site'
  }, {
    k: 'Install',
    pct: Math.max(0, p.pct - 18),
    state: p.pct > 80 ? 'active' : 'idle',
    meta: 'on site'
  }];
  const els = p.id === 'YAS' ? D.yasElements : D.yasElements.slice(0, 5);
  const risks = p.id === 'YAS' ? D.yasRisks : [{
    id: 'r1',
    sev: p.risk,
    t: p.risk === 'crit' ? 'Approval blocking production' : p.risk === 'warn' ? 'Schedule float tightening' : 'On programme',
    m: p.desc
  }, {
    id: 'r2',
    sev: 'ok',
    t: 'Plant capacity secured',
    m: 'Allocated to ' + (D.factories.find(f => f.id === p.plant) || {}).short
  }];
  const stageColor = {
    Installed: 'ok',
    Loaded: 'ok',
    Stored: 'ok',
    Cured: 'ok',
    Cast: 'ok',
    QC: 'warn',
    Quarantine: 'crit'
  };

  // live element churn
  const [done, setDone] = useState(p.done);
  useEffect(() => {
    if (live && tick > 0 && p.stage === 'production') setDone(d => Math.min(p.elements, d + Math.round(1 + Math.random() * 3)));
  }, [tick]);
  const riskAct = (r, kind) => {
    if (kind === 'escalate') {
      toast('Risk escalated', `${r.t} · routed to Project Director`, 'warn');
      pushActivity(`Escalated risk — <b>${p.name}</b>`);
    } else {
      toast('Risk acknowledged', `${r.t} · on watchlist`, 'good');
      pushActivity(`Acknowledged risk — <b>${p.name}</b>`);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "screen pad fade-in",
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 330px',
      gridTemplateRows: 'auto auto 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    glow: p.risk !== 'crit',
    glowCrit: p.risk === 'crit'
  }, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 9
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
  }, "\u2190 Tower"), /*#__PURE__*/React.createElement(Tag, {
    s: p.risk
  }, p.risk === 'crit' ? 'At risk' : p.risk === 'warn' ? 'Watch' : 'On track'), /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, STAGEP[p.stage], " phase")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, p.client), /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "\u25C7 ", p.emirate), /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "PLANT \xB7 ", (D.factories.find(f => f.id === p.plant) || {}).short))), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 26,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Contract value",
    value: /*#__PURE__*/React.createElement("span", null, "AED ", p.value, /*#__PURE__*/React.createElement("span", {
      className: "kpi-unit"
    }, " M")),
    size: 26
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Elements",
    value: /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Num, {
      value: done,
      live: live
    }), "/", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ink3)'
      }
    }, fmt(p.elements))),
    size: 22
  }), /*#__PURE__*/React.createElement(Ring, {
    value: p.pct,
    size: 92,
    stroke: 8,
    label: p.pct + '%',
    sub: "complete",
    color: p.risk === 'crit' ? 'var(--red)' : p.risk === 'warn' ? 'var(--amber)' : 'var(--green)'
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Delivery Chain",
    sub: "design \u2192 approvals \u2192 production \u2192 delivery \u2192 installation"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chain",
    style: {
      marginTop: 6,
      marginBottom: 4
    }
  }, chain.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.k,
    className: cx('node', c.state)
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "link"
  }), /*#__PURE__*/React.createElement("span", {
    className: "knob"
  }, c.state === 'done' ? '✓' : i + 1), /*#__PURE__*/React.createElement("span", {
    className: "clabel"
  }, c.k), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 15,
      color: c.state === 'idle' ? 'var(--ink3)' : 'var(--ink)'
    }
  }, Math.round(c.pct), "%"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8,
      textAlign: 'center',
      color: 'var(--ink4)',
      maxWidth: 120
    }
  }, c.meta)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 0,
      display: 'grid'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Elements In Progress",
    sub: els.length + ' tracked',
    flush: true,
    right: /*#__PURE__*/React.createElement(Btn, {
      kind: "ghost",
      sm: true,
      onClick: () => go('factory')
    }, "Floor \u2192"),
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr 1fr 0.9fr',
      padding: '9px 14px',
      borderBottom: '1px solid var(--line)'
    }
  }, ['Element', 'Type · Zone', 'Stage', 'Status'].map(h => /*#__PURE__*/React.createElement("span", {
    key: h,
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, h))), /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1
    }
  }, els.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.id,
    className: "lrow",
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr 1fr 0.9fr',
      alignItems: 'center'
    },
    onClick: () => go('factory')
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, e.id), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, e.type), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, e.zone)), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: stateColor[stageColor[e.stage] || 'info']
    }
  }, e.stage), /*#__PURE__*/React.createElement(Tag, {
    s: e.s
  }, e.eta)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 0,
      display: 'grid'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Risks & Delays",
    sub: "auto-flagged",
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
  }, risks.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    className: cx('alert', r.sev)
  }, /*#__PURE__*/React.createElement("div", {
    className: "ico"
  }, /*#__PURE__*/React.createElement(Code, {
    s: r.sev
  }, r.sev === 'crit' ? '!!' : r.sev === 'warn' ? '!' : '✓')), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 5,
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 500
    }
  }, r.t), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 9,
      color: 'var(--ink3)',
      letterSpacing: '.02em'
    }
  }, r.m), r.sev !== 'ok' && /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: r.sev === 'crit' ? 'danger' : 'warn',
    onClick: () => riskAct(r, 'escalate')
  }, "Escalate"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => riskAct(r, 'ack')
  }, "Acknowledge"))))), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 8,
      padding: 12,
      border: '1px solid var(--line)',
      borderRadius: 8,
      background: 'var(--panel2)',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Programme vs baseline"), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 9
    }
  }, "Schedule"), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: p.risk === 'crit' ? 'var(--red)' : 'var(--green)'
    }
  }, p.risk === 'crit' ? '-6 days' : p.risk === 'warn' ? '-1 day' : 'on time')), /*#__PURE__*/React.createElement(Bar, {
    value: p.pct,
    s: p.risk === 'crit' ? 'crit' : p.risk === 'warn' ? 'warn' : 'ok',
    thick: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 9
    }
  }, "Delivered today"), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum"
  }, p.delToday, " elements"))), /*#__PURE__*/React.createElement(Btn, {
    kind: "primary",
    onClick: () => go('trust')
  }, "Verify deliveries \u2192")))));
}
window.ScreenProject = ScreenProject;