/* ============================================================
   HT-OS — Screen 9 · People & HR  (window.ScreenPeople)
   Workforce, deployment by site, HSE/safety, compliance.
   ============================================================ */
function ScreenPeople({
  live,
  tick,
  go,
  toast,
  pushActivity
}) {
  const D = window.HTOS;
  const total = D.peopleStats.total;
  const [present, setPresent] = useState(Math.round(total * 0.93));
  const [compliance, setCompliance] = useState(() => D.compliance.map(c => ({
    ...c
  })));
  const [alerts, setAlerts] = useState(() => D.peopleAlerts.map(a => ({
    ...a,
    status: 'open'
  })));
  const [tab, setTab] = useState('safety');
  const incRef = useRef(0);
  const lastTick = useRef(0);

  // live: people clock in through the morning; a staffing alert can auto-surface
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    setPresent(p => Math.min(Math.round(total * 0.965), p + Math.round(8 + Math.random() * 22)));
    if (tick % 8 === 0 && incRef.current < D.peopleIncoming.length) {
      const a = D.peopleIncoming[incRef.current++];
      setAlerts(list => [{
        ...a,
        status: 'open',
        isNew: true
      }, ...list]);
      toast('Attendance alert', `${a.site} · auto-flagged`, 'warn');
      pushActivity(`Attendance dip auto-flagged — <b>${a.site}</b>`);
    }
  }, [tick, live]);
  const attendance = Math.round(present / total * 100);
  const fnMax = Math.max(...D.workforceFn.map(f => f.n));
  const renew = c => {
    setCompliance(list => list.map(x => x.id === c.id ? {
      ...x,
      removing: true
    } : x));
    setTimeout(() => setCompliance(list => list.filter(x => x.id !== c.id)), 520);
    toast('Renewal filed', `${c.type} · ${c.who} submitted to PRO`, 'good');
    pushActivity(`Filed renewal — <b>${c.type}</b> (${c.who})`);
  };
  const escalateC = c => {
    toast('Escalated', `${c.type} · ${c.days}d to expiry`, 'warn');
    pushActivity(`Escalated compliance — <b>${c.type}</b>`);
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
      pushActivity(`Resolved <b>${a.id}</b> — HR`);
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
    title: "People & HR",
    sub: "workforce \xB7 live",
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
    label: "Total workforce",
    value: /*#__PURE__*/React.createElement(Num, {
      value: total
    }),
    size: 28,
    delta: '▲ ' + D.peopleStats.openRoles + ' roles open',
    deltaDir: "flat"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Present today",
    value: /*#__PURE__*/React.createElement(Num, {
      value: present,
      live: live
    }),
    size: 28,
    delta: "\u25B2 clocking in"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Attendance",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: attendance < 90 ? 'var(--amber)' : 'var(--green)'
      }
    }, attendance, "%"),
    size: 28,
    delta: "of deployed",
    deltaDir: "flat"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Days without LTI",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--accent)'
      }
    }, D.hse.daysNoLTI),
    size: 28,
    delta: "safety 96 / 100"
  })));
  const Workforce = /*#__PURE__*/React.createElement(Panel, {
    title: "Workforce by Function",
    sub: fmt(total) + ' total',
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, D.workforceFn.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.k,
    className: "col",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      color: 'var(--ink2)'
    }
  }, f.k), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 13
    }
  }, fmt(f.n))), /*#__PURE__*/React.createElement(Bar, {
    value: f.n,
    max: fnMax,
    thick: true,
    s: ""
  })))), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      marginTop: 11,
      paddingTop: 11,
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Group \xB7 Trojan Construction"), /*#__PURE__*/React.createElement("span", {
    className: "delta up"
  }, "\u25B2 ", D.peopleStats.openRoles, " open positions")));
  const Compliance = /*#__PURE__*/React.createElement(Panel, {
    title: "Compliance \xB7 Expiring",
    sub: compliance.filter(c => c.s === 'crit').length + ' urgent',
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    },
    glowCrit: compliance.some(c => c.s === 'crit')
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, compliance.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    className: cx('col', c.removing && 'removing'),
    style: {
      gap: 6,
      padding: '10px 11px',
      border: '1px solid var(--line)',
      borderRadius: 6,
      background: 'var(--panel2)',
      boxShadow: c.s === 'crit' ? 'inset 0 0 0 1px var(--red-line)' : c.s === 'warn' ? 'inset 0 0 0 1px var(--amber-line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      alignItems: 'center',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Dot, {
    s: c.s,
    live: live && c.s === 'crit'
  }), /*#__PURE__*/React.createElement("span", {
    className: "truncate",
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, c.type)), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 11,
      color: c.s === 'crit' ? 'var(--red)' : c.s === 'warn' ? 'var(--amber)' : 'var(--ink2)'
    }
  }, c.days, "d")), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, c.who), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: c.s === 'crit' ? 'primary' : 'ghost',
    onClick: () => renew(c)
  }, "Renew"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => escalateC(c)
  }, "Escalate"))))));
  const Deployment = /*#__PURE__*/React.createElement(Panel, {
    title: "Deployment by Location",
    sub: D.deployment.length + ' sites',
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    },
    right: /*#__PURE__*/React.createElement(Btn, {
      kind: "ghost",
      sm: true,
      onClick: () => go('factory')
    }, "Floor \u2192")
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1
    }
  }, D.deployment.map(d => {
    const att = Math.round(d.present / d.head * 100);
    const s = att < 85 ? 'warn' : 'ok';
    return /*#__PURE__*/React.createElement("div", {
      key: d.id,
      className: "lrow",
      style: {
        alignItems: 'center',
        gap: 11
      },
      onClick: () => toast(d.site, `${fmt(d.present)} / ${fmt(d.head)} present · ${att}% attendance`, s === 'warn' ? 'warn' : 'good')
    }, /*#__PURE__*/React.createElement(Dot, {
      s: s,
      live: live && s === 'warn'
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
      className: "truncate",
      style: {
        fontSize: 12.5,
        fontWeight: 600
      }
    }, d.site), /*#__PURE__*/React.createElement("span", {
      className: "mono tnum",
      style: {
        fontSize: 11,
        color: 'var(--ink2)'
      }
    }, fmt(d.present), "/", fmt(d.head))), /*#__PURE__*/React.createElement(Bar, {
      value: d.present,
      max: d.head,
      s: s
    })), /*#__PURE__*/React.createElement("span", {
      className: "mono tnum",
      style: {
        fontSize: 12,
        color: s === 'warn' ? 'var(--amber)' : 'var(--ink2)',
        width: 34,
        textAlign: 'right'
      }
    }, att, "%"));
  })));
  const HSE = /*#__PURE__*/React.createElement(Panel, {
    title: tab === 'safety' ? 'HSE · Safety' : 'Attendance · Today',
    sub: tab === 'safety' ? 'site-wide' : 'live',
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    },
    right: /*#__PURE__*/React.createElement("div", {
      className: "seg"
    }, /*#__PURE__*/React.createElement("button", {
      className: tab === 'safety' ? 'on' : '',
      onClick: () => setTab('safety')
    }, "Safety"), /*#__PURE__*/React.createElement("button", {
      className: tab === 'attend' ? 'on' : '',
      onClick: () => setTab('attend')
    }, "Attendance"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1,
      padding: 12
    }
  }, tab === 'safety' ? /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Days without LTI",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green)'
      }
    }, D.hse.daysNoLTI),
    size: 34
  }), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      alignItems: 'flex-end',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Safety score"), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 18,
      color: 'var(--green)'
    }
  }, D.hse.safetyScore, "/100"))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, [['Incidents · MTD', D.hse.incidentsMonth, 'warn'], ['Near-misses', D.hse.nearMiss, 'info'], ['Inductions today', D.hse.inductions, 'ok'], ['Toolbox talks', D.hse.toolbox, 'ok']].map(([k, v, s]) => /*#__PURE__*/React.createElement("div", {
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
  }, v)))), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "warn",
    onClick: () => {
      toast('Incident acknowledged', 'Al Hamra LTI · investigation assigned', 'warn');
      pushActivity('Acknowledged HSE incident — <b>Al Hamra</b>');
    }
  }, "Acknowledge incident"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => {
      toast('Toolbox talk scheduled', 'All sites · 06:30 tomorrow', 'accent');
      pushActivity('Scheduled toolbox talk — <b>all sites</b>');
    }
  }, "Schedule talk"))) : /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Present"), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      color: 'var(--green)'
    }
  }, /*#__PURE__*/React.createElement(Num, {
    value: present,
    live: live
  }))), /*#__PURE__*/React.createElement(Bar, {
    value: present,
    max: total,
    thick: true,
    s: "ok"
  }), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 9
    }
  }, attendance, "% of ", fmt(total), " deployed"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 9,
      color: 'var(--accent)'
    }
  }, "\u25CF live clock-ins"))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, [['On leave', 214, 'info'], ['Absent', total - present - 214, 'warn'], ['Night shift', 1180, 'ok'], ['Contractors', 640, 'ok']].map(([k, v, s]) => /*#__PURE__*/React.createElement("div", {
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
  }, fmt(Math.max(0, v)))))), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "good",
    onClick: () => {
      toast('Leave approved', '6 requests · cover arranged', 'good');
      pushActivity('Approved leave — <b>6 requests</b>');
    }
  }, "Approve leave (6)"))));
  const Alerts = /*#__PURE__*/React.createElement(Panel, {
    title: "People Alerts",
    sub: openAlerts.length + ' open',
    flush: true,
    glowCrit: critOpen > 0,
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
    }, "\u25CF auto-watch"), /*#__PURE__*/React.createElement(Tag, {
      s: "crit"
    }, critOpen, " critical")),
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
  }, "All clear \u2014 workforce stable")), alerts.map(a => {
    const done = a.status === 'resolved';
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      className: cx('alert', a.sev, a.status === 'escalated' && 'escalated', a.isNew && 'slidein', a.removing && 'removing')
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
    }, "Resolve"))));
  })));
  return /*#__PURE__*/React.createElement("div", {
    className: "screen pad fade-in",
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) 360px',
      gridTemplateRows: 'auto minmax(0,1fr) minmax(0,1fr)',
      gap: 14,
      gridTemplateAreas: '"kpis kpis kpis" "workforce deploy alerts" "compliance hse alerts"'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'kpis'
    }
  }, Kpis), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'workforce',
      minHeight: 0,
      display: 'grid'
    }
  }, Workforce), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'compliance',
      minHeight: 0,
      display: 'grid'
    }
  }, Compliance), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'deploy',
      minHeight: 0,
      display: 'grid'
    }
  }, Deployment), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'hse',
      minHeight: 0,
      display: 'grid'
    }
  }, HSE), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'alerts',
      minHeight: 0,
      display: 'grid'
    }
  }, Alerts));
}
window.ScreenPeople = ScreenPeople;