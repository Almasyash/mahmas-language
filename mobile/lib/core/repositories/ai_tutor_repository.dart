// ==============================================================================
// MAHMAS LANGUAGE — AI TUTOR REPOSITORY
// Communicates with backend AI Tutor characters, multi-turn chat, and debrief APIs
// ==============================================================================

import '../models/ai_tutor_model.dart';
import '../network/api_client.dart';

class AITutorRepository {
  final ApiClient? apiClient;

  AITutorRepository({this.apiClient});

  /// Fetches available AI Characters, optionally filtered by language and level
  Future<List<AICharacterModel>> getCharacters({
    String? targetLanguage,
    String? level,
  }) async {
    if (apiClient == null) {
      throw Exception('ApiClient is not configured.');
    }

    String query = '';
    final params = <String>[];
    if (targetLanguage != null) params.add('targetLanguage=$targetLanguage');
    if (level != null) params.add('level=$level');
    if (params.isNotEmpty) query = '?${params.join('&')}';

    final res = await apiClient!.get<Map<String, dynamic>>('/ai/characters$query');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load AI characters.');
    }

    final list = res.data!['characters'] as List<dynamic>? ?? [];
    return list.map((e) => AICharacterModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Fetches a specific AI Character by ID
  Future<AICharacterModel> getCharacterById(String characterId) async {
    final res = await apiClient!.get<Map<String, dynamic>>('/ai/characters/$characterId');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load AI character.');
    }
    return AICharacterModel.fromJson(res.data!['character'] as Map<String, dynamic>);
  }

  /// Starts a new conversation with an AI character
  Future<AIConversationModel> startConversation({
    required String characterId,
    String? topic,
  }) async {
    final res = await apiClient!.post<Map<String, dynamic>>(
      '/ai/conversations',
      body: {
        'characterId': characterId,
        'topic': ?topic,
      },
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to start AI conversation.');
    }
    return AIConversationModel.fromJson(res.data!['conversation'] as Map<String, dynamic>);
  }

  /// Retrieves an existing conversation with full message history and memories
  Future<AIConversationModel> getConversation(String conversationId) async {
    final res = await apiClient!.get<Map<String, dynamic>>('/ai/conversations/$conversationId');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load AI conversation.');
    }
    return AIConversationModel.fromJson(res.data!['conversation'] as Map<String, dynamic>);
  }

  /// Sends a user utterance and receives the assistant reply with pedagogical feedback
  Future<Map<String, dynamic>> sendMessage({
    required String conversationId,
    required String content,
  }) async {
    final res = await apiClient!.post<Map<String, dynamic>>(
      '/ai/conversations/$conversationId/messages',
      body: {'content': content},
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to send message to AI tutor.');
    }
    return res.data!;
  }

  /// Concludes the session, authoritatively awards XP & Gems, and returns the debrief
  Future<ConversationDebriefModel> endConversation({
    required String conversationId,
    int? durationSec,
  }) async {
    final res = await apiClient!.post<Map<String, dynamic>>(
      '/ai/conversations/$conversationId/end',
      body: {
        'durationSec': ?durationSec,
      },
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to conclude AI conversation.');
    }
    return ConversationDebriefModel.fromJson(res.data!['debrief'] as Map<String, dynamic>);
  }

  /// Lists past conversation sessions
  Future<List<AIConversationModel>> listConversations() async {
    final res = await apiClient!.get<Map<String, dynamic>>('/ai/conversations');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load conversations.');
    }
    final list = res.data!['conversations'] as List<dynamic>? ?? [];
    return list.map((e) => AIConversationModel.fromJson(e as Map<String, dynamic>)).toList();
  }
}
