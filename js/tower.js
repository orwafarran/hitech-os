/* ============================================================
   HT-OS — Screen 1 · Executive Control Tower  (window.ScreenTower)
   The hero. Working alert actions, live output, streaming activity.
   ============================================================ */
const STAGE = {
  design: 'Design',
  approve: 'Approvals',
  production: 'Production',
  install: 'Installation',
  delivery: 'Delivery'
};
const ICODE = {
  flask: 'QC',
  doc: 'DR',
  gear: 'MX',
  truck: 'TR',
  clash: 'BIM',
  check: 'OK'
};

/* one alert card with the four working controls */
function AlertCard({
  a,
  onAct,
  go
}) {
  const done = a.status === 'approved' || a.status === 'resolved';
  return /*#__PURE__*/React.createElement("div", {
    className: cx('alert', a.sev, a.status === 'escalated' && 'escalated', a.flagged && 'flagged', a.isNew && 'slidein', a.removing && 'removing')
  }, /*#__PURE__*/React.createElement("div", {
    className: "ico"
  }, /*#__PURE__*/React.createElement(Code, {
    s: a.sev
  }, ICODE[a.icon])), /*#__PURE__*/React.createElement("div", {
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
  }, a.cat), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 5
    }
  }, a.status === 'escalated' && /*#__PURE__*/React.createElement(Tag, {
    s: "warn"
  }, "\u25B2 Escalated"), a.flagged && /*#__PURE__*/React.createElement(Tag, {
    s: "accent"
  }, "\u2691 Flagged"))), /*#__PURE__*/React.createElement("div", {
    className: "at",
    style: {
      marginTop: 4
    }
  }, a.text)), done ? /*#__PURE__*/React.createElement("span", {
    className: "delta up",
    style: {
      fontSize: 11
    }
  }, "\u2713 ", a.status === 'approved' ? 'Approved & signed off' : 'Resolved & closed', " \u2014 ", a.owner, " notified") : /*#__PURE__*/React.createElement("div", {
    className: "alert-actions"
  }, /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "good",
    onClick: () => onAct(a, 'approve')
  }, "Approve"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "warn",
    onClick: () => onAct(a, 'escalate')
  }, "Escalate"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => onAct(a, 'flag')
  }, a.flagged ? 'Unflag' : 'Flag'), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "primary",
    onClick: () => onAct(a, 'resolve')
  }, "Resolve"), a.proj && /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => go('project', a.proj)
  }, "Open \u2192"))));
}
function ScreenTower({
  live,
  tick,
  go,
  toast,
  pushActivity,
  activity,
  alerts,
  alertAct,
  cleared
}) {
  const D = window.HTOS;

  // live-nudged output value — creeps toward, but never exceeds, daily capacity
  const [out, setOut] = useState(D.output.today);
  useEffect(() => {
    if (live && tick > 0) setOut(o => Math.min(D.output.cap - 12, o + Math.round(2 + Math.random() * 7)));
  }, [tick]);
  const [picked, setPicked] = useState('ICAD2');
  const routes = [{
    from: 'ICAD2',
    to: {
      x: 48,
      y: 48
    }
  }, {
    from: 'ALAIN',
    to: {
      x: 58,
      y: 46
    },
    cool: true
  }, {
    from: 'KEZAD',
    to: {
      x: 56,
      y: 58
    }
  }, {
    from: 'ICAD2',
    to: {
      x: 50,
      y: 56
    },
    dev: true
  } // DN-4470 deviation, in red
  ];
  const outPct = Math.round(out / D.output.cap * 100);
  const sparkOut = [2780, 2910, 2840, 3010, 2980, 3090, 3041, out];
  const openAlerts = alerts.filter(a => a.status !== 'approved' && a.status !== 'resolved');
  const critOpen = openAlerts.filter(a => a.sev === 'crit').length;

  /* ---------- sub panels ---------- */
  const Health = /*#__PURE__*/React.createElement(Panel, {
    title: "Company Health",
    sub: "composite index",
    glow: true,
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ring, {
    value: D.health.score,
    size: 120,
    stroke: 9,
    label: D.health.score,
    sub: "of 100"
  }), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      flex: 1,
      gap: 8
    }
  }, D.health.subs.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.k,
    className: "col",
    style: {
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      color: 'var(--ink2)'
    }
  }, s.k), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 12,
      color: stateColor[s.s]
    }
  }, s.v)), /*#__PURE__*/React.createElement(Bar, {
    value: s.v,
    s: s.s
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      marginTop: 12,
      paddingTop: 11,
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "7-day trend"), /*#__PURE__*/React.createElement("span", {
    className: "delta up"
  }, "\u25B2 ", D.health.trend, " pts \xB7 improving")));
  const Output = /*#__PURE__*/React.createElement(Panel, {
    title: "Output vs Capacity",
    sub: "today \xB7 live",
    right: live && /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        color: 'var(--accent)'
      }
    }, "\u25CF LIVE")
  }, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Num, {
    value: out,
    live: live,
    className: "kpi-val mono",
    style: {
      fontSize: 46
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "kpi-unit"
  }, "m\xB3 / ", fmt(D.output.cap))), /*#__PURE__*/React.createElement(Spark, {
    data: sparkOut,
    w: 120,
    h: 34
  })), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 6,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Bar, {
    value: out,
    max: D.output.cap,
    thick: true,
    s: outPct > 85 ? 'ok' : 'warn'
  }), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, outPct, "% of 3,500 m\xB3 capacity"), /*#__PURE__*/React.createElement("span", {
    className: "delta up"
  }, "\u25B2 ", fmt(out - D.output.yesterday), " vs yesterday"))), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 0,
      marginTop: 13,
      paddingTop: 12,
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Month-to-date",
    value: fmt(D.output.mtd),
    unit: "m\xB3",
    size: 20
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 14px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Lines running",
    value: "38 / 39",
    size: 20
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 14px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Plants online",
    value: "10 / 11",
    size: 20
  })));
  const Finance = /*#__PURE__*/React.createElement(Panel, {
    title: "Financial Exposure",
    sub: "AED \xB7 group",
    right: /*#__PURE__*/React.createElement(Btn, {
      sm: true,
      kind: "ghost",
      onClick: () => {
        toast('Finance escalation opened', 'AED 47M overdue · 3 clients', 'warn');
        pushActivity('Opened finance escalation — <b>AED 47M</b> overdue');
      }
    }, "Escalate \u2197")
  }, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Live exposure",
    value: /*#__PURE__*/React.createElement("span", null, D.finance.exposure, /*#__PURE__*/React.createElement("span", {
      className: "kpi-unit"
    }, " M")),
    size: 38
  }), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      alignItems: 'flex-end',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Backlog"), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 18
    }
  }, "AED ", fmt(D.finance.portfolio), "M"))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      marginTop: 13
    }
  }, [['Work in progress', D.finance.wip, 'info'], ['Receivables', D.finance.receivables, 'warn'], ['Invoiced MTD', D.finance.invoicedMTD, 'ok'], ['Overdue >90d', D.finance.overdue, 'crit']].map(([k, v, s]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "col",
    style: {
      gap: 5,
      padding: '9px 11px',
      border: '1px solid var(--line)',
      borderRadius: 6,
      background: 'var(--panel2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 17,
      color: stateColor[s]
    }
  }, "AED ", fmt(v), "M")))));
  const Factories = /*#__PURE__*/React.createElement(Panel, {
    title: "Factory Network",
    sub: "11 plants \xB7 7 fixed + 4 mobile",
    flush: true,
    right: /*#__PURE__*/React.createElement(Btn, {
      kind: "ghost",
      sm: true,
      onClick: () => go('factory')
    }, "Floor view \u2192"),
    className: "col",
    style: {
      minHeight: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      height: 148,
      minHeight: 0,
      padding: 12,
      paddingBottom: 8,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(UAEBoard, {
    live: live,
    onPick: f => setPicked(f.id),
    selected: picked,
    routes: routes
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      position: 'relative',
      zIndex: 3,
      background: 'var(--panel)',
      borderTop: '1px solid var(--line)',
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'minmax(128px,1fr)',
      gap: 8,
      overflowX: 'auto',
      padding: 12
    }
  }, D.factories.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.id,
    className: cx('ftile', f.status === 'crit' && 'crit', f.status === 'warn' && 'warn'),
    onClick: () => {
      setPicked(f.id);
      go('factory');
    },
    style: picked === f.id ? {
      borderColor: 'var(--accent-line)',
      background: 'var(--accent-dim)'
    } : null
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono truncate",
    style: {
      fontSize: 11,
      fontWeight: 600
    }
  }, f.short), /*#__PURE__*/React.createElement(Dot, {
    s: f.status,
    live: live && f.status !== 'ok'
  })), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 18
    }
  }, f.out), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, f.type === 'mobile' ? 'MOBILE' : 'm³')), /*#__PURE__*/React.createElement(Bar, {
    value: f.out,
    max: f.cap,
    s: f.status
  }), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, "OEE ", f.oee, "%"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, f.linesRun, "/", f.lines, " ln"))))));
  const Projects = /*#__PURE__*/React.createElement(Panel, {
    title: "Active Projects",
    sub: "6 live",
    flush: true,
    right: /*#__PURE__*/React.createElement("span", {
      className: "chip"
    }, "AED ", fmt(D.finance.portfolio), "M total"),
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1
    }
  }, D.projects.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    className: "lrow",
    onClick: () => go('project', p.id)
  }, /*#__PURE__*/React.createElement(Dot, {
    s: p.risk,
    live: live && p.risk !== 'ok'
  }), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      flex: 1,
      gap: 4,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600
    },
    className: "truncate"
  }, p.name), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 12,
      color: 'var(--ink2)'
    }
  }, p.pct, "%")), /*#__PURE__*/React.createElement(Bar, {
    value: p.pct,
    s: p.risk === 'crit' ? 'crit' : p.risk === 'warn' ? 'warn' : 'ok'
  }), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, p.client), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, STAGE[p.stage], " \xB7 AED ", p.value, "M")))))));
  const Alerts = /*#__PURE__*/React.createElement(Panel, {
    title: "Critical Alerts",
    sub: openAlerts.length + ' open',
    flush: true,
    right: /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gap: 7,
        alignItems: 'center'
      }
    }, live && /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        color: 'var(--accent)',
        fontSize: 8.5
      }
    }, "\u25CF monitoring"), /*#__PURE__*/React.createElement(Tag, {
      s: "crit"
    }, critOpen, " critical")),
    className: "col",
    style: {
      minHeight: 0
    },
    glowCrit: critOpen > 0
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
    className: "dot ok live",
    style: {
      width: 14,
      height: 14
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "All clear \u2014 queue resolved"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--ink4)'
    }
  }, cleared, " actioned today \xB7 auto-triage on")), alerts.map(a => /*#__PURE__*/React.createElement(AlertCard, {
    key: a.id,
    a: a,
    onAct: alertAct,
    go: go
  }))), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      padding: '9px 14px',
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--green)'
    }
  }, "\u2713 ", cleared, " cleared today"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--ink4)'
    }
  }, "auto-triage \xB7 routing on")));
  const Briefing = /*#__PURE__*/React.createElement(Panel, {
    title: "Executive Morning Briefing",
    sub: D.briefing.date,
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 9
    }
  }, D.briefing.lines.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "row",
    style: {
      gap: 9,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: cx('dot', l.s),
    style: {
      marginTop: 5
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      lineHeight: 1.4,
      color: 'var(--ink)'
    }
  }, l.t)))), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      marginTop: 13,
      paddingTop: 12,
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "primary",
    sm: true,
    onClick: () => go('trust')
  }, "Review delivery proofs"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => {
      toast('Morning brief re-sent', 'Delivered to 7 recipients', 'good');
      pushActivity('Re-sent morning brief to <b>7 recipients</b>');
    }
  }, "Re-send brief")), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      marginTop: 13,
      paddingTop: 12,
      borderTop: '1px solid var(--line)',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Live Activity"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: live ? 'var(--accent)' : 'var(--ink4)'
    }
  }, live ? '● streaming' : '❙❙ paused')), /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      maxHeight: 150
    }
  }, activity.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: e.id,
    className: cx('act', i === 0 && e.isNew && 'slidein')
  }, /*#__PURE__*/React.createElement("span", {
    className: "atime"
  }, e.t), /*#__PURE__*/React.createElement("span", {
    className: "atext",
    dangerouslySetInnerHTML: {
      __html: e.html
    }
  }))))));
  return /*#__PURE__*/React.createElement("div", {
    className: "screen pad fade-in",
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1.55fr) 380px',
      gridTemplateRows: 'auto minmax(280px,1fr) auto',
      gap: 14,
      gridTemplateAreas: '"kpis alerts" "fac alerts" "proj brief"'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'kpis',
      display: 'grid',
      gridTemplateColumns: '320px 1fr 1fr',
      gap: 14
    }
  }, Health, Output, Finance), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'fac',
      minHeight: 0,
      display: 'grid'
    }
  }, Factories), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'alerts',
      minHeight: 0,
      display: 'grid'
    }
  }, Alerts), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'proj',
      minHeight: 0,
      display: 'grid'
    }
  }, Projects), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'brief',
      minHeight: 0,
      display: 'grid'
    }
  }, Briefing));
}
window.ScreenTower = ScreenTower;