/* ============================================================
   HT-OS — Screen 3 · Truck Trip Verification  (window.ScreenVerify)
   A verified trip TIMESHEET: every trip's gate times (in/out),
   stamped verified by hash chain + QR. Replaces paper + signatures.
   ============================================================ */
const TV_STATUS = {
  verified: {
    s: 'ok',
    label: '✓ Verified'
  },
  suspended: {
    s: 'warn',
    label: '⚠ Review'
  },
  unclaimed: {
    s: 'info',
    label: '◷ No note'
  },
  rejected: {
    s: 'crit',
    label: '✗ Rejected'
  }
};
function ScreenVerify({
  live,
  tick,
  go,
  toast,
  pushActivity
}) {
  const D = window.HTOS;
  const V = D.tvStats;
  const trips = D.verifyTrips;
  const [verified, setVerified] = useState(V.verifiedToday);
  const [claimed, setClaimed] = useState(V.claimed);
  const [trucks, setTrucks] = useState(() => D.verifyTrucks.map(t => ({
    ...t
  })));
  const [alerts, setAlerts] = useState(() => D.verifyAlerts.map(a => ({
    ...a,
    status: 'open'
  })));
  const incRef = useRef(0);
  const lastTick = useRef(0);

  // live: trips keep getting camera-counted; an alert can auto-surface
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    if (tick % 4 === 0) {
      setVerified(n => n + 1);
      setClaimed(n => n + 1);
    }
    if (tick % 9 === 0 && incRef.current < D.verifyIncoming.length) {
      const a = D.verifyIncoming[incRef.current++];
      setAlerts(list => [{
        ...a,
        status: 'open',
        isNew: true
      }, ...list]);
      toast('Unclaimed trip', 'Camera recorded · no delivery note', 'warn');
      pushActivity('Unclaimed trip flagged — camera saw, no note');
    }
  }, [tick, live]);
  const gap = claimed - verified;
  const registerTruck = p => {
    setTrucks(ts => ts.map(t => t.plate === p ? {
      ...t,
      status: 'active',
      note: null
    } : t));
    toast('Truck registered', `${p} added to fleet registry`, 'good');
    pushActivity(`Registered truck <b>${p}</b>`);
  };
  const rowDetail = t => {
    const st = TV_STATUS[t.status];
    toast(`${t.id} · ${t.plate}`, t.status === 'rejected' ? 'No camera record — supplier claim rejected' : t.status === 'suspended' ? 'Timestamps off — sent for dual review' : t.status === 'unclaimed' ? 'Camera saw it — awaiting supplier note' : 'Camera-verified · hash ' + t.hash, st.s);
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
      if (a.primary.label === 'Register' && a.plate) registerTruck(a.plate);else {
        toast(a.primary.label, `${a.id} · actioned`, a.primary.kind === 'good' ? 'good' : 'accent');
        pushActivity(`${a.primary.label} — <b>${a.id}</b>`);
      }
      resolveAlert(a);
    } else {
      toast('Resolved & closed', `${a.id} closed`, 'good');
      pushActivity(`Resolved <b>${a.id}</b> — verification`);
      setAlerts(list => list.map(x => x.id === a.id ? {
        ...x,
        removing: true
      } : x));
      setTimeout(() => setAlerts(list => list.filter(x => x.id !== a.id)), 520);
    }
  };
  const openAlerts = alerts.filter(a => a.status !== 'resolved');
  const critOpen = openAlerts.filter(a => a.sev === 'crit').length;

  /* ---------- KPI strip ---------- */
  const Kpis = /*#__PURE__*/React.createElement(Panel, {
    title: "Truck Trip Verification",
    sub: "cameras count the trips \xB7 live",
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
    label: "Registered trucks",
    value: /*#__PURE__*/React.createElement(Num, {
      value: V.registered
    }),
    size: 26,
    delta: V.camsOnline + '/' + V.camsTotal + ' cameras online',
    deltaDir: "flat"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Camera-verified today",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green)'
      }
    }, /*#__PURE__*/React.createElement(Num, {
      value: verified,
      live: live
    })),
    size: 26,
    delta: "\u25CF complete trips"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Supplier claimed",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: gap > 0 ? 'var(--red)' : 'var(--ink)'
      }
    }, /*#__PURE__*/React.createElement(Num, {
      value: claimed,
      live: live
    })),
    size: 26,
    delta: '▼ ' + gap + ' not payable',
    deltaDir: "down"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Tamper-proof",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green)'
      }
    }, "Hash \u2713"),
    size: 22,
    delta: "no edit \xB7 no override",
    deltaDir: "flat"
  })));

  /* ---------- the verified TIMESHEET ---------- */
  const cols = '0.95fr 1fr 1.25fr 1.25fr 1.05fr';
  const Timesheet = /*#__PURE__*/React.createElement(Panel, {
    title: "Verified Trip Timesheet",
    sub: "June 2026 \xB7 camera-counted",
    flush: true,
    right: /*#__PURE__*/React.createElement(Tag, {
      s: "ok"
    }, "\u2713 Tamper-proof"),
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center',
      padding: '14px 16px',
      borderBottom: '1px solid var(--line)',
      background: 'linear-gradient(180deg, rgba(31,224,196,.10), rgba(31,224,196,.03))',
      boxShadow: 'inset 0 0 0 1px var(--accent-line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "qr",
    style: {
      width: 72,
      height: 72,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      flex: 1,
      gap: 5,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      color: 'var(--accent-2)',
      fontSize: 9.5
    }
  }, "Verified by camera \xB7 hash-chained \xB7 QR-scannable"), /*#__PURE__*/React.createElement(Tag, {
    s: "ok"
  }, "\u2713 chain intact")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink)',
      lineHeight: 1.4
    }
  }, "This sheet ", /*#__PURE__*/React.createElement("b", null, "replaces the paper timesheet, stamp & signature"), ". The number here is the number on the invoice."), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 18,
      marginTop: 1,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--ink2)'
    }
  }, "Trips this period ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--green)'
    }
  }, /*#__PURE__*/React.createElement(Num, {
    value: verified,
    live: live
  }))), /*#__PURE__*/React.createElement("span", {
    className: "hashline hash-ok",
    style: {
      fontSize: 10
    }
  }, "sheet hash 0x7f3a91c\u2026e5a7"))), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 6,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "primary",
    sm: true,
    onClick: () => toast('Live count opened', `QR resolves to ${verified} camera-verified trips`, 'accent')
  }, "Open live count"), /*#__PURE__*/React.createElement(Btn, {
    kind: "ghost",
    sm: true,
    onClick: () => {
      toast('Timesheet exported', 'PDF with embedded QR · sent to billing', 'good');
      pushActivity('Exported verified timesheet — <b>PDF + QR</b>');
    }
  }, "Export sheet"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: cols,
      gap: 10,
      padding: '9px 16px',
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "Truck"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "Route"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "Factory \xB7 empty \u2192 loaded"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "Site \xB7 loaded \u2192 empty"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "Verified")), /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1
    }
  }, trips.map(t => {
    const st = TV_STATUS[t.status];
    const rej = t.status === 'rejected';
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      className: "lrow",
      style: {
        display: 'grid',
        gridTemplateColumns: cols,
        gap: 10,
        alignItems: 'center'
      },
      onClick: () => rowDetail(t)
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 2,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 12,
        fontWeight: 600
      }
    }, t.plate), /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        fontSize: 8
      }
    }, t.sup)), /*#__PURE__*/React.createElement("span", {
      className: "truncate label",
      style: {
        fontSize: 9
      }
    }, t.from, " \u2192 ", t.to), rej ? /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10.5,
        color: 'var(--red)'
      }
    }, "no camera record") : /*#__PURE__*/React.createElement("span", {
      className: "mono tnum",
      style: {
        fontSize: 11.5,
        color: 'var(--ink2)'
      }
    }, t.fIn, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ink4)'
      }
    }, "\u2192"), " ", t.fOut), rej ? /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10.5,
        color: 'var(--red)'
      }
    }, "\u2014") : /*#__PURE__*/React.createElement("span", {
      className: "mono tnum",
      style: {
        fontSize: 11.5,
        color: t.status === 'suspended' ? 'var(--amber)' : 'var(--ink2)'
      }
    }, t.sIn, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ink4)'
      }
    }, "\u2192"), " ", t.sOut), /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 3,
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement(Tag, {
      s: st.s
    }, st.label), /*#__PURE__*/React.createElement("span", {
      className: "hashline hash-ok",
      style: {
        fontSize: 8.5,
        color: rej ? 'var(--ink4)' : 'var(--green)'
      }
    }, "#", t.hash)));
  })), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      padding: '10px 16px',
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--green)'
    }
  }, "\u25CF ", verified, " camera-verified \xB7 = the invoice"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--ink4)'
    }
  }, "no signatures \xB7 no stamps \xB7 no edits")));

  /* ---------- registry (right top) ---------- */
  const Registry = /*#__PURE__*/React.createElement(Panel, {
    title: "Trucks We Know About",
    sub: trucks.length + ' shown · ' + V.registered + ' registered',
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1
    }
  }, trucks.map(t => {
    const st = t.status === 'active' ? 'ok' : t.status === 'unregistered' ? 'crit' : t.status === 'suspended' ? 'warn' : t.status === 'unclaimed' ? 'info' : 'idle';
    return /*#__PURE__*/React.createElement("div", {
      key: t.plate,
      className: "lrow",
      style: {
        alignItems: 'center',
        gap: 11
      },
      onClick: () => toast(t.plate, `${t.supplier} · ${t.trips} trips today${t.note ? ' · ' + t.note : ''}`, st === 'crit' ? 'crit' : st === 'warn' ? 'warn' : 'good')
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: stateColor[st === 'idle' ? 'idle' : st],
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement(EqIcon, {
      type: "truck",
      size: 15
    })), /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        flex: 1,
        gap: 2,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 11.5,
        fontWeight: 600
      }
    }, t.plate), /*#__PURE__*/React.createElement("span", {
      className: "label truncate",
      style: {
        fontSize: 8,
        color: t.note ? stateColor[st] : 'var(--ink4)'
      }
    }, t.supplier, t.note ? ' · ' + t.note : '')), t.status === 'unregistered' ? /*#__PURE__*/React.createElement(Btn, {
      sm: true,
      kind: "primary",
      onClick: e => {
        e.stopPropagation();
        registerTruck(t.plate);
      }
    }, "Register") : /*#__PURE__*/React.createElement("span", {
      className: "mono tnum",
      style: {
        fontSize: 11,
        color: 'var(--ink3)'
      }
    }, t.trips));
  })), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      padding: '8px 14px',
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "cam-id"
  }, /*#__PURE__*/React.createElement("span", {
    className: cx('dot ok', live && 'live')
  }), V.camsOnline, " gate cameras"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8,
      color: 'var(--ink4)'
    }
  }, "unregistered = blocked")));

  /* ---------- alerts (right bottom) ---------- */
  const Alerts = /*#__PURE__*/React.createElement(Panel, {
    title: "Verification Alerts",
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
  }, "All clear \u2014 every trip verified")), alerts.map(a => {
    const done = a.status === 'resolved';
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      className: cx('alert', a.sev, a.status === 'escalated' && 'escalated', a.isNew && 'slidein', a.removing && 'removing'),
      style: {
        flex: 'none'
      }
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
      gridTemplateColumns: 'minmax(0,1fr) 380px',
      gridTemplateRows: 'auto minmax(0,1fr)',
      gap: 14,
      gridTemplateAreas: '"kpis kpis" "sheet side"'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'kpis'
    }
  }, Kpis), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'sheet',
      minHeight: 0,
      display: 'grid'
    }
  }, Timesheet), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'side',
      minHeight: 0,
      display: 'grid',
      gridTemplateRows: 'minmax(0,0.95fr) minmax(0,1.05fr)',
      gap: 14
    }
  }, Registry, Alerts));
}
window.ScreenVerify = ScreenVerify;