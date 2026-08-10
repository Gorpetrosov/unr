import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { validateBody } from '../middleware/errorHandler';
import { viewAnalyticsSchema, shareAnalyticsSchema } from '../validators/schemas';

const router = Router();

router.post('/view', validateBody(viewAnalyticsSchema), analyticsController.trackView);
router.post('/share', validateBody(shareAnalyticsSchema), analyticsController.trackShare);

export default router;
