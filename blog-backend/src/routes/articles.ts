import { Router } from 'express';
import * as articleController from '../controllers/articleController';
import { validateQuery } from '../middleware/errorHandler';
import { articlesQuerySchema, searchQuerySchema } from '../validators/schemas';

const router = Router();

router.get('/search', validateQuery(searchQuerySchema), articleController.search);
router.get('/', validateQuery(articlesQuerySchema), articleController.listPublic);
router.get('/:slug', articleController.getBySlug);

export default router;
