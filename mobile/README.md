# REDP Mobile App Scaffold

This is the mobile app scaffolding for the **Real Estate Digital Platform (REDP)**, built using **Flutter**.

---

## 🏗️ Directory Boundaries (Section DD)
Each engineer has a designated screen directory structure within the app:
- 🟠 **Acquisition (Ragab):** Screens inside `lib/features/acquisition/` (Simulated in Tab 1)
- 🔵 **Finance (Melwany):** Screens inside `lib/features/finance/` (Simulated in Tab 2)
- 🟢 **Delivery & Operations (Mahmoud):** Screens inside `lib/features/delivery/` (Simulated in Tab 3 - Maintained as clean canvas skeleton)

---

## 🚀 Running Locally

### 1. Prerequisites
- **Flutter SDK** installed (v3.0.0 or higher) (https://flutter.dev/docs/get-started/install)
- **Dart SDK** (included with Flutter)
- A connected **Android Emulator**, **iOS Simulator**, or **Physical Device** with Developer Options enabled.

### 2. Fetch Dependencies
Navigate to the mobile directory and fetch all required pub packages (`dio`, `provider`, `shared_preferences`):
```bash
flutter pub get
```

### 3. Run the App
Launch the compiler and execute on your connected device:
```bash
flutter run
```

---

## 📁 Key Features Scaffolded
1. **Onboarding Profile Selector:** Quickly sign in as Admin, Sales Agent, Finance Officer, or Delivery Engineer to test role access policies.
2. **REST API Client Stub:** Connects with the Laravel API.
3. **Decoupled Main Tabs:** Clean segregation of features so developers do not conflict with each other.
