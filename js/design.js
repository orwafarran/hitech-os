/* ============================================================
   HT-OS — Screen 8 · Design & Engineering  (window.ScreenDesign)
   BIM, drawing register, consultant approvals (SLA), clash detection.
   ============================================================ */
const DSTAT = {
  ifc: ['ok', 'IFC'],
  approved: ['ok', 'Approved'],
  review: ['accent', 'In review'],
  pending: ['crit', 'Pending'],
  design: ['warn', 'In design']
};
function ScreenDesign({
  live,
  tick,
  go,
  toast,
  pushActivity
}) {
  const D = window.HTOS;
  const projName = id => (D.projects.find(p => p.id === id) || {}).name || id;
  const [approvals, setApprovals] = useState(() => D.designApprovals.map(a => ({
    ...a
  })));
  const [clashes, setClashes] = useState(() => D.designClashes.map(c => ({
    ...c
  })));
  const [alerts, setAlerts] = useState(() => D.designAlerts.map(a => ({
    ...a,
    status: 'open'
  })));
  const [ifc, setIfc] = useState(D.designStats.ifcIssued);
  const [approvedToday, setApprovedToday] = useState(31);
  const [tab, setTab] = useState('approvals');
  const incRef = useRef(0);
  const lastTick = useRef(0);

  // live: drawings keep being issued; BIM keeps scanning → a new clash can auto-surface
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    if (tick % 3 === 0) setIfc(v => v + 1);
    if (tick % 7 === 0 && incRef.current < D.designIncoming.length) {
      const c = D.designIncoming[incRef.current++];
      setClashes(cs => [{
        ...c,
        isNew: true
      }, ...cs]);
      toast('Clash auto-detected', `${projName(c.proj)} · ${c.desc}`, 'warn');
      pushActivity(`BIM clash auto-detected — <b>${projName(c.proj)}</b>`);
    }
  }, [tick, live]);
  const approveDwg = a => {
    setApprovals(list => list.filter(x => x.id !== a.id));
    setApprovedToday(n => n + 1);
    toast('Drawing approved', `${a.desc} · IFC released`, 'good');
    pushActivity(`Approved drawing — <b>${projName(a.proj)}</b> ${a.desc}`);
  };
  const escalateApr = a => {
    toast('Escalated to consultant', `${a.desc} · SLA breach logged`, 'warn');
    pushActivity(`Escalated approval — <b>${projName(a.proj)}</b>`);
  };
  const assignClash = c => {
    setClashes(list => list.map(x => x.id === c.id ? {
      ...x,
      assigned: true
    } : x));
    toast('Clash assigned', `${c.desc} · routed to ${c.disc.split(' ')[0]} lead`, 'accent');
    pushActivity(`Assigned clash — <b>${projName(c.proj)}</b>`);
  };
  const resolveClash = c => {
    setClashes(list => list.map(x => x.id === c.id ? {
      ...x,
      removing: true
    } : x));
    setTimeout(() => setClashes(list => list.filter(x => x.id !== c.id)), 520);
    toast('Clash resolved', `${c.desc} · model updated`, 'good');
    pushActivity(`Resolved clash — <b>${projName(c.proj)}</b>`);
  };
  const resolveAlert = a => {
    setAlerts(list => list.map(x => x.id === a.id ? {
      ...x,
      status: 'resolved'
    } : x));
    setTimeout(() => {
      setAlerts(list => list.map(x => x.id === a.id ? {
        ...x,
        removing: true
      } : x));
      setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520);
    }, 800);
  };
  const alertAct = (a, kind) => {
    if (kind === 'escalate' || kind === 'primary' && a.primary.label === 'Escalate') {
      setAlerts(list => {
        const t = list.find(x => x.id === a.id);
        if (!t) return list;
        return [{
          ...t,
          status: 'escalated'
        }, ...list.filter(x => x.id !== a.id)];
      });
      toast('Escalated', `Routed to ${a.owner}`, 'warn');
      pushActivity(`Escalated <b>${a.id}</b> to ${a.owner}`);
    } else if (kind === 'primary') {
      toast(a.primary.label, `${a.id} · actioned`, a.primary.kind === 'good' ? 'good' : 'accent');
      pushActivity(`${a.primary.label} — <b>${a.id}</b>`);
      resolveAlert(a);
    } else {
      toast('Resolved & closed', `${a.id} closed`, 'good');
      pushActivity(`Resolved <b>${a.id}</b> — design`);
      setAlerts(list => list.map(x => x.id === a.id ? {
        ...x,
        removing: true
      } : x));
      setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520);
    }
  };
  const openAlerts = alerts.filter(a => a.status !== 'resolved');
  const critOpen = openAlerts.filter(a => a.sev === 'crit').length;

  /* ---------- panels ---------- */
  const Kpis = /*#__PURE__*/React.createElement(Panel, {
    title: "Design & Engineering",
    sub: "BIM \xB7 live",
    glow: true,
    right: live && /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        color: 'var(--accent)'
      }
    }, "\u25CF LIVE")
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 0
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Drawings issued (IFC)",
    value: /*#__PURE__*/React.createElement(Num, {
      value: ifc,
      live: live
    }),
    size: 28,
    delta: '▲ ' + approvedToday + ' approved today'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Approval rate",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--accent)'
      }
    }, D.designStats.approvalRate, "%"),
    size: 28,
    delta: "consultant sign-off",
    deltaDir: "flat"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Open BIM clashes",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: clashes.length > 3 ? 'var(--red)' : 'var(--amber)'
      }
    }, clashes.length),
    size: 28,
    delta: "auto-detected",
    deltaDir: "flat"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Avg approval time",
    value: /*#__PURE__*/React.createElement("span", null, D.designStats.avgApprovalDays, /*#__PURE__*/React.createElement("span", {
      className: "kpi-unit"
    }, " d")),
    size: 28,
    delta: "\u25BC vs 4.1d target",
    deltaDir: "up"
  })));
  const Register = /*#__PURE__*/React.createElement(Panel, {
    title: "Drawing Register",
    sub: D.drawingRegister.length + ' sets',
    flush: true,
    right: /*#__PURE__*/React.createElement(Btn, {
      kind: "ghost",
      sm: true,
      onClick: () => go('graph')
    }, "Trace in graph \u2192"),
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 0.9fr 1.3fr 0.7fr',
      padding: '9px 14px',
      borderBottom: '1px solid var(--line)'
    }
  }, ['Project', 'Set · Rev', 'Approved', 'Status'].map(h => /*#__PURE__*/React.createElement("span", {
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
  }, D.drawingRegister.map(d => {
    const [ts, tl] = DSTAT[d.status] || ['ghost', d.status];
    return /*#__PURE__*/React.createElement("div", {
      key: d.proj,
      className: "lrow",
      style: {
        display: 'grid',
        gridTemplateColumns: '1.3fr 0.9fr 1.3fr 0.7fr',
        alignItems: 'center',
        gap: 8
      },
      onClick: () => go('project', d.proj),
      title: "Open project \u2192"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 2,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "truncate",
      style: {
        fontSize: 12.5,
        fontWeight: 600
      }
    }, projName(d.proj)), /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        fontSize: 8
      }
    }, fmt(d.count), " drawings")), /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 11.5,
        color: 'var(--ink2)'
      }
    }, d.set, " \xB7 ", d.rev), /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 4,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono tnum",
      style: {
        fontSize: 11,
        color: d.approved === 100 ? 'var(--green)' : d.s === 'crit' ? 'var(--red)' : 'var(--ink2)'
      }
    }, d.approved, "%"), /*#__PURE__*/React.createElement(Bar, {
      value: d.approved,
      s: d.s === 'crit' ? 'crit' : d.s === 'warn' ? 'warn' : d.approved === 100 ? 'ok' : 'accent'
    })), /*#__PURE__*/React.createElement(Tag, {
      s: ts
    }, tl));
  })), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      padding: '9px 14px',
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--accent)'
    }
  }, "\u25CF ", ifc.toLocaleString('en-US'), " drawings issued for construction"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--ink4)'
    }
  }, "click a set to open \u2192")));
  const Mid = /*#__PURE__*/React.createElement(Panel, {
    title: tab === 'approvals' ? 'Consultant Approvals · SLA' : 'Design Workload',
    sub: tab === 'approvals' ? approvals.length + ' pending' : 'by team',
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    },
    right: /*#__PURE__*/React.createElement("div", {
      className: "seg"
    }, /*#__PURE__*/React.createElement("button", {
      className: tab === 'approvals' ? 'on' : '',
      onClick: () => setTab('approvals')
    }, "Approvals"), /*#__PURE__*/React.createElement("button", {
      className: tab === 'workload' ? 'on' : '',
      onClick: () => setTab('workload')
    }, "Workload"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, tab === 'approvals' ? approvals.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: "col",
    style: {
      gap: 6,
      padding: '10px 11px',
      border: '1px solid var(--line)',
      borderRadius: 6,
      background: 'var(--panel2)',
      boxShadow: a.s === 'crit' ? 'inset 0 0 0 1px var(--red-line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "truncate",
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, projName(a.proj)), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 11,
      color: a.s === 'crit' ? 'var(--red)' : a.s === 'warn' ? 'var(--amber)' : 'var(--ink2)'
    }
  }, a.days, "d / ", a.sla, "d SLA")), /*#__PURE__*/React.createElement("span", {
    className: "truncate",
    style: {
      fontSize: 11.5,
      color: 'var(--ink2)'
    }
  }, a.desc), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Bar, {
    value: Math.min(100, a.days / a.sla * 100),
    s: a.s === 'crit' ? 'crit' : a.s === 'warn' ? 'warn' : 'ok'
  })), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "good",
    onClick: () => approveDwg(a)
  }, "Approve"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "warn",
    onClick: () => escalateApr(a)
  }, "Escalate")))) : D.designWorkload.map(w => /*#__PURE__*/React.createElement("div", {
    key: w.team,
    className: "col",
    style: {
      gap: 6,
      padding: '10px 11px',
      border: '1px solid var(--line)',
      borderRadius: 6,
      background: 'var(--panel2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, w.team), /*#__PURE__*/React.createElement(Dot, {
    s: w.s,
    live: live && w.s !== 'ok'
  })), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, w.inprog, " in progress \xB7 ", w.issued, " issued")), /*#__PURE__*/React.createElement(Bar, {
    value: w.issued,
    max: w.inprog + w.issued,
    s: w.s
  })))));
  const Clashes = /*#__PURE__*/React.createElement(Panel, {
    title: "BIM Clash Detection",
    sub: clashes.length + ' open',
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    },
    right: live && /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        color: 'var(--accent)',
        fontSize: 8.5
      }
    }, "\u25CF scanning")
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, clashes.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 0',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot ok",
    style: {
      width: 14,
      height: 14
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "No open clashes \u2014 model clean")), clashes.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    className: cx('alert', c.s, c.isNew && 'slidein', c.removing && 'removing')
  }, /*#__PURE__*/React.createElement("div", {
    className: "ico"
  }, /*#__PURE__*/React.createElement(Code, {
    s: c.s
  }, "3D")), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      flex: 1,
      gap: 6,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: stateColor[c.s]
    }
  }, projName(c.proj), " \xB7 ", c.disc), c.assigned && /*#__PURE__*/React.createElement(Tag, {
    s: "accent"
  }, "assigned")), /*#__PURE__*/React.createElement("div", {
    className: "at",
    style: {
      marginTop: 4
    }
  }, c.desc, " \u2014 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink3)'
    }
  }, c.note))), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6
    }
  }, !c.assigned && /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "primary",
    onClick: () => assignClash(c)
  }, "Assign"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "good",
    onClick: () => resolveClash(c)
  }, "Resolve"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => go('graph')
  }, "Trace \u2192")))))));
  const Alerts = /*#__PURE__*/React.createElement(Panel, {
    title: "Design Alerts",
    sub: openAlerts.length + ' open',
    flush: true,
    glowCrit: critOpen > 0,
    right: /*#__PURE__*/React.createElement(Tag, {
      s: "crit"
    }, critOpen, " critical"),
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
      gap: 9
    }
  }, openAlerts.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 0',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot ok",
    style: {
      width: 14,
      height: 14
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "All clear \u2014 design on track")), alerts.map(a => {
    const done = a.status === 'resolved';
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      className: cx('alert', a.sev, a.status === 'escalated' && 'escalated', a.removing && 'removing')
    }, /*#__PURE__*/React.createElement("div", {
      className: "ico"
    }, /*#__PURE__*/React.createElement(Code, {
      s: a.sev
    }, a.cat.slice(0, 3))), /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        flex: 1,
        gap: 7,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "between",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        fontSize: 8.5,
        color: stateColor[a.sev]
      }
    }, a.cat), a.status === 'escalated' && /*#__PURE__*/React.createElement(Tag, {
      s: "warn"
    }, "\u25B2 Escalated")), /*#__PURE__*/React.createElement("div", {
      className: "at",
      style: {
        marginTop: 4
      }
    }, a.text)), done ? /*#__PURE__*/React.createElement("span", {
      className: "delta up",
      style: {
        fontSize: 11
      }
    }, "\u2713 Actioned \u2014 ", a.owner, " notified") : /*#__PURE__*/React.createElement("div", {
      className: "alert-actions"
    }, /*#__PURE__*/React.createElement(Btn, {
      sm: true,
      kind: a.primary.kind,
      onClick: () => alertAct(a, 'primary')
    }, a.primary.label), a.primary.label !== 'Escalate' && /*#__PURE__*/React.createElement(Btn, {
      sm: true,
      kind: "warn",
      onClick: () => alertAct(a, 'escalate')
    }, "Escalate"), /*#__PURE__*/React.createElement(Btn, {
      sm: true,
      kind: "ghost",
      onClick: () => alertAct(a, 'resolve')
    }, "Resolve"), a.proj && /*#__PURE__*/React.createElement(Btn, {
      sm: true,
      kind: "ghost",
      onClick: () => go('project', a.proj)
    }, "Open \u2192"))));
  })));
  return /*#__PURE__*/React.createElement("div", {
    className: "screen pad fade-in",
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,0.95fr) 360px',
      gridTemplateRows: 'auto minmax(0,1fr) minmax(0,1fr)',
      gap: 14,
      gridTemplateAreas: '"kpis kpis kpis" "register mid alerts" "register clashes alerts"'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'kpis'
    }
  }, Kpis), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'register',
      minHeight: 0,
      display: 'grid'
    }
  }, Register), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'mid',
      minHeight: 0,
      display: 'grid'
    }
  }, Mid), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'clashes',
      minHeight: 0,
      display: 'grid'
    }
  }, Clashes), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'alerts',
      minHeight: 0,
      display: 'grid'
    }
  }, Alerts));
}
window.ScreenDesign = ScreenDesign;