import 'package:flutter/material.dart';
import '../../core/auth/auth_scope.dart';
import '../../core/models/user_model.dart';
import '../auth/server_config_dialog.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _currentStep = 0;
  final int _totalSteps = 7;

  // Selected values
  LanguageModel? _selectedNativeLanguage;
  LanguageModel? _selectedTargetLanguage;
  String _selectedGoal = 'DAILY_CONVERSATION';
  int _selectedMinutes = 15;
  String _selectedLevel = 'A1';
  String _selectedTimezone = 'UTC';

  static const List<LanguageModel> _defaultFallbackLanguages = [
    LanguageModel(id: 'ea32166d-485c-4b0e-a0b5-7ccfca10be7c', code: 'en', name: 'English', nativeName: 'English', flagEmoji: '🇬🇧'),
    LanguageModel(id: 'eb922fb1-e918-42a3-bf66-7bc28836c088', code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flagEmoji: '🇮🇳'),
    LanguageModel(id: 'c383294c-80aa-4ef6-a1b9-0b405ed0e1b4', code: 'es', name: 'Spanish', nativeName: 'Español', flagEmoji: '🇪🇸'),
    LanguageModel(id: 'cffd17f5-413d-4fcb-ab58-21b04ac340d7', code: 'fr', name: 'French', nativeName: 'Français', flagEmoji: '🇫🇷'),
    LanguageModel(id: '5b962716-d1c7-40cb-b6d3-fc837cbd6986', code: 'de', name: 'German', nativeName: 'Deutsch', flagEmoji: '🇩🇪'),
    LanguageModel(id: 'b538fd7f-41a9-4c4f-ae1e-82f662dbc373', code: 'ar', name: 'Arabic', nativeName: 'العربية', flagEmoji: '🇸🇦'),
    LanguageModel(id: 'b5addf68-bbca-404e-bcec-4c2286124435', code: 'ja', name: 'Japanese', nativeName: '日本語', flagEmoji: '🇯🇵'),
    LanguageModel(id: '31b8b81e-4f2b-4bb9-b176-053b5e39f35c', code: 'ko', name: 'Korean', nativeName: '한국어', flagEmoji: '🇰🇷'),
    LanguageModel(id: 'f8ded5ea-afa3-40fb-b55f-8b54479729de', code: 'zh', name: 'Mandarin Chinese', nativeName: '中文', flagEmoji: '🇨🇳'),
    LanguageModel(id: 'bd3b73cc-06ff-4032-9474-09ce689045b9', code: 'it', name: 'Italian', nativeName: 'Italiano', flagEmoji: '🇮🇹'),
    LanguageModel(id: '6857d6dd-eece-4241-9fbd-742a3d4b47d7', code: 'pt', name: 'Portuguese', nativeName: 'Português', flagEmoji: '🇧🇷'),
    LanguageModel(id: '744101c5-03d9-40c5-9cfb-de3977ed89f3', code: 'ru', name: 'Russian', nativeName: 'Русский', flagEmoji: '🇷🇺'),
  ];

  List<LanguageModel> _availableLanguages = [];
  bool _isLoadingLanguages = true;
  bool _isSubmitting = false;
  bool _initialized = false;
  String? _errorMessage;

  final List<Map<String, dynamic>> _learningGoals = [
    {
      'id': 'DAILY_CONVERSATION',
      'title': 'Daily Conversation',
      'subtitle': 'Chat with friends and locals with ease',
      'icon': Icons.chat_bubble_outline_rounded,
    },
    {
      'id': 'SPEAKING',
      'title': 'Speaking Confidence',
      'subtitle': 'Practice pronunciation and overcome fear',
      'icon': Icons.record_voice_over_outlined,
    },
    {
      'id': 'TRAVEL',
      'title': 'Travel & Exploration',
      'subtitle': 'Order food, ask directions, navigate transit',
      'icon': Icons.flight_takeoff_rounded,
    },
    {
      'id': 'WORK',
      'title': 'Career & Business',
      'subtitle': 'Communicate professionally with colleagues',
      'icon': Icons.work_outline_rounded,
    },
    {
      'id': 'SCHOOL',
      'title': 'Academic Studies',
      'subtitle': 'Pass exams and understand coursework',
      'icon': Icons.school_outlined,
    },
    {
      'id': 'FLUENCY',
      'title': 'Complete Fluency',
      'subtitle': 'Master grammar, idioms, and nuances',
      'icon': Icons.military_tech_outlined,
    },
  ];

  final List<Map<String, dynamic>> _commitmentOptions = [
    {'minutes': 5, 'label': 'Casual', 'desc': '5 mins / day'},
    {'minutes': 10, 'label': 'Regular', 'desc': '10 mins / day'},
    {'minutes': 15, 'label': 'Serious', 'desc': '15 mins / day'},
    {'minutes': 20, 'label': 'Intense', 'desc': '20 mins / day'},
    {'minutes': 30, 'label': 'Hardcore', 'desc': '30 mins / day'},
  ];

  final List<Map<String, dynamic>> _placementLevels = [
    {
      'code': 'A1',
      'title': 'Beginner (A1)',
      'desc': 'I know basic words or I am starting from zero',
    },
    {
      'code': 'A2',
      'title': 'Elementary (A2)',
      'desc': 'I understand simple phrases and everyday expressions',
    },
    {
      'code': 'B1',
      'title': 'Intermediate (B1)',
      'desc': 'I can hold straightforward conversations on familiar topics',
    },
    {
      'code': 'B2',
      'title': 'Upper Intermediate (B2)',
      'desc': 'I can communicate fluently and spontaneously with native speakers',
    },
    {
      'code': 'C1',
      'title': 'Advanced (C1)',
      'desc': 'I express myself flexibly and understand demanding texts',
    },
    {
      'code': 'C2',
      'title': 'Mastery (C2)',
      'desc': 'I have near-native precision and effortless understanding',
    },
  ];

  @override
  void initState() {
    super.initState();
    _detectLocalTimezone();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      _fetchLanguages();
    }
  }

  void _detectLocalTimezone() {
    try {
      final now = DateTime.now();
      final offset = now.timeZoneOffset;
      final hours = offset.inHours;
      final minutes = (offset.inMinutes % 60).abs();
      final sign = hours >= 0 ? '+' : '-';
      final formattedHours = hours.abs().toString().padLeft(2, '0');
      final formattedMinutes = minutes.toString().padLeft(2, '0');
      _selectedTimezone = 'UTC$sign$formattedHours:$formattedMinutes';
    } catch (_) {
      _selectedTimezone = 'UTC';
    }
  }

  Future<void> _fetchLanguages() async {
    setState(() {
      _isLoadingLanguages = true;
      _errorMessage = null;
    });

    try {
      final authNotifier = AuthScope.of(context);
      final res = await authNotifier.apiClient.get<List<dynamic>>('/languages');

      if (mounted) {
        List<LanguageModel> languages = [];

        if (res.success && res.data != null) {
          for (final raw in res.data!) {
            if (raw is Map) {
              languages.add(LanguageModel.fromJson(Map<String, dynamic>.from(raw)));
            }
          }
        }

        if (languages.isEmpty) {
          languages = List.from(_defaultFallbackLanguages);
        }

        setState(() {
          _availableLanguages = languages;
          _isLoadingLanguages = false;

          // Default recommendations
          if (_availableLanguages.isNotEmpty) {
            _selectedNativeLanguage = _availableLanguages.firstWhere(
              (l) => l.code == 'hi' || l.code == 'en',
              orElse: () => _availableLanguages.first,
            );
            _selectedTargetLanguage = _availableLanguages.firstWhere(
              (l) => l.code != _selectedNativeLanguage?.code,
              orElse: () => _availableLanguages.last,
            );
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _availableLanguages = List.from(_defaultFallbackLanguages);
          _isLoadingLanguages = false;
          if (_availableLanguages.isNotEmpty) {
            _selectedNativeLanguage = _availableLanguages.firstWhere(
              (l) => l.code == 'hi' || l.code == 'en',
              orElse: () => _availableLanguages.first,
            );
            _selectedTargetLanguage = _availableLanguages.firstWhere(
              (l) => l.code != _selectedNativeLanguage?.code,
              orElse: () => _availableLanguages.last,
            );
          }
        });
      }
    }
  }

  Future<void> _submitOnboarding() async {
    if (_selectedNativeLanguage == null || _selectedTargetLanguage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your languages before completing setup')),
      );
      return;
    }

    if (_selectedNativeLanguage!.id == _selectedTargetLanguage!.id) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Native and target languages cannot be the same')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final authNotifier = AuthScope.of(context);
    final success = await authNotifier.completeOnboarding(
      nativeLanguageId: _selectedNativeLanguage!.id,
      targetLanguageId: _selectedTargetLanguage!.id,
      learningGoal: _selectedGoal,
      dailyMinutesGoal: _selectedMinutes,
      initialLevel: _selectedLevel,
      timezone: _selectedTimezone,
    );

    if (mounted) {
      setState(() {
        _isSubmitting = false;
      });

      if (!success) {
        setState(() {
          _errorMessage = authNotifier.state.errorMessage ?? 'Failed to save preferences';
        });
      }
    }
  }

  void _nextStep() {
    if (_currentStep == 1 && _selectedNativeLanguage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your native language')),
      );
      return;
    }

    if (_currentStep == 2) {
      if (_selectedTargetLanguage == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select a language to learn')),
        );
        return;
      }
      if (_selectedTargetLanguage?.id == _selectedNativeLanguage?.id) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Target language must be different from native language')),
        );
        return;
      }
    }

    if (_currentStep < _totalSteps - 1) {
      setState(() {
        _currentStep++;
      });
    } else {
      _submitOnboarding();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _prevStep,
              )
            : null,
        title: Text('Step ${_currentStep + 1} of $_totalSteps'),
        actions: [
          IconButton(
            icon: const Icon(Icons.dns_outlined),
            tooltip: 'Server Settings',
            onPressed: () => ServerConfigDialog.show(context),
          ),
          TextButton(
            onPressed: () {
              AuthScope.of(context).logout();
            },
            child: const Text('Logout'),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4.0),
          child: LinearProgressIndicator(
            value: (_currentStep + 1) / _totalSteps,
            backgroundColor: theme.colorScheme.surfaceContainerHighest,
          ),
        ),
      ),
      body: SafeArea(
        child: _isLoadingLanguages
            ? const Center(child: CircularProgressIndicator())
            : Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.errorContainer,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          _errorMessage!,
                          style: TextStyle(color: theme.colorScheme.onErrorContainer),
                        ),
                      ),
                    ],
                    Expanded(
                      child: SingleChildScrollView(
                        child: _buildCurrentStepContent(theme),
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _isSubmitting ? null : _nextStep,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5),
                            )
                          : Text(
                              _currentStep == _totalSteps - 1 ? 'Start Learning' : 'Continue',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildCurrentStepContent(ThemeData theme) {
    switch (_currentStep) {
      case 0:
        return _buildStepWelcome(theme);
      case 1:
        return _buildStepNativeLanguage(theme);
      case 2:
        return _buildStepTargetLanguage(theme);
      case 3:
        return _buildStepLearningGoal(theme);
      case 4:
        return _buildStepDailyCommitment(theme);
      case 5:
        return _buildStepPlacementLevel(theme);
      case 6:
        return _buildStepTimezoneReview(theme);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildStepWelcome(ThemeData theme) {
    return Column(
      children: [
        const SizedBox(height: 32),
        Container(
          width: 90,
          height: 90,
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer,
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.explore_rounded,
            size: 48,
            color: theme.colorScheme.onPrimaryContainer,
          ),
        ),
        const SizedBox(height: 28),
        Text(
          'Personalize Your Experience',
          textAlign: TextAlign.center,
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Let us customize your curriculum, AI tutors, and practice sessions to match your exact goals.',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildStepNativeLanguage(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What is your native language?',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'We will use this to explain grammatical concepts and vocabulary.',
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 20),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _availableLanguages.length,
          separatorBuilder: (context, index) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final lang = _availableLanguages[index];
            final isSelected = _selectedNativeLanguage?.id == lang.id;
            return Card(
              color: isSelected ? theme.colorScheme.primaryContainer : null,
              elevation: isSelected ? 2 : 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: ListTile(
                leading: Text(
                  lang.flagEmoji ?? '🌐',
                  style: const TextStyle(fontSize: 26),
                ),
                title: Text(
                  lang.name,
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                subtitle: lang.nativeName != null ? Text(lang.nativeName!) : null,
                trailing: isSelected
                    ? Icon(Icons.check_circle_rounded, color: theme.colorScheme.primary)
                    : null,
                onTap: () {
                  setState(() {
                    _selectedNativeLanguage = lang;
                  });
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildStepTargetLanguage(ThemeData theme) {
    final filteredLanguages = _availableLanguages
        .where((l) => l.id != _selectedNativeLanguage?.id)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What language do you want to learn?',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'Choose your target language. You can always add more languages later.',
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 20),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: filteredLanguages.length,
          separatorBuilder: (context, index) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final lang = filteredLanguages[index];
            final isSelected = _selectedTargetLanguage?.id == lang.id;
            return Card(
              color: isSelected ? theme.colorScheme.primaryContainer : null,
              elevation: isSelected ? 2 : 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: ListTile(
                leading: Text(
                  lang.flagEmoji ?? '🌐',
                  style: const TextStyle(fontSize: 26),
                ),
                title: Text(
                  lang.name,
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                subtitle: lang.nativeName != null ? Text(lang.nativeName!) : null,
                trailing: isSelected
                    ? Icon(Icons.check_circle_rounded, color: theme.colorScheme.primary)
                    : null,
                onTap: () {
                  setState(() {
                    _selectedTargetLanguage = lang;
                  });
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildStepLearningGoal(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Why are you learning this language?',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'This helps our AI tutor emphasize the vocabulary and drills you need most.',
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 20),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _learningGoals.length,
          separatorBuilder: (context, index) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final goal = _learningGoals[index];
            final isSelected = _selectedGoal == goal['id'];
            return Card(
              color: isSelected ? theme.colorScheme.primaryContainer : null,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: ListTile(
                leading: Icon(
                  goal['icon'] as IconData,
                  color: isSelected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant,
                ),
                title: Text(
                  goal['title'] as String,
                  style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
                ),
                subtitle: Text(goal['subtitle'] as String),
                trailing: isSelected
                    ? Icon(Icons.check_circle_rounded, color: theme.colorScheme.primary)
                    : null,
                onTap: () {
                  setState(() {
                    _selectedGoal = goal['id'] as String;
                  });
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildStepDailyCommitment(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What is your daily study goal?',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'Consistency is the key to language acquisition. Even 5 minutes a day builds a streak.',
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 24),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _commitmentOptions.length,
          separatorBuilder: (context, index) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final option = _commitmentOptions[index];
            final isSelected = _selectedMinutes == option['minutes'];
            return Card(
              color: isSelected ? theme.colorScheme.primaryContainer : null,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isSelected ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.timer_outlined,
                    size: 20,
                    color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                title: Text(
                  option['label'] as String,
                  style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
                ),
                subtitle: Text(option['desc'] as String),
                trailing: isSelected
                    ? Icon(Icons.check_circle_rounded, color: theme.colorScheme.primary)
                    : null,
                onTap: () {
                  setState(() {
                    _selectedMinutes = option['minutes'] as int;
                  });
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildStepPlacementLevel(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Select your starting level',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, size: 20, color: theme.colorScheme.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Notice: This is an initial self-selected baseline, not an officially assessed CEFR certification.',
                  style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _placementLevels.length,
          separatorBuilder: (context, index) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final level = _placementLevels[index];
            final isSelected = _selectedLevel == level['code'];
            return Card(
              color: isSelected ? theme.colorScheme.primaryContainer : null,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: ListTile(
                title: Text(
                  level['title'] as String,
                  style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
                ),
                subtitle: Text(level['desc'] as String),
                trailing: isSelected
                    ? Icon(Icons.check_circle_rounded, color: theme.colorScheme.primary)
                    : null,
                onTap: () {
                  setState(() {
                    _selectedLevel = level['code'] as String;
                  });
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildStepTimezoneReview(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Review & Confirm',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'Almost ready! Review your study profile before beginning.',
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                _buildSummaryRow('Native Language', '${_selectedNativeLanguage?.flagEmoji ?? ""} ${_selectedNativeLanguage?.name ?? ""}'),
                const Divider(),
                _buildSummaryRow('Target Language', '${_selectedTargetLanguage?.flagEmoji ?? ""} ${_selectedTargetLanguage?.name ?? ""}'),
                const Divider(),
                _buildSummaryRow('Goal', _learningGoals.firstWhere((g) => g['id'] == _selectedGoal)['title']),
                const Divider(),
                _buildSummaryRow('Daily Target', '$_selectedMinutes mins / day'),
                const Divider(),
                _buildSummaryRow('Initial Level', _selectedLevel),
                const Divider(),
                _buildSummaryRow('Timezone', _selectedTimezone),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
