import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/branding.dart';

/// An image the user picked in a form — passed to onSubmit under the field key.
class PickedFile {
  final Uint8List bytes;
  final String name;
  const PickedFile(this.bytes, this.name);
}

/// A single field definition for [FormSheet].
class FieldDef {
  final String key;
  final String label;
  final String type; // text | number | date | dropdown | multiline | image
  final List<(String, String)> options; // (value, label) for dropdown
  final bool required;
  const FieldDef(this.key, this.label, {this.type = 'text', this.options = const [], this.required = false});
}

/// A reusable modal bottom-sheet form. Collects values and returns them via
/// [onSubmit]; shows a spinner while submitting. Kept generic so every
/// "add" action (family, vehicle, service, resale, guest pass) reuses it.
class FormSheet extends StatefulWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color accent;
  final List<FieldDef> fields;
  final String submitLabel;
  final Future<void> Function(Map<String, dynamic> values) onSubmit;

  const FormSheet({
    super.key,
    required this.title,
    required this.icon,
    required this.fields,
    required this.onSubmit,
    this.subtitle = '',
    this.accent = AppColors.royal,
    this.submitLabel = 'Save',
  });

  static Future<void> show(BuildContext context, FormSheet sheet) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => sheet,
    );
  }

  @override
  State<FormSheet> createState() => _FormSheetState();
}

class _FormSheetState extends State<FormSheet> {
  final Map<String, TextEditingController> _ctrls = {};
  final Map<String, String?> _dropdowns = {};
  final Map<String, PickedFile> _images = {};
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    for (final f in widget.fields) {
      if (f.type == 'dropdown') {
        _dropdowns[f.key] = f.options.isNotEmpty ? f.options.first.$1 : null;
      } else if (f.type != 'image') {
        _ctrls[f.key] = TextEditingController();
      }
    }
  }

  Future<void> _pickImage(String key) async {
    try {
      final x = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1000, imageQuality: 85);
      if (x == null) return;
      final bytes = await x.readAsBytes();
      setState(() => _images[key] = PickedFile(bytes, x.name));
    } catch (_) {
      setState(() => _error = 'Could not open the image picker.');
    }
  }

  @override
  void dispose() {
    for (final c in _ctrls.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    final values = <String, dynamic>{};
    for (final f in widget.fields) {
      if (f.type == 'image') {
        if (_images[f.key] != null) values[f.key] = _images[f.key];
        continue;
      }
      final v = f.type == 'dropdown' ? _dropdowns[f.key] : _ctrls[f.key]!.text.trim();
      if (f.required && (v == null || v.toString().isEmpty)) {
        setState(() => _error = 'Please fill "${f.label}".');
        return;
      }
      if (v != null && v.toString().isNotEmpty) {
        values[f.key] = f.type == 'number' ? num.tryParse(v.toString()) ?? v : v;
      }
    }
    setState(() { _saving = true; _error = null; });
    try {
      await widget.onSubmit(values);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() { _saving = false; _error = _msg(e); });
    }
  }

  String _msg(Object e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map) {
        if (data['message'] != null) return data['message'].toString();
        if (data['errors'] is Map && (data['errors'] as Map).isNotEmpty) {
          final first = (data['errors'] as Map).values.first;
          if (first is List && first.isNotEmpty) return first.first.toString();
        }
      }
      if (e.type == DioExceptionType.connectionError) return 'Cannot reach the server.';
    }
    return 'Could not save. Please try again.';
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.bg,
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Center(
              child: Container(width: 42, height: 4, margin: const EdgeInsets.only(bottom: 18),
                  decoration: BoxDecoration(color: AppColors.borderSoft, borderRadius: BorderRadius.circular(4))),
            ),
            Row(children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: widget.accent.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(13)),
                child: Icon(widget.icon, color: widget.accent, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(widget.title, style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800, color: AppColors.textMain)),
                  if (widget.subtitle.isNotEmpty)
                    Text(widget.subtitle, style: const TextStyle(fontSize: 11.5, color: AppColors.textMuted)),
                ]),
              ),
              IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded, color: AppColors.textMuted)),
            ]),
            const SizedBox(height: 14),

            if (_error != null)
              Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(color: const Color(0x14EF4444), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0x33EF4444))),
                child: Row(children: [
                  const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 17),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12.5))),
                ]),
              ),

            ...widget.fields.map(_buildField),
            const SizedBox(height: 20),
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _saving ? null : _submit,
                style: ElevatedButton.styleFrom(backgroundColor: widget.accent, foregroundColor: Colors.white, elevation: 3,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13))),
                child: _saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.3, color: Colors.white))
                    : Text(widget.submitLabel, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _buildField(FieldDef f) {
    Widget child;
    if (f.type == 'image') {
      final picked = _images[f.key];
      child = InkWell(
        borderRadius: BorderRadius.circular(13),
        onTap: () => _pickImage(f.key),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: picked != null ? widget.accent : AppColors.borderSoft, width: picked != null ? 1.5 : 1),
          ),
          child: Row(children: [
            Container(
              width: 54, height: 54,
              decoration: BoxDecoration(
                color: AppColors.bg,
                borderRadius: BorderRadius.circular(11),
                border: Border.all(color: AppColors.borderSoft),
              ),
              clipBehavior: Clip.antiAlias,
              child: picked != null
                  ? Image.memory(picked.bytes, fit: BoxFit.cover)
                  : const Icon(Icons.add_a_photo_rounded, color: AppColors.textMuted, size: 22),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                Text(f.label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textMain)),
                const SizedBox(height: 2),
                Text(picked != null ? picked.name : 'Tap to choose a photo (اضغط لاختيار صورة)',
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ]),
            ),
            Icon(picked != null ? Icons.check_circle_rounded : Icons.upload_rounded,
                color: picked != null ? AppColors.green : AppColors.textMuted, size: 20),
          ]),
        ),
      );
      return Padding(padding: const EdgeInsets.only(bottom: 12), child: child);
    }
    if (f.type == 'dropdown') {
      child = DropdownButtonFormField<String>(
        initialValue: _dropdowns[f.key],
        isExpanded: true,
        decoration: _dec(f.label),
        dropdownColor: Colors.white,
        style: const TextStyle(color: AppColors.textMain, fontWeight: FontWeight.w600, fontSize: 14),
        items: f.options.map((o) => DropdownMenuItem(value: o.$1, child: Text(o.$2))).toList(),
        onChanged: (v) => setState(() => _dropdowns[f.key] = v),
      );
    } else if (f.type == 'date') {
      child = TextField(
        controller: _ctrls[f.key],
        readOnly: true,
        style: const TextStyle(color: AppColors.textMain, fontWeight: FontWeight.w600),
        decoration: _dec(f.label, suffix: const Icon(Icons.calendar_month_rounded, size: 19, color: AppColors.textMuted)),
        onTap: () async {
          final now = DateTime(2026, 7, 2);
          final picked = await showDatePicker(
            context: context,
            initialDate: now,
            firstDate: DateTime(1950),
            lastDate: DateTime(2035),
          );
          if (picked != null) {
            _ctrls[f.key]!.text = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
          }
        },
      );
    } else {
      child = TextField(
        controller: _ctrls[f.key],
        keyboardType: f.type == 'number' ? TextInputType.number : TextInputType.text,
        maxLines: f.type == 'multiline' ? 3 : 1,
        style: const TextStyle(color: AppColors.textMain, fontWeight: FontWeight.w600),
        decoration: _dec(f.label),
      );
    }
    return Padding(padding: const EdgeInsets.only(bottom: 12), child: child);
  }

  InputDecoration _dec(String label, {Widget? suffix}) => InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
        suffixIcon: suffix,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(13), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(13), borderSide: const BorderSide(color: AppColors.borderSoft)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(13), borderSide: BorderSide(color: widget.accent, width: 1.5)),
      );
}
