import '../entities/lead.dart';
import '../entities/broker.dart';

/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
/// Domain Repository: AcquisitionRepository (Abstract)
/// Clean Architecture — Domain Layer Contract
/// ─────────────────────────────────────────────────────────

abstract class AcquisitionRepository {
  // ── Leads ──
  Future<List<Lead>> getAssignedLeads();
  Future<Lead> getLeadById(String id);

  // ── Interactions ──
  Future<void> logInteraction({
    required String leadId,
    required String type,
    String? notes,
    DateTime? followUpDate,
  });

  // ── Broker ──
  Future<Broker> getBrokerProfile(String brokerId);
  Future<List<Commission>> getBrokerCommissions(String brokerId);
  Future<String> getReferralLink(String brokerId);
}
