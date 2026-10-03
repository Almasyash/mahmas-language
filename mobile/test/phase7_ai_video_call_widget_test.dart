// ==============================================================================
// MAHMAS LANGUAGE — PHASE 7 AI VIDEO CALLING TEST SUITE
// Unit & widget tests for procedural avatar, visemes, visual aids, PiP, & debrief
// ==============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mahmas_language/core/models/ai_tutor_model.dart';
import 'package:mahmas_language/core/models/ai_voice_call_model.dart';
import 'package:mahmas_language/core/models/ai_video_call_model.dart';
import 'package:mahmas_language/core/repositories/ai_video_call_repository.dart';
import 'package:mahmas_language/features/ai_video_call/ai_video_avatar_widget.dart';
import 'package:mahmas_language/features/ai_video_call/ai_video_call_screen.dart';
import 'package:mahmas_language/features/ai_video_call/ai_video_call_debrief_dialog.dart';

class FakeAIVideoCallRepository extends AIVideoCallRepository {
  FakeAIVideoCallRepository() : super();

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
  Future<AIVideoCallModel> initiateVideoCall({
    required String characterId,
    String? topic,
    String? sceneSetting,
  }) async {
    return AIVideoCallModel(
      id: 'video-call-100',
      conversationId: 'conv-video-100',
      characterId: characterId,
      character: testCharacter,
      status: VideoCallStatus.connected,
      startedAt: DateTime.now(),
      durationSec: 0,
      turnCount: 0,
      greetingText: '¡Hola amigo! Qué gusto verte en videollamada. Te veo muy bien.',
      greetingAudioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      audioMimeType: 'audio/wav',
      currentEmotion: AvatarEmotion.happy,
      initialVisemes: const [
        VisemeFrameModel(viseme: VisemeType.oo, timestampMs: 0, durationMs: 200),
        VisemeFrameModel(viseme: VisemeType.aa, timestampMs: 200, durationMs: 250),
        VisemeFrameModel(viseme: VisemeType.ee, timestampMs: 450, durationMs: 200),
        VisemeFrameModel(viseme: VisemeType.rest, timestampMs: 650, durationMs: 150),
      ],
      initialVisualAid: const VisualAidCueModel(
        id: 'aid-menu-1',
        title: 'Café Menú Madrid',
        category: 'menu',
        headline: 'Especialidades del Día',
        body: 'Café con leche (€1.80), Cortado (€1.50)',
        targetVocab: ['un café con leche', 'cortado', 'por favor'],
      ),
      sceneSetting: sceneSetting ?? 'Madrid Café & Espresso Bar',
    );
  }

  @override
  Future<VideoTurnResultModel> sendVideoTurn({
    required String callId,
    String? audioBase64,
    String? spokenText,
    int? audioDurationMs,
    bool? requestHelpHint,
  }) async {
    final text = spokenText ?? 'Hola Mateo';
    final isHint = requestHelpHint ?? false;

    return VideoTurnResultModel(
      turnIndex: 1,
      userTranscription: text,
      pronunciationScore: 94,
      fluencyScore: 90,
      facialEngagementScore: 92,
      phonemeFeedback: [
        PhonemeScoreModel(
          phoneme: 'r (tap)',
          status: 'EXCELLENT',
          hint: 'Clean coronal tap in "por favor".',
        ),
      ],
      assistantReply: isHint
          ? 'Pista: Puedes pedir diciendo "Un café con leche, por favor".'
          : '¡Perfecto! Marchando un café con leche para ti.',
      assistantAudioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      audioMimeType: 'audio/wav',
      emotion: isHint ? AvatarEmotion.thoughtful : AvatarEmotion.celebrating,
      gesture: 'nodding',
      visemes: const [
        VisemeFrameModel(viseme: VisemeType.ch, timestampMs: 0, durationMs: 200),
        VisemeFrameModel(viseme: VisemeType.aa, timestampMs: 200, durationMs: 250),
        VisemeFrameModel(viseme: VisemeType.rest, timestampMs: 450, durationMs: 150),
      ],
      visualAid: const VisualAidCueModel(
        id: 'aid-hint-1',
        title: 'Guía de Cortesía',
        category: 'grammar',
        headline: 'Fórmulas para pedir',
        body: 'Usa "Me gustaría..." o "...por favor"',
        targetVocab: ['me gustaría', 'por favor'],
      ),
      difficultyLevel: 'A1',
      xpAwarded: 7,
      totalTurns: 1,
    );
  }

  @override
  Future<VideoCallDebriefModel> endVideoCall({
    required String callId,
    int? durationSec,
  }) async {
    return VideoCallDebriefModel(
      callId: callId,
      characterName: 'Mateo',
      totalDurationSec: durationSec ?? 150,
      turnsCompleted: 4,
      overallAccuracy: 95,
      overallFluency: 91,
      facialEngagementScore: 94,
      wordsSpokenEstimate: 48,
      wordsPerMinute: 80,
      xpAwarded: 35,
      gemsAwarded: 5,
      unlockedAchievements: const ['FIRST_AI_VIDEO_CALL'],
      pronunciationHighlights: const [
        'Excellent eye contact and active engagement.',
        'Accurate cadence when ordering beverages.',
      ],
      visualAidsExplored: 2,
      feedbackSummary: '¡Sensacional videollamada interactiva con Mateo!',
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final testCharacter = AICharacterModel(
    id: 'char-mateo',
    name: 'Mateo',
    avatarUrl: '',
    personalityPrompt: 'Friendly barista in Madrid.',
    targetLanguageCode: 'es',
    difficultyCEFR: 'A1',
    scenarioTitle: 'Café & Ordering in Madrid',
    suggestedTopics: ['Pedir un café', 'Desayunos'],
  );

  group('Phase 7 — AI Video Call Models Unit Tests', () {
    test('VisemeFrameModel serialization and enum mapping', () {
      final model = const VisemeFrameModel(
        viseme: VisemeType.aa,
        timestampMs: 250,
        durationMs: 300,
      );
      final json = model.toJson();
      expect(json['viseme'], 'aa');
      expect(json['timestampMs'], 250);
      expect(json['durationMs'], 300);

      final reconstructed = VisemeFrameModel.fromJson(json);
      expect(reconstructed.viseme, VisemeType.aa);
      expect(reconstructed.timestampMs, 250);
      expect(reconstructed.durationMs, 300);
    });

    test('VisualAidCueModel serialization and vocab tags', () {
      final model = const VisualAidCueModel(
        id: 'aid-1',
        title: 'Menú del Bar',
        category: 'menu',
        headline: 'Cafés',
        body: 'Solo, con leche, cortado',
        targetVocab: ['café', 'leche'],
      );
      final json = model.toJson();
      expect(json['title'], 'Menú del Bar');
      expect(json['targetVocab'], contains('café'));

      final parsed = VisualAidCueModel.fromJson(json);
      expect(parsed.id, 'aid-1');
      expect(parsed.targetVocab.length, 2);
    });

    test('AIVideoCallModel parses full video call session payload', () {
      final json = {
        'id': 'call-v-1',
        'conversationId': 'conv-v-1',
        'characterId': 'char-mateo',
        'status': 'CONNECTED',
        'startedAt': DateTime.now().toIso8601String(),
        'durationSec': 45,
        'turnCount': 2,
        'greetingText': '¡Hola!',
        'greetingAudioBase64': '',
        'audioMimeType': 'audio/wav',
        'currentEmotion': 'encouraging',
        'initialVisemes': [
          {'viseme': 'ee', 'timestampMs': 0, 'durationMs': 200},
        ],
        'sceneSetting': 'Madrid Café',
      };

      final call = AIVideoCallModel.fromJson(json);
      expect(call.id, 'call-v-1');
      expect(call.status, VideoCallStatus.connected);
      expect(call.currentEmotion, AvatarEmotion.encouraging);
      expect(call.initialVisemes.first.viseme, VisemeType.ee);
      expect(call.sceneSetting, 'Madrid Café');
    });

    test('VideoTurnResultModel parses engagement score, visemes, and aids', () {
      final json = {
        'turnIndex': 2,
        'userTranscription': 'Un café por favor',
        'pronunciationScore': 93,
        'fluencyScore': 89,
        'facialEngagementScore': 95,
        'phonemeFeedback': [
          {'phoneme': 'f', 'status': 'EXCELLENT', 'hint': 'Clean fricative'}
        ],
        'assistantReply': '¡Enseguida!',
        'assistantAudioBase64': '',
        'audioMimeType': 'audio/wav',
        'emotion': 'celebrating',
        'gesture': 'nodding',
        'visemes': [
          {'viseme': 'ch', 'timestampMs': 0, 'durationMs': 180},
        ],
        'difficultyLevel': 'A1',
        'xpAwarded': 7,
        'totalTurns': 2,
      };

      final turn = VideoTurnResultModel.fromJson(json);
      expect(turn.turnIndex, 2);
      expect(turn.facialEngagementScore, 95);
      expect(turn.emotion, AvatarEmotion.celebrating);
      expect(turn.visemes.length, 1);
      expect(turn.xpAwarded, 7);
    });

    test('VideoCallDebriefModel parses tri-meter metrics & rewards', () {
      final json = {
        'callId': 'call-1',
        'characterName': 'Mateo',
        'totalDurationSec': 120,
        'turnsCompleted': 5,
        'overallAccuracy': 94,
        'overallFluency': 88,
        'facialEngagementScore': 92,
        'wordsSpokenEstimate': 45,
        'wordsPerMinute': 75,
        'xpAwarded': 35,
        'gemsAwarded': 5,
        'unlockedAchievements': ['FIRST_AI_VIDEO_CALL'],
        'pronunciationHighlights': ['Crisp vowels'],
        'visualAidsExplored': 3,
        'feedbackSummary': 'Great session!',
      };

      final debrief = VideoCallDebriefModel.fromJson(json);
      expect(debrief.overallAccuracy, 94);
      expect(debrief.overallFluency, 88);
      expect(debrief.facialEngagementScore, 92);
      expect(debrief.visualAidsExplored, 3);
      expect(debrief.unlockedAchievements, contains('FIRST_AI_VIDEO_CALL'));
    });
  });

  group('Phase 7 — AIVideoAvatarWidget Tests', () {
    testWidgets('renders procedural avatar canvas and emotion badge', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AIVideoAvatarWidget(
              character: testCharacter,
              emotion: AvatarEmotion.encouraging,
              currentViseme: VisemeType.aa,
              isSpeaking: true,
              size: 240,
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.byType(AIVideoAvatarWidget), findsOneWidget);
      expect(find.text(AvatarEmotion.encouraging.displayName), findsOneWidget);
      expect(find.byIcon(Icons.volume_up_rounded), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });
  });

  group('Phase 7 — AIVideoCallScreen Widget Tests', () {
    testWidgets('renders top header, avatar, PiP user camera, and bottom controls', (tester) async {
      final fakeRepo = FakeAIVideoCallRepository();

      await tester.pumpWidget(
        MaterialApp(
          home: AIVideoCallScreen(
            character: testCharacter,
            repository: fakeRepo,
          ),
        ),
      );

      // Pump initial frame
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // 1. Verify Top Header
      expect(find.text('Mateo'), findsWidgets);
      expect(find.text('HD 60FPS'), findsOneWidget);
      expect(find.byIcon(Icons.call_end_rounded), findsWidgets);

      // 2. Verify Avatar
      expect(find.byType(AIVideoAvatarWidget), findsOneWidget);

      // 3. Verify PiP User Camera Feed
      expect(find.text('You'), findsOneWidget);
      expect(find.text('Front Cam'), findsOneWidget);

      // 4. Verify Visual Aid Card
      expect(find.text('Café Menú Madrid'), findsOneWidget);
      expect(find.text('un café con leche'), findsOneWidget);

      // 5. Verify Bottom Control Island
      expect(find.byIcon(Icons.mic_rounded), findsOneWidget);
      expect(find.byIcon(Icons.videocam_rounded), findsOneWidget);
      expect(find.byIcon(Icons.record_voice_over_rounded), findsOneWidget);
      expect(find.byIcon(Icons.flip_camera_ios_rounded), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('toggles mic mute and video on/off in PiP', (tester) async {
      final fakeRepo = FakeAIVideoCallRepository();

      await tester.pumpWidget(
        MaterialApp(
          home: AIVideoCallScreen(
            character: testCharacter,
            repository: fakeRepo,
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Toggle Mic Mute
      await tester.tap(find.byIcon(Icons.mic_rounded));
      await tester.pump();
      expect(find.byIcon(Icons.mic_off_rounded), findsOneWidget);

      // Toggle Video Off
      await tester.tap(find.byIcon(Icons.videocam_rounded));
      await tester.pump();
      expect(find.text('Camera Off'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('tapping utterance button dispatches video turn and updates subtitle', (tester) async {
      final fakeRepo = FakeAIVideoCallRepository();

      await tester.pumpWidget(
        MaterialApp(
          home: AIVideoCallScreen(
            character: testCharacter,
            repository: fakeRepo,
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Tap Push-To-Talk utterance button
      await tester.tap(find.byIcon(Icons.record_voice_over_rounded));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pump(const Duration(milliseconds: 300));

      // Subtitle should reflect server reply
      expect(find.textContaining('Marchando un café con leche'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });
  });

  group('Phase 7 — AIVideoCallDebriefDialog Widget Tests', () {
    testWidgets('renders tri-meter scores, visual aids count, and rewards', (tester) async {
      const debrief = VideoCallDebriefModel(
        callId: 'call-debrief-1',
        characterName: 'Mateo',
        totalDurationSec: 150,
        turnsCompleted: 5,
        overallAccuracy: 96,
        overallFluency: 92,
        facialEngagementScore: 95,
        wordsSpokenEstimate: 54,
        wordsPerMinute: 82,
        xpAwarded: 35,
        gemsAwarded: 5,
        unlockedAchievements: ['FIRST_AI_VIDEO_CALL'],
        pronunciationHighlights: [
          'Excellent facial animation and pronunciation rhythm.',
        ],
        visualAidsExplored: 3,
        feedbackSummary: '¡Excelente desempeño durante la videollamada!',
      );

      bool returnedHome = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AIVideoCallDebriefDialog(
              debrief: debrief,
              onReturnHome: () => returnedHome = true,
            ),
          ),
        ),
      );

      await tester.pump();

      // Check Header & Character
      expect(find.text('Video Session Debrief'), findsOneWidget);
      expect(find.textContaining('Mateo'), findsWidgets);

      // Check Tri-Meter Scores
      expect(find.text('96%'), findsOneWidget);
      expect(find.text('Accuracy'), findsOneWidget);
      expect(find.text('92%'), findsOneWidget);
      expect(find.text('Fluency'), findsOneWidget);
      expect(find.text('95%'), findsOneWidget);
      expect(find.text('Visual Focus'), findsOneWidget);

      // Check Rewards
      expect(find.text('+35 XP'), findsOneWidget);
      expect(find.text('+5 Gems'), findsOneWidget);

      // Check Return Home action
      await tester.ensureVisible(find.text('Done'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Done'));
      await tester.pump();
      expect(returnedHome, isTrue);

      await tester.pumpWidget(const SizedBox());
    });
  });
}
