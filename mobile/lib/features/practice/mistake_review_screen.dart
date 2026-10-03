// ==============================================================================
// MAHMAS LANGUAGE — MISTAKE REVIEW SCREEN
// Categorized view of recent, repeated, and older mistakes
// ==============================================================================

import 'package:flutter/material.dart';
import '../../core/auth/auth_scope.dart';
import '../../core/models/progression_model.dart';
import '../../core/repositories/progression_repository.dart';
import 'practice_runner_screen.dart';

class MistakeReviewScreen extends StatefulWidget {
  const MistakeReviewScreen({super.key});

  @override
  State<MistakeReviewScreen> createState() => _MistakeReviewScreenState();
}

class _MistakeReviewScreenState extends State<MistakeReviewScreen> with SingleTickerProviderStateMixin {
  late final ProgressionRepository _progressionRepo;
  late final TabController _tabController;
  MistakesOverviewModel? _mistakes;
  bool _isLoading = true;
  String? _errorMessage;

  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      final apiClient = AuthScope.of(context).apiClient;
      _progressionRepo = ProgressionRepository(apiClient: apiClient);
      _loadMistakes();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadMistakes() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final mistakes = await _progressionRepo.getMistakes();
      if (mounted) {
        setState(() {
          _mistakes = mistakes;
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mistake Review', style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Recent (${_mistakes?.recent.length ?? 0})'),
            Tab(text: 'Repeated (${_mistakes?.repeated.length ?? 0})'),
            Tab(text: 'Older (${_mistakes?.older.length ?? 0})'),
          ],
        ),
      ),
      body: _buildBody(theme),
      bottomNavigationBar: _mistakes != null && _mistakes!.totalMistakes > 0
          ? Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: theme.cardColor,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 10,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade700,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const PracticeRunnerScreen(sessionType: 'MISTAKES'),
                    ),
                  ).then((_) => _loadMistakes());
                },
                icon: const Icon(Icons.bolt_rounded),
                label: const Text(
                  'Practice All Mistakes',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildBody(ThemeData theme) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                'Failed to load mistakes',
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
                onPressed: _loadMistakes,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final mistakes = _mistakes!;

    return TabBarView(
      controller: _tabController,
      children: [
        _buildMistakesList(mistakes.recent, 'No recent mistakes! You are doing great.', theme),
        _buildMistakesList(mistakes.repeated, 'No repeated mistakes found.', theme),
        _buildMistakesList(mistakes.older, 'No older mistakes to review.', theme),
      ],
    );
  }

  Widget _buildMistakesList(List<PracticeMistakeModel> list, String emptyMessage, ThemeData theme) {
    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle_outline_rounded, size: 64, color: Colors.green.shade400),
              const SizedBox(height: 16),
              Text(
                emptyMessage,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final mistake = list[index];
        return Card(
          elevation: 1.5,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        mistake.type.replaceAll('_', ' '),
                        style: TextStyle(
                          color: Colors.red.shade700,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (mistake.retryCount > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${mistake.retryCount} retries',
                          style: TextStyle(
                            color: Colors.orange.shade800,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  mistake.question,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (mistake.userGivenAnswer.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Text(
                        'Your answer: ',
                        style: TextStyle(fontSize: 13, color: Colors.grey),
                      ),
                      Text(
                        mistake.userGivenAnswer,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.red,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
