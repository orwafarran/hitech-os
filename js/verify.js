/* ============================================================
   HT-OS — Screen 3 · Truck Trip Verification  (window.ScreenVerify)
   Camera-counted trips · 4-event complete trip · 3-way handshake ·
   hash chain · QR-verified invoice. (Truck Trip Verification System)
   ============================================================ */
const TRIP_TAG = {
  verified: ['ok', '✓ Verified'],
  suspended: ['warn', '⚠ Suspended'],
  rejected: ['crit', '✗ Rejected'],
  unclaimed: ['info', '◷ Unclaimed']
};
function HS({
  ok,
  label
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "tag",
    style: {
      height: 18,
      padding: '0 6px',
      color: ok ? 'var(--green)' : 'var(--red)',
      borderColor: ok ? 'rgba(42,209,127,.34)' : 'var(--red-line)',
      background: ok ? 'var(--green-dim)' : 'var(--red-dim)'
    }
  }, ok ? '✓' : '✗', " ", label);
}
function ScreenVerify({
  live,
  tick,
  go,
  toast,
  pushActivity
}) {
  const D = window.HTOS;
  const F = D.verifyFeatured;
  const V = D.tvStats;
  const tnow = () => new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const [verified, setVerified] = useState(V.verifiedToday);
  const [claimed, setClaimed] = useState(V.claimed);
  const [trucks, setTrucks] = useState(() => D.verifyTrucks.map(t => ({
    ...t
  })));
  const [trips, setTrips] = useState(() => D.verifyTrips.map(t => ({
    ...t
  })));
  const [alerts, setAlerts] = useState(() => D.verifyAlerts.map(a => ({
    ...a,
    status: 'open'
  })));
  const ledKey = useRef(0);
  const [chain, setChain] = useState(() => D.verifyChain.map(c => ({
    ...c,
    _k: 'C' + ledKey.current++
  })));
  const streamRef = useRef(0);
  const incRef = useRef(0);
  const lastTick = useRef(0);

  // live: trips complete, the hash chain appends, an alert can auto-surface
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    if (tick % 3 === 0 && streamRef.current < D.verifyChainStream.length) {
      const s = D.verifyChainStream[streamRef.current++];
      setChain(c => [{
        t: tnow(),
        ev: s.ev,
        plate: s.plate,
        load: s.load,
        hash: '0x' + s.hashSeed + '…' + s.hashSeed,
        prev: c[0] ? c[0].hash.slice(2, 9) : '—',
        _k: 'C' + ledKey.current++,
        isNew: true
      }, ...c]);
      if (s.ev === 'TRIP_VERIFIED') {
        setVerified(n => n + 1);
        setClaimed(n => n + 1);
        pushActivity(`Trip verified by camera — <b>${s.plate}</b>`);
      }
    }
    if (tick % 8 === 0 && incRef.current < D.verifyIncoming.length) {
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

  /* actions — agree / dispute only (no edit; camera is the judge) */
  const registerTruck = p => {
    setTrucks(ts => ts.map(t => t.plate === p ? {
      ...t,
      status: 'active',
      note: null
    } : t));
    toast('Truck registered', `${p} added to fleet registry`, 'good');
    pushActivity(`Registered truck <b>${p}</b>`);
  };
  const tripAct = t => {
    const map = {
      suspended: ['Dual review queued', 'two-manager review', 'warn'],
      rejected: ['Investigation opened', 'claim vs camera', 'warn'],
      unclaimed: ['Note requested', 'supplier notified', 'accent'],
      verified: ['Evidence opened', 'photos + clips', 'good']
    };
    const [m, s, k] = map[t.status] || ['Opened', '', 'accent'];
    toast(m, `${t.id} · ${s}`, k);
    pushActivity(`${m} — <b>${t.id}</b>`);
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
  const gap = claimed - verified;

  /* ---------- panels ---------- */
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
    size: 28,
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
    size: 28,
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
    size: 28,
    delta: '▼ ' + V.rejected + ' rejected · ' + V.unclaimed + ' unclaimed',
    deltaDir: "down"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Hash chain",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green)'
      }
    }, "Intact"),
    size: 22,
    delta: "tamper-proof \xB7 no edits",
    deltaDir: "flat"
  })), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      marginTop: 12,
      paddingTop: 11,
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      color: gap > 0 ? 'var(--red)' : 'var(--green)'
    }
  }, gap > 0 ? `⚠ Supplier claimed ${claimed} · camera verified ${verified} — ${gap} not payable` : 'Claimed = verified · no dispute'), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--ink4)'
    }
  }, "camera data = the invoice")));
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
        color: stateColor[st === 'idle' ? 'idle' : st]
      }
    }, /*#__PURE__*/React.createElement(EqIcon, {
      type: "truck",
      size: 16
    })), /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        flex: 1,
        gap: 2,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 12,
        fontWeight: 600
      }
    }, t.plate), /*#__PURE__*/React.createElement("span", {
      className: "mono tnum",
      style: {
        fontSize: 11,
        color: 'var(--ink3)'
      }
    }, t.trips, " trips")), /*#__PURE__*/React.createElement("span", {
      className: "label truncate",
      style: {
        fontSize: 8.5,
        color: t.note ? stateColor[st] : 'var(--ink4)'
      }
    }, t.supplier, t.note ? ' · ' + t.note : '')), t.status === 'unregistered' ? /*#__PURE__*/React.createElement(Btn, {
      sm: true,
      kind: "primary",
      onClick: e => {
        e.stopPropagation();
        registerTruck(t.plate);
      }
    }, "Register") : /*#__PURE__*/React.createElement(Dot, {
      s: st,
      live: live && (st === 'warn' || st === 'crit')
    }));
  })), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      padding: '9px 14px',
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "cam-id"
  }, /*#__PURE__*/React.createElement("span", {
    className: cx('dot ok', live && 'live')
  }), V.camsOnline, " gate cameras"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--ink4)'
    }
  }, "unregistered = blocked")));
  const Featured = /*#__PURE__*/React.createElement(Panel, {
    title: 'Complete Trip · ' + F.trip,
    sub: F.plate + ' · ' + F.route,
    glow: true,
    right: /*#__PURE__*/React.createElement(Tag, {
      s: "ok"
    }, "\u2713 Verified \xB7 payable")
  }, /*#__PURE__*/React.createElement("div", {
    className: "chain",
    style: {
      marginTop: 2,
      marginBottom: 8
    }
  }, F.events.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "node done"
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "link"
  }), /*#__PURE__*/React.createElement("span", {
    className: "knob",
    style: {
      width: 28,
      height: 28,
      fontSize: 11
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("span", {
    className: "clabel"
  }, e.gate), /*#__PURE__*/React.createElement("span", {
    className: "tag",
    style: {
      height: 17,
      padding: '0 6px',
      marginTop: 1,
      color: e.load === 'LOADED' ? 'var(--accent)' : 'var(--ink3)',
      borderColor: e.load === 'LOADED' ? 'var(--accent-line)' : 'var(--line2)',
      background: e.load === 'LOADED' ? 'var(--accent-dim)' : 'transparent'
    }
  }, e.load), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--ink2)'
    }
  }, e.t), /*#__PURE__*/React.createElement("span", {
    className: "hashline hash-ok",
    style: {
      fontSize: 8
    }
  }, "#", e.hash)))), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 12,
      marginTop: 10,
      paddingTop: 12,
      borderTop: '1px solid var(--line)',
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      flex: 1,
      gap: 8,
      padding: 12,
      border: '1px solid var(--line)',
      borderRadius: 8,
      background: 'var(--panel2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Three-way handshake"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(HS, {
    ok: F.handshake.camera,
    label: "Camera"
  }), /*#__PURE__*/React.createElement(HS, {
    ok: F.handshake.note,
    label: "Note"
  }), /*#__PURE__*/React.createElement(HS, {
    ok: F.handshake.times,
    label: "Timestamps"
  })), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--ink4)',
      lineHeight: 1.4
    }
  }, "All three align \u2192 trip is payable & added to the invoice automatically."), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "good",
    onClick: () => {
      toast('Agreed & invoiced', `${F.trip} added to monthly invoice`, 'good');
      pushActivity(`Agreed trip <b>${F.trip}</b> → invoice`);
    }
  }, "Approve & invoice"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "warn",
    onClick: () => {
      toast('Trip disputed', `${F.trip} sent for review`, 'warn');
      pushActivity(`Disputed trip <b>${F.trip}</b>`);
    }
  }, "Dispute"))), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 8,
      padding: 12,
      border: '1px solid var(--line)',
      borderRadius: 8,
      background: 'var(--panel2)',
      width: 188,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      alignSelf: 'flex-start'
    }
  }, "QR-verified invoice"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "qr"
  }), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 20,
      color: 'var(--green)',
      lineHeight: 1
    }
  }, verified), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, "on screen = on invoice"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => toast('Live count opened', `Scan resolves to ${verified} verified trips`, 'accent')
  }, "Open live count"))), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8,
      color: 'var(--ink4)',
      alignSelf: 'flex-start'
    }
  }, "no QR match \xB7 no valid invoice"))));
  const Ledger = /*#__PURE__*/React.createElement(Panel, {
    title: "Trip Ledger",
    sub: trips.length + ' today',
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1.2fr 1.1fr 1fr',
      padding: '9px 14px',
      borderBottom: '1px solid var(--line)'
    }
  }, ['Trip · Plate', 'Route', 'Handshake', 'Result'].map(h => /*#__PURE__*/React.createElement("span", {
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
  }, trips.map(t => {
    const [ts, tl] = TRIP_TAG[t.status] || ['ghost', t.status];
    const act = {
      verified: 'View',
      suspended: 'Dual review',
      rejected: 'Investigate',
      unclaimed: 'Request note'
    }[t.status];
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      className: "lrow",
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr 1.1fr 1fr',
        alignItems: 'center',
        gap: 8
      },
      onClick: () => tripAct(t)
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 2,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 11.5,
        fontWeight: 600
      }
    }, t.id), /*#__PURE__*/React.createElement("span", {
      className: "mono label",
      style: {
        fontSize: 8
      }
    }, t.plate)), /*#__PURE__*/React.createElement("span", {
      className: "truncate label",
      style: {
        fontSize: 9
      }
    }, t.from, " \u2192 ", t.to), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      title: "Camera",
      style: {
        color: t.cam ? 'var(--green)' : 'var(--red)',
        fontSize: 11,
        fontWeight: 700
      }
    }, t.cam ? '✓' : '✗', "C"), /*#__PURE__*/React.createElement("span", {
      title: "Note",
      style: {
        color: t.note ? 'var(--green)' : 'var(--red)',
        fontSize: 11,
        fontWeight: 700
      }
    }, t.note ? '✓' : '✗', "N"), /*#__PURE__*/React.createElement("span", {
      title: "Timestamps",
      style: {
        color: t.times ? 'var(--green)' : 'var(--red)',
        fontSize: 11,
        fontWeight: 700
      }
    }, t.times ? '✓' : '✗', "T")), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gap: 6,
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Tag, {
      s: ts
    }, tl), /*#__PURE__*/React.createElement(Btn, {
      sm: true,
      kind: "ghost",
      onClick: e => {
        e.stopPropagation();
        tripAct(t);
      }
    }, act)));
  })));
  const Chain = /*#__PURE__*/React.createElement(Panel, {
    title: "Immutable Hash Chain",
    sub: "append-only \xB7 tamper-proof",
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    },
    right: /*#__PURE__*/React.createElement("span", {
      className: "chip"
    }, /*#__PURE__*/React.createElement("span", {
      className: cx('dot ok', live && 'live')
    }), live ? 'signing' : 'paused')
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    }
  }, chain.map(l => /*#__PURE__*/React.createElement("div", {
    key: l._k,
    className: cx('col', l.isNew && 'slidein'),
    style: {
      gap: 4,
      padding: '9px 2px',
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: l.ev.includes('REJECT') ? 'var(--red)' : l.ev.includes('VERIFIED') ? 'var(--green)' : 'var(--ink)'
    }
  }, l.ev), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--ink3)'
    }
  }, l.t)), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono label",
    style: {
      fontSize: 8.5
    }
  }, l.plate, l.load && l.load !== '—' ? ' · ' + l.load : '')), /*#__PURE__*/React.createElement("span", {
    className: "hashline hash-ok",
    style: {
      fontSize: 9
    }
  }, l.hash, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink4)'
    }
  }, " \u2190 ", l.prev))))), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      padding: '8px 12px',
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono hash-ok",
    style: {
      fontSize: 9.5
    }
  }, "\u25CF chain intact"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8,
      color: 'var(--ink4)'
    }
  }, "no edit \xB7 no override")));
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
      gridTemplateColumns: '320px minmax(0,1fr) 350px',
      gridTemplateRows: 'auto minmax(0,1fr)',
      gap: 14,
      gridTemplateAreas: '"kpis kpis kpis" "registry center right"'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'kpis'
    }
  }, Kpis), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'registry',
      minHeight: 0,
      display: 'grid'
    }
  }, Registry), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'center',
      minHeight: 0,
      display: 'grid',
      gridTemplateRows: 'auto minmax(0,1fr)',
      gap: 14
    }
  }, Featured, Ledger), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'right',
      minHeight: 0,
      display: 'grid',
      gridTemplateRows: 'minmax(0,1.05fr) minmax(0,0.95fr)',
      gap: 14
    }
  }, Chain, Alerts));
}
window.ScreenVerify = ScreenVerify;