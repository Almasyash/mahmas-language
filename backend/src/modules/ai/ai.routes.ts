// ==============================================================================
// MAHMAS LANGUAGE — AI TUTOR ROUTES
// ==============================================================================

import { Router } from 'express';
import { authenticateToken } from '../../guards/auth.guard';
import { aiController } from './ai.controller';

const router = Router();

router.use(authenticateToken);

// Character / Persona discovery
router.get('/characters', (req, res, next) => aiController.getCharacters(req, res, next));
router.get('/characters/:id', (req, res, next) => aiController.getCharacterById(req, res, next));

// Conversations
router.get('/conversations', (req, res, next) => aiController.listConversations(req, res, next));
router.post('/conversations', (req, res, next) => aiController.startConversation(req, res, next));
router.get('/conversations/:id', (req, res, next) => aiController.getConversation(req, res, next));
router.post('/conversations/:id/messages', (req, res, next) => aiController.sendMessage(req, res, next));
router.post('/conversations/:id/end', (req, res, next) => aiController.endConversation(req, res, next));

// Live Voice Calls (Phase 6)
router.post('/calls/initiate', (req, res, next) => aiController.initiateVoiceCall(req, res, next));
router.post('/calls/:id/turn', (req, res, next) => aiController.processVoiceTurn(req, res, next));
router.post('/calls/:id/end', (req, res, next) => aiController.endVoiceCall(req, res, next));
router.get('/calls/:id', (req, res, next) => aiController.getVoiceCall(req, res, next));

// Live Video Calls (Phase 7)
router.post('/video-calls/initiate', (req, res, next) => aiController.initiateVideoCall(req, res, next));
router.post('/video-calls/:id/turn', (req, res, next) => aiController.processVideoTurn(req, res, next));
router.post('/video-calls/:id/end', (req, res, next) => aiController.endVideoCall(req, res, next));
router.get('/video-calls/:id', (req, res, next) => aiController.getVideoCall(req, res, next));

export default router;
