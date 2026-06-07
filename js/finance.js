/* ============================================================
   HT-OS — Screen 11 · Finance & Accounts  (window.ScreenFinance)
   Cash, receivables (AR + aging), payables (AP), retention.
   ============================================================ */
const PAY_TAG = {
  approval: ['warn', 'Awaiting approval'],
  scheduled: ['ok', 'Scheduled'],
  paid: ['ok', 'Paid']
};
const BUCKET_S = {
  'Current': 'ok',
  '30+': 'accent',
  '60+': 'warn',
  '90+': 'crit'
};
function ScreenFinance({
  live,
  tick,
  go,
  toast,
  pushActivity
}) {
  const D = window.HTOS;
  const projName = id => (D.projects.find(p => p.id === id) || {}).name || id;
  const [invoices, setInvoices] = useState(() => D.arInvoices.map(i => ({
    ...i
  })));
  const [payables, setPayables] = useState(() => D.apPayables.map(p => ({
    ...p
  })));
  const [alerts, setAlerts] = useState(() => D.financeAlerts.map(a => ({
    ...a,
    status: 'open'
  })));
  const [cash, setCash] = useState(D.financeStats.cash);
  const paidRef = useRef(0);
  const lastTick = useRef(0);

  // live: collections trickle in; a large invoice clears
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    setCash(c => +(c + Math.random() * 0.6).toFixed(1));
    if (tick % 6 === 0 && paidRef.current < D.financeIncoming.length) {
      const ev = D.financeIncoming[paidRef.current++];
      setInvoices(list => list.filter(i => i.id !== 'INV-3041'));
      setCash(c => +(c + ev.amount).toFixed(1));
      toast('Payment received', ev.text.replace('Payment received — ', ''), 'good');
      pushActivity(`Payment received — <b>AED ${ev.amount}M</b> cleared`);
    }
  }, [tick, live]);
  const receivables = invoices.reduce((a, i) => a + i.amount, 0);
  const payDue = payables.reduce((a, p) => a + p.amount, 0);
  const retentionTotal = D.retentionRows.reduce((a, r) => a + r.amount, 0);
  const bucketSum = b => invoices.filter(i => i.bucket === b).reduce((a, i) => a + i.amount, 0);
  const chase = i => {
    toast('Invoice chased', `${i.id} · ${projName(i.proj)} · reminder sent`, 'warn');
    pushActivity(`Chased invoice <b>${i.id}</b> — ${projName(i.proj)}`);
  };
  const approvePay = p => {
    setPayables(list => list.map(x => x.id === p.id ? {
      ...x,
      status: 'scheduled'
    } : x));
    toast('Payment approved', `${p.supplier} · AED ${p.amount}M scheduled`, 'good');
    pushActivity(`Approved payment <b>${p.id}</b> — ${p.supplier}`);
  };
  const releaseRet = r => {
    toast('Retention released', `${projName(r.proj)} · AED ${r.amount}M certificate raised`, 'good');
    pushActivity(`Released retention — <b>${projName(r.proj)}</b> AED ${r.amount}M`);
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
      toast(a.primary.label, `${a.id} · actioned`, a.primary.kind === 'good' ? 'good' : 'accent');
      pushActivity(`${a.primary.label} — <b>${a.id}</b>`);
      resolveAlert(a);
    } else {
      toast('Resolved & closed', `${a.id} closed`, 'good');
      pushActivity(`Resolved <b>${a.id}</b> — finance`);
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
    title: "Finance & Accounts",
    sub: "AED \xB7 live",
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
    label: "Cash position",
    value: /*#__PURE__*/React.createElement("span", null, "AED ", cash.toFixed(1), /*#__PURE__*/React.createElement("span", {
      className: "kpi-unit"
    }, " M")),
    size: 26,
    spark: D.financeStats.cashSpark,
    sparkColor: "var(--green)",
    delta: "\u25B2 collections in"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Receivables",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--amber)'
      }
    }, "AED ", receivables, "M"),
    size: 26,
    delta: 'AED ' + bucketSum('90+') + 'M overdue 90+',
    deltaDir: "down"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Payables due",
    value: /*#__PURE__*/React.createElement("span", null, "AED ", payDue.toFixed(1), /*#__PURE__*/React.createElement("span", {
      className: "kpi-unit"
    }, " M")),
    size: 26,
    delta: payables.filter(p => p.status === 'approval').length + ' awaiting approval',
    deltaDir: "flat"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Retention held",
    value: /*#__PURE__*/React.createElement("span", null, "AED ", retentionTotal, /*#__PURE__*/React.createElement("span", {
      className: "kpi-unit"
    }, " M")),
    size: 26,
    delta: "across 6 projects",
    deltaDir: "flat"
  })));
  const AR = /*#__PURE__*/React.createElement(Panel, {
    title: "Receivables \xB7 Aging",
    sub: 'AED ' + receivables + 'M outstanding',
    flush: true,
    className: "col",
    style: {
      minHeight: 0
    },
    glowCrit: bucketSum('90+') > 0
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 10,
      padding: '12px 12px 4px'
    }
  }, ['Current', '30+', '60+', '90+'].map(b => /*#__PURE__*/React.createElement("div", {
    key: b,
    className: "col",
    style: {
      gap: 4,
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
  }, b === 'Current' ? 'Current' : b + ' days'), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 15,
      color: stateColor[BUCKET_S[b]]
    }
  }, bucketSum(b), /*#__PURE__*/React.createElement("span", {
    className: "kpi-unit",
    style: {
      fontSize: 8
    }
  }, " M"))))), /*#__PURE__*/React.createElement("div", {
    className: "scrolly",
    style: {
      flex: 1,
      padding: '4px 0'
    }
  }, invoices.map(i => /*#__PURE__*/React.createElement("div", {
    key: i.id,
    className: "lrow",
    style: {
      alignItems: 'center',
      gap: 11
    },
    onClick: () => go('project', i.proj),
    title: "Open project \u2192"
  }, /*#__PURE__*/React.createElement(Dot, {
    s: i.s,
    live: live && i.s === 'crit'
  }), /*#__PURE__*/React.createElement("div", {
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
      fontSize: 11.5,
      fontWeight: 600
    }
  }, i.id), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 12.5
    }
  }, "AED ", i.amount, "M")), /*#__PURE__*/React.createElement("span", {
    className: "truncate label",
    style: {
      fontSize: 8.5
    }
  }, projName(i.proj), " \xB7 ", i.client)), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      alignItems: 'flex-end',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    s: i.s
  }, i.age, "d"), i.bucket === '60+' || i.bucket === '90+' ? /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: i.bucket === '90+' ? 'danger' : 'warn',
    onClick: e => {
      e.stopPropagation();
      chase(i);
    }
  }, "Chase") : /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8
    }
  }, i.bucket))))));
  const Payables = /*#__PURE__*/React.createElement(Panel, {
    title: "Payables \xB7 Suppliers",
    sub: 'AED ' + payDue.toFixed(1) + 'M due',
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
  }, payables.map(p => {
    const [ts, tl] = PAY_TAG[p.status] || ['ghost', p.status];
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      className: "col",
      style: {
        gap: 6,
        padding: '10px 11px',
        border: '1px solid var(--line)',
        borderRadius: 6,
        background: 'var(--panel2)',
        boxShadow: p.s === 'crit' ? 'inset 0 0 0 1px var(--red-line)' : 'none'
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
    }, p.supplier), /*#__PURE__*/React.createElement("span", {
      className: "mono tnum",
      style: {
        fontSize: 12.5
      }
    }, "AED ", p.amount, "M")), /*#__PURE__*/React.createElement("div", {
      className: "between",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gap: 8,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(Tag, {
      s: ts
    }, tl), /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        fontSize: 8.5,
        color: p.s === 'crit' ? 'var(--red)' : 'var(--ink3)'
      }
    }, "due ", p.due)), p.status === 'approval' ? /*#__PURE__*/React.createElement(Btn, {
      sm: true,
      kind: "good",
      onClick: () => approvePay(p)
    }, "Approve payment") : /*#__PURE__*/React.createElement(Btn, {
      sm: true,
      kind: "ghost",
      onClick: () => toast('Payment on schedule', `${p.supplier} · ${p.due}`, 'good')
    }, "Track")));
  })));
  const Retention = /*#__PURE__*/React.createElement(Panel, {
    title: "Retention Held",
    sub: 'AED ' + retentionTotal + 'M',
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
  }, D.retentionRows.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.proj,
    className: "lrow",
    style: {
      alignItems: 'center',
      gap: 11
    },
    onClick: () => go('project', r.proj)
  }, /*#__PURE__*/React.createElement(Dot, {
    s: r.s
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
  }, projName(r.proj)), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "release \xB7 ", r.release)), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 13
    }
  }, "AED ", r.amount, "M"), r.s === 'warn' ? /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "primary",
    onClick: e => {
      e.stopPropagation();
      releaseRet(r);
    }
  }, "Release") : /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8,
      width: 54,
      textAlign: 'right'
    }
  }, "held")))));
  const Alerts = /*#__PURE__*/React.createElement(Panel, {
    title: "Finance Alerts",
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
  }, "All clear \u2014 books balanced")), alerts.map(a => {
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
    }, a.primary.label), /*#__PURE__*/React.createElement(Btn, {
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
      gridTemplateAreas: '"kpis kpis kpis" "ar payables alerts" "ar retention alerts"'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'kpis'
    }
  }, Kpis), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'ar',
      minHeight: 0,
      display: 'grid'
    }
  }, AR), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'payables',
      minHeight: 0,
      display: 'grid'
    }
  }, Payables), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'retention',
      minHeight: 0,
      display: 'grid'
    }
  }, Retention), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'alerts',
      minHeight: 0,
      display: 'grid'
    }
  }, Alerts));
}
window.ScreenFinance = ScreenFinance;