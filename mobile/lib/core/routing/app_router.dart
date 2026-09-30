import 'package:flutter/material.dart';
import '../../features/home/home_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';

class AppRouter {
  static const String home = '/';
  static const String onboarding = '/onboarding';
  static const String coursePath = '/courses';
  static const String lesson = '/lesson';
  static const String aiTutor = '/ai-tutor';
  static const String languageExchange = '/language-exchange';
  static const String profile = '/profile';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case onboarding:
        return MaterialPageRoute(builder: (_) => const OnboardingScreen());
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
