/* ============================================================
   HT-OS — Screen 10 · Fleet & Suppliers  (window.ScreenFleet)
   External plant: trailers, cranes, pickups — by site, active now,
   by supplier. Live convoy animation.
   ============================================================ */
function ScreenFleet({
  live,
  tick,
  go,
  toast,
  pushActivity
}) {
  const D = window.HTOS;
  const projName = id => (D.projects.find(p => p.id === id) || D.factories.find(f => f.id === id) || {}).short || (D.projects.find(p => p.id === id) || {}).name || id;
  const [types, setTypes] = useState(() => D.fleetTypes.map(t => ({
    ...t
  })));
  const [alerts, setAlerts] = useState(() => D.fleetAlerts.map(a => ({
    ...a,
    status: 'open'
  })));
  const incRef = useRef(0);
  const lastTick = useRef(0);

  // live: units go active / return; a predictive alert can auto-surface
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    setTypes(ts => ts.map(t => {
      const lo = Math.round(t.total * 0.4),
        hi = t.total - t.maint;
      const next = Math.max(lo, Math.min(hi, t.active + Math.round((Math.random() - 0.5) * 3)));
      return {
        ...t,
        active: next,
        idle: t.total - next - t.maint
      };
    }));
    if (tick % 8 === 0 && incRef.current < D.fleetIncoming.length) {
      const a = D.fleetIncoming[incRef.current++];
      setAlerts(list => [{
        ...a,
        status: 'open',
        isNew: true
      }, ...list]);
      toast('Predictive flag', `${projName(a.site)} · ${a.cat.toLowerCase()}`, 'warn');
      pushActivity(`Fleet predictive flag — <b>${projName(a.site)}</b>`);
    }
  }, [tick, live]);
  const totalUnits = types.reduce((a, t) => a + t.total, 0);
  const activeNow = types.reduce((a, t) => a + t.active, 0);
  const util = Math.round(activeNow / totalUnits * 100);
  const spendDay = types.reduce((a, t) => a + t.active * t.rate, 0); // AED/day
  const inTransit = D.fleetSites.reduce((a, s) => a + s.transit, 0);
  const TYPE_ICON = {
    trailer: 'truck',
    crane: 'crane',
    pickup: 'pickup',
    telehandler: 'fork',
    pump: 'pump',
    lowbed: 'truck'
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
    if (kind === 'escalate') {
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
      const extra = a.primary.label === 'Off-hire' ? 'AED 28.5k/day saved' : a.id + ' · actioned';
      toast(a.primary.label, extra, a.primary.kind === 'good' ? 'good' : 'accent');
      pushActivity(`${a.primary.label} — <b>${a.id}</b>`);
      resolveAlert(a);
    } else {
      toast('Resolved & closed', `${a.id} closed`, 'good');
      pushActivity(`Resolved <b>${a.id}</b> — fleet`);
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
    title: "Fleet & Suppliers",
    sub: "external plant \xB7 live",
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
    label: "Units on hire",
    value: /*#__PURE__*/React.createElement(Num, {
      value: totalUnits
    }),
    size: 28,
    delta: "6 categories",
    deltaDir: "flat"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Active now",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green)'
      }
    }, /*#__PURE__*/React.createElement(Num, {
      value: activeNow,
      live: live
    })),
    size: 28,
    delta: '● ' + inTransit + ' in transit'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Utilisation",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: util < 60 ? 'var(--amber)' : 'var(--accent)'
      }
    }, util, "%"),
    size: 28,
    delta: "of hired fleet",
    deltaDir: "flat"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "External spend",
    value: /*#__PURE__*/React.createElement("span", null, "AED ", Math.round(spendDay / 1000), /*#__PURE__*/React.createElement("span", {
      className: "kpi-unit"
    }, " k/day")),
    size: 28,
    delta: "hire cost",
    deltaDir: "flat"
  })), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 5,
      marginTop: 13,
      paddingTop: 12,
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Live movement \xB7 factory \u21C4 site"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      color: live ? 'var(--accent)' : 'var(--ink4)',
      fontSize: 8.5
    }
  }, live ? '● rolling' : '❙❙ paused')), /*#__PURE__*/React.createElement("div", {
    className: "convoy"
  }, /*#__PURE__*/React.createElement("div", {
    className: "road"
  }), /*#__PURE__*/React.createElement("span", {
    className: "rig",
    style: {
      animationDuration: '7s'
    }
  }, /*#__PURE__*/React.createElement(EqIcon, {
    type: "truck",
    size: 13
  })), /*#__PURE__*/React.createElement("span", {
    className: "rig",
    style: {
      animationDuration: '11s',
      animationDelay: '-4s',
      color: 'var(--ink3)'
    }
  }, /*#__PURE__*/React.createElement(EqIcon, {
    type: "pickup",
    size: 12
  })), /*#__PURE__*/React.createElement("span", {
    className: "rig",
    style: {
      animationDuration: '9s',
      animationDelay: '-6s'
    }
  }, /*#__PURE__*/React.createElement(EqIcon, {
    type: "truck",
    size: 12
  })), /*#__PURE__*/React.createElement("span", {
    className: "rig",
    style: {
      animationDuration: '13s',
      animationDelay: '-3s',
      color: 'var(--ink3)'
    }
  }, /*#__PURE__*/React.createElement(EqIcon, {
    type: "crane",
    size: 14
  })))));
  const Equipment = /*#__PURE__*/React.createElement(Panel, {
    title: "Equipment by Category",
    sub: totalUnits + ' units · external',
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
      gap: 9
    }
  }, types.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: "eqtile"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eqbadge"
  }, /*#__PURE__*/React.createElement(EqIcon, {
    type: TYPE_ICON[t.id],
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      flex: 1,
      gap: 5,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "truncate",
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, t.name), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--green)'
    }
  }, t.active), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink4)'
    }
  }, " / ", t.total))), /*#__PURE__*/React.createElement(Bar, {
    value: t.active,
    max: t.total,
    s: "ok"
  }), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, t.supplier), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink3)'
    }
  }, t.idle, " idle"), t.maint > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--amber)'
    }
  }, " \xB7 ", t.maint, " maint"))))))));
  const Deploy = /*#__PURE__*/React.createElement(Panel, {
    title: "Deployment by Site",
    sub: "who's using what",
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    },
    right: /*#__PURE__*/React.createElement(Btn, {
      kind: "ghost",
      sm: true,
      onClick: () => go('tower')
    }, "Map \u2192")
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1
    }
  }, D.fleetSites.map(s => {
    const tot = s.trailers + s.cranes + s.pickups;
    const cell = (icon, n, c) => /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gap: 5,
        alignItems: 'center'
      },
      title: n + ' ' + icon
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: c || 'var(--ink3)'
      }
    }, /*#__PURE__*/React.createElement(EqIcon, {
      type: icon,
      size: 13
    })), /*#__PURE__*/React.createElement("span", {
      className: "mono tnum",
      style: {
        fontSize: 12
      }
    }, n));
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      className: "lrow",
      style: {
        alignItems: 'center',
        gap: 12
      },
      onClick: () => {
        go('project', s.id);
      },
      title: "Open site \u2192"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        flex: 1,
        gap: 3,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "truncate",
      style: {
        fontSize: 12.5,
        fontWeight: 600
      }
    }, projName(s.id)), /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        fontSize: 8
      }
    }, tot, " units", s.transit > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--accent)'
      }
    }, " \xB7 ", s.transit, " inbound"))), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gap: 14,
        alignItems: 'center'
      }
    }, cell('truck', s.trailers), cell('crane', s.cranes, s.cranes >= 5 ? 'var(--amber)' : 'var(--ink3)'), cell('pickup', s.pickups)));
  })));
  const Suppliers = /*#__PURE__*/React.createElement(Panel, {
    title: "External Suppliers",
    sub: D.fleetSuppliers.length + ' on contract',
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    },
    right: /*#__PURE__*/React.createElement("span", {
      className: "chip"
    }, "AED ", Math.round(spendDay / 1000), "k / day")
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1
    }
  }, D.fleetSuppliers.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    className: "lrow",
    style: {
      alignItems: 'center',
      gap: 11
    },
    onClick: () => toast(s.name, `${s.active}/${s.units} active · AED ${s.spend}k/day`, s.s === 'warn' ? 'warn' : 'good')
  }, /*#__PURE__*/React.createElement(Dot, {
    s: s.s,
    live: live && s.s !== 'ok'
  }), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      flex: 1,
      gap: 2,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "truncate",
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, s.name), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, s.cat)), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      alignItems: 'flex-end',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--green)'
    }
  }, s.active), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink4)'
    }
  }, "/", s.units)), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, "AED ", s.spend, "k/d")), s.s === 'warn' ? /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "warn",
    onClick: e => {
      e.stopPropagation();
      toast('Rate review opened', `${s.name} · framework variance`, 'warn');
      pushActivity(`Opened rate review — <b>${s.name}</b>`);
    }
  }, "Review") : /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: e => {
      e.stopPropagation();
      toast('Hire extended', `${s.name} · +30 days`, 'good');
      pushActivity(`Extended hire — <b>${s.name}</b>`);
    }
  }, "Extend")))));
  const Alerts = /*#__PURE__*/React.createElement(Panel, {
    title: "Fleet Alerts",
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
    }, "\u25CF tracking"), /*#__PURE__*/React.createElement(Tag, {
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
  }, "All clear \u2014 fleet optimal")), alerts.map(a => {
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
    }, a.cat, a.site ? ' · ' + projName(a.site) : ''), a.status === 'escalated' && /*#__PURE__*/React.createElement(Tag, {
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
    }, a.primary.label), /*#__PURE__*/React.createElement(Btn, {
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
      gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,0.95fr) 360px',
      gridTemplateRows: 'auto minmax(0,1fr) minmax(0,1fr)',
      gap: 14,
      gridTemplateAreas: '"kpis kpis kpis" "equipment deploy alerts" "equipment suppliers alerts"'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'kpis'
    }
  }, Kpis), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'equipment',
      minHeight: 0,
      display: 'grid'
    }
  }, Equipment), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'deploy',
      minHeight: 0,
      display: 'grid'
    }
  }, Deploy), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'suppliers',
      minHeight: 0,
      display: 'grid'
    }
  }, Suppliers), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'alerts',
      minHeight: 0,
      display: 'grid'
    }
  }, Alerts));
}
window.ScreenFleet = ScreenFleet;