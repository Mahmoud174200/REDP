import 'package:flutter/material.dart';

void main() {
  runApp(const REDPMobileApp());
}

class REDPMobileApp extends StatelessWidget {
  const REDPMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'REDP Mobile Portal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        primaryColor: const Color(0xFF3B82F6),
        scaffoldBackgroundColor: const Color(0xFF0B0F19),
        cardColor: const Color(0xFF131A2E),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF3B82F6),
          secondary: Color(0xFFA855F7),
          surface: Color(0xFF131A2E),
        ),
      ),
      home: const OnboardingScreen(),
    );
  }
}

// ───────────────────────────────────────────────────
// Onboarding & Login Screen (Simulated Sandbox)
// ───────────────────────────────────────────────────
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  String selectedRole = 'admin';

  final List<Map<String, String>> roles = [
    {'key': 'admin', 'name': '👑 Platform Administrator'},
    {'key': 'sales_agent', 'name': '🟠 Ragab (Sales Agent)'},
    {'key': 'finance_officer', 'name': '🔵 Melwany (Finance)'},
    {'key': 'client', 'name': '🐳 Compound Client'},
    {'key': 'delivery_engineer', 'name': '🟢 Mahmoud (Delivery)'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [Color(0x22A855F7), Color(0xFF0B0F19)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Spacer(),
                // App Logo
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF3B82F6), Color(0xFFA855F7)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF3B82F6).withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        )
                      ],
                    ),
                    child: const Icon(Icons.business, size: 48, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'REDP Mobile',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Outfit',
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Real Estate Digital Platform Blueprint',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                ),
                const Spacer(),
                // Simulated Role Selector
                const Text(
                  'Select simulated profile to sign in:',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF131A2E),
                    border: Border.all(color: Colors.white.withOpacity(0.07)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: selectedRole,
                      isExpanded: true,
                      dropdownColor: const Color(0xFF131A2E),
                      items: roles.map((role) {
                        return DropdownMenuItem<String>(
                          value: role['key'],
                          child: Text(role['name']!),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            selectedRole = val;
                          });
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => MainDashboard(role: selectedRole),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    backgroundColor: const Color(0xFF3B82F6),
                  ),
                  child: const Text(
                    'Access Mobile Portal',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ───────────────────────────────────────────────────
// Main Mobile Dashboard shell (Tabs matching boundary)
// ───────────────────────────────────────────────────
class MainDashboard extends StatefulWidget {
  final String role;
  const MainDashboard({super.key, required this.role});

  @override
  State<MainDashboard> createState() => _MainDashboardState();
}

class _MainDashboardState extends State<MainDashboard> {
  int currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final List<Widget> tabs = [
      AcquisitionTab(role: widget.role),
      FinanceTab(role: widget.role),
      DeliveryTab(role: widget.role),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('REDP Sandbox Console'),
        backgroundColor: const Color(0xFF131A2E),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const OnboardingScreen()),
              );
            },
          )
        ],
      ),
      body: tabs[currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        backgroundColor: const Color(0xFF131A2E),
        selectedItemColor: const Color(0xFF3B82F6),
        unselectedItemColor: Colors.grey,
        onTap: (index) {
          setState(() {
            currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.people),
            label: 'Sales 🟠',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet),
            label: 'Finance 🔵',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Delivery 🟢',
          ),
        ],
      ),
    );
  }
}

// 🟠 Acquisition Tab UI Stub (Ragab)
class AcquisitionTab extends StatelessWidget {
  final String role;
  const AcquisitionTab({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '🟠 Lead & Broker Dashboard',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text('Lead Lock Referral register and EOI status check.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          Card(
            color: const Color(0xFF131A2E),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.white.withOpacity(0.07)),
            ),
            child: const Padding(
              padding: EdgeInsets.all(20.0),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Broker Lock referrals:', style: TextStyle(fontWeight: FontWeight.bold)),
                      Chip(label: Text('ACTIVE'), backgroundColor: Color(0x3310B981)),
                    ],
                  ),
                  Divider(height: 30, color: Colors.white12),
                  ListTile(
                    leading: Icon(Icons.person, color: Colors.orange),
                    title: Text('Mohamed El-Sayed'),
                    subtitle: Text('Lock expires in 45 days'),
                    trailing: Text('Broker A'),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}

// 🔵 Finance Tab UI Stub (Melwany)
class FinanceTab extends StatelessWidget {
  final String role;
  const FinanceTab({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '🔵 Finance & Installments Ledger',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text('Installments ledgers and direct checkout gateways.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          Card(
            color: const Color(0xFF131A2E),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.white.withOpacity(0.07)),
            ),
            child: const Padding(
              padding: EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Balance Ledger summary:', style: TextStyle(fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('2,450,000 EGP', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF3B82F6))),
                  Divider(height: 30, color: Colors.white12),
                  ListTile(
                    leading: Icon(Icons.credit_card, color: Colors.blue),
                    title: Text('Q3 Installment'),
                    subtitle: Text('Due on 2026-07-01'),
                    trailing: Text('12,000 EGP', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}

// 🟢 Delivery Tab UI Stub (Mahmoud)
class DeliveryTab extends StatelessWidget {
  final String role;
  const DeliveryTab({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '🟢 Delivery & Operations Portal',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text('Compound entrance gate QR codes and warranty snag logs.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          Card(
            color: const Color(0xFF131A2E),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: Colors.green, width: 1.5),
            ),
            child: const Padding(
              padding: EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.terminal, color: Colors.green),
                      SizedBox(width: 8),
                      Text(
                        'مرحباً مهندس محمود! الهيكل مهيأ لك',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green),
                      ),
                    ],
                  ),
                  SizedBox(height: 16),
                  Text(
                    'بناءً على طلبك، قمنا بتهيئة شاشة العمليات الخاصة بك كـ Stub نظيف وجاهز للبرمجة محلياً.',
                    style: TextStyle(height: 1.5),
                  ),
                  SizedBox(height: 12),
                  Text(
                    '✓ نماذج (Models) ومسارات (Routes) وجداول (Migrations) الصيانة والاستلام والفحص تم إعدادها بالكامل في الـ Laravel Backend.',
                    style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.4),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
