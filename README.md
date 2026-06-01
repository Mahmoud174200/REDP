# REDP — Real Estate Digital Platform

<div align="center">

**منصة رقمية متكاملة لإدارة العقارات**

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white)](https://laravel.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Flutter](https://img.shields.io/badge/Flutter-3-02569B?logo=flutter&logoColor=white)](https://flutter.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)

</div>

---

## 📋 Overview

REDP is a comprehensive real estate digital platform designed for Egyptian real estate developers. It covers the full lifecycle from lead acquisition → unit reservation → contract signing → payment processing → unit handover → post-delivery maintenance.

### Key Features
- 🔐 **User Registration & KYC** — Biometric verification, OCR document scanning
- 🏗️ **Unit Inventory Management** — Real-time availability, dynamic pricing engine
- 💰 **Payment Processing** — Installments, EOI, reservation deposits, payment gateway
- 📊 **CRM & Sales Pipeline** — Lead management, broker portal, commission tracking
- 📱 **Mobile Apps** — Client app + Broker/Staff app (Flutter)
- 📄 **Contract Management** — AI-powered data extraction, version control
- 🔧 **Maintenance & Handover** — Snag inspection, warranty tracking, vendor management
- 📈 **Executive BI Dashboard** — Revenue forecasting, cash flow, sales velocity
- 🤖 **AI Features** — Chatbot, lead scoring, fraud detection, pricing suggestions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                           │
│   Web (React SPA) │ Mobile (Flutter) │ Admin        │
└────────┬──────────┴─────────┬─────────┴─────┬───────┘
         │                    │               │
         ▼                    ▼               ▼
┌─────────────────────────────────────────────────────┐
│              LARAVEL BACKEND (PHP 8.2+)             │
│   Sanctum Auth │ RBAC │ Rate Limit │ Validation      │
└────────┬────────────────────────────────────────────┘
         │
    ┌────┴────────────────────────────────────┐
    │       LARAVEL EVENT BUS (Decoupled)     │
    └────┬──────────┬──────────────┬──────────┘
         │          │              │
    ┌────▼───┐ ┌────▼────┐  ┌─────▼──────┐
    │ Acqui- │ │ Finance │  │ Delivery & │
    │ sition │ │ Engine  │  │ Infra      │
    │(Ragab) │ │(Melwany)│  │ (Mahmoud)  │
    └────┬───┘ └────┬────┘  └─────┬──────┘
         │          │              │
         ▼          ▼              ▼
    ┌─────────────────────────────────────┐
    │          MySQL + Redis              │
    └─────────────────────────────────────┘
```

### Core Decoupling Protocol
Engineers communicate via **events**, not direct code/model dependencies:
- `LeadCreated` (Acquisition) → Triggers workflow templates
- `ReservationConfirmed` (Acquisition) → Finance creates contract & payment plans; Delivery prepares inspection
- `PaymentReceived` (Finance) → Acquisition updates broker commission status
- `ContractSigned` (Finance) → Delivery schedules physical handover planning timeline
- `HandoverCompleted` (Delivery) → Finance triggers final accounting audit

---

## 👥 Team — Development Task Division

| Engineer | Domain | Modules |
|----------|--------|---------|
| 🟠 **Ragab** | Acquisition & Sales | KYC, Reservations, Brokers, CRM, VoIP, Marketing, Sales Dashboard |
| 🔵 **Melwany** | Contracts & Finance | Payments, Inventory, Dynamic Pricing, Installments, Collections, Cancellations |
| 🟢 **Mahmoud** | Delivery & Infrastructure | Client Portal, Maintenance, Vendors, Handover, Warranty, Workflows, DMS, BI, Notifications |

> See [ENGINEER_TASKS.md](./ENGINEER_TASKS.md) for detailed per-engineer breakdown.

---

## 🚀 Local Development Setup

### Prerequisites
- **PHP 8.2+** and **Composer** (https://getcomposer.org)
- **Node.js** and **NPM** (https://nodejs.org)
- **Flutter SDK** (https://flutter.dev)
- **MySQL Database Server** (https://mysql.com)

### 1. Database & Services Setup
Ensure your local MySQL database server is running on port `3306`. Create a database named `redp_db`.
If you want to run MySQL & Redis via Docker, run:
```bash
docker-compose up -d
```

### 2. Backend (Laravel) Setup
Navigate to the backend directory, install packages, set up configurations, and run migrations:
```bash
cd backend
composer install
cp .env.example .env
# Edit DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD in .env if needed.
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --port=8000
```
API server runs at `http://localhost:8000`.

### 3. Web Frontend (React Vite SPA) Setup
Navigate to the web directory, install npm packages, and start Vite dev server:
```bash
cd web
npm install
npm run dev
```
Web client runs at `http://localhost:5173`.

### 4. Mobile (Flutter) Setup
Ensure your Flutter environment is set up properly, and run:
```bash
cd mobile
flutter pub get
flutter run
```

---

## 📁 Project Directory Layout

```
REDP/
├── backend/               # Laravel PHP App
│   ├── app/
│   │   ├── Models/        # Shared Eloquent DB Models
│   │   ├── Events/        # Native Decoupling Events
│   │   ├── Services/      # Notification, Audit log services
│   │   └── Http/          # Controllers & Middleware (Sanctum/RBAC)
│   ├── database/
│   │   └── migrations/    # MySQL Migrations (25 tables)
│   └── routes/            # Routes (api.php, web.php)
│
├── web/                   # React Vite SPA Web App
│   ├── src/
│   │   ├── components/    # Glassmorphic UI Library
│   │   ├── pages/         # Page components (split by engineer)
│   │   ├── services/      # Axios API Integrations
│   │   └── hooks/         # Shared state & auth hooks
│   └── index.html
│
└── mobile/                # Flutter Mobile App Scaffold
    ├── lib/
    │   ├── core/          # Dio networking client & secure storage
    │   └── features/      # Mobile layouts (Auth, CRM, Payments, Snagging)
```

---

## 📄 License

Confidential — REDP v1.0 — Approved for Execution 2026
