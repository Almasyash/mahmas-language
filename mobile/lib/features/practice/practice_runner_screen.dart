// ==============================================================================
// MAHMAS LANGUAGE — PRACTICE RUNNER SCREEN
// Interactive, server-authoritative practice session executor
// ==============================================================================

import 'package:flutter/material.dart';
import '../../core/auth/auth_scope.dart';
import '../../core/models/progression_model.dart';
import '../../core/repositories/progression_repository.dart';

class PracticeRunnerScreen extends StatefulWidget {
  final String sessionType;

  const PracticeRunnerScreen({
    super.key,
    this.sessionType = 'RECOMMENDED',
  });

  @override
  State<PracticeRunnerScreen> createState() => _PracticeRunnerScreenState();
}

class _PracticeRunnerScreenState extends State<PracticeRunnerScreen> {
  late final ProgressionRepository _progressionRepo;
  PracticeSessionModel? _session;
  bool _isLoading = true;
  String? _errorMessage;

  int _currentIndex = 0;
  String? _selectedAnswer;
  final TextEditingController _textController = TextEditingController();

  bool _isChecking = false;
  bool _hasChecked = false;
  bool _isAnswerCorrect = false;
  String? _explanation;

  final DateTime _startTime = DateTime.now();
  bool _isCompleting = false;
  Map<String, dynamic>? _completionResult;

  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      final apiClient = AuthScope.of(context).apiClient;
      _progressionRepo = ProgressionRepository(apiClient: apiClient);
      _startSession();
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _startSession() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final session = await _progressionRepo.startPracticeSession(sessionType: widget.sessionType);
      if (mounted) {
        setState(() {
          _session = session;
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

  Future<void> _checkAnswer() async {
    if (_session == null || _session!.exercises.isEmpty) return;

    final currentExercise = _session!.exercises[_currentIndex];
    final answer = _selectedAnswer ?? _textController.text.trim();

    if (answer.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select or enter an answer.')),
      );
      return;
    }

    setState(() {
      _isChecking = true;
    });

    try {
      final result = await _progressionRepo.submitPracticeExercise(
        exerciseId: currentExercise.id,
        sessionId: _session!.sessionId,
        userAnswer: answer,
      );

      if (mounted) {
        setState(() {
          _isChecking = false;
          _hasChecked = true;
          _isAnswerCorrect = result['isCorrect'] as bool? ?? false;
          _explanation = result['explanation'] as String?;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isChecking = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission error: $e')),
        );
      }
    }
  }

  Future<void> _nextOrComplete() async {
    if (_session == null) return;

    if (_currentIndex < _session!.exercises.length - 1) {
      setState(() {
        _currentIndex += 1;
        _selectedAnswer = null;
        _textController.clear();
        _hasChecked = false;
        _explanation = null;
      });
    } else {
      // Complete practice session
      setState(() {
        _isCompleting = true;
      });

      final durationSec = DateTime.now().difference(_startTime).inSeconds;

      try {
        final completion = await _progressionRepo.completePracticeSession(
          sessionId: _session!.sessionId,
          durationSec: durationSec > 0 ? durationSec : 30,
        );

        if (mounted) {
          setState(() {
            _isCompleting = false;
            _completionResult = completion;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _isCompleting = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to complete session: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Practice Session')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Practice Session')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text(
                  'Could not start practice session',
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
                  onPressed: _startSession,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_completionResult != null) {
      return _buildCompletionScreen(theme);
    }

    final exercises = _session!.exercises;
    if (exercises.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Practice Session')),
        body: const Center(
          child: Text('No exercises available for practice right now.'),
        ),
      );
    }

    final currentExercise = exercises[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Exercise ${_currentIndex + 1} of ${exercises.length}',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: (_currentIndex + 1) / exercises.length,
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
                      currentExercise.type.replaceAll('_', ' '),
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
                          onPressed: _hasChecked
                              ? null
                              : () {
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
                      enabled: !_hasChecked,
                      decoration: InputDecoration(
                        hintText: 'Type your answer here...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Bottom Action / Feedback Panel
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: _hasChecked
                  ? (_isAnswerCorrect ? Colors.green.shade50 : Colors.red.shade50)
                  : theme.cardColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_hasChecked) ...[
                    Row(
                      children: [
                        Icon(
                          _isAnswerCorrect ? Icons.check_circle_rounded : Icons.cancel_rounded,
                          color: _isAnswerCorrect ? Colors.green : Colors.red,
                          size: 24,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _isAnswerCorrect ? 'Excellent! That is correct.' : 'Incorrect',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: _isAnswerCorrect ? Colors.green.shade800 : Colors.red.shade800,
                          ),
                        ),
                      ],
                    ),
                    if (_explanation != null && _explanation!.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        _explanation!,
                        style: TextStyle(
                          fontSize: 13,
                          color: _isAnswerCorrect ? Colors.green.shade700 : Colors.red.shade700,
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),
                  ],
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _hasChecked
                            ? (_isAnswerCorrect ? Colors.green : Colors.red.shade700)
                            : theme.colorScheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _isChecking || _isCompleting
                          ? null
                          : (_hasChecked ? _nextOrComplete : _checkAnswer),
                      child: _isChecking || _isCompleting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(
                              _hasChecked
                                  ? (_currentIndex < exercises.length - 1 ? 'Continue' : 'Finish Practice')
                                  : 'Check Answer',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletionScreen(ThemeData theme) {
    final xpEarned = _completionResult?['xpAwarded'] as int? ?? 15;
    final gemsEarned = _completionResult?['gemsAwarded'] as int? ?? 2;
    final correctCount = _completionResult?['correctCount'] as int? ?? 0;
    final exerciseCount = _completionResult?['exerciseCount'] as int? ?? 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Practice Complete')),
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
                  color: Colors.amber.shade100,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.emoji_events_rounded, color: Colors.amber, size: 52),
              ),
              const SizedBox(height: 24),
              Text(
                'Practice Complete!',
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Great job strengthening your language skills.',
                style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
              ),
              const SizedBox(height: 28),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildRewardChip('+$xpEarned XP', Icons.bolt_rounded, Colors.orange),
                  const SizedBox(width: 16),
                  _buildRewardChip('+$gemsEarned Gems', Icons.diamond_rounded, Colors.blueAccent),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Score: $correctCount / $exerciseCount correct',
                style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
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
                  child: const Text('Back to Practice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
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
