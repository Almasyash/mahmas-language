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

export default router;
