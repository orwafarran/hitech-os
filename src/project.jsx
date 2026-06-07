/* ============================================================
   HT-OS — Screen 2 · Project View (drill-in)  (window.ScreenProject)
   ============================================================ */
const STAGEP = { design:'Design', approve:'Approvals', production:'Production', install:'Installation', delivery:'Delivery' };

function ScreenProject({ live, tick, go, toast, pushActivity, pid }) {
  const D = window.HTOS;
  const p = D.projects.find(x => x.id === pid) || D.projects[0];

  // chain: use detailed yasChain for Yas Acres, else derive from pct
  const chain = p.id === 'YAS' ? D.yasChain : [
    { k:'Design', pct:Math.min(100, p.pct*2.2), state: p.pct>10 ? 'done':'active', meta:'IFC drawings' },
    { k:'Approvals', pct:Math.min(100, p.pct*1.9), state: p.pct>20 ? 'done':'active', meta:'consultant sign-off' },
    { k:'Production', pct:Math.min(100, p.pct*1.3), state: p.pct>30 && p.pct<90 ? 'active' : p.pct>=90 ? 'done':'idle', meta:fmt(p.done)+' / '+fmt(p.elements)+' cast' },
    { k:'Delivery', pct:Math.max(0, p.pct-12), state: p.pct>50 ? 'active':'idle', meta:'to site' },
    { k:'Install', pct:Math.max(0, p.pct-18), state: p.pct>80 ? 'active':'idle', meta:'on site' },
  ];
  const els = p.id === 'YAS' ? D.yasElements : D.yasElements.slice(0,5);
  const risks = p.id === 'YAS' ? D.yasRisks : [
    { id:'r1', sev:p.risk, t:p.risk==='crit' ? 'Approval blocking production' : p.risk==='warn' ? 'Schedule float tightening' : 'On programme', m:p.desc },
    { id:'r2', sev:'ok', t:'Plant capacity secured', m:'Allocated to '+(D.factories.find(f=>f.id===p.plant)||{}).short },
  ];

  const stageColor = { Installed:'ok', Loaded:'ok', Stored:'ok', Cured:'ok', Cast:'ok', QC:'warn', Quarantine:'crit' };

  // live element churn
  const [done, setDone] = useState(p.done);
  useEffect(() => { if (live && tick > 0 && p.stage === 'production') setDone(d => Math.min(p.elements, d + Math.round(1 + Math.random()*3))); }, [tick]);

  const riskAct = (r, kind) => {
    if (kind === 'escalate') { toast('Risk escalated', `${r.t} · routed to Project Director`, 'warn'); pushActivity(`Escalated risk — <b>${p.name}</b>`); }
    else { toast('Risk acknowledged', `${r.t} · on watchlist`, 'good'); pushActivity(`Acknowledged risk — <b>${p.name}</b>`); }
  };

  return (
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 330px', gridTemplateRows:'auto auto 1fr', gap:14 }}>

      {/* header */}
      <div style={{ gridColumn:'1 / -1' }}>
        <Panel glow={p.risk!=='crit'} glowCrit={p.risk==='crit'}>
          <div className="between" style={{ alignItems:'flex-start' }}>
            <div className="col" style={{ gap:9 }}>
              <div className="row" style={{ gap:10, alignItems:'center' }}>
                <Btn kind="ghost" sm onClick={() => go('tower')}>← Tower</Btn>
                <Tag s={p.risk}>{p.risk==='crit' ? 'At risk' : p.risk==='warn' ? 'Watch' : 'On track'}</Tag>
                <span className="label">{STAGEP[p.stage]} phase</span>
              </div>
              <div style={{ fontSize:28, fontWeight:600, letterSpacing:'-.01em' }}>{p.name}</div>
              <div className="row" style={{ gap:18 }}>
                <span className="label">{p.client}</span>
                <span className="label">◇ {p.emirate}</span>
                <span className="label">PLANT · {(D.factories.find(f=>f.id===p.plant)||{}).short}</span>
              </div>
            </div>
            <div className="row" style={{ gap:26, alignItems:'center' }}>
              <Kpi label="Contract value" value={<span>AED {p.value}<span className="kpi-unit"> M</span></span>} size={26} />
              <Kpi label="Elements" value={<span><Num value={done} live={live} />/<span style={{ color:'var(--ink3)' }}>{fmt(p.elements)}</span></span>} size={22} />
              <Ring value={p.pct} size={92} stroke={8} label={p.pct + '%'} sub="complete"
                color={p.risk==='crit' ? 'var(--red)' : p.risk==='warn' ? 'var(--amber)' : 'var(--green)'} />
            </div>
          </div>
        </Panel>
      </div>

      {/* delivery chain */}
      <div style={{ gridColumn:'1 / -1' }}>
        <Panel title="Delivery Chain" sub="design → approvals → production → delivery → installation">
          <div className="chain" style={{ marginTop:6, marginBottom:4 }}>
            {chain.map((c,i) => (
              <div key={c.k} className={cx('node', c.state)}>
                {i>0 && <span className="link" />}
                <span className="knob">{c.state==='done' ? '✓' : i+1}</span>
                <span className="clabel">{c.k}</span>
                <span className="mono tnum" style={{ fontSize:15, color: c.state==='idle' ? 'var(--ink3)' : 'var(--ink)' }}>{Math.round(c.pct)}%</span>
                <span className="label" style={{ fontSize:8, textAlign:'center', color:'var(--ink4)', maxWidth:120 }}>{c.meta}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* elements in progress */}
      <div style={{ minHeight:0, display:'grid' }}>
        <Panel title="Elements In Progress" sub={els.length + ' tracked'} flush
          right={<Btn kind="ghost" sm onClick={() => go('factory')}>Floor →</Btn>} className="col" style={{ minHeight:0 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr 1fr 0.9fr', padding:'9px 14px', borderBottom:'1px solid var(--line)' }}>
            {['Element','Type · Zone','Stage','Status'].map(h => <span key={h} className="label" style={{ fontSize:8.5 }}>{h}</span>)}
          </div>
          <div className="scrolly" style={{ flex:1 }}>
            {els.map(e => (
              <div key={e.id} className="lrow" style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr 1fr 0.9fr', alignItems:'center' }} onClick={() => go('factory')}>
                <span className="mono" style={{ fontSize:12, fontWeight:600 }}>{e.id}</span>
                <div className="col" style={{ gap:2 }}><span style={{ fontSize:12 }}>{e.type}</span><span className="label" style={{ fontSize:8 }}>{e.zone}</span></div>
                <span className="mono" style={{ fontSize:11, color:stateColor[stageColor[e.stage]||'info'] }}>{e.stage}</span>
                <Tag s={e.s}>{e.eta}</Tag>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* risks + progress side */}
      <div style={{ minHeight:0, display:'grid' }}>
        <Panel title="Risks & Delays" sub="auto-flagged" flush className="col" style={{ minHeight:0 }}>
          <div className="scrolly" style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:10 }}>
            {risks.map((r) => (
              <div key={r.id} className={cx('alert', r.sev)}>
                <div className="ico"><Code s={r.sev}>{r.sev==='crit' ? '!!' : r.sev==='warn' ? '!' : '✓'}</Code></div>
                <div className="col" style={{ gap:5, flex:1, minWidth:0 }}>
                  <span style={{ fontSize:12.5, fontWeight:500 }}>{r.t}</span>
                  <span className="label" style={{ fontSize:9, color:'var(--ink3)', letterSpacing:'.02em' }}>{r.m}</span>
                  {r.sev !== 'ok' &&
                    <div className="row" style={{ gap:6, marginTop:3 }}>
                      <Btn sm kind={r.sev==='crit' ? 'danger' : 'warn'} onClick={() => riskAct(r,'escalate')}>Escalate</Btn>
                      <Btn sm kind="ghost" onClick={() => riskAct(r,'ack')}>Acknowledge</Btn>
                    </div>}
                </div>
              </div>
            ))}
            <div className="col" style={{ gap:8, padding:12, border:'1px solid var(--line)', borderRadius:8, background:'var(--panel2)', marginTop:2 }}>
              <span className="label">Programme vs baseline</span>
              <div className="between"><span className="label" style={{ fontSize:9 }}>Schedule</span><span className="mono" style={{ color: p.risk==='crit' ? 'var(--red)' : 'var(--green)' }}>{p.risk==='crit' ? '-6 days' : p.risk==='warn' ? '-1 day' : 'on time'}</span></div>
              <Bar value={p.pct} s={p.risk==='crit' ? 'crit' : p.risk==='warn' ? 'warn' : 'ok'} thick />
              <div className="between"><span className="label" style={{ fontSize:9 }}>Delivered today</span><span className="mono tnum">{p.delToday} elements</span></div>
            </div>
            <Btn kind="primary" onClick={() => go('trust')}>Verify deliveries →</Btn>
          </div>
        </Panel>
      </div>

    </div>
  );
}
window.ScreenProject = ScreenProject;
