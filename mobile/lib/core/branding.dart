import 'package:flutter/material.dart';

/// ─────────────────────────────────────────────────────────────
/// Single source of truth for the app's look — colors, imagery and
/// the Mountain View logo — so every screen stays perfectly consistent.
/// Palette mirrors the web portal design tokens (web/src/index.css).
/// ─────────────────────────────────────────────────────────────
class AppColors {
  // Surfaces
  static const bg = Color(0xFFF8FAFC);
  static const card = Colors.white;
  static const borderSoft = Color(0xFFE2E8F0);

  // Text
  static const textMain = Color(0xFF0F172A);
  static const textMuted = Color(0xFF64748B);
  static const textFaint = Color(0xFF94A3B8);

  // Mountain View brand
  static const royal = Color(0xFF003DA6);   // primary blue
  static const royalDark = Color(0xFF001A70);
  static const gold = Color(0xFFC5A880);    // champagne gold

  // Functional accents
  static const green = Color(0xFF10B981);
  static const greenDark = Color(0xFF059669);
  static const blue = Color(0xFF3B82F6);
  static const purple = Color(0xFF8B5CF6);
  static const amber = Color(0xFFF59E0B);
  static const amberDark = Color(0xFFD97706);
  static const orange = Color(0xFFEA580C);
  static const red = Color(0xFFEF4444);
}

/// Luxury compound imagery (same Unsplash set the web landing page uses).
class Branding {
  static const List<String> buildingImages = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  ];

  static const String heroImage =
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80';

  /// Deterministic image pick so a given unit always shows the same photo.
  static String imageFor(String key) {
    if (key.isEmpty) return buildingImages.first;
    final h = key.codeUnits.fold<int>(0, (a, b) => a + b);
    return buildingImages[h % buildingImages.length];
  }
}

/// The Mountain View wordmark: a gold mountain emblem + the brand name.
/// [onDark] renders white text for use over photos/dark overlays.
class MountainViewLogo extends StatelessWidget {
  final double size;
  final bool onDark;
  final bool showTagline;
  const MountainViewLogo({super.key, this.size = 30, this.onDark = false, this.showTagline = true});

  @override
  Widget build(BuildContext context) {
    final titleColor = onDark ? Colors.white : AppColors.royal;
    final subColor = onDark ? AppColors.gold : AppColors.gold;
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(
        width: size, height: size,
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [AppColors.royal, AppColors.royalDark]),
          borderRadius: BorderRadius.circular(size * 0.28),
          boxShadow: [BoxShadow(color: AppColors.royal.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 3))],
        ),
        child: CustomPaint(painter: _MountainEmblem()),
      ),
      SizedBox(width: size * 0.36),
      Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('MOUNTAIN VIEW',
            style: TextStyle(
                fontSize: size * 0.5, fontWeight: FontWeight.w800, color: titleColor, letterSpacing: size * 0.06)),
        if (showTagline)
          Text('LUXURY DEVELOPMENTS',
              style: TextStyle(
                  fontSize: size * 0.235, fontWeight: FontWeight.w700, color: subColor, letterSpacing: size * 0.09)),
      ]),
    ]);
  }
}

/// Draws a small gold mountain-peaks glyph inside the logo tile.
class _MountainEmblem extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    final p = Paint()..color = AppColors.gold..style = PaintingStyle.fill;
    final path = Path()
      ..moveTo(w * 0.16, h * 0.74)
      ..lineTo(w * 0.40, h * 0.34)
      ..lineTo(w * 0.54, h * 0.52)
      ..lineTo(w * 0.66, h * 0.30)
      ..lineTo(w * 0.86, h * 0.74)
      ..close();
    canvas.drawPath(path, p);
    // snow cap accents
    final cap = Paint()..color = Colors.white.withValues(alpha: 0.9);
    canvas.drawCircle(Offset(w * 0.66, h * 0.30), w * 0.03, cap);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// A network image that shows a branded gradient placeholder while loading
/// and a graceful fallback if it fails — no more "empty box" states.
class CompoundImage extends StatelessWidget {
  final String url;
  final double height;
  final double? width; // null → fill available width; set a value inside a Row
  final BorderRadius? radius;
  final Widget? overlay;
  const CompoundImage({super.key, required this.url, this.height = 150, this.width, this.radius, this.overlay});

  @override
  Widget build(BuildContext context) {
    final br = radius ?? BorderRadius.circular(16);
    return ClipRRect(
      borderRadius: br,
      child: SizedBox(
        height: height,
        width: width ?? double.infinity,
        child: Stack(fit: StackFit.expand, children: [
          Image.network(
            url,
            fit: BoxFit.cover,
            loadingBuilder: (ctx, child, progress) {
              if (progress == null) return child;
              return _placeholder(shimmer: true);
            },
            errorBuilder: (ctx, err, stack) => _placeholder(shimmer: false),
          ),
          if (overlay != null) overlay!,
        ]),
      ),
    );
  }

  Widget _placeholder({required bool shimmer}) => Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft, end: Alignment.bottomRight,
            colors: [Color(0xFFE8EEF7), Color(0xFFDCE6F3), Color(0xFFECE6DC)],
          ),
        ),
        child: Center(
          child: shimmer
              ? const SizedBox(width: 26, height: 26, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColors.royal))
              : Icon(Icons.apartment_rounded, size: 40, color: AppColors.royal.withValues(alpha: 0.35)),
        ),
      );
}
