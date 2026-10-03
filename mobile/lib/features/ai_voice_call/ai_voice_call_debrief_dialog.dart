// ==============================================================================
// MAHMAS LANGUAGE — AI VOICE CALL DEBRIEF DIALOG
// Post-call gamified results screen displaying pronunciation accuracy, fluency, & rewards
// ==============================================================================

import 'package:flutter/material.dart';
import '../../core/models/ai_voice_call_model.dart';

class AIVoiceCallDebriefDialog extends StatelessWidget {
  final VoiceCallDebriefModel debrief;
  final VoidCallback onReturnHome;

  const AIVoiceCallDebriefDialog({
    super.key,
    required this.debrief,
    required this.onReturnHome,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final minutes = (debrief.totalDurationSec / 60).floor();
    final seconds = debrief.totalDurationSec % 60;
    final durationFormatted = minutes > 0 ? '${minutes}m ${seconds}s' : '${seconds}s';

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 12,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header Icon
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text('🎙️', style: TextStyle(fontSize: 36)),
                ),
              ),
              const SizedBox(height: 16),

              const Text(
                'Voice Call Complete!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Live session with ${debrief.characterName}',
                style: TextStyle(
                  fontSize: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),

              const SizedBox(height: 20),

              // Gamified Rewards Banner
              Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.tertiary,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: theme.colorScheme.primary.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.bolt, color: Colors.amber, size: 28),
                        const SizedBox(width: 8),
                        Text(
                          '+${debrief.xpAwarded} XP',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    Container(height: 24, width: 1.5, color: Colors.white24),
                    Row(
                      children: [
                        const Text('💎', style: TextStyle(fontSize: 20)),
                        const SizedBox(width: 8),
                        Text(
                          '+${debrief.gemsAwarded} Gems',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Pronunciation & Fluency Circular Meters
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildCircularScore(
                    context,
                    label: 'Pronunciation',
                    score: debrief.overallAccuracy,
                    color: Colors.teal,
                  ),
                  _buildCircularScore(
                    context,
                    label: 'Fluency',
                    score: debrief.overallFluency,
                    color: Colors.indigo,
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Acoustic Stats Grid
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatCol(
                      context,
                      label: 'Duration',
                      value: durationFormatted,
                      icon: Icons.timer_outlined,
                      color: Colors.green,
                    ),
                    _buildStatCol(
                      context,
                      label: 'Spoken Turns',
                      value: debrief.turnsCompleted.toString(),
                      icon: Icons.record_voice_over_outlined,
                      color: theme.colorScheme.primary,
                    ),
                    _buildStatCol(
                      context,
                      label: 'Pace',
                      value: '${debrief.wordsPerMinute} wpm',
                      icon: Icons.speed_outlined,
                      color: Colors.amber.shade800,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Pronunciation Highlights & Phonetics
              if (debrief.pronunciationHighlights.isNotEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: theme.colorScheme.primary.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.mic_none, size: 16, color: theme.colorScheme.primary),
                          const SizedBox(width: 6),
                          Text(
                            'Pronunciation Highlights',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ...debrief.pronunciationHighlights.map(
                        (h) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
                              Expanded(
                                child: Text(
                                  h,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: theme.colorScheme.onSurface,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 12),

              // Pedagogical Feedback Summary
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.psychology_outlined, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        debrief.feedbackSummary,
                        style: TextStyle(
                          fontSize: 13,
                          color: theme.colorScheme.onSurfaceVariant,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Unlocked Achievements Banner
              if (debrief.unlockedAchievements.isNotEmpty) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.shade600),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('🏆 ', style: TextStyle(fontSize: 16)),
                      Flexible(
                        child: Text(
                          'Unlocked: ${debrief.unlockedAchievements.join(", ")}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.amber.shade900,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // Done / Return Home Action Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: FilledButton(
                  onPressed: onReturnHome,
                  style: FilledButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text(
                    'Done',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCircularScore(
    BuildContext context, {
    required String label,
    required int score,
    required Color color,
  }) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 76,
              height: 76,
              child: CircularProgressIndicator(
                value: score / 100.0,
                strokeWidth: 7,
                backgroundColor: color.withValues(alpha: 0.15),
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
            Text(
              '$score%',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCol(
    BuildContext context, {
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
