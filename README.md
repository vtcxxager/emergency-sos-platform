# Community Emergency Response Platform with Network Assistance

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0%2B-green.svg)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.15%2B-red.svg)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)

A production-oriented, academic capstone platform designed to coordinate rapid emergency assistance across residential societies, gated communities, and local networks.

---

## 1. System Architecture Overview

The platform uses a decoupled, high-resilience architecture:

- **Backend:** Python 3.10+ / Django 5.0+ / Django REST Framework (DRF)
- **Database:** PostgreSQL 16 with ACID transactions and normalized schema
- **Background Tasks:** Celery + Redis 7 for scheduled guardian timeouts and auto-escalation
- **Web Portal:** React 19 / TypeScript / Tailwind CSS
- **Mobile Client:** React Native with Expo & TypeScript (sharing identical Django REST endpoints)

```
[Mobile App (Expo) / Web Portal (React)]
                     |
           (HTTPS JSON REST APIs)
                     v
   [Django REST Framework (Python 3.10+)]
          |                      |
    (Django ORM)           (Celery Queue)
          v                      v
   [PostgreSQL 16]         [Redis 7 Broker]
```

---

## 2. Repository Structure

```
community-emergency-platform/
│
├── backend/                         # Django REST Framework Backend
│   ├── config/                      # Project settings, Celery, URLs, WSGI/ASGI
│   │   ├── __init__.py              # Celery auto-discovery init
│   │   ├── settings.py              # PostgreSQL, DRF, CORS, JWT, Rate Limiting
│   │   ├── celery.py                # Celery worker application
│   │   ├── urls.py                  # API routing & OpenAPI / Swagger
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── core/                        # Health monitoring & Diagnostics app
│   │   ├── apps.py
│   │   ├── serializers.py           # Health response serializers
│   │   ├── views.py                 # Real DB cursor health check (SELECT 1)
│   │   ├── urls.py
│   │   └── tests.py                 # Automated unit tests
│   ├── manage.py                    # Django management script
│   ├── requirements.txt             # Python dependencies (psycopg 3, DRF, etc.)
│   ├── .env.example                 # Environment configuration template
│   └── Dockerfile                   # Python 3.10 container specification
│
├── src/                             # React + TypeScript Web Portal
│   ├── components/                  # HealthChecker, ArchitectureView, Schema, SetupGuide, Roadmap
│   ├── services/                    # Centralized API service layer
│   ├── types/                       # TypeScript interfaces
│   ├── App.tsx                      # Root application component
│   └── main.tsx                     # Entry point
│
├── docker-compose.yml               # Multi-container orchestration (DB, Redis, API, Celery)
├── ARCHITECTURE.md                  # Comprehensive system blueprint & Mermaid diagrams
├── SETUP_GUIDE.md                   # Windows, Linux, and Docker execution instructions
└── README.md
```

---

## 3. Quick Start via Docker Compose

```bash
# 1. Start all services (PostgreSQL 16, Redis 7, Django API, Celery worker)
docker compose up --build -d

# 2. View Django backend logs
docker compose logs -f backend

# 3. Test Health API
curl http://localhost:8000/api/v1/health/
```

---

## 4. Native Windows Setup (PowerShell / Command Prompt)

### 1. Database Creation in PostgreSQL:
```sql
CREATE DATABASE community_emergency_db;
CREATE USER emergency_admin WITH PASSWORD 'emergency_secure_password_2026';
GRANT ALL PRIVILEGES ON DATABASE community_emergency_db TO emergency_admin;
ALTER DATABASE community_emergency_db OWNER TO emergency_admin;
```

### 2. Python Virtual Environment:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

### 3. Run Migrations & Start Server:
```powershell
python manage.py makemigrations
python manage.py migrate
python manage.py test core
python manage.py runserver 127.0.0.1:8000
```

---

## 5. API Documentation

Once the backend is running:
- **Interactive Swagger UI:** `http://localhost:8000/api/docs/`
- **ReDoc UI:** `http://localhost:8000/api/redoc/`
- **Health Check Endpoint:** `http://localhost:8000/api/v1/health/`
