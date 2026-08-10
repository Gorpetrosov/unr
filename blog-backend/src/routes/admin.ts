import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as articleController from '../controllers/articleController';
import * as bannerController from '../controllers/bannerController';
import * as analyticsController from '../controllers/analyticsController';
import * as categoryController from '../controllers/categoryController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/errorHandler';
import {
  loginSchema,
  refreshSchema,
  articleCreateSchema,
  articleUpdateSchema,
  bannerSchema,
  bannerUpdateSchema,
  categorySchema,
} from '../validators/schemas';

const router = Router();

router.post('/auth/login', validateBody(loginSchema), authController.login);
router.post('/auth/refresh', validateBody(refreshSchema), authController.refresh);

router.use(authenticate, requireAdmin);

router.get('/auth/me', authController.me);

router.get('/articles', articleController.listAdmin);
router.get('/articles/:id', articleController.getAdmin);
router.post('/articles', validateBody(articleCreateSchema), articleController.create);
router.put('/articles/:id', validateBody(articleUpdateSchema), articleController.update);
router.delete('/articles/:id', articleController.remove);

router.get('/banners', bannerController.listAdmin);
router.post('/banners', validateBody(bannerSchema), bannerController.create);
router.put('/banners/:id', validateBody(bannerUpdateSchema), bannerController.update);
router.delete('/banners/:id', bannerController.remove);

router.get('/categories', categoryController.list);
router.post('/categories', validateBody(categorySchema), categoryController.create);
router.put('/categories/:id', validateBody(categorySchema), categoryController.update);
router.delete('/categories/:id', categoryController.remove);

router.get('/analytics/stats', analyticsController.stats);
router.get('/analytics/views', analyticsController.views);
router.get('/analytics/shares', analyticsController.shares);

export default router;
