// ==============================================================================
// MAHMAS LANGUAGE — AI TUTOR CONTROLLER
// REST API handlers for AI characters, multi-turn chat, corrections, & debriefing
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiService } from './ai.service';
import { ApiResponse } from '../../common/types';
import { CEFRLevel } from '@prisma/client';

const startConversationSchema = z.object({
  characterId: z.string().uuid().or(z.string().min(1)),
  topic: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

const endConversationSchema = z.object({
  durationSec: z.number().int().min(0).max(86400).optional(),
});

export class AIController {
  async getCharacters(req: Request, res: Response, next: NextFunction) {
    try {
      const targetLanguage = req.query.targetLanguage as string | undefined;
      const level = req.query.level as CEFRLevel | undefined;

      const characters = await aiService.getCharacters(targetLanguage, level);

      const response: ApiResponse = {
        success: true,
        data: { characters },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getCharacterById(req: Request, res: Response, next: NextFunction) {
    try {
      const character = await aiService.getCharacterById(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: { character },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async listConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const conversations = await aiService.listUserConversations(userId);

      const response: ApiResponse = {
        success: true,
        data: { conversations },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async startConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const parsed = startConversationSchema.parse(req.body);

      const conversation = await aiService.startConversation(
        userId,
        parsed.characterId,
        parsed.topic
      );

      const response: ApiResponse = {
        success: true,
        data: { conversation },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const conversation = await aiService.getConversation(userId, req.params.id);

      const response: ApiResponse = {
        success: true,
        data: { conversation },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const parsed = sendMessageSchema.parse(req.body);

      const result = await aiService.sendMessage(
        userId,
        req.params.id,
        parsed.content
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async endConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const parsed = endConversationSchema.parse(req.body);

      const debrief = await aiService.endConversation(
        userId,
        req.params.id,
        parsed.durationSec
      );

      const response: ApiResponse = {
        success: true,
        data: { debrief },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  // ----------------------------------------------------------------------------
  // PHASE 6: AI VOICE CALLING
  // ----------------------------------------------------------------------------

  async initiateVoiceCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const parsed = z.object({
        characterId: z.string().min(1, 'characterId is required'),
        topic: z.string().optional(),
      }).parse(req.body);

      const call = await aiService.initiateVoiceCall(userId, parsed);

      const response: ApiResponse = {
        success: true,
        data: { call },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async processVoiceTurn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const callId = req.params.id;
      const parsed = z.object({
        audioBase64: z.string().optional(),
        spokenText: z.string().optional(),
        audioDurationMs: z.number().int().min(0).optional(),
      }).parse(req.body);

      const result = await aiService.processVoiceTurn(userId, callId, parsed);

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async endVoiceCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const callId = req.params.id;
      const parsed = z.object({
        durationSec: z.number().int().min(0).max(86400).optional(),
      }).parse(req.body);

      const debrief = await aiService.endVoiceCall(userId, callId, parsed);

      const response: ApiResponse = {
        success: true,
        data: { debrief },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getVoiceCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const callId = req.params.id;

      const call = await aiService.getVoiceCall(userId, callId);

      const response: ApiResponse = {
        success: true,
        data: { call },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  // ----------------------------------------------------------------------------
  // PHASE 7: AI VIDEO CALLING
  // ----------------------------------------------------------------------------

  async initiateVideoCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const parsed = z.object({
        characterId: z.string().min(1, 'characterId is required'),
        topic: z.string().optional(),
        sceneSetting: z.string().optional(),
      }).parse(req.body);

      const call = await aiService.initiateVideoCall(userId, parsed);

      const response: ApiResponse = {
        success: true,
        data: { call },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async processVideoTurn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const callId = req.params.id;
      const parsed = z.object({
        audioBase64: z.string().optional(),
        spokenText: z.string().optional(),
        audioDurationMs: z.number().int().min(0).optional(),
        requestHelpHint: z.boolean().optional(),
      }).parse(req.body);

      const result = await aiService.processVideoTurn(userId, callId, parsed);

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async endVideoCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const callId = req.params.id;
      const parsed = z.object({
        durationSec: z.number().int().min(0).max(86400).optional(),
      }).parse(req.body);

      const debrief = await aiService.endVideoCall(userId, callId, parsed);

      const response: ApiResponse = {
        success: true,
        data: { debrief },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getVideoCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const callId = req.params.id;

      const call = await aiService.getVideoCall(userId, callId);

      const response: ApiResponse = {
        success: true,
        data: { call },
        meta: { timestamp: new Date().toISOString() },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AIController();
