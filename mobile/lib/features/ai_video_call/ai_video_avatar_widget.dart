// ==============================================================================
// MAHMAS LANGUAGE — AI VIDEO AVATAR WIDGET
// Interactive procedural 2D canvas avatar syncing mouth visemes, blinking, & emotions
// ==============================================================================

import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/models/ai_tutor_model.dart';
import '../../core/models/ai_video_call_model.dart';

class AIVideoAvatarWidget extends StatefulWidget {
  final AICharacterModel character;
  final AvatarEmotion emotion;
  final VisemeType currentViseme;
  final bool isSpeaking;
  final double size;

  const AIVideoAvatarWidget({
    super.key,
    required this.character,
    this.emotion = AvatarEmotion.neutral,
    this.currentViseme = VisemeType.rest,
    this.isSpeaking = false,
    this.size = 280,
  });

  @override
  State<AIVideoAvatarWidget> createState() => _AIVideoAvatarWidgetState();
}

class _AIVideoAvatarWidgetState extends State<AIVideoAvatarWidget>
    with TickerProviderStateMixin {
  late final AnimationController _breathController;
  late final AnimationController _blinkController;
  late final AnimationController _visemeTransitionController;
  Timer? _blinkTimer;

  @override
  void initState() {
    super.initState();

    // Idle breathing & gentle head bob
    _breathController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    )..repeat(reverse: true);

    // Periodic eye-blinking loop
    _blinkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 180),
    );

    _scheduleNextBlink();

    _visemeTransitionController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 90),
    );
  }

  void _scheduleNextBlink() {
    _blinkTimer?.cancel();
    _blinkTimer = Timer(Duration(milliseconds: 2500 + math.Random().nextInt(2000)), () {
      if (mounted) {
        _blinkController.forward().then((_) {
          if (mounted) {
            _blinkController.reverse().then((_) {
              if (mounted) _scheduleNextBlink();
            });
          }
        });
      }
    });
  }

  @override
  void didUpdateWidget(covariant AIVideoAvatarWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentViseme != widget.currentViseme) {
      _visemeTransitionController.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _blinkTimer?.cancel();
    _breathController.dispose();
    _blinkController.dispose();
    _visemeTransitionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([
        _breathController,
        _blinkController,
        _visemeTransitionController,
      ]),
      builder: (context, child) {
        final breathOffset = math.sin(_breathController.value * math.pi * 2) * 4.0;
        final blinkValue = _blinkController.value;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Floating emotion pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _getEmotionColor(widget.emotion).withValues(alpha: 0.6),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _getEmotionColor(widget.emotion).withValues(alpha: 0.25),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.emotion.displayName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (widget.isSpeaking) ...[
                    const SizedBox(width: 6),
                    const Icon(
                      Icons.volume_up_rounded,
                      color: Colors.tealAccent,
                      size: 14,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Procedural Avatar Canvas
            Transform.translate(
              offset: Offset(0, breathOffset),
              child: CustomPaint(
                size: Size(widget.size, widget.size),
                painter: _AvatarPainter(
                  characterName: widget.character.name,
                  emotion: widget.emotion,
                  viseme: widget.currentViseme,
                  blinkProgress: blinkValue,
                  breathProgress: _breathController.value,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Color _getEmotionColor(AvatarEmotion emotion) {
    switch (emotion) {
      case AvatarEmotion.celebrating:
        return Colors.amberAccent;
      case AvatarEmotion.happy:
        return Colors.greenAccent;
      case AvatarEmotion.encouraging:
        return Colors.tealAccent;
      case AvatarEmotion.thoughtful:
        return Colors.purpleAccent;
      case AvatarEmotion.surprised:
        return Colors.orangeAccent;
      case AvatarEmotion.neutral:
        return Colors.blueAccent;
    }
  }
}

class _AvatarPainter extends CustomPainter {
  final String characterName;
  final AvatarEmotion emotion;
  final VisemeType viseme;
  final double blinkProgress;
  final double breathProgress;

  _AvatarPainter({
    required this.characterName,
    required this.emotion,
    required this.viseme,
    required this.blinkProgress,
    required this.breathProgress,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Character Styling Profiles
    final isMateo = characterName.contains('Mateo');
    final isElena = characterName.contains('Elena');
    final isSofia = characterName.contains('Sofia');

    final skinColor = isMateo
        ? const Color(0xFFE8B298)
        : isSofia
            ? const Color(0xFFF3C29E)
            : isElena
                ? const Color(0xFFF7D5BA)
                : const Color(0xFFE2A789);

    final hairColor = isMateo
        ? const Color(0xFF2B1D0F)
        : isElena
            ? const Color(0xFF422C1D)
            : isSofia
                ? const Color(0xFF7A3615)
                : const Color(0xFF1E293B);

    final shirtColor = isMateo
        ? const Color(0xFF0F766E)
        : isElena
            ? const Color(0xFF4F46E5)
            : isSofia
                ? const Color(0xFFD97706)
                : const Color(0xFF2563EB);

    // 1. Draw Shoulders & Torso
    final bodyPaint = Paint()..color = shirtColor;
    final bodyRect = Rect.fromCenter(
      center: Offset(center.dx, size.height * 0.95),
      width: size.width * 0.90,
      height: size.height * 0.40,
    );
    canvas.drawRRect(RRect.fromRectAndRadius(bodyRect, const Radius.circular(50)), bodyPaint);

    // 2. Draw Neck
    final neckPaint = Paint()..color = skinColor;
    final neckRect = Rect.fromCenter(
      center: Offset(center.dx, size.height * 0.68),
      width: size.width * 0.28,
      height: size.height * 0.22,
    );
    canvas.drawRRect(RRect.fromRectAndRadius(neckRect, const Radius.circular(14)), neckPaint);

    // 3. Draw Hair Back Layer
    final hairPaint = Paint()..color = hairColor;
    canvas.drawCircle(Offset(center.dx, center.dy - 10), radius * 0.65, hairPaint);

    // 4. Draw Face Shape
    final facePaint = Paint()..color = skinColor;
    final faceRect = Rect.fromCenter(
      center: Offset(center.dx, center.dy - 6),
      width: size.width * 0.58,
      height: size.height * 0.66,
    );
    canvas.drawOval(faceRect, facePaint);

    // 5. Draw Eyebrows based on emotion
    final browPaint = Paint()
      ..color = hairColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;

    final browY = center.dy - (size.height * 0.16);
    final browSpacing = size.width * 0.14;

    double leftBrowTilt = 0;
    double rightBrowTilt = 0;
    if (emotion == AvatarEmotion.thoughtful) {
      leftBrowTilt = -4;
      rightBrowTilt = 4;
    } else if (emotion == AvatarEmotion.surprised || emotion == AvatarEmotion.celebrating) {
      leftBrowTilt = -5;
      rightBrowTilt = -5;
    }

    // Left eyebrow
    canvas.drawLine(
      Offset(center.dx - browSpacing - 18, browY + leftBrowTilt),
      Offset(center.dx - browSpacing + 18, browY - leftBrowTilt),
      browPaint,
    );
    // Right eyebrow
    canvas.drawLine(
      Offset(center.dx + browSpacing - 18, browY - rightBrowTilt),
      Offset(center.dx + browSpacing + 18, browY + rightBrowTilt),
      browPaint,
    );

    // 6. Draw Eyes (with natural blink animation)
    final eyeY = center.dy - (size.height * 0.08);
    final eyeSpacing = size.width * 0.14;
    final eyeHeight = math.max(1.0, 10.0 * (1.0 - blinkProgress));

    if (blinkProgress > 0.8) {
      // Closed eye slit
      final closeEyePaint = Paint()
        ..color = Colors.black87
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5;
      canvas.drawLine(Offset(center.dx - eyeSpacing - 10, eyeY), Offset(center.dx - eyeSpacing + 10, eyeY), closeEyePaint);
      canvas.drawLine(Offset(center.dx + eyeSpacing - 10, eyeY), Offset(center.dx + eyeSpacing + 10, eyeY), closeEyePaint);
    } else {
      // Eye White Sclera
      final eyeWhitePaint = Paint()..color = Colors.white;
      canvas.drawOval(Rect.fromCenter(center: Offset(center.dx - eyeSpacing, eyeY), width: 22, height: eyeHeight), eyeWhitePaint);
      canvas.drawOval(Rect.fromCenter(center: Offset(center.dx + eyeSpacing, eyeY), width: 22, height: eyeHeight), eyeWhitePaint);

      // Pupils (Iris)
      final pupilPaint = Paint()..color = const Color(0xFF1E293B);
      canvas.drawCircle(Offset(center.dx - eyeSpacing, eyeY), math.min(6.0, eyeHeight / 2), pupilPaint);
      canvas.drawCircle(Offset(center.dx + eyeSpacing, eyeY), math.min(6.0, eyeHeight / 2), pupilPaint);

      // Pupil Light Reflection Sparkle
      final sparklePaint = Paint()..color = Colors.white;
      canvas.drawCircle(Offset(center.dx - eyeSpacing - 2, eyeY - 2), 1.8, sparklePaint);
      canvas.drawCircle(Offset(center.dx + eyeSpacing - 2, eyeY - 2), 1.8, sparklePaint);
    }

    // 7. Cheeks Blush (Happy & Celebrating)
    if (emotion == AvatarEmotion.happy || emotion == AvatarEmotion.celebrating || emotion == AvatarEmotion.encouraging) {
      final blushPaint = Paint()..color = const Color(0xFFF43F5E).withValues(alpha: 0.28);
      canvas.drawCircle(Offset(center.dx - (size.width * 0.18), center.dy), 12, blushPaint);
      canvas.drawCircle(Offset(center.dx + (size.width * 0.18), center.dy), 12, blushPaint);
    }

    // 8. Nose
    final nosePaint = Paint()
      ..color = const Color(0xFF94A3B8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;
    final nosePath = Path()
      ..moveTo(center.dx, center.dy - 6)
      ..lineTo(center.dx - 2, center.dy + 8)
      ..lineTo(center.dx + 4, center.dy + 8);
    canvas.drawPath(nosePath, nosePaint);

    // 9. Mouth Visemes Lip-Sync Articulation
    final mouthY = center.dy + (size.height * 0.14);
    _drawVisemeMouth(canvas, Offset(center.dx, mouthY), viseme, emotion);

    // 10. Front Hair / Bangs
    final frontHairPath = Path();
    if (isMateo) {
      frontHairPath.moveTo(center.dx - 55, center.dy - 60);
      frontHairPath.quadraticBezierTo(center.dx, center.dy - 90, center.dx + 55, center.dy - 60);
      frontHairPath.lineTo(center.dx + 65, center.dy - 70);
      frontHairPath.quadraticBezierTo(center.dx, center.dy - 110, center.dx - 65, center.dy - 70);
    } else {
      frontHairPath.moveTo(center.dx - 70, center.dy - 55);
      frontHairPath.quadraticBezierTo(center.dx - 20, center.dy - 40, center.dx + 70, center.dy - 60);
      frontHairPath.lineTo(center.dx + 75, center.dy - 90);
      frontHairPath.quadraticBezierTo(center.dx, center.dy - 120, center.dx - 75, center.dy - 90);
    }
    frontHairPath.close();
    canvas.drawPath(frontHairPath, hairPaint);
  }

  void _drawVisemeMouth(Canvas canvas, Offset mouthCenter, VisemeType viseme, AvatarEmotion emotion) {
    final mouthPaint = Paint()..color = const Color(0xFF881337);
    final teethPaint = Paint()..color = Colors.white;

    switch (viseme) {
      case VisemeType.aa: // Open mouth (vowels: a, o)
        final openRect = Rect.fromCenter(center: mouthCenter, width: 28, height: 18);
        canvas.drawOval(openRect, mouthPaint);
        // Visible upper teeth
        canvas.drawRect(
          Rect.fromCenter(center: Offset(mouthCenter.dx, mouthCenter.dy - 6), width: 18, height: 4),
          teethPaint,
        );
        break;

      case VisemeType.ee: // Wide smile / spread mouth (vowels: e, i)
        final wideRect = Rect.fromCenter(center: mouthCenter, width: 34, height: 11);
        canvas.drawOval(wideRect, mouthPaint);
        canvas.drawRect(
          Rect.fromCenter(center: mouthCenter, width: 24, height: 4),
          teethPaint,
        );
        break;

      case VisemeType.oo: // Round small mouth (vowels: u, o)
        final roundRect = Rect.fromCenter(center: mouthCenter, width: 14, height: 14);
        canvas.drawOval(roundRect, mouthPaint);
        break;

      case VisemeType.ch: // Closed teeth articulation (s, c, t, d)
        final chRect = Rect.fromCenter(center: mouthCenter, width: 28, height: 8);
        canvas.drawRRect(RRect.fromRectAndRadius(chRect, const Radius.circular(4)), mouthPaint);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(center: mouthCenter, width: 22, height: 5),
            const Radius.circular(2),
          ),
          teethPaint,
        );
        break;

      case VisemeType.ff: // Labiodental tuck (f, v)
        final ffRect = Rect.fromCenter(center: Offset(mouthCenter.dx, mouthCenter.dy + 1), width: 22, height: 6);
        canvas.drawRRect(RRect.fromRectAndRadius(ffRect, const Radius.circular(3)), mouthPaint);
        canvas.drawRect(
          Rect.fromCenter(center: Offset(mouthCenter.dx, mouthCenter.dy - 2), width: 16, height: 3),
          teethPaint,
        );
        break;

      case VisemeType.rest:
        // Natural pleasant resting smile curve
        final smilePaint = Paint()
          ..color = const Color(0xFF701A75)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3.0
          ..strokeCap = StrokeCap.round;

        final smilePath = Path()
          ..moveTo(mouthCenter.dx - 14, mouthCenter.dy - 2)
          ..quadraticBezierTo(
            mouthCenter.dx,
            mouthCenter.dy + (emotion == AvatarEmotion.happy || emotion == AvatarEmotion.celebrating ? 7 : 3),
            mouthCenter.dx + 14,
            mouthCenter.dy - 2,
          );
        canvas.drawPath(smilePath, smilePaint);
        break;
    }
  }

  @override
  bool shouldRepaint(covariant _AvatarPainter oldDelegate) {
    return oldDelegate.emotion != emotion ||
        oldDelegate.viseme != viseme ||
        oldDelegate.blinkProgress != blinkProgress ||
        oldDelegate.breathProgress != breathProgress ||
        oldDelegate.characterName != characterName;
  }
}
