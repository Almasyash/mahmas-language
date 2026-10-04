import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../network/api_client.dart';
import '../storage/token_storage.dart';
import 'auth_state.dart';

class AuthNotifier extends ChangeNotifier {
  final ApiClient apiClient;
  final TokenStorage tokenStorage;

  AuthState _state = AuthState.initializing();
  UserModel? _currentUser;

  AuthState get state => _state;
  UserModel? get currentUser => _currentUser;

  AuthNotifier({
    required this.apiClient,
    required this.tokenStorage,
  });

  void _setState(AuthState newState) {
    _state = newState;
    notifyListeners();
  }

  Future<void> initialize() async {
    _setState(AuthState.initializing());

    try {
      final token = await tokenStorage.getAccessToken();
      if (token == null || token.isEmpty) {
        _currentUser = null;
        _setState(AuthState.unauthenticated());
        return;
      }

      final res = await apiClient.get<Map<String, dynamic>>('/auth/me');
      if (res.success && res.data != null) {
        _currentUser = UserModel.fromJson(res.data!);
        if (_currentUser!.onboardingCompleted) {
          _setState(AuthState.authenticated());
        } else {
          _setState(AuthState.onboardingRequired());
        }
      } else {
        await tokenStorage.clearTokens();
        _currentUser = null;
        _setState(AuthState.unauthenticated());
      }
    } catch (e) {
      await tokenStorage.clearTokens();
      _currentUser = null;
      _setState(AuthState.unauthenticated());
    }
  }

  Future<bool> login(String email, String password) async {
    _setState(AuthState.loading());

    final res = await apiClient.post<Map<String, dynamic>>(
      '/auth/login',
      body: {
        'email': email.trim(),
        'password': password,
      },
    );

    if (res.success && res.data != null) {
      final data = res.data!;
      final accessToken = data['accessToken'] as String;
      final refreshToken = data['refreshToken'] as String;
      await tokenStorage.saveTokens(accessToken: accessToken, refreshToken: refreshToken);

      final userJson = data['user'] as Map<String, dynamic>;
      _currentUser = UserModel.fromJson(userJson);

      if (_currentUser!.onboardingCompleted) {
        _setState(AuthState.authenticated());
      } else {
        _setState(AuthState.onboardingRequired());
      }
      return true;
    } else {
      _setState(AuthState.error(res.errorMessage ?? 'Login failed'));
      return false;
    }
  }

  Future<bool> register(String email, String password, String displayName) async {
    _setState(AuthState.loading());

    final res = await apiClient.post<Map<String, dynamic>>(
      '/auth/register',
      body: {
        'email': email.trim(),
        'password': password,
        'displayName': displayName.trim(),
      },
    );

    if (res.success && res.data != null) {
      final data = res.data!;
      final accessToken = data['accessToken'] as String;
      final refreshToken = data['refreshToken'] as String;
      await tokenStorage.saveTokens(accessToken: accessToken, refreshToken: refreshToken);

      final userJson = data['user'] as Map<String, dynamic>;
      _currentUser = UserModel.fromJson(userJson);

      _setState(AuthState.onboardingRequired());
      return true;
    } else {
      _setState(AuthState.error(res.errorMessage ?? 'Registration failed'));
      return false;
    }
  }

  Future<bool> completeOnboarding({
    required String nativeLanguageId,
    required String targetLanguageId,
    required String learningGoal,
    required int dailyMinutesGoal,
    required String initialLevel,
    required String timezone,
  }) async {
    _setState(AuthState.loading());

    final res = await apiClient.post<Map<String, dynamic>>(
      '/users/me/onboarding',
      body: {
        'nativeLanguageId': nativeLanguageId,
        'targetLanguageId': targetLanguageId,
        'learningGoal': learningGoal,
        'dailyMinutesGoal': dailyMinutesGoal,
        'initialLevel': initialLevel,
        'timezone': timezone,
      },
    );

    if (res.success && res.data != null) {
      _currentUser = UserModel.fromJson(res.data!);
      _setState(AuthState.authenticated());
      return true;
    } else {
      _setState(AuthState.error(res.errorMessage ?? 'Failed to save onboarding preferences'));
      return false;
    }
  }

  Future<bool> updateProfile({
    String? displayName,
    String? bio,
    String? avatarUrl,
    int? dailyMinutesGoal,
    String? timezone,
    String? targetLanguageId,
    String? nativeLanguageId,
  }) async {
    final payload = <String, dynamic>{};
    if (displayName != null) payload['displayName'] = displayName;
    if (bio != null) payload['bio'] = bio;
    if (avatarUrl != null) payload['avatarUrl'] = avatarUrl;
    if (dailyMinutesGoal != null) payload['dailyMinutesGoal'] = dailyMinutesGoal;
    if (timezone != null) payload['timezone'] = timezone;
    if (targetLanguageId != null) payload['targetLanguageId'] = targetLanguageId;
    if (nativeLanguageId != null) payload['nativeLanguageId'] = nativeLanguageId;

    final res = await apiClient.patch<Map<String, dynamic>>(
      '/users/me/profile',
      body: payload,
    );

    if (res.success && res.data != null) {
      final updatedData = res.data!;
      _currentUser = _currentUser?.copyWith(
        displayName: updatedData['displayName'] as String?,
        bio: updatedData['bio'] as String?,
        avatarUrl: updatedData['avatarUrl'] as String?,
        dailyMinutesGoal: updatedData['dailyMinutesGoal'] as int?,
        timezone: updatedData['timezone'] as String?,
        nativeLanguage: updatedData['nativeLanguage'] != null
            ? LanguageModel.fromJson(updatedData['nativeLanguage'] as Map<String, dynamic>)
            : _currentUser?.nativeLanguage,
        targetLanguage: updatedData['targetLanguage'] != null
            ? LanguageModel.fromJson(updatedData['targetLanguage'] as Map<String, dynamic>)
            : _currentUser?.targetLanguage,
      );
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<void> refreshProfile() async {
    final res = await apiClient.get<Map<String, dynamic>>('/users/me/profile');
    if (res.success && res.data != null) {
      _currentUser = UserModel.fromJson(res.data!);
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await tokenStorage.getRefreshToken();
      await apiClient.post('/auth/logout', body: {'refreshToken': refreshToken});
    } catch (_) {}

    await tokenStorage.clearTokens();
    _currentUser = null;
    _setState(AuthState.unauthenticated());
  }

  void handleSessionExpired() {
    _currentUser = null;
    _setState(AuthState.unauthenticated());
  }
}
