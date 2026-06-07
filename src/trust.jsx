/* ============================================================
   HT-OS — Screen 5 · Trust & Verification  (window.ScreenTrust)
   Camera-verified trips, QR delivery notes, tamper-proof ledger.
   ============================================================ */
function ScreenTrust({ live, tick, go, toast, pushActivity }) {
  const D = window.HTOS;
  const V = D.verifyStats;
  const tnow = () => new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const mkHash = (seed) => `0x${seed}${'7f3a'}…${seed}${'b1'}`;

  const [trips, setTrips] = useState(() => D.trips.map(t => ({ ...t })));
  const [sel, setSel] = useState('DN-4471');
  const trip = trips.find(t => t.id === sel) || trips[0];

  const [prog, setProg] = useState({ 'DN-4468':64, 'DN-4470':38 });
  const [verified, setVerified] = useState({});
  const [tripsLogged, setTripsLogged] = useState(V.tripsToday);
  const [verifiedCount, setVerifiedCount] = useState(V.verified);

  // immutable ledger (stable keys so appends animate in)
  const ledKey = useRef(0);
  const [ledger, setLedger] = useState(() => D.ledger.map(l => ({ ...l, _k:'L'+(ledKey.current++) })));
  const streamRef = useRef(0);
  const lastTick = useRef(0);

  // live engine: creep progress + append signed ledger events
  useEffect(() => {
    if (!live || tick === lastTick.current) return;
    lastTick.current = tick;
    setProg(p => ({ 'DN-4468':Math.min(96, p['DN-4468']+3), 'DN-4470':Math.min(92, p['DN-4470']+4) }));
    if (tick % 2 === 0 && streamRef.current < D.ledgerStream.length) {
      const s = D.ledgerStream[streamRef.current++];
      setLedger(L => [{ t:tnow(), ev:s.ev, id:s.id, hash:mkHash(s.hashSeed), who:s.who, _k:'L'+(ledKey.current++), isNew:true }, ...L]);
      setTripsLogged(n => n + 1);
    }
  }, [tick, live]);

  const statTag = (s) => s === 'verified' ? <Tag s="ok">✓ Verified</Tag> : <Tag s="warn">◷ In transit</Tag>;

  const doVerify = (t) => {
    setVerified(v => ({ ...v, [t.id]:true }));
    if (t.status === 'transit') {
      toast('Verification queued', `${t.id} · auto-verify on arrival`, 'accent');
      pushActivity(`Queued verification — <b>${t.id}</b>`);
    } else {
      setLedger(L => [{ t:tnow(), ev:'DELIVERY_COUNTERSIGNED', id:t.id, hash:mkHash('c'+t.id.slice(-2)), who:'Executive · biometric', _k:'L'+(ledKey.current++), isNew:true }, ...L]);
      setTripsLogged(n => n + 1);
      setVerifiedCount(n => n + 1);
      toast('Counter-signed', `${t.id} · added to immutable ledger`, 'good');
      pushActivity(`Counter-signed delivery <b>${t.id}</b>`);
    }
  };

  const clearDeviation = (t) => {
    setTrips(ts => ts.map(x => x.id === t.id ? { ...x, dev:false, devNote:null, cleared:true } : x));
    setLedger(L => [{ t:tnow(), ev:'GEOFENCE_CLEARED', id:t.id, hash:mkHash('d'+t.id.slice(-2)), who:'Logistics · re-routed', _k:'L'+(ledKey.current++), isNew:true }, ...L]);
    toast('Deviation cleared', `${t.id} · back on planned route`, 'good');
    pushActivity(`Cleared geofence flag — <b>${t.id}</b>`);
  };

  return (
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'330px minmax(0,1fr) 340px', gridTemplateRows:'auto 1fr', gap:14, gridTemplateAreas:'"stats detail ledger" "trips detail ledger"' }}>

      {/* KPI strip */}
      <div style={{ gridArea:'stats', display:'grid' }}>
        <Panel title="Verification — Today" sub="paperless" glow>
          <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Kpi label="Trips logged" value={<Num value={tripsLogged} live={live} />} size={30} />
            <Kpi label="Camera-verified" value={<span style={{ color:'var(--green)' }}><Num value={verifiedCount} live={live} /></span>} size={30} />
            <Kpi label="Avg verify time" value={V.avgVerify} size={24} />
            <Kpi label="Disputes" value={<span style={{ color:'var(--green)' }}>{V.disputes}</span>} size={30} />
          </div>
          <div className="col" style={{ gap:7, marginTop:13, paddingTop:12, borderTop:'1px solid var(--line)' }}>
            <div className="between"><span className="label">Paperless delivery notes</span><span className="mono tnum" style={{ color:'var(--green)' }}>{V.paperless}%</span></div>
            <Bar value={V.paperless} s="ok" thick />
            <span className="label" style={{ fontSize:9, color:'var(--ink4)' }}>0 paper signatures · 0 manual entries · chain intact</span>
          </div>
        </Panel>
      </div>

      {/* trip list */}
      <div style={{ gridArea:'trips', minHeight:0, display:'grid' }}>
        <Panel title="Truck Trips · Factory ⇄ Site" sub={trips.length + ' active'} flush className="col" style={{ minHeight:0 }}>
          <div className="scrolly" style={{ flex:1 }}>
            {trips.map(t => {
              const pr = t.status === 'transit' ? (prog[t.id] ?? t.prog) : 100;
              return (
                <div key={t.id} className={cx('lrow', sel===t.id && 'sel')} onClick={() => setSel(t.id)} style={{ alignItems:'flex-start', padding:'11px 14px' }}>
                  <div className="col" style={{ flex:1, gap:6, minWidth:0 }}>
                    <div className="between" style={{ gap:8 }}>
                      <span className="mono nowrap" style={{ fontSize:12, fontWeight:600 }}>{t.id}</span>
                      {t.dev ? <Tag s="crit">⚠ Deviation</Tag> : statTag(t.status)}
                    </div>
                    <div className="between" style={{ gap:8 }}>
                      <span className="label truncate" style={{ fontSize:9 }}>{t.from} → {t.to}</span>
                      <span className="label nowrap" style={{ fontSize:9 }}>{t.cams} cams</span>
                    </div>
                    <Bar value={pr} s={t.dev ? 'crit' : t.status==='transit' ? 'info' : 'ok'} />
                    <div className="between" style={{ gap:8 }}>
                      <span className="label truncate" style={{ fontSize:8.5 }}>{t.load}</span>
                      <span className="label nowrap" style={{ fontSize:8.5 }}>{t.status==='transit' ? 'ETA '+t.eta : 'Arr '+t.arr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* detail — evidence */}
      <div style={{ gridArea:'detail', minHeight:0, display:'grid' }}>
        <Panel title={'Delivery Proof · ' + trip.id} sub={trip.from + ' → ' + trip.to}
          right={trip.dev ? <Tag s="crit">⚠ {trip.devNote}</Tag> : statTag(trip.status)} className="col" style={{ minHeight:0 }} glowCrit={trip.dev}>
          <div className="scrolly" style={{ flex:1, display:'flex', flexDirection:'column', gap:14 }}>

            {/* deviation banner + clear action */}
            {trip.dev &&
              <div className="alert crit">
                <div className="ico"><Code s="crit">!!</Code></div>
                <div className="col" style={{ gap:5, flex:1 }}>
                  <span style={{ fontSize:12.5 }}>{trip.devNote} — driver notified, awaiting re-route.</span>
                  <div className="row" style={{ gap:6 }}>
                    <Btn sm kind="danger" onClick={() => clearDeviation(trip)}>Re-route & clear</Btn>
                    <Btn sm kind="ghost" onClick={() => { toast('Driver contacted', `${trip.driver} · voice channel`, 'accent'); pushActivity(`Contacted driver — <b>${trip.id}</b>`); }}>Call driver</Btn>
                  </div>
                </div>
              </div>}

            {/* meta strip */}
            <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[['Load', trip.load],['Distance', trip.distance],['Departed', trip.dep],[trip.status==='transit' ? 'ETA' : 'Arrived', trip.status==='transit' ? trip.eta : trip.arr]].map(([k,v]) => (
                <div key={k} className="col" style={{ gap:4, padding:'9px 11px', border:'1px solid var(--line)', borderRadius:6, background:'var(--panel2)' }}>
                  <span className="label" style={{ fontSize:8.5 }}>{k}</span><span className="mono" style={{ fontSize:13 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* camera evidence */}
            <div className="col" style={{ gap:9 }}>
              <div className="between"><span className="label">Camera Evidence · AI-matched</span><span className="cam-id"><span className={cx('dot ok', live && 'live')} />{trip.cams} feeds</span></div>
              <div className="grid" style={{ gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {[['Factory load','CAM·01','05:38'],['Gate / weighbridge','CAM·02','05:42'],['Site unload','CAM·07', trip.status==='transit' ? 'pending' : '07:18']].map(([t,c,ts],i) => (
                  <div key={i} className="imgslot" style={{ aspectRatio:'4/3' }}
                    onClick={() => toast(`${c} · ${t}`, ts==='pending' ? 'Feed pending — awaiting arrival' : `Frame captured ${ts} · AI match 99%`, ts==='pending' ? 'accent' : 'good')}>
                    <span className="ph">{t}</span>
                    <span className="play">▶</span>
                    <div className="imeta">
                      <span className="cam-id"><span className="dot ok" />{c}</span>
                      <span className="mono" style={{ fontSize:9, color: ts==='pending' ? 'var(--amber)' : 'var(--ink2)' }}>{ts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR + tamperproof + verify action */}
            <div className="row" style={{ gap:14, alignItems:'stretch' }}>
              <div className="col" style={{ gap:9, padding:13, border:'1px solid var(--line)', borderRadius:8, background:'var(--panel2)', flex:1 }}>
                <span className="label">QR-Verifiable Delivery Note</span>
                <div className="row" style={{ gap:12, alignItems:'center' }}>
                  <div className="qr" />
                  <div className="col" style={{ gap:6, flex:1 }}>
                    <div className="between"><span className="label" style={{ fontSize:8.5 }}>Note</span><span className="mono" style={{ fontSize:11 }}>{trip.id} · DN</span></div>
                    <div className="between"><span className="label" style={{ fontSize:8.5 }}>Seal</span><span className="mono hash-ok" style={{ fontSize:11 }}>{trip.seal} ✓</span></div>
                    <div className="between"><span className="label" style={{ fontSize:8.5 }}>Driver</span><span className="mono" style={{ fontSize:11 }}>{trip.driver}</span></div>
                    <span className="hashline">{trip.hash}</span>
                  </div>
                </div>
              </div>

              <div className="col" style={{ gap:10, padding:13, border:'1px solid var(--line)', borderRadius:8, background:'var(--panel2)', width:230, justifyContent:'space-between' }}>
                <div className="col" style={{ gap:7 }}>
                  <span className="label">Tamper-proof record</span>
                  <div className="row" style={{ gap:7, alignItems:'center' }}>
                    <span className="dot ok" /><span className="mono hash-ok" style={{ fontSize:12 }}>Hash chain intact</span>
                  </div>
                  <span className="label" style={{ fontSize:8.5, color:'var(--ink4)', lineHeight:1.4 }}>Each event signed & linked. No edits possible after seal.</span>
                </div>
                {trip.status==='transit'
                  ? <Btn kind="primary" onClick={() => doVerify(trip)} disabled={verified[trip.id]}>
                      {verified[trip.id] ? '✓ Verification queued' : 'Verify on arrival'}
                    </Btn>
                  : verified[trip.id]
                    ? <Btn kind="good" disabled>✓ Counter-signed</Btn>
                    : <Btn kind="good" onClick={() => doVerify(trip)}>Approve & counter-sign</Btn>}
              </div>
            </div>

          </div>
        </Panel>
      </div>

      {/* ledger */}
      <div style={{ gridArea:'ledger', minHeight:0, display:'grid' }}>
        <Panel title="Immutable Ledger" sub="append-only" flush
          right={<span className="chip"><span className={cx('dot ok', live && 'live')} />{live ? 'signing' : 'paused'}</span>} className="col" style={{ minHeight:0 }}>
          <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:0 }}>
            {ledger.map((l) => (
              <div key={l._k} className={cx('col', l.isNew && 'slidein')} style={{ gap:5, padding:'10px 2px', borderBottom:'1px solid var(--line)' }}>
                <div className="between">
                  <span className="mono" style={{ fontSize:11, fontWeight:600, color: l.ev.includes('FLAG') ? 'var(--amber)' : l.ev.includes('CLEARED') || l.ev.includes('SIGNED') ? 'var(--green)' : 'var(--ink)' }}>{l.ev}</span>
                  <span className="mono" style={{ fontSize:10, color:'var(--ink3)' }}>{l.t}</span>
                </div>
                <div className="between">
                  <span className="label" style={{ fontSize:8.5 }}>{l.id}</span>
                  <span className="label" style={{ fontSize:8.5, color:'var(--ink4)' }}>{l.who}</span>
                </div>
                <span className="hashline hash-ok" style={{ fontSize:9.5 }}>{l.hash}</span>
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 12px', borderTop:'1px solid var(--line)' }}>
            <Btn kind="ghost" sm onClick={() => go('graph')}>Trace in knowledge graph →</Btn>
          </div>
        </Panel>
      </div>

    </div>
  );
}
window.ScreenTrust = ScreenTrust;
