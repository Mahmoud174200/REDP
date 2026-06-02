import 'package:flutter/material.dart';
import '../../domain/entities/broker.dart';
import '../../data/datasources/acquisition_remote_datasource.dart';
import '../../data/repositories/acquisition_repository_impl.dart';

/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
/// Provider: BrokerProvider
/// State management for the Broker Dashboard screen.
/// ─────────────────────────────────────────────────────────

class BrokerProvider extends ChangeNotifier {
  final AcquisitionRepositoryImpl _repository;
  
  Broker? _broker;
  List<Commission> _commissions = [];
  String _referralLink = '';
  bool _isLoading = false;
  String? _error;

  // Metrics
  double _totalEarnings = 0;
  double _pendingAmount = 0;
  double _paidAmount = 0;
  int _activeLeads = 0;

  Broker? get broker => _broker;
  List<Commission> get commissions => _commissions;
  String get referralLink => _referralLink;
  bool get isLoading => _isLoading;
  String? get error => _error;
  double get totalEarnings => _totalEarnings;
  double get pendingAmount => _pendingAmount;
  double get paidAmount => _paidAmount;
  int get activeLeads => _activeLeads;

  BrokerProvider()
      : _repository = AcquisitionRepositoryImpl(
          remoteDataSource: AcquisitionRemoteDataSource(),
        ) {
    _loadMockData();
  }

  void _loadMockData() {
    _broker = Broker(
      id: 'b1',
      agencyName: 'Prime Realty Partners',
      agentName: 'Karim Nasser',
      email: 'karim@primerealty.com',
      phone: '+20100223344',
      referralCode: 'BRK-X4F9M2KL',
      status: 'active',
      referralUrl: 'https://redp.com/register?ref=BRK-X4F9M2KL',
    );

    _referralLink = 'https://redp.com/register?ref=BRK-X4F9M2KL';

    _commissions = [
      Commission(id: 'c1', leadName: 'Hoda Mostafa', unitId: 'A-204', ratePercent: 3.5, grossAmount: 175000, status: 'approved', createdAt: DateTime(2026, 5, 20)),
      Commission(id: 'c2', leadName: 'Karim Nasser', unitId: 'B-301', ratePercent: 3.0, grossAmount: 210000, status: 'pending', createdAt: DateTime(2026, 5, 28)),
      Commission(id: 'c3', leadName: 'Old Client Alpha', unitId: 'C-102', ratePercent: 2.5, grossAmount: 125000, status: 'paid', createdAt: DateTime(2026, 3, 15)),
      Commission(id: 'c4', leadName: 'Old Client Beta', unitId: 'D-405', ratePercent: 3.0, grossAmount: 150000, status: 'paid', createdAt: DateTime(2026, 2, 20)),
    ];

    _totalEarnings = _commissions.fold(0, (sum, c) => sum + c.grossAmount);
    _pendingAmount = _commissions.where((c) => c.status == 'pending').fold(0, (sum, c) => sum + c.grossAmount);
    _paidAmount = _commissions.where((c) => c.status == 'paid').fold(0, (sum, c) => sum + c.grossAmount);
    _activeLeads = 5;

    notifyListeners();
  }

  Future<void> fetchDashboard(String brokerId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _broker = await _repository.getBrokerProfile(brokerId);
      _commissions = await _repository.getBrokerCommissions(brokerId);
      _referralLink = await _repository.getReferralLink(brokerId);
      _calculateMetrics();
    } catch (e) {
      _error = 'Failed to load dashboard. Using offline data.';
      _loadMockData();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void _calculateMetrics() {
    _totalEarnings = _commissions.fold(0, (sum, c) => sum + c.grossAmount);
    _pendingAmount = _commissions.where((c) => c.status == 'pending').fold(0, (sum, c) => sum + c.grossAmount);
    _paidAmount = _commissions.where((c) => c.status == 'paid').fold(0, (sum, c) => sum + c.grossAmount);
  }
}
