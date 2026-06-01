import '../entities/lead.dart';
import '../repositories/acquisition_repository.dart';

/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Developer 1: Ragab)
/// Use Case: GetAssignedLeads
/// Clean Architecture — Domain Layer
/// ─────────────────────────────────────────────────────────

class GetAssignedLeads {
  final AcquisitionRepository repository;

  GetAssignedLeads(this.repository);

  Future<List<Lead>> call() async {
    return await repository.getAssignedLeads();
  }
}

/// ─────────────────────────────────────────────────────────
/// Use Case: LogInteraction
/// ─────────────────────────────────────────────────────────

class LogInteraction {
  final AcquisitionRepository repository;

  LogInteraction(this.repository);

  Future<void> call({
    required String leadId,
    required String type,
    String? notes,
    DateTime? followUpDate,
  }) async {
    return await repository.logInteraction(
      leadId: leadId,
      type: type,
      notes: notes,
      followUpDate: followUpDate,
    );
  }
}

/// ─────────────────────────────────────────────────────────
/// Use Case: GetBrokerDashboard
/// ─────────────────────────────────────────────────────────

class GetBrokerDashboard {
  final AcquisitionRepository repository;

  GetBrokerDashboard(this.repository);

  Future<Map<String, dynamic>> call(String brokerId) async {
    final broker = await repository.getBrokerProfile(brokerId);
    final commissions = await repository.getBrokerCommissions(brokerId);
    final referralLink = await repository.getReferralLink(brokerId);

    return {
      'broker': broker,
      'commissions': commissions,
      'referral_link': referralLink,
    };
  }
}
