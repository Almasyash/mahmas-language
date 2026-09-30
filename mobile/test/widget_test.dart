import 'package:flutter_test/flutter_test.dart';
import 'package:mahmas_language/core/config/app_config.dart';
import 'package:mahmas_language/main.dart';

void main() {
  testWidgets('App smoke test renders home dashboard and branding', (WidgetTester tester) async {
    await tester.pumpWidget(const MahmasLanguageApp());

    // Verify app brand is rendered
    expect(find.text(AppConfig.appName), findsOneWidget);
    expect(find.text('Learn Path'), findsOneWidget);
    expect(find.text('Learn'), findsOneWidget);
    expect(find.text('Practice'), findsOneWidget);
    expect(find.text('AI Tutor'), findsOneWidget);
    expect(find.text('Exchange'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });
}
