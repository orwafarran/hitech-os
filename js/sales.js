/* ============================================================
   HT-OS — Screen 6 · Sales & Orders  (window.ScreenSales)
   Pipeline funnel, live order book, quotes/enquiries, alerts.
   Won orders feed the project lifecycle.
   ============================================================ */
const ORDER_TAG = {
  production: ['ok', 'In production'],
  design: ['accent', 'Design'],
  closeout: ['ok', 'Closeout'],
  install: ['ok', 'Installing'],
  hold: ['crit', 'On hold']
};
function ScreenSales({
  live,
  tick,
  go,
  toast,
  pushActivity
}) {
  const D = window.HTOS;
  const projName = id => (D.projects.find(p => p.id === id) || {}).name || '—';
  const [orders, setOrders] = useState(() => D.orderBook.map(o => ({
    ...o
  })));
  const [quotes, setQuotes] = useState(() => D.salesQuotes.map(q => ({
    ...q
  })));
  const [enquiries, setEnquiries] = useState(() => D.salesEnquiries.map(e => ({
    ...e
  })));
  const [alerts, setAlerts] = useState(() => D.salesAlerts.map(a => ({
    ...a,
    status: 'open'
  })));
  const [ob, setOb] = useState(D.salesStats.orderBook);
  const [wins, setWins] = useState(D.salesStats.winsCount);
  const [enqCount, setEnqCount] = useState(D.salesFunnel[0].count);
  const soSeq = useRef(2060);
  const qSeq = useRef(1195);
  const incRef = useRef(0);
  const lastTick = useRef(0);

  // live: enquiries keep arriving
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    if (tick % 4 === 0) setEnqCount(c => c + 1);
    if (tick % 6 === 0 && incRef.current < D.salesIncoming.length) {
      const e = D.salesIncoming[incRef.current++];
      setEnquiries(es => [{
        ...e,
        isNew: true
      }, ...es]);
      setEnqCount(c => c + 1);
      pushActivity(`New enquiry <b>${e.id}</b> — ${e.client}`);
    }
  }, [tick, live]);
  const funnel = [{
    ...D.salesFunnel[0],
    count: enqCount
  }, D.salesFunnel[1], D.salesFunnel[2]];
  const fMax = Math.max(...funnel.map(f => f.value));
  const winQuote = q => {
    setQuotes(qs => qs.filter(x => x.id !== q.id));
    const so = 'SO-' + ++soSeq.current;
    setOrders(os => [{
      id: so,
      client: q.client,
      proj: q.proj,
      item: (q.desc.split('—')[1] || 'Precast package').trim(),
      qty: Math.round(q.value * 12 / 10) * 10,
      value: q.value,
      status: 'production',
      s: 'ok',
      isNew: true
    }, ...os]);
    setOb(v => v + q.value);
    setWins(w => w + 1);
    toast('Quote won', `${q.id} → ${so} created · ${projName(q.proj)} enters production`, 'good');
    pushActivity(`Won quote <b>${q.id}</b> → ${so} · ${projName(q.proj)} → production`);
  };
  const convertEnquiry = e => {
    setEnquiries(es => es.filter(x => x.id !== e.id));
    const qid = 'Q-' + ++qSeq.current;
    setQuotes(qs => [{
      id: qid,
      client: e.client,
      proj: null,
      desc: e.desc,
      value: e.est,
      expires: '21 days',
      s: 'ok',
      isNew: true
    }, ...qs]);
    toast('Enquiry converted', `${e.id} → ${qid} drafted`, 'accent');
    pushActivity(`Converted enquiry <b>${e.id}</b> → quote ${qid}`);
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
      if (a.primary.label === 'Approve quote' && a.quote) {
        const q = quotes.find(x => x.id === a.quote);
        if (q) winQuote(q);
      } else {
        toast(a.primary.label, `${a.id} · actioned`, a.primary.kind === 'good' ? 'good' : 'accent');
        pushActivity(`${a.primary.label} — <b>${a.id}</b>`);
      }
      resolveAlert(a);
    } else {
      toast('Resolved & closed', `${a.id} closed`, 'good');
      pushActivity(`Resolved <b>${a.id}</b> — sales`);
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
    title: "Commercial Overview",
    sub: "June 2026 \xB7 live",
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
    label: "Order-book value",
    value: /*#__PURE__*/React.createElement("span", null, "AED ", fmt(ob), /*#__PURE__*/React.createElement("span", {
      className: "kpi-unit"
    }, " M")),
    size: 28,
    delta: "\u25B2 contracted backlog",
    deltaDir: "flat"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Wins this month",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green)'
      }
    }, "AED ", D.salesStats.winsMonth, "M"),
    size: 28,
    spark: D.salesStats.winsSpark,
    sparkColor: "var(--green)",
    delta: '▲ ' + wins + ' orders won'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Pipeline value",
    value: /*#__PURE__*/React.createElement("span", null, "AED ", fmt(D.salesStats.pipeline), /*#__PURE__*/React.createElement("span", {
      className: "kpi-unit"
    }, " M")),
    size: 28,
    delta: enqCount + ' enquiries open',
    deltaDir: "flat"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--line)',
      margin: '0 16px'
    }
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Conversion rate",
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--accent)'
      }
    }, D.salesStats.conversion, "%"),
    size: 28,
    delta: "\u25B2 3.2 pts vs Q1"
  })));
  const Funnel = /*#__PURE__*/React.createElement(Panel, {
    title: "Pipeline Funnel",
    sub: "enquiries \u2192 quotes \u2192 won",
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 13
    }
  }, funnel.map((st, i) => /*#__PURE__*/React.createElement("div", {
    key: st.k,
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
  }, st.k), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement(Num, {
    value: st.count,
    live: live
  }), " \xB7 AED ", fmt(st.value), "M")), /*#__PURE__*/React.createElement(Bar, {
    value: st.value,
    max: fMax,
    thick: true,
    s: st.s === 'ok' ? 'ok' : ''
  }), i < funnel.length - 1 && /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8,
      color: 'var(--ink4)',
      alignSelf: 'flex-end'
    }
  }, "\u2193 ", Math.round(funnel[i + 1].value / st.value * 100), "% advance")))), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      marginTop: 12,
      paddingTop: 11,
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "Win rate (quote \u2192 won)"), /*#__PURE__*/React.createElement("span", {
    className: "delta up"
  }, "\u25B2 ", D.salesStats.conversion, "%")));
  const Pipeline = /*#__PURE__*/React.createElement(Panel, {
    title: "Quotes & Enquiries",
    sub: quotes.length + ' quotes · ' + enquiries.length + ' enquiries',
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
  }, /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      color: 'var(--ink3)'
    }
  }, "Open Quotes"), quotes.map(q => /*#__PURE__*/React.createElement("div", {
    key: q.id,
    className: cx('col', q.isNew && 'slidein'),
    style: {
      gap: 7,
      padding: 11,
      border: '1px solid var(--line)',
      borderRadius: 6,
      background: 'var(--panel2)',
      boxShadow: q.s === 'crit' ? 'inset 0 0 0 1px var(--red-line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, q.id), /*#__PURE__*/React.createElement("span", {
    className: "mono tnum",
    style: {
      fontSize: 13
    }
  }, "AED ", fmt(q.value), "M")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink2)',
      lineHeight: 1.3
    }
  }, q.desc), /*#__PURE__*/React.createElement("div", {
    className: "between",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    s: q.s
  }, q.s === 'crit' ? '⚠ Expires ' + q.expires : q.stalled ? '◷ Stalled' : 'Expires ' + q.expires), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "good",
    onClick: () => winQuote(q)
  }, "Approve quote"), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "ghost",
    onClick: () => {
      toast('Escalated', `${q.id} · Commercial Director`, 'warn');
      pushActivity(`Escalated quote <b>${q.id}</b>`);
    }
  }, "Escalate"))))), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      color: 'var(--ink3)',
      marginTop: 4
    }
  }, "Enquiries"), enquiries.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.id,
    className: cx('between', e.isNew && 'slidein'),
    style: {
      gap: 8,
      padding: '10px 11px',
      border: '1px solid var(--line)',
      borderRadius: 6,
      background: 'var(--panel2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 3,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      fontWeight: 600
    }
  }, e.id), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5
    }
  }, "est AED ", e.est, "M")), /*#__PURE__*/React.createElement("span", {
    className: "truncate",
    style: {
      fontSize: 11.5,
      color: 'var(--ink2)'
    }
  }, e.client, " \xB7 ", e.desc)), /*#__PURE__*/React.createElement(Btn, {
    sm: true,
    kind: "primary",
    onClick: () => convertEnquiry(e)
  }, "Convert \u2192")))));
  const Orders = /*#__PURE__*/React.createElement(Panel, {
    title: "Order Book",
    sub: orders.length + ' live orders',
    flush: true,
    right: /*#__PURE__*/React.createElement("span", {
      className: "chip"
    }, "AED ", fmt(ob), "M total"),
    className: "col",
    style: {
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '0.9fr 1.4fr 1.3fr 0.7fr 0.9fr',
      padding: '9px 14px',
      borderBottom: '1px solid var(--line)'
    }
  }, ['Order', 'Client / Project', 'Element × Qty', 'Value', 'Status'].map(h => /*#__PURE__*/React.createElement("span", {
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
  }, orders.map(o => {
    const [ts, tl] = ORDER_TAG[o.status] || ['ghost', o.status];
    return /*#__PURE__*/React.createElement("div", {
      key: o.id,
      className: cx('lrow', o.isNew && 'slidein'),
      style: {
        display: 'grid',
        gridTemplateColumns: '0.9fr 1.4fr 1.3fr 0.7fr 0.9fr',
        alignItems: 'center',
        gap: 8
      },
      onClick: () => go('project', o.proj),
      title: "Open in project lifecycle \u2192"
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 12,
        fontWeight: 600
      }
    }, o.id), /*#__PURE__*/React.createElement("div", {
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
    }, projName(o.proj)), /*#__PURE__*/React.createElement("span", {
      className: "label truncate",
      style: {
        fontSize: 8
      }
    }, o.client)), /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 2,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "truncate",
      style: {
        fontSize: 11.5,
        color: 'var(--ink2)'
      }
    }, o.item), /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        fontSize: 8
      }
    }, fmt(o.qty), " elements")), /*#__PURE__*/React.createElement("span", {
      className: "mono tnum",
      style: {
        fontSize: 12.5
      }
    }, o.value, "M"), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        gap: 6,
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Tag, {
      s: ts
    }, tl), /*#__PURE__*/React.createElement("span", {
      className: "label",
      style: {
        fontSize: 13,
        color: 'var(--ink4)'
      }
    }, "\u2192")));
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
  }, "\u25CF confirmed orders live in production lifecycle"), /*#__PURE__*/React.createElement("span", {
    className: "label",
    style: {
      fontSize: 8.5,
      color: 'var(--ink4)'
    }
  }, "click a row to trace \u2192")));
  const Alerts = /*#__PURE__*/React.createElement(Panel, {
    title: "Sales Alerts",
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
  }, "All clear \u2014 pipeline healthy")), alerts.map(a => {
    const done = a.status === 'resolved';
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      className: cx('alert', a.sev, a.status === 'escalated' && 'escalated', a.removing && 'removing')
    }, /*#__PURE__*/React.createElement("div", {
      className: "ico"
    }, /*#__PURE__*/React.createElement(Code, {
      s: a.sev
    }, "$")), /*#__PURE__*/React.createElement("div", {
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
      gridTemplateColumns: '340px minmax(0,1fr) 360px',
      gridTemplateRows: 'auto minmax(0,1fr)',
      gap: 14,
      gridTemplateAreas: '"kpis kpis kpis" "left orders alerts"'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'kpis'
    }
  }, Kpis), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'left',
      minHeight: 0,
      display: 'grid',
      gridTemplateRows: 'auto minmax(0,1fr)',
      gap: 14
    }
  }, Funnel, Pipeline), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'orders',
      minHeight: 0,
      display: 'grid'
    }
  }, Orders), /*#__PURE__*/React.createElement("div", {
    style: {
      gridArea: 'alerts',
      minHeight: 0,
      display: 'grid'
    }
  }, Alerts));
}
window.ScreenSales = ScreenSales;