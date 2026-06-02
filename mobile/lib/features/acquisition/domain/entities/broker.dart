/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
/// Domain Entity: Broker
/// Clean Architecture — Domain Layer (Pure Dart)
/// ─────────────────────────────────────────────────────────

class Broker {
  final String id;
  final String agencyName;
  final String agentName;
  final String? email;
  final String phone;
  final String referralCode;
  final String status;
  final String referralUrl;

  Broker({
    required this.id,
    required this.agencyName,
    required this.agentName,
    this.email,
    required this.phone,
    required this.referralCode,
    required this.status,
    required this.referralUrl,
  });
}

class Commission {
  final String id;
  final String leadName;
  final String? unitId;
  final double ratePercent;
  final double grossAmount;
  final String status;
  final DateTime createdAt;

  Commission({
    required this.id,
    required this.leadName,
    this.unitId,
    required this.ratePercent,
    required this.grossAmount,
    required this.status,
    required this.createdAt,
  });
}
