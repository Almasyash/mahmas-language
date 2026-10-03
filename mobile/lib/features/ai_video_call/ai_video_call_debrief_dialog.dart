// ==============================================================================
// MAHMAS LANGUAGE — AI VIDEO CALL DEBRIEF DIALOG
// Post-video session performance breakdown: pronunciation, fluency, engagement & rewards
// ==============================================================================

import 'package:flutter/material.dart';
import '../../core/models/ai_video_call_model.dart';

class AIVideoCallDebriefDialog extends StatelessWidget {
  final VideoCallDebriefModel debrief;
  final VoidCallback onReturnHome;

  const AIVideoCallDebriefDialog({
    super.key,
    required this.debrief,
    required this.onReturnHome,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 420),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: Colors.white12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.6),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header Icon & Title
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFFEC4899)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.4),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(Icons.videocam_rounded, color: Colors.white, size: 36),
              ),
              const SizedBox(height: 14),
              const Text(
                'Video Session Debrief',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Face-to-face practice with ${debrief.characterName}',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 20),

              // Tri-Meter Score Island (Pronunciation, Fluency, Visual Engagement)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildMetricMeter(
                      title: 'Accuracy',
                      score: debrief.overallAccuracy,
                      color: Colors.tealAccent,
                    ),
                    _buildMetricMeter(
                      title: 'Fluency',
                      score: debrief.overallFluency,
                      color: Colors.amberAccent,
                    ),
                    _buildMetricMeter(
                      title: 'Visual Focus',
                      score: debrief.facialEngagementScore,
                      color: Colors.purpleAccent,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Acoustic & Props Metrics Row
              Row(
                children: [
                  Expanded(
                    child: _buildInfoCard(
                      icon: Icons.timer_outlined,
                      label: 'Duration',
                      value: '${debrief.totalDurationSec}s',
                      color: Colors.lightBlueAccent,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildInfoCard(
                      icon: Icons.speed_rounded,
                      label: 'Speaking Pace',
                      value: '${debrief.wordsPerMinute} wpm',
                      color: Colors.orangeAccent,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildInfoCard(
                      icon: Icons.photo_library_outlined,
                      label: 'Visual Props',
                      value: '${debrief.visualAidsExplored}',
                      color: Colors.pinkAccent,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Unlocked Achievement Banner
              if (debrief.unlockedAchievements.contains('FIRST_AI_VIDEO_CALL')) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.amber.shade900.withValues(alpha: 0.35),
                        Colors.amber.shade700.withValues(alpha: 0.15),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.amberAccent.withValues(alpha: 0.5)),
                  ),
                  child: const Row(
                    children: [
                      Text('📹', style: TextStyle(fontSize: 24)),
                      SizedBox(width: 10),
                      Flexible(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Achievement Unlocked: Visual Virtuoso',
                              style: TextStyle(
                                color: Colors.amberAccent,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              'Completed your first live AI video call!',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Rewards Strip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D9488).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF0D9488).withValues(alpha: 0.35)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.bolt_rounded, color: Colors.amber, size: 22),
                        const SizedBox(width: 6),
                        Text(
                          '+${debrief.xpAwarded} XP',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                    Container(width: 1, height: 20, color: Colors.white24),
                    Row(
                      children: [
                        const Icon(Icons.diamond_rounded, color: Colors.cyanAccent, size: 20),
                        const SizedBox(width: 6),
                        Text(
                          '+${debrief.gemsAwarded} Gems',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Feedback Summary Note
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B).withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  debrief.feedbackSummary,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    height: 1.45,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 22),

              // Return Home Action Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: onReturnHome,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 4,
                  ),
                  child: const Text(
                    'Done',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricMeter({
    required String title,
    required int score,
    required Color color,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 58,
              height: 58,
              child: CircularProgressIndicator(
                value: (score / 100.0).clamp(0.0, 1.0),
                strokeWidth: 5,
                backgroundColor: Colors.white10,
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
            Text(
              '$score%',
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}
