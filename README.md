# Evergreen Node 04 — Sovereign Digital Storefront & Logistics Node

> **Experimental Development Node (Sovereign Node 04)**
> Evergreen Stretford — Moss Park Community Infrastructure
> **Classification:** UK R&D Tax Relief — Qualifying Experimental Development Activity
> **Equity Reference:** 13/33 Equity Ledger Model

---

## Project Overview

Evergreen Node 04 is a high-performance, mobile-first digital storefront and logistics node built for **Evergreen Stretford**, a legacy family business in Moss Park, Greater Manchester. This repository constitutes evidence of systematic experimental development activity carried out under the UK's R&D Tax Relief scheme (HMRC CIRD80000).

The system is designed to run on a local **AMD Threadripper edge node** (LILIETH Kernel), providing sovereign, community-owned infrastructure that is not dependent on third-party cloud platforms.

---

## Architecture

```
evergreen-node-04/
├── frontend/          # Single-page storefront (HTML/CSS/JS — Monochrome-Sovereign aesthetic)
├── backend/           # Python Flask REST API for AMD Threadripper edge node
│   ├── app.py         # API server (menu, inventory, orders)
│   └── jarvis_database.py  # SQLite/PostgreSQL database handler
└── junior-dev/        # Gamified menu data-entry interface for young contributors
```

---

## Sovereign Features

| Feature | Description | Status |
|---|---|---|
| **WebRTC ACTIVATE SIGNAL** | Browser-based peer-to-peer communication mesh | ✅ Implemented |
| **Gemini Pro Concierge** | AI-powered automated customer concierge (Google Gemini Pro API) | 🔧 Placeholder Ready |
| **JARVIS Database** | SQLite/PostgreSQL handler — 100+ menu items & live inventory | ✅ Implemented |
| **Edge Node API** | Python Flask REST API for local AMD Threadripper deployment | ✅ Implemented |
| **Junior Dev Module** | Gamified data-entry interface for young contributors | ✅ Implemented |

---

## R&D Tax Relief Statement

This project qualifies as **Experimental Development** under HMRC's definition (CIRD80200) because it involves systematic work to resolve scientific or technological uncertainty. Specific areas of uncertainty include:

1. **Sovereign edge-node architecture** — Whether a community-grade AMD Threadripper workstation can reliably serve as a production-grade logistics and e-commerce node without cloud dependency.
2. **WebRTC mesh communications for retail** — Adapting WebRTC peer-to-peer signalling protocols for a retail/logistics context with no centralised TURN/STUN server.
3. **AI concierge integration** — Integrating large language model APIs (Google Gemini Pro) into a legacy retail context with constrained connectivity.
4. **Gamified data-entry UX** — Whether gamification mechanics can meaningfully increase data quality and engagement for junior contributors in a community business context.

**Equity Reference:** All qualifying expenditure on this node is tracked against the **13/33 Equity Ledger Model**, which allocates 13% of verified R&D expenditure to community equity and 33% to operational reinvestment.

**Responsible Technologist:** Evergreen Stretford, Moss Park, Salford/Manchester.
**Node Identifier:** `[ACTIVE_SIGNAL] SOVEREIGN_NODE_04`

---

## Quick Start

### Backend (Edge Node API)

```bash
cd backend
pip install -r requirements.txt
python jarvis_database.py   # Initialise & seed the database
python app.py               # Start the Flask API on port 5000
```

### Frontend (Storefront)

Open `frontend/index.html` directly in a browser, or serve with any static file server:

```bash
cd frontend
python -m http.server 8080
# Navigate to http://localhost:8080
```

### Junior Dev Module

```bash
cd junior-dev
python -m http.server 8081
# Navigate to http://localhost:8081
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/menu` | List all menu items |
| `GET` | `/api/menu/<id>` | Get single menu item |
| `POST` | `/api/menu` | Add a new menu item |
| `PUT` | `/api/menu/<id>` | Update a menu item |
| `DELETE` | `/api/menu/<id>` | Remove a menu item |
| `GET` | `/api/inventory` | List inventory |
| `PUT` | `/api/inventory/<id>` | Update inventory quantity |
| `GET` | `/api/orders` | List orders |
| `POST` | `/api/orders` | Place a new order |
| `GET` | `/api/health` | Node health check |

---

## Design System — Monochrome-Sovereign

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#000000` | Page background |
| `--color-surface` | `#111111` | Card/panel surfaces |
| `--color-text` | `#FFFFFF` | Primary text |
| `--color-muted` | `#888888` | Secondary text |
| `--color-accent-red` | `#B22222` | Primary accent (Deep Red) |
| `--color-accent-gold` | `#D4AF37` | Secondary accent (Gold) |

---

*Sovereign Node 04 — [ACTIVE_SIGNAL] — Evergreen Stretford — Moss Park*
