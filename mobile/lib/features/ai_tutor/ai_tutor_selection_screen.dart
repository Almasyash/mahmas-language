// ==============================================================================
// MAHMAS LANGUAGE — AI TUTOR SELECTION SCREEN
// Browse and select specialized AI conversational personas & scenarios
// ==============================================================================

import 'package:flutter/material.dart';
import '../../core/auth/auth_scope.dart';
import '../../core/models/ai_tutor_model.dart';
import '../../core/repositories/ai_tutor_repository.dart';
import 'ai_chat_screen.dart';

class AITutorSelectionScreen extends StatefulWidget {
  final AITutorRepository? repository;

  const AITutorSelectionScreen({super.key, this.repository});

  @override
  State<AITutorSelectionScreen> createState() => _AITutorSelectionScreenState();
}

class _AITutorSelectionScreenState extends State<AITutorSelectionScreen> {
  late AITutorRepository _repository;
  bool _isLoading = true;
  List<AICharacterModel> _characters = [];
  String _selectedLevel = 'ALL';
  bool _initialized = false;

  final List<String> _levelFilters = ['ALL', 'A1', 'A2', 'B1', 'B2'];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      if (widget.repository != null) {
        _repository = widget.repository!;
      } else {
        try {
          final apiClient = AuthScope.of(context).apiClient;
          _repository = AITutorRepository(apiClient: apiClient);
        } catch (_) {
          _repository = AITutorRepository();
        }
      }
      _loadCharacters();
    }
  }

  Future<void> _loadCharacters() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final chars = await _repository.getCharacters();
      if (mounted) {
        setState(() {
          _characters = chars;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          // Provide fallback demo characters if offline
          if (_characters.isEmpty) {
            _characters = _getFallbackCharacters();
          }
          _isLoading = false;
        });
      }
    }
  }

  List<AICharacterModel> _getFallbackCharacters() {
    return [
      AICharacterModel(
        id: 'char-mateo',
        name: 'Mateo',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        personalityPrompt: 'Friendly barista in Madrid. Speaks Spanish at beginner A1-A2 level.',
        targetLanguageCode: 'es',
        difficultyCEFR: 'A1',
        scenarioTitle: 'Café & Ordering in Madrid',
        suggestedTopics: ['Pedir un café', 'Desayunos españoles', 'El tiempo hoy', 'Planes de fin de semana'],
      ),
      AICharacterModel(
        id: 'char-sofia',
        name: 'Sofia',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        personalityPrompt: 'Energetic backpacker and photographer exploring Latin America.',
        targetLanguageCode: 'es',
        difficultyCEFR: 'A2',
        scenarioTitle: 'Backpacking & Adventures',
        suggestedTopics: ['Lugares para visitar', 'Pedir direcciones', 'Comida callejera'],
      ),
      AICharacterModel(
        id: 'char-elena',
        name: 'Prof. Elena',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        personalityPrompt: 'Linguistics professor offering structured explanations and rich cultural dialogue.',
        targetLanguageCode: 'es',
        difficultyCEFR: 'B1',
        scenarioTitle: 'Culture & Academic Inquiry',
        suggestedTopics: ['Literatura hispana', 'Diferencias lingüísticas', 'Historia de España'],
      ),
      AICharacterModel(
        id: 'char-alex',
        name: 'Alex',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        personalityPrompt: 'Bilingual software architect in Valencia talking about modern tech and careers.',
        targetLanguageCode: 'es',
        difficultyCEFR: 'B2',
        scenarioTitle: 'Tech & Professional Work',
        suggestedTopics: ['Trabajo remoto', 'Proyectos tecnológicos', 'Innovación'],
      ),
    ];
  }

  List<AICharacterModel> get _filteredCharacters {
    if (_selectedLevel == 'ALL') return _characters;
    return _characters.where((c) => c.difficultyCEFR == _selectedLevel).toList();
  }

  Color _getLevelColor(String level) {
    switch (level) {
      case 'A1':
        return Colors.green;
      case 'A2':
        return Colors.teal;
      case 'B1':
        return Colors.blue;
      case 'B2':
        return Colors.indigo;
      case 'C1':
      case 'C2':
        return Colors.deepPurple;
      default:
        return Colors.orange;
    }
  }

  Future<void> _startChatWithCharacter(AICharacterModel character, [String? topic]) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final conv = await _repository.startConversation(
        characterId: character.id,
        topic: topic ?? character.scenarioTitle,
      );
      if (mounted) {
        Navigator.of(context).pop(); // dismiss loader
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => AIChatScreen(
              conversation: conv,
              repository: _repository,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop(); // dismiss loader
        // Navigate with local fallback conversation
        final fallbackConv = AIConversationModel(
          id: 'conv-fallback-${DateTime.now().millisecondsSinceEpoch}',
          userId: 'user-demo',
          characterId: character.id,
          character: character,
          topic: topic ?? character.scenarioTitle,
          startedAt: DateTime.now(),
          messages: [
            AIMessageModel(
              id: 'msg-greeting',
              conversationId: 'conv-fallback',
              senderRole: 'ASSISTANT',
              content: '¡Hola! Es un placer saludarte. ¿De qué te gustaría hablar hoy?',
              createdAt: DateTime.now(),
            ),
          ],
          memories: [],
          totalTurns: 1,
        );
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => AIChatScreen(
              conversation: fallbackConv,
              repository: _repository,
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'AI Conversational Tutors',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadCharacters,
              child: CustomScrollView(
                slivers: [
                  // Banner Header
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Container(
                        padding: const EdgeInsets.all(20.0),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              theme.colorScheme.primary,
                              theme.colorScheme.secondary,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: theme.colorScheme.primary.withValues(alpha: 0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.smart_toy_rounded,
                                    color: Colors.white,
                                    size: 28,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Adaptive AI Tutors',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        'Real-time conversation with gentle feedback',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.bolt, color: Colors.amber, size: 16),
                                  SizedBox(width: 4),
                                  Text(
                                    '+3 XP per message  •  +15 XP & 2 Gems per session',
                                    style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // CEFR Level Filter Chips
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 48,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        scrollDirection: Axis.horizontal,
                        itemCount: _levelFilters.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final level = _levelFilters[index];
                          final isSelected = _selectedLevel == level;
                          return ChoiceChip(
                            label: Text(
                              level == 'ALL' ? 'All Levels' : 'CEFR $level',
                              style: TextStyle(
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                color: isSelected ? Colors.white : theme.colorScheme.onSurface,
                              ),
                            ),
                            selected: isSelected,
                            selectedColor: theme.colorScheme.primary,
                            onSelected: (selected) {
                              if (selected) {
                                setState(() => _selectedLevel = level);
                              }
                            },
                          );
                        },
                      ),
                    ),
                  ),

                  const SliverToBoxAdapter(child: SizedBox(height: 12)),

                  // Character Cards List
                  if (_filteredCharacters.isEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Text(
                          'No characters available for this level.',
                          style: TextStyle(color: Colors.grey, fontSize: 15),
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final character = _filteredCharacters[index];
                            final levelColor = _getLevelColor(character.difficultyCEFR);

                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              elevation: 2,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: BorderSide(
                                  color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
                                ),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        // Avatar with Online Badge
                                        Stack(
                                          children: [
                                            CircleAvatar(
                                              radius: 28,
                                              backgroundColor: theme.colorScheme.primaryContainer,
                                              child: Text(
                                                character.name[0],
                                                style: TextStyle(
                                                  fontSize: 22,
                                                  fontWeight: FontWeight.bold,
                                                  color: theme.colorScheme.onPrimaryContainer,
                                                ),
                                              ),
                                            ),
                                            Positioned(
                                              right: 0,
                                              bottom: 0,
                                              child: Container(
                                                width: 14,
                                                height: 14,
                                                decoration: BoxDecoration(
                                                  color: Colors.green,
                                                  shape: BoxShape.circle,
                                                  border: Border.all(color: Colors.white, width: 2),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(width: 14),
                                        // Name & Scenario
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Text(
                                                    character.name,
                                                    style: const TextStyle(
                                                      fontSize: 18,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: levelColor.withValues(alpha: 0.15),
                                                      borderRadius: BorderRadius.circular(8),
                                                      border: Border.all(color: levelColor, width: 1),
                                                    ),
                                                    child: Text(
                                                      character.difficultyCEFR,
                                                      style: TextStyle(
                                                        color: levelColor,
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 11,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                character.scenarioTitle,
                                                style: TextStyle(
                                                  color: theme.colorScheme.primary,
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 12),

                                    // Personality Prompt Summary
                                    Text(
                                      character.personalityPrompt,
                                      style: TextStyle(
                                        color: theme.colorScheme.onSurfaceVariant,
                                        fontSize: 13,
                                        height: 1.35,
                                      ),
                                    ),

                                    if (character.suggestedTopics.isNotEmpty) ...[
                                      const SizedBox(height: 12),
                                      Wrap(
                                        spacing: 6,
                                        runSpacing: 6,
                                        children: character.suggestedTopics.take(3).map((topic) {
                                          return ActionChip(
                                            label: Text(
                                              topic,
                                              style: const TextStyle(fontSize: 11),
                                            ),
                                            padding: const EdgeInsets.symmetric(horizontal: 4),
                                            backgroundColor: theme.colorScheme.surfaceContainerHighest,
                                            onPressed: () => _startChatWithCharacter(character, topic),
                                          );
                                        }).toList(),
                                      ),
                                    ],

                                    const SizedBox(height: 16),

                                    // Action Button
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton.icon(
                                        onPressed: () => _startChatWithCharacter(character),
                                        icon: const Icon(Icons.chat_bubble_outline, size: 18),
                                        label: Text('Chat with ${character.name}'),
                                        style: ElevatedButton.styleFrom(
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                          childCount: _filteredCharacters.length,
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
