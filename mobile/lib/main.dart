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
class DeliveryTab extends StatefulWidget {
  final String role;
  const DeliveryTab({super.key, required this.role});

  @override
  State<DeliveryTab> createState() => _DeliveryTabState();
}

class _DeliveryTabState extends State<DeliveryTab> {
  // Homeowner states
  final List<Map<String, String>> _myTickets = [
    {'title': 'AC unit not cooling in guest room', 'cat': 'HVAC', 'status': 'open'},
    {'title': 'Kitchen exhaust fan wiring issue', 'cat': 'Electrical', 'status': 'resolved'}
  ];

  final TextEditingController _ticketTitleController = TextEditingController();
  String _selectedCategory = 'Plumbing';
  String _selectedPriority = 'medium';

  // Visitor Gate pass states
  String? _guestPassQr;
  String? _guestPassName;

  // Inspector QC states
  final List<Map<String, dynamic>> _qcItems = [
    {'id': 'walls', 'item': 'Wall painting & plaster', 'passed': true},
    {'id': 'plumb', 'item': 'Plumbing drains & flows', 'passed': true},
    {'id': 'elect', 'item': 'Electric socket wiring', 'passed': false},
  ];

  final List<Map<String, String>> _loggedSnags = [];
  final TextEditingController _snagDescController = TextEditingController();
  String _snagSeverity = 'medium';
  String _snagCat = 'walls';

  void _addTicket() {
    if (_ticketTitleController.text.isEmpty) return;
    setState(() {
      _myTickets.insert(0, {
        'title': _ticketTitleController.text,
        'cat': _selectedCategory,
        'status': 'open'
      });
      _ticketTitleController.clear();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('✓ Maintenance ticket filed and dispatched!')),
    );
  }

  void _generateQr() {
    setState(() {
      _guestPassName = 'Sherif Kamel';
      _guestPassQr = 'SECURE_GATE_PASS_QR_KEY_29402';
    });
  }

  void _submitSnag() {
    if (_snagDescController.text.isEmpty) return;
    setState(() {
      _loggedSnags.insert(0, {
        'cat': _snagCat == 'walls' ? 'Painting' : _snagCat == 'plumb' ? 'Plumbing' : 'Electrical',
        'desc': _snagDescController.text,
        'sev': _snagSeverity
      });
      // Toggle checklist item status to failed
      for (var item in _qcItems) {
        if (item['id'] == _snagCat) {
          item['passed'] = false;
        }
      }
      _snagDescController.clear();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('✓ Snag defect registered in QC catalog.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    bool isClient = widget.role == 'client' || widget.role == 'admin';
    bool isInspector = widget.role == 'delivery_engineer' || widget.role == 'admin';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '🟢 Delivery & Operations Portal',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
          ),
          const SizedBox(height: 6),
          const Text(
            'Compound guest passes, QC quality checklists, and repair dispatches.',
            style: TextStyle(color: Colors.grey, fontSize: 13),
          ),
          const SizedBox(height: 24),

          // 🐳 Homeowner / Client Panel
          if (isClient) ...[
            const Text('Homeowner Guest QR Generator (H.8)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.green)),
            const SizedBox(height: 12),
            Card(
              color: const Color(0xFF131A2E),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.white.withOpacity(0.07))),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Request high-speed guest entrance gate pass code:'),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: _generateQr,
                      icon: const Icon(Icons.qr_code),
                      label: const Text('Generate Guest Gate pass'),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                    ),
                    if (_guestPassQr != null) ...[
                      const SizedBox(height: 16),
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          color: Colors.white,
                          child: const Icon(Icons.qr_code_scanner, size: 100, color: Colors.black),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text('Pass for: $_guestPassName', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
                    ]
                  ],
                ),
              ),
            ),
            const SizedBox(height: 30),

            const Text('Submit Maintenance Ticket (H.8)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.green)),
            const SizedBox(height: 12),
            Card(
              color: const Color(0xFF131A2E),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.white.withOpacity(0.07))),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: _ticketTitleController,
                      decoration: const InputDecoration(labelText: 'Repair Title (e.g. Broken faucet)', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _selectedCategory,
                      decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
                      items: ['Plumbing', 'Electrical', 'HVAC', 'Landscape'].map((c) {
                        return DropdownMenuItem(value: c, child: Text(c));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedCategory = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _addTicket,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6)),
                      child: const Text('File Ticket'),
                    ),
                    const SizedBox(height: 20),
                    const Text('My Active Tickets:', style: TextStyle(fontWeight: FontWeight.bold)),
                    ..._myTickets.map((t) => ListTile(
                      leading: const Icon(Icons.build_circle, color: Colors.green),
                      title: Text(t['title']!),
                      subtitle: Text('Category: ${t['cat']}'),
                      trailing: Chip(
                        label: Text(t['status']!.toUpperCase()),
                        backgroundColor: t['status'] == 'open' ? Colors.orange.withOpacity(0.2) : Colors.green.withOpacity(0.2),
                      ),
                    )),
                  ],
                ),
              ),
            ),
          ],

          // 🟢 Staff / Quality Inspector Panel
          if (isInspector) ...[
            if (isClient) const SizedBox(height: 40),
            const Text('QC Handover checklist (H.17)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.green)),
            const SizedBox(height: 12),
            Card(
              color: const Color(0xFF131A2E),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.white.withOpacity(0.07))),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('QC Quality checkssheets for Unit A-101:', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    ..._qcItems.map((item) => CheckboxListTile(
                      title: Text(item['item']),
                      value: item['passed'],
                      activeColor: Colors.green,
                      onChanged: (val) {
                        setState(() {
                          item['passed'] = val;
                        });
                      },
                    )),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 30),

            const Text('Log Inspection Snag / Defect', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.green)),
            const SizedBox(height: 12),
            Card(
              color: const Color(0xFF131A2E),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.white.withOpacity(0.07))),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    DropdownButtonFormField<String>(
                      value: _snagCat,
                      decoration: const InputDecoration(labelText: 'Snag Category', border: OutlineInputBorder()),
                      items: [
                        DropdownMenuItem(value: 'walls', child: const Text('Painting & Plaster')),
                        DropdownMenuItem(value: 'plumb', child: const Text('Plumbing')),
                        DropdownMenuItem(value: 'elect', child: const Text('Electrical sockets')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _snagCat = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _snagDescController,
                      maxLines: 2,
                      decoration: const InputDecoration(labelText: 'Defect description (e.g. wall crack)', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _snagSeverity,
                      decoration: const InputDecoration(labelText: 'Severity', border: OutlineInputBorder()),
                      items: ['low', 'medium', 'high', 'critical'].map((s) {
                        return DropdownMenuItem(value: s, child: Text(s.toUpperCase()));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _snagSeverity = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _submitSnag,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
                      child: const Text('Log Snag'),
                    ),
                    if (_loggedSnags.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      const Text('Logged Snags:', style: TextStyle(fontWeight: FontWeight.bold)),
                      ..._loggedSnags.map((s) => ListTile(
                        leading: const Icon(Icons.warning_amber_rounded, color: Colors.red),
                        title: Text(s['desc']!),
                        subtitle: Text('Category: ${s['cat']}'),
                        trailing: Chip(
                          label: Text(s['sev']!.toUpperCase()),
                          backgroundColor: Colors.red.withOpacity(0.2),
                        ),
                      )),
                    ]
                  ],
                ),
              ),
            ),
          ]
        ],
      ),
    );
  }
}
