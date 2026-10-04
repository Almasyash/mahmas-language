// ==============================================================================
// MAHMAS LANGUAGE — REAL HOME DASHBOARD SCREEN
// Real server-authoritative progression dashboard with gamification & practice
// ==============================================================================

import 'package:flutter/material.dart';
import '../../core/auth/auth_scope.dart';
import '../../core/models/progression_model.dart';
import '../../core/models/user_model.dart';
import '../../core/repositories/progression_repository.dart';
import '../lessons/lesson_runner_screen.dart';
import '../practice/practice_runner_screen.dart';
import '../practice/practice_screen.dart';
import '../profile/profile_screen.dart';
import '../ai_tutor/ai_tutor_selection_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  late final ProgressionRepository _progressionRepo;
  DashboardModel? _dashboard;
  bool _isLoading = true;
  String? _errorMessage;

  final List<String> _tabTitles = [
    'Learn',
    'Practice',
    'AI Tutor',
    'Exchange',
    'Profile',
  ];

  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      final apiClient = AuthScope.of(context).apiClient;
      _progressionRepo = ProgressionRepository(apiClient: apiClient);
      _loadDashboard();
    }
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final dashboard = await _progressionRepo.getDashboard();
      if (mounted) {
        setState(() {
          _dashboard = dashboard;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _claimQuest(String questId) async {
    try {
      final result = await _progressionRepo.claimQuest(questId);
      final xp = result['xpAwarded'] ?? 15;
      final gems = result['gemsAwarded'] ?? 3;

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.green.shade700,
            content: Text('Quest Claimed! +$xp XP, +$gems Gems'),
          ),
        );
        _loadDashboard();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Claim failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // If profile tab is selected, render ProfileScreen directly
    if (_selectedIndex == 4) {
      return Scaffold(
        body: const ProfileScreen(),
        bottomNavigationBar: _buildBottomNav(),
      );
    }

    // If practice tab is selected, render PracticeScreen directly
    if (_selectedIndex == 1) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Practice', style: TextStyle(fontWeight: FontWeight.bold)),
          actions: _buildHeaderPills(),
        ),
        body: const PracticeScreen(),
        bottomNavigationBar: _buildBottomNav(),
      );
    }

    // Future placeholders for AI Tutor & Language Exchange
    if (_selectedIndex == 2 || _selectedIndex == 3) {
      return Scaffold(
        appBar: AppBar(
          title: Text(_tabTitles[_selectedIndex], style: const TextStyle(fontWeight: FontWeight.bold)),
          actions: _buildHeaderPills(),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _selectedIndex == 2 ? Icons.smart_toy_rounded : Icons.connect_without_contact_rounded,
                size: 64,
                color: Colors.grey.shade400,
              ),
              const SizedBox(height: 16),
              Text(
                '${_tabTitles[_selectedIndex]} Feature',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Coming in an upcoming phase!',
                style: TextStyle(color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
        bottomNavigationBar: _buildBottomNav(),
      );
    }

    // Main Learn / Dashboard tab (index 0)
    final theme = Theme.of(context);
    final targetLangFlag = _dashboard?.user.targetLanguage?.flagEmoji ?? '🇪🇸';
    final targetLangName = _dashboard?.user.targetLanguage?.name ?? 'Spanish';

    return Scaffold(
      appBar: AppBar(
        title: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: _showLanguageSelectorDialog,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(targetLangFlag, style: const TextStyle(fontSize: 22)),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    targetLangName,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_drop_down_rounded, size: 24),
              ],
            ),
          ),
        ),
        actions: _buildHeaderPills(),
      ),
      body: _buildDashboardBody(theme),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  void _showLanguageSelectorDialog() {
    final authNotifier = AuthScope.of(context);
    final currentTargetId = _dashboard?.user.targetLanguage?.id;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.85,
          expand: false,
          builder: (context, scrollController) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade600,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Text(
                    'Select Target Language',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Switching courses preserves all your existing progress.',
                    style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  const Divider(),
                  Expanded(
                    child: Builder(
                      builder: (context) {
                        final availableLangs = LanguageModel.supportedLanguages
                            .where((l) =>
                                l.id != _dashboard?.user.nativeLanguage?.id &&
                                l.name != _dashboard?.user.nativeLanguage?.name)
                            .toList();

                        return ListView.builder(
                          controller: scrollController,
                          itemCount: availableLangs.length,
                          itemBuilder: (context, index) {
                            final lang = availableLangs[index];
                            final isSelected = lang.id == currentTargetId || lang.name == _dashboard?.user.targetLanguage?.name;

                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.blue.withValues(alpha: 0.15) : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? Colors.blueAccent : Colors.grey.withValues(alpha: 0.2),
                              width: isSelected ? 1.5 : 1.0,
                            ),
                          ),
                          child: ListTile(
                            leading: Text(lang.flagEmoji ?? '🌐', style: const TextStyle(fontSize: 26)),
                            title: Text(lang.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(lang.nativeName ?? lang.code),
                            trailing: isSelected
                                ? const Icon(Icons.check_circle, color: Colors.blueAccent)
                                : null,
                            onTap: () async {
                              Navigator.of(ctx).pop();
                              if (!isSelected) {
                                final success = await authNotifier.updateProfile(targetLanguageId: lang.id);
                                if (success && mounted) {
                                  ScaffoldMessenger.of(this.context).showSnackBar(
                                    SnackBar(
                                      backgroundColor: Colors.blueAccent.shade700,
                                      content: Text('Switched learning course to ${lang.name}'),
                                    ),
                                  );
                                  _loadDashboard();
                                }
                              }
                            },
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  List<Widget> _buildHeaderPills() {
    final streak = _dashboard?.streak.currentStreak ?? 0;
    final gems = _dashboard?.gems ?? 10;
    final totalXp = _dashboard?.xpSummary.totalXp ?? 0;

    return [
      Row(
        children: [
          const Icon(Icons.local_fire_department_rounded, color: Colors.orange, size: 20),
          const SizedBox(width: 3),
          Text('$streak', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(width: 10),
          const Icon(Icons.diamond_rounded, color: Colors.blueAccent, size: 20),
          const SizedBox(width: 3),
          Text('$gems', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(width: 10),
          const Icon(Icons.bolt_rounded, color: Colors.amber, size: 20),
          const SizedBox(width: 3),
          Text('$totalXp', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(width: 14),
        ],
      ),
    ];
  }

  Widget _buildDashboardBody(ThemeData theme) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                'Failed to load dashboard',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadDashboard,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final d = _dashboard!;

    return RefreshIndicator(
      onRefresh: _loadDashboard,
      child: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // 1. Level & XP Progress Banner
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Level ${d.xpSummary.currentLevel}',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                      Text(
                        '+${d.xpSummary.todayXp} XP today',
                        style: TextStyle(
                          color: Colors.orange.shade800,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: (d.xpSummary.progressPercent / 100).clamp(0.0, 1.0),
                      minHeight: 8,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${d.xpSummary.xpIntoCurrentLevel} / ${d.xpSummary.xpIntoCurrentLevel + d.xpSummary.xpToNextLevel} XP to Level ${d.xpSummary.currentLevel + 1}',
                    style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 2. Continue Learning Hero Card
          Card(
            elevation: 3,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            color: theme.colorScheme.primaryContainer,
            child: Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.school_rounded, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              d.currentCourse.title,
                              style: TextStyle(
                                fontSize: 13,
                                color: theme.colorScheme.onPrimaryContainer.withValues(alpha: 0.8),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              d.currentCourse.activeLessonTitle,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: theme.colorScheme.onPrimaryContainer,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Course Progress: ${d.currentCourse.progressPercent}%',
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onPrimaryContainer,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        '${d.currentCourse.completedLessonsCount}/${d.currentCourse.totalLessonsCount} lessons',
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: (d.currentCourse.progressPercent / 100).clamp(0.0, 1.0),
                      minHeight: 6,
                      backgroundColor: Colors.white.withValues(alpha: 0.3),
                      valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => LessonRunnerScreen(
                              lessonId: d.currentCourse.activeLessonId,
                              lessonTitle: d.currentCourse.activeLessonTitle,
                            ),
                          ),
                        ).then((_) => _loadDashboard());
                      },
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: const Text(
                        'Continue Learning',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 3. Daily Goal Ring & Quick Practice Grid
          Row(
            children: [
              // Daily Goal Card
              Expanded(
                child: Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Daily Goal',
                              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            Icon(
                              d.dailyGoal.dailyGoalCompleted
                                  ? Icons.check_circle_rounded
                                  : Icons.timelapse_rounded,
                              color: d.dailyGoal.dailyGoalCompleted ? Colors.green : Colors.orange,
                              size: 20,
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '${d.dailyGoal.dailyMinutesCompleted} / ${d.dailyGoal.dailyGoalMinutes} mins',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: d.dailyGoal.dailyGoalCompleted ? Colors.green.shade700 : Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: (d.dailyGoal.dailyGoalProgress / 100).clamp(0.0, 1.0),
                            minHeight: 8,
                            backgroundColor: Colors.grey.shade200,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              d.dailyGoal.dailyGoalCompleted ? Colors.green : Colors.orange,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Quick Practice Card
              Expanded(
                child: Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const PracticeRunnerScreen(sessionType: 'RECOMMENDED'),
                        ),
                      ).then((_) => _loadDashboard());
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Quick Practice',
                                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              const Icon(Icons.bolt_rounded, color: Colors.orange, size: 20),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '${d.practiceSummary.recommendedPracticeCount} items ready',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${d.practiceSummary.mistakeCount} mistakes • ${d.practiceSummary.vocabularyReviewCount} due',
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // AI Conversational Tutor Banner Card
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AITutorSelectionScreen()),
                ).then((_) => _loadDashboard());
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primaryContainer.withValues(alpha: 0.7),
                      theme.colorScheme.secondaryContainer.withValues(alpha: 0.5),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: theme.colorScheme.primary,
                      child: const Icon(Icons.smart_toy_rounded, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'AI Conversation Tutor',
                                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade100,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'LIVE',
                                  style: TextStyle(
                                    color: Colors.green.shade900,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Practice speaking with Mateo, Elena & Sofia with real-time feedback',
                            style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 4. Daily Quests Section
          Text(
            'Daily Quests',
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          if (d.quests.isEmpty)
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('No active quests for today.'),
              ),
            )
          else
            ...d.quests.map((q) => Card(
                  elevation: 1.5,
                  margin: const EdgeInsets.only(bottom: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  child: Padding(
                    padding: const EdgeInsets.all(14.0),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: q.isCompleted ? Colors.green.shade50 : Colors.amber.shade50,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            q.isCompleted ? Icons.check_circle_rounded : Icons.star_rounded,
                            color: q.isCompleted ? Colors.green.shade700 : Colors.amber.shade700,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                q.title,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                q.description,
                                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                              ),
                              const SizedBox(height: 6),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: (q.progressPercent / 100).clamp(0.0, 1.0),
                                  minHeight: 5,
                                  backgroundColor: Colors.grey.shade200,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    q.isCompleted ? Colors.green : theme.colorScheme.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        if (q.isCompleted && !q.isClaimed)
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: () => _claimQuest(q.id),
                            child: const Text('Claim', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          )
                        else if (q.isClaimed)
                          const Text(
                            'Claimed',
                            style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12),
                          )
                        else
                          Text(
                            '+${q.xpReward} XP',
                            style: TextStyle(
                              color: Colors.orange.shade800,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                      ],
                    ),
                  ),
                )),
          const SizedBox(height: 20),

          // 5. Recent Achievements
          Text(
            'Recent Achievements',
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          if (d.recentAchievements.isEmpty)
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('Complete lessons and milestones to unlock achievements!'),
              ),
            )
          else
            SizedBox(
              height: 110,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: d.recentAchievements.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (context, index) {
                  final ach = d.recentAchievements[index];
                  return Card(
                    elevation: 1.5,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    child: Container(
                      width: 140,
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            ach.isUnlocked ? Icons.verified_rounded : Icons.lock_outline_rounded,
                            color: ach.isUnlocked ? Colors.amber.shade700 : Colors.grey,
                            size: 28,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            ach.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            ach.isUnlocked ? 'Unlocked' : '+${ach.xpReward} XP',
                            style: TextStyle(
                              fontSize: 10,
                              color: ach.isUnlocked ? Colors.green : Colors.grey.shade600,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
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

  Widget _buildBottomNav() {
    return NavigationBar(
      selectedIndex: _selectedIndex,
      onDestinationSelected: (index) {
        final wasDifferent = _selectedIndex != index;
        setState(() {
          _selectedIndex = index;
        });
        if (index == 0 && wasDifferent) {
          _loadDashboard();
        }
      },
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.school_outlined),
          selectedIcon: Icon(Icons.school),
          label: 'Learn',
        ),
        NavigationDestination(
          icon: Icon(Icons.fitness_center_outlined),
          selectedIcon: Icon(Icons.fitness_center),
          label: 'Practice',
        ),
        NavigationDestination(
          icon: Icon(Icons.smart_toy_outlined),
          selectedIcon: Icon(Icons.smart_toy),
          label: 'AI Tutor',
        ),
        NavigationDestination(
          icon: Icon(Icons.connect_without_contact_outlined),
          selectedIcon: Icon(Icons.connect_without_contact),
          label: 'Exchange',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person),
          label: 'Profile',
        ),
      ],
    );
  }
}
