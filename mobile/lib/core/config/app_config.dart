import 'package:flutter/material.dart';

/// Configurable brand and environment settings.
/// Allows changing the brand name, colors, typography, and API endpoints
/// without modifying application business logic or UI components.
class AppConfig {
  static const String appName = 'Speakly_FS';
  static const String appVersion = '1.0.0+1';
  static const String tagline = 'Master Languages Through Natural Conversation';
  static const String defaultFontFamily = 'Roboto';

  // API & Gateway Endpoints (configurable per flavor/environment)
  static const String defaultApiBaseUrl = 'https://speakly.fsgroupz.com/api/v1';
  static const String fallbackApiBaseUrl = 'https://speakly-fs.onrender.com/api/v1';
  static const String defaultWsBaseUrl = 'wss://speakly.fsgroupz.com/ws';
  static const String fallbackWsBaseUrl = 'wss://speakly-fs.onrender.com/ws';

  // Configurable Brand Palette (Material 3 Seed & Semantic Accents)
  static const Color brandPrimary = Color(0xFF1E88E5); // Vibrant Indigo-Blue
  static const Color brandSecondary = Color(0xFF00BFA5); // Teal Accent
  static const Color brandTertiary = Color(0xFFFFB300); // Amber XP / Gem
  static const Color brandSuccess = Color(0xFF43A047); // Green correct
  static const Color brandError = Color(0xFFE53935); // Red mistake
  static const Color brandSurfaceLight = Color(0xFFF8F9FA);
  static const Color brandSurfaceDark = Color(0xFF121212);
}
