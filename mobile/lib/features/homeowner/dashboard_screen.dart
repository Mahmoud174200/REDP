import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../../core/branding.dart';
import 'homeowner_repository.dart';
import 'form_sheet.dart';
import 'login_screen.dart';

/// Homeowner dashboard — full parity with the web portal
/// (/delivery/overview): light glass theme, unit hero photo, and every
/// tab (Unit, Contract, Payments, Family, Vehicles, Services,
/// Notifications, Files, Guest Passes, Resale). Colors come from the
/// shared AppColors so the whole app stays unified.
class HomeownerDashboardScreen extends StatefulWidget {
  const HomeownerDashboardScreen({super.key});

  @override
  State<HomeownerDashboardScreen> createState() => _HomeownerDashboardScreenState();
}

class _HomeownerDashboardScreenState extends State<HomeownerDashboardScreen> {
  final _repo = HomeownerRepository();
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _data = {};
  String? _selectedContractId;
  int _tab = 0;
  int _payPage = 0;
  static const _payPageSize = 8;
  String _userName = 'Homeowner';
  String _userEmail = '';

  static const _tabs = <(IconData, String, String)>[
    (Icons.home_rounded, 'My Unit', ''),
    (Icons.description_rounded, 'Contract', 'العقد'),
    (Icons.credit_card_rounded, 'Payments', 'الأقساط'),
    (Icons.groups_rounded, 'Family', 'العائلة'),
    (Icons.directions_car_rounded, 'Vehicles', 'السيارات'),
    (Icons.handyman_rounded, 'Services', 'الخدمات'),
    (Icons.notifications_rounded, 'Notifications', 'الإشعارات'),
    (Icons.folder_rounded, 'Files', 'الملفات'),
    (Icons.qr_code_rounded, 'Guest Passes', 'الزوار'),
    (Icons.sync_alt_rounded, 'Resale', 'إعادة البيع'),
  ];

  @override
  void initState() {
    super.initState();
    ApiClient.instance.getUser().then((u) {
      if (mounted) setState(() { _userName = u.$1; _userEmail = u.$2; });
    });
    _load();
  }

  Future<void> _load({String? contractId}) async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _repo.dashboard(contractId: contractId);
      setState(() {
        _data = data;
        _selectedContractId = data['selected_contract_id']?.toString();
        _payPage = 0;
        _loading = false;
      });
    } catch (e) {
      setState(() { _loading = false; _error = HomeownerRepository.errorMessage(e); });
    }
  }

  Future<void> _logout() async {
    await ApiClient.instance.setToken(null);
    await ApiClient.instance.setUser(name: null);
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const HomeownerLoginScreen()), (_) => false);
  }

  // ── helpers ──
  num _num(dynamic v) => (v is num) ? v : num.tryParse('$v') ?? 0;
  String _money(dynamic v) {
    final s = _num(v).round().toString();
    final b = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
      b.write(s[i]);
    }
    return 'EGP $b';
  }
  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return 'H';
    return parts.take(2).map((p) => p[0].toUpperCase()).join();
  }
  String _date(dynamic v) => (v ?? '').toString().split('T').first.split(' ').first;

  /// Resolve a storage path to an absolute URL (host = API host minus /api/v1).
  String _url(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    final host = ApiClient.baseUrl.replaceFirst('/api/v1', '');
    return path.startsWith('/') ? '$host$path' : '$host/$path';
  }

  List get _units => (_data['units'] as List?) ?? [];
  Map? get _unit => _data['unit'] as Map?;
  Map? get _fin => _data['financial_summary'] as Map?;
  Map? get _contract => _data['contract'] as Map?;
  List get _payments => (_data['payments'] as List?) ?? [];
  List get _notifs => (_data['notifications'] as List?) ?? [];
  List get _family => (_data['family_members'] as List?) ?? [];
  List get _vehicles => (_data['vehicles'] as List?) ?? [];
  List get _services => (_data['service_requests'] as List?) ?? [];
  List get _resale => (_data['resale_requests'] as List?) ?? [];
  List get _files => (_data['files'] as List?) ?? [];

  // ══════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: _navBar(),
      drawer: _sideMenu(),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft, end: Alignment.bottomRight,
            colors: [Color(0xFFF2F6FC), AppColors.bg, Color(0xFFFAF7F2)],
          ),
        ),
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.royal))
            : _error != null
                ? _errorView()
                : Column(children: [
                    _tabBar(),
                    Expanded(
                      child: RefreshIndicator(
                        color: AppColors.royal,
                        onRefresh: () => _load(contractId: _selectedContractId),
                        child: ListView(
                          padding: const EdgeInsets.fromLTRB(14, 14, 14, 34),
                          children: _tabContent(),
                        ),
                      ),
                    ),
                  ]),
      ),
    );
  }

  List<Widget> _tabContent() {
    switch (_tab) {
      case 1: return _contractTab();
      case 2: return _paymentsTab();
      case 3: return _familyTab();
      case 4: return _vehiclesTab();
      case 5: return _servicesTab();
      case 6: return _notificationsTab();
      case 7: return _filesTab();
      case 8: return _guestTab();
      case 9: return _resaleTab();
      default: return _unitTab();
    }
  }

  // ── NAV BAR ──
  PreferredSizeWidget _navBar() {
    return AppBar(
      elevation: 0,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      titleSpacing: 12,
      iconTheme: const IconThemeData(color: AppColors.textMain),
      title: const MountainViewLogo(size: 27, showTagline: false),
      actions: [
        Stack(alignment: Alignment.center, children: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded, color: AppColors.textMuted),
            onPressed: () => setState(() => _tab = 6),
          ),
          if (_notifs.isNotEmpty)
            Positioned(
              top: 8, right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                decoration: BoxDecoration(color: AppColors.red, borderRadius: BorderRadius.circular(20)),
                child: Text(_notifs.length > 9 ? '9+' : '${_notifs.length}',
                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white)),
              ),
            ),
        ]),
        Padding(
          padding: const EdgeInsets.only(right: 12, left: 4),
          child: Builder(
            builder: (ctx) => GestureDetector(
              onTap: () => Scaffold.of(ctx).openDrawer(),
              child: CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.royal.withValues(alpha: 0.12),
                child: Text(_initials(_userName),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.royal)),
              ),
            ),
          ),
        ),
      ],
      bottom: PreferredSize(preferredSize: const Size.fromHeight(1), child: Container(height: 1, color: AppColors.borderSoft)),
    );
  }

  // ── SIDE MENU ──
  Widget _sideMenu() {
    return Drawer(
      backgroundColor: AppColors.bg,
      child: SafeArea(
        child: Column(children: [
          Container(
            width: double.infinity,
            margin: const EdgeInsets.all(14),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft, end: Alignment.bottomRight,
                colors: [AppColors.royal.withValues(alpha: 0.10), AppColors.gold.withValues(alpha: 0.10), Colors.white],
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.royal.withValues(alpha: 0.18)),
              boxShadow: [BoxShadow(color: AppColors.royal.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 6))],
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  width: 52, height: 52,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppColors.royal, AppColors.royalDark]),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  alignment: Alignment.center,
                  child: Text(_initials(_userName),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(_userName, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textMain)),
                    const SizedBox(height: 2),
                    Text(_userEmail, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  ]),
                ),
              ]),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: AppColors.green.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                child: const Text('✓ VERIFIED HOMEOWNER',
                    style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: AppColors.greenDark, letterSpacing: 0.6)),
              ),
            ]),
          ),

          if (_units.isNotEmpty) ...[
            _sectionLabel('MY PROPERTIES — وحداتي (${_units.length})'),
            ..._units.map((u) {
              final sel = u['contract_id']?.toString() == _selectedContractId;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () { Navigator.pop(context); if (!sel) _load(contractId: u['contract_id']?.toString()); },
                  child: Container(
                    padding: const EdgeInsets.all(11),
                    decoration: BoxDecoration(
                      color: sel ? AppColors.royal.withValues(alpha: 0.06) : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: sel ? AppColors.royal.withValues(alpha: 0.4) : AppColors.borderSoft),
                    ),
                    child: Row(children: [
                      CompoundImage(url: Branding.imageFor('${u['unit_number']}'), height: 42, width: 52,
                          radius: BorderRadius.circular(10)),
                      const SizedBox(width: 11),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('${u['unit_number'] ?? '—'}',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.textMain)),
                          Text('${u['project_name'] ?? ''}', maxLines: 1, overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                        ]),
                      ),
                      if (sel) const Icon(Icons.check_circle_rounded, color: AppColors.green, size: 18),
                    ]),
                  ),
                ),
              );
            }),
            const SizedBox(height: 4),
          ],

          _sectionLabel('MENU — القائمة'),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: List.generate(_tabs.length, (i) => _menuTile(i)),
            ),
          ),
          const Divider(color: AppColors.borderSoft, height: 1),
          Padding(
            padding: const EdgeInsets.all(14),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: _logout,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 13),
                decoration: BoxDecoration(
                  color: AppColors.red.withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.red.withValues(alpha: 0.25)),
                ),
                child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.logout_rounded, color: AppColors.red, size: 17),
                  SizedBox(width: 8),
                  Text('Sign Out / تسجيل الخروج', style: TextStyle(color: AppColors.red, fontWeight: FontWeight.w800, fontSize: 13)),
                ]),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _sectionLabel(String label) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 6),
        child: Align(alignment: Alignment.centerLeft,
            child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textFaint, letterSpacing: 1.1))),
      );

  Widget _menuTile(int i) {
    final sel = _tab == i;
    final t = _tabs[i];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2.5),
      child: InkWell(
        borderRadius: BorderRadius.circular(13),
        onTap: () { setState(() => _tab = i); Navigator.pop(context); },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          decoration: BoxDecoration(
            gradient: sel ? LinearGradient(colors: [AppColors.royal.withValues(alpha: 0.12), AppColors.gold.withValues(alpha: 0.06)]) : null,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: sel ? AppColors.royal.withValues(alpha: 0.3) : Colors.transparent),
          ),
          child: Row(children: [
            Icon(t.$1, size: 18, color: sel ? AppColors.royal : AppColors.textMuted),
            const SizedBox(width: 12),
            Text(t.$2, style: TextStyle(fontSize: 13.5, fontWeight: sel ? FontWeight.w800 : FontWeight.w600, color: sel ? AppColors.textMain : AppColors.textMuted)),
            const Spacer(),
            if (t.$3.isNotEmpty) Text(t.$3, style: const TextStyle(fontSize: 10, color: AppColors.textFaint)),
          ]),
        ),
      ),
    );
  }

  // ── HORIZONTAL TAB BAR ──
  Widget _tabBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(children: List.generate(_tabs.length, (i) {
          final sel = _tab == i;
          final t = _tabs[i];
          return GestureDetector(
            onTap: () => setState(() => _tab = i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                gradient: sel ? const LinearGradient(colors: [AppColors.royal, AppColors.royalDark]) : null,
                color: sel ? null : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(11),
                boxShadow: sel ? [BoxShadow(color: AppColors.royal.withValues(alpha: 0.28), blurRadius: 10, offset: const Offset(0, 4))] : null,
              ),
              child: Row(children: [
                Icon(t.$1, size: 15, color: sel ? Colors.white : AppColors.textMuted),
                const SizedBox(width: 6),
                Text(t.$2, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: sel ? Colors.white : AppColors.textMuted)),
              ]),
            ),
          );
        })),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════
  // TAB: MY UNIT
  // ══════════════════════════════════════════════════════════
  List<Widget> _unitTab() {
    final unit = _unit;
    final fin = _fin;
    if (unit == null) return [_empty(Icons.home_rounded, 'No unit found for this account.')];
    final status = (unit['status'] ?? '').toString();
    return [
      // Hero image card — fixes the old "empty box"
      CompoundImage(
        url: Branding.imageFor('${unit['unit_number']}'),
        height: 190,
        radius: BorderRadius.circular(20),
        overlay: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
                colors: [Colors.transparent, AppColors.royalDark.withValues(alpha: 0.86)]),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(mainAxisAlignment: MainAxisAlignment.end, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.green, borderRadius: BorderRadius.circular(20)),
                  child: Text(status.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.5)),
                ),
                const Spacer(),
                const Icon(Icons.verified_rounded, color: AppColors.gold, size: 18),
              ]),
              const SizedBox(height: 8),
              Text('Unit ${unit['unit_number'] ?? '—'}',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
              Text('${unit['project_name'] ?? ''}',
                  style: TextStyle(fontSize: 12.5, color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w600)),
            ]),
          ),
        ),
      ),
      const SizedBox(height: 14),
      // spec grid
      _glass(child: Wrap(spacing: 16, runSpacing: 14, children: [
        _iconInfo(Icons.category_rounded, AppColors.blue, 'TYPE', '${unit['type'] ?? '—'}'),
        _iconInfo(Icons.king_bed_rounded, AppColors.purple, 'LAYOUT', '${unit['bedrooms'] ?? '—'}BR / ${unit['bathrooms'] ?? '—'}BA'),
        _iconInfo(Icons.straighten_rounded, AppColors.amber, 'AREA', '${unit['area'] ?? '—'} m²'),
        _iconInfo(Icons.layers_rounded, AppColors.green, 'FLOOR', '${unit['floor'] ?? '—'}'),
        if ((unit['handover_date'] ?? unit['project_delivery_date']) != null)
          _iconInfo(Icons.event_available_rounded, AppColors.royal, 'HANDOVER', _date(unit['handover_date'] ?? unit['project_delivery_date'])),
      ])),
      if (fin != null) ...[
        const SizedBox(height: 14),
        _financialSummary(fin),
        const SizedBox(height: 14),
        _gaugePanel(fin),
        if (fin['next_due'] != null) ...[
          const SizedBox(height: 14),
          _nextDueCard(fin['next_due'] as Map),
        ],
      ],
    ];
  }

  Widget _financialSummary(Map fin) {
    final total = _num(fin['total_amount']);
    final paid = _num(fin['paid_amount']);
    final pct = total > 0 ? (paid / total).clamp(0.0, 1.0).toDouble() : 0.0;
    final overdue = _num(fin['overdue_installments']).toInt();
    return _glass(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _panelTitle(Icons.account_balance_wallet_rounded, AppColors.green, 'Financial Summary — الملخص المالي'),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: _kv('Total', _money(total), AppColors.textMain)),
          Expanded(child: _kv('Paid', _money(paid), AppColors.greenDark)),
          Expanded(child: _kv('Outstanding', _money(fin['outstanding']), AppColors.orange)),
        ]),
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: pct),
            duration: const Duration(milliseconds: 900), curve: Curves.easeOutCubic,
            builder: (_, v, __) => LinearProgressIndicator(value: v, minHeight: 11,
                backgroundColor: AppColors.borderSoft, valueColor: const AlwaysStoppedAnimation(AppColors.green)),
          ),
        ),
        const SizedBox(height: 8),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('${fin['paid_installments'] ?? 0}/${fin['total_installments'] ?? 0} Installments Paid',
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
          if (overdue > 0) Text('$overdue Overdue!', style: const TextStyle(fontSize: 11, color: AppColors.red, fontWeight: FontWeight.w800)),
        ]),
      ]),
    );
  }

  // ══════════════════════════════════════════════════════════
  // TAB: CONTRACT
  // ══════════════════════════════════════════════════════════
  List<Widget> _contractTab() {
    final c = _contract;
    if (c == null) return [_empty(Icons.description_rounded, 'No active contract found.')];
    final active = (c['status'] ?? '') == 'active';
    final hasDoc = (c['document_path'] ?? '').toString().isNotEmpty;
    return [
      _glass(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 46, height: 46,
            decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppColors.royal, AppColors.royalDark]), borderRadius: BorderRadius.circular(13)),
            child: const Icon(Icons.description_rounded, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 13),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('CONTRACT NUMBER', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.textFaint, letterSpacing: 0.7)),
            Text('${c['contract_number'] ?? '—'}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textMain)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
            decoration: BoxDecoration(color: (active ? AppColors.green : AppColors.amber).withValues(alpha: 0.10), borderRadius: BorderRadius.circular(20)),
            child: Text(active ? '✍️ Active' : '${c['status']}', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: active ? AppColors.greenDark : AppColors.amber)),
          ),
        ]),
        const Divider(color: AppColors.borderSoft, height: 28),
        Row(children: [
          Expanded(child: _kv('Total Amount', _money(c['total_amount']), AppColors.textMain)),
          Expanded(child: _kv('Paid', _money(c['paid_amount']), AppColors.greenDark)),
        ]),
        const SizedBox(height: 12),
        _kv('Signing Date / تاريخ التوقيع', (c['signed_at'] ?? 'Not signed yet').toString(), AppColors.textMuted),
        if (hasDoc) ...[
          const SizedBox(height: 16),
          _linkButton(Icons.picture_as_pdf_rounded, 'Download Contract / تحميل العقد', _url(c['document_path']?.toString())),
        ],
      ])),
    ];
  }

  // ══════════════════════════════════════════════════════════
  // TAB: PAYMENTS
  // ══════════════════════════════════════════════════════════
  List<Widget> _paymentsTab() {
    final fin = _fin;
    return [
      if (fin != null) ...[
        Row(children: [
          Expanded(child: _borderStat('Total Value', _money(fin['total_amount']), AppColors.green, Icons.account_balance_rounded)),
          const SizedBox(width: 10),
          Expanded(child: _borderStat('Total Paid', _money(fin['paid_amount']), AppColors.blue, Icons.check_circle_rounded)),
        ]),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(child: _borderStat('Outstanding', _money(fin['outstanding']), AppColors.amber, Icons.hourglass_bottom_rounded)),
          const SizedBox(width: 10),
          Expanded(child: _borderStat('Overdue', '${_num(fin['overdue_installments']).toInt()}',
              _num(fin['overdue_installments']) > 0 ? AppColors.red : AppColors.green, Icons.warning_amber_rounded)),
        ]),
        const SizedBox(height: 14),
        _gaugePanel(fin),
        const SizedBox(height: 14),
      ],
      _glass(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _panelTitle(Icons.credit_card_rounded, AppColors.purple, 'Payment Schedule — جدول الأقساط'),
        const SizedBox(height: 12),
        if (_payments.isEmpty)
          const Padding(padding: EdgeInsets.all(14), child: Text('No installment data available.', style: TextStyle(color: AppColors.textMuted, fontSize: 12.5)))
        else ...[
          ..._pageSlice(_payments, _payPage).map((p) => _paymentRow(p as Map)),
          _pager(_payments.length, _payPage, (p) => setState(() => _payPage = p)),
        ],
      ])),
    ];
  }

  List _pageSlice(List all, int page) {
    final start = page * _payPageSize;
    final end = math.min(start + _payPageSize, all.length);
    return all.sublist(start.clamp(0, all.length), end.clamp(0, all.length));
  }

  Widget _pager(int total, int page, ValueChanged<int> onPage) {
    final pages = (total / _payPageSize).ceil();
    if (pages <= 1) return const SizedBox.shrink();
    final from = page * _payPageSize + 1;
    final to = math.min((page + 1) * _payPageSize, total);
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        _pagerBtn(Icons.chevron_left_rounded, page > 0, () => onPage(page - 1)),
        Column(children: [
          Text('$from–$to of $total', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: AppColors.textMain)),
          Text('Page ${page + 1} / $pages', style: const TextStyle(fontSize: 9.5, color: AppColors.textMuted)),
        ]),
        _pagerBtn(Icons.chevron_right_rounded, page < pages - 1, () => onPage(page + 1)),
      ]),
    );
  }

  Widget _pagerBtn(IconData icon, bool enabled, VoidCallback onTap) => Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(11),
          onTap: enabled ? onTap : null,
          child: Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: enabled ? AppColors.royal.withValues(alpha: 0.10) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(11),
              border: Border.all(color: enabled ? AppColors.royal.withValues(alpha: 0.25) : AppColors.borderSoft),
            ),
            child: Icon(icon, color: enabled ? AppColors.royal : AppColors.textFaint, size: 22),
          ),
        ),
      );

  Widget _paymentRow(Map p) {
    final status = (p['is_overdue'] == true) ? 'overdue' : (p['status'] ?? 'upcoming').toString();
    final color = status == 'paid' ? AppColors.green : status == 'overdue' ? AppColors.red : AppColors.blue;
    final label = status == 'paid' ? 'Paid / مدفوع' : status == 'overdue' ? 'Overdue / متأخر' : 'Upcoming / قادم';
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 3.5),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: status == 'overdue' ? AppColors.red.withValues(alpha: 0.04) : AppColors.bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: status == 'overdue' ? AppColors.red.withValues(alpha: 0.18) : AppColors.borderSoft),
      ),
      child: Row(children: [
        Container(width: 32, height: 32, alignment: Alignment.center,
          decoration: BoxDecoration(color: color.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(9)),
          child: Text('${p['installment_number'] ?? '-'}', style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w800))),
        const SizedBox(width: 11),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_money(p['amount']), style: const TextStyle(color: AppColors.textMain, fontSize: 13, fontWeight: FontWeight.w800)),
          Text('Due ${_date(p['due_date'])}', style: const TextStyle(color: AppColors.textFaint, fontSize: 10.5)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withValues(alpha: 0.22))),
          child: Text(label, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w800)),
        ),
      ]),
    );
  }

  // ══════════════════════════════════════════════════════════
  // TAB: FAMILY
  // ══════════════════════════════════════════════════════════
  List<Widget> _familyTab() {
    const emoji = {'spouse': '💑', 'child': '👶', 'parent': '👨‍👩‍👦', 'sibling': '👫', 'other': '👤'};
    final header = _addHeader('Family Members — أفراد الأسرة', 'Add Member', AppColors.purple, _addFamily);
    if (_family.isEmpty) return [header, _empty(Icons.groups_rounded, 'No family members added yet.')];
    return [header, ..._family.map<Widget>((f) {
      final m = f as Map;
      final rel = (m['relationship'] ?? 'other').toString();
      final photo = _url(m['photo_url']?.toString());
      return _tile(
        leading: photo.isNotEmpty
            ? ClipRRect(borderRadius: BorderRadius.circular(13), child: Image.network(photo, width: 46, height: 46, fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _emojiAvatar(emoji[rel] ?? '👤')))
            : _emojiAvatar(emoji[rel] ?? '👤'),
        title: '${m['name'] ?? ''}',
        subtitle: '${rel[0].toUpperCase()}${rel.substring(1)}${m['national_id'] != null ? '  ·  ${m['national_id']}' : ''}',
        trailing: OutlinedButton.icon(
          onPressed: () => _showIdCard(m, emoji[rel] ?? '👤'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.royal, side: const BorderSide(color: AppColors.royal),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          icon: const Icon(Icons.badge_rounded, size: 15),
          label: const Text('ID Card', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
        ),
      );
    })];
  }

  /// Smart ID Card — the Mountain View resident badge (front + back), matching
  /// the web portal. The back shows a scannable QR generated from the member's
  /// details for gate access verification.
  void _showIdCard(Map m, String fallbackEmoji) {
    final unit = _unit;
    final name = (m['name'] ?? '').toString();
    final rel = (m['relationship'] ?? 'member').toString();
    final nid = (m['national_id'] ?? '').toString();
    final photo = _url(m['photo_url']?.toString());
    final unitNo = (unit?['unit_number'] ?? 'N/A').toString();
    final project = (unit?['project_name'] ?? 'N/A').toString();
    final qrData = 'REDP-BADGE:${m['id']};NAME:$name;UNIT:$unitNo;REL:$rel;OWNER:$_userName';
    final qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${Uri.encodeComponent(qrData)}';

    showDialog(context: context, builder: (ctx) => Dialog(
      backgroundColor: AppColors.bg,
      insetPadding: const EdgeInsets.all(18),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Row(children: [
              const Text('🪪', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              const Expanded(child: Text('Smart ID Card — بطاقة الهوية', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textMain))),
              IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close_rounded, color: AppColors.textMuted)),
            ]),
            const SizedBox(height: 8),
            _idFront(name, rel, nid, photo, unitNo, fallbackEmoji),
            const SizedBox(height: 16),
            _idBack(project, qrUrl),
            const SizedBox(height: 14),
            const Text('💡 Guards can scan the QR to verify family access.\nيمكن للأمن مسح الرمز للتحقق من دخول أفراد الأسرة.',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 10.5, color: AppColors.textMuted, height: 1.5)),
          ]),
        ),
      ),
    ));
  }

  Widget _idFront(String name, String rel, String nid, String photo, String unitNo, String emoji) {
    return Container(
      width: 320, height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppColors.royal, AppColors.royalDark]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.45), width: 1.5),
        boxShadow: [BoxShadow(color: const Color(0xFF00003C).withValues(alpha: 0.25), blurRadius: 32, offset: const Offset(0, 12))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // header
        const Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          MountainViewLogo(size: 18, onDark: true, showTagline: false),
          Text('RESIDENT ACCESS', style: TextStyle(fontSize: 7.5, color: AppColors.gold, fontWeight: FontWeight.w800, letterSpacing: 1)),
        ]),
        Container(height: 1, margin: const EdgeInsets.symmetric(vertical: 8), color: Colors.white.withValues(alpha: 0.12)),
        // main
        Expanded(child: Row(children: [
          Container(
            width: 64, height: 78,
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.gold, width: 2)),
            clipBehavior: Clip.antiAlias,
            alignment: Alignment.center,
            child: photo.isNotEmpty
                ? Image.network(photo, width: 64, height: 78, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Text(emoji, style: const TextStyle(fontSize: 30)))
                : Text(emoji, style: const TextStyle(fontSize: 30)),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 5),
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(4), border: Border.all(color: AppColors.gold.withValues(alpha: 0.3))),
                child: Text(rel[0].toUpperCase() + rel.substring(1), style: const TextStyle(fontSize: 8.5, color: Color(0xFFFFE0B2), fontWeight: FontWeight.w700)),
              ),
              const SizedBox(width: 6),
              Text('MEMBER', style: TextStyle(fontSize: 7.5, color: Colors.white.withValues(alpha: 0.5), fontWeight: FontWeight.w700)),
            ]),
            if (nid.isNotEmpty) ...[
              const SizedBox(height: 5),
              Text.rich(TextSpan(children: [
                TextSpan(text: 'ID: ', style: TextStyle(fontSize: 8.5, color: Colors.white.withValues(alpha: 0.5))),
                TextSpan(text: nid, style: const TextStyle(fontSize: 8.5, color: Color(0xFFFFE0B2), fontFamily: 'monospace', fontWeight: FontWeight.w600)),
              ])),
            ],
          ])),
        ])),
        Container(height: 1, margin: const EdgeInsets.only(bottom: 8), color: Colors.white.withValues(alpha: 0.10)),
        // footer
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.end, children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('UNIT / الوحدة', style: TextStyle(fontSize: 6.5, color: Colors.white.withValues(alpha: 0.5), letterSpacing: 0.5)),
            Text(unitNo, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white)),
          ]),
          // gold chip
          Container(
            width: 32, height: 24,
            decoration: BoxDecoration(
              gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFFFE0B2), Color(0xFFFFA726), Color(0xFFFB8C00)]),
              borderRadius: BorderRadius.circular(5),
              border: Border.all(color: Colors.black.withValues(alpha: 0.15)),
            ),
            child: const CustomPaint(painter: _ChipPainter()),
          ),
        ]),
      ]),
    );
  }

  Widget _idBack(String project, String qrUrl) {
    return Container(
      width: 320, height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppColors.royalDark, Color(0xFF000B21)]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.45), width: 1.5),
        boxShadow: [BoxShadow(color: const Color(0xFF00003C).withValues(alpha: 0.25), blurRadius: 32, offset: const Offset(0, 12))],
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const MountainViewLogo(size: 15, onDark: true, showTagline: false),
            const SizedBox(height: 12),
            Text('PROJECT / المشروع', style: TextStyle(fontSize: 6.5, color: Colors.white.withValues(alpha: 0.5))),
            Text(project, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 8),
            Text('OWNER / المالك', style: TextStyle(fontSize: 6.5, color: Colors.white.withValues(alpha: 0.5))),
            Text(_userName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white)),
          ]),
          Text('Non-transferable · property of Mountain View.\nبطاقة شخصية لمجتمعات ماونتن فيو.',
              style: TextStyle(fontSize: 6.5, color: Colors.white.withValues(alpha: 0.45), height: 1.35)),
        ])),
        const SizedBox(width: 12),
        Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 90, height: 90, padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.gold, width: 2)),
            child: Image.network(qrUrl, fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Icon(Icons.qr_code_2_rounded, size: 60, color: AppColors.royalDark)),
          ),
          const SizedBox(height: 6),
          const Text('SCAN ACCESS', style: TextStyle(fontSize: 6.5, color: AppColors.gold, fontWeight: FontWeight.w700, letterSpacing: 1.2)),
        ]),
      ]),
    );
  }

  /// Sticky "section title + Add button" row shown atop list tabs.
  Widget _addHeader(String title, String btn, Color color, VoidCallback onTap) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(children: [
          Expanded(child: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textMain))),
          ElevatedButton.icon(
            onPressed: onTap,
            style: ElevatedButton.styleFrom(backgroundColor: color, foregroundColor: Colors.white, elevation: 2,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(11))),
            icon: const Icon(Icons.add_rounded, size: 17),
            label: Text(btn, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          ),
        ]),
      );

  Widget _emojiAvatar(String e) => Container(
        width: 46, height: 46, alignment: Alignment.center,
        decoration: BoxDecoration(color: AppColors.purple.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(13)),
        child: Text(e, style: const TextStyle(fontSize: 22)),
      );

  // ══════════════════════════════════════════════════════════
  // TAB: VEHICLES
  // ══════════════════════════════════════════════════════════
  List<Widget> _vehiclesTab() {
    final header = _addHeader('Registered Vehicles — سياراتي', 'Add Vehicle', AppColors.blue, _addVehicle);
    if (_vehicles.isEmpty) return [header, _empty(Icons.directions_car_rounded, 'No vehicles registered yet.')];
    return [header, ..._vehicles.map<Widget>((v) {
      final m = v as Map;
      return _glass(
        margin: const EdgeInsets.only(bottom: 10),
        child: Row(children: [
          Container(width: 46, height: 46, decoration: BoxDecoration(color: AppColors.blue.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(13)),
              child: const Icon(Icons.directions_car_rounded, color: AppColors.blue, size: 23)),
          const SizedBox(width: 13),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${m['make'] ?? ''} ${m['model'] ?? ''}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textMain)),
            const SizedBox(height: 6),
            Wrap(spacing: 7, runSpacing: 6, children: [
              _pill(Icons.palette_rounded, '${m['color'] ?? '—'}', AppColors.textMuted),
              if (m['year'] != null) _pill(Icons.calendar_today_rounded, '${m['year']}', AppColors.blue),
            ]),
          ])),
          // Egyptian-style plate
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(7), border: Border.all(color: AppColors.royal, width: 1.5)),
            clipBehavior: Clip.antiAlias,
            child: Row(children: [
              Container(color: AppColors.royal, padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 6),
                  child: const Text('EG\nمصر', textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.w700, height: 1.1))),
              Padding(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  child: Text('${m['plate_number'] ?? ''}', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w800, fontSize: 12, color: AppColors.textMain))),
            ]),
          ),
        ]),
      );
    })];
  }

  // ══════════════════════════════════════════════════════════
  // TAB: SERVICES
  // ══════════════════════════════════════════════════════════
  List<Widget> _servicesTab() {
    const icons = {'electrician': Icons.bolt_rounded, 'plumber': Icons.water_drop_rounded, 'carpenter': Icons.handyman_rounded,
      'painter': Icons.format_paint_rounded, 'ac_technician': Icons.air_rounded, 'general': Icons.build_rounded};
    final header = _addHeader('Service Requests — طلبات الخدمة', 'New Request', AppColors.amber, _addService);
    if (_services.isEmpty) return [header, _empty(Icons.handyman_rounded, 'No service requests yet.')];
    return [header, ..._services.map<Widget>((s) {
      final m = s as Map;
      final st = (m['status'] ?? 'pending').toString();
      final stColor = st == 'completed' ? AppColors.green : st == 'in_progress' ? AppColors.purple : st == 'cancelled' ? AppColors.textMuted : AppColors.amber;
      return _tile(
        leading: Container(width: 46, height: 46, decoration: BoxDecoration(color: AppColors.amber.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(13)),
            child: Icon(icons[m['service_type']] ?? Icons.build_rounded, color: AppColors.amber, size: 21)),
        title: '${m['title'] ?? m['service_type'] ?? 'Service'}',
        subtitle: '${m['description'] ?? ''}',
        trailing: _statusChip(st.replaceAll('_', ' '), stColor),
      );
    })];
  }

  // ══════════════════════════════════════════════════════════
  // TAB: NOTIFICATIONS
  // ══════════════════════════════════════════════════════════
  List<Widget> _notificationsTab() {
    if (_notifs.isEmpty) return [_empty(Icons.notifications_rounded, 'No notifications yet.')];
    return _notifs.map<Widget>((n) {
      final m = n as Map;
      final ch = (m['channel'] ?? 'push').toString();
      final icon = ch == 'email' ? Icons.mail_rounded : ch == 'sms' ? Icons.sms_rounded : ch == 'whatsapp' ? Icons.chat_rounded : Icons.notifications_active_rounded;
      return _glass(
        margin: const EdgeInsets.only(bottom: 10),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(width: 38, height: 38, decoration: BoxDecoration(color: AppColors.amber.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(11)),
              child: Icon(icon, size: 18, color: AppColors.amber)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${m['title'] ?? ''}', style: const TextStyle(color: AppColors.textMain, fontWeight: FontWeight.w800, fontSize: 13)),
            const SizedBox(height: 3),
            Text('${m['content'] ?? ''}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5, height: 1.45)),
            const SizedBox(height: 6),
            Text(_date(m['created_at']), style: const TextStyle(color: AppColors.textFaint, fontSize: 9.5)),
          ])),
        ]),
      );
    }).toList();
  }

  // ══════════════════════════════════════════════════════════
  // TAB: FILES
  // ══════════════════════════════════════════════════════════
  List<Widget> _filesTab() {
    if (_files.isEmpty) return [_empty(Icons.folder_rounded, 'No documents found.')];
    return _files.map<Widget>((f) {
      final m = f as Map;
      return _tile(
        leading: Container(width: 46, height: 46, decoration: BoxDecoration(color: AppColors.green.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(13)),
            child: const Icon(Icons.insert_drive_file_rounded, color: AppColors.green, size: 21)),
        title: (m['title'] ?? 'Document').toString().replaceAll('_', ' '),
        subtitle: '${(m['type'] ?? '').toString().replaceAll('_', ' ')} · ${_date(m['created_at'])}',
        trailing: const Icon(Icons.open_in_new_rounded, size: 18, color: AppColors.textMuted),
        onTap: () => _openUrl(_url(m['file_path']?.toString())),
      );
    }).toList();
  }

  // ══════════════════════════════════════════════════════════
  // TAB: GUEST PASSES
  // ══════════════════════════════════════════════════════════
  List<Widget> _guestTab() {
    return [
      _glass(child: Column(children: [
        Container(width: 66, height: 66, decoration: BoxDecoration(color: AppColors.royal.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(18)),
            child: const Icon(Icons.qr_code_2_rounded, color: AppColors.royal, size: 34)),
        const SizedBox(height: 14),
        const Text('Guest Passes — تصاريح الزوار', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textMain)),
        const SizedBox(height: 6),
        const Text('Generate secure QR entry passes for your visitors at the compound gate.\nأنشئ تصاريح دخول آمنة لزوارك عبر بوابة الكمبوند.',
            textAlign: TextAlign.center, style: TextStyle(fontSize: 11.5, color: AppColors.textMuted, height: 1.5)),
        const SizedBox(height: 16),
        _linkButtonSolid(Icons.add_rounded, 'Request a Guest Pass', _requestGuestPass),
      ])),
    ];
  }

  // ══════════════════════════════════════════════════════════
  // TAB: RESALE
  // ══════════════════════════════════════════════════════════
  List<Widget> _resaleTab() {
    return [
      _glass(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _panelTitle(Icons.sync_alt_rounded, AppColors.purple, 'Resale Requests — طلبات إعادة البيع'),
        const SizedBox(height: 6),
        const Text('List your unit for resale through Mountain View company sales.',
            style: TextStyle(fontSize: 11.5, color: AppColors.textMuted)),
        const SizedBox(height: 14),
        _linkButtonSolid(Icons.storefront_rounded, 'Request Resale Listing', _requestResale),
      ])),
      const SizedBox(height: 12),
      if (_resale.isEmpty)
        _empty(Icons.sync_alt_rounded, 'No resale requests yet.')
      else
        ..._resale.map((r) {
          final m = r as Map;
          final st = (m['status'] ?? 'pending').toString();
          final color = st == 'approved' ? AppColors.green : st == 'rejected' ? AppColors.red : AppColors.amber;
          return _tile(
            leading: Container(width: 46, height: 46, decoration: BoxDecoration(color: color.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(13)),
                child: Icon(Icons.sell_rounded, color: color, size: 21)),
            title: m['asking_price'] != null ? _money(m['asking_price']) : 'Resale Request',
            subtitle: '${m['reason'] ?? ''} · ${_date(m['created_at'])}',
            trailing: _statusChip(st, color),
          );
        }),
    ];
  }

  // ── gauge ──
  Widget _gaugePanel(Map fin) {
    final total = _num(fin['total_amount']);
    final paid = _num(fin['paid_amount']);
    final pct = total > 0 ? (paid / total).clamp(0.0, 1.0).toDouble() : 0.0;
    final color = pct >= 0.75 ? AppColors.green : pct >= 0.4 ? AppColors.blue : pct >= 0.15 ? AppColors.amber : AppColors.red;
    final totalInst = _num(fin['total_installments']).toInt();
    final paidInst = _num(fin['paid_installments']).toInt();
    final instPct = totalInst > 0 ? (paidInst * 100 / totalInst).round() : 0;
    return _glass(child: Column(children: [
      const Text('Repayment Progress — مدى سدادك للوحدة', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: AppColors.textMain)),
      SizedBox(
        height: 150,
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: pct), duration: const Duration(milliseconds: 1100), curve: Curves.easeOutCubic,
          builder: (_, v, __) => CustomPaint(size: const Size(double.infinity, 150), painter: _GaugePainter(v),
            child: Center(child: Padding(padding: const EdgeInsets.only(top: 46), child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text('${(v * 100).toStringAsFixed(1)}%', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: color)),
              const Text('PAID / مدفوع', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 1)),
            ])))),
        ),
      ),
      const SizedBox(height: 6),
      ClipRRect(borderRadius: BorderRadius.circular(7), child: Row(children: [
        Expanded(flex: (pct * 1000).round().clamp(1, 999), child: Container(height: 11, decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppColors.green, AppColors.greenDark])))),
        Expanded(flex: ((1 - pct) * 1000).round().clamp(1, 999), child: Container(height: 11, color: AppColors.amber.withValues(alpha: 0.25))),
      ])),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: _chipStat('Installments Paid', '$paidInst / $totalInst ($instPct%)', AppColors.green)),
        const SizedBox(width: 8),
        Expanded(child: _chipStat('Remaining', '${_num(fin['pending_installments']).toInt()}', AppColors.blue)),
      ]),
    ]));
  }

  Widget _nextDueCard(Map nd) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.amber.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.amber.withValues(alpha: 0.25)),
        ),
        child: Row(children: [
          Container(width: 42, height: 42, decoration: BoxDecoration(color: AppColors.amber.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.event_rounded, color: AppColors.amber, size: 21)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('NEXT INSTALLMENT / القسط القادم', style: TextStyle(color: AppColors.textFaint, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.7)),
            const SizedBox(height: 3),
            Text(_money(nd['amount']), style: const TextStyle(color: AppColors.textMain, fontSize: 17, fontWeight: FontWeight.w800)),
            Text('Due ${_date(nd['due_date'])}', style: const TextStyle(color: AppColors.amberDark, fontSize: 11, fontWeight: FontWeight.w700)),
          ])),
        ]),
      );

  // ── shared widgets ──
  Widget _glass({required Widget child, EdgeInsets? margin}) => Container(
        width: double.infinity, margin: margin, padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.borderSoft),
          boxShadow: [BoxShadow(color: AppColors.royal.withValues(alpha: 0.04), blurRadius: 18, offset: const Offset(0, 8))],
        ),
        child: child,
      );

  Widget _panelTitle(IconData icon, Color color, String text) => Row(children: [
        Icon(icon, color: color, size: 18), const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textMain))),
      ]);

  Widget _iconInfo(IconData icon, Color color, String label, String value) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 38, height: 38, decoration: BoxDecoration(color: color.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(11)), child: Icon(icon, size: 17, color: color)),
        const SizedBox(width: 9),
        Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Text(label, style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.w800, color: AppColors.textFaint, letterSpacing: 0.6)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: AppColors.textMain)),
        ]),
      ]);

  Widget _tile({required Widget leading, required String title, String? subtitle, Widget? trailing, VoidCallback? onTap}) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15), border: Border.all(color: AppColors.borderSoft),
            boxShadow: [BoxShadow(color: AppColors.royal.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))]),
        child: Material(color: Colors.transparent, child: InkWell(
          borderRadius: BorderRadius.circular(15), onTap: onTap,
          child: Padding(padding: const EdgeInsets.all(13), child: Row(children: [
            leading,
            const SizedBox(width: 13),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: AppColors.textMain)),
              if (subtitle != null && subtitle.isNotEmpty) ...[
                const SizedBox(height: 3),
                Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ])),
            if (trailing != null) ...[const SizedBox(width: 8), trailing],
          ])),
        )),
      );

  Widget _pill(IconData icon, String text, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.09), borderRadius: BorderRadius.circular(20)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 11, color: color), const SizedBox(width: 4),
          Text(text, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: color))]),
      );

  Widget _statusChip(String text, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
        child: Text(text.toUpperCase(), style: TextStyle(fontSize: 8.6, fontWeight: FontWeight.w800, color: color)),
      );

  Widget _borderStat(String label, String value, Color color, [IconData? icon]) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: color.withValues(alpha: 0.22)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Row(children: [
            Icon(icon ?? Icons.circle, size: 13, color: color),
            const SizedBox(width: 5),
            Expanded(
              child: Text(label.toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 8.4, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.4)),
            ),
          ]),
          const SizedBox(height: 8),
          Text(value, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, color: color)),
        ]),
      );

  Widget _chipStat(String label, String value, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.07), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withValues(alpha: 0.18))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 8.2, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.4)),
          const SizedBox(height: 3),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: color)),
        ]),
      );

  Widget _kv(String label, String value, Color color) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label.toUpperCase(), style: const TextStyle(fontSize: 8.6, fontWeight: FontWeight.w800, color: AppColors.textFaint, letterSpacing: 0.5)),
        const SizedBox(height: 4),
        FittedBox(fit: BoxFit.scaleDown, child: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: color))),
      ]);

  Widget _linkButton(IconData icon, String label, String url) => SizedBox(
        width: double.infinity, height: 46,
        child: OutlinedButton.icon(
          onPressed: () => _openUrl(url),
          style: OutlinedButton.styleFrom(foregroundColor: AppColors.royal, side: const BorderSide(color: AppColors.royal),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          icon: Icon(icon, size: 18), label: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        ),
      );

  Widget _linkButtonSolid(IconData icon, String label, VoidCallback onTap) => SizedBox(
        width: double.infinity, height: 46,
        child: ElevatedButton.icon(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.royal, foregroundColor: Colors.white, elevation: 3,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          icon: Icon(icon, size: 18), label: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        ),
      );

  void _openUrl(String url) {
    if (url.isEmpty) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Document: $url'), behavior: SnackBarBehavior.floating));
  }

  void _toast(String msg, {bool ok = true}) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(msg),
        backgroundColor: ok ? AppColors.greenDark : AppColors.red,
        behavior: SnackBarBehavior.floating,
      ));

  String? get _unitId => _unit?['id']?.toString();

  Future<void> _addFamily() => FormSheet.show(context, FormSheet(
        title: 'Add Family Member', subtitle: 'إضافة فرد من العائلة', icon: Icons.group_add_rounded, accent: AppColors.purple,
        submitLabel: 'Add Member',
        fields: const [
          FieldDef('photo', 'Profile Photo (صورة تظهر في البطاقة)', type: 'image'),
          FieldDef('name', 'Full Name', required: true),
          FieldDef('relationship', 'Relationship', type: 'dropdown', required: true, options: [
            ('spouse', 'Spouse (زوج/زوجة)'), ('child', 'Child (ابن/ابنة)'), ('parent', 'Parent (والد/والدة)'),
            ('sibling', 'Sibling (أخ/أخت)'), ('other', 'Other (آخر)'),
          ]),
          FieldDef('national_id', 'National ID (optional)'),
          FieldDef('phone', 'Phone (optional)'),
          FieldDef('date_of_birth', 'Date of Birth (optional)', type: 'date'),
        ],
        onSubmit: (v) async { await _repo.addFamily(v); await _load(contractId: _selectedContractId); _toast('Family member added.'); },
      ));

  Future<void> _addVehicle() => FormSheet.show(context, FormSheet(
        title: 'Register Vehicle', subtitle: 'تسجيل سيارة', icon: Icons.directions_car_rounded, accent: AppColors.blue,
        submitLabel: 'Register',
        fields: const [
          FieldDef('make', 'Make (الماركة)', required: true),
          FieldDef('model', 'Model (الموديل)', required: true),
          FieldDef('color', 'Color (اللون)', required: true),
          FieldDef('plate_number', 'Plate Number (رقم اللوحة)', required: true),
          FieldDef('year', 'Year (optional)', type: 'number'),
        ],
        onSubmit: (v) async { await _repo.addVehicle(v); await _load(contractId: _selectedContractId); _toast('Vehicle registered.'); },
      ));

  Future<void> _addService() {
    if (_unitId == null) { _toast('No unit found.', ok: false); return Future.value(); }
    return FormSheet.show(context, FormSheet(
      title: 'New Service Request', subtitle: 'طلب خدمة صيانة', icon: Icons.handyman_rounded, accent: AppColors.amber,
      submitLabel: 'Submit Request',
      fields: const [
        FieldDef('service_type', 'Service Type', type: 'dropdown', required: true, options: [
          ('electrician', 'Electrician (كهربائي)'), ('plumber', 'Plumber (سباك)'), ('carpenter', 'Carpenter (نجار)'),
          ('ac_technician', 'AC Technician (تكييف)'), ('painter', 'Painter (دهان)'), ('general', 'General (عام)'),
        ]),
        FieldDef('title', 'Title (عنوان الطلب)', required: true),
        FieldDef('description', 'Description (وصف المشكلة)', type: 'multiline', required: true),
        FieldDef('priority', 'Priority', type: 'dropdown', options: [
          ('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent'),
        ]),
      ],
      onSubmit: (v) async { v['unit_id'] = _unitId; await _repo.addService(v); await _load(contractId: _selectedContractId); _toast('Service request submitted.'); },
    ));
  }

  Future<void> _requestResale() {
    if (_unitId == null) { _toast('No unit found.', ok: false); return Future.value(); }
    return FormSheet.show(context, FormSheet(
      title: 'Request Resale Listing', subtitle: 'طلب إعادة بيع الوحدة', icon: Icons.sell_rounded, accent: AppColors.purple,
      submitLabel: 'Submit',
      fields: const [
        FieldDef('asking_price', 'Asking Price (السعر المطلوب)', type: 'number'),
        FieldDef('reason', 'Reason (السبب - optional)', type: 'multiline'),
      ],
      onSubmit: (v) async { v['unit_id'] = _unitId; await _repo.requestResale(v); await _load(contractId: _selectedContractId); _toast('Resale request submitted.'); },
    ));
  }

  Future<void> _requestGuestPass() => FormSheet.show(context, FormSheet(
        title: 'Request Guest Pass', subtitle: 'تصريح دخول زائر', icon: Icons.qr_code_rounded, accent: AppColors.royal,
        submitLabel: 'Generate Pass',
        fields: const [
          FieldDef('visitor_name', 'Visitor Name (اسم الزائر)', required: true),
          FieldDef('visit_date', 'Visit Date (تاريخ الزيارة)', type: 'date', required: true),
          FieldDef('car_plate', 'Car Plate (رقم السيارة - optional)'),
        ],
        onSubmit: (v) async {
          final res = await _repo.requestGatePass(v);
          final code = res['visitor_details']?['pass_id'] ?? res['qr_code_data'] ?? 'GENERATED';
          if (mounted) _toast('Guest pass created: $code');
        },
      ));

  Widget _empty(IconData icon, String msg) => _glass(child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 26),
        child: Column(children: [
          Icon(icon, size: 44, color: AppColors.textFaint.withValues(alpha: 0.5)),
          const SizedBox(height: 12),
          Text(msg, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
        ]),
      ));

  Widget _errorView() => Center(child: Padding(padding: const EdgeInsets.all(30), child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.cloud_off_rounded, size: 48, color: AppColors.textFaint),
        const SizedBox(height: 12),
        Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted)),
        const SizedBox(height: 16),
        ElevatedButton.icon(onPressed: () => _load(contractId: _selectedContractId),
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.royal, foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          icon: const Icon(Icons.refresh_rounded, size: 17), label: const Text('Retry')),
      ])));
}

/// Draws the fine contact lines of the metallic gold chip on the ID card.
class _ChipPainter extends CustomPainter {
  const _ChipPainter();
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()..color = Colors.black.withValues(alpha: 0.2)..strokeWidth = 0.8;
    canvas.drawLine(Offset(0, size.height / 2), Offset(size.width, size.height / 2), p);
    canvas.drawLine(Offset(size.width * 0.3, 0), Offset(size.width * 0.3, size.height), p);
    canvas.drawLine(Offset(size.width * 0.7, 0), Offset(size.width * 0.7, size.height), p);
    final r = RRect.fromRectAndRadius(
        Rect.fromLTWH(size.width * 0.28, size.height * 0.25, size.width * 0.44, size.height * 0.5), const Radius.circular(2));
    canvas.drawRRect(r, Paint()..style = PaintingStyle.stroke..strokeWidth = 0.8..color = Colors.black.withValues(alpha: 0.15));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Web-style speedometer gauge: grey track + gradient arc.
class _GaugePainter extends CustomPainter {
  final double pct;
  _GaugePainter(this.pct);
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height - 12);
    final radius = math.min(size.width / 2 - 22, size.height - 34);
    final rect = Rect.fromCircle(center: center, radius: radius);
    final track = Paint()..style = PaintingStyle.stroke..strokeWidth = 15..strokeCap = StrokeCap.round..color = const Color(0xFFE2E8F0);
    canvas.drawArc(rect, math.pi, math.pi, false, track);
    if (pct > 0) {
      final prog = Paint()..style = PaintingStyle.stroke..strokeWidth = 15..strokeCap = StrokeCap.round
        ..shader = const SweepGradient(startAngle: math.pi, endAngle: 2 * math.pi,
          colors: [Color(0xFFEF4444), Color(0xFFF59E0B), Color(0xFF3B82F6), Color(0xFF10B981)], stops: [0.0, 0.35, 0.70, 1.0]).createShader(rect);
      canvas.drawArc(rect, math.pi, math.pi * pct, false, prog);
    }
    _label(canvas, '0%', Offset(center.dx - radius, center.dy + 10));
    _label(canvas, '100%', Offset(center.dx + radius, center.dy + 10));
  }
  void _label(Canvas canvas, String text, Offset at) {
    final tp = TextPainter(text: TextSpan(text: text, style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: AppColors.textFaint)), textDirection: TextDirection.ltr)..layout();
    tp.paint(canvas, at - Offset(tp.width / 2, 0));
  }
  @override
  bool shouldRepaint(covariant _GaugePainter old) => old.pct != pct;
}
