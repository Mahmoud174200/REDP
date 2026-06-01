/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Developer 1: Ragab)
/// Domain Entity: Lead
/// Clean Architecture — Domain Layer (Pure Dart)
/// ─────────────────────────────────────────────────────────

class Lead {
  final String id;
  final String firstName;
  final String lastName;
  final String? email;
  final String phone;
  final String? nationalId;
  final String status;
  final int leadScore;
  final String? assignedAgentName;
  final String source;
  final String kycStatus;
  final DateTime createdAt;

  Lead({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    required this.phone,
    this.nationalId,
    required this.status,
    required this.leadScore,
    this.assignedAgentName,
    required this.source,
    required this.kycStatus,
    required this.createdAt,
  });

  String get fullName => '$firstName $lastName'.trim();

  String get statusLabel {
    switch (status) {
      case 'new': return 'New';
      case 'contacted': return 'Contacted';
      case 'interested': return 'Interested';
      case 'visit_scheduled': return 'Visit Scheduled';
      case 'negotiation': return 'Negotiation';
      case 'reserved': return 'Reserved';
      case 'contracted': return 'Contracted';
      default: return status;
    }
  }
}
