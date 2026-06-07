/* ============================================================
   HT-OS — shared dataset. Realistic Hi-Tech Concrete Products data.
   Exposed as window.HTOS.  All figures internally consistent.
   ============================================================ */
window.HTOS = (function () {

  // ---- Factories: 7 stationary + 4 mobile = 11 ----------------
  // x,y are % positions on the stylised UAE board (0-100).
  const factories = [
    { id:'ICAD2',  name:'ICAD II — Mussafah',        short:'ICAD II',  type:'fixed', emirate:'Abu Dhabi', lines:6, linesRun:6, out:742, cap:820, oee:91, status:'ok',   x:46, y:62, note:'Flagship plant · hollowcore + façade' },
    { id:'KEZAD',  name:'KEZAD — Khalifa Ind. Zone',  short:'KEZAD',    type:'fixed', emirate:'Abu Dhabi', lines:5, linesRun:5, out:611, cap:680, oee:88, status:'ok',   x:52, y:55, note:'Structural beams & columns' },
    { id:'DIC',    name:'Dubai Industrial City',      short:'DIC',      type:'fixed', emirate:'Dubai',     lines:4, linesRun:3, out:388, cap:520, oee:74, status:'warn', x:60, y:36, note:'Line 3 idle — mould changeover' },
    { id:'ALAIN',  name:'Al Ain — ADIP Plant',        short:'Al Ain',   type:'fixed', emirate:'Al Ain',    lines:5, linesRun:5, out:566, cap:640, oee:86, status:'ok',   x:72, y:70, note:'Newly integrated (ADIP) · ramping' },
    { id:'SAJAA',  name:'Saja’a — Sharjah',       short:'Saja’a',type:'fixed',emirate:'Sharjah',  lines:3, linesRun:3, out:262, cap:300, oee:84, status:'ok',   x:64, y:28, note:'Blocks, paving, kerbstone' },
    { id:'ICAD1',  name:'ICAD I — Precast Yard',      short:'ICAD I',   type:'fixed', emirate:'Abu Dhabi', lines:4, linesRun:4, out:404, cap:440, oee:89, status:'ok',   x:44, y:66, note:'GRC + architectural' },
    { id:'HAMRA',  name:'Al Hamra — West',            short:'Al Hamra', type:'fixed', emirate:'Al Dhafra', lines:2, linesRun:1, out:96,  cap:200, oee:61, status:'crit', x:24, y:74, note:'Mixer fault — predictive flag' },
    // Mobile site factories
    { id:'M-YAS',  name:'Mobile Plant — Yas Acres', short:'MF·Yas',  type:'mobile', emirate:'Yas Island',  lines:2, linesRun:2, out:188, cap:220, oee:83, status:'ok',   x:58, y:46, note:'On-site casting · Yas Acres' },
    { id:'M-FALAH',name:'Mobile Plant — Al Falah',  short:'MF·Falah',type:'mobile', emirate:'Al Falah',    lines:2, linesRun:2, out:171, cap:220, oee:79, status:'warn', x:56, y:58, note:'Mixer temp +8°C of limit' },
    { id:'M-SAAD', name:'Mobile Plant — Saadiyat',  short:'MF·Saad', type:'mobile', emirate:'Saadiyat',    lines:1, linesRun:1, out:84,  cap:120, oee:80, status:'ok',   x:50, y:50, note:'Lagoons mobilisation' },
    { id:'M-ENEC', name:'Mobile Plant — Barakah',   short:'MF·ENEC', type:'mobile', emirate:'Al Dhafra',   lines:1, linesRun:1, out:74,  cap:120, oee:77, status:'ok',   x:18, y:64, note:'ENEC accommodation' },
  ];

  // ---- Projects -------------------------------------------------
  const projects = [
    { id:'YAS',   name:'Yas Acres',                client:'Aldar Properties',   value:486, pct:68, stage:'production', elements:4820, done:3278, risk:'warn', emirate:'Yas Island', delToday:42, plant:'M-YAS',
      desc:'Phase 2 villas + townhouses — structural precast, façade panels & hollowcore floors.' },
    { id:'FALAH', name:'Al Falah 900 Villas',      client:'Aldar / Musanada',   value:612, pct:41, stage:'production', elements:7140, done:2927, risk:'ok',   emirate:'Al Falah',   delToday:58, plant:'M-FALAH',
      desc:'900-villa community — full precast building system, boundary walls & paving.' },
    { id:'BANI',  name:'Baniyas Villas',           client:'Modon Properties',   value:228, pct:88, stage:'install',    elements:2960, done:2604, risk:'ok',   emirate:'Baniyas',    delToday:31, plant:'ICAD2',
      desc:'Replacement villas — installation phase, snagging underway on Cluster 4.' },
    { id:'SAMHA', name:'Al Samha Villas Complex',  client:'Dept. of Municipalities', value:174, pct:23, stage:'approve', elements:3410, done:784, risk:'crit', emirate:'Al Samha',
      plant:'KEZAD', delToday:0, desc:'Awaiting consultant approval — MEP/precast clash on Block C unresolved.' },
    { id:'ENEC',  name:'ENEC Staff Accommodation', client:'Emirates Nuclear / Barakah', value:301, pct:95, stage:'install', elements:5210, done:4949, risk:'ok', emirate:'Al Dhafra',
      plant:'M-ENEC', delToday:22, desc:'Barakah workforce housing — closeout & handover documentation.' },
    { id:'SAAD',  name:'Saadiyat Lagoons',         client:'Aldar Properties',   value:540, pct:12, stage:'design',     elements:6300, done:756,  risk:'warn', emirate:'Saadiyat',   delToday:0, plant:'M-SAAD',
      desc:'New community — design & shop-drawing stage, mobile plant mobilising.' },
  ];

  // ---- Health score ---------------------------------------------
  const health = {
    score: 87,
    trend: +1.4,
    subs: [
      { k:'Production', v:91, s:'ok' },
      { k:'Quality',    v:84, s:'warn' },
      { k:'Delivery',   v:88, s:'ok' },
      { k:'Financial',  v:79, s:'warn' },
      { k:'Safety',     v:96, s:'ok' },
    ],
  };

  // ---- Output / capacity ----------------------------------------
  const output = { today: 3186, cap: 3500, yesterday: 3041, mtd: 78240, monthTarget: 95000 };

  // ---- Financials (AED millions) --------------------------------
  const finance = {
    portfolio: 2341,      // contracted backlog
    wip: 418,             // work in progress
    exposure: 312,        // financial exposure
    receivables: 196,     // outstanding
    overdue: 47,          // overdue >90d
    invoicedMTD: 134,
    retention: 88,
  };

  // ---- Critical alerts ------------------------------------------
  // Every alert carries: a contextual `primary` action + the four standard
  // controls (Approve / Escalate / Flag / Resolve) are added by the UI.
  const alerts = [
    { id:'AL-1', sev:'crit', icon:'flask', cat:'QUALITY · 06:14', proj:'YAS', owner:'Head of QA/QC',
      text:'Façade batch YA-FP-117 failed 28-day compressive test (38.2 MPa vs 45 req.).',
      primary:{ label:'Quarantine', kind:'danger' } },
    { id:'AL-2', sev:'crit', icon:'doc', cat:'APPROVALS · 05:58', proj:'SAMHA', owner:'Design Manager',
      text:'Al Samha shop-drawing Rev C awaiting consultant 6d — SLA breach, blocks Block C casting.',
      primary:{ label:'Reassign', kind:'ghost' } },
    { id:'AL-3', sev:'warn', icon:'gear', cat:'MAINTENANCE · 06:31', fac:'M-FALAH', owner:'Plant Maintenance',
      text:'Mobile Plant Al Falah — mixer bearing temp +8°C of limit. Predictive: 36h to failure.',
      primary:{ label:'Dispatch tech', kind:'warn' } },
    { id:'AL-4', sev:'warn', icon:'truck', cat:'LOGISTICS · 07:02', proj:'BANI', owner:'Logistics Control',
      text:'Delivery DN-4470 to Baniyas — geofence deviation 2.3 km off planned route.',
      primary:{ label:'Track live', kind:'primary' } },
    { id:'AL-5', sev:'warn', icon:'clash', cat:'DESIGN · 04:46', proj:'SAMHA', owner:'BIM Coordinator',
      text:'BIM clash detected — MEP riser vs precast column C-14 on Block C (Al Samha).',
      primary:{ label:'Open model', kind:'primary' } },
    { id:'AL-6', sev:'info', icon:'check', cat:'DELIVERY · 07:18', proj:'BANI', owner:'Site QS',
      text:'18 wall panels camera-verified & signed on delivery at Baniyas (DN-4468).',
      primary:{ label:'View proof', kind:'ghost' } },
  ];

  // ---- Live event pool — these slide into the alert queue while LIVE ----
  const incoming = [
    { id:'AL-7', sev:'warn', icon:'gear', cat:'MAINTENANCE', fac:'DIC', owner:'Plant Maintenance',
      text:'DIC Line 3 mould carrier — vibration signature drift detected. Predictive: 9 days.',
      primary:{ label:'Schedule', kind:'warn' } },
    { id:'AL-8', sev:'info', icon:'check', cat:'DELIVERY', proj:'FALAH', owner:'Site Engineer',
      text:'24 boundary-wall units camera-verified & counter-signed at Al Falah (DN-4465).',
      primary:{ label:'View proof', kind:'ghost' } },
    { id:'AL-9', sev:'crit', icon:'flask', cat:'QUALITY', proj:'FALAH', owner:'Head of QA/QC',
      text:'Slump test out of range on Line 4 pour FA-BM-205 — 210 mm vs 180±20 target.',
      primary:{ label:'Hold pour', kind:'danger' } },
    { id:'AL-10', sev:'warn', icon:'truck', cat:'LOGISTICS', proj:'YAS', owner:'Logistics Control',
      text:'Crane window at Yas Cluster 3 shared with Baniyas — 1h overlap risk 14:00.',
      primary:{ label:'Re-sequence', kind:'warn' } },
    { id:'AL-11', sev:'info', icon:'check', cat:'PRODUCTION', proj:'ENEC', owner:'Project Director',
      text:'ENEC Barakah handover pack assembled — 4,949 elements signed off, ready for review.',
      primary:{ label:'Open pack', kind:'primary' } },
  ];

  // ---- Operational activity feed (Tower) — seeds, then streams live -----
  const activitySeed = [
    { t:'06:31', html:'Predictive flag raised — <b>MF·Falah</b> mixer bearing' },
    { t:'06:14', html:'Quality hold opened — <b>YA-FP-117</b> 28-day fail' },
    { t:'06:00', html:'Morning brief auto-sent to <b>7 recipients</b>' },
    { t:'05:58', html:'Approval SLA breach — <b>Al Samha</b> Rev C (6d)' },
    { t:'05:42', html:'<b>DN-4471</b> sealed & dispatched · ICAD II → Baniyas' },
  ];

  // ---- Morning briefing -----------------------------------------
  const briefing = {
    date: 'Friday 06 June 2026 · 06:00 GST',
    lines: [
      { t:'Output tracking 91% of 3,500 m³ capacity; on pace to beat yesterday by 145 m³.', s:'ok' },
      { t:'1 quality hold (Yas Acres façade YA-FP-117) needs your sign-off before re-cast.', s:'crit' },
      { t:'Al Samha approval breach now 6 days — at risk of slipping Block C by a week.', s:'warn' },
      { t:'Al Hamra plant down to 1 of 2 lines; predictive maintenance flagged mixer.', s:'warn' },
      { t:'ENEC Barakah at 95% — handover pack ready for your review today.', s:'ok' },
      { t:'AED 47M receivables overdue >90d across 3 clients; finance escalation prepared.', s:'warn' },
    ],
  };

  // ---- Yas Acres project chain (screen 2) -----------------------
  const yasChain = [
    { k:'Design',     pct:100, state:'done', meta:'412 / 412 drawings IFC' },
    { k:'Approvals',  pct:96,  state:'done', meta:'396 / 412 approved' },
    { k:'Production', pct:68,  state:'active', meta:'3,278 / 4,820 elements cast' },
    { k:'Delivery',   pct:61,  state:'active', meta:'2,944 elements delivered' },
    { k:'Install',    pct:54,  state:'idle', meta:'2,603 installed on site' },
  ];

  const yasElements = [
    { id:'YA-COL-204', type:'Column',        zone:'Cluster 3 · Villa 28', stage:'QC',        s:'warn', eta:'QC re-check' },
    { id:'YA-FP-117',  type:'Façade panel',  zone:'Cluster 2 · Block B',  stage:'Quarantine',s:'crit', eta:'Hold — failed test' },
    { id:'YA-HC-882',  type:'Hollowcore',    zone:'Cluster 4 · Villa 11', stage:'Stored',    s:'ok',   eta:'Load 09:30' },
    { id:'YA-BM-051',  type:'Beam',          zone:'Cluster 3 · Villa 28', stage:'Loaded',    s:'ok',   eta:'In transit' },
    { id:'YA-STR-340', type:'Stair flight',  zone:'Cluster 1 · Villa 04', stage:'Installed', s:'ok',   eta:'Signed off' },
    { id:'YA-WP-219',  type:'Wall panel',    zone:'Cluster 2 · Block B',  stage:'Cured',     s:'ok',   eta:'QC 11:00' },
    { id:'YA-COL-205', type:'Column',        zone:'Cluster 3 · Villa 29', stage:'Cast',      s:'ok',   eta:'Curing' },
  ];

  const yasRisks = [
    { id:'R1', sev:'crit', t:'Façade batch YA-FP-117 quarantined', m:'28-day strength below spec · re-cast adds 3 days' },
    { id:'R2', sev:'warn', t:'Cluster 3 install crane shared with Baniyas', m:'Possible 1-day slip wk 24' },
    { id:'R3', sev:'ok',   t:'Hollowcore delivery ahead of schedule', m:'+2 days float on Cluster 4' },
  ];

  // ---- Factory floor: production lines (screen 3) ---------------
  const lines = [
    { id:'L1', name:'Line 1 · Hollowcore',  load:94, out:182, status:'ok',   el:'YA-HC-883',  stage:5 },
    { id:'L2', name:'Line 2 · Façade',      load:78, out:128, status:'warn', el:'YA-FP-118',  stage:3, flag:'QC variance trending up' },
    { id:'L3', name:'Line 3 · Columns',     load:88, out:96,  status:'ok',   el:'YA-COL-206', stage:2 },
    { id:'L4', name:'Line 4 · Beams',       load:71, out:88,  status:'ok',   el:'FA-BM-204',  stage:4 },
    { id:'L5', name:'Line 5 · Wall panels', load:55, out:64,  status:'idle', el:'—',     stage:0, flag:'Mould changeover · 22 min' },
    { id:'L6', name:'Line 6 · Stairs/GRC',  load:83, out:42,  status:'ok',   el:'YA-STR-341', stage:6 },
  ];

  // element passport stages
  const passportStages = ['Designed','Cast','Cured','QC','Stored','Loaded','Delivered','Installed'];
  const passport = {
    id:'YA-COL-204', type:'Precast Column · 400×400 · C45/55', project:'Yas Acres', plant:'ICAD II',
    weight:'4.8 t', rebar:'BS4449 B500B', mould:'M-COL-12', current:3,
    events:[
      { stage:'Designed', t:'02 Jun 08:12', who:'BIM / Tekla', hash:'a91f' },
      { stage:'Cast',     t:'03 Jun 14:40', who:'Line 3 · ICAD II', hash:'7c4e' },
      { stage:'Cured',    t:'05 Jun 06:00', who:'Curing bay 2 · 38h', hash:'2bd0' },
      { stage:'QC',       t:'06 Jun 06:14', who:'Lab — strength re-check', hash:'e5a7', active:true },
    ],
  };

  const maintenance = [
    { id:'M1', fac:'M-FALAH', t:'Mixer bearing — temp rising', risk:'36h', sev:'warn' },
    { id:'M2', fac:'HAMRA',   t:'Batch plant pump — vibration', risk:'imminent', sev:'crit' },
    { id:'M3', fac:'DIC',     t:'Line 3 mould carrier — wear', risk:'9 days', sev:'info' },
  ];

  // ---- Trust / verification (screen 5) --------------------------
  const trips = [
    { id:'DN-4471', from:'ICAD II', to:'Baniyas Villas', load:'18 × Wall panels', dep:'05:42', arr:'07:18',
      status:'verified', cams:3, distance:'63 km', driver:'Truck AD-48217', seal:'OK', hash:'0x7f3a…b91c', dev:false },
    { id:'DN-4468', from:'Al Ain', to:'Yas Acres', load:'12 × Hollowcore slabs', dep:'06:10', arr:'—',
      status:'transit', cams:2, distance:'118 km', eta:'08:50', driver:'Truck AD-55190', prog:64, seal:'OK', hash:'0x2b9d…4e07', dev:false },
    { id:'DN-4470', from:'ICAD II', to:'Baniyas Villas', load:'9 × Beams', dep:'06:55', arr:'—',
      status:'transit', cams:3, distance:'63 km', eta:'08:20', driver:'Truck AD-49003', prog:38, seal:'OK', hash:'0x9a01…c2f4', dev:true, devNote:'Geofence deviation 2.3 km' },
    { id:'DN-4465', from:'KEZAD', to:'Al Falah 900', load:'24 × Boundary wall', dep:'05:05', arr:'06:48',
      status:'verified', cams:3, distance:'41 km', driver:'Truck AD-51422', seal:'OK', hash:'0x4c77…aa12', dev:false },
    { id:'DN-4463', from:'M-ENEC', to:'ENEC Barakah', load:'16 × Stair flights', dep:'04:30', arr:'05:12',
      status:'verified', cams:2, distance:'9 km', driver:'Truck AD-60771', seal:'OK', hash:'0x1d55…7b3e', dev:false },
  ];

  const ledger = [
    { t:'07:18:04', ev:'DELIVERY_SIGNED', id:'DN-4471', hash:'0x7f3a91c…b91c', who:'Site QS · biometric' },
    { t:'07:17:51', ev:'CAMERA_VERIFY',   id:'DN-4471', hash:'0x6e22d04…1aa9', who:'Gate cam 02 · match 99.4%' },
    { t:'07:02:19', ev:'GEOFENCE_FLAG',   id:'DN-4470', hash:'0x9a01f73…c2f4', who:'Auto · route monitor' },
    { t:'06:55:08', ev:'LOAD_SEALED',     id:'DN-4470', hash:'0x55bc7e1…d0a3', who:'ICAD II dispatch' },
    { t:'06:48:33', ev:'DELIVERY_SIGNED', id:'DN-4465', hash:'0x4c7712a…aa12', who:'Site eng · biometric' },
    { t:'06:10:02', ev:'DEPART_SCANNED',  id:'DN-4468', hash:'0x2b9d440…4e07', who:'Al Ain weighbridge' },
  ];

  // pool of ledger events that auto-append while LIVE
  const ledgerStream = [
    { ev:'CAMERA_VERIFY',   id:'DN-4468', hashSeed:'aa31', who:'Gate cam 05 · match 99.1%' },
    { ev:'GATE_SCANNED',    id:'DN-4468', hashSeed:'7b02', who:'Yas Acres gatehouse' },
    { ev:'SEAL_CONFIRMED',  id:'DN-4470', hashSeed:'c4d9', who:'Driver app · biometric' },
    { ev:'CAMERA_VERIFY',   id:'DN-4470', hashSeed:'1f88', who:'Gate cam 02 · match 98.7%' },
    { ev:'DELIVERY_SIGNED', id:'DN-4468', hashSeed:'9e54', who:'Site QS · biometric' },
  ];

  const verifyStats = { tripsToday: 86, verified: 84, transit: 2, paperless: 100, avgVerify: '11 s', disputes: 0 };

  // ============================================================
  //  SALES / ORDERS  (screen 6)
  // ============================================================
  const salesFunnel = [
    { k:'Enquiries', count:46, value:3420, s:'accent' },
    { k:'Quotes',    count:27, value:1960, s:'accent' },
    { k:'Won',       count:11, value:612,  s:'ok' },
  ];
  const salesStats = { orderBook:2341, winsMonth:612, winsCount:11, pipeline:1960, conversion:41,
                       winsSpark:[210,260,180,340,300,420,486,612] };

  // order book mirrors the live projects — won orders feed the lifecycle
  const orderBook = [
    { id:'SO-2038', client:'Aldar / Musanada',        proj:'FALAH', item:'Full precast system',  qty:7140, value:612, status:'production', s:'ok' },
    { id:'SO-2041', client:'Aldar Properties',         proj:'YAS',   item:'Façade + hollowcore',  qty:4820, value:486, status:'production', s:'warn' },
    { id:'SO-2055', client:'Aldar Properties',         proj:'SAAD',  item:'Structural + GRC',      qty:6300, value:540, status:'design',     s:'ok' },
    { id:'SO-2029', client:'Emirates Nuclear',         proj:'ENEC',  item:'Wall panels + stairs',  qty:5210, value:301, status:'closeout',   s:'ok' },
    { id:'SO-2033', client:'Modon Properties',         proj:'BANI',  item:'Villa precast set',     qty:2960, value:228, status:'install',    s:'ok' },
    { id:'SO-2050', client:'Dept. of Municipalities',  proj:'SAMHA', item:'Boundary + structural', qty:3410, value:174, status:'hold',       s:'crit' },
  ];
  const salesQuotes = [
    { id:'Q-1187', client:'Aldar Properties',  proj:'SAAD',  desc:'Saadiyat Lagoons Ph2 — structural precast', value:540, expires:'2 days',  s:'crit' },
    { id:'Q-1185', client:'Aldar / Musanada',  proj:'FALAH', desc:'Al Falah Ph3 — boundary walls & paving',    value:240, expires:'9 days',  s:'warn', stalled:true },
    { id:'Q-1192', client:'Modon Properties',  proj:'BANI',  desc:'Baniyas community centre — columns/beams',   value:96,  expires:'14 days', s:'ok' },
    { id:'Q-1190', client:'Aldar Properties',  proj:'YAS',   desc:'Yas Acres clubhouse — GRC façade',           value:64,  expires:'11 days', s:'ok' },
  ];
  const salesEnquiries = [
    { id:'E-0463', client:'Aldar Properties',        desc:'Yas North villas — precast feasibility', est:380 },
    { id:'E-0461', client:'Modon Properties',        desc:'Baniyas school block',                   est:74 },
    { id:'E-0465', client:'Dept. of Municipalities', desc:'Al Samha mosque precast',                est:48 },
  ];
  const salesIncoming = [
    { id:'E-0467', client:'Aldar Properties', desc:'Saadiyat marina villas — precast', est:210 },
    { id:'E-0469', client:'Modon Properties', desc:'Baniyas retail strip',             est:58 },
  ];
  const salesAlerts = [
    { id:'SA-1', sev:'crit', cat:'QUOTE EXPIRY', proj:'SAAD',  owner:'Commercial Director',
      text:'Quote Q-1187 (Saadiyat Lagoons, AED 540M) expires in 2 days — no response from Aldar.',
      primary:{ label:'Approve quote', kind:'good' }, quote:'Q-1187' },
    { id:'SA-2', sev:'crit', cat:'STALLED DEAL', proj:'FALAH', owner:'Sales Lead',
      text:'Al Falah Ph3 (AED 240M) stalled 18 days in negotiation — no client movement.',
      primary:{ label:'Escalate', kind:'warn' } },
    { id:'SA-3', sev:'warn', cat:'MARGIN',       proj:'BANI',  owner:'Estimation',
      text:'Baniyas community-centre quote margin at 9% — below 14% group threshold.',
      primary:{ label:'Re-price', kind:'primary' } },
  ];

  // ============================================================
  //  STORE / PROCUREMENT  (screen 7)
  // ============================================================
  const materials = [
    { id:'MAT-CEM', name:'Cement — OPC 42.5N',          stock:1240,  unit:'t',   reorder:800,  value:4.2, use:'Binder · all mixes' },
    { id:'MAT-AGG', name:'Aggregates — 10/20mm',        stock:4180,  unit:'t',   reorder:4000, value:5.8, use:'Concrete mix' },
    { id:'MAT-STL', name:'Steel / rebar — B500B',       stock:95,    unit:'t',   reorder:220,  value:9.1, use:'Reinforcement' },
    { id:'MAT-ADM', name:'Admixture — PCE superplast.', stock:12400, unit:'L',   reorder:8000, value:2.1, use:'Workability' },
    { id:'MAT-EMB', name:'Embeds / cast-in fixings',    stock:2150,  unit:'pcs', reorder:3000, value:3.4, use:'Connections' },
    { id:'MAT-CON', name:'Consumables — ties & oil',    stock:78,    unit:'%',   reorder:25,   value:1.2, use:'Formwork' },
  ];
  const purchaseOrders = [
    { id:'PO-7741', supplier:'Emirates Steel',        items:'300 t rebar B500B',        value:1.35, eta:'08 Jun', status:'transit'  },
    { id:'PO-7738', supplier:'Star Cement',           items:'2,000 t OPC 42.5N',        value:0.92, eta:'07 Jun', status:'confirmed' },
    { id:'PO-7740', supplier:'National Quarries',     items:'5,000 t aggregates',       value:0.48, eta:'09 Jun', status:'confirmed' },
    { id:'PO-7745', supplier:'BASF Constr. Chem.',    items:'PCE admixture · 9,000 L',  value:0.31, eta:'12 Jun', status:'approval'  },
    { id:'PO-7733', supplier:'Hilti Emirates',        items:'Cast-in fixings · 4,000',  value:0.22, eta:'06 Jun', status:'late'      },
  ];
  const deliveriesDue = [
    { id:'PO-7726', supplier:'National Quarries', items:'5,000 t aggregates', eta:'07:05', status:'received' },
    { id:'PO-7738', supplier:'Star Cement',       items:'2,000 t OPC 42.5N',  eta:'09:40', status:'due' },
    { id:'PO-7741', supplier:'Emirates Steel',    items:'300 t rebar B500B',  eta:'13:15', status:'transit' },
    { id:'PO-7733', supplier:'Hilti Emirates',    items:'4,000 cast-in fixings', eta:'overdue', status:'late' },
  ];
  const consumption = [
    { proj:'FALAH', material:'Aggregates', used:410, unit:'t' },
    { proj:'FALAH', material:'Cement',     used:168, unit:'t' },
    { proj:'YAS',   material:'Cement',     used:142, unit:'t' },
    { proj:'ENEC',  material:'Admixture',  used:520, unit:'L' },
    { proj:'BANI',  material:'Embeds',     used:240, unit:'pcs' },
    { proj:'YAS',   material:'Rebar',      used:18,  unit:'t' },
  ];
  const storeStats = { openPO:3.28, dueToday:2 };
  const storeAlerts = [
    { id:'ST-1', sev:'crit', cat:'STOCK', owner:'Procurement Lead', mat:'MAT-STL',
      text:'Steel / rebar at 95 t — below 220 t reorder. Casting at risk on Lines 3 & 4 within 36h.',
      primary:{ label:'Raise PO', kind:'primary' } },
    { id:'ST-2', sev:'crit', cat:'DELIVERY', owner:'Logistics', po:'PO-7733',
      text:'Supplier delivery PO-7733 (Hilti fixings) 1 day late — Baniyas install blocked.',
      primary:{ label:'Expedite', kind:'warn' } },
    { id:'ST-3', sev:'warn', cat:'APPROVAL', owner:'Procurement Lead', po:'PO-7745',
      text:'PO-7745 (PCE admixture, AED 0.31M) awaiting your approval.',
      primary:{ label:'Approve PO', kind:'good' } },
  ];

  // ============================================================
  //  DESIGN / ENGINEERING  (screen 8)  — BIM, drawings, approvals, clashes
  // ============================================================
  const designStats = { ifcIssued: 2104, approvalRate: 92, openClashes: 7, avgApprovalDays: 3.4 };
  // status: ifc = Issued For Construction · approved · review (consultant) · pending (breach) · design
  const drawingRegister = [
    { proj:'BANI',  set:'BA-IFC', rev:'Rev F', count:296, approved:100, status:'approved' },
    { proj:'ENEC',  set:'EN-IFC', rev:'Rev B', count:510, approved:100, status:'approved' },
    { proj:'YAS',   set:'YA-IFC', rev:'Rev D', count:412, approved:96,  status:'ifc' },
    { proj:'FALAH', set:'FA-IFC', rev:'Rev C', count:680, approved:88,  status:'review' },
    { proj:'SAMHA', set:'SA-SD',  rev:'Rev C', count:214, approved:41,  status:'pending', s:'crit' },
    { proj:'SAAD',  set:'SD-SD',  rev:'Rev A', count:180, approved:22,  status:'design',  s:'warn' },
  ];
  const designApprovals = [
    { id:'AP-SA', proj:'SAMHA', desc:'Block C structural — Rev C', days:6, sla:5, s:'crit' },
    { id:'AP-FA', proj:'FALAH', desc:'Boundary wall details Ph3',  days:4, sla:5, s:'warn' },
    { id:'AP-SD', proj:'SAAD',  desc:'Shop drawings — batch 3',    days:2, sla:5, s:'ok' },
    { id:'AP-YA', proj:'YAS',   desc:'Clubhouse GRC façade',        days:1, sla:5, s:'ok' },
  ];
  const designClashes = [
    { id:'CL-1', proj:'SAMHA', desc:'MEP riser vs precast column C-14', disc:'MEP × Structural', s:'crit', note:'Blocks Block C casting' },
    { id:'CL-2', proj:'YAS',   desc:'HVAC duct vs beam YA-BM-051',      disc:'MEP × Structural', s:'warn', note:'Re-route duct' },
    { id:'CL-3', proj:'FALAH', desc:'Drainage vs strip foundation',    disc:'Civil × Structural', s:'warn', note:'Shift invert 150mm' },
  ];
  const designWorkload = [
    { team:'Structural',       inprog:24, issued:38, s:'ok' },
    { team:'Façade / GRC',     inprog:18, issued:22, s:'ok' },
    { team:'MEP coordination', inprog:12, issued:9,  s:'warn' },
    { team:'Detailing (Tekla)',inprog:31, issued:46, s:'ok' },
  ];
  const designIncoming = [
    { id:'CL-4', proj:'SAAD', desc:'Stair core vs lift shaft overlap', disc:'Architectural × Structural', s:'warn', note:'Auto-detected' },
  ];
  const designAlerts = [
    { id:'DA-1', sev:'crit', cat:'APPROVAL SLA', proj:'SAMHA', owner:'Design Manager',
      text:'Al Samha Rev C awaiting consultant 6 days — SLA breach, blocks Block C casting.', primary:{ label:'Escalate', kind:'warn' } },
    { id:'DA-2', sev:'crit', cat:'BIM CLASH', proj:'SAMHA', owner:'BIM Coordinator',
      text:'Critical clash C-14 (MEP riser vs precast column) unresolved on Block C.', primary:{ label:'Assign', kind:'primary' } },
    { id:'DA-3', sev:'warn', cat:'REVISION', proj:'FALAH', owner:'Lead Engineer',
      text:'Boundary-wall details Rev B rejected by consultant — re-issue required.', primary:{ label:'Issue revision', kind:'primary' } },
  ];

  // ============================================================
  //  PEOPLE / HR  (screen 9)  — workforce, deployment, HSE, compliance
  // ============================================================
  const peopleStats = { total: 10400, presentBase: 9080, attendance: 94, daysNoLTI: 212, openRoles: 38 };
  const workforceFn = [
    { k:'Production operatives', n:5820, s:'ok' },
    { k:'Site / installation',   n:2140, s:'ok' },
    { k:'Logistics / drivers',   n:880,  s:'ok' },
    { k:'Engineering / design',  n:640,  s:'ok' },
    { k:'QA / QC',               n:310,  s:'ok' },
    { k:'Admin / support',       n:610,  s:'ok' },
  ];
  const deployment = [
    { id:'ICAD2', site:'ICAD II — Mussafah',     head:1240, present:1180 },
    { id:'KEZAD', site:'KEZAD',                  head:980,  present:931 },
    { id:'ALAIN', site:'Al Ain — ADIP',          head:760,  present:712 },
    { id:'DIC',   site:'Dubai Industrial City',  head:620,  present:560 },
    { id:'ICAD1', site:'ICAD I — Precast Yard',  head:540,  present:512 },
    { id:'M-YAS', site:'Yas Acres — site crew',  head:430,  present:402 },
    { id:'M-FALAH',site:'Al Falah — site crew',  head:510,  present:471 },
    { id:'HAMRA', site:'Al Hamra — West',        head:240,  present:198, s:'warn' },
    { id:'M-ENEC',site:'ENEC Barakah — camp',    head:380,  present:362 },
  ];
  const hse = { daysNoLTI: 212, incidentsMonth: 1, nearMiss: 7, inductions: 64, safetyScore: 96, toolbox: 18 };
  const compliance = [
    { id:'C-1', type:'Labour visas',        who:'14 operatives · batch', days:9,  s:'crit' },
    { id:'C-2', type:'ENEC site work permit',who:'Barakah pass · 40 pax', days:5,  s:'crit' },
    { id:'C-3', type:'Crane operator certs', who:'6 operators',           days:21, s:'warn' },
    { id:'C-4', type:'Welder cert (3G)',     who:'9 welders',             days:34, s:'ok' },
    { id:'C-5', type:'First-aid certs',      who:'12 supervisors',        days:46, s:'ok' },
  ];
  const peopleIncoming = [
    { id:'HA-4', sev:'warn', cat:'ATTENDANCE', site:'KEZAD', owner:'Site HR',
      text:'KEZAD attendance dipped to 88% — 3 crews short on Line 2 shift.', primary:{ label:'Escalate', kind:'warn' } },
  ];
  const peopleAlerts = [
    { id:'HA-1', sev:'crit', cat:'COMPLIANCE', owner:'PRO / HR',
      text:'14 labour visas expire in 9 days — renewal not yet filed. Deployment at risk.', primary:{ label:'Renew', kind:'primary' } },
    { id:'HA-2', sev:'crit', cat:'HSE', owner:'HSE Manager',
      text:'Minor LTI logged at Al Hamra — hand injury, first-aid given. Investigation open.', primary:{ label:'Acknowledge', kind:'warn' } },
    { id:'HA-3', sev:'warn', cat:'STAFFING', owner:'Site HR',
      text:'Al Hamra attendance 82% — below 90% target, install crew short for the shift.', primary:{ label:'Reassign crew', kind:'primary' } },
  ];

  // ============================================================
  //  FLEET & SUPPLIERS  (screen 10)  — external plant: trailers, cranes, pickups
  // ============================================================
  // icon ∈ truck | crane | pickup | fork | pump ; rate = AED/day per unit
  const fleetTypes = [
    { id:'trailer',     name:'Flatbed trailers', icon:'truck',  total:48, active:31, idle:12, maint:5, supplier:'Trella · Al Faris', rate:1800 },
    { id:'crane',       name:'Mobile cranes',    icon:'crane',  total:22, active:14, idle:6,  maint:2, supplier:'Al Faris · Johnson', rate:9500 },
    { id:'pickup',      name:'Pickups / LCV',    icon:'pickup', total:64, active:52, idle:11, maint:1, supplier:'Byrne Rental',       rate:380 },
    { id:'telehandler', name:'Telehandlers',     icon:'fork',   total:18, active:12, idle:5,  maint:1, supplier:'Rapid Access',       rate:1100 },
    { id:'pump',        name:'Concrete pumps',   icon:'pump',   total:9,  active:6,  idle:2,  maint:1, supplier:'Al Laith',           rate:5200 },
    { id:'lowbed',      name:'Low-beds (heavy)', icon:'truck',  total:7,  active:4,  idle:3,  maint:0, supplier:'Al Faris',           rate:3400 },
  ];
  // per-site usage of external equipment
  const fleetSites = [
    { id:'FALAH', trailers:9, cranes:4, pickups:12, transit:2 },
    { id:'YAS',   trailers:6, cranes:3, pickups:9,  transit:3 },
    { id:'BANI',  trailers:4, cranes:5, pickups:7,  transit:1 },
    { id:'ICAD2', trailers:8, cranes:1, pickups:8,  transit:2 },
    { id:'ENEC',  trailers:3, cranes:2, pickups:6,  transit:0 },
    { id:'SAAD',  trailers:2, cranes:1, pickups:5,  transit:1 },
  ];
  const fleetSuppliers = [
    { id:'alfaris', name:'Al Faris Group', cat:'Cranes · heavy transport', units:34, active:22, spend:312, s:'ok' },
    { id:'byrne',   name:'Byrne Rental',   cat:'Pickups · gensets',        units:64, active:52, spend:31,  s:'ok' },
    { id:'trella',  name:'Trella',         cat:'Trailers · logistics',     units:28, active:19, spend:54,  s:'ok' },
    { id:'rapid',   name:'Rapid Access',   cat:'Telehandlers · access',    units:18, active:12, spend:22,  s:'warn' },
    { id:'johnson', name:'Johnson Arabia', cat:'Mobile cranes',            units:8,  active:5,  spend:78,  s:'ok' },
    { id:'allaith', name:'Al Laith',       cat:'Concrete pumps',           units:9,  active:6,  spend:47,  s:'ok' },
  ];
  const fleetIncoming = [
    { id:'FL-5', sev:'warn', cat:'PREDICTIVE', site:'FALAH', owner:'Plant Coordinator',
      text:'Concrete pump P-03 (Al Laith) — hydraulic pressure drift flagged. Service before next pour.', primary:{ label:'Schedule', kind:'warn' } },
  ];
  const fleetAlerts = [
    { id:'FL-1', sev:'crit', cat:'IDLE COST', site:'BANI', owner:'Plant Coordinator',
      text:'Mobile crane CR-07 (Al Faris) idle 3 days at Baniyas — AED 28.5k/day, no lift scheduled.', primary:{ label:'Off-hire', kind:'primary' } },
    { id:'FL-2', sev:'crit', cat:'BREAKDOWN', site:'YAS', owner:'Logistics',
      text:'Trailer TR-118 (Trella) broken down en route to Yas Acres — load delayed, recovery dispatched.', primary:{ label:'Dispatch backup', kind:'warn' } },
    { id:'FL-3', sev:'warn', cat:'CERTIFICATION', owner:'HSE / Plant',
      text:'2 mobile cranes — third-party LOLER cert expires in 5 days.', primary:{ label:'Renew cert', kind:'primary' } },
    { id:'FL-4', sev:'warn', cat:'RATE VARIANCE', owner:'Procurement',
      text:'Rapid Access telehandler rate +12% vs framework agreement — review invoice.', primary:{ label:'Review', kind:'warn' } },
  ];

  // ============================================================
  //  FINANCE & ACCOUNTS  (screen 11)  — cash, AR, AP, retention
  // ============================================================
  const financeStats = { cash:284, inflowMTD:142, outflowMTD:118, cashSpark:[240,255,248,268,260,278,272,284] };
  const arInvoices = [
    { id:'INV-3041', client:'Aldar Properties',        proj:'YAS',   amount:62, age:22,  bucket:'Current', s:'ok' },
    { id:'INV-3038', client:'Aldar / Musanada',         proj:'FALAH', amount:40, age:45,  bucket:'30+',     s:'ok' },
    { id:'INV-2990', client:'Modon Properties',         proj:'BANI',  amount:28, age:72,  bucket:'60+',     s:'warn' },
    { id:'INV-2901', client:'Dept. of Municipalities',  proj:'SAMHA', amount:28, age:96,  bucket:'90+',     s:'crit' },
    { id:'INV-2855', client:'Dept. of Municipalities',  proj:'SAMHA', amount:19, age:104, bucket:'90+',     s:'crit' },
    { id:'INV-2880', client:'Emirates Nuclear',         proj:'ENEC',  amount:11, age:12,  bucket:'Current', s:'ok' },
    { id:'INV-3050', client:'Aldar Properties',         proj:'SAAD',  amount:8,  age:5,   bucket:'Current', s:'ok' },
  ];
  const apPayables = [
    { id:'PAY-SUB', supplier:'Installation subcontractor', amount:14,   due:'Today',  status:'approval', s:'crit' },
    { id:'PAY-ALF', supplier:'Al Faris Group · cranes',    amount:9.4,  due:'08 Jun', status:'approval', s:'warn' },
    { id:'PAY-TRE', supplier:'Trella · trailers',          amount:1.6,  due:'12 Jun', status:'scheduled', s:'ok' },
    { id:'PAY-STL', supplier:'Emirates Steel',             amount:1.35, due:'10 Jun', status:'scheduled', s:'ok' },
    { id:'PAY-CEM', supplier:'Star Cement',                amount:0.92, due:'09 Jun', status:'scheduled', s:'ok' },
    { id:'PAY-BYR', supplier:'Byrne Rental',               amount:0.9,  due:'15 Jun', status:'scheduled', s:'ok' },
  ];
  const retentionRows = [
    { proj:'FALAH', amount:31, release:'2027',            s:'ok' },
    { proj:'YAS',   amount:24, release:'Q4 2026',         s:'ok' },
    { proj:'ENEC',  amount:15, release:'On handover',     s:'warn' },
    { proj:'BANI',  amount:11, release:'On handover · wk', s:'warn' },
    { proj:'SAMHA', amount:4,  release:'Q1 2027',         s:'ok' },
    { proj:'SAAD',  amount:3,  release:'2028',            s:'ok' },
  ];
  const financeIncoming = [
    { kind:'payment', text:'Payment received — Aldar INV-3041 AED 62M cleared to account.', amount:62 },
  ];
  const financeAlerts = [
    { id:'FN-1', sev:'crit', cat:'OVERDUE AR', proj:'SAMHA', owner:'Finance Controller',
      text:'AED 47M overdue >90 days across 3 clients — collection escalation prepared.', primary:{ label:'Chase', kind:'warn' } },
    { id:'FN-2', sev:'crit', cat:'PAYMENT DUE', owner:'Finance Controller',
      text:'Subcontractor payment AED 14M due today — awaiting your approval to release.', primary:{ label:'Approve payment', kind:'good' } },
    { id:'FN-3', sev:'warn', cat:'INVOICE HOLD', owner:'Procurement / Finance',
      text:'Al Faris crane invoice AED 9.4M — rate variance vs framework, hold for review.', primary:{ label:'Review', kind:'primary' } },
    { id:'FN-4', sev:'warn', cat:'RETENTION', proj:'BANI', owner:'Commercial',
      text:'Baniyas retention AED 11M release due on handover next week — prepare certificate.', primary:{ label:'Schedule release', kind:'primary' } },
  ];

  // ============================================================
  //  TRUCK TRIP VERIFICATION  (screen 3)  — camera-counted trips,
  //  3-way handshake, hash chain, QR-verified invoice. (from proposal)
  // ============================================================
  const tvStats = {
    registered: 18, verifiedToday: 47, claimed: 50, rejected: 3, unclaimed: 2, suspended: 1, disputes: 0, camsOnline: 8, camsTotal: 8,
  };
  // trucks we know about (plate registry)
  const verifyTrucks = [
    { plate:'AD-77888', supplier:'Trella',   trips:4, status:'active' },
    { plate:'AD-48217', supplier:'Al Faris', trips:3, status:'active' },
    { plate:'AD-51422', supplier:'Trella',   trips:4, status:'active' },
    { plate:'AD-44120', supplier:'Trella',   trips:3, status:'active' },
    { plate:'AD-49003', supplier:'Al Faris', trips:2, status:'unclaimed', note:'camera saw · no note' },
    { plate:'AD-55190', supplier:'Trella',   trips:3, status:'suspended', note:'timestamp mismatch' },
    { plate:'AD-60771', supplier:'Al Faris', trips:2, status:'idle' },
    { plate:'AD-30219', supplier:'— unknown', trips:0, status:'unregistered', note:'at ICAD II gate now' },
  ];
  // featured complete trip — the 4-event lifecycle (what's IN / what's OUT)
  const verifyFeatured = {
    trip:'TRIP-1042', plate:'AD-77888', supplier:'Trella', route:'ICAD II → Yas Acres',
    handshake:{ camera:true, note:true, times:true },
    events:[
      { gate:'Factory IN',  lane:'IN',  cam:'CAM·01', load:'EMPTY',  t:'07:12', hash:'a3f8b2c9' },
      { gate:'Factory OUT', lane:'OUT', cam:'CAM·03', load:'LOADED', t:'07:41', hash:'7c4e1d05' },
      { gate:'Site IN',     lane:'IN',  cam:'CAM·05', load:'LOADED', t:'09:05', hash:'2bd0a7f3' },
      { gate:'Site OUT',    lane:'OUT', cam:'CAM·07', load:'EMPTY',  t:'09:38', hash:'e5a79c21' },
    ],
  };
  // trip timesheet — each trip's 4 gate times + 3-way handshake result + hash
  const verifyTrips = [
    { id:'TRIP-1042', plate:'AD-77888', sup:'Trella',    from:'ICAD II', to:'Yas Acres', fIn:'07:12', fOut:'07:41', sIn:'09:05', sOut:'09:38', cam:true,  note:true,  times:true,  status:'verified',  hash:'a3f8…e5a7' },
    { id:'TRIP-1041', plate:'AD-48217', sup:'Al Faris',  from:'ICAD II', to:'Baniyas',   fIn:'06:40', fOut:'07:05', sIn:'08:10', sOut:'08:38', cam:true,  note:true,  times:true,  status:'verified',  hash:'7c4e…b91c' },
    { id:'TRIP-1040', plate:'AD-51422', sup:'Trella',    from:'KEZAD',   to:'Al Falah',  fIn:'06:02', fOut:'06:30', sIn:'07:18', sOut:'07:46', cam:true,  note:true,  times:true,  status:'verified',  hash:'9f12…c2f4' },
    { id:'TRIP-1036', plate:'AD-44120', sup:'Trella',    from:'KEZAD',   to:'Al Falah',  fIn:'05:30', fOut:'05:58', sIn:'06:45', sOut:'07:12', cam:true,  note:true,  times:true,  status:'verified',  hash:'4d77…aa12' },
    { id:'TRIP-1039', plate:'AD-55190', sup:'Trella',    from:'Al Ain',  to:'Yas Acres', fIn:'05:50', fOut:'06:15', sIn:'09:40', sOut:'10:05', cam:true,  note:true,  times:false, status:'suspended', hash:'2bd0…1aa9' },
    { id:'TRIP-1037', plate:'AD-49003', sup:'Al Faris',  from:'ICAD II', to:'Baniyas',   fIn:'07:20', fOut:'07:48', sIn:'08:55', sOut:'09:20', cam:true,  note:false, times:false, status:'unclaimed', hash:'1f88…d0a3' },
    { id:'TRIP-1038', plate:'AD-99001', sup:'(claimed)', from:'—',       to:'Baniyas',   fIn:'—',     fOut:'—',     sIn:'—',     sOut:'—',     cam:false, note:true,  times:false, status:'rejected',  hash:'—' },
  ];
  // immutable hash chain (append-only; each links to the previous)
  const verifyChain = [
    { t:'09:38:04', ev:'SITE_OUT',  plate:'AD-77888', load:'EMPTY',  hash:'e5a79c21…b91c', prev:'2bd0a7f3' },
    { t:'09:05:22', ev:'SITE_IN',   plate:'AD-77888', load:'LOADED', hash:'2bd0a7f3…1aa9', prev:'7c4e1d05' },
    { t:'08:55:10', ev:'TRIP_VERIFIED', plate:'AD-51422', load:'—', hash:'9f12bb04…c2f4', prev:'55bc7e1' },
    { t:'07:41:10', ev:'FACTORY_OUT', plate:'AD-77888', load:'LOADED', hash:'7c4e1d05…d0a3', prev:'a3f8b2c9' },
    { t:'07:12:00', ev:'FACTORY_IN',  plate:'AD-77888', load:'EMPTY',  hash:'a3f8b2c9…aa12', prev:'9e21f70' },
    { t:'07:02:19', ev:'CLAIM_REJECTED', plate:'AD-99001', load:'—', hash:'0x9a01f73…4e07', prev:'2b9d440' },
  ];
  const verifyChainStream = [
    { ev:'FACTORY_IN',  plate:'AD-60771', load:'EMPTY',  hashSeed:'b8c1' },
    { ev:'FACTORY_OUT', plate:'AD-60771', load:'LOADED', hashSeed:'4d77' },
    { ev:'SITE_IN',     plate:'AD-48217', load:'LOADED', hashSeed:'1f88' },
    { ev:'TRIP_VERIFIED', plate:'AD-48217', load:'—',    hashSeed:'7b02' },
  ];
  const verifyIncoming = [
    { id:'TV-5', sev:'warn', cat:'UNCLAIMED', owner:'Logistics Control',
      text:'Camera recorded a trip for AD-60771 — supplier has not submitted a delivery note.', primary:{ label:'Request note', kind:'warn' } },
  ];
  const verifyAlerts = [
    { id:'TV-1', sev:'crit', cat:'UNREGISTERED', owner:'Gatehouse / Security', plate:'AD-30219',
      text:'Unregistered truck AD-30219 at ICAD II gate — not in fleet registry. Trip blocked, not billable.', primary:{ label:'Register', kind:'primary' } },
    { id:'TV-2', sev:'crit', cat:'CLAIM REJECTED', owner:'Logistics Control', trip:'TRIP-1038',
      text:'Supplier claimed TRIP-1038 (AD-99001) — no camera record at either gate. Auto-rejected, not payable.', primary:{ label:'Investigate', kind:'warn' } },
    { id:'TV-3', sev:'warn', cat:'TIMESTAMP', owner:'Dual reviewers', trip:'TRIP-1039',
      text:'TRIP-1039 (AD-55190) factory→site time off by 42 min — suspended for two-manager review.', primary:{ label:'Dual review', kind:'primary' } },
    { id:'TV-4', sev:'warn', cat:'CAMERA', owner:'IT / Plant',
      text:'Site OUT camera (CAM·07) offline 3 min — any trips in the window flagged "unverifiable".', primary:{ label:'Dispatch', kind:'warn' } },
  ];

  return { factories, projects, health, output, finance, alerts, incoming, activitySeed, briefing,
           yasChain, yasElements, yasRisks, lines, passportStages, passport,
           maintenance, trips, ledger, ledgerStream, verifyStats,
           salesFunnel, salesStats, orderBook, salesQuotes, salesEnquiries, salesIncoming, salesAlerts,
           materials, purchaseOrders, deliveriesDue, consumption, storeStats, storeAlerts,
           designStats, drawingRegister, designApprovals, designClashes, designWorkload, designIncoming, designAlerts,
           peopleStats, workforceFn, deployment, hse, compliance, peopleIncoming, peopleAlerts,
           fleetTypes, fleetSites, fleetSuppliers, fleetIncoming, fleetAlerts,
           financeStats, arInvoices, apPayables, retentionRows, financeIncoming, financeAlerts,
           tvStats, verifyTrucks, verifyFeatured, verifyTrips, verifyChain, verifyChainStream, verifyIncoming, verifyAlerts };
})();
