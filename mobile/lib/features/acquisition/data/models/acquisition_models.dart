import '../../domain/entities/lead.dart';
import '../../domain/entities/broker.dart';

/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
/// Data Model: LeadModel
/// Maps JSON ↔ Domain Entity
/// ─────────────────────────────────────────────────────────

class LeadModel extends Lead {
  LeadModel({
    required super.id,
    required super.firstName,
    required super.lastName,
    super.email,
    required super.phone,
    super.nationalId,
    required super.status,
    required super.leadScore,
    super.assignedAgentName,
    required super.source,
    required super.kycStatus,
    required super.createdAt,
  });

  factory LeadModel.fromJson(Map<String, dynamic> json) {
    return LeadModel(
      id: json['id'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      email: json['email'],
      phone: json['phone'] ?? '',
      nationalId: json['national_id'],
      status: json['status'] ?? 'new',
      leadScore: json['lead_score'] ?? 0,
      assignedAgentName: json['agent']?['name'],
      source: json['source'] ?? 'direct',
      kycStatus: json['kyc_status'] ?? 'none',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }
}

/// ─────────────────────────────────────────────────────────
/// Data Model: BrokerModel
/// ─────────────────────────────────────────────────────────

class BrokerModel extends Broker {
  BrokerModel({
    required super.id,
    required super.agencyName,
    required super.agentName,
    super.email,
    required super.phone,
    required super.referralCode,
    required super.status,
    required super.referralUrl,
  });

  factory BrokerModel.fromJson(Map<String, dynamic> json) {
    return BrokerModel(
      id: json['id'] ?? '',
      agencyName: json['agency_name'] ?? '',
      agentName: json['agent_name'] ?? '',
      email: json['email'],
      phone: json['phone'] ?? '',
      referralCode: json['referral_code'] ?? '',
      status: json['status'] ?? 'pending',
      referralUrl: json['referral_url'] ?? '',
    );
  }
}

/// ─────────────────────────────────────────────────────────
/// Data Model: CommissionModel
/// ─────────────────────────────────────────────────────────

class CommissionModel extends Commission {
  CommissionModel({
    required super.id,
    required super.leadName,
    super.unitId,
    required super.ratePercent,
    required super.grossAmount,
    required super.status,
    required super.createdAt,
  });

  factory CommissionModel.fromJson(Map<String, dynamic> json) {
    return CommissionModel(
      id: json['id'] ?? '',
      leadName: json['lead']?['first_name'] != null
          ? '${json['lead']['first_name']} ${json['lead']['last_name'] ?? ''}'
          : 'N/A',
      unitId: json['unit_id'],
      ratePercent: double.tryParse(json['rate_percent']?.toString() ?? '0') ?? 0,
      grossAmount: double.tryParse(json['gross_amount']?.toString() ?? '0') ?? 0,
      status: json['status'] ?? 'pending',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }
}
