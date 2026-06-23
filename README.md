# 🛡️ SecQ-Auto — Autonomous Vendor Security Questionnaire Automation

> **Turn 40 hours of manual work into 30 minutes of AI-powered automation.**

SecQ-Auto is a 100% autonomous AI agent system that ingests vendor security questionnaires (Excel, CSV, PDF), retrieves answers from your company knowledge base using RAG, generates accurate responses with confidence scores, and exports completed questionnaires — all with human-in-the-loop review.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SecQ-Auto Stack                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    HTTPS    ┌──────────────────────────────┐  │
│  │  PandaStack   │ ────────→  │       FreeShell.de           │  │
│  │  (Frontend)   │            │   CowAgent FastAPI (8000)    │  │
│  │  Next.js 14   │            │                              │  │
│  │  React 18     │            │  ┌────────────────────────┐  │  │
│  └──────────────┘            │  │  5 AI Agents:          │  │  │
│                               │  │  1. ParserAgent        │  │  │
│                               │  │  2. RetrievalAgent     │  │  │
│                               │  │  3. AnswerAgent        │  │  │
│                               │  │  4. ValidatorAgent     │  │  │
│                               │  │  5. FormatterAgent     │  │  │
│                               │  └────────────────────────┘  │  │
│                               └──────────┬───────────────────┘  │
│                                          │ HTTPS                │
│                               ┌──────────▼───────────────────┐  │
│                               │       Northflank             │  │
│                               │                              │  │
│                               │  OmniRoute    (3000) ─── LLM│  │
│                               │  9Router      (4000) ─── LLM│  │
│                               │  Qdrant       (6333) ─── Vec│  │
│                               └──────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Optional: Cloudflare Worker (Edge Proxy + Caching)      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/secq-auto.git
cd secq-auto

# Start all services
docker compose up -d

# Access:
# Frontend:    http://localhost:3001
# API Docs:    http://localhost:8000/docs
# Qdrant:      http://localhost:6333
# OmniRoute:   http://localhost:3000
```

### Default API Key (local dev only)
```
X-API-Key: sqa_default_key_change_me
```

## 📡 API Endpoints

### Questionnaires
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/questionnaires` | Create questionnaire |
| `POST` | `/api/questionnaires/{id}/upload` | Upload file (Excel/CSV/PDF) |
| `GET` | `/api/questionnaires/{id}/questions` | Get parsed questions |
| `POST` | `/api/questionnaires/{id}/answer` | Generate AI answers |
| `POST` | `/api/questionnaires/{id}/validate` | Validate answers |
| `POST` | `/api/questionnaires/{id}/approve/{q_id}` | Approve answer |
| `POST` | `/api/questionnaires/{id}/reject/{q_id}` | Reject answer |
| `GET` | `/api/questionnaires/{id}/export` | Export (Excel/CSV) |
| `GET` | `/api/questionnaires` | List questionnaires |

### Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/kb/ingest` | Ingest document |
| `GET` | `/api/kb/search?q=...` | Search KB |
| `GET` | `/api/kb/documents` | List documents |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Chat with AI |
| `POST` | `/api/tenants` | Create tenant |
| `GET` | `/health` | Health check |

## 🌐 Deployment (All Free, 24/7)

### 1. Northflank (OmniRoute + 9Router + Qdrant)
```bash
npm install -g @northflank/cli
northflank login --token $NORTHFLANK_TOKEN
northflank projects create secq-auto
# Deploy via GitHub Actions (see .github/workflows/deploy.yml)
```

### 2. FreeShell.de (CowAgent FastAPI)
```bash
# SSH into FreeShell.de
ssh user@freemashell.de
git clone https://github.com/YOUR_USERNAME/secq-auto.git
cd secq-auto
bash freeshell/setup.sh
# Runs on port 8000, 24/7 via systemd
```

### 3. PandaStack (React Frontend)
```bash
npm install -g @pandastack/cli
pandastack login --token $PANDASTACK_TOKEN
cd frontend && npm run build
pandastack sites create secq-auto-frontend --dir ./dist
```

## 🤖 AI Agent Pipeline

```
Upload → Parse → Retrieve → Answer → Validate → Review → Export
         │         │          │         │          │        │
    Parser    Retrieval   Answer   Validator   Human   Formatter
     Agent      Agent      Agent     Agent     Review    Agent
```

1. **ParserAgent** — Extracts structured questions from Excel/CSV/PDF
2. **RetrievalAgent** — Searches Qdrant vector DB for relevant context
3. **AnswerAgent** — Generates answers using OmniRoute → 9Router fallback
4. **ValidatorAgent** — Validates answers for accuracy and compliance
5. **FormatterAgent** — Exports completed questionnaires

## 🔐 Multi-Tenancy

Every API request requires an `X-API-Key` header. Each tenant gets:
- Isolated questionnaire storage
- Separate knowledge base (Qdrant namespace filtering)
- Independent usage tracking
- Unique API key

## 📊 Monitoring

Import `grafana/secq-auto-dashboard.json` into Grafana for:
- Request rate (req/min)
- Memory usage (%)
- Latency p95/p50
- Tokens used per hour
- HTTP status code distribution
- Average answer confidence

## 💰 Cost: $0/month

| Service | Tier | Cost | 24/7 |
|---------|------|------|------|
| Northflank | Developer Sandbox | $0 | ✅ |
| FreeShell.de | Free Shell | $0 | ✅ |
| PandaStack | Free Container | $0 | ✅ |
| **Total** | | **$0** | ✅ |

## 📁 Project Structure

```
secq-auto/
├── .github/workflows/deploy.yml    # CI/CD pipeline
├── northflank/                     # Northflank deployment
│   ├── Dockerfile                  # OmniRoute + 9Router + Qdrant
│   ├── entrypoint.sh               # Service startup script
│   ├── omniroute-config.yaml       # LLM router config
│   ├── router9-config.yaml         # Fallback router config
│   └── qdrant-config.yaml          # Vector DB config
├── freeshell/                      # FreeShell.de deployment
│   ├── cowagent/
│   │   ├── main.py                 # FastAPI app + 5 AI agents
│   │   ├── requirements.txt        # Python dependencies
│   │   └── Dockerfile
│   └── setup.sh                    # Server setup script
├── frontend/                       # Next.js React app
│   ├── src/
│   │   ├── pages/index.jsx         # Main dashboard
│   │   ├── utils/api.js            # API client
│   │   └── styles/globals.css      # Tailwind styles
│   ├── package.json
│   └── tailwind.config.js
├── cloudflare-worker/              # Optional edge proxy
│   ├── worker.js
│   └── wrangler.toml
├── grafana/
│   └── secq-auto-dashboard.json    # Monitoring dashboard
├── docker-compose.yml              # Local development
├── SPEC.md                         # Full specification
└── README.md
```

## 🎯 Roadmap

- [x] Core AI agent pipeline (5 agents)
- [x] Multi-tenant API with JWT auth
- [x] Excel/CSV/PDF parsing
- [x] RAG with Qdrant vector search
- [x] OmniRoute + 9Router LLM fallback
- [x] React frontend with review UI
- [x] Docker Compose local dev
- [x] GitHub Actions CI/CD
- [x] Cloudflare Worker edge proxy
- [x] Grafana monitoring dashboard
- [ ] Vanta/SafeBase integration
- [ ] SIG/CAIQ portal support
- [ ] Slack/Teams notifications
- [ ] Stripe billing integration

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by the SecQ-Auto team. Automating security questionnaires so engineers can focus on building.**
