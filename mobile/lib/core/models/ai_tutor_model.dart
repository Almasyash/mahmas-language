class AICharacterModel {
  final String id;
  final String name;
  final String avatarUrl;
  final String personalityPrompt;
  final String? defaultVoice;
  final String targetLanguageCode;
  final String difficultyCEFR;
  final bool isActive;
  final String scenarioTitle;
  final List<String> suggestedTopics;

  AICharacterModel({
    required this.id,
    required this.name,
    required this.avatarUrl,
    required this.personalityPrompt,
    this.defaultVoice,
    required this.targetLanguageCode,
    required this.difficultyCEFR,
    this.isActive = true,
    this.scenarioTitle = 'General Dialogue',
    this.suggestedTopics = const [],
  });

  factory AICharacterModel.fromJson(Map<String, dynamic> json) {
    return AICharacterModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String? ?? '',
      personalityPrompt: json['personalityPrompt'] as String? ?? '',
      defaultVoice: json['defaultVoice'] as String?,
      targetLanguageCode: json['targetLanguageCode'] as String? ?? 'es',
      difficultyCEFR: json['difficultyCEFR'] as String? ?? 'A1',
      isActive: json['isActive'] as bool? ?? true,
      scenarioTitle: json['scenarioTitle'] as String? ?? 'General Dialogue',
      suggestedTopics: (json['suggestedTopics'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatarUrl': avatarUrl,
      'personalityPrompt': personalityPrompt,
      'defaultVoice': defaultVoice,
      'targetLanguageCode': targetLanguageCode,
      'difficultyCEFR': difficultyCEFR,
      'isActive': isActive,
      'scenarioTitle': scenarioTitle,
      'suggestedTopics': suggestedTopics,
    };
  }
}

class AIMessageModel {
  final String id;
  final String conversationId;
  final String senderRole; // 'USER' | 'ASSISTANT'
  final String content;
  final String? audioUrl;
  final String? correctionNote;
  final DateTime createdAt;

  bool get isUser => senderRole == 'USER';
  bool get hasCorrection => correctionNote != null && correctionNote!.isNotEmpty;

  AIMessageModel({
    required this.id,
    required this.conversationId,
    required this.senderRole,
    required this.content,
    this.audioUrl,
    this.correctionNote,
    required this.createdAt,
  });

  factory AIMessageModel.fromJson(Map<String, dynamic> json) {
    return AIMessageModel(
      id: json['id'] as String? ?? '',
      conversationId: json['conversationId'] as String? ?? '',
      senderRole: json['senderRole'] as String? ?? 'USER',
      content: json['content'] as String? ?? '',
      audioUrl: json['audioUrl'] as String?,
      correctionNote: json['correctionNote'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderRole': senderRole,
      'content': content,
      'audioUrl': audioUrl,
      'correctionNote': correctionNote,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class AIMemoryModel {
  final String id;
  final String memoryKey;
  final String memoryValue;
  final DateTime createdAt;

  AIMemoryModel({
    required this.id,
    required this.memoryKey,
    required this.memoryValue,
    required this.createdAt,
  });

  factory AIMemoryModel.fromJson(Map<String, dynamic> json) {
    return AIMemoryModel(
      id: json['id'] as String? ?? '',
      memoryKey: json['memoryKey'] as String? ?? '',
      memoryValue: json['memoryValue'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'memoryKey': memoryKey,
      'memoryValue': memoryValue,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class AIConversationModel {
  final String id;
  final String userId;
  final String characterId;
  final AICharacterModel character;
  final String? topic;
  final DateTime startedAt;
  final DateTime? endedAt;
  final List<AIMessageModel> messages;
  final List<AIMemoryModel> memories;
  final int totalTurns;

  bool get isEnded => endedAt != null;

  AIConversationModel({
    required this.id,
    required this.userId,
    required this.characterId,
    required this.character,
    this.topic,
    required this.startedAt,
    this.endedAt,
    required this.messages,
    required this.memories,
    required this.totalTurns,
  });

  factory AIConversationModel.fromJson(Map<String, dynamic> json) {
    return AIConversationModel(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      characterId: json['characterId'] as String? ?? '',
      character: json['character'] != null
          ? AICharacterModel.fromJson(json['character'] as Map<String, dynamic>)
          : AICharacterModel(
              id: '',
              name: 'AI Tutor',
              avatarUrl: '',
              personalityPrompt: '',
              targetLanguageCode: 'es',
              difficultyCEFR: 'A1',
            ),
      topic: json['topic'] as String?,
      startedAt: json['startedAt'] != null
          ? DateTime.tryParse(json['startedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endedAt: json['endedAt'] != null
          ? DateTime.tryParse(json['endedAt'].toString())
          : null,
      messages: (json['messages'] as List<dynamic>?)
              ?.map((e) => AIMessageModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      memories: (json['memories'] as List<dynamic>?)
              ?.map((e) => AIMemoryModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      totalTurns: json['totalTurns'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'characterId': characterId,
      'character': character.toJson(),
      'topic': topic,
      'startedAt': startedAt.toIso8601String(),
      'endedAt': endedAt?.toIso8601String(),
      'messages': messages.map((e) => e.toJson()).toList(),
      'memories': memories.map((e) => e.toJson()).toList(),
      'totalTurns': totalTurns,
    };
  }
}

class ConversationDebriefModel {
  final String conversationId;
  final String characterName;
  final int totalMessages;
  final int correctionsCount;
  final int durationSec;
  final int xpAwarded;
  final int gemsAwarded;
  final List<String> unlockedAchievements;
  final List<String> vocabularyPracticed;
  final String feedbackSummary;

  ConversationDebriefModel({
    required this.conversationId,
    required this.characterName,
    required this.totalMessages,
    required this.correctionsCount,
    required this.durationSec,
    required this.xpAwarded,
    required this.gemsAwarded,
    required this.unlockedAchievements,
    required this.vocabularyPracticed,
    required this.feedbackSummary,
  });

  factory ConversationDebriefModel.fromJson(Map<String, dynamic> json) {
    return ConversationDebriefModel(
      conversationId: json['conversationId'] as String? ?? '',
      characterName: json['characterName'] as String? ?? '',
      totalMessages: json['totalMessages'] as int? ?? 0,
      correctionsCount: json['correctionsCount'] as int? ?? 0,
      durationSec: json['durationSec'] as int? ?? 0,
      xpAwarded: json['xpAwarded'] as int? ?? 0,
      gemsAwarded: json['gemsAwarded'] as int? ?? 0,
      unlockedAchievements: (json['unlockedAchievements'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      vocabularyPracticed: (json['vocabularyPracticed'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      feedbackSummary: json['feedbackSummary'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'conversationId': conversationId,
      'characterName': characterName,
      'totalMessages': totalMessages,
      'correctionsCount': correctionsCount,
      'durationSec': durationSec,
      'xpAwarded': xpAwarded,
      'gemsAwarded': gemsAwarded,
      'unlockedAchievements': unlockedAchievements,
      'vocabularyPracticed': vocabularyPracticed,
      'feedbackSummary': feedbackSummary,
    };
  }
}
