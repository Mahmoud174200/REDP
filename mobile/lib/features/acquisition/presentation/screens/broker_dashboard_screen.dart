import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/broker_provider.dart';

/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
/// Screen: Broker Dashboard
/// Shows referral links, total earnings, client pipeline,
/// and commission tracker.
/// ─────────────────────────────────────────────────────────

class BrokerDashboardScreen extends StatelessWidget {
  const BrokerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => BrokerProvider(),
      child: const _BrokerDashboardContent(),
    );
  }
}

class _BrokerDashboardContent extends StatelessWidget {
  const _BrokerDashboardContent();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BrokerProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        title: const Text('Broker Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF131A2E),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => provider.fetchDashboard('b1'),
          ),
        ],
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)))
          : RefreshIndicator(
              onRefresh: () => provider.fetchDashboard('b1'),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Referral Link Card ──
                    _buildReferralCard(context, provider),
                    const SizedBox(height: 20),

                    // ── Metrics Grid ──
                    _buildMetricsGrid(provider),
                    const SizedBox(height: 24),

                    // ── Active Clients Pipeline ──
                    _buildSectionTitle('Active Clients Pipeline'),
                    const SizedBox(height: 12),
                    _buildClientsPipeline(),
                    const SizedBox(height: 24),

                    // ── Commissions Tracker ──
                    _buildSectionTitle('Commission History'),
                    const SizedBox(height: 12),
                    ...provider.commissions.map((c) => _buildCommissionCard(c)),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildReferralCard(BuildContext context, BrokerProvider provider) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E3A5F), Color(0xFF131A2E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.link, color: Color(0xFF3B82F6), size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Your Referral Link',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('ACTIVE', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.3),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    provider.referralLink,
                    style: TextStyle(color: Colors.blue[300], fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: provider.referralLink));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Referral link copied!'),
                        backgroundColor: const Color(0xFF10B981),
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.copy, color: Colors.white, size: 16),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Share Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                // Trigger native share sheet
                Clipboard.setData(ClipboardData(text: provider.referralLink));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Link ready to share!')),
                );
              },
              icon: const Icon(Icons.share, size: 18),
              label: const Text('Share Referral Code', style: TextStyle(fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsGrid(BrokerProvider provider) {
    final metrics = [
      _MetricData('Total Earnings', '${(provider.totalEarnings / 1000).toStringAsFixed(0)}K', const Color(0xFF3B82F6), Icons.account_balance_wallet),
      _MetricData('Pending', '${(provider.pendingAmount / 1000).toStringAsFixed(0)}K', const Color(0xFFF59E0B), Icons.hourglass_bottom),
      _MetricData('Paid Out', '${(provider.paidAmount / 1000).toStringAsFixed(0)}K', const Color(0xFF10B981), Icons.check_circle),
      _MetricData('Active Leads', '${provider.activeLeads}', const Color(0xFFA855F7), Icons.people),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: metrics.map((m) => _buildMetricCard(m)).toList(),
    );
  }

  Widget _buildMetricCard(_MetricData metric) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF131A2E),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: metric.color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(metric.icon, color: metric.color, size: 22),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${metric.value} EGP',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: metric.color),
              ),
              Text(metric.label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold));
  }

  Widget _buildClientsPipeline() {
    final clients = [
      {'name': 'Mohamed El-Sayed', 'status': 'Interested', 'days': 67, 'color': const Color(0xFFF59E0B)},
      {'name': 'Fatima Abdallah', 'status': 'Visit Scheduled', 'days': 45, 'color': const Color(0xFF06B6D4)},
      {'name': 'Karim Nasser', 'status': 'Negotiation', 'days': 32, 'color': const Color(0xFFF97316)},
      {'name': 'Hoda Mostafa', 'status': 'Reserved', 'days': 78, 'color': const Color(0xFF10B981)},
    ];

    return Column(
      children: clients.map((client) {
        final days = client['days'] as int;
        final progress = days / 90;
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF131A2E),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: (client['color'] as Color).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    (client['name'] as String).split(' ').map((w) => w[0]).join(),
                    style: TextStyle(color: client['color'] as Color, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(client['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: (client['color'] as Color).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(client['status'] as String, style: TextStyle(fontSize: 10, color: client['color'] as Color, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${days}d left', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: progress > 0.5 ? const Color(0xFF10B981) : const Color(0xFFF59E0B))),
                  const SizedBox(height: 4),
                  SizedBox(
                    width: 50,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.white.withOpacity(0.05),
                        valueColor: AlwaysStoppedAnimation(progress > 0.5 ? const Color(0xFF10B981) : const Color(0xFFF59E0B)),
                        minHeight: 4,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildCommissionCard(dynamic commission) {
    Color statusColor;
    IconData statusIcon;
    switch (commission.status) {
      case 'paid':
        statusColor = const Color(0xFF10B981);
        statusIcon = Icons.check_circle;
        break;
      case 'approved':
        statusColor = const Color(0xFF3B82F6);
        statusIcon = Icons.thumb_up;
        break;
      default:
        statusColor = const Color(0xFFF59E0B);
        statusIcon = Icons.hourglass_bottom;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF131A2E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(statusIcon, color: statusColor, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(commission.leadName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                Text('Unit ${commission.unitId ?? 'N/A'} • ${commission.ratePercent}%',
                    style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${(commission.grossAmount / 1000).toStringAsFixed(0)}K EGP',
                  style: TextStyle(fontWeight: FontWeight.bold, color: statusColor, fontSize: 14)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(commission.status.toString().toUpperCase(),
                    style: TextStyle(fontSize: 9, color: statusColor, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricData {
  final String label;
  final String value;
  final Color color;
  final IconData icon;
  _MetricData(this.label, this.value, this.color, this.icon);
}
