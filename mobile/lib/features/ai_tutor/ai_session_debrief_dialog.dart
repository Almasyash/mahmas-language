// ==============================================================================
// MAHMAS LANGUAGE — AI SESSION DEBRIEF DIALOG
// Displays gamified session rewards, pedagogical corrections summary & feedback
// ==============================================================================

import 'package:flutter/material.dart';
import '../../core/models/ai_tutor_model.dart';

class AISessionDebriefDialog extends StatelessWidget {
  final ConversationDebriefModel debrief;
  final VoidCallback onReturnHome;
  final VoidCallback? onReviewMistakes;

  const AISessionDebriefDialog({
    super.key,
    required this.debrief,
    required this.onReturnHome,
    this.onReviewMistakes,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header Icon
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text('🎉', style: TextStyle(fontSize: 34)),
                ),
              ),
              const SizedBox(height: 16),

              const Text(
                'Conversation Complete!',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 6),

              Text(
                'Practice session with ${debrief.characterName}',
                style: TextStyle(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 18),

              // Gamified Rewards Row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade100,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.amber.shade400),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.bolt, color: Colors.orange, size: 20),
                        const SizedBox(width: 4),
                        Text(
                          '+${debrief.xpAwarded} XP',
                          style: TextStyle(
                            color: Colors.amber.shade900,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.cyan.shade100,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.cyan.shade400),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.diamond, color: Colors.cyan, size: 20),
                        const SizedBox(width: 4),
                        Text(
                          '+${debrief.gemsAwarded} Gems',
                          style: TextStyle(
                            color: Colors.cyan.shade900,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Stats Grid
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
                      label: 'Messages',
                      value: debrief.totalMessages.toString(),
                      icon: Icons.chat_bubble_outline,
                      color: theme.colorScheme.primary,
                    ),
                    _buildStatCol(
                      context,
                      label: 'Suggestions',
                      value: debrief.correctionsCount.toString(),
                      icon: Icons.lightbulb_outline,
                      color: Colors.amber.shade800,
                    ),
                    _buildStatCol(
                      context,
                      label: 'Duration',
                      value: '${(debrief.durationSec / 60).ceil()}m',
                      icon: Icons.timer_outlined,
                      color: Colors.green,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Feedback Summary
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
                        Icon(Icons.psychology, size: 16, color: theme.colorScheme.primary),
                        const SizedBox(width: 6),
                        Text(
                          'Pedagogical Debrief',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      debrief.feedbackSummary,
                      style: TextStyle(
                        fontSize: 13,
                        color: theme.colorScheme.onSurface,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),

              if (debrief.unlockedAchievements.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.shade200),
                  ),
                  child: Row(
                    children: [
                      const Text('🏆', style: TextStyle(fontSize: 20)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Unlocked: ${debrief.unlockedAchievements.join(", ")}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: Colors.amber.shade900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // Action Buttons
              if (debrief.correctionsCount > 0 && onReviewMistakes != null) ...[
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: onReviewMistakes,
                    icon: const Icon(Icons.history_edu, size: 18),
                    label: const Text('Review Mistakes in Practice'),
                  ),
                ),
                const SizedBox(height: 10),
              ],

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onReturnHome,
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Continue'),
                ),
              ),
            ],
          ),
        ),
      ),
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
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        Text(
          label,
          style: const TextStyle(color: Colors.grey, fontSize: 11),
        ),
      ],
    );
  }
}
