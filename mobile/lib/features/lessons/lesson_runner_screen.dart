// ==============================================================================
// MAHMAS LANGUAGE — LESSON RUNNER SCREEN
// Interactive, server-authoritative lesson attempt runner
// ==============================================================================

import 'package:flutter/material.dart';
import '../../core/auth/auth_scope.dart';
import '../../core/models/progression_model.dart';
import '../../core/repositories/progression_repository.dart';

class LessonRunnerScreen extends StatefulWidget {
  final String lessonId;
  final String lessonTitle;

  const LessonRunnerScreen({
    super.key,
    required this.lessonId,
    required this.lessonTitle,
  });

  @override
  State<LessonRunnerScreen> createState() => _LessonRunnerScreenState();
}

class _LessonRunnerScreenState extends State<LessonRunnerScreen> {
  late final ProgressionRepository _progressionRepo;
  bool _isLoading = true;
  String? _errorMessage;

  List<PracticeExerciseModel> _exercises = [];
  int _currentIndex = 0;
  String? _selectedAnswer;
  final TextEditingController _textController = TextEditingController();

  final List<Map<String, dynamic>> _userAnswers = [];
  final DateTime _startTime = DateTime.now();

  bool _isSubmitting = false;
  Map<String, dynamic>? _submissionResult;

  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      final apiClient = AuthScope.of(context).apiClient;
      _progressionRepo = ProgressionRepository(apiClient: apiClient);
      _loadExercises();
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _loadExercises() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await _progressionRepo.getLessonExercises(widget.lessonId);
      final lessonData = data['lesson'] as Map<String, dynamic>? ?? {};
      final rawExercises = lessonData['exercises'] as List<dynamic>? ?? [];

      final list = rawExercises
          .map((e) => PracticeExerciseModel.fromJson(e as Map<String, dynamic>))
          .toList();

      if (mounted) {
        setState(() {
          _exercises = list;
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

  void _recordAnswerAndAdvance() {
    final currentExercise = _exercises[_currentIndex];
    final answer = _selectedAnswer ?? _textController.text.trim();

    if (answer.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select or type an answer.')),
      );
      return;
    }

    _userAnswers.add({
      'exerciseId': currentExercise.id,
      'userAnswer': answer,
    });

    if (_currentIndex < _exercises.length - 1) {
      setState(() {
        _currentIndex += 1;
        _selectedAnswer = null;
        _textController.clear();
      });
    } else {
      _submitLessonAttempt();
    }
  }

  Future<void> _submitLessonAttempt() async {
    setState(() {
      _isSubmitting = true;
    });

    final durationSec = DateTime.now().difference(_startTime).inSeconds;

    try {
      final result = await _progressionRepo.submitLessonAttempt(
        lessonId: widget.lessonId,
        answers: _userAnswers,
        durationSec: durationSec > 0 ? durationSec : 60,
      );

      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _submissionResult = result;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit lesson: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.lessonTitle)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.lessonTitle)),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text(
                  'Could not load lesson exercises',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  _errorMessage!,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadExercises,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_submissionResult != null) {
      return _buildCompletionScreen(theme);
    }

    if (_exercises.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.lessonTitle)),
        body: const Center(
          child: Text('No exercises found in this lesson.'),
        ),
      );
    }

    final currentExercise = _exercises[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.lessonTitle,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: (_currentIndex + 1) / _exercises.length,
            minHeight: 4,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Question ${_currentIndex + 1} of ${_exercises.length}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    currentExercise.question,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (currentExercise.options.isNotEmpty)
                    ...currentExercise.options.map((option) {
                      final isSelected = _selectedAnswer == option.id || _selectedAnswer == option.text;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            backgroundColor: isSelected
                                ? theme.colorScheme.primaryContainer
                                : Colors.transparent,
                            side: BorderSide(
                              color: isSelected
                                  ? theme.colorScheme.primary
                                  : Colors.grey.shade300,
                              width: isSelected ? 2 : 1,
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () {
                            setState(() {
                              _selectedAnswer = option.id;
                            });
                          },
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              option.text,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                color: isSelected
                                    ? theme.colorScheme.onPrimaryContainer
                                    : theme.colorScheme.onSurface,
                              ),
                            ),
                          ),
                        ),
                      );
                    })
                  else
                    TextField(
                      controller: _textController,
                      decoration: InputDecoration(
                        hintText: 'Type your answer...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: theme.cardColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _isSubmitting ? null : _recordAnswerAndAdvance,
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          _currentIndex < _exercises.length - 1 ? 'Next' : 'Submit Lesson',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletionScreen(ThemeData theme) {
    final score = _submissionResult?['score'] as int? ?? 100;
    final xpEarned = _submissionResult?['xpAwarded'] as int? ?? 25;
    final gemsEarned = _submissionResult?['gemsAwarded'] as int? ?? 2;
    final isSuccessful = _submissionResult?['isSuccessful'] as bool? ?? true;

    return Scaffold(
      appBar: AppBar(title: const Text('Lesson Results')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(28.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: isSuccessful ? Colors.green.shade100 : Colors.orange.shade100,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isSuccessful ? Icons.celebration_rounded : Icons.replay_rounded,
                  color: isSuccessful ? Colors.green.shade700 : Colors.orange.shade700,
                  size: 52,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                isSuccessful ? 'Lesson Completed!' : 'Keep Practicing!',
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Score: $score%',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: isSuccessful ? Colors.green.shade700 : Colors.orange.shade700,
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildRewardChip('+$xpEarned XP', Icons.bolt_rounded, Colors.orange),
                  if (gemsEarned > 0) ...[
                    const SizedBox(width: 16),
                    _buildRewardChip('+$gemsEarned Gems', Icons.diamond_rounded, Colors.blueAccent),
                  ],
                ],
              ),
              const SizedBox(height: 36),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.pop(context, true);
                  },
                  child: const Text('Continue Learning', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRewardChip(String text, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color),
          ),
        ],
      ),
    );
  }
}
