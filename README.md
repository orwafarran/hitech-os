# HT-OS — the HiTech Operating System

A live executive command-centre demo for **Hi-Tech Concrete Products** (Trojan
Construction Group). Five connected screens, real Hi-Tech data, a working
**LIVE/PAUSE** engine, and real **Approve / Escalate / Flag / Resolve** controls
throughout. Built to be deployed as a static site (Surge-ready).

**Open · See · Act** — one screen for the whole company, data that updates itself,
and real controls instead of just charts.

---

## Screens

1. **Executive Control Tower** (hero) — company health score, live UAE factory
   map + tile rail (11 plants: 7 fixed + 4 mobile), output vs 3,500 m³/day
   capacity, AED financial exposure, a critical-alert queue with working
   **Approve / Escalate / Flag / Resolve** buttons, an executive morning
   briefing, and a streaming live-activity feed.
2. **Project View** — drill-in (Yas Acres, Al Falah, Baniyas, Al Samha, ENEC,
   Saadiyat): design → approvals → production → delivery → installation chain,
   elements in progress, auto-flagged risks with actions.
3. **Production Floor** — six live lines, predictive-maintenance + QC flags with
   dispatch/quarantine actions, and an element **passport** (designed → … →
   installed) that advances when you approve QC.
4. **Knowledge Graph** — the connected wall, client → … → installed; trace any
   project (Al Samha shows a broken chain at Approval, in red).
5. **Trust & Verification** — camera-verified truck trips, QR delivery notes, a
   tamper-proof **append-only ledger** that signs new events live, counter-sign,
   and geofence-deviation clearing.
6. **Sales & Orders** — pipeline funnel (enquiries → quotes → won, count + AED at
   each stage), live order book mirroring the projects, quotes & enquiries with
   **Approve quote / Convert enquiry → quote / Escalate**, and red alerts for an
   expiring high-value quote and a stalled deal. Won quotes create orders that
   feed the project lifecycle.
7. **Store & Procurement** — live inventory (cement, aggregates, steel/rebar,
   admixtures, embeds, consumables) with low-stock flags, open purchase orders,
   deliveries due / consumption (ties to the floor), and **Raise PO / Approve PO /
   Expedite / Flag low stock**. Low-stock alerts fire on their own as stock is
   consumed, before a line stalls.
8. **Design & Engineering** — BIM cockpit: drawing register (IFC/rev/% approved
   per project), consultant approval pipeline with SLA breaches, live clash
   detection (new clashes auto-surface), and **Approve drawing / Escalate to
   consultant / Assign clash / Issue revision**.
9. **People & HR** — workforce by function (10,400 across the group), deployment
   across the 11 sites, HSE/safety (days without LTI, incidents), compliance
   (expiring visas/permits/certs), and **Renew / Approve leave / Acknowledge
   incident / Reassign crew**. Present-count clocks in live; staffing/compliance
   alerts fire on their own.
10. **Fleet & Suppliers** — external plant from real UAE suppliers (Al Faris,
    Trella, Johnson Arabia, Byrne, Rapid Access, Al Laith): trailers, cranes,
    pickups, telehandlers, pumps, low-beds — with line-art icons, count active
    *now*, utilisation, per-site deployment, and a live "convoy" animation.
    **Off-hire / Dispatch / Extend / Review** actions; idle-cost & breakdown alerts.
11. **Finance & Accounts** — cash position, receivables with aging buckets
    (current/30/60/90+), payables to suppliers (cross-linked to Fleet & Store),
    retention by project. **Approve payment / Chase invoice / Release retention /
    Escalate**. A large invoice clears live (cash↑, receivables↓, aging recomputes).

## Design system

- **Cyan (`#1fe0c4`) is the single system accent** — interactive chrome,
  primary actions, live indicators, selected states.
- **Trojan red is reserved strictly for alert / critical states** — failures,
  deviations, breaches, broken chains.
- Green = OK, amber = watch/warn, cyan = accent/info.
- Type: IBM Plex Mono (instrumentation) + IBM Plex Sans, on a dark control-room
  surface. The real Hi-Tech logo sits on a light plate in the top bar.

---

## Run locally

The app is **pre-built** into `dist/` — you can serve that folder with any static
server, no build step required:

```bash
npx serve -s dist          # or: python3 -m http.server -d dist 8080
```

Then open the printed URL.

## Build from source

Source lives in `src/` (JSX + CSS + data). The build pre-compiles the JSX to
plain JS with Babel (no in-browser Babel — fast, self-contained) and copies
static assets into `dist/`:

```bash
npm install
npm run build
```

React is **vendored locally** in `dist/vendor/`, so the demo has no runtime CDN
dependency and won't break if a network blips during a live presentation.

## Deploy to Surge

```bash
npm run build          # ensure dist/ is current
surge ./dist           # pick any domain, e.g. ht-os.surge.sh
```

(`npm run deploy` is a shortcut for `surge ./dist`.) Surge serves `dist/` as-is;
`200.html` is included as a fallback so any path loads the app.

---

## Project layout

```
src/                 authoring source (edit here)
  index.html         shell — loads vendored React + compiled js
  styles.css         design system (cyan accent · red = critical)
  data.js            shared Hi-Tech dataset (factories, projects, alerts, …)
  lib.jsx            shared components (Panel, Btn, Ring, Num, UAEBoard, Toasts…)
  tower.jsx          Screen 1 · Executive Control Tower
  project.jsx        Screen 2 · Project View
  factory.jsx        Screen 3 · Production Floor
  graph.jsx          Screen 4 · Knowledge Graph
  trust.jsx          Screen 5 · Trust & Verification
  sales.jsx          Screen 6 · Sales & Orders
  store.jsx          Screen 7 · Store & Procurement
  design.jsx         Screen 8 · Design & Engineering
  people.jsx         Screen 9 · People & HR
  fleet.jsx          Screen 10 · Fleet & Suppliers
  finance.jsx        Screen 11 · Finance & Accounts
  app.jsx            shell, nav, live engine, toast host, alert queue
tools/postbuild.mjs  copies static assets into dist/
dist/                deployable static site (build output)
```
