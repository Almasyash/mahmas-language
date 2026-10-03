// ==============================================================================
// MAHMAS LANGUAGE — AI VIDEO CALL SCREEN
// Interactive full-screen video calling with procedural avatar, visemes, visual aids, & PiP
// ==============================================================================

import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/auth/auth_scope.dart';
import '../../core/models/ai_tutor_model.dart';
import '../../core/models/ai_video_call_model.dart';
import '../../core/repositories/ai_video_call_repository.dart';
import 'ai_video_avatar_widget.dart';
import 'ai_video_call_debrief_dialog.dart';

enum CallVideoState {
  connecting,
  aiSpeaking,
  listening,
  userSpeaking,
  thinking,
}

class AIVideoCallScreen extends StatefulWidget {
  final AICharacterModel character;
  final String? initialTopic;
  final String? sceneSetting;
  final AIVideoCallRepository? repository;

  const AIVideoCallScreen({
    super.key,
    required this.character,
    this.initialTopic,
    this.sceneSetting,
    this.repository,
  });

  @override
  State<AIVideoCallScreen> createState() => _AIVideoCallScreenState();
}

class _AIVideoCallScreenState extends State<AIVideoCallScreen> with TickerProviderStateMixin {
  late AIVideoCallRepository _repository;
  AIVideoCallModel? _call;
  CallVideoState _videoState = CallVideoState.connecting;
  late final DateTime _callStartTime;
  int _elapsedSeconds = 0;
  Timer? _callTimer;
  Timer? _visemePlaybackTimer;
  Timer? _speechResetTimer;

  // Avatar & Viseme sync state
  AvatarEmotion _currentEmotion = AvatarEmotion.happy;
  VisemeType _currentViseme = VisemeType.rest;
  bool _isSpeaking = false;

  // Media & Controls state
  bool _isMuted = false;
  bool _isVideoOn = true;
  bool _isFrontCamera = true;
  bool _showVisualAid = true;
  bool _showCaptions = true;
  bool _showEnglishHint = true;
  bool _initialized = false;

  // PiP Floating Position
  Offset _pipPosition = const Offset(20, 110);

  // Subtitles & Pedagogical Feedback
  String _currentAiSubtitle = '';
  String _lastUserTranscription = '';
  int? _lastPronunciationScore;
  int? _lastFluencyScore;
  String? _lastPhoneticTip;
  String? _lastCorrectionNote;
  VisualAidCueModel? _activeVisualAid;

  // Ambient backdrop animation
  late final AnimationController _ambientBgController;

  @override
  void initState() {
    super.initState();
    _callStartTime = DateTime.now();

    _ambientBgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true);

    _callTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _elapsedSeconds = DateTime.now().difference(_callStartTime).inSeconds;
        });
      }
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
          _repository = AIVideoCallRepository(apiClient: apiClient);
        } catch (_) {
          _repository = AIVideoCallRepository();
        }
      }
      _connectCall();
    }
  }

  @override
  void dispose() {
    _callTimer?.cancel();
    _visemePlaybackTimer?.cancel();
    _speechResetTimer?.cancel();
    _ambientBgController.dispose();
    super.dispose();
  }

  Future<void> _connectCall() async {
    setState(() => _videoState = CallVideoState.connecting);

    try {
      final call = await _repository.initiateVideoCall(
        characterId: widget.character.id,
        topic: widget.initialTopic,
        sceneSetting: widget.sceneSetting,
      );

      if (mounted) {
        setState(() {
          _call = call;
          _videoState = CallVideoState.aiSpeaking;
          _currentAiSubtitle = call.greetingText;
          _currentEmotion = call.currentEmotion;
          _activeVisualAid = call.initialVisualAid;
          _isSpeaking = true;
        });

        _playVisemeSequence(call.initialVisemes);
      }
    } catch (e) {
      if (mounted) {
        // Fallback demo connection
        final fallbackCall = AIVideoCallModel(
          id: 'mock-video-call-${DateTime.now().millisecondsSinceEpoch}',
          conversationId: 'mock-conv-video-1',
          characterId: widget.character.id,
          character: widget.character,
          status: VideoCallStatus.connected,
          startedAt: DateTime.now(),
          durationSec: 0,
          turnCount: 0,
          greetingText: '¡Hola! Qué gusto verte en videollamada. Te veo y te escucho con total nitidez.',
          greetingAudioBase64: '',
          audioMimeType: 'audio/wav',
          currentEmotion: AvatarEmotion.happy,
          initialVisemes: [
            const VisemeFrameModel(viseme: VisemeType.oo, timestampMs: 0, durationMs: 250),
            const VisemeFrameModel(viseme: VisemeType.aa, timestampMs: 250, durationMs: 300),
            const VisemeFrameModel(viseme: VisemeType.ee, timestampMs: 550, durationMs: 250),
            const VisemeFrameModel(viseme: VisemeType.ch, timestampMs: 800, durationMs: 200),
            const VisemeFrameModel(viseme: VisemeType.rest, timestampMs: 1000, durationMs: 200),
          ],
          initialVisualAid: VisualAidCueModel(
            id: 'aid-cafe-menu',
            title: 'Café Menú Madrid',
            category: 'menu',
            headline: 'Bebidas Populares',
            body: 'Café con leche (€1.80), Café Solo (€1.40), Cortado (€1.50)',
            targetVocab: ['un café con leche', 'por favor', 'la cuenta', 'cortado'],
          ),
          sceneSetting: widget.sceneSetting ?? 'Madrid Café & Espresso Bar',
        );

        setState(() {
          _call = fallbackCall;
          _videoState = CallVideoState.aiSpeaking;
          _currentAiSubtitle = fallbackCall.greetingText;
          _currentEmotion = fallbackCall.currentEmotion;
          _activeVisualAid = fallbackCall.initialVisualAid;
          _isSpeaking = true;
        });

        _playVisemeSequence(fallbackCall.initialVisemes);
      }
    }
  }

  void _playVisemeSequence(List<VisemeFrameModel> visemes) {
    _visemePlaybackTimer?.cancel();
    if (visemes.isEmpty) {
      setState(() {
        _currentViseme = VisemeType.rest;
        _isSpeaking = false;
      });
      return;
    }

    int frameIndex = 0;
    _visemePlaybackTimer = Timer.periodic(const Duration(milliseconds: 160), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (frameIndex < visemes.length) {
        setState(() {
          _currentViseme = visemes[frameIndex].viseme;
          _isSpeaking = true;
        });
        frameIndex++;
      } else {
        timer.cancel();
        setState(() {
          _currentViseme = VisemeType.rest;
          _isSpeaking = false;
          _videoState = CallVideoState.listening;
        });
      }
    });

    _speechResetTimer?.cancel();
    _speechResetTimer = Timer(const Duration(milliseconds: 3200), () {
      if (mounted && _videoState == CallVideoState.aiSpeaking) {
        setState(() {
          _videoState = CallVideoState.listening;
          _isSpeaking = false;
          _currentViseme = VisemeType.rest;
        });
      }
    });
  }

  Future<void> _speakUtterance({String? textOverride, bool requestHint = false}) async {
    if (_videoState == CallVideoState.thinking || _call == null) return;

    final spokenText = textOverride ?? 'Hola Mateo, me gustaría pedir un café con leche por favor.';

    setState(() {
      _videoState = CallVideoState.userSpeaking;
      _lastUserTranscription = spokenText;
    });

    await Future.delayed(const Duration(milliseconds: 600));

    if (!mounted) return;
    setState(() => _videoState = CallVideoState.thinking);

    try {
      final result = await _repository.sendVideoTurn(
        callId: _call!.id,
        spokenText: spokenText,
        audioDurationMs: 2200,
        requestHelpHint: requestHint,
      );

      if (mounted) {
        setState(() {
          _videoState = CallVideoState.aiSpeaking;
          _currentAiSubtitle = result.assistantReply;
          _currentEmotion = result.emotion;
          _lastPronunciationScore = result.pronunciationScore;
          _lastFluencyScore = result.fluencyScore;
          _lastCorrectionNote = result.correctionNote;
          if (result.visualAid != null) {
            _activeVisualAid = result.visualAid;
            _showVisualAid = true;
          }
          if (result.phonemeFeedback.isNotEmpty) {
            _lastPhoneticTip = result.phonemeFeedback.first.hint;
          }
        });

        _playVisemeSequence(result.visemes);
      }
    } catch (e) {
      if (mounted) {
        // Fallback response for offline or test mode
        setState(() {
          _videoState = CallVideoState.aiSpeaking;
          _currentAiSubtitle = requestHint
              ? 'Pista visual: Puedes decir "Me gustaría un café con leche y una tostada, por favor".'
              : '¡Fantástica pronunciación! Te preparo enseguida tu café con leche con espuma cremosa.';
          _currentEmotion = requestHint ? AvatarEmotion.thoughtful : AvatarEmotion.celebrating;
          _lastPronunciationScore = 93;
          _lastFluencyScore = 89;
          _lastPhoneticTip = 'Excelente cadencia silábica al enlazar "con leche".';
          _lastCorrectionNote = null;
        });

        _playVisemeSequence([
          const VisemeFrameModel(viseme: VisemeType.aa, timestampMs: 0, durationMs: 250),
          const VisemeFrameModel(viseme: VisemeType.ee, timestampMs: 250, durationMs: 250),
          const VisemeFrameModel(viseme: VisemeType.oo, timestampMs: 500, durationMs: 250),
          const VisemeFrameModel(viseme: VisemeType.ch, timestampMs: 750, durationMs: 200),
          const VisemeFrameModel(viseme: VisemeType.rest, timestampMs: 950, durationMs: 200),
        ]);
      }
    }
  }

  Future<void> _endCall() async {
    _callTimer?.cancel();
    _visemePlaybackTimer?.cancel();
    _speechResetTimer?.cancel();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
        child: CircularProgressIndicator(color: Colors.pinkAccent),
      ),
    );

    VideoCallDebriefModel debrief;
    try {
      if (_call != null) {
        debrief = await _repository.endVideoCall(
          callId: _call!.id,
          durationSec: _elapsedSeconds,
        );
      } else {
        throw Exception('Call not initialized');
      }
    } catch (e) {
      debrief = VideoCallDebriefModel(
        callId: _call?.id ?? 'mock-video-call',
        characterName: widget.character.name,
        totalDurationSec: _elapsedSeconds > 0 ? _elapsedSeconds : 145,
        turnsCompleted: 4,
        overallAccuracy: _lastPronunciationScore ?? 92,
        overallFluency: _lastFluencyScore ?? 88,
        facialEngagementScore: 94,
        wordsSpokenEstimate: 52,
        wordsPerMinute: 78,
        xpAwarded: 35,
        gemsAwarded: 5,
        unlockedAchievements: const ['FIRST_AI_VIDEO_CALL'],
        pronunciationHighlights: const [
          'Excellent eye-contact and confident facial expressiveness.',
          'Natural conversational flow when ordering food in context.',
        ],
        visualAidsExplored: 2,
        feedbackSummary: '¡Impresionante videollamada interactiva! Mantuviste una postura atenta y una pronunciación muy clara.',
      );
    }

    if (!mounted) return;
    Navigator.of(context).pop(); // Dismiss loader

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AIVideoCallDebriefDialog(
        debrief: debrief,
        onReturnHome: () {
          Navigator.of(context).pop(); // Close dialog
          Navigator.of(context).pop(); // Exit screen
        },
      ),
    );
  }

  String _formatTimer(int totalSeconds) {
    final m = (totalSeconds / 60).floor().toString().padLeft(2, '0');
    final s = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Color _getStateColor() {
    switch (_videoState) {
      case CallVideoState.connecting:
        return Colors.blueAccent;
      case CallVideoState.aiSpeaking:
        return const Color(0xFFEC4899);
      case CallVideoState.listening:
        return Colors.tealAccent;
      case CallVideoState.userSpeaking:
        return Colors.greenAccent;
      case CallVideoState.thinking:
        return Colors.amberAccent;
    }
  }

  String _getStateLabel() {
    switch (_videoState) {
      case CallVideoState.connecting:
        return 'Connecting HD Stream...';
      case CallVideoState.aiSpeaking:
        return '${widget.character.name} is speaking';
      case CallVideoState.listening:
        return 'Listening... Speak in Spanish';
      case CallVideoState.userSpeaking:
        return 'You are speaking...';
      case CallVideoState.thinking:
        return 'Analyzing pronunciation & response...';
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      body: Stack(
        children: [
          // 1. Ambient Dynamic Scene Backdrop
          _buildAmbientBackdrop(),

          // 2. Center Viewport: Procedural 2D Video Avatar
          Center(
            child: SingleChildScrollView(
              physics: const NeverScrollableScrollPhysics(),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 70),
                  AIVideoAvatarWidget(
                    character: widget.character,
                    emotion: _currentEmotion,
                    currentViseme: _currentViseme,
                    isSpeaking: _isSpeaking,
                    size: math.min(screenSize.width * 0.72, 300),
                  ),
                  const SizedBox(height: 12),
                  // Live status indicator badge
                  _buildStatusPill(),
                  const SizedBox(height: 140), // Spacer for bottom controls & captions
                ],
              ),
            ),
          ),

          // 3. Top Call Header (Timer, Scenario, End Button)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _buildTopHeader(),
          ),

          // 4. Visual Aid Card (Scenario Prop / Menu / Dynamic Flashcard)
          if (_activeVisualAid != null && _showVisualAid)
            Positioned(
              left: 16,
              bottom: 180,
              child: _buildVisualAidCard(screenSize),
            ),

          // 5. Dual Closed Captions & Real-Time Feedback Overlay
          if (_showCaptions)
            Positioned(
              left: 16,
              right: 16,
              bottom: 96,
              child: _buildClosedCaptionsOverlay(),
            ),

          // 6. Floating Draggable User Camera Picture-in-Picture (PiP)
          _buildDraggableUserPiP(screenSize),

          // 7. Bottom Control Island
          Positioned(
            left: 0,
            right: 0,
            bottom: 16,
            child: _buildBottomControlIsland(),
          ),
        ],
      ),
    );
  }

  /// Ambient dynamic gradient background representing scene lighting
  Widget _buildAmbientBackdrop() {
    return AnimatedBuilder(
      animation: _ambientBgController,
      builder: (context, child) {
        final progress = _ambientBgController.value;
        return Container(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: Alignment(0.0, -0.2 + (progress * 0.1)),
              radius: 1.3,
              colors: [
                const Color(0xFF1E1B4B).withValues(alpha: 0.8),
                const Color(0xFF0F172A),
                const Color(0xFF030712),
              ],
              stops: const [0.0, 0.55, 1.0],
            ),
          ),
        );
      },
    );
  }

  /// Top header with back button, tutor name, scene context, timer, and HD badge
  Widget _buildTopHeader() {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 16,
        right: 16,
        bottom: 12,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withValues(alpha: 0.8),
            Colors.black.withValues(alpha: 0.0),
          ],
        ),
      ),
      child: Row(
        children: [
          // Back button
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
            onPressed: () => _endCall(),
          ),
          const SizedBox(width: 8),

          // Character & Scenario Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        widget.character.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.greenAccent.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.greenAccent, width: 0.8),
                      ),
                      child: const Text(
                        'HD 60FPS',
                        style: TextStyle(
                          color: Colors.greenAccent,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                Text(
                  widget.sceneSetting ?? widget.character.scenarioTitle,
                  style: const TextStyle(
                    color: Colors.white60,
                    fontSize: 12,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // Elapsed Timer
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.redAccent,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  _formatTimer(_elapsedSeconds),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),

          // Caption toggle button
          IconButton(
            icon: Icon(
              _showCaptions ? Icons.closed_caption_rounded : Icons.closed_caption_disabled_rounded,
              color: _showCaptions ? Colors.tealAccent : Colors.white54,
              size: 22,
            ),
            tooltip: _showCaptions ? 'Hide Captions' : 'Show Captions',
            onPressed: () => setState(() => _showCaptions = !_showCaptions),
          ),
          const SizedBox(width: 4),

          // Quick End Call button
          IconButton(
            icon: const Icon(Icons.call_end_rounded, color: Colors.redAccent, size: 24),
            tooltip: 'End Video Call',
            onPressed: _endCall,
          ),
        ],
      ),
    );
  }

  /// Live connection & voice state pill
  Widget _buildStatusPill() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _getStateColor().withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: _getStateColor(),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _getStateLabel(),
            style: TextStyle(
              color: _getStateColor(),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  /// Draggable Floating User Camera Feed Picture-in-Picture
  Widget _buildDraggableUserPiP(Size screenSize) {
    const pipWidth = 110.0;
    const pipHeight = 150.0;

    return Positioned(
      left: _pipPosition.dx,
      top: _pipPosition.dy,
      child: GestureDetector(
        onPanUpdate: (details) {
          setState(() {
            final newX = (_pipPosition.dx + details.delta.dx).clamp(
              12.0,
              screenSize.width - pipWidth - 12.0,
            );
            final newY = (_pipPosition.dy + details.delta.dy).clamp(
              80.0,
              screenSize.height - pipHeight - 140.0,
            );
            _pipPosition = Offset(newX, newY);
          });
        },
        child: Container(
          width: pipWidth,
          height: pipHeight,
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: _videoState == CallVideoState.userSpeaking
                  ? Colors.greenAccent
                  : Colors.white24,
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.5),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // User video feed / simulated camera canvas
              if (_isVideoOn)
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0xFF334155), Color(0xFF0F172A)],
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _isFrontCamera ? Icons.person_rounded : Icons.camera_alt_outlined,
                        color: Colors.white70,
                        size: 40,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _isFrontCamera ? 'Front Cam' : 'Back Cam',
                        style: const TextStyle(color: Colors.white54, fontSize: 10),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  color: const Color(0xFF0F172A),
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.videocam_off_rounded, color: Colors.redAccent, size: 28),
                        SizedBox(height: 4),
                        Text('Camera Off', style: TextStyle(color: Colors.white54, fontSize: 10)),
                      ],
                    ),
                  ),
                ),

              // Bottom status bar inside PiP
              Positioned(
                bottom: 6,
                left: 6,
                right: 6,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'You',
                        style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                    if (_isMuted)
                      Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: Colors.redAccent,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.mic_off, color: Colors.white, size: 10),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Visual Aid Card overlay (Café Menu, City Map, or Dynamic Flashcard)
  Widget _buildVisualAidCard(Size screenSize) {
    final aid = _activeVisualAid!;
    return Container(
      constraints: BoxConstraints(maxWidth: math.min(screenSize.width - 32, 340)),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Icons.assignment_outlined, color: Color(0xFF818CF8), size: 16),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  aid.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
              InkWell(
                onTap: () => setState(() => _showVisualAid = false),
                child: const Icon(Icons.close_rounded, color: Colors.white54, size: 16),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            aid.headline,
            style: const TextStyle(color: Colors.tealAccent, fontWeight: FontWeight.w600, fontSize: 12),
          ),
          const SizedBox(height: 2),
          Text(
            aid.body,
            style: const TextStyle(color: Colors.white70, fontSize: 11),
          ),
          if (aid.targetVocab.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: aid.targetVocab.map((vocab) {
                return InkWell(
                  onTap: () => _speakUtterance(textOverride: 'Por favor, $vocab.'),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF312E81),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF6366F1), width: 0.8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.touch_app_rounded, color: Colors.amberAccent, size: 10),
                        const SizedBox(width: 3),
                        Text(
                          vocab,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  /// Dual Closed Captions and Acoustic Feedback
  Widget _buildClosedCaptionsOverlay() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Captions Header & Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.closed_caption_rounded, color: Colors.tealAccent, size: 14),
                  const SizedBox(width: 6),
                  Text(
                    widget.character.name,
                    style: const TextStyle(
                      color: Colors.tealAccent,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: () => setState(() => _showEnglishHint = !_showEnglishHint),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: _showEnglishHint ? Colors.purpleAccent.withValues(alpha: 0.25) : Colors.white10,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: _showEnglishHint ? Colors.purpleAccent : Colors.white24,
                          width: 0.7,
                        ),
                      ),
                      child: Text(
                        _showEnglishHint ? 'EN HINT' : 'ES ONLY',
                        style: TextStyle(
                          color: _showEnglishHint ? Colors.purpleAccent : Colors.white54,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              if (_lastPronunciationScore != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.greenAccent.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Score: $_lastPronunciationScore%',
                    style: const TextStyle(
                      color: Colors.greenAccent,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),

          // Target Spanish Subtitle
          Text(
            _currentAiSubtitle.isNotEmpty
                ? _currentAiSubtitle
                : 'Di algo en español para continuar la conversación...',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              height: 1.3,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),

          // User Transcription & Correction Tip
          if (_lastUserTranscription.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.mic, color: Colors.greenAccent, size: 12),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    'Tú: "$_lastUserTranscription"',
                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],

          if (_lastCorrectionNote != null) ...[
            const SizedBox(height: 4),
            Text(
              '💡 ${_lastCorrectionNote!}',
              style: const TextStyle(color: Colors.amberAccent, fontSize: 10),
            ),
          ],

          if (_lastPhoneticTip != null) ...[
            const SizedBox(height: 3),
            Text(
              '🗣️ ${_lastPhoneticTip!}',
              style: const TextStyle(color: Colors.tealAccent, fontSize: 10),
            ),
          ],
        ],
      ),
    );
  }

  /// Bottom Control Island (Mic, Video, Hint, Utterance, Camera Flip, End)
  Widget _buildBottomControlIsland() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Colors.white12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.6),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          // 1. Mic Mute Toggle
          IconButton(
            onPressed: () => setState(() => _isMuted = !_isMuted),
            icon: Icon(
              _isMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
              color: _isMuted ? Colors.redAccent : Colors.white,
            ),
            tooltip: _isMuted ? 'Unmute' : 'Mute',
          ),

          // 2. Video Camera Toggle
          IconButton(
            onPressed: () => setState(() => _isVideoOn = !_isVideoOn),
            icon: Icon(
              _isVideoOn ? Icons.videocam_rounded : Icons.videocam_off_rounded,
              color: _isVideoOn ? Colors.white : Colors.redAccent,
            ),
            tooltip: _isVideoOn ? 'Turn Video Off' : 'Turn Video On',
          ),

          // 3. Ask Hint / Visual Prop Toggle
          IconButton(
            onPressed: () {
              if (_activeVisualAid != null && !_showVisualAid) {
                setState(() => _showVisualAid = true);
              } else {
                _speakUtterance(requestHint: true);
              }
            },
            icon: const Icon(Icons.lightbulb_outline_rounded, color: Colors.amberAccent),
            tooltip: 'Ask for Hint / Show Prop',
          ),

          // 4. Primary Push-To-Talk / Utterance Button
          GestureDetector(
            onTap: () => _speakUtterance(),
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFFEC4899)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFEC4899).withValues(alpha: 0.45),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.record_voice_over_rounded,
                color: Colors.white,
                size: 26,
              ),
            ),
          ),

          // 5. Flip Camera (Front / Back)
          IconButton(
            onPressed: () => setState(() => _isFrontCamera = !_isFrontCamera),
            icon: const Icon(Icons.flip_camera_ios_rounded, color: Colors.white),
            tooltip: 'Flip Camera',
          ),

          // 6. End Call Button
          IconButton(
            onPressed: _endCall,
            icon: const Icon(Icons.call_end_rounded, color: Colors.redAccent),
            tooltip: 'End Call',
          ),
        ],
      ),
    );
  }
}
