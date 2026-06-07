/* ============================================================
   HT-OS — Screen 4 · Knowledge Graph  (window.ScreenGraph)
   client → project → drawing → approval → factory → production
          → delivery → site → installed, one connected wall.
   ============================================================ */
function ScreenGraph({ live, tick, go, toast, pushActivity }) {
  const layers = [
    { key:'client',     label:'CLIENT',     nodes:[{id:'aldar',t:'Aldar Properties'},{id:'modon',t:'Modon'},{id:'dom',t:'Dept. of Municipalities'}] },
    { key:'project',    label:'PROJECT',    nodes:[{id:'YAS',t:'Yas Acres'},{id:'BANI',t:'Baniyas Villas'},{id:'SAMHA',t:'Al Samha',s:'crit'}] },
    { key:'drawing',    label:'DRAWING',    nodes:[{id:'dwg-ya',t:'YA-IFC · Rev D'},{id:'dwg-ba',t:'BA-IFC · Rev F'},{id:'dwg-sa',t:'SA · Rev C',s:'crit'}] },
    { key:'approval',   label:'APPROVAL',   nodes:[{id:'ap-ok',t:'Consultant ✓'},{id:'ap-sa',t:'Pending 6d',s:'crit'}] },
    { key:'factory',    label:'FACTORY',    nodes:[{id:'ICAD2',t:'ICAD II'},{id:'M-YAS',t:'MF · Yas'},{id:'KEZAD',t:'KEZAD'}] },
    { key:'production', label:'PRODUCTION', nodes:[{id:'pr-ya',t:'YA-COL-204'},{id:'pr-ba',t:'BA-WP-118'}] },
    { key:'delivery',   label:'DELIVERY',   nodes:[{id:'dn-4471',t:'DN-4471 ✓'},{id:'dn-4468',t:'DN-4468 ◷',s:'warn'}] },
    { key:'site',       label:'SITE',       nodes:[{id:'st-ya',t:'Yas · Cluster 3'},{id:'st-ba',t:'Baniyas · Cl.4'}] },
    { key:'installed',  label:'INSTALLED',  nodes:[{id:'in-ya',t:'2,603 placed'},{id:'in-ba',t:'2,604 placed'}] },
  ];

  // traces (one node per layer)
  const traces = {
    YAS:  ['aldar','YAS','dwg-ya','ap-ok','ICAD2','pr-ya','dn-4471','st-ya','in-ya'],
    BANI: ['modon','BANI','dwg-ba','ap-ok','KEZAD','pr-ba','dn-4468','st-ba','in-ba'],
    SAMHA:['dom','SAMHA','dwg-sa','ap-sa'],   // chain breaks at approval
  };
  const [active, setActive] = useState('YAS');
  const trace = traces[active];
  const critActive = active === 'SAMHA';

  // geometry
  const COLW = 118, X0 = 14, ROWY = 120, ROWGAP = 200;
  const colX = i => X0 + i * COLW;
  const W = X0 + layers.length * COLW + 14;
  const H = 620;

  const pos = {};
  layers.forEach((L,li) => L.nodes.forEach((nd,ni) => { pos[nd.id] = { x: colX(li)+58, y: ROWY + ni*ROWGAP, li, ni, nd }; }));

  // edges: faint full mesh between consecutive defined links + hot trace
  const baseEdges = [];
  for (const tk of Object.keys(traces)) {
    const tr = traces[tk];
    for (let i=0; i<tr.length-1; i++) baseEdges.push([tr[i], tr[i+1], tk===active]);
  }

  const edgePath = (a,b) => {
    const p1 = pos[a], p2 = pos[b]; if (!p1 || !p2) return '';
    const mx = (p1.x + p2.x)/2;
    return `M${p1.x+52},${p1.y} C${mx},${p1.y} ${mx},${p2.y} ${p2.x-52},${p2.y}`;
  };

  const D = window.HTOS;
  const p = D.projects.find(x => x.id === active);

  const pickProject = (id) => { setActive(id); };

  return (
    <div className="screen pad fade-in" style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 344px', gridTemplateRows:'auto 1fr', gap:14 }}>

      {/* header */}
      <div style={{ gridColumn:'1 / -1' }}>
        <Panel>
          <div className="between">
            <div className="col" style={{ gap:7 }}>
              <div className="row" style={{ gap:10, alignItems:'center' }}>
                <span style={{ fontSize:20, fontWeight:600 }}>Operations Knowledge Graph</span>
                <Tag s="info">{Object.keys(pos).length} nodes linked</Tag>
              </div>
              <span className="label">Every element traceable end-to-end · click a project to trace its thread</span>
            </div>
            <div className="seg">
              {['YAS','BANI','SAMHA'].map(k => (
                <button key={k} className={active===k ? 'on' : ''} onClick={() => pickProject(k)}>
                  {k==='YAS' ? 'Yas Acres' : k==='BANI' ? 'Baniyas' : 'Al Samha'}
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* graph board */}
      <div style={{ minHeight:0, display:'grid' }}>
        <Panel title="Connected Wall" sub={'tracing · ' + (p ? p.name : 'Al Samha')} flush className="col" style={{ minHeight:0 }}>
          <div className={cx('blueprint', !live && 'paused')} style={{ flex:1, overflow:'auto', position:'relative', background:'radial-gradient(120% 90% at 60% 0%, rgba(31,224,196,.035), transparent 60%), #090c12' }}>
            <div className="sweep" />
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ minWidth: W }}>
              {/* column labels */}
              {layers.map((L,li) => (
                <text key={L.key} x={colX(li)+58} y="44" textAnchor="middle" className="mono"
                  style={{ fill:'var(--ink4)', fontSize:9, letterSpacing:'1.2px' }}>{L.label}</text>
              ))}
              {/* edges */}
              {baseEdges.map(([a,b,hot],i) => (
                <path key={i} d={edgePath(a,b)} className={cx('gline', hot && !critActive && 'hot', hot && !critActive && 'gdash', hot && critActive && 'broken')} />
              ))}
              {/* nodes */}
              {layers.map((L,li) => L.nodes.map((nd,ni) => {
                const inTrace = trace.includes(nd.id);
                const col = nd.s==='crit' ? 'var(--red)' : nd.s==='warn' ? 'var(--amber)' : inTrace ? 'var(--accent)' : 'var(--line2)';
                const NP = pos[nd.id];
                const clickable = L.key === 'project';
                return (
                  <g key={nd.id} style={{ cursor: clickable ? 'pointer' : 'default', opacity: inTrace ? 1 : 0.5 }}
                     onClick={() => { if (clickable) pickProject(nd.id); }}>
                    <rect x={NP.x-52} y={NP.y-15} width="104" height="30" rx="6"
                      fill={inTrace ? 'var(--panel3)' : 'var(--panel)'} stroke={col} strokeWidth={inTrace ? 1.5 : 1}
                      style={{ filter: inTrace && !nd.s ? 'drop-shadow(0 0 6px rgba(31,224,196,.35))' : 'none' }} />
                    <circle cx={NP.x-40} cy={NP.y} r="3" fill={nd.s ? stateColor[nd.s] : (inTrace ? 'var(--accent)' : 'var(--ink3)')} />
                    <text x={NP.x-31} y={NP.y+3.5} className="mono" style={{ fill: inTrace ? 'var(--ink)' : 'var(--ink3)', fontSize:9 }}>
                      {nd.t.length>14 ? nd.t.slice(0,13)+'…' : nd.t}
                    </text>
                  </g>
                );
              }))}
            </svg>
          </div>
        </Panel>
      </div>

      {/* trace detail */}
      <div style={{ minHeight:0, display:'grid' }}>
        <Panel title="Active Thread" sub={critActive ? 'chain broken' : 'fully linked'} flush
          glow={!critActive} glowCrit={critActive} className="col" style={{ minHeight:0 }}>
          <div className="scrolly" style={{ flex:1, padding:14 }}>
            <div className="col" style={{ gap:0 }}>
              {layers.map((L,i) => {
                const nodeId = trace[i];
                const nd = nodeId ? pos[nodeId].nd : null;
                const broken = !nodeId;
                return (
                  <div key={L.key} className="row" style={{ gap:11, alignItems:'stretch', opacity: broken ? 0.45 : 1 }}>
                    <div className="col" style={{ alignItems:'center' }}>
                      <span className={cx('dot', nd && nd.s ? nd.s : broken ? 'idle' : 'ok')} style={{ marginTop:4, flex:'none' }} />
                      {i<layers.length-1 && <span style={{ width:1, flex:1, minHeight:14, marginTop:3, background: broken ? 'var(--line)' : 'var(--green)', opacity:.5 }} />}
                    </div>
                    <div className="col" style={{ gap:3, paddingBottom:15, minWidth:0 }}>
                      <span className="label" style={{ fontSize:8.5 }}>{L.label}</span>
                      <span className="mono" style={{ fontSize:12, lineHeight:1.25, color: broken ? 'var(--ink4)' : 'var(--ink)' }}>{nd ? nd.t : '— awaiting upstream —'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {critActive
              ? <div className="alert crit" style={{ marginTop:4 }}>
                  <div className="ico"><Code s="crit">!!</Code></div>
                  <div className="col" style={{ gap:5 }}>
                    <span style={{ fontSize:12.5 }}>Thread blocked at Approval — Rev C pending 6 days.</span>
                    <div className="row" style={{ gap:6 }}>
                      <Btn sm kind="warn" onClick={() => { toast('Escalated', 'Al Samha Rev C · Design Manager', 'warn'); pushActivity('Escalated <b>Al Samha</b> approval breach'); go('project','SAMHA'); }}>Escalate →</Btn>
                      <Btn sm kind="ghost" onClick={() => { toast('Consultant chased', 'Reminder sent · SLA breach logged', 'accent'); pushActivity('Chased consultant — <b>Al Samha</b> Rev C'); }}>Chase consultant</Btn>
                    </div>
                  </div>
                </div>
              : <div className="row" style={{ gap:8, marginTop:6 }}>
                  <Btn sm kind="ghost" onClick={() => go('project',active)}>Project →</Btn>
                  <Btn sm kind="ghost" onClick={() => go('trust')}>Proof →</Btn>
                </div>}
          </div>
        </Panel>
      </div>

    </div>
  );
}
window.ScreenGraph = ScreenGraph;
