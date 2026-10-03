// ==============================================================================
// MAHMAS LANGUAGE — AI VOICE CALL MODELS
// Data transfer models for live voice sessions, phoneme scoring, & debriefing
// ==============================================================================

import 'ai_tutor_model.dart';

enum VoiceCallStatus {
  connecting,
  connected,
  ended,
}

class PhonemeScoreModel {
  final String phoneme;
  final String status; // 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK'
  final String hint;

  const PhonemeScoreModel({
    required this.phoneme,
    required this.status,
    required this.hint,
  });

  bool get isExcellent => status == 'EXCELLENT';
  bool get isGood => status == 'GOOD';
  bool get needsWork => status == 'NEEDS_WORK';

  factory PhonemeScoreModel.fromJson(Map<String, dynamic> json) {
    return PhonemeScoreModel(
      phoneme: json['phoneme'] as String? ?? '',
      status: json['status'] as String? ?? 'GOOD',
      hint: json['hint'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'phoneme': phoneme,
      'status': status,
      'hint': hint,
    };
  }
}

class AIVoiceCallModel {
  final String id;
  final String conversationId;
  final String characterId;
  final AICharacterModel character;
  final VoiceCallStatus status;
  final DateTime startedAt;
  final DateTime? endedAt;
  final int durationSec;
  final int turnCount;
  final String greetingText;
  final String? greetingAudioBase64;
  final String audioMimeType;
  final String? audioStreamEndpoint;

  const AIVoiceCallModel({
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
    this.greetingAudioBase64,
    required this.audioMimeType,
    this.audioStreamEndpoint,
  });

  bool get isConnected => status == VoiceCallStatus.connected;
  bool get isEnded => status == VoiceCallStatus.ended;

  factory AIVoiceCallModel.fromJson(Map<String, dynamic> json) {
    VoiceCallStatus parseStatus(String? val) {
      switch (val?.toUpperCase()) {
        case 'CONNECTED':
          return VoiceCallStatus.connected;
        case 'ENDED':
          return VoiceCallStatus.ended;
        default:
          return VoiceCallStatus.connecting;
      }
    }

    return AIVoiceCallModel(
      id: json['id'] as String? ?? '',
      conversationId: json['conversationId'] as String? ?? '',
      characterId: json['characterId'] as String? ?? '',
      character: AICharacterModel.fromJson(json['character'] as Map<String, dynamic>? ?? {}),
      status: parseStatus(json['status'] as String?),
      startedAt: DateTime.tryParse(json['startedAt'] as String? ?? '') ?? DateTime.now(),
      endedAt: json['endedAt'] != null ? DateTime.tryParse(json['endedAt'] as String) : null,
      durationSec: json['durationSec'] as int? ?? 0,
      turnCount: json['turnCount'] as int? ?? 0,
      greetingText: json['greetingText'] as String? ?? '¡Hola!',
      greetingAudioBase64: json['greetingAudioBase64'] as String?,
      audioMimeType: json['audioMimeType'] as String? ?? 'audio/wav',
      audioStreamEndpoint: json['audioStreamEndpoint'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'characterId': characterId,
      'character': character.toJson(),
      'status': status.name.toUpperCase(),
      'startedAt': startedAt.toIso8601String(),
      'endedAt': endedAt?.toIso8601String(),
      'durationSec': durationSec,
      'turnCount': turnCount,
      'greetingText': greetingText,
      'greetingAudioBase64': greetingAudioBase64,
      'audioMimeType': audioMimeType,
      'audioStreamEndpoint': audioStreamEndpoint,
    };
  }
}

class VoiceTurnResultModel {
  final int turnIndex;
  final String userTranscription;
  final int pronunciationScore; // 0 - 100
  final int fluencyScore;       // 0 - 100
  final List<PhonemeScoreModel> phonemeFeedback;
  final String assistantReply;
  final String assistantAudioBase64;
  final String audioMimeType;
  final String? correctionNote;
  final String? pronunciationAdvice;
  final int xpAwarded;
  final int totalTurns;

  const VoiceTurnResultModel({
    required this.turnIndex,
    required this.userTranscription,
    required this.pronunciationScore,
    required this.fluencyScore,
    required this.phonemeFeedback,
    required this.assistantReply,
    required this.assistantAudioBase64,
    required this.audioMimeType,
    this.correctionNote,
    this.pronunciationAdvice,
    required this.xpAwarded,
    required this.totalTurns,
  });

  bool get hasCorrection => correctionNote != null && correctionNote!.isNotEmpty;

  factory VoiceTurnResultModel.fromJson(Map<String, dynamic> json) {
    final phonemesRaw = json['phonemeFeedback'] as List<dynamic>? ?? [];
    return VoiceTurnResultModel(
      turnIndex: json['turnIndex'] as int? ?? 1,
      userTranscription: json['userTranscription'] as String? ?? '',
      pronunciationScore: json['pronunciationScore'] as int? ?? 85,
      fluencyScore: json['fluencyScore'] as int? ?? 80,
      phonemeFeedback: phonemesRaw.map((p) => PhonemeScoreModel.fromJson(p as Map<String, dynamic>)).toList(),
      assistantReply: json['assistantReply'] as String? ?? '',
      assistantAudioBase64: json['assistantAudioBase64'] as String? ?? '',
      audioMimeType: json['audioMimeType'] as String? ?? 'audio/wav',
      correctionNote: json['correctionNote'] as String?,
      pronunciationAdvice: json['pronunciationAdvice'] as String?,
      xpAwarded: json['xpAwarded'] as int? ?? 5,
      totalTurns: json['totalTurns'] as int? ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'turnIndex': turnIndex,
      'userTranscription': userTranscription,
      'pronunciationScore': pronunciationScore,
      'fluencyScore': fluencyScore,
      'phonemeFeedback': phonemeFeedback.map((p) => p.toJson()).toList(),
      'assistantReply': assistantReply,
      'assistantAudioBase64': assistantAudioBase64,
      'audioMimeType': audioMimeType,
      'correctionNote': correctionNote,
      'pronunciationAdvice': pronunciationAdvice,
      'xpAwarded': xpAwarded,
      'totalTurns': totalTurns,
    };
  }
}

class VoiceCallDebriefModel {
  final String callId;
  final String characterName;
  final int totalDurationSec;
  final int turnsCompleted;
  final int overallAccuracy;
  final int overallFluency;
  final int wordsSpokenEstimate;
  final int wordsPerMinute;
  final int xpAwarded;
  final int gemsAwarded;
  final List<String> unlockedAchievements;
  final List<String> pronunciationHighlights;
  final String feedbackSummary;

  const VoiceCallDebriefModel({
    required this.callId,
    required this.characterName,
    required this.totalDurationSec,
    required this.turnsCompleted,
    required this.overallAccuracy,
    required this.overallFluency,
    required this.wordsSpokenEstimate,
    required this.wordsPerMinute,
    required this.xpAwarded,
    required this.gemsAwarded,
    required this.unlockedAchievements,
    required this.pronunciationHighlights,
    required this.feedbackSummary,
  });

  factory VoiceCallDebriefModel.fromJson(Map<String, dynamic> json) {
    return VoiceCallDebriefModel(
      callId: json['callId'] as String? ?? '',
      characterName: json['characterName'] as String? ?? 'AI Tutor',
      totalDurationSec: json['totalDurationSec'] as int? ?? 0,
      turnsCompleted: json['turnsCompleted'] as int? ?? 0,
      overallAccuracy: json['overallAccuracy'] as int? ?? 85,
      overallFluency: json['overallFluency'] as int? ?? 80,
      wordsSpokenEstimate: json['wordsSpokenEstimate'] as int? ?? 0,
      wordsPerMinute: json['wordsPerMinute'] as int? ?? 0,
      xpAwarded: json['xpAwarded'] as int? ?? 25,
      gemsAwarded: json['gemsAwarded'] as int? ?? 3,
      unlockedAchievements: (json['unlockedAchievements'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
      pronunciationHighlights: (json['pronunciationHighlights'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
      feedbackSummary: json['feedbackSummary'] as String? ?? 'Great practice session!',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'callId': callId,
      'characterName': characterName,
      'totalDurationSec': totalDurationSec,
      'turnsCompleted': turnsCompleted,
      'overallAccuracy': overallAccuracy,
      'overallFluency': overallFluency,
      'wordsSpokenEstimate': wordsSpokenEstimate,
      'wordsPerMinute': wordsPerMinute,
      'xpAwarded': xpAwarded,
      'gemsAwarded': gemsAwarded,
      'unlockedAchievements': unlockedAchievements,
      'pronunciationHighlights': pronunciationHighlights,
      'feedbackSummary': feedbackSummary,
    };
  }
}
