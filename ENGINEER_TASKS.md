# REDP — Engineer Task Assignments (Laravel, React, Flutter, MySQL)

> **تقسيم المهام البرمجية المستقلة بالتفصيل**
> Based on Blueprint Section DD — Decoupled Development Task Division
> Mapped to the new stack: Laravel backend, MySQL database, React web, and Flutter app.

---

## 🟠 Engineer 1: Ragab — محرك المبيعات والتسويق وجلب العملاء (Acquisition & Sales Engine)

### الهدف الأساسي
جذب العملاء المهتمين والسماسرة الجدد وتسجيل بياناتهم والتحقق من هوياتهم بشكل آلي وتوجيههم لخط سير المبيعات، ومراقبة أداء المكالمات والحملات.

### Database Tables (MySQL)
`leads`, `interactions`, `call_logs`, `campaigns`, `brokers`, `commissions`

### Backend Directory (Laravel)
- **Controllers:** `app/Http/Controllers/Acquisition/`
  - `LeadController.php` (H.1 KYC, H.9 CRM Pipeline, H.11 Webhooks)
  - `BrokerController.php` (H.6 Broker portal & commission tracking)
  - `CampaignController.php` (H.11 Marketing tracking)
  - `CallController.php` (H.10 VoIP audio stream, S3 MP3 logs)
- **Migrations:** `database/migrations/`
  - `create_leads_table.php`
  - `create_brokers_table.php`
  - `create_commissions_table.php`
  - `create_campaigns_table.php`
  - `create_interactions_table.php`
  - `create_call_logs_table.php`

### Web App Directory (React)
- **Pages:** `web/src/pages/acquisition/`
  - `leads.tsx` (KYC upload, OCR review dashboard)
  - `crm.tsx` (Kanban Board for the 7 Sales pipeline stages)
  - `brokers.tsx` (Broker registration, lead lock anti-poaching list)
  - `campaigns.tsx` (UTM campaigns metrics & dynamic CAC calculation)

### Mobile App Directory (Flutter)
- **Screens:** `mobile/lib/features/acquisition/`
  - `broker_dashboard.dart` (Client manager, QR broker invite, commission tracker)

### Events Emitted (Laravel native Events)
- `App\Events\Acquisition\LeadCreated` — When a new lead is captured
- `App\Events\Acquisition\ReservationConfirmed` — When EOI payment succeeds & unit is locked
- `App\Events\Acquisition\BrokerRegistered` — When a new broker completes registration

### Events Consumed (Laravel Listeners)
- `App\Events\Finance\PaymentReceived` — Update broker commission statuses
- `App\Events\Finance\ContractSigned` — Automatically advance deal stage to "Closed-Won" in CRM pipeline

---

## 🔵 Engineer 2: Melwany — محرك المعاملات المالية، الجداول والتعاقدات (Financial Engine)

### الهدف الأساسي
معالجة المعاملات المالية بشكل فائق السرعة، ومراقبة المخزون الفعلي، وصياغة العقود وتعديل خطط السداد وإلغائها تلقائياً دون أي تداخل مع أنظمة الدعاية والتسليم.

### Database Tables (MySQL)
`units`, `projects`, `reservations`, `contracts`, `payment_plans`, `payments`, `collections_queue`, `cancellations`

### Backend Directory (Laravel)
- **Controllers:** `app/Http/Controllers/Finance/`
  - `InventoryController.php` (H.5 Unit inventory with database level locks)
  - `PaymentController.php` (H.3 Payment gateway hooks, Stripe/Fawry callbacks, ERP logging)
  - `ContractController.php` (N+O Contract generation, PDF rendering)
  - `CollectionController.php` (H.13 Rescheduling scheduler, H.14 Aging debts, H.15 Cancellation processor)
- **Migrations:** `database/migrations/`
  - `create_projects_table.php`
  - `create_units_table.php`
  - `create_reservations_table.php`
  - `create_contracts_table.php`
  - `create_payment_plans_table.php`
  - `create_payments_table.php`
  - `create_collections_queue_table.php`
  - `create_cancellations_table.php`

### Web App Directory (React)
- **Pages:** `web/src/pages/finance/`
  - `inventory.tsx` (Interactive units catalog with grid viewer)
  - `contracts.tsx` (Contract management, PDF renderer, signature logs)
  - `payments.tsx` (Stripe payments configuration, billing reports)
  - `collections.tsx` (Collections queue dashboard, promise-to-pay tracker)

### Mobile App Directory (Flutter)
- **Screens:** `mobile/lib/features/finance/`
  - `client_payments.dart` (Installment ledger tracker, direct Stripe/Fawry payment gateway)

### Events Emitted (Laravel native Events)
- `App\Events\Finance\PaymentReceived` — When an installment or booking fee is successfully processed
- `App\Events\Finance\ContractSigned` — When a contract has been signed by both parties
- `App\Events\Finance\UnitStatusChanged` — Emitted during inventory locks or releases
- `App\Events\Finance\CancellationProcessed` — Fired when cancellation audit settles

### Events Consumed (Laravel Listeners)
- `App\Events\Acquisition\ReservationConfirmed` — Capture transaction and generate initial `contracts` + `payment_plans`
- `App\Events\Delivery\HandoverCompleted` — Trigger final financial settlement check

---

## 🟢 Engineer 3: Mahmoud — خدمات ما بعد البيع والتسليم والبنية التحتية للمنصة (Delivery & Platform)

### الهدف الأساسي
تسليم الوحدات المباعة، وتوفير تجربة تشغيل مثالية للملاك، وتنسيق أعمال المقاولين، وتطوير الأدوات البرمجية الذكية لخدمة الإدارة العليا وصناع القرار.

### Database Tables (MySQL)
`users`, `defects_snags`, `warranties`, `vendors`, `workflow_templates`, `documents`, `maintenance_tickets`, `appointments`, `notifications`, `audit_logs`

### Backend Directory (Laravel)
- **Controllers:** `app/Http/Controllers/Delivery/`
  - `ClientPortalController.php` (H.2/H.8 Owner dashboard, compound QR visitor codes)
  - `HandoverController.php` (H.17 Snagging & QC inspector)
  - `VendorController.php` (H.16 Contractor assignments & SLA tracker)
  - `AutomationController.php` (H.19 Drag-and-drop workflow visual rules compiler)
  - `DocumentController.php` (H.20 Smart DMS index with full-text search)
  - `AnalyticsController.php` (H.21 Executive BI Cash flow prediction)
- **Migrations:** `database/migrations/`
  - `create_users_table.php`
  - `create_defects_snags_table.php`
  - `create_warranties_table.php`
  - `create_vendors_table.php`
  - `create_workflow_templates_table.php`
  - `create_documents_table.php`
  - `create_maintenance_tickets_table.php`
  - `create_appointments_table.php`
  - `create_notifications_table.php`
  - `create_audit_logs_table.php`

### Web App Directory (React)
- **Pages:** `web/src/pages/delivery/`
  - `dashboard.tsx` (Smart dashboard tracking contractor SLA performance, snags, and document expiration counts)
  - `maintenance.tsx` (Interactive tickets queue, dispatcher, SLA SLA countdowns)
  - `handover.tsx` (Interactive inspection checklists, PDF sign-offs)
  - `documents.tsx` (DMS folder-tree search vault with full text searching)
  - `analytics.tsx` (BI visualizer showing predictive cash flow)

### Mobile App Directory (Flutter)
- **Screens:** `mobile/lib/features/delivery/`
  - `snagging_app.dart` (Inspector app: photograph defects, pin to blueprints, log severity)
  - `homeowner_app.dart` (Maintenance requests, compound gate QR codes)

### Events Emitted (Laravel native Events)
- `App\Events\Delivery\HandoverCompleted` — Fired when handover quality check passes
- `App\Events\Delivery\MaintenanceCreated` — When a customer files a ticket
- `App\Events\Delivery\NotificationSent` — Dispatched through push notifications/SMS

### Events Consumed (Laravel Listeners)
- `App\Events\Acquisition\ReservationConfirmed` — Schedule initial handover check appointment
- `App\Events\Finance\ContractSigned` — Generate physical handover planning timeline
- `App\Events\Finance\PaymentReceived` — Trigger automated confirmation SMS/Email/WhatsApp alerts
- `App\Events\Finance\CancellationProcessed` — Automatically terminate any pending tickets for the cancelled contract

---

## 🔄 Decoupled Communication Design (Event-Driven Flow)

No engineer should ever call another engineer's database models or write database queries on another's tables directly.
Communication happens purely via Laravel **Events** and **Listeners** using PHP interfaces.

```
Acquisition (Ragab)             Finance (Melwany)               Delivery (Mahmoud)
        │                               │                               │
        │ ReservationConfirmed (Event)  │                               │
        │──────────────────────────────>│                               │
        │                               │ (Listener creates contract    │
        │                               │  and payment plan entries)    │
        │                               │                               │
        │ ReservationConfirmed (Event)  │                               │
        │───────────────────────────────┼──────────────────────────────>│
        │                               │                               │ (Listener schedules
        │                               │                               │  handover inspect)
        │                               │                               │
        │                               │ ContractSigned (Event)        │
        │<──────────────────────────────│                               │
        │ (Listener closes CRM stage)   │                               │
        │                               │ ContractSigned (Event)        │
        │                               │──────────────────────────────>│
        │                               │                               │ (Listener schedules
        │                               │                               │  delivery checklist)
        │                               │                               │
        │                               │                               │ HandoverCompleted (Event)
        │                               │<──────────────────────────────│
        │                               │ (Listener triggers final      │
        │                               │  financial checks)            │
```

---

## 📋 Running the Project Locally (Setup Instructions)

### Prerequisites
1. **PHP 8.2+** and **Composer** (https://getcomposer.org)
2. **Node.js** and **NPM** (https://nodejs.org)
3. **Flutter SDK** (https://flutter.dev)
4. **MySQL Database Server** (Can be run locally or via the provided `docker-compose.yml`)

### Step-by-Step Setup

#### 1. Database & Services Setup
Ensure your local MySQL database is running on port `3306` and Redis is running on port `6379`.
Alternatively, you can start backing services via Docker from the root directory:
```bash
docker-compose up -d
```

#### 2. Backend (Laravel) Setup
Navigate to the backend folder, install dependencies, configure environment, and run migrations:
```bash
cd backend
composer install
cp .env.example .env
# Edit your database credentials inside .env (DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD)
php artisan key:generate
php artisan migrate
php artisan db:seed # If optional seeders are set up
php artisan serve --port=8000
```

#### 3. Web Frontend (React Vite) Setup
Navigate to the web folder, install dependencies, and run in dev mode:
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

#### 4. Mobile (Flutter) Setup
Ensure Flutter is set up correctly, then run:
```bash
cd mobile
flutter pub get
flutter run
```
