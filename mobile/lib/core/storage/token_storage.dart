import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const String _keyAccessToken = 'mahmas_access_token';
  static const String _keyRefreshToken = 'mahmas_refresh_token';

  final FlutterSecureStorage? _storage;
  final Map<String, String> _memoryStorage;

  TokenStorage({
    FlutterSecureStorage? storage,
    bool inMemory = false,
    Map<String, String>? initialData,
  })  : _memoryStorage = initialData != null ? Map<String, String>.from(initialData) : <String, String>{},
        _storage = inMemory
            ? null
            : (storage ??
                const FlutterSecureStorage(
                  aOptions: AndroidOptions(encryptedSharedPreferences: true),
                  iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
                ));

  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    if (_storage == null) {
      _memoryStorage[_keyAccessToken] = accessToken;
      _memoryStorage[_keyRefreshToken] = refreshToken;
      return;
    }
    await _storage.write(key: _keyAccessToken, value: accessToken);
    await _storage.write(key: _keyRefreshToken, value: refreshToken);
  }

  Future<String?> getAccessToken() async {
    if (_storage == null) {
      return _memoryStorage[_keyAccessToken];
    }
    return await _storage.read(key: _keyAccessToken);
  }

  Future<String?> getRefreshToken() async {
    if (_storage == null) {
      return _memoryStorage[_keyRefreshToken];
    }
    return await _storage.read(key: _keyRefreshToken);
  }

  Future<void> clearTokens() async {
    if (_storage == null) {
      _memoryStorage.remove(_keyAccessToken);
      _memoryStorage.remove(_keyRefreshToken);
      return;
    }
    await _storage.delete(key: _keyAccessToken);
    await _storage.delete(key: _keyRefreshToken);
  }
}
