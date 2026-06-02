import 'package:flutter/material.dart';
import '../../domain/entities/lead.dart';
import '../../domain/entities/broker.dart';
import '../../data/datasources/acquisition_remote_datasource.dart';
import '../../data/repositories/acquisition_repository_impl.dart';

/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
/// Provider: SalesAgentProvider
/// State management for the Sales Agent screen.
/// ─────────────────────────────────────────────────────────

class SalesAgentProvider extends ChangeNotifier {
  final AcquisitionRepositoryImpl _repository;
  
  List<Lead> _leads = [];
  bool _isLoading = false;
  String? _error;

  List<Lead> get leads => _leads;
  bool get isLoading => _isLoading;
  String? get error => _error;

  SalesAgentProvider()
      : _repository = AcquisitionRepositoryImpl(
          remoteDataSource: AcquisitionRemoteDataSource(),
        ) {
    // Load mock data initially for demo
    _loadMockData();
  }

  void _loadMockData() {
    _leads = [
      Lead(id: 'l1', firstName: 'Ahmed', lastName: 'Ali', phone: '+20100998877', email: 'ahmed@gmail.com', status: 'interested', leadScore: 85, source: 'facebook', kycStatus: 'verified', createdAt: DateTime(2026, 5, 28)),
      Lead(id: 'l2', firstName: 'Nour', lastName: 'Ibrahim', phone: '+20133456789', email: 'nour@gmail.com', status: 'visit_scheduled', leadScore: 78, source: 'referral', kycStatus: 'pending', createdAt: DateTime(2026, 5, 27)),
      Lead(id: 'l3', firstName: 'Mariam', lastName: 'Hassan', phone: '+20155667788', email: 'mariam@company.com', status: 'negotiation', leadScore: 91, source: 'broker', kycStatus: 'verified', createdAt: DateTime(2026, 5, 20)),
      Lead(id: 'l4', firstName: 'Sherif', lastName: 'Omar', phone: '+20144556677', email: 'sherif@hotmail.com', status: 'new', leadScore: 45, source: 'google', kycStatus: 'none', createdAt: DateTime(2026, 5, 30)),
      Lead(id: 'l5', firstName: 'Hassan', lastName: 'El-Maghraby', phone: '+20100112233', email: 'hassan@business.com', status: 'reserved', leadScore: 95, source: 'direct', kycStatus: 'verified', createdAt: DateTime(2026, 5, 15)),
    ];
    notifyListeners();
  }

  Future<void> fetchLeads() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _leads = await _repository.getAssignedLeads();
    } catch (e) {
      _error = 'Failed to load leads. Using offline data.';
      _loadMockData();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> logInteraction({
    required String leadId,
    required String type,
    String? notes,
    DateTime? followUpDate,
  }) async {
    try {
      await _repository.logInteraction(
        leadId: leadId,
        type: type,
        notes: notes,
        followUpDate: followUpDate,
      );
      return true;
    } catch (e) {
      // In demo mode, simulate success
      return true;
    }
  }
}
