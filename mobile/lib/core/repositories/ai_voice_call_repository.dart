// ==============================================================================
// MAHMAS LANGUAGE — AI VOICE CALL REPOSITORY
// Client repository for initiating and managing live voice calling sessions
// ==============================================================================

import '../models/ai_voice_call_model.dart';
import '../network/api_client.dart';

class AIVoiceCallRepository {
  final ApiClient? apiClient;

  AIVoiceCallRepository({this.apiClient});

  /// Initiates a live voice calling session with an AI tutor character
  Future<AIVoiceCallModel> initiateVoiceCall({
    required String characterId,
    String? topic,
  }) async {
    final res = await apiClient!.post<Map<String, dynamic>>(
      '/ai/calls/initiate',
      body: {
        'characterId': characterId,
        'topic': ?topic,
      },
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to initiate AI voice call.');
    }
    return AIVoiceCallModel.fromJson(res.data!['call'] as Map<String, dynamic>);
  }

  /// Sends a user spoken utterance (or audio base64) and receives phonetic analysis and synthesized audio
  Future<VoiceTurnResultModel> sendVoiceTurn({
    required String callId,
    String? audioBase64,
    String? spokenText,
    int? audioDurationMs,
  }) async {
    final res = await apiClient!.post<Map<String, dynamic>>(
      '/ai/calls/$callId/turn',
      body: {
        'audioBase64': ?audioBase64,
        'spokenText': ?spokenText,
        'audioDurationMs': ?audioDurationMs,
      },
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to process voice turn.');
    }
    return VoiceTurnResultModel.fromJson(res.data!);
  }

  /// Concludes the voice call, triggers authoritative server scoring, and returns the debrief
  Future<VoiceCallDebriefModel> endVoiceCall({
    required String callId,
    int? durationSec,
  }) async {
    final res = await apiClient!.post<Map<String, dynamic>>(
      '/ai/calls/$callId/end',
      body: {
        'durationSec': ?durationSec,
      },
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to end AI voice call.');
    }
    return VoiceCallDebriefModel.fromJson(res.data!['debrief'] as Map<String, dynamic>);
  }

  /// Retrieves the current state of a voice call session
  Future<AIVoiceCallModel> getVoiceCall(String callId) async {
    final res = await apiClient!.get<Map<String, dynamic>>('/ai/calls/$callId');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load voice call session.');
    }
    return AIVoiceCallModel.fromJson(res.data!['call'] as Map<String, dynamic>);
  }
}
