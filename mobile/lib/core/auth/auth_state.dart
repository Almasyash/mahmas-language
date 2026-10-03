enum AuthStatus {
  initializing,
  unauthenticated,
  authenticated,
  onboardingRequired,
  loading,
  error,
}

class AuthState {
  final AuthStatus status;
  final String? errorMessage;

  const AuthState({
    required this.status,
    this.errorMessage,
  });

  factory AuthState.initializing() => const AuthState(status: AuthStatus.initializing);
  factory AuthState.unauthenticated() => const AuthState(status: AuthStatus.unauthenticated);
  factory AuthState.authenticated() => const AuthState(status: AuthStatus.authenticated);
  factory AuthState.onboardingRequired() => const AuthState(status: AuthStatus.onboardingRequired);
  factory AuthState.loading() => const AuthState(status: AuthStatus.loading);
  factory AuthState.error(String message) => AuthState(status: AuthStatus.error, errorMessage: message);

  bool get isInitializing => status == AuthStatus.initializing;
  bool get isUnauthenticated => status == AuthStatus.unauthenticated;
  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isOnboardingRequired => status == AuthStatus.onboardingRequired;
  bool get isLoading => status == AuthStatus.loading;
  bool get hasError => status == AuthStatus.error;
}
