import 'package:flutter/material.dart';
import '../auth/auth_scope.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/signup_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/lessons/lesson_runner_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/practice/mistake_review_screen.dart';
import '../../features/practice/practice_runner_screen.dart';
import '../../features/practice/practice_screen.dart';
import '../../features/practice/vocabulary_review_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/ai_tutor/ai_tutor_selection_screen.dart';
import '../../features/ai_voice_call/ai_voice_call_screen.dart';
import '../../features/ai_video_call/ai_video_call_screen.dart';
import '../models/ai_tutor_model.dart';

class AppRouter {
  static const String root = '/';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String onboarding = '/onboarding';
  static const String home = '/home';
  static const String profile = '/profile';
  static const String practice = '/practice';
  static const String practiceSession = '/practice/session';
  static const String practiceMistakes = '/practice/mistakes';
  static const String practiceVocabulary = '/practice/vocabulary';
  static const String coursePath = '/courses';
  static const String lesson = '/lesson';
  static const String lessonRun = '/lesson/run';
  static const String aiTutor = '/ai-tutor';
  static const String aiVoiceCall = '/ai-voice-call';
  static const String aiVideoCall = '/ai-video-call';
  static const String languageExchange = '/language-exchange';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case root:
        return MaterialPageRoute(builder: (_) => const AppGate());
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case signup:
        return MaterialPageRoute(builder: (_) => const SignupScreen());
      case onboarding:
        return MaterialPageRoute(builder: (_) => const OnboardingScreen());
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      case practice:
        return MaterialPageRoute(builder: (_) => const PracticeScreen());
      case practiceSession:
        final sessionType = settings.arguments as String? ?? 'RECOMMENDED';
        return MaterialPageRoute(builder: (_) => PracticeRunnerScreen(sessionType: sessionType));
      case practiceMistakes:
        return MaterialPageRoute(builder: (_) => const MistakeReviewScreen());
      case practiceVocabulary:
        return MaterialPageRoute(builder: (_) => const VocabularyReviewScreen());
      case lessonRun:
        final args = settings.arguments as Map<String, dynamic>? ?? {};
        return MaterialPageRoute(
          builder: (_) => LessonRunnerScreen(
            lessonId: args['lessonId'] as String? ?? '',
            lessonTitle: args['lessonTitle'] as String? ?? 'Lesson',
          ),
        );
      case aiTutor:
        return MaterialPageRoute(builder: (_) => const AITutorSelectionScreen());
      case aiVoiceCall:
        final character = settings.arguments as AICharacterModel?;
        if (character == null) {
          return MaterialPageRoute(builder: (_) => const AITutorSelectionScreen());
        }
        return MaterialPageRoute(builder: (_) => AIVoiceCallScreen(character: character));
      case aiVideoCall:
        final character = settings.arguments as AICharacterModel?;
        if (character == null) {
          return MaterialPageRoute(builder: (_) => const AITutorSelectionScreen());
        }
        return MaterialPageRoute(builder: (_) => AIVideoCallScreen(character: character));
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Text('No route defined for ${settings.name}'),
            ),
          ),
        );
    }
  }
}

/// AppGate provides the reactive authentication router
class AppGate extends StatelessWidget {
  const AppGate({super.key});

  @override
  Widget build(BuildContext context) {
    final authNotifier = AuthScope.of(context);
    final state = authNotifier.state;

    if (state.isInitializing) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.auto_stories_rounded,
                  size: 38,
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                ),
              ),
              const SizedBox(height: 24),
              const CircularProgressIndicator(),
            ],
          ),
        ),
      );
    }

    if (state.isUnauthenticated) {
      return const LoginScreen();
    }

    if (state.isOnboardingRequired) {
      return const OnboardingScreen();
    }

    if (state.isAuthenticated) {
      return const HomeScreen();
    }

    // Default fallback to Login
    return const LoginScreen();
  }
}
