# 🛡️ SecQ-Auto — Autonomous Vendor Security Questionnaire Automation

> **Turn 40 hours of manual work into 30 minutes of AI‑powered automation.**

SecQ-Auto is a 100 % autonomous AI‑agent system that ingests vendor security questionnaires (Excel, CSV, PDF), retrieves answers from your company knowledge base using RAG, generates accurate responses with confidence scores, and exports completed questionnaires — all with human‑in‑the‑loop review.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                SecQ‑Auto Stack                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────┐   HTTPS   ┌─────────────────┐ │
│  │ Cloudflare    │ ───────► │ Cloudflare Worker│ │
│  │ Pages (React) │           │ (Edge Proxy)   │ │
│  └───────────────┘           └───────┬─────────┘ │
│                                      │          │
│                              ┌───────▼───────┐   │
│                              │ PandaStack    │   │
│                              │ (Hosting Front│   │
│                              │ end React)    │   │
│                              └───────┬───────┘   │
│                                      │          │
│                              ┌───────▼───────┐   │
│                              │ Northflank   │   │
│                              │ (Backend:    │   │
│                              │  OmniRoute,  │   │
│                              │  9Router,    │   │
│                              │  Qdrant)     │   │
│                              └──────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
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

### 2. Cloudflare Pages (React Frontend)
```bash
# Install Cloudflare CLI if not present
npm install -g @cloudflare/wrangler
# Deploy the built React app to Cloudflare Pages
pandastack login --token $PANDASTACK_TOKEN   # ensure PandaStack token for hosting the frontend
cd frontend && npm run build
# Use Wrangler to publish to Cloudflare Pages (replace with your Pages project name)
wrangler pages publish ./dist --project-name secq-auto-frontend
```

### 3. Cloudflare Worker (Optional Edge Proxy & Caching)
```bash
# Build and publish the Worker
cd cloudflare-worker
wrangler publish
```

## 🤖 AI Agent Pipeline

```
Upload → Parse → Retrieve → Answer → Validate → Review → Export
         │         │          │         │          │        │
    Parser    Retrieval   Answer   Validator   Human   Formatter
     Agent      Agent      Agent     Agent     Review    Agent
```

1. **ParserAgent** – Extracts structured questions from Excel/CSV/PDF
2. **RetrievalAgent** – Searches Qdrant vector DB for relevant context
3. **AnswerAgent** – Generates answers using OmniRoute → 9Router fallback
4. **ValidatorAgent** – Validates answers for accuracy and compliance
5. **FormatterAgent** – Exports completed questionnaires

## 🔐 Multi‑Tenancy

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
| Cloudflare Pages | Free Plan | $0 | ✅ |
| Cloudflare Worker | Free Plan | $0 | ✅ |
| PandaStack | Free Container | $0 | ✅ |
| **Total** | | **$0** | ✅ |

## 📁 Project Structure

```
secq-auto/
├── .github/workflows/deploy.yml        # CI/CD pipeline
├── northflank/                         # Northflank deployment
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── omniroute-config.yaml
│   ├── router9-config.yaml
│   └── qdrant-config.yaml
├── frontend/                           # Next.js React app
│   ├── src/
│   │   ├── pages/index.jsx
│   │   ├── utils/api.js
│   │   └── styles/globals.css
│   ├── package.json
│   └── tailwind.config.js
├── cloudflare-worker/                  # Optional edge proxy
│   ├── worker.js
│   └── wrangler.toml
├── grafana/
│   └── secq-auto-dashboard.json
├── docker-compose.yml
├── SPEC.md
└── README.md
```

## 🎯 Roadmap

- [x] Core AI agent pipeline (5 agents)
- [x] Multi‑tenant API with JWT auth
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

**Built with ❤️ by the SecQ‑Auto team. Automating security questionnaires so engineers can focus on building.**
