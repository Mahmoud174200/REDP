import '../../domain/entities/lead.dart';
import '../../domain/entities/broker.dart';
import '../../domain/repositories/acquisition_repository.dart';
import '../datasources/acquisition_remote_datasource.dart';

/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Developer 1: Ragab)
/// Repository Implementation
/// Clean Architecture — Data Layer
/// ─────────────────────────────────────────────────────────

class AcquisitionRepositoryImpl implements AcquisitionRepository {
  final AcquisitionRemoteDataSource remoteDataSource;

  AcquisitionRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<Lead>> getAssignedLeads() async {
    return await remoteDataSource.getAssignedLeads();
  }

  @override
  Future<Lead> getLeadById(String id) async {
    return await remoteDataSource.getLeadById(id);
  }

  @override
  Future<void> logInteraction({
    required String leadId,
    required String type,
    String? notes,
    DateTime? followUpDate,
  }) async {
    return await remoteDataSource.logInteraction(
      leadId: leadId,
      type: type,
      notes: notes,
      followUpDate: followUpDate,
    );
  }

  @override
  Future<Broker> getBrokerProfile(String brokerId) async {
    return await remoteDataSource.getBrokerProfile(brokerId);
  }

  @override
  Future<List<Commission>> getBrokerCommissions(String brokerId) async {
    return await remoteDataSource.getBrokerCommissions(brokerId);
  }

  @override
  Future<String> getReferralLink(String brokerId) async {
    return await remoteDataSource.getReferralLink(brokerId);
  }
}
