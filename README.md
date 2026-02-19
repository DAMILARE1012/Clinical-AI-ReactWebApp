# Clinical Research Knowledge Hub

A full-stack web application for managing clinical research projects and experiments, with an AI-powered chat assistant. Built with a React frontend, FastAPI backend, and deployed on AWS.

---

## Architecture

```
                          Internet
                             │
                    ┌────────▼────────┐
                    │   EC2 Instance  │  (Public Subnet)
                    │                 │
                    │   Nginx :80     │  ◄── serves React SPA
                    │      │          │       + proxies /api/*
                    │   FastAPI :8000 │  ◄── REST API (systemd)
                    └────────┬────────┘
                             │  Private VPC connection
                    ┌────────▼────────┐
                    │   AWS RDS       │  (Private Subnet)
                    │   MySQL 8       │  ◄── users, projects,
                    └─────────────────┘       experiments
```

| Layer | Technology | Details |
|---|---|---|
| Frontend | React 18 + Vite | SPA served as static files by Nginx |
| Reverse proxy | Nginx | Routes `/api/*` to FastAPI, serves frontend |
| Backend | FastAPI (Python) | REST API, managed by systemd |
| Database | AWS RDS MySQL | Private subnet, only reachable from EC2 |
| Auth | JWT (python-jose) | Role-based: `admin` / `researcher` |
| AI Chat | Groq (LLaMA 3.1) | RAG with Pinecone vector store |

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── config.py        # Settings loaded from .env
│   │   ├── database.py      # SQLAlchemy engine (MySQL / SQLite fallback)
│   │   ├── dependencies.py  # JWT auth dependency
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # API route handlers
│   │   └── services/        # Business logic (auth, chat, Pinecone)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/             # Axios API clients
    │   ├── components/      # Reusable UI components
    │   ├── context/         # React context (AuthContext)
    │   ├── hooks/           # Custom hooks
    │   └── pages/           # Login, Register, Dashboard, etc.
    ├── package.json
    └── .env.example
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8 (or AWS RDS MySQL instance)
- An AWS EC2 instance in a public subnet (for production)

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/DAMILARE1012/Clinical-AI-ReactWebApp.git
cd Clinical-AI-ReactWebApp
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in your values (see Configuration section below)

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> If `MYSQL_HOST` is not set or unreachable, the backend automatically falls back to a local SQLite database (`research_hub_dev.db`) — no extra setup needed for local dev.

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_BASE_URL to your backend URL (default: /api for production, http://localhost:8000 for dev)

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Configuration

Copy `backend/.env.example` to `backend/.env` and fill in your values:

| Variable | Description | Example |
|---|---|---|
| `MYSQL_HOST` | RDS endpoint | `mydb.xxxx.us-east-1.rds.amazonaws.com` |
| `MYSQL_PORT` | MySQL port | `3306` |
| `MYSQL_USER` | DB username | `admin` |
| `MYSQL_PASSWORD` | DB password | `your_password` |
| `MYSQL_DATABASE` | Database name | `research_hub` |
| `JWT_SECRET_KEY` | Secret for signing tokens | generate with command below |
| `PINECONE_API_KEY` | Pinecone vector DB key | from pinecone.io |
| `PINECONE_INDEX_NAME` | Pinecone index name | `research-hub` |
| `GROQ_API_KEY` | Groq LLM API key | from console.groq.com |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |

Generate a secure JWT secret:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Production Deployment (AWS EC2)

### 1. Build the frontend

```bash
cd frontend
npm install
npm run build
# Output goes to frontend/dist/ — served by Nginx
```

### 2. Configure Nginx

Create `/etc/nginx/sites-available/app`:

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    root /home/ubuntu/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Run backend as a systemd service

Create `/etc/systemd/system/fastapi.service`:

```ini
[Unit]
Description=Clinical Research Knowledge Hub - FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/backend
EnvironmentFile=/home/ubuntu/backend/.env
ExecStart=/usr/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable fastapi
sudo systemctl start fastapi
```

### 4. Managing the backend service

```bash
sudo systemctl status fastapi    # check status
sudo systemctl restart fastapi   # restart
sudo systemctl stop fastapi      # stop
sudo journalctl -u fastapi -f    # view live logs
```

---

## API Reference

Interactive docs are available at:
- Swagger UI: `http://YOUR_HOST/api/docs`
- ReDoc: `http://YOUR_HOST/api/redoc`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/users/me` | Get current user profile | Yes |
| GET | `/api/projects` | List all projects | Yes |
| POST | `/api/projects` | Create a project | Yes |
| GET | `/api/projects/{id}` | Get project details | Yes |
| POST | `/api/experiments` | Create an experiment | Yes |
| POST | `/api/chat` | Send a message to AI assistant | Yes |
| GET | `/api/health` | Health check | No |

---

## AWS Infrastructure Summary

| Resource | Type | Subnet |
|---|---|---|
| EC2 (Nginx + FastAPI) | `t2.micro` or similar | Public |
| RDS MySQL | `db.t4g.micro` | Private |

**Security groups:**
- EC2: inbound HTTP (80), SSH (22) from your IP
- RDS: inbound MySQL (3306) from EC2 security group only — no public internet access
