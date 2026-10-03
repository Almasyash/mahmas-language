import { Router } from 'express';
import { languagesController } from './languages.controller';

const router = Router();

router.get('/', (req, res, next) => languagesController.getLanguages(req, res, next));

export default router;
