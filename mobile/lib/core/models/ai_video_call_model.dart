// ==============================================================================
// MAHMAS LANGUAGE — AI VIDEO CALL MODELS
// Data structures for avatar animation, visemes, visual props, & video debrief
// ==============================================================================

import 'ai_tutor_model.dart';
import 'ai_voice_call_model.dart';

enum AvatarEmotion {
  neutral,
  happy,
  encouraging,
  thoughtful,
  surprised,
  celebrating;

  static AvatarEmotion fromString(String val) {
    switch (val.toLowerCase()) {
      case 'happy':
        return AvatarEmotion.happy;
      case 'encouraging':
        return AvatarEmotion.encouraging;
      case 'thoughtful':
        return AvatarEmotion.thoughtful;
      case 'surprised':
        return AvatarEmotion.surprised;
      case 'celebrating':
        return AvatarEmotion.celebrating;
      case 'neutral':
      default:
        return AvatarEmotion.neutral;
    }
  }

  String get displayName {
    switch (this) {
      case AvatarEmotion.happy:
        return 'Happy 😊';
      case AvatarEmotion.encouraging:
        return 'Encouraging 👍';
      case AvatarEmotion.thoughtful:
        return 'Thoughtful 🤔';
      case AvatarEmotion.surprised:
        return 'Surprised 😲';
      case AvatarEmotion.celebrating:
        return 'Celebrating 🎉';
      case AvatarEmotion.neutral:
        return 'Attentive 😌';
    }
  }
}

enum VisemeType {
  rest,
  aa,
  ee,
  oo,
  ch,
  ff;

  static VisemeType fromString(String val) {
    switch (val.toLowerCase()) {
      case 'aa':
        return VisemeType.aa;
      case 'ee':
        return VisemeType.ee;
      case 'oo':
        return VisemeType.oo;
      case 'ch':
        return VisemeType.ch;
      case 'ff':
        return VisemeType.ff;
      case 'rest':
      default:
        return VisemeType.rest;
    }
  }
}

enum VideoCallStatus {
  connecting,
  connected,
  ended;

  static VideoCallStatus fromString(String val) {
    switch (val.toUpperCase()) {
      case 'CONNECTED':
        return VideoCallStatus.connected;
      case 'ENDED':
        return VideoCallStatus.ended;
      case 'CONNECTING':
      default:
        return VideoCallStatus.connecting;
    }
  }
}

class VisemeFrameModel {
  final VisemeType viseme;
  final int timestampMs;
  final int durationMs;

  const VisemeFrameModel({
    required this.viseme,
    required this.timestampMs,
    required this.durationMs,
  });

  factory VisemeFrameModel.fromJson(Map<String, dynamic> json) {
    return VisemeFrameModel(
      viseme: VisemeType.fromString(json['viseme'] as String? ?? 'rest'),
      timestampMs: (json['timestampMs'] as num?)?.toInt() ?? 0,
      durationMs: (json['durationMs'] as num?)?.toInt() ?? 100,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'viseme': viseme.name,
      'timestampMs': timestampMs,
      'durationMs': durationMs,
    };
  }
}

class VisualAidCueModel {
  final String id;
  final String title;
  final String category;
  final String headline;
  final String body;
  final List<String> targetVocab;
  final String? imageUrl;

  const VisualAidCueModel({
    required this.id,
    required this.title,
    required this.category,
    required this.headline,
    required this.body,
    required this.targetVocab,
    this.imageUrl,
  });

  factory VisualAidCueModel.fromJson(Map<String, dynamic> json) {
    return VisualAidCueModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      category: json['category'] as String? ?? 'flashcard',
      headline: json['headline'] as String? ?? '',
      body: json['body'] as String? ?? '',
      targetVocab: (json['targetVocab'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'category': category,
      'headline': headline,
      'body': body,
      'targetVocab': targetVocab,
      if (imageUrl != null) 'imageUrl': imageUrl,
    };
  }
}

class AIVideoCallModel {
  final String id;
  final String conversationId;
  final String characterId;
  final AICharacterModel character;
  final VideoCallStatus status;
  final DateTime startedAt;
  final DateTime? endedAt;
  final int durationSec;
  final int turnCount;
  final String greetingText;
  final String greetingAudioBase64;
  final String audioMimeType;
  final AvatarEmotion currentEmotion;
  final List<VisemeFrameModel> initialVisemes;
  final VisualAidCueModel? initialVisualAid;
  final String sceneSetting;

  const AIVideoCallModel({
    required this.id,
    required this.conversationId,
    required this.characterId,
    required this.character,
    required this.status,
    required this.startedAt,
    this.endedAt,
    required this.durationSec,
    required this.turnCount,
    required this.greetingText,
    required this.greetingAudioBase64,
    required this.audioMimeType,
    required this.currentEmotion,
    required this.initialVisemes,
    this.initialVisualAid,
    required this.sceneSetting,
  });

  factory AIVideoCallModel.fromJson(Map<String, dynamic> json) {
    return AIVideoCallModel(
      id: json['id'] as String? ?? '',
      conversationId: json['conversationId'] as String? ?? '',
      characterId: json['characterId'] as String? ?? '',
      character: json['character'] != null
          ? AICharacterModel.fromJson(json['character'] as Map<String, dynamic>)
          : AICharacterModel(
              id: 'mateo-cafe',
              name: 'Mateo (Barista)',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
              personalityPrompt: 'You are Mateo, a friendly barista in Madrid.',
              targetLanguageCode: 'es',
              difficultyCEFR: 'A1',
            ),
      status: VideoCallStatus.fromString(json['status'] as String? ?? 'CONNECTED'),
      startedAt: json['startedAt'] != null
          ? DateTime.tryParse(json['startedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      endedAt: json['endedAt'] != null ? DateTime.tryParse(json['endedAt'] as String) : null,
      durationSec: (json['durationSec'] as num?)?.toInt() ?? 0,
      turnCount: (json['turnCount'] as num?)?.toInt() ?? 0,
      greetingText: json['greetingText'] as String? ?? '',
      greetingAudioBase64: json['greetingAudioBase64'] as String? ?? '',
      audioMimeType: json['audioMimeType'] as String? ?? 'audio/wav',
      currentEmotion: AvatarEmotion.fromString(json['currentEmotion'] as String? ?? 'happy'),
      initialVisemes: (json['initialVisemes'] as List<dynamic>?)
              ?.map((v) => VisemeFrameModel.fromJson(v as Map<String, dynamic>))
              .toList() ??
          [],
      initialVisualAid: json['initialVisualAid'] != null
          ? VisualAidCueModel.fromJson(json['initialVisualAid'] as Map<String, dynamic>)
          : null,
      sceneSetting: json['sceneSetting'] as String? ?? 'General Scenario',
    );
  }
}

class VideoTurnResultModel {
  final int turnIndex;
  final String userTranscription;
  final int pronunciationScore;
  final int fluencyScore;
  final int facialEngagementScore;
  final List<PhonemeScoreModel> phonemeFeedback;
  final String assistantReply;
  final String assistantAudioBase64;
  final String audioMimeType;
  final AvatarEmotion emotion;
  final String gesture;
  final List<VisemeFrameModel> visemes;
  final VisualAidCueModel? visualAid;
  final String? correctionNote;
  final String? pronunciationAdvice;
  final String difficultyLevel;
  final int xpAwarded;
  final int totalTurns;

  const VideoTurnResultModel({
    required this.turnIndex,
    required this.userTranscription,
    required this.pronunciationScore,
    required this.fluencyScore,
    required this.facialEngagementScore,
    required this.phonemeFeedback,
    required this.assistantReply,
    required this.assistantAudioBase64,
    required this.audioMimeType,
    required this.emotion,
    required this.gesture,
    required this.visemes,
    this.visualAid,
    this.correctionNote,
    this.pronunciationAdvice,
    required this.difficultyLevel,
    required this.xpAwarded,
    required this.totalTurns,
  });

  factory VideoTurnResultModel.fromJson(Map<String, dynamic> json) {
    return VideoTurnResultModel(
      turnIndex: (json['turnIndex'] as num?)?.toInt() ?? 1,
      userTranscription: json['userTranscription'] as String? ?? '',
      pronunciationScore: (json['pronunciationScore'] as num?)?.toInt() ?? 85,
      fluencyScore: (json['fluencyScore'] as num?)?.toInt() ?? 85,
      facialEngagementScore: (json['facialEngagementScore'] as num?)?.toInt() ?? 90,
      phonemeFeedback: (json['phonemeFeedback'] as List<dynamic>?)
              ?.map((p) => PhonemeScoreModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [],
      assistantReply: json['assistantReply'] as String? ?? '',
      assistantAudioBase64: json['assistantAudioBase64'] as String? ?? '',
      audioMimeType: json['audioMimeType'] as String? ?? 'audio/wav',
      emotion: AvatarEmotion.fromString(json['emotion'] as String? ?? 'happy'),
      gesture: json['gesture'] as String? ?? 'rest',
      visemes: (json['visemes'] as List<dynamic>?)
              ?.map((v) => VisemeFrameModel.fromJson(v as Map<String, dynamic>))
              .toList() ??
          [],
      visualAid: json['visualAid'] != null
          ? VisualAidCueModel.fromJson(json['visualAid'] as Map<String, dynamic>)
          : null,
      correctionNote: json['correctionNote'] as String?,
      pronunciationAdvice: json['pronunciationAdvice'] as String?,
      difficultyLevel: json['difficultyLevel'] as String? ?? 'A1',
      xpAwarded: (json['xpAwarded'] as num?)?.toInt() ?? 7,
      totalTurns: (json['totalTurns'] as num?)?.toInt() ?? 1,
    );
  }
}

class VideoCallDebriefModel {
  final String callId;
  final String characterName;
  final int totalDurationSec;
  final int turnsCompleted;
  final int overallAccuracy;
  final int overallFluency;
  final int facialEngagementScore;
  final int wordsSpokenEstimate;
  final int wordsPerMinute;
  final int xpAwarded;
  final int gemsAwarded;
  final List<String> unlockedAchievements;
  final List<String> pronunciationHighlights;
  final int visualAidsExplored;
  final String feedbackSummary;

  const VideoCallDebriefModel({
    required this.callId,
    required this.characterName,
    required this.totalDurationSec,
    required this.turnsCompleted,
    required this.overallAccuracy,
    required this.overallFluency,
    required this.facialEngagementScore,
    required this.wordsSpokenEstimate,
    required this.wordsPerMinute,
    required this.xpAwarded,
    required this.gemsAwarded,
    required this.unlockedAchievements,
    required this.pronunciationHighlights,
    required this.visualAidsExplored,
    required this.feedbackSummary,
  });

  factory VideoCallDebriefModel.fromJson(Map<String, dynamic> json) {
    return VideoCallDebriefModel(
      callId: json['callId'] as String? ?? '',
      characterName: json['characterName'] as String? ?? '',
      totalDurationSec: (json['totalDurationSec'] as num?)?.toInt() ?? 0,
      turnsCompleted: (json['turnsCompleted'] as num?)?.toInt() ?? 0,
      overallAccuracy: (json['overallAccuracy'] as num?)?.toInt() ?? 0,
      overallFluency: (json['overallFluency'] as num?)?.toInt() ?? 0,
      facialEngagementScore: (json['facialEngagementScore'] as num?)?.toInt() ?? 0,
      wordsSpokenEstimate: (json['wordsSpokenEstimate'] as num?)?.toInt() ?? 0,
      wordsPerMinute: (json['wordsPerMinute'] as num?)?.toInt() ?? 0,
      xpAwarded: (json['xpAwarded'] as num?)?.toInt() ?? 0,
      gemsAwarded: (json['gemsAwarded'] as num?)?.toInt() ?? 0,
      unlockedAchievements: (json['unlockedAchievements'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      pronunciationHighlights: (json['pronunciationHighlights'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      visualAidsExplored: (json['visualAidsExplored'] as num?)?.toInt() ?? 1,
      feedbackSummary: json['feedbackSummary'] as String? ?? '',
    );
  }
}
