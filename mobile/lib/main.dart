import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'core/auth/auth_notifier.dart';
import 'core/auth/auth_scope.dart';
import 'core/config/app_config.dart';
import 'core/network/api_client.dart';
import 'core/routing/app_router.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final tokenStorage = TokenStorage();
  final savedServerUrl = await tokenStorage.getServerUrl();

  // Production API URL: saved custom URL > production endpoint
  final String apiBaseUrl = savedServerUrl ?? AppConfig.defaultApiBaseUrl;

  final apiClient = ApiClient(
    baseUrl: apiBaseUrl,
    tokenStorage: tokenStorage,
  );

  final authNotifier = AuthNotifier(
    apiClient: apiClient,
    tokenStorage: tokenStorage,
  );

  // Initialize and check stored session
  await authNotifier.initialize();

  runApp(MahmasLanguageApp(authNotifier: authNotifier));
}

class MahmasLanguageApp extends StatelessWidget {
  final AuthNotifier authNotifier;

  const MahmasLanguageApp({
    super.key,
    required this.authNotifier,
  });

  @override
  Widget build(BuildContext context) {
    return AuthScope(
      notifier: authNotifier,
      child: MaterialApp(
        title: AppConfig.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        initialRoute: AppRouter.root,
        onGenerateRoute: AppRouter.generateRoute,
      ),
    );
  }
}
