# Community Emergency Response Platform — Setup & Verification Guide

This guide details how to install, configure, migrate, and verify the Django REST Framework backend with PostgreSQL on **Windows**, **Linux**, **macOS**, and via **Docker Compose**.

---

## Part 1: Automated Docker Setup (Fastest & Cross-Platform)

If you have Docker Desktop installed (Windows or Mac or Linux):

```bash
# 1. Start all services (PostgreSQL 16, Redis 7, Django API, Celery Worker)
docker compose up --build -d

# 2. Check container logs
docker compose logs -f backend

# 3. Verify health-check endpoint
curl http://localhost:8000/api/v1/health/
```

The database container `emergency_postgres` will automatically initialize `community_emergency_db` and verify readiness before starting Django.

---

## Part 2: Windows Native Setup (PowerShell / Command Prompt)

### Prerequisites:
1. **Python 3.10+**: Download from [python.org](https://www.python.org/downloads/) (Ensure *"Add Python to PATH"* is checked during installation).
2. **PostgreSQL 16**: Download installer from [postgresql.org](https://www.postgresql.org/download/windows/). Note the superuser password configured during install.
3. **Git**: Installed and available in PATH.

---

### Step 1: PostgreSQL Database Creation

Open **SQL Shell (psql)** or run PowerShell:

```powershell
# Open psql as postgres admin:
psql -U postgres

# In psql prompt, run:
CREATE DATABASE community_emergency_db;
CREATE USER emergency_admin WITH PASSWORD 'emergency_secure_password_2026';
GRANT ALL PRIVILEGES ON DATABASE community_emergency_db TO emergency_admin;
ALTER DATABASE community_emergency_db OWNER TO emergency_admin;
\q
```

---

### Step 2: Set Up Python Virtual Environment

In Windows PowerShell:

```powershell
# Navigate to project backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# In PowerShell:
.\venv\Scripts\Activate.ps1
# (Or in standard Command Prompt cmd.exe):
# venv\Scripts\activate.bat

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 3: Configure Environment Variables

Create `.env` file in the `backend/` folder:

```powershell
Copy-Item .env.example .env
```

Verify the `.env` settings match your local PostgreSQL credentials:
```env
DEBUG=True
SECRET_KEY=django-insecure-dev-key-change-in-production!
DB_ENGINE=django.db.backends.postgresql
DB_NAME=community_emergency_db
DB_USER=emergency_admin
DB_PASSWORD=emergency_secure_password_2026
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

### Step 4: Run Database Migrations & Initial Setup

```powershell
# Run database migrations
python manage.py makemigrations
python manage.py migrate

# Create an administrator superuser
python manage.py createsuperuser

# Run automated tests
python manage.py test core
```

---

### Step 5: Start the Django REST Framework API

```powershell
python manage.py runserver 127.0.0.1:8000
```

---

## Part 3: Verification of Phase 1

### 1. Test the Health-Check API via Browser or cURL:
Visit: `http://localhost:8000/api/v1/health/`

Expected JSON response:
```json
{
  "status": "healthy",
  "platform": "Community Emergency Response Platform",
  "version": "1.0.0",
  "timestamp": "2026-10-13T06:50:00.000000Z",
  "environment": "development",
  "database": {
    "status": "connected",
    "vendor": "postgresql",
    "database_name": "community_emergency_db",
    "latency_ms": 2.45,
    "server_version": "16.2",
    "error": null
  },
  "services": {
    "rest_framework": "active",
    "celery_broker": "configured",
    "notification_dispatcher": "ready",
    "escalation_scheduler": "ready"
  }
}
```

### 2. View Interactive Swagger API Documentation:
Visit: `http://localhost:8000/api/docs/`

---

## Part 4: Frontend Web Portal Execution

In a separate terminal window:

```bash
# In the project root:
npm install
npm run dev
```

The portal runs on `http://localhost:3000` and allows live monitoring and probing of the Django backend.
