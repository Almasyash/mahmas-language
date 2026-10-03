// ==============================================================================
// MAHMAS LANGUAGE — PHASE 6 AI VOICE CALLING TEST SUITE
// Unit & widget tests for live voice calling, waveform animation, and debriefing
// ==============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mahmas_language/core/models/ai_tutor_model.dart';
import 'package:mahmas_language/core/models/ai_voice_call_model.dart';
import 'package:mahmas_language/core/repositories/ai_voice_call_repository.dart';
import 'package:mahmas_language/features/ai_voice_call/ai_voice_call_screen.dart';
import 'package:mahmas_language/features/ai_voice_call/ai_voice_call_debrief_dialog.dart';

class FakeAIVoiceCallRepository extends AIVoiceCallRepository {
  FakeAIVoiceCallRepository() : super();

  final AICharacterModel testCharacter = AICharacterModel(
    id: 'char-mateo',
    name: 'Mateo',
    avatarUrl: '',
    personalityPrompt: 'Friendly barista in Madrid.',
    targetLanguageCode: 'es',
    difficultyCEFR: 'A1',
    scenarioTitle: 'Café & Ordering in Madrid',
    suggestedTopics: ['Pedir un café', 'Desayunos'],
  );

  @override
  Future<AIVoiceCallModel> initiateVoiceCall({required String characterId, String? topic}) async {
    return AIVoiceCallModel(
      id: 'call-mock-100',
      conversationId: 'conv-mock-100',
      characterId: characterId,
      character: testCharacter,
      status: VoiceCallStatus.connected,
      startedAt: DateTime.now(),
      durationSec: 0,
      turnCount: 0,
      greetingText: '¡Hola amigo! Bienvenido al café. Te escucho alto y claro.',
      greetingAudioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      audioMimeType: 'audio/wav',
    );
  }

  @override
  Future<VoiceTurnResultModel> sendVoiceTurn({
    required String callId,
    String? audioBase64,
    String? spokenText,
    int? audioDurationMs,
  }) async {
    final text = spokenText ?? 'Hola Mateo';
    final hasTrill = text.toLowerCase().contains('perro') || text.toLowerCase().contains('rr');

    return VoiceTurnResultModel(
      turnIndex: 1,
      userTranscription: text,
      pronunciationScore: hasTrill ? 96 : 92,
      fluencyScore: 88,
      phonemeFeedback: [
        PhonemeScoreModel(
          phoneme: hasTrill ? 'r (trill)' : 'r (flap)',
          status: 'EXCELLENT',
          hint: hasTrill ? 'Superb alveolar trill!' : 'Crisp alveolar tap between vowels.',
        ),
      ],
      assistantReply: '¡Estupendo! Te entiendo con total claridad.',
      assistantAudioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      audioMimeType: 'audio/wav',
      correctionNote: text.toLowerCase().contains('yo querer')
          ? 'Pedagogical tip: Say "Yo quiero" instead of "Yo querer".'
          : null,
      pronunciationAdvice: 'Maintain your steady breathing and vowel resonance.',
      xpAwarded: 5,
      totalTurns: 1,
    );
  }

  @override
  Future<VoiceCallDebriefModel> endVoiceCall({required String callId, int? durationSec}) async {
    return VoiceCallDebriefModel(
      callId: callId,
      characterName: 'Mateo',
      totalDurationSec: durationSec ?? 140,
      turnsCompleted: 3,
      overallAccuracy: 94,
      overallFluency: 90,
      wordsSpokenEstimate: 36,
      wordsPerMinute: 78,
      xpAwarded: 25,
      gemsAwarded: 3,
      unlockedAchievements: ['FIRST_AI_VOICE_CALL'],
      pronunciationHighlights: [
        'Superb vowel clarity and native-like rhythm.',
        'Accurate syllable stress in Spanish phrasing.',
      ],
      feedbackSummary: '¡Brillante llamada con Mateo! Tu pronunciación fue muy precisa.',
    );
  }

  @override
  Future<AIVoiceCallModel> getVoiceCall(String callId) async {
    return initiateVoiceCall(characterId: 'char-mateo');
  }
}

void main() {
  group('Phase 6 AI Voice Calling Models Serialization Tests', () {
    test('PhonemeScoreModel parses and validates status getters', () {
      final json = {
        'phoneme': 'r (trill)',
        'status': 'EXCELLENT',
        'hint': 'Great alveolar trill vibration',
      };

      final model = PhonemeScoreModel.fromJson(json);
      expect(model.phoneme, 'r (trill)');
      expect(model.status, 'EXCELLENT');
      expect(model.isExcellent, true);
      expect(model.isGood, false);
      expect(model.needsWork, false);

      final outJson = model.toJson();
      expect(outJson['phoneme'], 'r (trill)');
    });

    test('AIVoiceCallModel parses connection status and metadata', () {
      final json = {
        'id': 'call-101',
        'conversationId': 'conv-101',
        'characterId': 'char-mateo',
        'character': {
          'id': 'char-mateo',
          'name': 'Mateo',
          'avatarUrl': '',
          'personalityPrompt': 'Barista',
          'targetLanguageCode': 'es',
          'difficultyCEFR': 'A1',
        },
        'status': 'CONNECTED',
        'startedAt': '2026-10-03T10:00:00.000Z',
        'durationSec': 45,
        'turnCount': 2,
        'greetingText': '¡Hola!',
        'audioMimeType': 'audio/wav',
      };

      final model = AIVoiceCallModel.fromJson(json);
      expect(model.id, 'call-101');
      expect(model.character.name, 'Mateo');
      expect(model.isConnected, true);
      expect(model.isEnded, false);
      expect(model.durationSec, 45);
    });

    test('VoiceTurnResultModel parses feedback and scores correctly', () {
      final json = {
        'turnIndex': 1,
        'userTranscription': 'Hola Mateo',
        'pronunciationScore': 94,
        'fluencyScore': 88,
        'phonemeFeedback': [
          {'phoneme': 'o', 'status': 'GOOD', 'hint': 'Clean vowel'}
        ],
        'assistantReply': '¡Hola!',
        'assistantAudioBase64': 'AQID',
        'audioMimeType': 'audio/wav',
        'correctionNote': 'Pedagogical note',
        'xpAwarded': 5,
        'totalTurns': 1,
      };

      final model = VoiceTurnResultModel.fromJson(json);
      expect(model.pronunciationScore, 94);
      expect(model.hasCorrection, true);
      expect(model.phonemeFeedback.length, 1);
    });

    test('VoiceCallDebriefModel converts debrief metrics cleanly', () {
      final json = {
        'callId': 'call-101',
        'characterName': 'Mateo',
        'totalDurationSec': 120,
        'turnsCompleted': 4,
        'overallAccuracy': 95,
        'overallFluency': 91,
        'wordsSpokenEstimate': 40,
        'wordsPerMinute': 80,
        'xpAwarded': 25,
        'gemsAwarded': 3,
        'unlockedAchievements': ['FIRST_AI_VOICE_CALL'],
        'pronunciationHighlights': ['Crisp vowels'],
        'feedbackSummary': 'Outstanding practice session!',
      };

      final debrief = VoiceCallDebriefModel.fromJson(json);
      expect(debrief.xpAwarded, 25);
      expect(debrief.gemsAwarded, 3);
      expect(debrief.overallAccuracy, 95);
      expect(debrief.unlockedAchievements.contains('FIRST_AI_VOICE_CALL'), true);
    });
  });

  group('Phase 6 AI Voice Calling Widget Tests', () {
    late FakeAIVoiceCallRepository fakeRepo;

    setUp(() {
      fakeRepo = FakeAIVoiceCallRepository();
    });

    testWidgets('AIVoiceCallScreen connects and renders call UI', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AIVoiceCallScreen(
            character: fakeRepo.testCharacter,
            repository: fakeRepo,
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Verify character name and initial greeting
      expect(find.text('Mateo'), findsWidgets);
      expect(find.text('¡Hola amigo! Bienvenido al café. Te escucho alto y claro.'), findsOneWidget);

      // Verify controls
      expect(find.text('Mute'), findsOneWidget);
      expect(find.text('Speak'), findsOneWidget);
      expect(find.text('Test "rr"'), findsOneWidget);
      expect(find.text('End'), findsOneWidget);

      // Toggle Mute
      await tester.tap(find.text('Mute'));
      await tester.pump();
      expect(find.text('Unmute'), findsOneWidget);

      // Test speaking action
      await tester.tap(find.text('Speak'));
      await tester.pump(); // Start speaking
      await tester.pump(const Duration(milliseconds: 700));
      await tester.pump(const Duration(milliseconds: 500));

      // Verify assistant response and pronunciation accuracy pill
      expect(find.text('¡Estupendo! Te entiendo con total claridad.'), findsOneWidget);
      expect(find.text('Accuracy 92%'), findsOneWidget);

      // Test specialized 'rr' trill phrase
      await tester.tap(find.text('Test "rr"'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 700));
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('Accuracy 96%'), findsOneWidget);
      expect(find.text('Superb alveolar trill!'), findsOneWidget);

      // Cleanly unmount widget to trigger dispose and cancel periodic call timers
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('AIVoiceCallDebriefDialog displays comprehensive scores and rewards', (tester) async {
      bool homeCalled = false;
      const debrief = VoiceCallDebriefModel(
        callId: 'call-test',
        characterName: 'Mateo',
        totalDurationSec: 150,
        turnsCompleted: 4,
        overallAccuracy: 94,
        overallFluency: 88,
        wordsSpokenEstimate: 42,
        wordsPerMinute: 84,
        xpAwarded: 25,
        gemsAwarded: 3,
        unlockedAchievements: ['FIRST_AI_VOICE_CALL'],
        pronunciationHighlights: [
          'Vibrant alveolar trill vibration on "rr".',
          'Clean Spanish open vowels.',
        ],
        feedbackSummary: '¡Brillante conversación oral! Tu fluidez avanza a pasos agigantados.',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AIVoiceCallDebriefDialog(
              debrief: debrief,
              onReturnHome: () => homeCalled = true,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify title and rewards
      expect(find.text('Voice Call Complete!'), findsOneWidget);
      expect(find.text('+25 XP'), findsOneWidget);
      expect(find.text('+3 Gems'), findsOneWidget);

      // Verify score meters
      expect(find.text('94%'), findsOneWidget);
      expect(find.text('Pronunciation'), findsOneWidget);
      expect(find.text('88%'), findsOneWidget);
      expect(find.text('Fluency'), findsOneWidget);

      // Verify pace and highlights
      expect(find.text('84 wpm'), findsOneWidget);
      expect(find.text('Pronunciation Highlights'), findsOneWidget);
      expect(find.text('Unlocked: FIRST_AI_VOICE_CALL'), findsOneWidget);

      // Scroll to Done button and tap
      await tester.ensureVisible(find.text('Done'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Done'));
      expect(homeCalled, true);
    });
  });
}
