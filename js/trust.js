/* ============================================================
   HT-OS — Screen 5 · Trust & Verification  (window.ScreenTrust)
   Camera-verified trips, QR delivery notes, tamper-proof ledger.
   ============================================================ */
function ScreenTrust({
  live,
  tick,
  go,
  toast,
  pushActivity
}) {
  const D = window.HTOS;
  const V = D.verifyStats;
  const tnow = () => new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const mkHash = seed => `0x${seed}${'7f3a'}…${seed}${'b1'}`;
  const [trips, setTrips] = useState(() => D.trips.map(t => ({
    ...t
  })));
  const [sel, setSel] = useState('DN-4471');
  const trip = trips.find(t => t.id === sel) || trips[0];
  const [prog, setProg] = useState({
    'DN-4468': 64,
    'DN-4470': 38
  });
  const [verified, setVerified] = useState({});
  const [tripsLogged, setTripsLogged] = useState(V.tripsToday);
  const [verifiedCount, setVerifiedCount] = useState(V.verified);

  // immutable ledger (stable keys so appends animate in)
  const ledKey = useRef(0);
  const [ledger, setLedger] = useState(() => D.ledger.map(l => ({
    ...l,
    _k: 'L' + ledKey.current++
  })));
  const streamRef = useRef(0);
  const lastTick = useRef(0);

  // live engine: creep progress + append signed ledger events
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    setProg(p => ({
      'DN-4468': Math.min(96, p['DN-4468'] + 3),
      'DN-4470': Math.min(92, p['DN-4470'] + 4)
    }));
    if (tick % 2 === 0 && streamRef.current < D.ledgerStream.length) {
      const s = D.ledgerStream[streamRef.current++];
      setLedger(L => [{
        t: tnow(),
        ev: s.ev,
        id: s.id,
        hash: mkHash(s.hashSeed),
        who: s.who,
        _k: 'L' + ledKey.current++,
        isNew: true
      }, ...L]);
      setTripsLogged(n => n + 1);
    }
  }, [tick, live]);
  const statTag = s => s === 'verified' ? /*#__PURE__*/React.createElement(Tag, {
    s: "ok"
  }, "\u2713 Verified") : /*#__PURE__*/React.createElement(Tag, {
    s: "warn"
  }, "\u25F7 In transit");
  const doVerify = t => {
    setVerified(v => ({
      ...v,
      [t.id]: true
    }));
    if (t.status === 'transit') {
      toast('Verification queued', `${t.id} · auto-verify on arrival`, 'accent');
      pushActivity(`Queued verification — <b>${t.id}</b>`);
    } else {
      setLedger(L => [{
        t: tnow(),
        ev: 'DELIVERY_COUNTERSIGNED',
        id: t.id,
        hash: mkHash('c' + t.id.slice(-2)),
        who: 'Executive · biometric',
        _k: 'L' + ledKey.current++,
        isNew: true
      }, ...L]);
      setTripsLogged(n => n + 1);
      setVerifiedCount(n => n + 1);
      toast('Counter-signed', `${t.id} · added to immutable ledger`, 'good');
      pushActivity(`Counter-signed delivery <b>${t.id}</b>`);
    }
  };
  const clearDeviation = t => {
    setTrips(ts => ts.map(x => x.id === t.id ? {
      ...x,
      dev: false,
      devNote: null,
      cleared: true
    } : x));
    setLedger(L => [{
      t: tnow(),
      ev: 'GEOFENCE_CLEARED',
      id: t.id,
      hash: mkHash('d' + t.id.slice(-2)),
      who: 'Logistics · re-routed',
      _k: 'L' + ledKey.current++,
      isNew: true
    }, ...L]);
    toast('Deviation cleared', `${t.id} · back on planned route`, 'good');
    pushActivity(`Cleared geofence flag — <b>${t.id}</b>`);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "screen pad fade-in",
    style: {
      display: 'grid',
      gridTemplateColumns: '330px minmax(0,1fr) 340px',
      gridTemplateRows: 'auto 1fr',
      gap: 14,
      gridTemplateAreas: '"stats detail ledger" "trips detail ledger"'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'stats',
      display: 'grid'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Verification \u2014 Today",
    sub: "paperless",
    glow: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Trips logged",
    value: /*#__PURE__*/React.createElement(Num, {
      value: tripsLogged,
      live: live
    }),
    size: 30
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Camera-verified",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green)'
      }
    }, /*#__PURE__*/React.createElement(Num, {
      value: verifiedCount,
      live: live
    })),
    size: 30
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Avg verify time",
    value: V.avgVerify,
    size: 24
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Disputes",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green)'
      }
    }, V.disputes),
    size: 30
  })), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 7,
      marginTop: 13,
      paddingTop: 12,
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Paperless delivery notes"), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      color: 'var(--green)'
    }
  }, V.paperless, "%")), /*#__PURE__*/React.createElement(Bar, {
    value: V.paperless,
    s: "ok",
    thick: true
  }), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 9,
      color: 'var(--ink4)'
    }
  }, "0 paper signatures \xB7 0 manual entries \xB7 chain intact")))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'trips',
      minHeight: 0,
      display: 'grid'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Truck Trips \xB7 Factory \u21C4 Site",
    sub: trips.length + ' active',
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
  }, trips.map(t => {
    const pr = t.status === 'transit' ? prog[t.id] ?? t.prog : 100;
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      className: cx('lrow', sel === t.id && 'sel'),
      onClick: () => setSel(t.id),
      style: {
        alignItems: 'flex-start',
        padding: '11px 14px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        flex: 1,
        gap: 6,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "between",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono nowrap",
      style: {
        fontSize: 12,
        fontWeight: 600
      }
    }, t.id), t.dev ? /*#__PURE__*/React.createElement(Tag, {
      s: "crit"
    }, "\u26A0 Deviation") : statTag(t.status)), /*#__PURE__*/React.createElement("div", {
      className: "between",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "label truncate",
      style: {
        fontSize: 9
      }
    }, t.from, " \u2192 ", t.to), /*#__PURE__*/React.createElement("span", {
      className: "label nowrap",
      style: {
        fontSize: 9
      }
    }, t.cams, " cams")), /*#__PURE__*/React.createElement(Bar, {
      value: pr,
      s: t.dev ? 'crit' : t.status === 'transit' ? 'info' : 'ok'
    }), /*#__PURE__*/React.createElement("div", {
      className: "between",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "label truncate",
      style: {
        fontSize: 8.5
      }
    }, t.load), /*#__PURE__*/React.createElement("span", {
      className: "label nowrap",
      style: {
        fontSize: 8.5
      }
    }, t.status === 'transit' ? 'ETA ' + t.eta : 'Arr ' + t.arr))));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'detail',
      minHeight: 0,
      display: 'grid'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: 'Delivery Proof · ' + trip.id,
    sub: trip.from + ' → ' + trip.to,
    right: trip.dev ? /*#__PURE__*/React.createElement(Tag, {
      s: "crit"
    }, "\u26A0 ", trip.devNote) : statTag(trip.status),
    className: "col",
    style: {
      minHeight: 0
    },
    glowCrit: trip.dev
  }, /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, trip.dev && /*#__PURE__*/React.createElement("div", {
    className: "alert crit"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ico"
  }, /*#__PURE__*/React.createElement(Code, {
    s: "crit"
  }, "!!")), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 5,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5
    }
  }, trip.devNote, " \u2014 driver notified, awaiting re-route."), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "danger",
    onClick: () => clearDeviation(trip)
  }, "Re-route & clear"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => {
      toast('Driver contacted', `${trip.driver} · voice channel`, 'accent');
      pushActivity(`Contacted driver — <b>${trip.id}</b>`);
    }
  }, "Call driver")))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 10
    }
  }, [['Load', trip.load], ['Distance', trip.distance], ['Departed', trip.dep], [trip.status === 'transit' ? 'ETA' : 'Arrived', trip.status === 'transit' ? trip.eta : trip.arr]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "col",
    style: {
      gap: 4,
      padding: '9px 11px',
      border: '1px solid var(--line)',
      borderRadius: 6,
      background: 'var(--panel2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 13
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Camera Evidence \xB7 AI-matched"), /*#__PURE__*/React.createElement("span", {
    className: "cam-id"
  }, /*#__PURE__*/React.createElement("span", {
    className: cx('dot ok', live && 'live')
  }), trip.cams, " feeds")), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 10
    }
  }, [['Factory load', 'CAM·01', '05:38'], ['Gate / weighbridge', 'CAM·02', '05:42'], ['Site unload', 'CAM·07', trip.status === 'transit' ? 'pending' : '07:18']].map(([t, c, ts], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "imgslot",
    style: {
      aspectRatio: '4/3'
    },
    onClick: () => toast(`${c} · ${t}`, ts === 'pending' ? 'Feed pending — awaiting arrival' : `Frame captured ${ts} · AI match 99%`, ts === 'pending' ? 'accent' : 'good')
  }, /*#__PURE__*/React.createElement("span", {
    className: "ph"
  }, t), /*#__PURE__*/React.createElement("span", {
    className: "play"
  }, "\u25B6"), /*#__PURE__*/React.createElement("div", {
    className: "imeta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cam-id"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot ok"
  }), c), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 9,
      color: ts === 'pending' ? 'var(--amber)' : 'var(--ink2)'
    }
  }, ts)))))), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 14,
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 9,
      padding: 13,
      border: '1px solid var(--line)',
      borderRadius: 8,
      background: 'var(--panel2)',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "QR-Verifiable Delivery Note"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "qr"
  }), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 6,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "Note"), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11
    }
  }, trip.id, " \xB7 DN")), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "Seal"), /*#__PURE__*/React.createElement("span", {
    className: "mono hash-ok",
    style: {
      fontSize: 11
    }
  }, trip.seal, " \u2713")), /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "Driver"), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11
    }
  }, trip.driver)), /*#__PURE__*/React.createElement("span", {
    className: "hashline"
  }, trip.hash)))), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 10,
      padding: 13,
      border: '1px solid var(--line)',
      borderRadius: 8,
      background: 'var(--panel2)',
      width: 230,
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Tamper-proof record"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 7,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot ok"
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono hash-ok",
    style: {
      fontSize: 12
    }
  }, "Hash chain intact")), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--ink4)',
      lineHeight: 1.4
    }
  }, "Each event signed & linked. No edits possible after seal.")), trip.status === 'transit' ? /*#__PURE__*/React.createElement(Btn, {
    kind: "primary",
    onClick: () => doVerify(trip),
    disabled: verified[trip.id]
  }, verified[trip.id] ? '✓ Verification queued' : 'Verify on arrival') : verified[trip.id] ? /*#__PURE__*/React.createElement(Btn, {
    kind: "good",
    disabled: true
  }, "\u2713 Counter-signed") : /*#__PURE__*/React.createElement(Btn, {
    kind: "good",
    onClick: () => doVerify(trip)
  }, "Approve & counter-sign")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'ledger',
      minHeight: 0,
      display: 'grid'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Immutable Ledger",
    sub: "append-only",
    flush: true,
    right: /*#__PURE__*/React.createElement("span", {
      className: "chip"
    }, /*#__PURE__*/React.createElement("span", {
      className: cx('dot ok', live && 'live')
    }), live ? 'signing' : 'paused'),
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
      gap: 0
    }
  }, ledger.map(l => /*#__PURE__*/React.createElement("div", {
    key: l._k,
    className: cx('col', l.isNew && 'slidein'),
    style: {
      gap: 5,
      padding: '10px 2px',
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: l.ev.includes('FLAG') ? 'var(--amber)' : l.ev.includes('CLEARED') || l.ev.includes('SIGNED') ? 'var(--green)' : 'var(--ink)'
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
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, l.id), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--ink4)'
    }
  }, l.who)), /*#__PURE__*/React.createElement("span", {
    className: "hashline hash-ok",
    style: {
      fontSize: 9.5
    }
  }, l.hash)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 12px',
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "ghost",
    sm: true,
    onClick: () => go('graph')
  }, "Trace in knowledge graph \u2192")))));
}
window.ScreenTrust = ScreenTrust;