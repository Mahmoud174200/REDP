# REDP Homeowner Mobile App (Flutter)

Native mobile app for **homeowners** to log in and view their unit(s), installment
schedule, payment progress, and notifications — backed by the same Laravel API as
the web portal.

---

## 📱 What it does
- **Login** with email + password (homeowner/`client` accounts only).
- **Dashboard**: unit details, repayment progress bar, paid vs remaining, next
  installment due, full payment schedule, and notifications.
- **Multi-unit switcher**: one login can own several units — switch between them
  from the header dropdown (powered by `?contract_id=` on the dashboard endpoint).
- Session persists via `shared_preferences` (stays logged in until logout).

## 🗂 Structure
```
lib/
  core/api_client.dart                     # dio client + token storage
  features/homeowner/
    homeowner_repository.dart              # /auth/login + /delivery/homeowner/dashboard
    login_screen.dart                      # email/password sign-in
    dashboard_screen.dart                  # unit + financials + schedule + switcher
  main.dart                                # auth gate → login or dashboard
```

## 🚀 Run
1. Install the **Flutter SDK** (v3.0.0+).
2. Start the backend: in `../backend` run `php artisan serve` (listens on `:8000`).
3. From this folder:
   ```bash
   flutter pub get
   flutter run
   ```

### API base URL
`lib/core/api_client.dart` → `baseUrl`:
- **Android emulator**: `http://10.0.2.2:8000/api/v1` (default — maps to host localhost).
- **iOS simulator**: `http://127.0.0.1:8000/api/v1`.
- **Physical device**: your computer's LAN IP, e.g. `http://192.168.1.20:8000/api/v1`
  (device and computer on the same Wi-Fi).

## 🔑 Test login
Any homeowner account, e.g. `bodyelml@gmail.com` (owns multiple units → the
switcher appears).
