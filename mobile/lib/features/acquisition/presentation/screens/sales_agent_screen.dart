import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/sales_agent_provider.dart';
import '../../domain/entities/lead.dart';

/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
/// Screen: Sales Agent Lead & Interaction Manager
/// Provides assigned leads lists, status filters, search, 
/// and a premium bottom sheet to log interactions.
/// ─────────────────────────────────────────────────────────

class SalesAgentScreen extends StatefulWidget {
  const SalesAgentScreen({super.key});

  @override
  State<SalesAgentScreen> createState() => _SalesAgentScreenState();
}

class _SalesAgentScreenState extends State<SalesAgentScreen> {
  String _searchQuery = '';
  String _selectedStatusFilter = 'all';

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SalesAgentProvider()..fetchLeads(),
      child: Consumer<SalesAgentProvider>(
        builder: (context, provider, _) {
          // Filter leads based on search query and status filter
          final filteredLeads = provider.leads.where((lead) {
            final matchesSearch = lead.fullName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                lead.phone.contains(_searchQuery) ||
                (lead.email?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
            final matchesStatus = _selectedStatusFilter == 'all' || lead.status == _selectedStatusFilter;
            return matchesSearch && matchesStatus;
          }).toList();

          return Scaffold(
            backgroundColor: const Color(0xFF0B0F19),
            appBar: AppBar(
              title: const Text('Sales Desk', style: TextStyle(fontWeight: FontWeight.bold)),
              backgroundColor: const Color(0xFF131A2E),
              elevation: 0,
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () => provider.fetchLeads(),
                ),
              ],
            ),
            body: Column(
              children: [
                // ── Search & Filter Controls ──
                _buildSearchAndFilters(context),

                // ── Main Content Area ──
                Expanded(
                  child: provider.isLoading
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)))
                      : filteredLeads.isEmpty
                          ? _buildEmptyState()
                          : RefreshIndicator(
                              onRefresh: () => provider.fetchLeads(),
                              child: ListView.builder(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                itemCount: filteredLeads.length,
                                itemBuilder: (context, index) {
                                  return _buildLeadCard(context, filteredLeads[index], provider);
                                },
                              ),
                            ),
                ),
              ],
            ),
            floatingActionButton: FloatingActionButton.extended(
              onPressed: () => _showInteractionSheet(context, provider),
              backgroundColor: const Color(0xFF3B82F6),
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add_call),
              label: const Text('Log Interaction', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSearchAndFilters(BuildContext context) {
    final statuses = [
      {'key': 'all', 'label': 'All Leads'},
      {'key': 'new', 'label': 'New'},
      {'key': 'contacted', 'label': 'Contacted'},
      {'key': 'interested', 'label': 'Interested'},
      {'key': 'visit_scheduled', 'label': 'Visits'},
      {'key': 'negotiation', 'label': 'Negotiating'},
      {'key': 'reserved', 'label': 'Reserved'},
      {'key': 'contracted', 'label': 'Contracted'},
    ];

    return Container(
      color: const Color(0xFF131A2E),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Column(
        children: [
          // Search Field
          TextField(
            onChanged: (val) {
              setState(() {
                _searchQuery = val;
              });
            },
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search leads by name, phone or email...',
              hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
              prefixIcon: const Icon(Icons.search, color: Colors.grey),
              filled: true,
              fillColor: const Color(0xFF0B0F19),
              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.white.withOpacity(0.05)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFF3B82F6)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Filter Chips Row
          SizedBox(
            height: 36,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: statuses.length,
              itemBuilder: (context, index) {
                final item = statuses[index];
                final isSelected = _selectedStatusFilter == item['key'];
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: Text(
                      item['label']!,
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey[400],
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: const Color(0xFF3B82F6),
                    backgroundColor: const Color(0xFF0B0F19),
                    checkmarkColor: Colors.white,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedStatusFilter = item['key']!;
                        });
                      }
                    },
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: isSelected ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.05),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeadCard(BuildContext context, Lead lead, SalesAgentProvider provider) {
    Color statusColor;
    switch (lead.status) {
      case 'new': statusColor = const Color(0xFF3B82F6); break;
      case 'contacted': statusColor = const Color(0xFFA855F7); break;
      case 'interested': statusColor = const Color(0xFF06B6D4); break;
      case 'visit_scheduled': statusColor = const Color(0xFFF59E0B); break;
      case 'negotiation': statusColor = const Color(0xFFF97316); break;
      case 'reserved': statusColor = const Color(0xFF10B981); break;
      case 'contracted': statusColor = const Color(0xFF10B981); break;
      default: statusColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF131A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header Row ──
          Row(
            children: [
              // Lead Initials Circle
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    lead.fullName.split(' ').map((e) => e.isNotEmpty ? e[0] : '').join(),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Name & Status
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lead.fullName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        lead.statusLabel.toUpperCase(),
                        style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              // Lead Score Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF0B0F19),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: lead.leadScore >= 80 ? const Color(0xFF10B981).withOpacity(0.3) : Colors.white.withOpacity(0.05),
                  ),
                ),
                child: Column(
                  children: [
                    Text(
                      '${lead.leadScore}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: lead.leadScore >= 80 ? const Color(0xFF10B981) : Colors.amber[300],
                      ),
                    ),
                    const Text('SCORE', style: TextStyle(color: Colors.grey, fontSize: 8, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: Colors.white10),

          // ── Lead Meta Information ──
          Row(
            children: [
              const Icon(Icons.phone, color: Colors.grey, size: 14),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  lead.phone,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ),
              const Icon(Icons.alternate_email, color: Colors.grey, size: 14),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  lead.email ?? 'No email',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // KYC Status
              Row(
                children: [
                  Icon(
                    lead.kycStatus == 'verified'
                        ? Icons.verified_user
                        : lead.kycStatus == 'pending'
                            ? Icons.hourglass_top
                            : Icons.gpp_bad,
                    color: lead.kycStatus == 'verified'
                        ? const Color(0xFF10B981)
                        : lead.kycStatus == 'pending'
                            ? Colors.amber
                            : Colors.red[300],
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'KYC: ${lead.kycStatus.toUpperCase()}',
                    style: TextStyle(
                      color: lead.kycStatus == 'verified'
                          ? const Color(0xFF10B981)
                          : lead.kycStatus == 'pending'
                              ? Colors.amber
                              : Colors.red[300],
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              // Lead Source
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black26,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Source: ${lead.source.toUpperCase()}',
                      style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 12),
          // ── Fast Call & Log CTA ──
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // Trigger dialer call simulation
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Simulating VoIP Call to ${lead.fullName}...'),
                        backgroundColor: const Color(0xFF3B82F6),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  icon: const Icon(Icons.phone_in_talk, size: 14),
                  label: const Text('Call Lead'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF3B82F6),
                    side: const BorderSide(color: Color(0xFF3B82F6)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _showInteractionSheet(context, provider, preselectedLeadId: lead.id),
                  icon: const Icon(Icons.add, size: 14),
                  label: const Text('Add Note'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E3A5F),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 64, color: Colors.grey[800]),
          const SizedBox(height: 16),
          const Text(
            'No Leads Found',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white70),
          ),
          const SizedBox(height: 8),
          const Text(
            'Try widening your search query or status filter.',
            style: TextStyle(color: Colors.grey, fontSize: 13),
          ),
        ],
      ),
    );
  }

  void _showInteractionSheet(BuildContext context, SalesAgentProvider provider, {String? preselectedLeadId}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _InteractionFormSheet(
          provider: provider,
          preselectedLeadId: preselectedLeadId,
        );
      },
    );
  }
}

class _InteractionFormSheet extends StatefulWidget {
  final SalesAgentProvider provider;
  final String? preselectedLeadId;

  const _InteractionFormSheet({required this.provider, this.preselectedLeadId});

  @override
  State<_InteractionFormSheet> createState() => _InteractionFormSheetState();
}

class _InteractionFormSheetState extends State<_InteractionFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late String _selectedLeadId;
  String _selectedType = 'call';
  final _notesController = TextEditingController();
  DateTime? _followUpDate;

  @override
  void initState() {
    super.initState();
    _selectedLeadId = widget.preselectedLeadId ?? 
        (widget.provider.leads.isNotEmpty ? widget.provider.leads.first.id : '');
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final leads = widget.provider.leads;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF131A2E),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Pull Bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const Text(
                'Log Client Interaction',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 20),

              // Lead Dropdown Selector
              const Text('Select Client', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (leads.isEmpty)
                const Text('No active leads found to log against.', style: TextStyle(color: Colors.red))
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0B0F19),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedLeadId,
                      dropdownColor: const Color(0xFF131A2E),
                      isExpanded: true,
                      style: const TextStyle(color: Colors.white),
                      items: leads.map((lead) {
                        return DropdownMenuItem<String>(
                          value: lead.id,
                          child: Text(lead.fullName),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedLeadId = val;
                          });
                        }
                      },
                    ),
                  ),
                ),
              const SizedBox(height: 16),

              // Interaction Type
              const Text('Interaction Type', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildTypeButton('call', Icons.phone, 'Call'),
                  const SizedBox(width: 8),
                  _buildTypeButton('whatsapp', Icons.chat, 'WhatsApp'),
                  const SizedBox(width: 8),
                  _buildTypeButton('meeting', Icons.groups, 'Meeting'),
                  const SizedBox(width: 8),
                  _buildTypeButton('email', Icons.email, 'Email'),
                ],
              ),
              const SizedBox(height: 16),

              // Follow Up Date Picker
              const Text('Follow-Up Date (Optional)', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now().add(const Duration(days: 1)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: const ColorScheme.dark(
                            primary: Color(0xFF3B82F6),
                            onPrimary: Colors.white,
                            surface: Color(0xFF131A2E),
                            onSurface: Colors.white,
                          ),
                        ),
                        child: child!,
                      );
                    },
                  );
                  if (picked != null) {
                    setState(() {
                      _followUpDate = picked;
                    });
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0B0F19),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _followUpDate == null
                            ? 'Select a follow-up date...'
                            : '${_followUpDate!.year}-${_followUpDate!.month.toString().padLeft(2, '0')}-${_followUpDate!.day.toString().padLeft(2, '0')}',
                        style: TextStyle(
                          color: _followUpDate == null ? Colors.grey : Colors.white,
                          fontSize: 14,
                        ),
                      ),
                      const Icon(Icons.calendar_month, color: Colors.grey),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Notes Input
              const Text('Discussion & Summary Notes', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _notesController,
                maxLines: 4,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter interaction summary notes';
                  }
                  return null;
                },
                decoration: InputDecoration(
                  hintText: 'Enter discussion details, requirements, next steps...',
                  hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                  filled: true,
                  fillColor: const Color(0xFF0B0F19),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.white.withOpacity(0.05)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF3B82F6)),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Submit Button
              ElevatedButton(
                onPressed: () async {
                  if (_formKey.currentState!.validate() && _selectedLeadId.isNotEmpty) {
                    final success = await widget.provider.logInteraction(
                      leadId: _selectedLeadId,
                      type: _selectedType,
                      notes: _notesController.text,
                      followUpDate: _followUpDate,
                    );
                    if (success && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: const Text('Interaction logged successfully!'),
                          backgroundColor: const Color(0xFF10B981),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      );
                      Navigator.pop(context);
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Log Discussion', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeButton(String key, IconData icon, String label) {
    final isSelected = _selectedType == key;
    Color color;
    switch (key) {
      case 'call': color = const Color(0xFF3B82F6); break;
      case 'whatsapp': color = const Color(0xFF10B981); break;
      case 'meeting': color = const Color(0xFFA855F7); break;
      case 'email': color = const Color(0xFF06B6D4); break;
      default: color = Colors.grey;
    }

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedType = key;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? color.withOpacity(0.15) : const Color(0xFF0B0F19),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : Colors.white.withOpacity(0.05),
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? color : Colors.grey, size: 20),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey,
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
