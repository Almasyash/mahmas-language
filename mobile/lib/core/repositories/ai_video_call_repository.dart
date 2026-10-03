// ==============================================================================
// MAHMAS LANGUAGE — AI VIDEO CALL REPOSITORY
// Client repository for initiating and managing live video calling sessions
// ==============================================================================

import '../models/ai_video_call_model.dart';
import '../network/api_client.dart';

class AIVideoCallRepository {
  final ApiClient? apiClient;

  AIVideoCallRepository({this.apiClient});

  /// Initiates an interactive video calling session with an AI tutor avatar
  Future<AIVideoCallModel> initiateVideoCall({
    required String characterId,
    String? topic,
    String? sceneSetting,
  }) async {
    final res = await apiClient!.post<Map<String, dynamic>>(
      '/ai/video-calls/initiate',
      body: {
        'characterId': characterId,
        'topic': ?topic,
        'sceneSetting': ?sceneSetting,
      },
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to initiate AI video call.');
    }
    return AIVideoCallModel.fromJson(res.data!['call'] as Map<String, dynamic>);
  }

  /// Sends user spoken audio/transcript and returns AI reply, synchronized mouth visemes, and emotion
  Future<VideoTurnResultModel> sendVideoTurn({
    required String callId,
    String? spokenText,
    String? audioBase64,
    int? audioDurationMs,
    bool? requestHelpHint,
  }) async {
    final res = await apiClient!.post<Map<String, dynamic>>(
      '/ai/video-calls/$callId/turn',
      body: {
        'spokenText': ?spokenText,
        'audioBase64': ?audioBase64,
        'audioDurationMs': ?audioDurationMs,
        'requestHelpHint': ?requestHelpHint,
      },
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to process video turn.');
    }
    return VideoTurnResultModel.fromJson(res.data!);
  }

  /// Concludes the video call, awarding authoritative server XP, Gems, and debrief metrics
  Future<VideoCallDebriefModel> endVideoCall({
    required String callId,
    int? durationSec,
  }) async {
    final res = await apiClient!.post<Map<String, dynamic>>(
      '/ai/video-calls/$callId/end',
      body: {
        'durationSec': ?durationSec,
      },
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to conclude AI video call.');
    }
    return VideoCallDebriefModel.fromJson(res.data!['debrief'] as Map<String, dynamic>);
  }

  /// Fetches state of an active video call session
  Future<AIVideoCallModel> getVideoCall(String callId) async {
    final res = await apiClient!.get<Map<String, dynamic>>('/ai/video-calls/$callId');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to fetch video call.');
    }
    return AIVideoCallModel.fromJson(res.data!['call'] as Map<String, dynamic>);
  }
}
