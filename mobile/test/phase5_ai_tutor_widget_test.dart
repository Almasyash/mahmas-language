// ==============================================================================
// MAHMAS LANGUAGE — PHASE 5 AI TUTOR WIDGET & UNIT TEST SUITE
// ==============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mahmas_language/core/models/ai_tutor_model.dart';
import 'package:mahmas_language/core/repositories/ai_tutor_repository.dart';
import 'package:mahmas_language/features/ai_tutor/ai_tutor_selection_screen.dart';
import 'package:mahmas_language/features/ai_tutor/ai_chat_screen.dart';
import 'package:mahmas_language/features/ai_tutor/ai_session_debrief_dialog.dart';

class FakeAITutorRepository extends AITutorRepository {
  FakeAITutorRepository() : super();

  final List<AICharacterModel> mockCharacters = [
    AICharacterModel(
      id: 'char-mateo',
      name: 'Mateo',
      avatarUrl: '',
      personalityPrompt: 'Friendly Madrid barista at A1-A2 level.',
      targetLanguageCode: 'es',
      difficultyCEFR: 'A1',
      scenarioTitle: 'Café & Ordering in Madrid',
      suggestedTopics: ['Pedir un café', 'Desayunos'],
    ),
    AICharacterModel(
      id: 'char-elena',
      name: 'Prof. Elena',
      avatarUrl: '',
      personalityPrompt: 'Structured linguistics professor.',
      targetLanguageCode: 'es',
      difficultyCEFR: 'B1',
      scenarioTitle: 'Culture & Academic Inquiry',
      suggestedTopics: ['Literatura hispana'],
    ),
  ];

  @override
  Future<List<AICharacterModel>> getCharacters({String? targetLanguage, String? level}) async {
    if (level != null && level != 'ALL') {
      return mockCharacters.where((c) => c.difficultyCEFR == level).toList();
    }
    return mockCharacters;
  }

  @override
  Future<AICharacterModel> getCharacterById(String characterId) async {
    return mockCharacters.firstWhere((c) => c.id == characterId);
  }

  @override
  Future<AIConversationModel> startConversation({required String characterId, String? topic}) async {
    final char = mockCharacters.firstWhere((c) => c.id == characterId);
    return AIConversationModel(
      id: 'mock-conv-123',
      userId: 'mock-user-1',
      characterId: char.id,
      character: char,
      topic: topic ?? char.scenarioTitle,
      startedAt: DateTime.now(),
      messages: [
        AIMessageModel(
          id: 'msg-greeting',
          conversationId: 'mock-conv-123',
          senderRole: 'ASSISTANT',
          content: '¡Hola! Bienvenido al café. ¿Qué deseas tomar hoy?',
          createdAt: DateTime.now(),
        ),
      ],
      memories: [],
      totalTurns: 1,
    );
  }

  @override
  Future<Map<String, dynamic>> sendMessage({required String conversationId, required String content}) async {
    final hasError = content.toLowerCase().contains('yo querer');
    return {
      'userMessage': {
        'id': 'user-msg-${DateTime.now().millisecondsSinceEpoch}',
        'conversationId': conversationId,
        'senderRole': 'USER',
        'content': content,
        'createdAt': DateTime.now().toIso8601String(),
      },
      'assistantMessage': {
        'id': 'assistant-msg-${DateTime.now().millisecondsSinceEpoch}',
        'conversationId': conversationId,
        'senderRole': 'ASSISTANT',
        'content': '¡Excelente! Enseguida te preparo tu pedido.',
        'correctionNote': hasError ? 'Pedagogical tip: Say "Yo quiero" instead of "Yo querer".' : null,
        'createdAt': DateTime.now().toIso8601String(),
      },
      'xpAwarded': 3,
      'newMemories': [
        {'key': 'LIKES', 'value': 'café'}
      ],
    };
  }

  @override
  Future<ConversationDebriefModel> endConversation({required String conversationId, int? durationSec}) async {
    return ConversationDebriefModel(
      conversationId: conversationId,
      characterName: 'Mateo',
      totalMessages: 4,
      correctionsCount: 1,
      durationSec: durationSec ?? 120,
      xpAwarded: 15,
      gemsAwarded: 2,
      unlockedAchievements: ['FIRST_AI_CONVERSATION'],
      vocabularyPracticed: ['café', 'conversación'],
      feedbackSummary: '¡Gran sesión! Sigue practicando tu pronunciación y vocabulario.',
    );
  }
}

void main() {
  group('Phase 5 Models Serialization & Logic Tests', () {
    test('AICharacterModel parses and converts to json properly', () {
      final json = {
        'id': 'char-mateo',
        'name': 'Mateo',
        'avatarUrl': 'https://example.com/mateo.png',
        'personalityPrompt': 'Barista in Madrid',
        'defaultVoice': 'es-ES-Neural2-A',
        'targetLanguageCode': 'es',
        'difficultyCEFR': 'A1',
        'isActive': true,
        'scenarioTitle': 'Café Ordering',
        'suggestedTopics': ['Café', 'Té'],
      };

      final model = AICharacterModel.fromJson(json);
      expect(model.id, 'char-mateo');
      expect(model.name, 'Mateo');
      expect(model.difficultyCEFR, 'A1');
      expect(model.suggestedTopics.length, 2);

      final outJson = model.toJson();
      expect(outJson['scenarioTitle'], 'Café Ordering');
    });

    test('AIMessageModel detects user and correction state correctly', () {
      final userMsg = AIMessageModel(
        id: '1',
        conversationId: 'conv-1',
        senderRole: 'USER',
        content: 'Hola',
        createdAt: DateTime.now(),
      );
      expect(userMsg.isUser, true);
      expect(userMsg.hasCorrection, false);

      final assistantMsg = AIMessageModel(
        id: '2',
        conversationId: 'conv-1',
        senderRole: 'ASSISTANT',
        content: 'Hola amigo',
        correctionNote: 'Correction note',
        createdAt: DateTime.now(),
      );
      expect(assistantMsg.isUser, false);
      expect(assistantMsg.hasCorrection, true);
    });

    test('ConversationDebriefModel parses debrief data accurately', () {
      final json = {
        'conversationId': 'conv-10',
        'characterName': 'Prof. Elena',
        'totalMessages': 6,
        'correctionsCount': 2,
        'durationSec': 180,
        'xpAwarded': 15,
        'gemsAwarded': 2,
        'unlockedAchievements': ['FIRST_AI_CONVERSATION'],
        'vocabularyPracticed': ['gramática', 'diálogo'],
        'feedbackSummary': 'Great practice!',
      };

      final debrief = ConversationDebriefModel.fromJson(json);
      expect(debrief.characterName, 'Prof. Elena');
      expect(debrief.xpAwarded, 15);
      expect(debrief.gemsAwarded, 2);
      expect(debrief.unlockedAchievements.contains('FIRST_AI_CONVERSATION'), true);
    });
  });

  group('Phase 5 UI Screen Widget Tests', () {
    late FakeAITutorRepository fakeRepo;

    setUp(() {
      fakeRepo = FakeAITutorRepository();
    });

    testWidgets('AITutorSelectionScreen renders characters and filters', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AITutorSelectionScreen(repository: fakeRepo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('AI Conversational Tutors'), findsOneWidget);
      expect(find.text('Adaptive AI Tutors'), findsOneWidget);
      expect(find.text('All Levels'), findsOneWidget);
      expect(find.text('Mateo'), findsOneWidget);
      expect(find.text('Café & Ordering in Madrid'), findsOneWidget);
      expect(find.text('Prof. Elena'), findsOneWidget);

      // Tap filter for A1
      await tester.tap(find.text('CEFR A1'));
      await tester.pumpAndSettle();

      expect(find.text('Mateo'), findsOneWidget);
      expect(find.text('Prof. Elena'), findsNothing);
    });

    testWidgets('AIChatScreen renders messages and sends user utterance', (tester) async {
      final conv = await fakeRepo.startConversation(characterId: 'char-mateo');

      await tester.pumpWidget(
        MaterialApp(
          home: AIChatScreen(
            conversation: conv,
            repository: fakeRepo,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Check character title and greeting message
      expect(find.text('Mateo'), findsOneWidget);
      expect(find.text('¡Hola! Bienvenido al café. ¿Qué deseas tomar hoy?'), findsOneWidget);

      // Enter message with grammatical error to test feedback
      final textField = find.byType(TextField);
      expect(textField, findsOneWidget);
      await tester.enterText(textField, 'Yo querer café con leche');
      await tester.tap(find.byIcon(Icons.send_rounded));
      await tester.pump(); // Start sending
      await tester.pumpAndSettle(); // Settle response

      // Verify user message appeared
      expect(find.text('Yo querer café con leche'), findsOneWidget);
      // Verify assistant response appeared
      expect(find.text('¡Excelente! Enseguida te preparo tu pedido.'), findsOneWidget);
      // Verify pedagogical correction note rendered
      expect(find.text('Pedagogical tip: Say "Yo quiero" instead of "Yo querer".'), findsOneWidget);

      // Drain transient banner timer before test completes
      await tester.pump(const Duration(seconds: 3));
    });

    testWidgets('AISessionDebriefDialog displays rewards and stats', (tester) async {
      bool homeCalled = false;
      final debrief = ConversationDebriefModel(
        conversationId: 'conv-test',
        characterName: 'Mateo',
        totalMessages: 6,
        correctionsCount: 1,
        durationSec: 150,
        xpAwarded: 15,
        gemsAwarded: 2,
        unlockedAchievements: ['FIRST_AI_CONVERSATION'],
        vocabularyPracticed: ['café', 'leche'],
        feedbackSummary: '¡Excelente fluidez y vocabulario!',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AISessionDebriefDialog(
              debrief: debrief,
              onReturnHome: () => homeCalled = true,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Conversation Complete!'), findsOneWidget);
      expect(find.text('+15 XP'), findsOneWidget);
      expect(find.text('+2 Gems'), findsOneWidget);
      expect(find.text('Practice session with Mateo'), findsOneWidget);
      expect(find.text('¡Excelente fluidez y vocabulario!'), findsOneWidget);
      expect(find.text('Unlocked: FIRST_AI_CONVERSATION'), findsOneWidget);

      await tester.tap(find.text('Continue'));
      expect(homeCalled, true);
    });
  });
}
