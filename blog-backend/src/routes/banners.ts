import { Router } from 'express';
import * as bannerController from '../controllers/bannerController';
import { validateQuery } from '../middleware/errorHandler';
import { bannersQuerySchema } from '../validators/schemas';

const router = Router();

router.get('/', validateQuery(bannersQuerySchema), bannerController.listPublic);
router.post('/:id/click', bannerController.click);

export default router;
