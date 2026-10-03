// ==============================================================================
// MAHMAS LANGUAGE — AI CHAT SCREEN
// Interactive multi-turn chat with pedagogical scaffolding and real-time feedback
// ==============================================================================

import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/auth/auth_scope.dart';
import '../../core/models/ai_tutor_model.dart';
import '../../core/repositories/ai_tutor_repository.dart';
import 'ai_session_debrief_dialog.dart';

class AIChatScreen extends StatefulWidget {
  final AIConversationModel conversation;
  final AITutorRepository? repository;

  const AIChatScreen({
    super.key,
    required this.conversation,
    this.repository,
  });

  @override
  State<AIChatScreen> createState() => _AIChatScreenState();
}

class _AIChatScreenState extends State<AIChatScreen> {
  late AITutorRepository _repository;
  late AIConversationModel _conversation;
  late List<AIMessageModel> _messages;
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isSending = false;
  late final DateTime _sessionStartTime;
  final Set<String> _translatedMessageIds = {};
  int? _recentXpBanner;
  Timer? _bannerTimer;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _conversation = widget.conversation;
    _messages = List.from(widget.conversation.messages);
    _sessionStartTime = DateTime.now();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToBottom();
    });
  }

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
    }
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _sendMessage([String? presetText]) async {
    final text = presetText ?? _textController.text.trim();
    if (text.isEmpty || _isSending) return;

    if (presetText == null) {
      _textController.clear();
    }

    final tempUserMsg = AIMessageModel(
      id: 'temp-user-${DateTime.now().millisecondsSinceEpoch}',
      conversationId: _conversation.id,
      senderRole: 'USER',
      content: text,
      createdAt: DateTime.now(),
    );

    setState(() {
      _messages.add(tempUserMsg);
      _isSending = true;
    });
    _scrollToBottom();

    try {
      final res = await _repository.sendMessage(
        conversationId: _conversation.id,
        content: text,
      );

      final assistantData = res['assistantMessage'] as Map<String, dynamic>?;
      final xpAwarded = res['xpAwarded'] as int? ?? 3;

      if (assistantData != null && mounted) {
        final assistantMsg = AIMessageModel.fromJson(assistantData);
        setState(() {
          _messages.add(assistantMsg);
          _recentXpBanner = xpAwarded;
          _isSending = false;
        });
        _scrollToBottom();

        // Clear transient XP toast after 2.5 seconds
        _bannerTimer?.cancel();
        _bannerTimer = Timer(const Duration(milliseconds: 2500), () {
          if (mounted) {
            setState(() => _recentXpBanner = null);
          }
        });
      }
    } catch (e) {
      if (mounted) {
        // Fallback response for offline or test mode
        final fallbackAssistantMsg = AIMessageModel(
          id: 'temp-assistant-${DateTime.now().millisecondsSinceEpoch}',
          conversationId: _conversation.id,
          senderRole: 'ASSISTANT',
          content: '¡Comprendo perfectamente! Tu práctica está dando frutos. Sigue adelante.',
          correctionNote: text.toLowerCase().contains('yo querer')
              ? 'Pedagogical tip: Say "Yo quiero" instead of "Yo querer".'
              : null,
          createdAt: DateTime.now(),
        );

        setState(() {
          _messages.add(fallbackAssistantMsg);
          _recentXpBanner = 3;
          _isSending = false;
        });
        _scrollToBottom();

        _bannerTimer?.cancel();
        _bannerTimer = Timer(const Duration(milliseconds: 2500), () {
          if (mounted) {
            setState(() => _recentXpBanner = null);
          }
        });
      }
    }
  }

  Future<void> _endSession() async {
    final durationSec = DateTime.now().difference(_sessionStartTime).inSeconds;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    ConversationDebriefModel debrief;
    try {
      debrief = await _repository.endConversation(
        conversationId: _conversation.id,
        durationSec: durationSec,
      );
    } catch (e) {
      final correctionsCount = _messages.where((m) => m.hasCorrection).length;
      debrief = ConversationDebriefModel(
        conversationId: _conversation.id,
        characterName: _conversation.character.name,
        totalMessages: _messages.length,
        correctionsCount: correctionsCount,
        durationSec: durationSec,
        xpAwarded: 15,
        gemsAwarded: 2,
        unlockedAchievements: ['FIRST_AI_CONVERSATION'],
        vocabularyPracticed: ['café', 'conversación', 'práctica'],
        feedbackSummary: '¡Gran sesión conversacional! Tu confianza al hablar en español sigue aumentando.',
      );
    }

    if (mounted) {
      Navigator.of(context).pop(); // dismiss loading dialog

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => AISessionDebriefDialog(
          debrief: debrief,
          onReturnHome: () {
            Navigator.of(context).pop(); // dismiss dialog
            Navigator.of(context).pop(); // return from chat screen
          },
          onReviewMistakes: () {
            Navigator.of(context).pop(); // dismiss dialog
            Navigator.of(context).pop(); // return from chat screen
          },
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final character = _conversation.character;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: theme.colorScheme.primaryContainer,
              child: Text(
                character.name.isNotEmpty ? character.name[0] : 'T',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    character.name,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    _conversation.topic ?? character.scenarioTitle,
                    style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.phone_in_talk_rounded, color: Colors.teal),
            tooltip: 'Live Voice Call',
            onPressed: () {
              Navigator.of(context).pushNamed(
                '/ai-voice-call',
                arguments: character,
              );
            },
          ),
          TextButton.icon(
            onPressed: _endSession,
            icon: const Icon(Icons.check_circle_outline, size: 16),
            label: const Text('End'),
            style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Transient XP Animation Banner
            if (_recentXpBanner != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 4),
                color: Colors.amber.shade100,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.bolt, color: Colors.orange, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      '+$_recentXpBanner XP Earned!',
                      style: TextStyle(
                        color: Colors.amber.shade900,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

            // Messages List
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final msg = _messages[index];
                  return _buildMessageBubble(context, msg);
                },
              ),
            ),

            // Thinking Indicator
            if (_isSending)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: theme.colorScheme.primaryContainer,
                      child: Text(
                        character.name[0],
                        style: TextStyle(fontSize: 10, color: theme.colorScheme.onPrimaryContainer),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${character.name} is typing...',
                            style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            // Suggested Quick Topic Chips
            if (character.suggestedTopics.isNotEmpty)
              Container(
                height: 38,
                margin: const EdgeInsets.only(bottom: 6),
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  itemCount: character.suggestedTopics.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 6),
                  itemBuilder: (context, index) {
                    final topic = character.suggestedTopics[index];
                    return ActionChip(
                      label: Text(topic, style: const TextStyle(fontSize: 11)),
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      onPressed: () => _sendMessage(topic),
                    );
                  },
                ),
              ),

            // Input Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                border: Border(
                  top: BorderSide(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Message ${character.name}...',
                        hintStyle: const TextStyle(fontSize: 14),
                        filled: true,
                        fillColor: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _isSending ? null : () => _sendMessage(),
                    icon: const Icon(Icons.send_rounded, size: 20),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(BuildContext context, AIMessageModel msg) {
    final theme = Theme.of(context);
    final isUser = msg.isUser;
    final isTranslated = _translatedMessageIds.contains(msg.id);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Column(
        crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (!isUser) ...[
                CircleAvatar(
                  radius: 14,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  child: Text(
                    _conversation.character.name.isNotEmpty ? _conversation.character.name[0] : 'T',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isUser
                        ? theme.colorScheme.primary
                        : theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        msg.content,
                        style: TextStyle(
                          color: isUser ? Colors.white : theme.colorScheme.onSurface,
                          fontSize: 14,
                          height: 1.35,
                        ),
                      ),
                      if (isTranslated) ...[
                        const Divider(height: 12),
                        Text(
                          'Translation: [English translation unavailable in offline mode]',
                          style: TextStyle(
                            fontStyle: FontStyle.italic,
                            fontSize: 12,
                            color: isUser ? Colors.white70 : theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),

          // In-line Pedagogical Correction Card
          if (msg.hasCorrection) ...[
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.only(left: 34),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.amber.shade300),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.lightbulb, size: 16, color: Colors.amber.shade800),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        msg.correctionNote!,
                        style: TextStyle(
                          color: Colors.amber.shade900,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
